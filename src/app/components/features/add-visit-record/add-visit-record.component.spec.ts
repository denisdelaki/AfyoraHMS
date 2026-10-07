import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Patient } from '../../../models/patients.models';
import { ClinicalAIService } from '../../../services/clinical-ai.service';
import { DhaAfyaConnectService } from '../../../services/dha-afyaconnect.service';
import { EmployeeService } from '../../../services/employee.service';
import { PatientsService } from '../../../services/patients.service';
import { PharmacyService } from '../../../services/pharmacy.service';
import { VisitQueueService } from '../../../services/visit-queue.service';
import { AddVisitRecordComponent } from './add-visit-record.component';

describe('AddVisitRecordComponent vitals', () => {
  let component: AddVisitRecordComponent;
  let patientsService: any;

  beforeEach(() => {
    patientsService = {
      createPatientVitals: jasmine
        .createSpy('createPatientVitals')
        .and.returnValue(of({ id: 1, painScore: 0 })),
      getPatientVitals: jasmine
        .createSpy('getPatientVitals')
        .and.returnValue(of([])),
      createPatientVisitHistory: jasmine.createSpy('createPatientVisitHistory'),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: PatientsService, useValue: patientsService },
        { provide: PharmacyService, useValue: {} },
        { provide: DhaAfyaConnectService, useValue: {} },
        { provide: ClinicalAIService, useValue: {} },
        { provide: EmployeeService, useValue: {} },
        { provide: VisitQueueService, useValue: {} },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
        { provide: ActivatedRoute, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: Location, useValue: {} },
      ],
    });
    component = TestBed.runInInjectionContext(
      () => new AddVisitRecordComponent(),
    );
    component.facilityId = 12;
    component.ticketId = '31';
    component.selectedPatient = { id: 'PAT001' } as Patient;
  });

  it('saves zero-valued vitals even with no diagnosis, doctor or consultation notes', () => {
    component.visitForm.get('vitals')?.patchValue({ painScore: 0 });
    expect(component.visitForm.invalid).toBeTruthy();
    expect(component.selectedConcept).toBeNull();
    component.saveVitals();
    const payload =
      patientsService.createPatientVitals.calls.mostRecent().args[0];
    expect(payload.patientId).toBe('PAT001');
    expect(payload.ticketId).toBe('31');
    expect(payload.painScore).toBe(0);
    expect(patientsService.createPatientVisitHistory).not.toHaveBeenCalled();
    expect(component.savingVitals).toBeFalsy();
  });

  it('does not save empty vitals or vitals without a patient', () => {
    component.saveVitals();
    component.selectedPatient = null;
    component.visitForm.get('vitals')?.patchValue({ systolicBp: 120 });
    component.saveVitals();
    expect(patientsService.createPatientVitals).not.toHaveBeenCalled();
  });

  it('fetches fresh vitals for the current patient and ticket and can populate the form', () => {
    patientsService.getPatientVitals.and.returnValue(
      of([
        { id: 1, systolicBp: 110, recordedAt: '2026-10-05T08:00:00Z' },
        {
          id: 2,
          systolicBp: 120,
          painScore: 0,
          recordedAt: '2026-10-06T08:00:00Z',
        },
      ]),
    );
    component.refreshPatientVitals();
    expect(patientsService.getPatientVitals).toHaveBeenCalledWith(
      12,
      'PAT001',
      '31',
      true,
    );
    expect(component.latestVitals?.id).toBe(2);
    component.useLatestVitals();
    expect(component.visitForm.get('vitals.systolicBp')?.value).toBe(120);
    expect(component.visitForm.get('vitals.painScore')?.value).toBe(0);
  });

  it('shows a fetch error instead of an empty-history result', () => {
    patientsService.getPatientVitals.and.returnValue(
      throwError(() => new Error('Unavailable')),
    );
    component.refreshPatientVitals();
    expect(component.vitalsLoadError).toContain('Unable to fetch');
    expect(component.loadingVitals).toBeFalsy();
  });
});
