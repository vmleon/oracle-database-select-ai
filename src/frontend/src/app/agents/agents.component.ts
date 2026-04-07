import { Component, signal, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectAiService } from '../select-ai.service';
import { MarkdownPipe } from '../markdown.pipe';

interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  timeInMillis?: number;
}

@Component({
  selector: 'app-agents',
  imports: [FormsModule, MarkdownPipe],
  template: `
    <div class="chat-header">
      <div>
        <h2 class="page-title">Select AI Agents</h2>
        <p class="subtitle">AI agent with NL2SQL tool — autonomously reasons and queries the HR schema.</p>
      </div>
      @if (messages().length > 0) {
        <button class="new-conversation" (click)="newConversation()">New Conversation</button>
      }
    </div>

    @if (messages().length === 0 && !loading()) {
      <div class="examples">
        <span>Try: </span>
        @for (ex of examples; track ex) {
          <button class="example-btn" (click)="sendPrompt(ex)">{{ ex }}</button>
        }
      </div>
    }

    <div class="chat-thread" #chatThread>
      @for (msg of messages(); track $index) {
        <div class="message" [class]="msg.role">
          <div class="bubble">
            <span [innerHTML]="msg.content | markdown"></span>
            @if (msg.timeInMillis) {
              <span class="timing">{{ msg.timeInMillis }}ms</span>
            }
          </div>
        </div>
      }
      @if (loading()) {
        <div class="message agent">
          <div class="bubble thinking">Thinking...</div>
        </div>
      }
    </div>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    <div class="input-row">
      <textarea
        [(ngModel)]="prompt"
        rows="2"
        placeholder="Ask a follow-up question..."
        (keydown.enter)="onEnter($event)"
      ></textarea>
      <button (click)="submit()" [disabled]="!prompt.trim() || loading()">
        {{ loading() ? 'Sending...' : 'Send' }}
      </button>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .new-conversation {
      background: transparent;
      border: 1px solid #3C3835;
      color: #9B9590;
      font-size: 0.8rem;
      padding: 0.4rem 0.75rem;
    }
    .new-conversation:hover { border-color: #7A7470; color: #F1EFED; }
    .chat-thread {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding: 0.5rem 0;
    }
    .message { display: flex; }
    .message.user { justify-content: flex-end; }
    .message.agent { justify-content: flex-start; }
    .bubble {
      max-width: 75%;
      padding: 0.6rem 0.9rem;
      border-radius: 12px;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .message.user .bubble {
      background: #C74634;
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .message.agent .bubble {
      background: #2C2723;
      border: 1px solid #3C3835;
      color: #D5D0CC;
      border-bottom-left-radius: 4px;
    }
    .bubble .timing {
      display: block;
      font-size: 0.75rem;
      color: #7A7470;
      margin-top: 0.3rem;
    }
    .thinking { color: #9B9590; font-style: italic; }
    .examples { margin-top: 0.75rem; display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    .examples span { color: #7A7470; font-size: 0.85rem; }
    .example-btn {
      font-size: 0.8rem; padding: 0.25rem 0.75rem;
      background: #2C2723; border: 1px solid #3C3835; color: #9B9590;
    }
    .example-btn:hover { background: #363230; color: #F1EFED; }
    .input-row { margin-top: auto; }
  `,
})
export class AgentsComponent {
  @ViewChild('chatThread') chatThread!: ElementRef;

  prompt = '';
  examples = [
    'Which departments have the highest average salary?',
    'Show me employees who changed roles and their salary progression',
    'Compare headcount across all regions',
  ];
  loading = signal(false);
  messages = signal<ChatMessage[]>([]);
  conversationId = signal<string | null>(null);
  error = signal('');

  constructor(private selectAi: SelectAiService) {}

  sendPrompt(text: string) {
    this.prompt = text;
    this.submit();
  }

  submit() {
    const text = this.prompt.trim();
    if (!text || this.loading()) return;

    this.prompt = '';
    this.error.set('');
    this.loading.set(true);
    this.messages.update(msgs => [...msgs, { role: 'user', content: text }]);
    this.scrollToBottom();

    this.selectAi.agents(text, this.conversationId() ?? undefined).subscribe({
      next: (res) => {
        this.conversationId.set(res.conversationId);
        this.messages.update(msgs => [...msgs, {
          role: 'agent',
          content: res.response,
          timeInMillis: res.timeInMillis,
        }]);
        this.loading.set(false);
        this.scrollToBottom();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Request failed');
        this.loading.set(false);
      },
    });
  }

  newConversation() {
    this.messages.set([]);
    this.conversationId.set(null);
    this.error.set('');
    this.prompt = '';
  }

  onEnter(event: Event) {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      ke.preventDefault();
      this.submit();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.chatThread?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
