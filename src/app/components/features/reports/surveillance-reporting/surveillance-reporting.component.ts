import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  LucideAngularModule,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Activity,
  Globe,
  FileText,
  Bell,
  CheckCircle,
  Download,
  Send,
  Plus,
  RefreshCw,
} from 'lucide-angular';
import { SurveillanceService } from '../../../../services/surveillance.service';
import {
  IdsrWeeklyReport,
  IhrAssessment,
  NotifiableDiseaseAlert,
  PublicHealthEvent,
  RoutineMohReport,
  SurveillanceComplianceSummary,
} from '../../../../models/reports.models';

@Component({
  selector: 'app-surveillance-reporting',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    MatSnackBarModule,
    LucideAngularModule,
  ],
  templateUrl: './surveillance-reporting.component.html',
  styleUrl: './surveillance-reporting.component.css',
})
export class SurveillanceReportingComponent implements OnInit {
  private readonly surveillanceService = inject(SurveillanceService);
  private readonly snackBar = inject(MatSnackBar);

  readonly ShieldCheck = ShieldCheck;
  readonly AlertTriangle = AlertTriangle;
  readonly FileSpreadsheet = FileSpreadsheet;
  readonly Activity = Activity;
  readonly Globe = Globe;
  readonly FileText = FileText;
  readonly Bell = Bell;
  readonly CheckCircle = CheckCircle;
  readonly Download = Download;
  readonly Send = Send;
  readonly Plus = Plus;
  readonly RefreshCw = RefreshCw;

  complianceSummary: SurveillanceComplianceSummary | null = null;
  notifiableAlerts: NotifiableDiseaseAlert[] = [];
  idsrReport: IdsrWeeklyReport | null = null;
  publicEvents: PublicHealthEvent[] = [];
  routineReport: RoutineMohReport | null = null;

  selectedEpiWeek = 37;
  selectedYear = 2026;
  selectedRoutineForm: 'MOH_705A' | 'MOH_705B' | 'MOH_711' | 'MOH_717' = 'MOH_705A';

  // New Disease Alert Form
  showNewAlertModal = false;
  newAlertData = {
    diseaseName: 'Cholera (Vibrio cholerae)',
    icdCode: 'A00',
    patientName: '',
    age: 25,
    gender: 'Male',
    subCounty: 'Nairobi West',
    urgency: 'CRITICAL' as 'CRITICAL' | 'HIGH' | 'MEDIUM',
    actionTaken: 'Patient isolated in holding ward. Water source testing initiated.',
  };

  // IHR Assessment Checklist
  ihrForm = {
    isSerious: true,
    isUnusual: true,
    isInternationalSpread: false,
    isTradeTravelRestriction: false,
  };
  ihrResult: IhrAssessment | null = null;

  idsrColumns = [
    'diseaseCode',
    'diseaseName',
    'casesUnder5',
    'deathsUnder5',
    'casesOver5',
    'deathsOver5',
    'totalCases',
    'totalDeaths',
    'labConfirmed',
  ];

  ngOnInit(): void {
    this.loadAllSurveillanceData();
    this.reEvaluateIhr();
  }

  loadAllSurveillanceData(): void {
    this.surveillanceService.getSurveillanceSummary().subscribe((data) => {
      this.complianceSummary = data;
    });

    this.surveillanceService.getNotifiableAlerts().subscribe((data) => {
      this.notifiableAlerts = data;
    });

    this.surveillanceService.getIdsrWeeklyReport(this.selectedEpiWeek, this.selectedYear).subscribe((data) => {
      this.idsrReport = data;
    });

    this.surveillanceService.getPublicHealthEvents().subscribe((data) => {
      this.publicEvents = data;
    });

    this.loadRoutineReport();
  }

  loadRoutineReport(): void {
    this.surveillanceService.getRoutineMohReport(this.selectedRoutineForm).subscribe((data) => {
      this.routineReport = data;
    });
  }

  openAlertModal(): void {
    this.showNewAlertModal = true;
  }

  closeAlertModal(): void {
    this.showNewAlertModal = false;
  }

  submitNewDiseaseAlert(): void {
    if (!this.newAlertData.patientName) {
      this.snackBar.open('Please enter patient name for outbreak alert', 'Close', { duration: 3000 });
      return;
    }

    this.surveillanceService.triggerDiseaseAlert(this.newAlertData).subscribe((newAlert) => {
      this.notifiableAlerts.unshift(newAlert);
      this.showNewAlertModal = false;
      this.snackBar.open(`REAL-TIME MOH ALERT DISPATCHED: ${newAlert.diseaseName} logged and notified!`, 'OK', {
        duration: 5000,
        panelClass: ['bg-emerald-600', 'text-white'],
      });
    });
  }

  submitIdsrWeekly(): void {
    if (!this.idsrReport) return;
    this.idsrReport.status = 'SUBMITTED';
    this.idsrReport.submissionDate = new Date().toLocaleString();
    this.snackBar.open(
      `EPI Week ${this.idsrReport.epiWeek} IDSR 504 Weekly Report successfully transmitted to MOH / KHIS!`,
      'Dismiss',
      { duration: 4000 }
    );
  }

  reEvaluateIhr(): void {
    this.ihrResult = this.surveillanceService.evaluateIhrDecisionInstrument({
      isPublicHealthImpactSerious: this.ihrForm.isSerious,
      isEventUnusualOrUnexpected: this.ihrForm.isUnusual,
      isSignificantRiskOfInternationalSpread: this.ihrForm.isInternationalSpread,
      isSignificantRiskOfTravelOrTradeRestrictions: this.ihrForm.isTradeTravelRestriction,
      evaluatedBy: 'Public Health Surveillance Officer',
    });
  }

  exportReport(type: string): void {
    this.snackBar.open(`Exporting ${type} report payload... Download complete.`, 'OK', { duration: 3000 });
  }
}
