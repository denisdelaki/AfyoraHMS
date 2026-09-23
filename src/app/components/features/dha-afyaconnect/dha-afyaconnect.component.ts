import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, Shield, Search, CheckCircle2, AlertCircle, Ticket, CreditCard,
  Pill, FileText, Activity, UserPlus, RefreshCw, Send, Lock, FileCheck, Stethoscope, AlertTriangle, Users
} from 'lucide-angular';
import { DhaAfyaConnectService } from '../../../services/dha-afyaconnect.service';
import { PatientsService } from '../../../services/patients.service';
import { FacilityService } from '../../../services/facility.service';
import { Patient } from '../../../models/patients.models';
import { FacilityProfile } from '../../../models/facility.model';
import {
  SHAEligibilityResult, DHAAuthorization, DHAClaim, DHAPrescription,
  BedOccupancyData, PayerUtilizationBalance, DHALog
} from '../../../models/dha-connect.models';

@Component({
  selector: 'app-dha-afyaconnect',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './dha-afyaconnect.component.html',
  styleUrl: './dha-afyaconnect.component.css'
})
export class DhaAfyaConnectComponent implements OnInit {
  private readonly dhaService = inject(DhaAfyaConnectService);
  private readonly patientsService = inject(PatientsService);
  private readonly facilityService = inject(FacilityService);

  readonly Shield = Shield;
  readonly Search = Search;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;
  readonly Ticket = Ticket;
  readonly CreditCard = CreditCard;
  readonly Pill = Pill;
  readonly FileText = FileText;
  readonly Activity = Activity;
  readonly UserPlus = UserPlus;
  readonly RefreshCw = RefreshCw;
  readonly Send = Send;
  readonly Lock = Lock;
  readonly FileCheck = FileCheck;
  readonly Stethoscope = Stethoscope;
  readonly AlertTriangle = AlertTriangle;
  readonly Users = Users;

  activeTab: 'eligibility' | 'auth' | 'claims' | 'billing' | 'prescriptions' | 'discharge' | 'emergency' | 'logs' = 'eligibility';

  // Dynamic Patients & Facility Context
  patients: Patient[] = [];
  selectedPatient: Patient | null = null;
  facilityProfile: FacilityProfile | null = null;
  facilityCode = '';

  // 1. Eligibility Search Form
  eligibilityQuery = { id_number: '', id_type: 'National ID' };
  eligibilityResult: SHAEligibilityResult | null = null;
  benefitsList: any[] = [];
  utilizationData: PayerUtilizationBalance | null = null;
  bedOccupancy: BedOccupancyData | null = null;
  loadingEligibility = false;

  // 2. Authorizations Form
  authForm = {
    patient_id: '',
    patient_name: '',
    service_type: 'OUTPATIENT' as 'OUTPATIENT' | 'INPATIENT',
    otp: '',
    interventions: [] as string[]
  };
  interventionsInput = '';
  createdAuth: DHAAuthorization | null = null;
  lookupAuthToken = '';
  lookupAuthGuid = '';

  // 3. Virtual Claim Visit Form
  visitForm = {
    patient_id: '',
    service_type: 'OUTPATIENT' as 'CAPITATION' | 'OUTPATIENT' | 'INPATIENT' | 'EMERGENCY',
    otp: '',
    intervention_codes: [] as string[]
  };
  visitInterventionsInput = '';
  activeClaim: DHAClaim | null = null;

  // 4. Billing, Diagnoses & Lines Form
  consentToken = '';
  diagnosisForm = { icd_code: '', intervention_code: '', facilityID: '' };
  lineItemForm = { intervention_code: '', unit_price: 0, quantity: 1, scheme_code: '' };
  editLineForm = { line_id: '', unit_price: 0, quantity: 1, scheme_code: '' };
  attachmentForm = { intervention_code: '', document_type: 'CASE_SUMMARY' };

  // 5. Prescriptions Form
  rxForm = {
    intervention_code: '',
    identification_number: '',
    identification_type: 'registration_number',
    regulation_body: 'KMPDC',
    items: [] as any[]
  };
  newRxItem = { drug_name: '', dosage: '', quantity: 1 };

  dispenseForm = {
    intervention_code: '',
    actual_products: [] as any[],
    doctors: [] as any[]
  };
  newDispenseProduct = { code: '', name: '', qty: 1 };
  newDispenseDoctor = { registration_number: '', name: '' };
  rxPreview: DHAPrescription | null = null;

  // 6. Discharge & Claim Submit Form
  dischargeOtpForm = { patient_id: '' };
  dischargeForm = {
    discharge_date: new Date().toISOString().split('T')[0],
    discharge_reason: 'RECOVERED' as 'RECOVERED' | 'REFERRED' | 'DECEASED' | 'ABSCONDED' | 'OTHER',
    invoice_number: '',
    otp: ''
  };

  closeClaimForm = {
    cancel_reason_type: 'WRONG_BENEFIT' as 'WRONG_PATIENT' | 'NO_SERVICE_GIVEN' | 'WRONG_BENEFIT' | 'EXPIRED_VISIT' | 'EXHAUSTED_BENEFIT' | 'OTHER',
    cancel_reason_text: ''
  };
  submitClaimForm = { invoice_number: '', reason_for_unknown_patient: '' };

  // 7. Emergency Case Form
  emergencyForm = {
    reference_number: '',
    brought_by: 'PARAMEDICS' as 'RELATIVE' | 'UNKNOWN' | 'SAMARITAN' | 'PARAMEDICS',
    identification_number: '',
    identification_type: 'National ID',
    mode_of_arrival: 'AMBULANCE' as 'AMBULANCE' | 'WALK-IN' | 'OTHER',
    regulation_body: 'KMPDC',
    interventions: [] as string[],
    notes: ''
  };
  emergencyInterventionsInput = '';

  emtForm = {
    protocol_code: '',
    case_number: '',
    practitioner_reg_number: '',
    beneficiary_cr_id: '',
    otp: '',
    provider_registration_number: '',
    diagnoses: '[]',
    interventions: '[]'
  };
  emergencyProtocols: any[] = [];

  // Audit Logs
  auditLogs: DHALog[] = [];
  loadingLogs = false;

  // Alerts & Toasts
  toast: { type: 'success' | 'danger' | 'info'; text: string } | null = null;

  ngOnInit(): void {
    this.loadFacilityAndPatients();
    this.fetchAuditLogs();
  }

  showToast(type: 'success' | 'danger' | 'info', text: string): void {
    this.toast = { type, text };
    setTimeout(() => { this.toast = null; }, 5000);
  }

  loadFacilityAndPatients(): void {
    this.facilityService.getMyFacility().subscribe({
      next: (fac) => {
        if (fac) {
          this.facilityProfile = fac;
          this.facilityCode = (fac as any).code || `FAC-${fac.id || '001'}`;
          this.diagnosisForm.facilityID = this.facilityCode;
          if (this.facilityCode) {
            this.fetchBedOccupancy();
          }
          if (fac.id) {
            this.loadPatients(fac.id);
          }
        }
      },
      error: () => {
        this.facilityCode = 'MOH-FAC-001';
        this.diagnosisForm.facilityID = this.facilityCode;
        this.loadPatients(1);
        this.fetchBedOccupancy();
      }
    });
  }

  loadPatients(facilityId: string | number): void {
    this.patientsService.getPatients(facilityId).subscribe({
      next: (data) => {
        this.patients = Array.isArray(data) ? data : [];
      }
    });
  }

  onSelectPatient(patientId: string): void {
    if (!patientId) {
      this.selectedPatient = null;
      return;
    }
    const patient = this.patients.find(p => p.id === patientId || p.nationalId === patientId);
    if (!patient) return;
    this.selectedPatient = patient;

    const idVal = patient.nationalId || patient.passportNumber || patient.birthCertificateNumber || patient.id;
    const fullName = `${patient.firstName} ${patient.lastName}`;

    this.eligibilityQuery.id_number = idVal;
    this.authForm.patient_id = patient.id;
    this.authForm.patient_name = fullName;
    this.visitForm.patient_id = patient.id;
    this.dischargeOtpForm.patient_id = patient.id;
    this.emergencyForm.identification_number = idVal;
    this.emtForm.beneficiary_cr_id = patient.id;

    this.showToast('info', `Selected Patient: ${fullName} (ID/CR: ${idVal})`);
  }

  // ------------------------------------------------------------------
  // 1. ELIGIBILITY & BENEFITS
  // ------------------------------------------------------------------
  runEligibilityCheck(): void {
    if (!this.eligibilityQuery.id_number.trim()) {
      this.showToast('danger', 'Please enter a Patient Identification Number or National ID.');
      return;
    }
    this.loadingEligibility = true;
    this.dhaService.checkEligibility(this.eligibilityQuery.id_number, this.eligibilityQuery.id_type).subscribe({
      next: (res) => {
        this.eligibilityResult = res;
        this.loadingEligibility = false;
        this.showToast('success', 'SHA Beneficiary Eligibility Verified Successfully.');
        this.fetchBenefitsList();
        this.fetchUtilization();
      },
      error: () => {
        this.loadingEligibility = false;
        this.showToast('danger', 'Error verifying SHA Eligibility.');
      }
    });
  }

  fetchBenefitsList(): void {
    if (!this.eligibilityQuery.id_number) return;
    this.dhaService.getPatientBenefits(this.eligibilityQuery.id_number).subscribe({
      next: (res) => {
        this.benefitsList = res.results || (Array.isArray(res) ? res : []);
      }
    });
  }

  fetchUtilization(): void {
    if (!this.eligibilityQuery.id_number) return;
    const interventionCode = this.diagnosisForm.intervention_code || 'INT-CONS-01';
    this.dhaService.getUtilizationBalances(this.eligibilityQuery.id_number, interventionCode).subscribe({
      next: (res) => {
        this.utilizationData = res;
      }
    });
  }

  fetchBedOccupancy(): void {
    if (!this.facilityCode) return;
    this.dhaService.getFacilityBedOccupancy(this.facilityCode).subscribe({
      next: (res) => {
        this.bedOccupancy = res;
      }
    });
  }

  // ------------------------------------------------------------------
  // 2. AUTHORIZATIONS
  // ------------------------------------------------------------------
  submitAuthorization(): void {
    if (!this.authForm.patient_id || !this.authForm.otp) {
      this.showToast('danger', 'Please enter Patient ID and OTP consent code.');
      return;
    }
    if (this.interventionsInput) {
      this.authForm.interventions = this.interventionsInput.split(',').map(s => s.trim()).filter(Boolean);
    }
    this.dhaService.createAuthorization(this.authForm).subscribe({
      next: (res) => {
        this.createdAuth = res;
        if (res.token) {
          this.consentToken = res.token;
        }
        this.showToast('success', `Authorization Created! Auth Code: ${res.authCode || 'APPROVED'}`);
      },
      error: () => this.showToast('danger', 'Failed to create authorization.')
    });
  }

  queryAuthorization(): void {
    if (!this.lookupAuthToken || !this.lookupAuthGuid) {
      this.showToast('danger', 'Please enter Token and GUID for authorization lookup.');
      return;
    }
    this.dhaService.getAuthorization(this.lookupAuthToken, this.lookupAuthGuid).subscribe({
      next: (res) => {
        this.createdAuth = res;
        if (res.token) {
          this.consentToken = res.token;
        }
        this.showToast('info', `Authorization retrieved. Status: ${res.status}`);
      }
    });
  }

  rejectCurrentAuth(): void {
    if (!this.consentToken) {
      this.showToast('danger', 'No active Consent Token to reject.');
      return;
    }
    this.dhaService.rejectAuthorization(this.consentToken).subscribe({
      next: () => this.showToast('info', 'Authorization rejected successfully.')
    });
  }

  // ------------------------------------------------------------------
  // 3. VIRTUAL CLAIMS & VISIT
  // ------------------------------------------------------------------
  startVisitClaim(): void {
    if (!this.visitForm.patient_id || !this.visitForm.otp) {
      this.showToast('danger', 'Please enter Beneficiary Patient ID and OTP consent code.');
      return;
    }
    if (this.visitInterventionsInput) {
      this.visitForm.intervention_codes = this.visitInterventionsInput.split(',').map(s => s.trim()).filter(Boolean);
    }
    this.dhaService.startVirtualClaimVisit(this.visitForm).subscribe({
      next: (res) => {
        this.activeClaim = res;
        if (res.authorization_code) {
          this.consentToken = res.authorization_code;
        }
        if (res.invoice_number) {
          this.submitClaimForm.invoice_number = res.invoice_number;
          this.dischargeForm.invoice_number = res.invoice_number;
        }
        this.showToast('success', `Virtual Claim Visit Initiated! Claim Invoice: ${res.invoice_number || 'CREATED'}`);
      },
      error: () => this.showToast('danger', 'Failed to start virtual claim visit.')
    });
  }

  // ------------------------------------------------------------------
  // 4. BILLING & CLAIM ITEMS
  // ------------------------------------------------------------------
  addDiagnosis(): void {
    if (!this.consentToken || !this.diagnosisForm.icd_code) {
      this.showToast('danger', 'Please ensure Consent Token and ICD Code are specified.');
      return;
    }
    this.dhaService.addClaimDiagnosis({
      consent_token: this.consentToken,
      icd_code: this.diagnosisForm.icd_code,
      intervention_code: this.diagnosisForm.intervention_code,
      facilityID: this.diagnosisForm.facilityID || this.facilityCode
    }).subscribe({
      next: () => this.showToast('success', `Diagnosis ICD Code ${this.diagnosisForm.icd_code} added to claim!`)
    });
  }

  addLineItem(): void {
    if (!this.consentToken || !this.lineItemForm.intervention_code) {
      this.showToast('danger', 'Please provide Consent Token and Intervention Code.');
      return;
    }
    this.dhaService.addClaimLineItem({
      consent_token: this.consentToken,
      intervention_code: this.lineItemForm.intervention_code,
      unit_price: this.lineItemForm.unit_price,
      quantity: this.lineItemForm.quantity,
      scheme_code: this.lineItemForm.scheme_code
    }).subscribe({
      next: () => this.showToast('success', 'Claim Line Item added to invoice successfully.')
    });
  }

  editLineItem(): void {
    if (!this.editLineForm.line_id) {
      this.showToast('danger', 'Please enter Line ID to update.');
      return;
    }
    this.dhaService.editClaimLineItem(this.editLineForm).subscribe({
      next: () => this.showToast('success', 'Claim Line Item updated successfully.')
    });
  }

  resubmitClaimLine(): void {
    if (!this.consentToken) {
      this.showToast('danger', 'Please enter a Consent Token.');
      return;
    }
    this.dhaService.resubmitClaimLineItem(this.consentToken).subscribe({
      next: () => this.showToast('info', 'Claim line resubmitted to payer for reprocessing.')
    });
  }

  addAttachment(): void {
    if (!this.consentToken || !this.attachmentForm.intervention_code) {
      this.showToast('danger', 'Please provide Consent Token and Intervention Code.');
      return;
    }
    this.dhaService.addClaimAttachment({
      consent_token: this.consentToken,
      intervention_code: this.attachmentForm.intervention_code,
      document_type: this.attachmentForm.document_type
    }).subscribe({
      next: () => this.showToast('success', `Claim Document ${this.attachmentForm.document_type} attached successfully.`)
    });
  }

  // ------------------------------------------------------------------
  // 5. E-PRESCRIPTIONS & DISPENSES
  // ------------------------------------------------------------------
  addRxItem(): void {
    if (this.newRxItem.drug_name && this.newRxItem.quantity > 0) {
      this.rxForm.items.push({ ...this.newRxItem });
      this.newRxItem = { drug_name: '', dosage: '', quantity: 1 };
    }
  }

  removeRxItem(index: number): void {
    this.rxForm.items.splice(index, 1);
  }

  createRx(): void {
    if (!this.consentToken || !this.rxForm.intervention_code) {
      this.showToast('danger', 'Please enter Consent Token and Intervention Code.');
      return;
    }
    this.dhaService.createPrescription({
      consent_token: this.consentToken,
      intervention_code: this.rxForm.intervention_code,
      identification_number: this.rxForm.identification_number,
      identification_type: this.rxForm.identification_type,
      regulation_body: this.rxForm.regulation_body,
      items: this.rxForm.items
    }).subscribe({
      next: (res) => {
        this.rxPreview = res;
        this.showToast('success', `ePrescription Issued! Code: ${res.code}`);
      }
    });
  }

  addDispenseProduct(): void {
    if (this.newDispenseProduct.name) {
      this.dispenseForm.actual_products.push({ ...this.newDispenseProduct });
      this.newDispenseProduct = { code: '', name: '', qty: 1 };
    }
  }

  addDispenseDoctor(): void {
    if (this.newDispenseDoctor.registration_number) {
      this.dispenseForm.doctors.push({ ...this.newDispenseDoctor });
      this.newDispenseDoctor = { registration_number: '', name: '' };
    }
  }

  recordDispense(): void {
    if (!this.consentToken || !this.dispenseForm.intervention_code) {
      this.showToast('danger', 'Please enter Consent Token and Intervention Code.');
      return;
    }
    this.dhaService.createDispense({
      consent_token: this.consentToken,
      intervention_code: this.dispenseForm.intervention_code,
      actual_products: this.dispenseForm.actual_products,
      doctors: this.dispenseForm.doctors
    }).subscribe({
      next: () => this.showToast('success', 'Prescription drug dispense recorded successfully.')
    });
  }

  // ------------------------------------------------------------------
  // 6. DISCHARGE & DISPATCH
  // ------------------------------------------------------------------
  sendDischargeOtp(): void {
    if (!this.consentToken || !this.dischargeOtpForm.patient_id) {
      this.showToast('danger', 'Please enter Consent Token and Patient ID.');
      return;
    }
    this.dhaService.sendDischargeOtp(this.consentToken, this.dischargeOtpForm.patient_id).subscribe({
      next: () => this.showToast('info', 'Discharge OTP sent to beneficiary phone number.')
    });
  }

  processDischarge(): void {
    if (!this.consentToken || !this.dischargeForm.otp) {
      this.showToast('danger', 'Please enter Consent Token and Discharge OTP.');
      return;
    }
    this.dhaService.dischargeInpatient({
      consent_token: this.consentToken,
      discharge_date: this.dischargeForm.discharge_date,
      discharge_reason: this.dischargeForm.discharge_reason,
      invoice_number: this.dischargeForm.invoice_number,
      otp: this.dischargeForm.otp
    }).subscribe({
      next: () => this.showToast('success', 'Inpatient discharged successfully!')
    });
  }

  closeClaim(): void {
    if (!this.consentToken) {
      this.showToast('danger', 'Please enter Consent Token.');
      return;
    }
    this.dhaService.closeClaim({
      consent_token: this.consentToken,
      cancel_reason_text: this.closeClaimForm.cancel_reason_text,
      cancel_reason_type: this.closeClaimForm.cancel_reason_type
    }).subscribe({
      next: () => this.showToast('info', 'Virtual Claim closed / terminated.')
    });
  }

  submitClaimFinal(): void {
    if (!this.consentToken) {
      this.showToast('danger', 'Please enter Consent Token.');
      return;
    }
    this.dhaService.submitVirtualClaim({
      consent_token: this.consentToken,
      invoice_number: this.submitClaimForm.invoice_number
    }).subscribe({
      next: (res) => {
        this.activeClaim = res;
        this.showToast('success', `Claim Submitted Final to SHA! Status: ${res.workflow_state}`);
      }
    });
  }

  // ------------------------------------------------------------------
  // 7. EMERGENCY & EMT PROTOCOLS
  // ------------------------------------------------------------------
  submitEmergencyClaim(): void {
    if (!this.emergencyForm.reference_number || !this.emergencyForm.identification_number) {
      this.showToast('danger', 'Please provide Emergency Reference Number and Identification Number.');
      return;
    }
    if (this.emergencyInterventionsInput) {
      this.emergencyForm.interventions = this.emergencyInterventionsInput.split(',').map(s => s.trim()).filter(Boolean);
    }
    this.dhaService.createEmergencyCaseClaim(this.emergencyForm).subscribe({
      next: (res) => {
        this.activeClaim = res;
        this.showToast('success', `Emergency Case Claim Registered! Ref: ${this.emergencyForm.reference_number}`);
        this.fetchEmergencyProtocols();
      }
    });
  }

  fetchEmergencyProtocols(): void {
    this.dhaService.getEmergencyProtocols(true, 'INT-EMERG-01').subscribe({
      next: (res) => {
        this.emergencyProtocols = res.results || (Array.isArray(res) ? res : []);
      }
    });
  }

  submitEmtClaim(): void {
    if (!this.emtForm.protocol_code || !this.emtForm.case_number) {
      this.showToast('danger', 'Please enter EMT Protocol Code and Case Number.');
      return;
    }
    this.dhaService.createEMTClaim(this.emtForm).subscribe({
      next: (res) => {
        this.showToast('success', 'EMT Emergency Claim created successfully!');
      }
    });
  }

  // ------------------------------------------------------------------
  // 8. SECURITY AUDIT LOGS
  // ------------------------------------------------------------------
  fetchAuditLogs(): void {
    this.loadingLogs = true;
    this.dhaService.getAuditLogs().subscribe({
      next: (res) => {
        this.auditLogs = res;
        this.loadingLogs = false;
      },
      error: () => this.loadingLogs = false
    });
  }

  selectTab(tab: any): void {
    this.activeTab = tab;
    if (tab === 'logs') {
      this.fetchAuditLogs();
    }
  }
}
