import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectAiService, QueryResponse } from '../select-ai.service';

@Component({
  selector: 'app-query',
  imports: [FormsModule],
  template: `
    <h2 class="page-title">Select AI — Natural Language to SQL</h2>
    <p class="subtitle">Ask questions about customers, products, promotions, and sales data.</p>

    <div class="input-row">
      <textarea
        [(ngModel)]="prompt"
        rows="3"
        placeholder="e.g. What are the top 10 customers by total amount sold?"
      ></textarea>
      <button (click)="submit()" [disabled]="!prompt.trim() || loading()">
        {{ loading() ? 'Asking...' : 'Ask' }}
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
        <h3>Generated SQL</h3>
        <pre>{{ response()!.sqlQuery }}</pre>
        <p class="timing">{{ response()!.sqlQueryTimeInMillis }}ms</p>
      </section>

      <section>
        <h3>Narration</h3>
        <p class="response-text">{{ response()!.narration }}</p>
        <p class="timing">{{ response()!.narrationTimeInMillis }}ms</p>
      </section>

      @if (response()!.result.length > 0) {
        <section>
          <h3>Results ({{ response()!.result.length }} rows)</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  @for (col of columns(); track col) {
                    <th>{{ col }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of response()!.result; track $index) {
                  <tr>
                    @for (col of columns(); track col) {
                      <td>{{ row[col] }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="timing">{{ response()!.resultTimeInMillis }}ms</p>
        </section>
      }
    }

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
  `,
  styles: `
    .examples { margin-top: 0.75rem; display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    .examples span { color: #666; font-size: 0.85rem; }
    .example-btn {
      font-size: 0.8rem; padding: 0.25rem 0.75rem;
      background: #1a1a2e; border: 1px solid #333; color: #aaa;
    }
    .example-btn:hover { background: #2a2a4a; color: #ddd; }
    .table-wrap { overflow-x: auto; }
  `,
})
export class QueryComponent {
  prompt = '';
  loading = signal(false);
  response = signal<QueryResponse | null>(null);
  error = signal('');

  columns = computed(() => {
    const res = this.response();
    return res && res.result.length > 0 ? Object.keys(res.result[0]) : [];
  });

  examples = [
    'What are the top 10 customers by total amount sold?',
    'How many customers are in each country?',
    'Which products have the highest profit margin?',
  ];

  constructor(private selectAi: SelectAiService) {}

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.response.set(null);

    this.selectAi.query(this.prompt).subscribe({
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
