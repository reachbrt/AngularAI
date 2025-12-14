import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SmartFormComponent, FieldSchema } from '@angularai/smartform';
import { APIKeyWarningComponent } from '../../components/api-key-warning/api-key-warning.component';
import { APIKeyService } from '../../services/api-key.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-demo-smartform',
  standalone: true,
  imports: [CommonModule, RouterLink, SmartFormComponent, APIKeyWarningComponent],
  templateUrl: './demo-smartform.component.html',
  styleUrl: './demo-smartform.component.scss'
})
export class DemoSmartformComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  hasAPIKey = false;

  formSchema: FieldSchema[] = [
    { name: 'name', label: 'Full Name', type: 'text', required: true },
    { name: 'email', label: 'Email Address', type: 'email', required: true },
    { name: 'phone', label: 'Phone Number', type: 'tel' },
    { name: 'message', label: 'Message', type: 'textarea', required: true }
  ];

  formData: Record<string, any> = {};

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

  onFormSubmit(data: Record<string, any>): void {
    console.log('Form submitted:', data);
    this.formData = data;
  }
}

