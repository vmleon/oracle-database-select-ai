import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectAiService, RagResponse } from '../select-ai.service';

@Component({
  selector: 'app-rag',
  imports: [FormsModule],
  template: `
    <h2 class="page-title">Select AI RAG</h2>
    <p class="subtitle">Combine database knowledge with document retrieval for richer answers.</p>

    <div class="input-row">
      <textarea
        [(ngModel)]="prompt"
        rows="3"
        placeholder="e.g. What are our return policies for hardware products?"
      ></textarea>
      <button (click)="submit()" [disabled]="!prompt.trim() || loading()">
        {{ loading() ? 'Searching...' : 'Ask' }}
      </button>
    </div>

    @if (response()) {
      <section>
        <h3>Answer</h3>
        <div class="response-text">{{ response()!.answer }}</div>
        <p class="timing">{{ response()!.timeInMillis }}ms</p>
      </section>

      @if (response()!.context) {
        <section>
          <h3>Retrieved Context</h3>
          <pre>{{ response()!.context }}</pre>
        </section>
      }
    }

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
  `,
})
export class RagComponent {
  prompt = '';
  loading = signal(false);
  response = signal<RagResponse | null>(null);
  error = signal('');

  constructor(private selectAi: SelectAiService) {}

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.response.set(null);

    this.selectAi.rag(this.prompt).subscribe({
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
