import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { marked } from 'marked';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): string {
    if (!value) return '';
    try {
      const html = marked.parse(value, { async: false }) as string;
      return this.sanitizer.sanitize(SecurityContext.HTML, html) || '';
    } catch {
      return value;
    }
  }
}
