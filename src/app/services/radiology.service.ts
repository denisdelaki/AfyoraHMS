import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EMPTY, Observable, catchError, expand, forkJoin, map, of, from, reduce, switchMap } from 'rxjs';
import { apiUrl } from '../core/api.config';
import { ApiResponse } from '../models/api.models';
import { PageResult, normalizePageResult } from '../core/pagination';
import {
  CreateImagingOrderPayload,
  CreateImagingTypePayload,
  CreateRadiologyReportPayload,
  ImagingType,
  RadiologyOrder,
  RadiologyReport,
  UploadedRadiologyImage,
  UploadRadiologyImagesPayload,
} from '../models/radiology.models';

type RadiologyReportApiModel = {
  orderRequestId?: string;
  orderId?: string;
  order_id?: string;
  patient?: string;
  patientId?: string;
  studyName?: string;
  type?: string;
  scanDate?: string;
  scan_date?: string;
  radiologist?: string;
  findings?: string;
  impression?: string;
  recommendations?: string;
  status?: RadiologyReport['status'];
};

@Injectable({
  providedIn: 'root',
})
export class RadiologyService {
  private readonly baseUrl = apiUrl('/radiology');

  private readonly uploadedImagesByOrder = new Map<string, UploadedRadiologyImage[]>();

  constructor(private http: HttpClient) { }

  // ---------- Utility: unwrap paginated / wrapped API responses ----------
  private extractCollection<T>(response: ApiResponse<T[]> | T[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (response && typeof response === 'object') {
      if (Array.isArray((response as ApiResponse<T[]>).results)) {
        return (response as ApiResponse<T[]>).results as T[];
      }
      if (Array.isArray((response as ApiResponse<T[]>).data)) {
        return (response as ApiResponse<T[]>).data;
      }
    }

    return [];
  }

  // ---------- Imaging Types (Catalog) ----------
  getImagingTypes(facilityId: string | number): Observable<ImagingType[]> {
    return this.http.get<ApiResponse<any[]> | any[]>(`${this.baseUrl}/studies/?facilityId=${facilityId}`).pipe(
      map((response) => this.extractCollection(response)),
      map((studies) =>
        studies.map((s) => ({
          id: s.id ?? s.study_id,
          name: s.name,
          modality: s.modality ?? '',
          bodyPart: s.body_part ?? s.bodyPart ?? '',
          duration: s.duration ?? '',
          price: s.price ?? 0,
        })),
      ),
      catchError((error) => {
        console.error('Failed to fetch imaging types:', error);
        return of([] as ImagingType[]);
      }),
    );
  }

  getImagingTypesPage(
    facilityId: string | number,
    page: number,
    pageSize: number,
    search = '',
  ): Observable<PageResult<ImagingType>> {
    return this.getPagedCollection(
      `${this.baseUrl}/studies/`,
      facilityId,
      page,
      pageSize,
      search,
      (study) => ({
        id: study.id ?? study.study_id,
        name: study.name,
        modality: study.modality ?? '',
        bodyPart: study.body_part ?? study.bodyPart ?? '',
        duration: study.duration ?? '',
        price: study.price ?? 0,
      }),
    );
  }

  createImagingType(
    payload: CreateImagingTypePayload,
    facilityId: string | number,
  ): Observable<ImagingType> {
    const body = {
      name: payload.name.trim(),
      modality: payload.modality.trim(),
      body_part: payload.bodyPart.trim(),
      duration: payload.duration.trim(),
      price: payload.price,
    };
    return this.http.post<ImagingType>(
      `${this.baseUrl}/studies/?facilityId=${facilityId}`,
      body,
    );
  }

  updateImagingType(
    id: string,
    payload: CreateImagingTypePayload,
  ): Observable<ImagingType> {
    const body = {
      name: payload.name.trim(),
      modality: payload.modality.trim(),
      body_part: payload.bodyPart.trim(),
      duration: payload.duration.trim(),
      price: payload.price,
    };
    return this.http.put<ImagingType>(`${this.baseUrl}/studies/${id}/`, body);
  }

  deleteImagingType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/studies/${id}/`);
  }

  // ---------- Orders (Imaging Requests) ----------
  getOrders(facilityId: string | number): Observable<RadiologyOrder[]> {
    return this.http.get<ApiResponse<any[]> | any[]>((`${this.baseUrl}/requests/?facilityId=${facilityId}`)).pipe(
      map((response) => this.extractCollection(response)),
      map((requests) =>
        requests.map((r) => ({
          id: r.id,
          patient: r.patient,
          patientId: r.patientId,
          type: r.studyName,
          orderedBy: r.orderedBy,
          orderDate: r.orderDate,
          scheduledDate: r.scheduledDate || r.orderDate,
          status: r.status,
          priority: r.priority,
          clinicalNotes: r.notes,
        })),
      ),
      catchError((error) => {
        console.error('Failed to fetch radiology orders:', error);
        return of([] as RadiologyOrder[]);
      }),
    );
  }

  getOrdersPage(
    facilityId: string | number,
    page: number,
    pageSize: number,
    search = '',
  ): Observable<PageResult<RadiologyOrder>> {
    return this.getPagedCollection(
      `${this.baseUrl}/requests/`,
      facilityId,
      page,
      pageSize,
      search,
      (request) => ({
        id: request.id,
        patient: request.patient,
        patientId: request.patientId,
        type: request.studyName,
        orderedBy: request.orderedBy,
        orderDate: request.orderDate,
        scheduledDate: request.scheduledDate || request.orderDate,
        status: request.status,
        priority: request.priority,
        clinicalNotes: request.notes,
      }),
    );
  }

  // ---------- Reports ----------
  getReportsForTicket(
    ticketNumber: string,
    facilityId: string | number,
    patientId: string,
  ): Observable<RadiologyReport[]> {
    const params = new URLSearchParams({ facilityId: String(facilityId), patientId });
    return this.getAllPages(`${this.baseUrl}/requests/?${params}`).pipe(
      map((orders) => orders.filter((order) =>
        order.ticketNumber === ticketNumber && order.patientId === patientId,
      )),
      switchMap((orders) => orders.length ? forkJoin(orders.map((order) => {
        const reportParams = new URLSearchParams({
          facilityId: String(facilityId), orderId: String(order.id),
        });
        return this.getAllPages(`${this.baseUrl}/reports/?${reportParams}`).pipe(
          map((reports) => reports.filter((report) => report.orderRequestId === order.id)),
        );
      })) : of([])),
      map((collections) => collections.flat().map((report) => ({
        orderId: report.orderRequestId,
        patient: report.patient || '',
        patientId: report.patientId,
        type: report.studyName || '',
        scanDate: report.scanDate || '',
        radiologist: report.radiologist || '',
        findings: report.findings || '',
        impression: report.impression || '',
        recommendations: report.recommendations || '',
        status: report.status || 'Finalized',
      }))),
    );
  }

  private getAllPages(url: string): Observable<any[]> {
    return this.http.get<ApiResponse<any[]> | any[]>(url).pipe(
      expand((response) => {
        const next = (response as { next?: string | null }).next;
        return next ? this.http.get<ApiResponse<any[]> | any[]>(next) : EMPTY;
      }),
      map((response) => this.extractCollection(response)),
      reduce((items, page) => items.concat(page), [] as any[]),
    );
  }

  getReports(facilityId: string | number): Observable<RadiologyReport[]> {
    return this.http.get<ApiResponse<any[]> | any[]>(`${this.baseUrl}/reports/?facilityId=${facilityId}`).pipe(
      map((response) => this.extractCollection(response)),
      map((reports) =>
        reports.map((rep) => ({
          orderId: rep.orderRequestId || rep.orderId || rep.order_id || '',
          patient: rep.patient || '',
          type: rep.studyName || rep.type || '',
          scanDate: rep.scanDate || rep.scan_date || '',
          radiologist: rep.radiologist || '',
          findings: rep.findings || '',
          impression: rep.impression || '',
          recommendations: rep.recommendations || '',
          status: rep.status || 'Finalized',
        })),
      ),
      catchError((error) => {
        console.error('Failed to fetch radiology reports:', error);
        return of([] as RadiologyReport[]);
      }),
    );
  }

  getReportsPage(
    facilityId: string | number,
    page: number,
    pageSize: number,
    search = '',
  ): Observable<PageResult<RadiologyReport>> {
    return this.getPagedCollection(
      `${this.baseUrl}/reports/`,
      facilityId,
      page,
      pageSize,
      search,
      (report) => ({
        orderId:
          report.orderRequestId || report.orderId || report.order_id || '',
        patient: report.patient || '',
        patientId: report.patientId,
        type: report.studyName || report.type || '',
        scanDate: report.scanDate || report.scan_date || '',
        radiologist: report.radiologist || '',
        findings: report.findings || '',
        impression: report.impression || '',
        recommendations: report.recommendations || '',
        status: report.status || 'Finalized',
      }),
    );
  }

  getReportsForOrder(
    facilityId: string | number,
    orderId: string,
  ): Observable<RadiologyReport[]> {
    const params = new HttpParams()
      .set('facilityId', String(facilityId))
      .set('orderId', orderId)
      .set('page', '1')
      .set('page_size', '25');

    return this.http
      .get<unknown>(`${this.baseUrl}/reports/`, { params })
      .pipe(
        map((response) =>
          this.extractCollection<RadiologyReportApiModel>(
            response as
              | ApiResponse<RadiologyReportApiModel[]>
              | RadiologyReportApiModel[],
          ).map((report) => ({
            orderId:
              report.orderRequestId ||
              report.orderId ||
              report.order_id ||
              '',
            patient: report.patient || '',
            patientId: report.patientId,
            type: report.studyName || report.type || '',
            scanDate: report.scanDate || report.scan_date || '',
            radiologist: report.radiologist || '',
            findings: report.findings || '',
            impression: report.impression || '',
            recommendations: report.recommendations || '',
            status: report.status || 'Finalized',
          })),
        ),
      );
  }

  private getPagedCollection<T>(
    endpoint: string,
    facilityId: string | number,
    page: number,
    pageSize: number,
    search: string,
    mapItem: (item: any) => T,
  ): Observable<PageResult<T>> {
    let params = new HttpParams()
      .set('facilityId', String(facilityId))
      .set('page', String(page))
      .set('page_size', String(pageSize));
    if (search.trim()) params = params.set('search', search.trim());

    return this.http.get<unknown>(endpoint, { params }).pipe(
      map((response) => {
        const normalized = normalizePageResult<any>(response, {
          page,
          pageSize,
        });
        return { ...normalized, items: normalized.items.map(mapItem) };
      }),
    );
  }

  // ---------- Uploaded Images ----------
  getUploadedImages(facilityId: string | number, orderId: string): Observable<UploadedRadiologyImage[]> {
    return this.http.get<ApiResponse<any[]> | any[]>(`${this.baseUrl}/images/?facilityId=${facilityId}&orderId=${orderId}`).pipe(
      map((response) => this.extractCollection(response)),
      map((images) =>
        images.map((img) => ({
          id: String(img.id),
          orderId: img.orderRequestId || img.orderId || orderId,
          name: img.name,
          url: img.url,
          source: img.source || 'uploaded',
          uploadedAt: img.uploadedAt || img.created_at || new Date().toISOString(),
        })),
      ),
      catchError((error) => {
        console.error('Failed to fetch uploaded images:', error);
        return of([] as UploadedRadiologyImage[]);
      }),
    );
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // ---------- Upload images ----------
  uploadImages(payload: UploadRadiologyImagesPayload, facilityId: string | number): Observable<any> {
    if (!payload.files || payload.files.length === 0) {
      return of([]);
    }

    const uploadPromises = payload.files.map(async (file) => {
      const dataUrl = await this.fileToDataUrl(file);
      const body = {
        orderId: payload.orderId,
        name: file.name,
        url: dataUrl,
        source: file.name.startsWith('camera-capture-') ? 'camera' : 'uploaded',
      };
      return this.http.post(`${this.baseUrl}/images/?facilityId=${facilityId}`, body).toPromise();
    });

    return from(Promise.all(uploadPromises));
  }

  // ---------- Create a new imaging order ----------
  createOrder(payload: CreateImagingOrderPayload, facilityId: string | number): Observable<RadiologyOrder> {
    const body = {
      patientId: payload.patientId.trim(),
      patient: payload.patient.trim(),
      ...(payload.ticketNumber ? { ticketNumber: payload.ticketNumber.trim() } : {}),
      studyId: payload.imagingTypeId,
      orderedBy: payload.orderedBy.trim(),
      priority: payload.priority,
      notes: payload.clinicalNotes.trim(),
    };
    return this.http.post<RadiologyOrder>(`${this.baseUrl}/requests/?facilityId=${facilityId}`, body);
  }

  // ---------- Change order status (schedule) ----------
  scheduleOrder(orderId: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/requests/${orderId}/schedule/`, { status: 'In Progress' });
  }

  // ---------- Create a radiology report ----------
  createReport(payload: CreateRadiologyReportPayload, facilityId: string | number): Observable<RadiologyReport> {
    const body = {
      orderId: payload.orderId,
      radiologist: payload.radiologist.trim(),
      scanDate: payload.scanDate,
      findings: payload.findings.trim(),
      impression: payload.impression.trim(),
      recommendations: payload.recommendations.trim(),
    };
    return this.http.post<RadiologyReport>(`${this.baseUrl}/reports/?facilityId=${facilityId}`, body);
  }
}
