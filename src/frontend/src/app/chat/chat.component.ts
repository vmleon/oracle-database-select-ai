import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectAiService, ChatResponse } from '../select-ai.service';
import { MarkdownPipe } from '../markdown.pipe';

@Component({
  selector: 'app-chat',
  imports: [FormsModule, MarkdownPipe],
  template: `
    <h2 class="page-title">Select AI Chat</h2>
    <p class="subtitle">General knowledge questions answered by the LLM through the same SELECT AI interface — no tables queried.</p>

    <div class="input-row">
      <textarea
        [(ngModel)]="prompt"
        rows="3"
        placeholder="e.g. What is a foreign key?"
      ></textarea>
      <button (click)="submit()" [disabled]="!prompt.trim() || loading()">
        {{ loading() ? 'Processing...' : 'Send' }}
      </button>
    </div>

    <div class="examples">
      <span>Try: </span>
      @for (ex of examples; track ex) {
        <button class="example-btn" (click)="prompt = ex">{{ ex }}</button>
      }
    </div>

    @if (response()) {
      <section>
        <h3>Chat Response</h3>
        <div class="response-text" [innerHTML]="response()!.response | markdown"></div>
        <p class="timing">{{ response()!.timeInMillis }}ms</p>
      </section>
    }

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
  `,
})
export class ChatComponent {
  prompt = '';

  examples = [
    'What is a foreign key in a relational database?',
    'Explain the difference between INNER JOIN and LEFT JOIN',
    'What are best practices for database indexing?',
  ];
  loading = signal(false);
  response = signal<ChatResponse | null>(null);
  error = signal('');

  constructor(private selectAi: SelectAiService) {}

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.response.set(null);

    this.selectAi.chat(this.prompt).subscribe({
      next: (res) => {
        this.response.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Request failed');
        this.loading.set(false);
      },
    });
  }

}
