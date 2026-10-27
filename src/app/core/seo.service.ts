import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoConfig {
  title: string;
  description: string;
  noIndex?: boolean;
}

const BRAND_NAME = 'Afyora HMS';
export const PRODUCTION_ORIGIN = 'https://afyorahms.vercel.app';
const DEFAULT_DESCRIPTION =
  'Afyora HMS is a hospital management system for clinics and hospitals, connecting patient management, electronic health records, pharmacy, billing, staff and hospital operations.';
const SOFTWARE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': `${PRODUCTION_ORIGIN}/#software`,
  name: BRAND_NAME,
  url: `${PRODUCTION_ORIGIN}/`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web browser',
  inLanguage: 'en',
  description: DEFAULT_DESCRIPTION,
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  update(config: SeoConfig, url: string): void {
    const title = config.title.startsWith(BRAND_NAME) ? config.title : `${config.title} | ${BRAND_NAME}`;
    const description = config.description || DEFAULT_DESCRIPTION;
    const canonicalUrl = this.toAbsoluteUrl(url.split(/[?#]/, 1)[0] || '/');
    const robots = config.noIndex ? 'noindex, nofollow, noarchive' : 'index, follow';

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: robots });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: BRAND_NAME });
    this.meta.updateTag({ property: 'og:locale', content: 'en_US' });
    this.meta.updateTag({ property: 'og:image', content: `${PRODUCTION_ORIGIN}/shared/images/logo-circle.png` });
    this.meta.updateTag({ property: 'og:image:alt', content: 'Afyora HMS logo' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: `${PRODUCTION_ORIGIN}/shared/images/logo-circle.png` });
    this.meta.updateTag({ name: 'twitter:image:alt', content: 'Afyora HMS logo' });
    this.setCanonicalUrl(canonicalUrl);
    this.updateStructuredData(!config.noIndex && canonicalUrl === `${PRODUCTION_ORIGIN}/`);
  }

  private updateStructuredData(isHomepage: boolean): void {
    let script = this.document.getElementById('afyora-software-schema');
    if (!isHomepage) {
      script?.remove();
      return;
    }
    if (!script) {
      script = this.document.createElement('script');
      script.id = 'afyora-software-schema';
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(SOFTWARE_SCHEMA);
  }

  private toAbsoluteUrl(url: string): string {
    const path = `/${url.replace(/^\/+|\/+$/g, '')}`;
    return new URL(path, PRODUCTION_ORIGIN).toString();
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
