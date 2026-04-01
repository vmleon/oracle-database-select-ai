import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectAiService, AgentResponse } from '../select-ai.service';

@Component({
  selector: 'app-agents',
  imports: [FormsModule],
  template: `
    <h2 class="page-title">Select AI Agents</h2>
    <p class="subtitle">AI agent with NL2SQL tool — autonomously reasons and queries the SH schema.</p>

    <div class="input-row">
      <textarea
        [(ngModel)]="prompt"
        rows="3"
        placeholder="e.g. What are the top 5 products by total revenue?"
      ></textarea>
      <button (click)="submit()" [disabled]="!prompt.trim() || loading()">
        {{ loading() ? 'Processing...' : 'Send' }}
      </button>
    </div>

    <div class="examples">
      <p>Try:</p>
      <ul>
        <li><a (click)="setPrompt('What are the top 5 customers by total amount sold?')">Top 5 customers by total amount sold</a></li>
        <li><a (click)="setPrompt('Compare profits across product categories')">Compare profits across product categories</a></li>
        <li><a (click)="setPrompt('Which countries have the most customers?')">Which countries have the most customers?</a></li>
      </ul>
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

  setPrompt(text: string) {
    this.prompt = text;
  }
}
