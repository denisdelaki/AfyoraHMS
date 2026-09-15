import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { KnhtsService } from './knhts.service';

describe('KnhtsService', () => {
  let service: KnhtsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [KnhtsService],
    });
    service = TestBed.inject(KnhtsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('normalizes a diagnosis to a codeable concept shape', () => {
    const concept = service.normalizeClinicalConcept({
      system: 'ICD-10-WHO',
      code: 'A00',
      display: 'Cholera',
      text: 'Cholera',
    });

    expect(concept.coding[0].system).toBe('ICD-10-WHO');
    expect(concept.coding[0].code).toBe('A00');
    expect(concept.text).toBe('Cholera');
  });

  it('returns a fallback suggestion when KNHTS is unavailable', () => {
    service.searchConcepts('malaria').subscribe((results) => {
      expect(results.length).toBeGreaterThan(0);
      const displays = results.map((result) => `${result.display ?? ''} ${result.text ?? ''}`.toLowerCase());
      expect(displays.some((display) => display.includes('malaria'))).toBe(true);
    });

    const request = httpMock.expectOne((req) => req.url.includes('/knhts/concepts'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('search')).toBe('malaria');
    request.error(new ProgressEvent('network error'));
  });

  it('normalizes concepts returned by the backend proxy', () => {
    let result: any[] = [];
    service.searchConcepts('cholera').subscribe((concepts) => result = concepts);

    const request = httpMock.expectOne((req) => req.url.includes('/knhts/concepts'));
    request.flush({ data: [{ system: 'ICD-10-WHO', code: 'A00', display: 'Cholera' }] });

    expect(result[0].system).toBe('ICD-10-WHO');
    expect(result[0].code).toBe('A00');
  });
});
