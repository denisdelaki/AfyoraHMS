import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  CreateLabOrderPayload,
  LabRequest,
  LabResult,
  LabTest,
  SubmitLabResultPayload,
} from '../models/laboratory.models';

@Injectable({
  providedIn: 'root',
})
export class LaboratoryService {
  private readonly testsSubject = new BehaviorSubject<LabTest[]>([
    {
      id: 'T001',
      name: 'Complete Blood Count (CBC)',
      category: 'Hematology',
      duration: '2 hours',
      price: 45,
    },
    {
      id: 'T002',
      name: 'Lipid Panel',
      category: 'Biochemistry',
      duration: '4 hours',
      price: 65,
    },
    {
      id: 'T003',
      name: 'Thyroid Function Test',
      category: 'Endocrinology',
      duration: '6 hours',
      price: 85,
    },
    {
      id: 'T004',
      name: 'Liver Function Test',
      category: 'Biochemistry',
      duration: '4 hours',
      price: 55,
    },
    {
      id: 'T005',
      name: 'Blood Sugar (Fasting)',
      category: 'Biochemistry',
      duration: '1 hour',
      price: 25,
    },
  ]);

  private readonly requestsSubject = new BehaviorSubject<LabRequest[]>([
    {
      id: 'LAB-001',
      patient: 'John Smith',
      patientId: 'P001',
      test: 'Complete Blood Count (CBC)',
      orderedBy: 'Dr. Emily Chen',
      orderDate: '2024-02-24',
      sampleCollected: '2024-02-24 08:30 AM',
      status: 'Pending',
      priority: 'Routine',
    },
    {
      id: 'LAB-002',
      patient: 'Sarah Johnson',
      patientId: 'P002',
      test: 'Lipid Panel',
      orderedBy: 'Dr. James Wilson',
      orderDate: '2024-02-23',
      sampleCollected: '2024-02-23 09:15 AM',
      status: 'In Progress',
      priority: 'Routine',
    },
    {
      id: 'LAB-003',
      patient: 'Michael Brown',
      patientId: 'P003',
      test: 'Thyroid Function Test',
      orderedBy: 'Dr. Robert Taylor',
      orderDate: '2024-02-23',
      sampleCollected: '2024-02-23 10:00 AM',
      status: 'Completed',
      priority: 'Urgent',
    },
    {
      id: 'LAB-004',
      patient: 'Emma Davis',
      patientId: 'P004',
      test: 'Blood Sugar (Fasting)',
      orderedBy: 'Dr. Emily Chen',
      orderDate: '2024-02-24',
      sampleCollected: '2024-02-24 07:45 AM',
      status: 'Approved',
      priority: 'Routine',
    },
  ]);

  private readonly resultsSubject = new BehaviorSubject<LabResult[]>([
    {
      labId: 'LAB-003',
      patient: 'Michael Brown',
      test: 'Thyroid Function Test',
      parameters: [
        {
          name: 'TSH',
          value: '2.5',
          unit: 'mIU/L',
          range: '0.4-4.0',
          status: 'Normal',
        },
        {
          name: 'T3',
          value: '120',
          unit: 'ng/dL',
          range: '80-200',
          status: 'Normal',
        },
        {
          name: 'T4',
          value: '8.5',
          unit: 'µg/dL',
          range: '5.0-12.0',
          status: 'Normal',
        },
      ],
      technician: 'Tech Sarah Park',
      completedDate: '2024-02-23',
      approvedBy: null,
      status: 'Awaiting Approval',
    },
    {
      labId: 'LAB-004',
      patient: 'Emma Davis',
      test: 'Blood Sugar (Fasting)',
      parameters: [
        {
          name: 'Glucose',
          value: '95',
          unit: 'mg/dL',
          range: '70-100',
          status: 'Normal',
        },
      ],
      technician: 'Tech Sarah Park',
      completedDate: '2024-02-24',
      approvedBy: 'Dr. Wilson',
      status: 'Approved',
    },
  ]);

  getTests() {
    return this.testsSubject.asObservable();
  }

  getRequests() {
    return this.requestsSubject.asObservable();
  }

  getResults() {
    return this.resultsSubject.asObservable();
  }

  createOrder(payload: CreateLabOrderPayload) {
    const selectedTest = this.testsSubject.value.find(
      (t) => t.id === payload.testId,
    );
    if (!selectedTest) {
      return;
    }

    const nextId = `LAB-${String(this.requestsSubject.value.length + 1).padStart(3, '0')}`;
    const today = new Date();
    const orderDate = today.toISOString().slice(0, 10);
    const sampleCollected = this.formatSampleDate(today);

    const request: LabRequest = {
      id: nextId,
      patient: payload.patient.trim(),
      patientId: payload.patientId.trim(),
      test: selectedTest.name,
      orderedBy: payload.orderedBy.trim(),
      orderDate,
      sampleCollected,
      status: 'Pending',
      priority: payload.priority,
    };

    this.requestsSubject.next([request, ...this.requestsSubject.value]);
  }

  startTest(labId: string) {
    this.requestsSubject.next(
      this.requestsSubject.value.map((request) =>
        request.id === labId ? { ...request, status: 'In Progress' } : request,
      ),
    );
  }

  submitResult(payload: SubmitLabResultPayload) {
    const request = this.requestsSubject.value.find(
      (item) => item.id === payload.labId,
    );
    if (!request) {
      return;
    }

    this.requestsSubject.next(
      this.requestsSubject.value.map((item) =>
        item.id === payload.labId ? { ...item, status: 'Completed' } : item,
      ),
    );

    const existing = this.resultsSubject.value.find(
      (result) => result.labId === payload.labId,
    );
    const result: LabResult = {
      labId: payload.labId,
      patient: request.patient,
      test: request.test,
      parameters: payload.parameters,
      technician: 'Tech Sarah Park',
      completedDate: new Date().toISOString().slice(0, 10),
      approvedBy: null,
      status: 'Awaiting Approval',
      remarks: payload.remarks?.trim() || undefined,
    };

    if (existing) {
      this.resultsSubject.next(
        this.resultsSubject.value.map((item) =>
          item.labId === payload.labId ? result : item,
        ),
      );
      return;
    }

    this.resultsSubject.next([result, ...this.resultsSubject.value]);
  }

  approveResult(labId: string) {
    this.requestsSubject.next(
      this.requestsSubject.value.map((request) =>
        request.id === labId ? { ...request, status: 'Approved' } : request,
      ),
    );

    this.resultsSubject.next(
      this.resultsSubject.value.map((result) =>
        result.labId === labId
          ? {
              ...result,
              status: 'Approved',
              approvedBy: 'Dr. Wilson',
            }
          : result,
      ),
    );
  }

  private formatSampleDate(value: Date) {
    const date = value.toISOString().slice(0, 10);
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return `${date} ${formatter.format(value)}`;
  }
}
