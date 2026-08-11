import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  of,
  tap,
  throwError,
} from 'rxjs';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../core/api.config';
import {
  ApiResponse,
  CreateLabOrderPayload,
  LabRequest,
  LabRequestStatus,
  LabResult,
  LabTest,
  LabTestPayload,
  LabPriority,
  SubmitLabResultPayload,
} from '../models';

type LabRequestApiModel = {
  id?: string;
  labId?: string;
  patient?:
    | string
    | { id?: string; patientId?: string; fullName?: string; name?: string };
  patient_id?: string;
  patientId?: string;
  patient_name?: string;
  test?: string | { id?: string; name?: string };
  test_name?: string;
  orderedBy?: string;
  ordered_by?: string;
  orderedByName?: string;
  ordered_by_name?: string;
  orderDate?: string;
  order_date?: string;
  sampleCollected?: string;
  sample_collected?: string;
  createdAt?: string;
  created_at?: string;
  status?: string;
  priority?: string;
};

type LabTestApiModel = {
  id?: string;
  test_id?: string;
  name?: string;
  test_name?: string;
  category?: string;
  duration?: string;
  turnaround_time?: string;
  price?: number | string;
};

type LabResultApiModel = {
  id?: string;
  labId?: string;
  lab_request?: string;
  labRequest?: string;
  patient?: string | { id?: string; fullName?: string; name?: string };
  patient_name?: string;
  test?: string | { name?: string };
  test_name?: string;
  parameters?: Array<{
    name?: string;
    value?: string | number;
    unit?: string;
    range?: string;
    referenceRange?: string;
    status?: string;
  }>;
  technician?: string;
  completedDate?: string;
  completed_date?: string;
  approvedBy?: string | null;
  approved_by?: string | null;
  status?: string;
  remarks?: string;
};

@Injectable({
  providedIn: 'root',
})
export class LaboratoryService {
  private readonly labRequestUrl = apiUrl('/laboratory/labrequest');
  private readonly labResultUrl = apiUrl('/laboratory/labresult');
  private readonly labTestUrl = apiUrl('/laboratory/tests');
  readonly http = inject(HttpClient);
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
    // {
    //   id: 'LAB-001',
    //   patient: 'John Smith',
    //   patientId: 'P001',
    //   test: 'Complete Blood Count (CBC)',
    //   orderedBy_employeeId: 'EMP004',
    //   orderedBy: 'Dr. Emily Chen',
    //   orderDate: '2024-02-24',
    //   sampleCollected: '2024-02-24 08:30 AM',
    //   status: 'Pending',
    //   priority: 'Routine',
    // },
    // {
    //   id: 'LAB-002',
    //   patient: 'Sarah Johnson',
    //   patientId: 'P002',
    //   test: 'Lipid Panel',
    //   orderedBy_employeeId: 'EMP003',
    //   orderedBy: 'Dr. James Wilson',
    //   orderDate: '2024-02-23',
    //   sampleCollected: '2024-02-23 09:15 AM',
    //   status: 'In Progress',
    //   priority: 'Routine',
    // },
    // {
    //   id: 'LAB-003',
    //   patient: 'Michael Brown',
    //   patientId: 'P003',
    //   test: 'Thyroid Function Test',
    //   orderedBy_employeeId: 'EMP002',
    //   orderedBy: 'Dr. Robert Taylor',
    //   orderDate: '2024-02-23',
    //   sampleCollected: '2024-02-23 10:00 AM',
    //   status: 'Completed',
    //   priority: 'Urgent',
    // },
    // {
    //   id: 'LAB-004',
    //   patient: 'Emma Davis',
    //   patientId: 'P004',
    //   test: 'Blood Sugar (Fasting)',
    //   orderedBy_employeeId: 'EMP001',
    //   orderedBy: 'Dr. Emily Chen',
    //   orderDate: '2024-02-24',
    //   sampleCollected: '2024-02-24 07:45 AM',
    //   status: 'Approved',
    //   priority: 'Routine',
    // },
  ]);

  private readonly resultsSubject = new BehaviorSubject<LabResult[]>([
    // {
    //   labId: 'LAB-003',
    //   patient: 'Michael Brown',
    //   test: 'Thyroid Function Test',
    //   parameters: [
    //     {
    //       name: 'TSH',
    //       value: '2.5',
    //       unit: 'mIU/L',
    //       range: '0.4-4.0',
    //       status: 'Normal',
    //     },
    //     {
    //       name: 'T3',
    //       value: '120',
    //       unit: 'ng/dL',
    //       range: '80-200',
    //       status: 'Normal',
    //     },
    //     {
    //       name: 'T4',
    //       value: '8.5',
    //       unit: 'µg/dL',
    //       range: '5.0-12.0',
    //       status: 'Normal',
    //     },
    //   ],
    //   technician: 'Tech Sarah Park',
    //   completedDate: '2024-02-23',
    //   approvedBy: null,
    //   status: 'Awaiting Approval',
    // },
    // {
    //   labId: 'LAB-004',
    //   patient: 'Emma Davis',
    //   test: 'Blood Sugar (Fasting)',
    //   parameters: [
    //     {
    //       name: 'Glucose',
    //       value: '95',
    //       unit: 'mg/dL',
    //       range: '70-100',
    //       status: 'Normal',
    //     },
    //   ],
    //   technician: 'Tech Sarah Park',
    //   completedDate: '2024-02-24',
    //   approvedBy: 'Dr. Wilson',
    //   status: 'Approved',
    // },
  ]);

  constructor() {
    this.fetchLabTests();
    this.fetchLabRequests();
    this.fetchLabResults();
  }

  getTests() {
    return this.testsSubject.asObservable();
  }

  getTestById(testId: string): Observable<LabTest> {
    return this.http
      .get<
        ApiResponse<LabTestApiModel> | LabTestApiModel
      >(this.buildLabTestDetailUrl(testId))
      .pipe(
        map((response) => this.extractItem<LabTestApiModel>(response)),
        map((item) => this.mapApiLabTest(item)),
        map((test) => {
          if (!test) {
            throw new Error('Unable to parse lab test record.');
          }

          return test;
        }),
      );
  }

  getRequests() {
    return this.requestsSubject.asObservable();
  }

  getResults() {
    return this.resultsSubject.asObservable();
  }

  createTest(payload: LabTestPayload): Observable<LabTest> {
    return this.http
      .post<
        ApiResponse<LabTestApiModel> | LabTestApiModel
      >(this.buildLabTestUrl(), this.buildLabTestPayload(payload))
      .pipe(
        map((response) => this.extractItem<LabTestApiModel>(response)),
        map((item) => this.mapApiLabTest(item)),
        tap((test) => {
          if (!test) {
            throw new Error('Unable to parse created lab test.');
          }

          this.upsertTest(test, true);
        }),
        map((test) => {
          if (!test) {
            throw new Error('Unable to parse created lab test.');
          }

          return test;
        }),
      );
  }

  updateTest(testId: string, payload: LabTestPayload): Observable<LabTest> {
    return this.http
      .put<
        ApiResponse<LabTestApiModel> | LabTestApiModel
      >(this.buildLabTestDetailUrl(testId), this.buildLabTestPayload(payload))
      .pipe(
        map((response) => this.extractItem<LabTestApiModel>(response)),
        map((item) => this.mapApiLabTest(item)),
        tap((test) => {
          if (!test) {
            throw new Error('Unable to parse updated lab test.');
          }

          this.upsertTest(test);
        }),
        map((test) => {
          if (!test) {
            throw new Error('Unable to parse updated lab test.');
          }

          return test;
        }),
      );
  }

  deleteTest(testId: string): Observable<void> {
    return this.http.delete<void>(this.buildLabTestDetailUrl(testId)).pipe(
      tap(() => {
        this.testsSubject.next(
          this.testsSubject.value.filter((test) => test.id !== testId),
        );
      }),
      catchError((error) => throwError(() => error)),
    );
  }

  createOrder(payload: CreateLabOrderPayload) {
    const requestPayload = {
      patient: payload.patient.trim(),
      patientId: payload.patientId.trim(),
      test: payload.testId.trim(),
      priority: payload.priority,
      notes: payload.notes?.trim() || undefined,
      orderedBy: payload.orderedBy.trim(),
      facilityId: this.getCurrentFacilityId(),
    };

    this.http
      .post<ApiResponse<LabRequestApiModel> | LabRequestApiModel>(
        this.buildLabRequestUrl(),
        requestPayload,
      )
      .pipe(
        tap(() => {
          this.fetchLabRequests();
        }),
        catchError((error) => {
          console.error('Failed to create lab request:', error);
          return of(null);
        }),
      )
      .subscribe();
  }

  startTest(labId: string) {
    this.requestsSubject.next(
      this.requestsSubject.value.map((request) =>
        request.id === labId ? { ...request, status: 'In Progress' } : request,
      ),
    );
    this.http
      .post<ApiResponse<LabRequestApiModel> | LabRequestApiModel>(
        this.buildLabRequestActionUrl(labId, 'start'),
        {},
      )
      .pipe(
        tap(() => this.fetchLabRequests()),
        catchError((error) => {
          console.error('Failed to start lab test on backend:', error);
          return of(null);
        }),
      )
      .subscribe();
  }

  submitResult(payload: SubmitLabResultPayload) {
    const resultPayload = {
      labRequest: payload.labId,
      labId: payload.labId,
      parameters: payload.parameters,
      remarks: payload.remarks?.trim() || undefined,
      facilityId: this.getCurrentFacilityId(),
    };

    this.http
      .post<ApiResponse<LabResultApiModel> | LabResultApiModel>(
        this.buildLabResultUrl(),
        resultPayload,
      )
      .pipe(
        tap(() => {
          this.fetchLabResults();
          this.fetchLabRequests();
        }),
        catchError((error) => {
          console.error('Failed to submit lab result:', error);
          return of(null);
        }),
      )
      .subscribe();
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

    this.http
      .post<ApiResponse<LabRequestApiModel> | LabRequestApiModel>(
        this.buildLabRequestActionUrl(labId, 'approve'),
        {},
      )
      .pipe(
        tap(() => {
          this.fetchLabRequests();
          this.fetchLabResults();
        }),
        catchError((error) => {
          console.error('Failed to approve lab result on backend:', error);
          return of(null);
        }),
      )
      .subscribe();
  }

  private buildLabRequestActionUrl(
    labId: string,
    action: 'start' | 'approve' | 'status',
  ): string {
    const facilityId = this.getCurrentFacilityId();
    const baseUrl = `${this.labRequestUrl}/${encodeURIComponent(labId)}/${action}/`;
    if (!facilityId) {
      return baseUrl;
    }
    return `${baseUrl}?facilityId=${encodeURIComponent(facilityId)}`;
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

  private fetchLabRequests(): void {
    this.http
      .get<ApiResponse<LabRequestApiModel[]> | LabRequestApiModel[]>(
        this.buildLabRequestUrl(),
      )
      .pipe(
        map((response) => this.extractCollection<LabRequestApiModel>(response)),
        map((requests) =>
          requests
            .map((item) => this.mapApiLabRequest(item))
            .filter((item): item is LabRequest => item !== null),
        ),
        catchError((error) => {
          console.error('Failed to fetch lab requests:', error);
          return of([] as LabRequest[]);
        }),
      )
      .subscribe((requests) => {
        this.requestsSubject.next(requests);
      });
  }

  private fetchLabTests(): void {
    this.http
      .get<ApiResponse<LabTestApiModel[]> | LabTestApiModel[]>(
        this.buildLabTestUrl(),
      )
      .pipe(
        map((response) => this.extractCollection<LabTestApiModel>(response)),
        map((tests) =>
          tests
            .map((item) => this.mapApiLabTest(item))
            .filter((item): item is LabTest => item !== null),
        ),
        catchError((error) => {
          console.error('Failed to fetch lab tests:', error);
          return of(this.testsSubject.value);
        }),
      )
      .subscribe((tests) => {
        this.testsSubject.next(tests);
      });
  }

  private fetchLabResults(): void {
    this.http
      .get<ApiResponse<LabResultApiModel[]> | LabResultApiModel[]>(
        this.buildLabResultUrl(),
      )
      .pipe(
        map((response) => this.extractCollection<LabResultApiModel>(response)),
        map((results) =>
          results
            .map((item) => this.mapApiLabResult(item))
            .filter((item): item is LabResult => item !== null),
        ),
        catchError((error) => {
          console.error('Failed to fetch lab results:', error);
          return of([] as LabResult[]);
        }),
      )
      .subscribe((results) => {
        this.resultsSubject.next(results);
      });
  }

  private buildLabRequestUrl(): string {
    const facilityId = this.getCurrentFacilityId();
    if (!facilityId) {
      return `${this.labRequestUrl}/`;
    }

    return `${this.labRequestUrl}/?facilityId=${encodeURIComponent(facilityId)}/`;
  }

  private buildLabResultUrl(): string {
    const facilityId = this.getCurrentFacilityId();
    if (!facilityId) {
      return `${this.labResultUrl}/`;
    }

    return `${this.labResultUrl}/?facilityId=${encodeURIComponent(facilityId)}`;
  }

  private buildLabTestUrl(): string {
    const facilityId = this.getCurrentFacilityId();
    if (!facilityId) {
      return `${this.labTestUrl}/`;
    }

    return `${this.labTestUrl}/?facilityId=${encodeURIComponent(facilityId)}`;
  }

  private buildLabTestDetailUrl(testId: string): string {
    const facilityId = this.getCurrentFacilityId();
    const baseUrl = `${this.labTestUrl}/${encodeURIComponent(testId)}/`;
    if (!facilityId) {
      return baseUrl;
    }

    return `${baseUrl}?facilityId=${encodeURIComponent(facilityId)}`;
  }

  private getCurrentFacilityId(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const user = JSON.parse(
        localStorage.getItem('afyora.user') || 'null',
      ) as {
        facility?: string | number;
      } | null;

      if (!user?.facility) {
        return null;
      }

      return String(user.facility);
    } catch {
      return null;
    }
  }

  private extractCollection<T>(response: ApiResponse<T[]> | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.results)) {
      return response.results;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  }

  private extractItem<T>(response: ApiResponse<T> | T): T {
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data;
    }

    if (response && typeof response === 'object' && 'results' in response) {
      return response.results as T;
    }

    return response as T;
  }

  private buildLabTestPayload(payload: LabTestPayload) {
    return {
      id: payload.id.trim(),
      name: payload.name.trim(),
      category: payload.category.trim(),
      duration: payload.duration.trim(),
      price: payload.price,
      facilityId: this.getCurrentFacilityId(),
    };
  }

  private upsertTest(test: LabTest, addToFront = false): void {
    const remainingTests = this.testsSubject.value.filter(
      (existingTest) => existingTest.id !== test.id,
    );

    this.testsSubject.next(
      addToFront ? [test, ...remainingTests] : [...remainingTests, test],
    );
  }

  private mapApiLabTest(item: LabTestApiModel): LabTest | null {
    const id = item.id || item.test_id;
    const name = item.name || item.test_name;
    if (!id || !name) {
      return null;
    }

    const rawPrice = item.price;
    const price =
      typeof rawPrice === 'number' ? rawPrice : Number(rawPrice || 0);

    return {
      id,
      name,
      category: item.category || 'General',
      duration: item.duration || item.turnaround_time || 'N/A',
      price: Number.isFinite(price) ? price : 0,
    };
  }

  private mapApiLabRequest(item: LabRequestApiModel): LabRequest | null {
    const id = item.id || item.labId;
    if (!id) {
      return null;
    }

    const patientObject =
      typeof item.patient === 'object' && item.patient !== null
        ? item.patient
        : null;
    const testObject =
      typeof item.test === 'object' && item.test !== null ? item.test : null;

    const patientName =
      (typeof item.patient === 'string' ? item.patient : undefined) ||
      patientObject?.fullName ||
      patientObject?.name ||
      item.patient_name ||
      item.patientId ||
      item.patient_id ||
      patientObject?.id ||
      'Unknown Patient';

    const patientId =
      item.patientId ||
      item.patient_id ||
      patientObject?.patientId ||
      patientObject?.id ||
      patientName;

    const testName =
      (typeof item.test === 'string' ? item.test : undefined) ||
      testObject?.name ||
      item.test_name ||
      'Unknown Test';

    const orderDate =
      item.orderDate ||
      item.order_date ||
      item.createdAt ||
      item.created_at ||
      new Date().toISOString().slice(0, 10);

    const sampleCollected =
      item.sampleCollected ||
      item.sample_collected ||
      this.formatSampleDate(new Date());

    return {
      id,
      patient: patientName,
      patientId,
      test: testName,
      orderedBy:
        item.orderedBy ||
        item.ordered_by ||
        item.orderedByName ||
        item.ordered_by_name ||
        'Unknown',
      orderDate,
      sampleCollected,
      status: this.normalizeStatus(item.status),
      priority: this.normalizePriority(item.priority),
    };
  }

  private mapApiLabResult(item: LabResultApiModel): LabResult | null {
    const labId = item.labId || item.id || item.lab_request || item.labRequest;
    if (!labId) {
      return null;
    }

    const patientObject =
      typeof item.patient === 'object' && item.patient !== null
        ? item.patient
        : null;
    const testObject =
      typeof item.test === 'object' && item.test !== null ? item.test : null;

    const patient =
      (typeof item.patient === 'string' ? item.patient : undefined) ||
      item.patient_name ||
      patientObject?.fullName ||
      patientObject?.name ||
      patientObject?.id ||
      'Unknown Patient';

    const test =
      (typeof item.test === 'string' ? item.test : undefined) ||
      item.test_name ||
      testObject?.name ||
      'Unknown Test';

    const parameters = (item.parameters || []).map((param) => ({
      name: param.name || 'Parameter',
      value: String(param.value ?? ''),
      unit: param.unit || '',
      range: param.range || param.referenceRange || '',
      status: ((param.status || '').toLowerCase() === 'normal'
        ? 'Normal'
        : 'Abnormal') as 'Normal' | 'Abnormal',
    }));

    const normalizedStatus = (item.status || '').toLowerCase();

    return {
      labId,
      patient,
      test,
      parameters,
      technician: item.technician || 'N/A',
      completedDate:
        item.completedDate ||
        item.completed_date ||
        new Date().toISOString().slice(0, 10),
      approvedBy: item.approvedBy ?? item.approved_by ?? null,
      status: normalizedStatus.includes('approved')
        ? 'Approved'
        : 'Awaiting Approval',
      remarks: item.remarks,
    };
  }

  private normalizeStatus(value: string | undefined): LabRequestStatus {
    const normalized = (value || '').toLowerCase();
    if (normalized.includes('in progress')) {
      return 'In Progress';
    }
    if (normalized.includes('completed')) {
      return 'Completed';
    }
    if (normalized.includes('approved')) {
      return 'Approved';
    }

    return 'Pending';
  }

  private normalizePriority(value: string | undefined): LabPriority {
    const normalized = (value || '').toLowerCase();
    if (normalized === 'stat') {
      return 'STAT';
    }
    if (normalized === 'urgent') {
      return 'Urgent';
    }

    return 'Routine';
  }
}
