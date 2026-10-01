import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { BillingService } from './billing.service';
import { apiUrl } from '../core/api.config';
import { MpesaConfigPayload } from '../models';

describe('BillingService M-Pesa config', () => {
  let service: BillingService;
  let httpMock: HttpTestingController;

  const configUrl = (facilityId: string | number) =>
    `${apiUrl('/billing')}/mpesa-config/?facilityId=${facilityId}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BillingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests the config for the supplied facility id', () => {
    service.getMpesaConfig(7).subscribe();

    const req = httpMock.expectOne(configUrl(7));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ success: true, data: null });
  });

  it('never hardcodes a facility id', () => {
    service.getMpesaConfig(41).subscribe();

    const req = httpMock.expectOne(configUrl(41));
    expect(req.request.urlWithParams).not.toContain('facilityId=2&');
    expect(req.request.urlWithParams.endsWith('facilityId=41')).toBeTruthy();
    req.flush({ success: true, data: null });
  });

  it('posts the config payload unchanged to the facility-scoped endpoint', () => {
    const payload: MpesaConfigPayload = {
      shortcode: '123456',
      consumer_key: 'facility-consumer-key',
      environment: 'production',
      transaction_type: 'CustomerPayBillOnline',
      account_reference_prefix: 'FACILITY',
      is_active: true,
      passkey: 'facility-passkey',
      consumer_secret: 'facility-consumer-secret',
    };

    service.saveMpesaConfig(9, payload).subscribe();

    const req = httpMock.expectOne(configUrl(9));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ success: true, data: null });
  });
});
