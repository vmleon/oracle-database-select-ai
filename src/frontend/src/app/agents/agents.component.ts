import { Component, signal, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectAiService, AgentTrace, ToolTrace } from '../select-ai.service';
import { MarkdownPipe } from '../markdown.pipe';

interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  timeInMillis?: number;
  trace?: AgentTrace | null;
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
            @if (msg.trace && msg.trace.tasks.length > 0) {
              <button class="trace-toggle" (click)="toggleTrace($index); $event.stopPropagation()">
                {{ isTraceOpen($index) ? 'Hide' : 'Show' }} execution trace
                ({{ msg.trace.tasks.length }} {{ msg.trace.tasks.length === 1 ? 'task' : 'tasks' }}, {{ msg.trace.tools.length }} tool {{ msg.trace.tools.length === 1 ? 'call' : 'calls' }})
              </button>
              @if (isTraceOpen($index)) {
                <div class="trace-panel">
                  @for (task of msg.trace.tasks; track task.taskOrder) {
                    <div class="trace-task">
                      <div class="trace-task-header">
                        <span class="trace-step">Task {{ task.taskOrder }}</span>
                        <span class="trace-agent">{{ task.agentName }}</span>
                        <span class="trace-duration">{{ task.durationMillis }}ms</span>
                        <span class="trace-state" [class]="'state-' + task.state.toLowerCase()">{{ task.state }}</span>
                      </div>
                      @if (task.input) {
                        <div class="trace-detail">
                          <span class="trace-label">Input:</span>
                          <span class="trace-value">{{ task.input }}</span>
                        </div>
                      }
                      @for (tool of getToolsForTask(msg.trace!, task.taskOrder); track tool.toolName) {
                        <div class="trace-tool">
                          <span class="trace-tool-name">{{ tool.toolName }}</span>
                          <span class="trace-duration">{{ tool.durationMillis }}ms</span>
                          @if (tool.input) {
                            <div class="trace-detail">
                              <span class="trace-label">Input:</span>
                              <pre class="trace-code">{{ tool.input }}</pre>
                            </div>
                          }
                          @if (tool.output) {
                            <div class="trace-detail">
                              <span class="trace-label">Output:</span>
                              <pre class="trace-code">{{ tool.output }}</pre>
                            </div>
                          }
                        </div>
                      }
                      @if (task.result) {
                        <div class="trace-detail">
                          <span class="trace-label">Result:</span>
                          <span class="trace-value">{{ task.result }}</span>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
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
    .trace-toggle {
      display: inline-block;
      background: transparent;
      border: 1px solid #3C3835;
      color: #9B9590;
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      margin-top: 0.5rem;
      border-radius: 4px;
      cursor: pointer;
    }
    .trace-toggle:hover { border-color: #7A7470; color: #F1EFED; }
    .trace-panel {
      margin-top: 0.5rem;
      border-top: 1px solid #3C3835;
      padding-top: 0.5rem;
    }
    .trace-task {
      margin-bottom: 0.75rem;
      padding: 0.5rem;
      background: #252120;
      border-radius: 6px;
      border-left: 3px solid #C74634;
    }
    .trace-task-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.3rem;
      flex-wrap: wrap;
    }
    .trace-step { font-weight: 600; color: #C0BAB5; font-size: 0.8rem; }
    .trace-agent { color: #C74634; font-size: 0.8rem; }
    .trace-duration { color: #7A7470; font-size: 0.75rem; }
    .trace-state { font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 3px; }
    .state-succeeded { background: #1a3a1a; color: #4ade80; }
    .state-failed { background: #3a1a1a; color: #f87171; }
    .state-running { background: #3a3a1a; color: #facc15; }
    .trace-tool {
      margin: 0.3rem 0 0.3rem 1rem;
      padding: 0.3rem 0.5rem;
      border-left: 2px solid #3C3835;
      font-size: 0.8rem;
    }
    .trace-tool-name { color: #9B9590; font-weight: 500; margin-right: 0.5rem; }
    .trace-detail { margin-top: 0.2rem; font-size: 0.75rem; }
    .trace-label { color: #7A7470; margin-right: 0.3rem; }
    .trace-value { color: #D5D0CC; }
    .trace-code {
      margin: 0.2rem 0;
      padding: 0.3rem 0.5rem;
      background: #1a1816;
      border-radius: 4px;
      font-size: 0.75rem;
      max-height: 150px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
      color: #D5D0CC;
    }
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
          trace: res.trace,
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

  toggledTraces = signal<Set<number>>(new Set());

  toggleTrace(index: number) {
    this.toggledTraces.update(set => {
      const next = new Set(set);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  isTraceOpen(index: number): boolean {
    return this.toggledTraces().has(index);
  }

  getToolsForTask(trace: AgentTrace, taskOrder: number): ToolTrace[] {
    return trace.tools.filter(t => t.taskOrder === taskOrder);
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.chatThread?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
