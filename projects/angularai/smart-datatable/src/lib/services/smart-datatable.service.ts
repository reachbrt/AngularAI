import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import { 
  ColumnDef, 
  SortState, 
  FilterState, 
  AIQueryResult,
  SmartDatatableConfig,
  DEFAULT_DATATABLE_CONFIG 
} from '../models/smart-datatable.model';

@Injectable({
  providedIn: 'root'
})
export class SmartDatatableService {
  private config: SmartDatatableConfig = DEFAULT_DATATABLE_CONFIG;

  constructor(private aiClient: AIClientService) {}

  configure(config: Partial<SmartDatatableConfig>): void {
    this.config = { ...DEFAULT_DATATABLE_CONFIG, ...config };
  }

  /**
   * Process natural language query
   */
  processQuery(query: string, data: any[], columns: ColumnDef[]): Observable<AIQueryResult> {
    if (!this.config.aiQueries) {
      return of({ data, explanation: 'AI queries disabled', appliedFilters: [] });
    }

    const columnInfo = columns.map(c => `${c.key} (${c.type || 'text'})`).join(', ');
    const sampleData = JSON.stringify(data.slice(0, 3));

    const prompt = `Process this data query: "${query}"

Columns: ${columnInfo}
Sample data: ${sampleData}

Respond with JSON:
{
  "filters": [{"column": "col", "value": "val", "operator": "contains|equals|gt|lt"}],
  "sort": {"column": "col", "direction": "asc|desc"} or null,
  "explanation": "What this query does"
}`;

    return this.aiClient.ask(prompt).pipe(
      map(response => this.applyQueryResult(response, data)),
      catchError(() => of({ data, explanation: 'Query failed', appliedFilters: [] }))
    );
  }

  /**
   * Sort data
   */
  sortData(data: any[], sort: SortState): any[] {
    return [...data].sort((a, b) => {
      const aVal = a[sort.column];
      const bVal = b[sort.column];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Filter data
   */
  filterData(data: any[], filters: FilterState[]): any[] {
    return data.filter(row => {
      return filters.every(filter => {
        const value = String(row[filter.column] || '').toLowerCase();
        const filterValue = filter.value.toLowerCase();

        switch (filter.operator) {
          case 'contains': return value.includes(filterValue);
          case 'equals': return value === filterValue;
          case 'startsWith': return value.startsWith(filterValue);
          case 'endsWith': return value.endsWith(filterValue);
          case 'gt': return parseFloat(value) > parseFloat(filterValue);
          case 'lt': return parseFloat(value) < parseFloat(filterValue);
          default: return true;
        }
      });
    });
  }

  /**
   * Paginate data
   */
  paginateData(data: any[], page: number, pageSize: number): any[] {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }

  /**
   * Export to CSV
   */
  exportToCSV(data: any[], columns: ColumnDef[], filename = 'export.csv'): void {
    const headers = columns.map(c => c.header).join(',');
    const rows = data.map(row => 
      columns.map(c => `"${row[c.key] || ''}"`).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private applyQueryResult(response: string, data: any[]): AIQueryResult {
    try {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        let result = data;

        if (parsed.filters?.length) {
          result = this.filterData(result, parsed.filters);
        }

        if (parsed.sort) {
          result = this.sortData(result, parsed.sort);
        }

        return {
          data: result,
          explanation: parsed.explanation || 'Query applied',
          appliedFilters: parsed.filters || [],
          appliedSort: parsed.sort
        };
      }
    } catch {}

    return { data, explanation: 'Could not parse query', appliedFilters: [] };
  }
}

