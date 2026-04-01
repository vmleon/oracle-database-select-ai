import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header>
      <h1>Oracle Select AI Demo</h1>
      <nav>
        <a routerLink="/query" routerLinkActive="active">Select AI</a>
        <a routerLink="/chat" routerLinkActive="active">Chat</a>
        <a routerLink="/agents" routerLinkActive="active">Agents</a>
        <a routerLink="/rag" routerLinkActive="active">RAG</a>
        <a routerLink="/hybrid" routerLinkActive="active">Hybrid</a>
      </nav>
    </header>
    <main>
      <router-outlet />
    </main>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    header {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 0.75rem 1.5rem;
      background: #1a1a2e;
      border-bottom: 1px solid #333;
    }
    h1 {
      margin: 0;
      font-size: 1.1rem;
      color: #e0e0e0;
      white-space: nowrap;
    }
    nav {
      display: flex;
      gap: 0.25rem;
    }
    nav a {
      padding: 0.4rem 1rem;
      border-radius: 6px;
      color: #aaa;
      text-decoration: none;
      font-size: 0.9rem;
      transition: background 0.15s, color 0.15s;
    }
    nav a:hover { background: #2a2a4a; color: #ddd; }
    nav a.active { background: #3a3a6a; color: #fff; }
    main {
      flex: 1;
      padding: 1.5rem;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }
  `,
})
export class App {}
