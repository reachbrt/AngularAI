import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SmartDatatableService } from '../../services/smart-datatable.service';
import {
  Column,
  ColumnDef,
  SortState,
  AIInsight,
  RowAgent,
  AgentResult,
  ChatMessage,
  SmartDatatableConfig,
  DEFAULT_DATATABLE_CONFIG
} from '../../models/smart-datatable.model';

@Component({
  selector: 'ai-smart-datatable',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './smart-datatable.component.html',
  styleUrl: './smart-datatable.component.scss'
})
export class SmartDatatableComponent implements OnInit, OnChanges {
  // Data inputs
  @Input() data: any[] = [];
  @Input() columns: ColumnDef[] = [];
  @Input() title = '';
  @Input() theme: 'light' | 'dark' = 'light';

  // Feature toggles
  @Input() pageSize = DEFAULT_DATATABLE_CONFIG.pageSize!;
  @Input() pageSizeOptions = DEFAULT_DATATABLE_CONFIG.pageSizeOptions!;
  @Input() aiSearch = DEFAULT_DATATABLE_CONFIG.aiSearch!;
  @Input() aiQueries = DEFAULT_DATATABLE_CONFIG.aiQueries!; // Legacy alias
  @Input() aiInsights = DEFAULT_DATATABLE_CONFIG.aiInsights!;
  @Input() exportable = DEFAULT_DATATABLE_CONFIG.exportable!;
  @Input() selectable = DEFAULT_DATATABLE_CONFIG.selectable!;
  @Input() rowKey = DEFAULT_DATATABLE_CONFIG.rowKey!;

  // Row agents
  @Input() rowAgents: RowAgent[] = [];

  // Outputs
  @Output() rowClick = new EventEmitter<any>();
  @Output() rowSelect = new EventEmitter<any[]>();
  @Output() queryApplied = new EventEmitter<string>();
  @Output() insightsGenerated = new EventEmitter<AIInsight[]>();
  @Output() agentExecuted = new EventEmitter<AgentResult>();

  // State
  displayData: any[] = [];
  filteredData: any[] = [];
  currentPage = 1;
  totalPages = 1;
  sortState: SortState | null = null;
  aiQuery = '';
  aiExplanation = '';
  isQuerying = false;

  // Selection
  selectedRows: Set<any> = new Set();
  selectAll = false;

  // Insights
  insights: AIInsight[] = [];
  showInsightsPanel = false;
  isLoadingInsights = false;

  // Chat Window
  showChatWindow = false;
  chatMessages: ChatMessage[] = [];
  chatInput = '';
  isChatProcessing = false;

  constructor(private datatableService: SmartDatatableService) {}

  ngOnInit(): void {
    this.datatableService.configure({
      aiQueries: this.aiQueries,
      aiSearch: this.aiSearch,
      aiInsights: this.aiInsights
    });
    this.initializeColumns();
    this.updateDisplay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.filteredData = [...this.data];
      this.updateDisplay();
    }
    if (changes['columns']) {
      this.initializeColumns();
    }
  }

  private initializeColumns(): void {
    // Auto-generate columns if not provided
    if (this.columns.length === 0 && this.data.length > 0) {
      this.columns = Object.keys(this.data[0]).map(key => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        header: key.charAt(0).toUpperCase() + key.slice(1),
        type: typeof this.data[0][key] === 'number' ? 'number' : 'string',
        sortable: true,
        visible: true
      }));
    }
  }

  updateDisplay(): void {
    let result = this.filteredData.length > 0 ? [...this.filteredData] : [...this.data];

    if (this.sortState) {
      result = this.datatableService.sortData(result, this.sortState);
    }

    this.totalPages = Math.ceil(result.length / this.pageSize) || 1;
    this.displayData = this.datatableService.paginateData(result, this.currentPage, this.pageSize);
  }

  // ============ Sorting ============
  sort(column: ColumnDef): void {
    if (!column.sortable) return;

    if (this.sortState?.column === column.key) {
      this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortState = { column: column.key, direction: 'asc' };
    }

    this.currentPage = 1;
    this.updateDisplay();
  }

  getSortIcon(column: ColumnDef): string {
    if (!column.sortable) return '';
    if (this.sortState?.column !== column.key) return '↕️';
    return this.sortState.direction === 'asc' ? '⬆️' : '⬇️';
  }

  // ============ Pagination ============
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplay();
    }
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.updateDisplay();
  }

  // ============ Row Interaction ============
  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  // ============ Selection ============
  toggleRowSelection(row: any, event: Event): void {
    event.stopPropagation();
    const rowId = row[this.rowKey] || row;

    if (this.selectedRows.has(rowId)) {
      this.selectedRows.delete(rowId);
    } else {
      this.selectedRows.add(rowId);
    }

    this.rowSelect.emit(this.getSelectedRowsData());
  }

  toggleSelectAll(): void {
    if (this.selectAll) {
      this.displayData.forEach(row => {
        const rowId = row[this.rowKey] || row;
        this.selectedRows.add(rowId);
      });
    } else {
      this.selectedRows.clear();
    }
    this.rowSelect.emit(this.getSelectedRowsData());
  }

  isRowSelected(row: any): boolean {
    const rowId = row[this.rowKey] || row;
    return this.selectedRows.has(rowId);
  }

  getSelectedRowsData(): any[] {
    return this.data.filter(row => {
      const rowId = row[this.rowKey] || row;
      return this.selectedRows.has(rowId);
    });
  }

  // ============ AI Query ============
  submitQuery(): void {
    if (!this.aiQuery.trim()) return;

    this.isQuerying = true;
    this.datatableService.processQuery(this.aiQuery, this.data, this.columns as Column[])
      .subscribe(result => {
        this.filteredData = result.data;
        this.totalPages = Math.ceil(result.data.length / this.pageSize) || 1;
        this.currentPage = 1;
        this.aiExplanation = result.explanation;
        this.isQuerying = false;
        this.updateDisplay();
        this.queryApplied.emit(this.aiQuery);
      });
  }

  clearQuery(): void {
    this.aiQuery = '';
    this.aiExplanation = '';
    this.filteredData = [...this.data];
    this.currentPage = 1;
    this.updateDisplay();
  }

  // ============ AI Insights ============
  generateInsights(): void {
    if (this.isLoadingInsights) return;

    this.isLoadingInsights = true;
    this.showInsightsPanel = true;

    this.datatableService.generateInsights(this.data, this.columns as Column[])
      .subscribe(insights => {
        this.insights = insights;
        this.isLoadingInsights = false;
        this.insightsGenerated.emit(insights);
      });
  }

  closeInsightsPanel(): void {
    this.showInsightsPanel = false;
  }

  // ============ Row Agents ============
  executeRowAgent(agent: RowAgent, row: any): void {
    this.datatableService.executeAgent(agent, row)
      .subscribe(result => {
        this.agentExecuted.emit(result);
      });
  }

  // ============ Export ============
  exportCSV(): void {
    this.datatableService.exportToCSV(this.filteredData.length > 0 ? this.filteredData : this.data, this.columns as Column[]);
  }

  exportJSON(): void {
    this.datatableService.exportToJSON(this.filteredData.length > 0 ? this.filteredData : this.data);
  }

  exportExcel(): void {
    this.datatableService.exportToExcel(this.filteredData.length > 0 ? this.filteredData : this.data, this.columns as Column[]);
  }

  // ============ Cell Formatting ============
  getCellValue(row: any, column: ColumnDef): string {
    const value = row[column.key];
    if (column.formatter) {
      return column.formatter(value, row);
    }
    if (column.type === 'number' && typeof value === 'number') {
      return value.toLocaleString();
    }
    if (column.type === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }
    return value ?? '';
  }

  // ============ Visible Columns ============
  get visibleColumns(): ColumnDef[] {
    return this.columns.filter(col => col.visible !== false);
  }

  get totalItems(): number {
    return this.filteredData.length > 0 ? this.filteredData.length : this.data.length;
  }

  // ============ Chat Window ============
  toggleChatWindow(): void {
    this.showChatWindow = !this.showChatWindow;
    if (this.showChatWindow && this.chatMessages.length === 0) {
      // Add welcome message
      this.chatMessages.push({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Hi! I can help you filter and explore this data using natural language. Try asking things like:\n\n• "Show me orders from last month"\n• "Filter where total > 500"\n• "Find customers from India"\n• "Sort by date descending"`,
        timestamp: new Date()
      });
    }
  }

  sendChatMessage(): void {
    if (!this.chatInput.trim() || this.isChatProcessing) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: this.chatInput.trim(),
      timestamp: new Date()
    };
    this.chatMessages.push(userMessage);
    const query = this.chatInput.trim();
    this.chatInput = '';
    this.isChatProcessing = true;

    // Process the query
    this.datatableService.processQuery(query, this.data, this.columns as Column[])
      .subscribe({
        next: (result) => {
          this.filteredData = result.data;
          this.totalPages = Math.ceil(result.data.length / this.pageSize) || 1;
          this.currentPage = 1;
          this.updateDisplay();

          // Add assistant response
          const assistantMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: result.explanation || `Found ${result.data.length} results.`,
            timestamp: new Date(),
            filterApplied: true,
            resultCount: result.data.length
          };
          this.chatMessages.push(assistantMessage);
          this.isChatProcessing = false;
          this.queryApplied.emit(query);
        },
        error: () => {
          this.chatMessages.push({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: 'Sorry, I had trouble understanding that. Could you try rephrasing?',
            timestamp: new Date()
          });
          this.isChatProcessing = false;
        }
      });
  }

  clearChatFilters(): void {
    this.filteredData = [...this.data];
    this.currentPage = 1;
    this.updateDisplay();

    this.chatMessages.push({
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `Filters cleared. Showing all ${this.data.length} items.`,
      timestamp: new Date(),
      filterApplied: true,
      resultCount: this.data.length
    });
  }

  closeChatWindow(): void {
    this.showChatWindow = false;
  }
}
