import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RadiologyService } from './radiology.service';

describe('RadiologyService ticket reports', () => {
  let service: RadiologyService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RadiologyService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates an imaging order linked to the outpatient ticket', () => {
    service.createOrder({
      patient: 'Jane Doe', patientId: 'PAT001', ticketNumber: 'OP/42',
      orderedBy: 'EMP001', imagingTypeId: 'IMG001', priority: 'Routine',
      clinicalNotes: 'Chest pain',
    }, 12).subscribe();
    const request = http.expectOne((req) => req.method === 'POST');
    expect(request.request.body.ticketNumber).toBe('OP/42');
    expect(request.request.body.patientId).toBe('PAT001');
    request.flush({ id: 'RAD001' });
  });

  it('follows pagination and excludes orders and reports from other visits', () => {
    let results: any[] = [];
    service.getReportsForTicket('OP/42', 12, 'PAT001').subscribe((reports) => results = reports);
    http.expectOne((req) => req.url.includes('/requests/?') && req.url.includes('patientId=PAT001'))
      .flush({ results: [
        { id: 'RAD001', patientId: 'PAT001', ticketNumber: 'OP/41' },
      ], next: '/next-orders' });
    http.expectOne('/next-orders').flush({ results: [
      { id: 'RAD002', patientId: 'PAT001', ticketNumber: 'OP/42' },
      { id: 'RAD003', patientId: 'PAT002', ticketNumber: 'OP/42' },
    ], next: null });
    http.expectOne((req) => req.url.includes('orderId=RAD002')).flush({ results: [
      { orderRequestId: 'RAD001', findings: 'Wrong visit' },
      { orderRequestId: 'RAD002', studyName: 'Chest X-ray', findings: 'Clear' },
    ] });
    expect(results.length).toBe(1);
    expect(results[0].findings).toBe('Clear');
  });

  it('propagates API failures instead of returning an empty result', () => {
    let failed = false;
    service.getReportsForTicket('OP/42', 12, 'PAT001').subscribe({ error: () => failed = true });
    http.expectOne((req) => req.url.includes('/requests/?'))
      .flush({}, { status: 403, statusText: 'Forbidden' });
    expect(failed).toBeTruthy();
  });
});