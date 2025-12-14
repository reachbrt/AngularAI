import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SmartDatatableService } from '../../services/smart-datatable.service';
import { 
  ColumnDef, 
  SortState, 
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
  @Input() data: any[] = [];
  @Input() columns: ColumnDef[] = [];
  @Input() pageSize = DEFAULT_DATATABLE_CONFIG.pageSize!;
  @Input() aiQueries = DEFAULT_DATATABLE_CONFIG.aiQueries!;
  @Input() exportable = DEFAULT_DATATABLE_CONFIG.exportable!;

  @Output() rowClick = new EventEmitter<any>();
  @Output() queryApplied = new EventEmitter<string>();

  displayData: any[] = [];
  currentPage = 1;
  totalPages = 1;
  sortState: SortState | null = null;
  aiQuery = '';
  aiExplanation = '';
  isQuerying = false;

  constructor(private datatableService: SmartDatatableService) {}

  ngOnInit(): void {
    this.datatableService.configure({ aiQueries: this.aiQueries });
    this.updateDisplay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.updateDisplay();
    }
  }

  updateDisplay(): void {
    let result = [...this.data];

    if (this.sortState) {
      result = this.datatableService.sortData(result, this.sortState);
    }

    this.totalPages = Math.ceil(result.length / this.pageSize);
    this.displayData = this.datatableService.paginateData(result, this.currentPage, this.pageSize);
  }

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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplay();
    }
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  submitQuery(): void {
    if (!this.aiQuery.trim()) return;

    this.isQuerying = true;
    this.datatableService.processQuery(this.aiQuery, this.data, this.columns)
      .subscribe(result => {
        this.displayData = this.datatableService.paginateData(result.data, 1, this.pageSize);
        this.totalPages = Math.ceil(result.data.length / this.pageSize);
        this.currentPage = 1;
        this.aiExplanation = result.explanation;
        this.isQuerying = false;
        this.queryApplied.emit(this.aiQuery);
      });
  }

  clearQuery(): void {
    this.aiQuery = '';
    this.aiExplanation = '';
    this.updateDisplay();
  }

  export(): void {
    this.datatableService.exportToCSV(this.data, this.columns);
  }

  getCellValue(row: any, column: ColumnDef): string {
    const value = row[column.key];
    if (column.formatter) {
      return column.formatter(value, row);
    }
    return value ?? '';
  }

  getSortIcon(column: ColumnDef): string {
    if (!column.sortable) return '';
    if (this.sortState?.column !== column.key) return '↕️';
    return this.sortState.direction === 'asc' ? '⬆️' : '⬇️';
  }
}

