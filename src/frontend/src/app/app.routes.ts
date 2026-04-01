import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'query', pathMatch: 'full' },
  {
    path: 'query',
    loadComponent: () => import('./query/query.component').then((m) => m.QueryComponent),
  },
  {
    path: 'chat',
    loadComponent: () => import('./chat/chat.component').then((m) => m.ChatComponent),
  },
  {
    path: 'agents',
    loadComponent: () => import('./agents/agents.component').then((m) => m.AgentsComponent),
  },
  {
    path: 'rag',
    loadComponent: () => import('./rag/rag.component').then((m) => m.RagComponent),
  },
];
