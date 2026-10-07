import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { EvidenceCitation } from '../../../models/clinical-ai.models';

@Component({
  selector: 'app-evidence-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="evidence-list" aria-label="Evidence references">
      <strong *ngIf="citations.length">Evidence</strong>
      <p *ngIf="!citations.length">
        No evidence citation was returned for this recommendation.
      </p>
      <article *ngFor="let citation of citations">
        <strong>{{ citation.source }}</strong>
        <span *ngIf="citation.publication"> · {{ citation.publication }}</span>
        <span *ngIf="citation.versionOrDate">
          · {{ citation.versionOrDate }}</span
        >
        <p *ngIf="citation.recommendation">{{ citation.recommendation }}</p>
        <a
          *ngIf="citation.url"
          [href]="citation.url"
          target="_blank"
          rel="noopener noreferrer"
          >View source</a
        >
      </article>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        margin-top: 8px;
      }
      .evidence-list {
        color: #536763;
        font-size: 10px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }
      .evidence-list > strong {
        color: #36564d;
      }
      .evidence-list > p {
        margin: 4px 0 0;
      }
      article {
        margin-top: 5px;
      }
      article > strong {
        color: #36564d;
      }
      article p {
        margin: 2px 0;
      }
      a {
        color: #105746;
        font-weight: 700;
        text-decoration: underline;
        text-underline-offset: 2px;
      }
    `,
  ],
})
export class ClinicalEvidenceListComponent {
  @Input() citations: EvidenceCitation[] = [];
}
