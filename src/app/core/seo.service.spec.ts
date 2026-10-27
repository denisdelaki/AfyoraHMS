import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeoService);
    document = TestBed.inject(DOCUMENT);
  });

  it('uses the production origin and strips query strings, fragments and trailing slashes', () => {
    service.update({ title: 'Privacy Policy', description: 'Privacy information.' }, '/privacy/?source=test#policy');

    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://afyorahms.vercel.app/privacy');
    expect(TestBed.inject(Meta).getTag('property="og:url"')?.content)
      .toBe('https://afyorahms.vercel.app/privacy');
  });

  it('updates rather than duplicates metadata across navigation', () => {
    service.update({ title: 'Home', description: 'Public page.' }, '/');
    service.update({ title: 'Sign in', description: 'Private page.', noIndex: true }, '/login');
    service.update({ title: 'Terms', description: 'Terms information.' }, '/terms');

    expect(TestBed.inject(Title).getTitle()).toBe('Terms | Afyora HMS');
    expect(document.querySelectorAll('title').length).toBe(1);
    expect(document.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    for (const name of ['description', 'robots', 'twitter:title', 'twitter:description']) {
      expect(document.querySelectorAll(`meta[name="${name}"]`).length).toBe(1);
    }
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('index, follow');
  });

  it('marks authentication and workspace pages noindex', () => {
    service.update({ title: 'Workspace', description: 'Facility workspace.', noIndex: true }, '/patients');
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content)
      .toBe('noindex, nofollow, noarchive');
  });

  it('keeps one truthful software entity only on the homepage', () => {
    const config = { title: 'Afyora HMS | Hospital Management System', description: '' };
    service.update(config, '/');
    service.update(config, '/?source=test');
    const scripts = document.querySelectorAll('#afyora-software-schema');
    expect(scripts.length).toBe(1);
    const schema = JSON.parse(scripts[0].textContent || '{}');
    expect(schema['@id']).toBe('https://afyorahms.vercel.app/#software');
    expect(schema.operatingSystem).toBe('Web browser');
    expect(schema.offers).toBeUndefined();
    expect(schema.aggregateRating).toBeUndefined();
    expect(TestBed.inject(Title).getTitle()).toBe(config.title);
    service.update({ title: 'Terms', description: 'Terms information.' }, '/terms');
    expect(document.getElementById('afyora-software-schema')).toBeNull();
    service.update(config, '/');
    expect(document.querySelectorAll('#afyora-software-schema').length).toBe(1);
    service.update({ ...config, noIndex: true }, '/patients');
    expect(document.getElementById('afyora-software-schema')).toBeNull();
  });
});