import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import {
  Column,
  ColumnDef,
  SortState,
  SortDefinition,
  FilterState,
  FilterCondition,
  FilterDefinition,
  AIQueryResult,
  AISearchResult,
  AIInsight,
  InsightCategory,
  RowAgent,
  AgentResult,
  TransformationChange,
  TransformationResult,
  TableSchema,
  SmartDatatableConfig,
  DEFAULT_DATATABLE_CONFIG
} from '../models/smart-datatable.model';

@Injectable({
  providedIn: 'root'
})
export class SmartDatatableService {
  private config: SmartDatatableConfig = DEFAULT_DATATABLE_CONFIG;
  private insightsSubject = new BehaviorSubject<AIInsight[]>([]);
  public insights$ = this.insightsSubject.asObservable();

  constructor(private aiClient: AIClientService) {}

  configure(config: Partial<SmartDatatableConfig>): void {
    this.config = { ...DEFAULT_DATATABLE_CONFIG, ...config };
  }

  /**
   * Build table schema for AI context
   */
  buildSchema(data: any[], columns: Column[]): TableSchema {
    return {
      columns: columns.map(col => ({
        key: col.key,
        type: col.type || 'string',
        label: col.label || col.header || col.key,
        examples: data.slice(0, 3).map(row => row[col.key])
      })),
      rowCount: data.length,
      sampleRows: data.slice(0, 5)
    };
  }

  /**
   * Parse natural language query to filter (local parsing without AI)
   */
  parseQuery(query: string, columns: Column[]): FilterDefinition {
    const conditions: FilterCondition[] = [];
    const lowerQuery = query.toLowerCase();

    for (const col of columns) {
      const colKey = col.key.toLowerCase();
      const colLabel = (col.label || col.header || col.key).toLowerCase();

      // Parse: column > value
      const gtMatch = lowerQuery.match(new RegExp(`(${colKey}|${colLabel})\\s*>\\s*(\\d+\\.?\\d*)`, 'i'));
      if (gtMatch) {
        conditions.push({ column: col.key, operator: 'gt', value: parseFloat(gtMatch[2]) });
      }

      // Parse: column >= value
      const gteMatch = lowerQuery.match(new RegExp(`(${colKey}|${colLabel})\\s*>=\\s*(\\d+\\.?\\d*)`, 'i'));
      if (gteMatch) {
        conditions.push({ column: col.key, operator: 'gte', value: parseFloat(gteMatch[2]) });
      }

      // Parse: column < value
      const ltMatch = lowerQuery.match(new RegExp(`(${colKey}|${colLabel})\\s*<\\s*(\\d+\\.?\\d*)`, 'i'));
      if (ltMatch) {
        conditions.push({ column: col.key, operator: 'lt', value: parseFloat(ltMatch[2]) });
      }

      // Parse: column <= value
      const lteMatch = lowerQuery.match(new RegExp(`(${colKey}|${colLabel})\\s*<=\\s*(\\d+\\.?\\d*)`, 'i'));
      if (lteMatch) {
        conditions.push({ column: col.key, operator: 'lte', value: parseFloat(lteMatch[2]) });
      }

      // Parse: column = value
      const eqMatch = lowerQuery.match(new RegExp(`(${colKey}|${colLabel})\\s*=\\s*["']?([\\w\\s]+)["']?`, 'i'));
      if (eqMatch && !gtMatch && !ltMatch && !gteMatch && !lteMatch) {
        conditions.push({ column: col.key, operator: 'equals', value: eqMatch[2].trim() });
      }

      // Parse: column contains value
      const containsMatch = lowerQuery.match(new RegExp(`(${colKey}|${colLabel})\\s+contains\\s+["']?([\\w\\s]+)["']?`, 'i'));
      if (containsMatch) {
        conditions.push({ column: col.key, operator: 'contains', value: containsMatch[2].trim() });
      }
    }

    return { conditions, operator: 'AND' };
  }

  /**
   * Parse sort from natural language query
   */
  parseSortFromQuery(query: string, columns: Column[]): SortDefinition | null {
    const lowerQuery = query.toLowerCase();

    // Parse: sort by column asc/desc
    for (const col of columns) {
      const colKey = col.key.toLowerCase();
      const colLabel = (col.label || col.header || col.key).toLowerCase();

      const sortMatch = lowerQuery.match(new RegExp(`sort\\s+by\\s+(${colKey}|${colLabel})\\s*(asc|desc)?`, 'i'));
      if (sortMatch) {
        return {
          column: col.key,
          order: (sortMatch[2]?.toLowerCase() === 'desc') ? 'desc' : 'asc'
        };
      }
    }

    return null;
  }

  /**
   * Process natural language query with AI
   */
  processQuery(query: string, data: any[], columns: Column[]): Observable<AIQueryResult> {
    if (!this.config.aiQueries && !this.config.aiSearch) {
      return of({ data, explanation: 'AI queries disabled', appliedFilters: [] });
    }

    const schema = this.buildSchema(data, columns);
    const columnInfo = schema.columns.map(c => `${c.key} (${c.type})`).join(', ');
    const sampleData = JSON.stringify(schema.sampleRows.slice(0, 3));

    const prompt = `Process this data query: "${query}"

Columns: ${columnInfo}
Sample data: ${sampleData}

Respond with JSON:
{
  "filters": [{"column": "col", "operator": "equals|contains|gt|lt|gte|lte|in|between|regex", "value": "val"}],
  "sort": {"column": "col", "order": "asc|desc"} or null,
  "explanation": "What this query does"
}`;

    return this.aiClient.ask(prompt).pipe(
      map(response => this.applyQueryResult(response as string, data)),
      catchError(() => {
        // Fallback to local parsing
        const filter = this.parseQuery(query, columns);
        const sort = this.parseSortFromQuery(query, columns);
        let result = this.applyFilter(data, filter);
        if (sort) {
          result = this.sortDataByDefinition(result, sort);
        }
        return of({
          data: result,
          explanation: `Found ${result.length} results`,
          appliedFilters: filter.conditions as FilterState[],
          appliedSort: sort ? { column: sort.column, direction: sort.order } : undefined
        });
      })
    );
  }

  /**
   * Apply filter to data
   */
  applyFilter(data: any[], filter: FilterDefinition): any[] {
    if (!filter || !filter.conditions || filter.conditions.length === 0) {
      return data;
    }

    return data.filter(row => {
      const results = filter.conditions.map(condition => {
        const value = row[condition.column];

        switch (condition.operator) {
          case 'equals':
            return String(value).toLowerCase() === String(condition.value).toLowerCase();

          case 'contains':
            return String(value).toLowerCase().includes(String(condition.value).toLowerCase());

          case 'gt':
            return Number(value) > Number(condition.value);

          case 'lt':
            return Number(value) < Number(condition.value);

          case 'gte':
            return Number(value) >= Number(condition.value);

          case 'lte':
            return Number(value) <= Number(condition.value);

          case 'in':
            return Array.isArray(condition.value) && condition.value.includes(value);

          case 'between':
            return Array.isArray(condition.value) &&
                   Number(value) >= Number(condition.value[0]) &&
                   Number(value) <= Number(condition.value[1]);

          case 'regex':
            try {
              return new RegExp(condition.value, 'i').test(String(value));
            } catch {
              return false;
            }

          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(condition.value).toLowerCase());

          case 'endsWith':
            return String(value).toLowerCase().endsWith(String(condition.value).toLowerCase());

          default:
            return true;
        }
      });

      // Apply AND/OR operator
      return filter.operator === 'OR'
        ? results.some(r => r)
        : results.every(r => r);
    });
  }

  /**
   * Sort data by column (legacy method)
   */
  sortData(data: any[], sortState: SortState): any[] {
    return this.sortDataByDefinition(data, {
      column: sortState.column,
      order: sortState.direction
    });
  }

  /**
   * Sort data by definition
   */
  sortDataByDefinition(data: any[], sort: SortDefinition): any[] {
    return [...data].sort((a, b) => {
      const aVal = a[sort.column];
      const bVal = b[sort.column];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.order === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const comparison = String(aVal).localeCompare(String(bVal));
      return sort.order === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Paginate data
   */
  paginateData(data: any[], page: number, pageSize: number): any[] {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }

  /**
   * Apply AI query result to data
   */
  private applyQueryResult(response: string, data: any[]): AIQueryResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { data, explanation: 'Could not parse AI response', appliedFilters: [] };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      let result = data;
      const appliedFilters: FilterState[] = [];

      if (parsed.filters && Array.isArray(parsed.filters)) {
        const filter: FilterDefinition = {
          conditions: parsed.filters,
          operator: 'AND'
        };
        result = this.applyFilter(result, filter);
        appliedFilters.push(...parsed.filters);
      }

      if (parsed.sort) {
        result = this.sortDataByDefinition(result, parsed.sort);
      }

      return {
        data: result,
        explanation: parsed.explanation || `Found ${result.length} results`,
        appliedFilters,
        appliedSort: parsed.sort ? { column: parsed.sort.column, direction: parsed.sort.order } : undefined
      };
    } catch {
      return { data, explanation: 'Error processing query', appliedFilters: [] };
    }
  }



  // ============ AI Insights ============

  /**
   * Generate AI insights from data
   */
  generateInsights(
    data: any[],
    columns: Column[],
    categories: InsightCategory[] = ['trends', 'outliers', 'patterns', 'recommendations']
  ): Observable<AIInsight[]> {
    const schema = this.buildSchema(data, columns);

    const prompt = `Analyze this dataset and provide insights.

Columns: ${schema.columns.map(c => `${c.key} (${c.type})`).join(', ')}
Total rows: ${schema.rowCount}
Sample data: ${JSON.stringify(schema.sampleRows, null, 2)}

Provide insights in these categories: ${categories.join(', ')}.

Return a JSON array:
[
  {
    "category": "trends|outliers|patterns|recommendations|summary|predictions",
    "title": "Short title",
    "description": "Detailed description",
    "confidence": 0.85
  }
]`;

    return this.aiClient.ask(prompt).pipe(
      map(response => {
        const responseStr = response as string;
        const jsonMatch = responseStr.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return [];

        const parsed = JSON.parse(jsonMatch[0]);
        const insights: AIInsight[] = parsed.map((item: any, index: number) => ({
          id: `insight-${Date.now()}-${index}`,
          category: item.category as InsightCategory,
          title: item.title,
          description: item.description,
          confidence: item.confidence || 0.7,
          data: item.data
        }));

        this.insightsSubject.next(insights);
        return insights;
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Get quick data summary
   */
  getSummary(data: any[], columns: Column[]): Observable<string> {
    const schema = this.buildSchema(data, columns);

    const prompt = `Provide a brief 2-3 sentence summary of this dataset:
${JSON.stringify(schema.sampleRows.slice(0, 3), null, 2)}
Total rows: ${schema.rowCount}`;

    return this.aiClient.ask(prompt).pipe(
      map(response => (response as string).trim()),
      catchError(() => of(`Dataset contains ${data.length} rows with ${columns.length} columns.`))
    );
  }

  // ============ Row Agents ============

  /**
   * Interpolate template with row data
   */
  private interpolatePrompt(template: string, data: any): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = path.split('.').reduce((obj: any, key: string) => obj?.[key], data);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Execute AI agent on a single row
   */
  executeAgent(agent: RowAgent, row: any): Observable<AgentResult> {
    const prompt = this.interpolatePrompt(agent.promptTemplate, row);

    const systemPrompt = `You are an AI assistant analyzing data in a table.
Provide clear, concise, and actionable responses.`;

    return this.aiClient.ask(`${systemPrompt}\n\n${prompt}`).pipe(
      map(response => {
        const responseStr = (response as string).trim();
        const result: AgentResult = {
          agentId: agent.id,
          rowId: row.id || row,
          result: responseStr,
          timestamp: new Date()
        };

        if (agent.handler) {
          agent.handler(row, responseStr);
        }

        return result;
      }),
      catchError(() => of({
        agentId: agent.id,
        rowId: row.id || row,
        result: 'Error executing agent',
        timestamp: new Date()
      }))
    );
  }

  /**
   * Execute AI agent on multiple rows
   */
  executeAgentBatch(agent: RowAgent, rows: any[]): Observable<AgentResult[]> {
    const results$ = rows.map(row => this.executeAgent(agent, row));
    return new Observable(subscriber => {
      const results: AgentResult[] = [];
      let completed = 0;

      results$.forEach((result$, index) => {
        result$.subscribe({
          next: (result) => {
            results[index] = result;
            completed++;
            if (completed === rows.length) {
              subscriber.next(results);
              subscriber.complete();
            }
          },
          error: () => {
            completed++;
            if (completed === rows.length) {
              subscriber.next(results);
              subscriber.complete();
            }
          }
        });
      });
    });
  }

  // ============ AI Data Transformations ============

  /**
   * Transform column values using AI
   */
  transformColumn(
    data: any[],
    columnKey: string,
    transformPrompt: string
  ): Observable<TransformationResult> {
    const values = data.map(row => row[columnKey]);
    const uniqueValues = [...new Set(values)].slice(0, 50);

    const prompt = `Transform these column values.

Column: ${columnKey}
Unique values: ${uniqueValues.join(', ')}

Task: ${transformPrompt}

Return a JSON object mapping old values to new values:
{
  "oldValue1": "newValue1",
  "oldValue2": "newValue2"
}`;

    return this.aiClient.ask(prompt).pipe(
      map(response => {
        const responseStr = response as string;
        const jsonMatch = responseStr.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          return { transformationId: '', changes: [], affectedRows: 0 };
        }

        const mapping = JSON.parse(jsonMatch[0]);
        const changes: TransformationChange[] = [];

        data.forEach((row, index) => {
          const oldValue = row[columnKey];
          const newValue = mapping[oldValue];

          if (newValue !== undefined && newValue !== oldValue) {
            changes.push({ rowIndex: index, column: columnKey, oldValue, newValue });
          }
        });

        return {
          transformationId: `transform-${Date.now()}`,
          changes,
          affectedRows: changes.length,
          preview: true
        };
      }),
      catchError(() => of({ transformationId: '', changes: [], affectedRows: 0 }))
    );
  }

  /**
   * Transform a single row using AI
   */
  transformRow(
    row: any,
    rowIndex: number,
    transformPrompt: string
  ): Observable<TransformationChange[]> {
    const prompt = `Transform this row data.

Row data: ${JSON.stringify(row)}

Task: ${transformPrompt}

Return a JSON object with the transformed values.`;

    return this.aiClient.ask(prompt).pipe(
      map(response => {
        const responseStr = response as string;
        const jsonMatch = responseStr.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return [];

        const transformed = JSON.parse(jsonMatch[0]);
        const changes: TransformationChange[] = [];

        Object.keys(transformed).forEach(key => {
          if (row[key] !== transformed[key]) {
            changes.push({
              rowIndex,
              column: key,
              oldValue: row[key],
              newValue: transformed[key]
            });
          }
        });

        return changes;
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Apply transformation changes to data
   */
  applyTransformationChanges(data: any[], changes: TransformationChange[]): any[] {
    const newData = JSON.parse(JSON.stringify(data)); // Deep clone

    changes.forEach(change => {
      if (newData[change.rowIndex]) {
        newData[change.rowIndex][change.column] = change.newValue;
      }
    });

    return newData;
  }

  // ============ Export Methods ============

  /**
   * Export data to CSV
   */
  exportToCSV(data: any[], columns: Column[], filename = 'data.csv'): void {
    if (data.length === 0) return;

    const visibleColumns = columns.filter(col => col.visible !== false);
    const headers = visibleColumns.map(col => col.label || col.header || col.key).join(',');

    const rows = data.map(row =>
      visibleColumns.map(col => {
        const value = row[col.key];
        const formatted = col.formatter ? col.formatter(value, row) : value;
        const strValue = String(formatted ?? '');
        return strValue.includes(',') || strValue.includes('"')
          ? `"${strValue.replace(/"/g, '""')}"`
          : strValue;
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Export data to JSON
   */
  exportToJSON(data: any[], filename = 'data.json'): void {
    const json = JSON.stringify(data, null, 2);
    this.downloadFile(json, filename, 'application/json');
  }

  /**
   * Export data to Excel-compatible format (TSV)
   */
  exportToExcel(data: any[], columns: Column[], filename = 'data.xls'): void {
    if (data.length === 0) return;

    const visibleColumns = columns.filter(col => col.visible !== false);
    const headers = visibleColumns.map(col => col.label || col.header || col.key).join('\t');

    const rows = data.map(row =>
      visibleColumns.map(col => {
        const value = row[col.key];
        const formatted = col.formatter ? col.formatter(value, row) : value;
        return String(formatted ?? '').replace(/\t/g, ' ');
      }).join('\t')
    );

    const content = [headers, ...rows].join('\n');
    this.downloadFile(content, filename, 'application/vnd.ms-excel');
  }

  /**
   * Download file helper
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
