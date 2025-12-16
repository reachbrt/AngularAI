import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../models/chat.model';

@Component({
  selector: 'ai-chat-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss'
})
export class ChatMessageComponent {
  @Input({ required: true }) message!: ChatMessage;
  @Input() showTimestamp = true;
  @Input() showAvatar = true;
  @Input() enableMarkdown = true;

  get isUser(): boolean {
    return this.message.role === 'user';
  }

  get isAssistant(): boolean {
    return this.message.role === 'assistant';
  }

  get formattedTime(): string {
    return this.message.timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  get roleLabel(): string {
    return this.isUser ? 'You' : 'AI';
  }

  get avatarEmoji(): string {
    return this.isUser ? '👤' : '🤖';
  }

  get formattedContent(): string {
    if (!this.enableMarkdown) {
      return this.message.content;
    }
    // Simple markdown: bold, italic, code
    return this.message.content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }
}

