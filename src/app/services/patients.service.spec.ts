import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { apiUrl } from '../core/api.config';
import { PatientsService } from './patients.service';

describe('PatientsService vitals', () => {
  let service: PatientsService;
  let httpMock: HttpTestingController;
  const baseUrl = apiUrl('/patients');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PatientsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('saves vitals under a patient and ticket without consultation fields', () => {
    const payload = {
      facilityId: 12,
      patientId: 'PAT/001',
      ticketId: '31',
      painScore: 0,
    };
    service.createPatientVitals(payload).subscribe();
    const request = httpMock.expectOne(`${baseUrl}/PAT%2F001/vitals/`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ id: 1, ...payload });
  });

  it('isolates ticket caches, unwraps paginated responses and refreshes on demand', () => {
    const url = (ticket: string) =>
      `${baseUrl}/vitals/?facilityId=12&patientId=PAT%2F001&ticketId=${ticket}`;
    service.getPatientVitals(12, 'PAT/001', '31').subscribe((vitals) => {
      expect(vitals).toEqual([{ id: 1, ticketId: 31 }]);
    });
    httpMock.expectOne(url('31')).flush({ results: [{ id: 1, ticketId: 31 }] });
    service.getPatientVitals(12, 'PAT/001', '32').subscribe();
    httpMock.expectOne(url('32')).flush({ results: [] });
    service.getPatientVitals(12, 'PAT/001', '31', true).subscribe();
    httpMock.expectOne(url('31')).flush({ results: [] });
  });

  it('invalidates ticket caches after saving new vitals', () => {
    const url = `${baseUrl}/vitals/?facilityId=12&patientId=PAT001&ticketId=31`;
    service.getPatientVitals(12, 'PAT001', '31').subscribe();
    httpMock.expectOne(url).flush({ results: [] });
    service
      .createPatientVitals({
        facilityId: 12,
        patientId: 'PAT001',
        ticketId: '31',
        painScore: 0,
      })
      .subscribe();
    httpMock.expectOne(`${baseUrl}/PAT001/vitals/`).flush({ id: 1 });
    service.getPatientVitals(12, 'PAT001', '31').subscribe();
    httpMock.expectOne(url).flush({ results: [{ id: 1 }] });
  });
});
