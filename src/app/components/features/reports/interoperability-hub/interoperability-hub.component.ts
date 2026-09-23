import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  LucideAngularModule,
  Network,
  CheckCircle2,
  Cpu,
  Layers,
  FileCode,
  Download,
  Send,
  RefreshCw,
  Database,
  BarChart2,
  FileCheck,
} from 'lucide-angular';
import { HieService } from '../../../../services/hie.service';
import { PatientsService } from '../../../../services/patients.service';
import { SurveillanceService } from '../../../../services/surveillance.service';
import { Patient, VisitHistory } from '../../../../models/patients.models';
import { IdsrWeeklyReport } from '../../../../models/reports.models';
import {
  FhirBundleSummary,
  HieConnectionStatus,
  HieSyncLog,
  InteroperabilityLevelInfo,
  MedicalTerminologyStandard,
  QualityMeasureItem,
} from '../../../../models/interoperability.models';

@Component({
  selector: 'app-interoperability-hub',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    MatSnackBarModule,
    LucideAngularModule,
  ],
  templateUrl: './interoperability-hub.component.html',
  styleUrl: './interoperability-hub.component.css',
})
export class InteroperabilityHubComponent implements OnInit {
  private readonly hieService = inject(HieService);
  private readonly patientsService = inject(PatientsService);
  private readonly surveillanceService = inject(SurveillanceService);
  private readonly snackBar = inject(MatSnackBar);

  readonly Network = Network;
  readonly CheckCircle2 = CheckCircle2;
  readonly Cpu = Cpu;
  readonly Layers = Layers;
  readonly FileCode = FileCode;
  readonly Download = Download;
  readonly Send = Send;
  readonly RefreshCw = RefreshCw;
  readonly Database = Database;
  readonly BarChart2 = BarChart2;
  readonly FileCheck = FileCheck;

  hieStatus: HieConnectionStatus = 'DISCONNECTED';
  hieLatency = 0;
  hieEndpoint = 'https://hie.health.go.ke/api/v1/fhir';
  mflCode = '';
  isTesting = false;

  maturityLevels: InteroperabilityLevelInfo[] = [];
  terminologyStandards: MedicalTerminologyStandard[] = [];
  qualityMeasures: QualityMeasureItem[] = [];
  syncLogs: HieSyncLog[] = [];

  sampleFhirBundle: FhirBundleSummary | null = null;
  sampleSdmxJson = '';
  private idsrReport: IdsrWeeklyReport | null = null;

  facilityId: string | number = '';
  patients: Patient[] = [];
  selectedPatientId = '';

  ngOnInit(): void {
    this.facilityId =
      JSON.parse(localStorage.getItem('afyora.user') || 'null')?.facility || '';
    this.loadHieData();
    this.loadPatients();
  }

  loadHieData(): void {
    this.hieService.checkHieConnectivity(this.facilityId).subscribe((res) => {
      this.hieStatus = res.status;
      this.hieLatency = res.latencyMs;
      this.hieEndpoint = res.hieEndpoint;
      this.mflCode = res.mflCode;
    });

    this.hieService.getMaturityLevels(this.facilityId).subscribe((levels) => {
      this.maturityLevels = levels;
    });

    this.hieService
      .getTerminologyStandards(this.facilityId)
      .subscribe((stds) => {
        this.terminologyStandards = stds;
      });

    this.hieService.getQualityMeasures(this.facilityId).subscribe((qm) => {
      this.qualityMeasures = qm;
    });

    this.hieService.getSyncLogs(this.facilityId).subscribe((logs) => {
      this.syncLogs = logs;
    });

    this.surveillanceService.getIdsrWeeklyReport().subscribe((report) => {
      this.idsrReport = report;
      this.generateSampleSdmx();
    });
  }

  private loadPatients(): void {
    this.patientsService.getPatients(this.facilityId).subscribe({
      next: (patients) => {
        this.patients = patients;
        if (patients.length > 0) {
          this.selectedPatientId = patients[0].id;
          this.onPatientSelected(this.selectedPatientId);
        }
      },
      error: () => {
        this.patients = [];
      },
    });
  }

  onPatientSelected(patientId: string): void {
    const patient = this.patients.find((p) => p.id === patientId);
    if (!patient) return;

    this.patientsService
      .getPatientVisitHistory(patientId, this.facilityId)
      .subscribe({
        next: (history: VisitHistory[]) => {
          this.hieService
            .generateFhirPatientBundle(this.facilityId, patient, history[0])
            .subscribe((bundle) => (this.sampleFhirBundle = bundle));
        },
        error: () => {
          this.hieService
            .generateFhirPatientBundle(this.facilityId, patient)
            .subscribe((bundle) => (this.sampleFhirBundle = bundle));
        },
      });
  }

  pingHieEndpoint(): void {
    this.isTesting = true;
    this.hieService.pingHieConnection(this.facilityId).subscribe({
      next: (res) => {
        this.isTesting = false;
        this.hieStatus = res.status;
        this.hieLatency = res.latencyMs;
        this.snackBar.open(
          `Kenya HIE Connection Verified! Latency: ${this.hieLatency}ms`,
          'OK',
          { duration: 3500 },
        );
      },
      error: () => {
        this.isTesting = false;
        this.snackBar.open('Unable to reach the Kenya HIE gateway.', 'OK', {
          duration: 3500,
        });
      },
    });
  }

  generateSampleFhir(): void {
    if (this.selectedPatientId) {
      this.onPatientSelected(this.selectedPatientId);
    }
  }

  generateSampleSdmx(): void {
    this.hieService
      .generateSdmxHDExport(
        this.facilityId,
        this.mflCode || 'MFL-UNASSIGNED',
        this.idsrReport,
      )
      .subscribe((sdmxPayload) => {
        this.sampleSdmxJson = JSON.stringify(sdmxPayload, null, 2);
      });
  }

  submitQualityMeasuresToDha(): void {
    this.hieService
      .submitQualityMeasures(this.facilityId, this.qualityMeasures)
      .subscribe((res) => {
        this.snackBar.open(
          `National Quality Indicators submitted to DHA Quality Portal! ID: ${res.submissionId}`,
          'OK',
          {
            duration: 4000,
            panelClass: ['bg-emerald-700', 'text-white'],
          },
        );
      });
  }

  downloadPayload(type: string, content: string): void {
    this.snackBar.open(`Downloading ${type} document payload...`, 'OK', {
      duration: 3000,
    });
  }
}
