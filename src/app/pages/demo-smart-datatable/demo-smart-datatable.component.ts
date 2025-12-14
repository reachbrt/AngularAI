import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SmartDatatableComponent, ColumnDef } from '@angularai/smart-datatable';
import { APIKeyWarningComponent } from '../../components/api-key-warning/api-key-warning.component';
import { APIKeyService } from '../../services/api-key.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-demo-smart-datatable',
  standalone: true,
  imports: [CommonModule, RouterLink, SmartDatatableComponent, APIKeyWarningComponent],
  templateUrl: './demo-smart-datatable.component.html',
  styleUrl: './demo-smart-datatable.component.scss'
})
export class DemoSmartDatatableComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  hasAPIKey = false;

  constructor(private apiKeyService: APIKeyService) {}

  ngOnInit(): void {
    this.apiKeyService.keys$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.hasAPIKey = this.apiKeyService.hasKeyForSelectedProvider();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  columns: ColumnDef[] = [
    { key: 'id', header: 'ID', type: 'number', sortable: true, width: '80px' },
    { key: 'name', header: 'Name', type: 'text', sortable: true, filterable: true },
    { key: 'email', header: 'Email', type: 'text', sortable: true },
    { key: 'role', header: 'Role', type: 'text', sortable: true },
    { key: 'status', header: 'Status', type: 'text', sortable: true }
  ];

  data = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Manager', status: 'Active' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'User', status: 'Active' },
    { id: 6, name: 'Diana Lee', email: 'diana@example.com', role: 'Admin', status: 'Active' },
    { id: 7, name: 'Edward Kim', email: 'edward@example.com', role: 'User', status: 'Inactive' },
    { id: 8, name: 'Fiona Chen', email: 'fiona@example.com', role: 'Manager', status: 'Active' },
    { id: 9, name: 'George Wang', email: 'george@example.com', role: 'User', status: 'Active' },
    { id: 10, name: 'Helen Liu', email: 'helen@example.com', role: 'User', status: 'Active' },
    { id: 11, name: 'Ivan Park', email: 'ivan@example.com', role: 'Admin', status: 'Inactive' },
    { id: 12, name: 'Julia Martinez', email: 'julia@example.com', role: 'User', status: 'Active' }
  ];

  onRowClick(row: any): void {
    console.log('Row clicked:', row);
  }
}

