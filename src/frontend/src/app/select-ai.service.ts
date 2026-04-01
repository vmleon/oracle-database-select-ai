import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface QueryResponse {
  prompt: string;
  sqlQuery: string;
  sqlQueryTimeInMillis: number;
  narration: string;
  narrationTimeInMillis: number;
  result: Record<string, string>[];
  resultTimeInMillis: number;
}

export interface AgentResponse {
  prompt: string;
  response: string;
  timeInMillis: number;
}

export interface RunSqlResponse {
  prompt: string;
  result: Record<string, string>[];
  timeInMillis: number;
}

export interface RagResponse {
  prompt: string;
  answer: string;
  timeInMillis: number;
}

export interface ChatResponse {
  prompt: string;
  response: string;
  timeInMillis: number;
}

export interface HybridResponse {
  prompt: string;
  answer: string;
  timeInMillis: number;
}

@Injectable({ providedIn: 'root' })
export class SelectAiService {
  constructor(private http: HttpClient) {}

  query(prompt: string) {
    return this.http.post<QueryResponse>('/api/v1/selectai/query', { prompt });
  }

  runsql(prompt: string) {
    return this.http.post<RunSqlResponse>('/api/v1/selectai/runsql', { prompt });
  }

  agents(prompt: string) {
    return this.http.post<AgentResponse>('/api/v1/selectai/agents', { prompt });
  }

  rag(prompt: string) {
    return this.http.post<RagResponse>('/api/v1/selectai/rag', { prompt });
  }

  chat(prompt: string) {
    return this.http.post<ChatResponse>('/api/v1/selectai/chat', { prompt });
  }

  hybrid(prompt: string) {
    return this.http.post<HybridResponse>('/api/v1/selectai/hybrid', { prompt });
  }
}
