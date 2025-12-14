import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'ai-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.scss'
})
export class ChatInputComponent {
  @Input() placeholder = 'Type a message...';
  @Input() disabled = false;

  @Output() send = new EventEmitter<string>();

  @ViewChild('inputField') inputField?: ElementRef<HTMLInputElement>;

  inputValue = '';

  onSubmit(): void {
    if (!this.inputValue.trim() || this.disabled) return;

    this.send.emit(this.inputValue.trim());
    this.inputValue = '';
    
    // Focus input after sending
    setTimeout(() => {
      this.inputField?.nativeElement.focus();
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }
}

