import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, from } from 'rxjs';
import { apiUrl } from '../core/api.config';
import { ApiResponse } from '../models/api.models';
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

  // ---------- Reports ----------
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
