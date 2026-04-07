import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header>
      <h1><span class="oracle-red">Oracle</span> Select AI Demo</h1>
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
    <footer>
      Created by <a href="https://www.linkedin.com/in/victormartindeveloper/" target="_blank" rel="noopener">Victor Martin</a> at Oracle Database EMEA Platform Technology Solutions (2026)
    </footer>
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
      background: #2C2723;
      border-bottom: 1px solid #3C3835;
    }
    h1 {
      margin: 0;
      font-size: 1.1rem;
      color: #F1EFED;
      white-space: nowrap;
    }
    h1 .oracle-red { color: #C74634; }
    nav {
      display: flex;
      gap: 0.25rem;
    }
    nav a {
      padding: 0.4rem 1rem;
      border-radius: 6px;
      color: #9B9590;
      text-decoration: none;
      font-size: 0.9rem;
      transition: background 0.15s, color 0.15s;
    }
    nav a:hover { background: #363230; color: #F1EFED; }
    nav a.active { background: #C74634; color: #fff; }
    main {
      flex: 1;
      padding: 1.5rem 1.5rem 4rem;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }
    footer {
      padding: 0.75rem 1.5rem;
      background: #2C2723;
      border-top: 1px solid #3C3835;
      text-align: center;
      color: #9B9590;
      font-size: 0.8rem;
    }
    footer a {
      color: #C74634;
      text-decoration: none;
    }
    footer a:hover {
      text-decoration: underline;
    }
  `,
})
export class App {}
