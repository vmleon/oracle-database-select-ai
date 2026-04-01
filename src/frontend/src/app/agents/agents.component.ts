import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectAiService, AgentResponse } from '../select-ai.service';

@Component({
  selector: 'app-agents',
  imports: [FormsModule],
  template: `
    <h2 class="page-title">Select AI Agents</h2>
    <p class="subtitle">Let the database agent autonomously reason and execute multi-step operations.</p>

    <div class="input-row">
      <textarea
        [(ngModel)]="prompt"
        rows="3"
        placeholder="e.g. Analyze the sales trends for the last quarter and summarize key findings"
      ></textarea>
      <button (click)="submit()" [disabled]="!prompt.trim() || loading()">
        {{ loading() ? 'Processing...' : 'Send' }}
      </button>
    </div>

    @if (response()) {
      <section>
        <h3>Agent Response</h3>
        <div class="response-text">{{ response()!.response }}</div>
        <p class="timing">{{ response()!.timeInMillis }}ms</p>
      </section>
    }

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
  `,
})
export class AgentsComponent {
  prompt = '';
  loading = signal(false);
  response = signal<AgentResponse | null>(null);
  error = signal('');

  constructor(private selectAi: SelectAiService) {}

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.response.set(null);

    this.selectAi.agents(this.prompt).subscribe({
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
