import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectAiService, QueryResponse, RunSqlResponse } from '../select-ai.service';

type Mode = 'quick' | 'detailed';

@Component({
  selector: 'app-query',
  imports: [FormsModule],
  template: `
    <h2 class="page-title">Select AI — Natural Language to SQL</h2>
    <p class="subtitle">Ask questions about employees, departments, salaries, and job history.</p>

    <div class="mode-toggle">
      <button
        [class.active]="mode() === 'quick'"
        (click)="mode.set('quick')">Quick Query</button>
      <button
        [class.active]="mode() === 'detailed'"
        (click)="mode.set('detailed')">Detailed</button>
    </div>

    <div class="input-row">
      <textarea
        [(ngModel)]="prompt"
        rows="3"
        placeholder="e.g. Who are the highest paid employees in the IT department?"
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

    @if (runsqlResponse()) {
      @if (runsqlResponse()!.result.length > 0) {
        <section>
          <h3>Results ({{ runsqlResponse()!.result.length }} rows)</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  @for (col of runsqlColumns(); track col) {
                    <th>{{ col }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of runsqlResponse()!.result; track $index) {
                  <tr>
                    @for (col of runsqlColumns(); track col) {
                      <td>{{ row[col] }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="timing">{{ runsqlResponse()!.timeInMillis }}ms</p>
        </section>
      }
    }

    @if (queryResponse()) {
      <section>
        <h3>Generated SQL</h3>
        <pre>{{ queryResponse()!.sqlQuery }}</pre>
        <p class="timing">{{ queryResponse()!.sqlQueryTimeInMillis }}ms</p>
      </section>

      <section>
        <h3>Narration</h3>
        <p class="response-text">{{ queryResponse()!.narration }}</p>
        <p class="timing">{{ queryResponse()!.narrationTimeInMillis }}ms</p>
      </section>

      @if (queryResponse()!.result.length > 0) {
        <section>
          <h3>Results ({{ queryResponse()!.result.length }} rows)</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  @for (col of queryColumns(); track col) {
                    <th>{{ col }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of queryResponse()!.result; track $index) {
                  <tr>
                    @for (col of queryColumns(); track col) {
                      <td>{{ row[col] }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="timing">{{ queryResponse()!.resultTimeInMillis }}ms</p>
        </section>
      }
    }

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
  `,
  styles: `
    .mode-toggle {
      display: flex; gap: 0; margin-bottom: 1rem;
    }
    .mode-toggle button {
      background: #2C2723; border: 1px solid #3C3835; color: #9B9590;
      padding: 0.4rem 1rem; font-size: 0.85rem;
    }
    .mode-toggle button:first-child { border-radius: 6px 0 0 6px; }
    .mode-toggle button:last-child { border-radius: 0 6px 6px 0; border-left: none; }
    .mode-toggle button.active { background: #C74634; color: #fff; border-color: #C74634; }
    .examples { margin-top: 0.75rem; display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    .examples span { color: #7A7470; font-size: 0.85rem; }
    .example-btn {
      font-size: 0.8rem; padding: 0.25rem 0.75rem;
      background: #2C2723; border: 1px solid #3C3835; color: #9B9590;
    }
    .example-btn:hover { background: #363230; color: #F1EFED; }
    .table-wrap { overflow-x: auto; }
  `,
})
export class QueryComponent {
  prompt = '';
  mode = signal<Mode>('quick');
  loading = signal(false);
  runsqlResponse = signal<RunSqlResponse | null>(null);
  queryResponse = signal<QueryResponse | null>(null);
  error = signal('');

  runsqlColumns = computed(() => {
    const res = this.runsqlResponse();
    return res && res.result.length > 0 ? Object.keys(res.result[0]) : [];
  });

  queryColumns = computed(() => {
    const res = this.queryResponse();
    return res && res.result.length > 0 ? Object.keys(res.result[0]) : [];
  });

  examples = [
    'Who are the top 5 highest paid employees?',
    'How many employees are in each department?',
    'Show me all employees hired in the last 10 years',
  ];

  constructor(private selectAi: SelectAiService) {}

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.runsqlResponse.set(null);
    this.queryResponse.set(null);

    if (this.mode() === 'quick') {
      this.selectAi.runsql(this.prompt).subscribe({
        next: (res) => {
          this.runsqlResponse.set(res);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Request failed');
          this.loading.set(false);
        },
      });
    } else {
      this.selectAi.query(this.prompt).subscribe({
        next: (res) => {
          this.queryResponse.set(res);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Request failed');
          this.loading.set(false);
        },
      });
    }
  }
}
