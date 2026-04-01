import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectAiService, AgentResponse } from '../select-ai.service';

@Component({
  selector: 'app-agents',
  imports: [FormsModule],
  template: `
    <h2 class="page-title">Select AI Agents</h2>
    <p class="subtitle">AI agent with NL2SQL tool — autonomously reasons and queries the HR schema.</p>

    <div class="input-row">
      <textarea
        [(ngModel)]="prompt"
        rows="3"
        placeholder="e.g. Analyze salary distribution across departments and identify outliers"
      ></textarea>
      <button (click)="submit()" [disabled]="!prompt.trim() || loading()">
        {{ loading() ? 'Processing...' : 'Send' }}
      </button>
    </div>

    <div class="examples">
      <p>Try:</p>
      <ul>
        <li><a (click)="setPrompt('Which departments have the highest average salary?')">Which departments have the highest average salary?</a></li>
        <li><a (click)="setPrompt('Show me employees who changed roles and their salary progression')">Employees who changed roles and their salary progression</a></li>
        <li><a (click)="setPrompt('Compare headcount across all regions')">Compare headcount across all regions</a></li>
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
