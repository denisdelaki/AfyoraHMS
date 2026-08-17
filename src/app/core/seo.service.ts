import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoConfig {
  title: string;
  description: string;
  noIndex?: boolean;
}

const BRAND_NAME = 'Afyora HMS';
const DEFAULT_DESCRIPTION =
  'Afyora HMS is healthcare management software for clinics and hospitals. Manage patients, clinical records, appointments, billing, pharmacy, inventory, and reports in one workspace.';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  update(config: SeoConfig, url: string): void {
    const title = config.title === BRAND_NAME ? config.title : `${config.title} | ${BRAND_NAME}`;
    const description = config.description || DEFAULT_DESCRIPTION;
    const canonicalUrl = this.toAbsoluteUrl(url.split(/[?#]/, 1)[0] || '/');
    const robots = config.noIndex ? 'noindex, nofollow, noarchive' : 'index, follow';

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: robots });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.setCanonicalUrl(canonicalUrl);
  }

  private toAbsoluteUrl(url: string): string {
    const origin = this.document.defaultView?.location.origin;
    return origin ? new URL(url, origin).toString() : url;
  }

  private setCanonicalUrl(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }

    link.href = url;
  }
}
