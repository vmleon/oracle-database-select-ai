import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectAiService, HybridResponse } from '../select-ai.service';
import { MarkdownPipe } from '../markdown.pipe';

@Component({
  selector: 'app-hybrid',
  imports: [FormsModule, MarkdownPipe],
  template: `
    <h2 class="page-title">Select AI Hybrid</h2>
    <p class="subtitle">Ask questions that combine database records with company documents — answered in a single query.</p>

    <div class="input-row">
      <textarea
        [(ngModel)]="prompt"
        rows="3"
        placeholder="e.g. What is our PTO policy and how many vacation days has Steven King taken?"
      ></textarea>
      <button (click)="submit()" [disabled]="!prompt.trim() || loading()">
        {{ loading() ? 'Searching...' : 'Ask' }}
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
        <h3>Answer</h3>
        <div class="response-text" [innerHTML]="response()!.answer | markdown"></div>
        <p class="timing">{{ response()!.timeInMillis }}ms</p>
      </section>
    }

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
  `,
  styles: `
    .examples { margin-top: 0.75rem; display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    .examples span { color: #7A7470; font-size: 0.85rem; }
    .example-btn {
      font-size: 0.8rem; padding: 0.25rem 0.75rem;
      background: #2C2723; border: 1px solid #3C3835; color: #9B9590;
    }
    .example-btn:hover { background: #363230; color: #F1EFED; }
  `,
})
export class HybridComponent {
  prompt = '';
  loading = signal(false);
  response = signal<HybridResponse | null>(null);
  error = signal('');

  examples = [
    'What is our PTO policy and how many vacation days has Steven King taken this year?',
    'What are the health insurance options and which department has the most employees?',
    'Explain the travel expense policy and show me employees in the Sales department',
  ];

  constructor(private selectAi: SelectAiService) {}

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.response.set(null);

    this.selectAi.hybrid(this.prompt).subscribe({
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
