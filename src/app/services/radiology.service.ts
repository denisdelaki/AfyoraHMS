import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  CreateImagingOrderPayload,
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
  private readonly uploadedImagesByOrder = new Map<
    string,
    UploadedRadiologyImage[]
  >([
    [
      'RAD-003',
      [
        this.createSeededImage('RAD-003', 'CT Abdomen - Axial View', '#1d4ed8'),
        this.createSeededImage(
          'RAD-003',
          'CT Abdomen - Coronal View',
          '#059669',
        ),
      ],
    ],
    [
      'RAD-004',
      [
        this.createSeededImage(
          'RAD-004',
          'Ultrasound - Gallbladder View 1',
          '#7c3aed',
        ),
        this.createSeededImage(
          'RAD-004',
          'Ultrasound - Gallbladder View 2',
          '#ea580c',
        ),
      ],
    ],
  ]);

  private readonly imagingTypesSubject = new BehaviorSubject<ImagingType[]>([
    { id: 'IMG001', name: 'X-Ray', duration: '15 min', price: 150 },
    { id: 'IMG002', name: 'CT Scan', duration: '30 min', price: 500 },
    { id: 'IMG003', name: 'MRI', duration: '45 min', price: 800 },
    { id: 'IMG004', name: 'Ultrasound', duration: '20 min', price: 200 },
    { id: 'IMG005', name: 'Mammography', duration: '25 min', price: 250 },
  ]);

  private readonly ordersSubject = new BehaviorSubject<RadiologyOrder[]>([
    {
      id: 'RAD-001',
      patient: 'John Smith',
      patientId: 'P001',
      type: 'Chest X-Ray',
      orderedBy: 'Dr. Emily Chen',
      orderDate: '2024-02-24',
      scheduledDate: '2024-02-24',
      status: 'Pending',
      priority: 'Routine',
      clinicalNotes: 'Suspected pneumonia, check for infiltrates',
    },
    {
      id: 'RAD-002',
      patient: 'Sarah Johnson',
      patientId: 'P002',
      type: 'MRI Brain',
      orderedBy: 'Dr. James Wilson',
      orderDate: '2024-02-23',
      scheduledDate: '2024-02-25',
      status: 'Scheduled',
      priority: 'Urgent',
      clinicalNotes: 'Persistent headaches, rule out mass',
    },
    {
      id: 'RAD-003',
      patient: 'Michael Brown',
      patientId: 'P003',
      type: 'CT Scan Abdomen',
      orderedBy: 'Dr. Robert Taylor',
      orderDate: '2024-02-22',
      scheduledDate: '2024-02-22',
      status: 'Completed',
      priority: 'Routine',
      clinicalNotes: 'Abdominal pain, check for appendicitis',
    },
    {
      id: 'RAD-004',
      patient: 'Emma Davis',
      patientId: 'P004',
      type: 'Ultrasound Abdomen',
      orderedBy: 'Dr. Emily Chen',
      orderDate: '2024-02-23',
      scheduledDate: '2024-02-23',
      status: 'Report Ready',
      priority: 'Routine',
      clinicalNotes: 'Gallbladder evaluation',
    },
  ]);

  private readonly reportsSubject = new BehaviorSubject<RadiologyReport[]>([
    {
      orderId: 'RAD-003',
      patient: 'Michael Brown',
      type: 'CT Scan Abdomen',
      scanDate: '2024-02-22',
      radiologist: 'Dr. Sarah Park',
      findings:
        'No evidence of acute appendicitis. Normal appearance of liver, spleen, pancreas, and kidneys. No free fluid or abnormal masses detected.',
      impression: 'Normal CT scan of the abdomen and pelvis.',
      recommendations: 'No further imaging required at this time.',
      status: 'Finalized',
    },
    {
      orderId: 'RAD-004',
      patient: 'Emma Davis',
      type: 'Ultrasound Abdomen',
      scanDate: '2024-02-23',
      radiologist: 'Dr. Michael Lee',
      findings:
        'Gallbladder shows multiple small gallstones. No evidence of cholecystitis. Liver and common bile duct appear normal.',
      impression: 'Cholelithiasis (gallstones) without acute inflammation.',
      recommendations:
        'Surgical consultation recommended for symptomatic management.',
      status: 'Finalized',
    },
  ]);

  getImagingTypes() {
    return this.imagingTypesSubject.asObservable();
  }

  getOrders() {
    return this.ordersSubject.asObservable();
  }

  getReports() {
    return this.reportsSubject.asObservable();
  }

  getUploadedImages(orderId: string) {
    return [...(this.uploadedImagesByOrder.get(orderId) ?? [])];
  }

  createOrder(payload: CreateImagingOrderPayload) {
    const selectedType = this.imagingTypesSubject.value.find(
      (item) => item.id === payload.imagingTypeId,
    );
    if (!selectedType) {
      return;
    }

    const nextId = `RAD-${String(this.ordersSubject.value.length + 1).padStart(3, '0')}`;
    const orderDate = new Date().toISOString().slice(0, 10);

    const order: RadiologyOrder = {
      id: nextId,
      patient: payload.patient.trim(),
      patientId: payload.patientId.trim(),
      type: selectedType.name,
      orderedBy: payload.orderedBy.trim(),
      orderDate,
      scheduledDate: payload.scheduledDate,
      status: 'Pending',
      priority: payload.priority,
      clinicalNotes: payload.clinicalNotes.trim(),
    };

    this.ordersSubject.next([order, ...this.ordersSubject.value]);
  }

  scheduleOrder(orderId: string) {
    this.ordersSubject.next(
      this.ordersSubject.value.map((order) =>
        order.id === orderId ? { ...order, status: 'Scheduled' } : order,
      ),
    );
  }

  uploadImages(payload: UploadRadiologyImagesPayload) {
    if (payload.files.length > 0) {
      const existingImages =
        this.uploadedImagesByOrder.get(payload.orderId) ?? [];
      const uploadedAt = new Date().toISOString();

      const uploadedImages: UploadedRadiologyImage[] = payload.files.map(
        (file, index) => ({
          id: `${payload.orderId}-${Date.now()}-${index}`,
          orderId: payload.orderId,
          name: file.name,
          url: URL.createObjectURL(file),
          source: file.name.startsWith('camera-capture-')
            ? 'camera'
            : 'uploaded',
          uploadedAt,
        }),
      );

      this.uploadedImagesByOrder.set(payload.orderId, [
        ...uploadedImages,
        ...existingImages,
      ]);
    }

    this.ordersSubject.next(
      this.ordersSubject.value.map((order) =>
        order.id === payload.orderId
          ? { ...order, status: 'Completed' }
          : order,
      ),
    );
  }

  createReport(payload: CreateRadiologyReportPayload) {
    const order = this.ordersSubject.value.find(
      (item) => item.id === payload.orderId,
    );
    if (!order) {
      return;
    }

    this.ordersSubject.next(
      this.ordersSubject.value.map((item) =>
        item.id === payload.orderId
          ? { ...item, status: 'Report Ready' }
          : item,
      ),
    );

    const report: RadiologyReport = {
      orderId: payload.orderId,
      patient: order.patient,
      type: order.type,
      scanDate: order.scheduledDate,
      radiologist: payload.radiologist.trim(),
      findings: payload.findings.trim(),
      impression: payload.impression.trim(),
      recommendations: payload.recommendations.trim(),
      status: 'Finalized',
    };

    const existingReport = this.reportsSubject.value.find(
      (item) => item.orderId === payload.orderId,
    );

    if (existingReport) {
      this.reportsSubject.next(
        this.reportsSubject.value.map((item) =>
          item.orderId === payload.orderId ? report : item,
        ),
      );
      return;
    }

    this.reportsSubject.next([report, ...this.reportsSubject.value]);
  }

  private createSeededImage(orderId: string, title: string, color: string) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">
        <rect width="100%" height="100%" fill="#0f172a" />
        <circle cx="450" cy="300" r="170" fill="${color}" opacity="0.75" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#e2e8f0" font-size="36" font-family="Arial, sans-serif">${title}</text>
      </svg>
    `;

    const encoded = encodeURIComponent(svg.trim());

    return {
      id: `${orderId}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      orderId,
      name: `${title}.svg`,
      url: `data:image/svg+xml;charset=UTF-8,${encoded}`,
      source: 'seeded' as const,
      uploadedAt: '2024-02-24T10:00:00.000Z',
    };
  }
}
