import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Patient } from '../../../models/patients.models';
import { ClinicalAIService } from '../../../services/clinical-ai.service';
import { DhaAfyaConnectService } from '../../../services/dha-afyaconnect.service';
import { EmployeeService } from '../../../services/employee.service';
import { PatientsService } from '../../../services/patients.service';
import { PharmacyService } from '../../../services/pharmacy.service';
import { LaboratoryService } from '../../../services/laboratory.service';
import { RadiologyService } from '../../../services/radiology.service';
import { VisitQueueService } from '../../../services/visit-queue.service';
import { AddVisitRecordComponent } from './add-visit-record.component';

describe('AddVisitRecordComponent vitals', () => {
  let component: AddVisitRecordComponent;
  let patientsService: any;
  let clinicalAIService: any;
  let laboratoryService: any;
  let radiologyService: any;
  let queueService: any;
  let dialog: any;

  beforeEach(() => {
    clinicalAIService = {
      analyze: jasmine.createSpy('analyze').and.returnValue(of({})),
    };
    laboratoryService = {
      getResultsForTicket: jasmine
        .createSpy('getResultsForTicket')
        .and.returnValue(of([])),
    };
    radiologyService = {
      getImagingTypes: jasmine.createSpy('getImagingTypes').and.returnValue(of([{ id: 'IMG001' }])),
      createOrder: jasmine.createSpy('createOrder').and.returnValue(of({ id: 'RAD001' })),
      getReportsForTicket: jasmine.createSpy('getReportsForTicket').and.returnValue(of([])),
    };
    queueService = { forwardTicket: jasmine.createSpy('forwardTicket').and.returnValue(of(undefined)) };
    dialog = { open: jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(undefined) }) };
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
        { provide: ClinicalAIService, useValue: clinicalAIService },
        { provide: LaboratoryService, useValue: laboratoryService },
        { provide: RadiologyService, useValue: radiologyService },
        { provide: EmployeeService, useValue: {} },
        { provide: VisitQueueService, useValue: queueService },
        { provide: MatDialog, useValue: dialog },
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
    expect(payload.is_pregnant).toBe(false);
    expect(patientsService.createPatientVisitHistory).not.toHaveBeenCalled();
    expect(component.savingVitals).toBeFalsy();
  });

  it('saves pregnancy status as true with captured vitals', () => {
    component.visitForm.get('vitals')?.patchValue({
      systolicBp: 120,
      is_pregnant: true,
    });

    component.saveVitals();

    const payload =
      patientsService.createPatientVitals.calls.mostRecent().args[0];
    expect(payload.systolicBp).toBe(120);
    expect(payload.is_pregnant).toBe(true);
  });

  it('sends checkbox pregnancy status in the Clinical AI request', () => {
    for (const isPregnant of [false, true]) {
      component.visitForm.get('vitals')?.patchValue({
        is_pregnant: isPregnant,
      });

      component.runClinicalAI();

      const request = clinicalAIService.analyze.calls.mostRecent().args[0];
      expect(request.is_pregnant).toBe(isPregnant);
    }
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

  it('fetches lab results for the current visit ticket', () => {
    Object.defineProperty(component, 'dialogData', { value: { ticketNumber: '31' } });
    const results = [{ labId: 'LAB001', test: 'CBC' }];
    laboratoryService.getResultsForTicket.and.returnValue(of(results));

    component.fetchLabResults();

    expect(laboratoryService.getResultsForTicket).toHaveBeenCalledWith(
      '31',
      12,
    );
    expect(component.labResults).toEqual(results);
    expect(component.labResultsLoaded).toBeTruthy();
    expect(component.loadingLabResults).toBeFalsy();
  });

  it('prefills imaging for the current visit, links the order and forwards its ticket', () => {
    component.inputTicketNumber = 'OP/42';
    component.selectedPatient = { id: 'PAT001', firstName: 'Jane', lastName: 'Doe' } as Patient;
    component.visitForm.patchValue({ doctor: 'EMP001', whatHappened: 'Chest pain' });
    dialog.open.and.returnValue({ afterClosed: () => of({ imagingTypeId: 'IMG001' }) });

    component.requestRadiologyTest();

    expect(dialog.open.calls.mostRecent().args[1].data).toEqual(jasmine.objectContaining({
      patientId: 'PAT001', ticketNumber: 'OP/42', orderedBy: 'EMP001', clinicalNotes: 'Chest pain',
    }));
    expect(radiologyService.createOrder).toHaveBeenCalledWith(jasmine.objectContaining({
      patientId: 'PAT001', patient: 'Jane Doe', ticketNumber: 'OP/42',
    }), 12);
    expect(queueService.forwardTicket).toHaveBeenCalledWith('31', 'Radiology', 12);
    expect(component.requestingRadiology).toBeFalsy();
  });

  it('does not create or forward an order when the imaging dialog is cancelled', () => {
    component.inputTicketNumber = 'OP/42';
    component.requestRadiologyTest();
    expect(radiologyService.createOrder).not.toHaveBeenCalled();
    expect(queueService.forwardTicket).not.toHaveBeenCalled();
    expect(component.requestingRadiology).toBeFalsy();
  });

  it('fetches reports by ticket number, not the internal ticket ID', () => {
    component.inputTicketNumber = 'OP/42';
    const reports = [{ orderId: 'RAD001', findings: 'Clear' }];
    radiologyService.getReportsForTicket.and.returnValue(of(reports));
    component.fetchRadiologyResults();
    expect(radiologyService.getReportsForTicket).toHaveBeenCalledWith('OP/42', 12, 'PAT001');
    expect(component.radiologyReports).toEqual(reports);
    expect(component.radiologyResultsLoaded).toBeTruthy();
    expect(component.loadingRadiologyResults).toBeFalsy();
  });

  it('shows report failures and blocks imaging requests without a ticket number', () => {
    component.requestRadiologyTest();
    expect(radiologyService.getImagingTypes).not.toHaveBeenCalled();
    component.inputTicketNumber = 'OP/42';
    radiologyService.getReportsForTicket.and.returnValue(throwError(() => new Error('Unavailable')));
    component.fetchRadiologyResults();
    expect(component.radiologyResultsError).toContain('Unable to fetch');
    expect(component.radiologyResultsLoaded).toBeFalsy();
    expect(component.loadingRadiologyResults).toBeFalsy();
  });
});
