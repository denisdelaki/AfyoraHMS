import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

import { FacilityProfileComponent } from './facility-profile.component';
import { FacilityService } from '../../../services/facility.service';
import { BillingService } from '../../../services/billing.service';
import { KnhtsService } from '../../../services/knhts.service';
import { ToastService } from '../../../core/toast.service';
import {
  MpesaConfig,
  MpesaConfigPayload,
} from '../../../models/billing.models';

const FACILITY_ID = 17;

const facility = {
  id: FACILITY_ID,
  name: 'Afyora Clinic',
  facility_type: 'clinic',
} as any;

const savedConfig: MpesaConfig = {
  id: 3,
  shortcode: '123456',
  consumer_key: 'facility-consumer-key',
  environment: 'production',
  transaction_type: 'CustomerPayBillOnline',
  account_reference_prefix: 'FACILITY',
  is_active: true,
};

describe('FacilityProfileComponent M-Pesa settings', () => {
  let fixture: ComponentFixture<FacilityProfileComponent>;
  let component: FacilityProfileComponent;
  let billingService: any;
  let toast: any;

  function lastSavePayload(): MpesaConfigPayload {
    return billingService.saveMpesaConfig.calls.mostRecent().args[1];
  }

  function setup(getResult: Observable<unknown>): void {
    billingService = {
      getMpesaConfig: jasmine
        .createSpy('getMpesaConfig')
        .and.returnValue(getResult),
      saveMpesaConfig: jasmine
        .createSpy('saveMpesaConfig')
        .and.returnValue(of({ success: true, data: savedConfig })),
    };

    toast = {
      showSuccess: jasmine.createSpy('showSuccess'),
      showError: jasmine.createSpy('showError'),
      showWarning: jasmine.createSpy('showWarning'),
      showInfo: jasmine.createSpy('showInfo'),
      handleHttpError: jasmine.createSpy('handleHttpError'),
    };

    const facilityService = {
      getMyFacility: jasmine
        .createSpy('getMyFacility')
        .and.returnValue(of(facility)),
      getSubscriptionHistory: jasmine
        .createSpy('getSubscriptionHistory')
        .and.returnValue(of([])),
    };

    const knhtsService = {
      getTerminologyLog: jasmine
        .createSpy('getTerminologyLog')
        .and.returnValue(of({ results: [] })),
    };

    TestBed.configureTestingModule({
      imports: [FacilityProfileComponent],
      providers: [
        { provide: FacilityService, useValue: facilityService },
        { provide: BillingService, useValue: billingService },
        { provide: KnhtsService, useValue: knhtsService },
        { provide: ToastService, useValue: toast },
      ],
    });

    fixture = TestBed.createComponent(FacilityProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('loading', () => {
    beforeEach(() => setup(of({ success: true, data: savedConfig })));

    it('loads the config using the authenticated facility id', () => {
      expect(billingService.getMpesaConfig).toHaveBeenCalledWith(FACILITY_ID);
    });

    it('populates non-secret fields and leaves secret fields empty', () => {
      expect(component.mpesaForm.shortcode).toBe('123456');
      expect(component.mpesaForm.consumer_key).toBe('facility-consumer-key');
      expect(component.mpesaForm.environment).toBe('production');
      expect(component.mpesaForm.transaction_type).toBe(
        'CustomerPayBillOnline',
      );
      expect(component.mpesaForm.account_reference_prefix).toBe('FACILITY');
      expect(component.mpesaForm.passkey).toBe('');
      expect(component.mpesaForm.consumer_secret).toBe('');
      expect(component.mpesaSecretsOnFile()).toBeTruthy();
    });
  });

  describe('when no config exists yet', () => {
    beforeEach(() =>
      setup(throwError(() => new HttpErrorResponse({ status: 404 }))),
    );

    it('treats 404 as "not configured" instead of an error', () => {
      expect(toast.handleHttpError).not.toHaveBeenCalled();
      expect(component.mpesaConfigured()).toBeFalsy();
    });

    it('requires shortcode, key, passkey and secret when enabling', () => {
      component.mpesaForm.is_active = true;
      component.saveMpesaSettings();

      expect(billingService.saveMpesaConfig).not.toHaveBeenCalled();
      expect(component.mpesaError('shortcode')).toBeTruthy();
      expect(component.mpesaError('consumer_key')).toBeTruthy();
      expect(component.mpesaError('passkey')).toBeTruthy();
      expect(component.mpesaError('consumer_secret')).toBeTruthy();
    });

    it('sends every credential for a brand new configuration', () => {
      Object.assign(component.mpesaForm, {
        shortcode: '123456',
        consumer_key: 'facility-consumer-key',
        passkey: 'facility-passkey',
        consumer_secret: 'facility-consumer-secret',
        environment: 'production',
        transaction_type: 'CustomerBuyGoodsOnline',
        account_reference_prefix: 'FACILITY',
        is_active: true,
      });

      component.saveMpesaSettings();

      expect(billingService.saveMpesaConfig).toHaveBeenCalledWith(FACILITY_ID, {
        shortcode: '123456',
        consumer_key: 'facility-consumer-key',
        environment: 'production',
        transaction_type: 'CustomerBuyGoodsOnline',
        account_reference_prefix: 'FACILITY',
        is_active: true,
        passkey: 'facility-passkey',
        consumer_secret: 'facility-consumer-secret',
      });
      expect(toast.showSuccess).toHaveBeenCalled();
    });
  });

  describe('updating an existing config', () => {
    beforeEach(() => setup(of({ success: true, data: savedConfig })));

    it('omits untouched secrets from the payload', () => {
      component.mpesaForm.shortcode = '654321';
      component.saveMpesaSettings();

      const payload = lastSavePayload();
      expect(payload.shortcode).toBe('654321');
      expect('passkey' in payload).toBeFalsy();
      expect('consumer_secret' in payload).toBeFalsy();
    });

    it('sends only the secret the user replaced', () => {
      component.mpesaForm.consumer_secret = 'rotated-secret';
      component.saveMpesaSettings();

      const payload = lastSavePayload();
      expect(payload.consumer_secret).toBe('rotated-secret');
      expect('passkey' in payload).toBeFalsy();
    });

    it('clears typed secrets and reloads the config after saving', () => {
      component.mpesaForm.passkey = 'rotated-passkey';
      component.saveMpesaSettings();

      expect(component.mpesaForm.passkey).toBe('');
      expect(component.mpesaForm.consumer_secret).toBe('');
      expect(billingService.getMpesaConfig).toHaveBeenCalledTimes(2);
    });

    it('blocks duplicate submissions while a save is in flight', () => {
      billingService.saveMpesaConfig.calls.reset();
      component.savingMpesa.set(true);

      component.saveMpesaSettings();

      expect(billingService.saveMpesaConfig).not.toHaveBeenCalled();
    });

    it('surfaces field-level API validation errors on 400', () => {
      billingService.saveMpesaConfig.and.returnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: {
                shortcode: ['Enter a valid Paybill or Till number.'],
                consumer_key: 'Unknown Daraja app.',
              },
            }),
        ),
      );

      component.saveMpesaSettings();

      expect(component.mpesaError('shortcode')).toBe(
        'Enter a valid Paybill or Till number.',
      );
      expect(component.mpesaError('consumer_key')).toBe('Unknown Daraja app.');
      expect(toast.handleHttpError).toHaveBeenCalled();
    });

    it('delegates 403 responses to the shared error handler', () => {
      billingService.saveMpesaConfig.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 403 })),
      );

      component.saveMpesaSettings();

      expect(toast.handleHttpError).toHaveBeenCalled();
      expect(component.savingMpesa()).toBeFalsy();
    });
  });
});
