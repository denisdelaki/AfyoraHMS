import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiUrl } from '../core/api.config';
import {
  InsuranceProvider,
  SHAEligibilityResult,
  PatientBenefit,
  BenefitIntervention,
  PayerUtilizationBalance,
  BedOccupancyData,
  DHAAuthorization,
  DHAClaim,
  DHAPrescription,
  DHAEmergencyProtocol,
  DHALog
} from '../models/dha-connect.models';

@Injectable({
  providedIn: 'root'
})
export class DhaAfyaConnectService {
  private readonly http = inject(HttpClient);

  // ------------------------------------------------------------------
  // 1. INSURANCE PROVIDER ONBOARDING (Facility Admin)
  // ------------------------------------------------------------------
  getInsuranceProviders(): Observable<InsuranceProvider[]> {
    return this.http.get<any>(apiUrl('dha/insurance-providers/')).pipe(
      map((res: any) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.results)) return res.results;
        if (res && Array.isArray(res.data)) return res.data;
        return [];
      })
    );
  }

  createInsuranceProvider(provider: Partial<InsuranceProvider>): Observable<InsuranceProvider> {
    return this.http.post<InsuranceProvider>(apiUrl('dha/insurance-providers/'), provider);
  }

  updateInsuranceProvider(id: number, provider: Partial<InsuranceProvider>): Observable<InsuranceProvider> {
    return this.http.patch<InsuranceProvider>(apiUrl(`dha/insurance-providers/${id}/`), provider);
  }

  deleteInsuranceProvider(id: number): Observable<void> {
    return this.http.delete<void>(apiUrl(`dha/insurance-providers/${id}/`));
  }

  pingInsuranceGateway(id: number): Observable<any> {
    return this.http.post<any>(apiUrl(`dha/insurance-providers/${id}/ping/`), {});
  }

  // ------------------------------------------------------------------
  // 2. BENEFIT & ELIGIBILITY ENQUIRIES
  // ------------------------------------------------------------------
  checkEligibility(idNumber: string, idType: string = 'National ID'): Observable<SHAEligibilityResult> {
    const params = new HttpParams()
      .set('identification_number', idNumber)
      .set('identification_type', idType);
    return this.http.get<SHAEligibilityResult>(apiUrl('dha/eligibility/'), { params });
  }

  getPatientBenefits(patientId: string): Observable<any> {
    const params = new HttpParams().set('patient_id', patientId);
    return this.http.get<any>(apiUrl('dha/benefits/'), { params });
  }

  getInterventionsCoverage(patientId: string, subBenefitCode: string): Observable<any> {
    const params = new HttpParams()
      .set('patient_id', patientId)
      .set('sub_benefit_code', subBenefitCode);
    return this.http.get<any>(apiUrl('dha/benefits/interventions/'), { params });
  }

  getUtilizationBalances(patientId: string, interventionCode: string): Observable<PayerUtilizationBalance> {
    const params = new HttpParams()
      .set('patient_id', patientId)
      .set('intervention_code', interventionCode);
    return this.http.get<PayerUtilizationBalance>(apiUrl('dha/benefits/utilization/'), { params });
  }

  getSubBenefits(patientId: string): Observable<any> {
    const params = new HttpParams().set('patient_id', patientId);
    return this.http.get<any>(apiUrl('dha/sub-benefits/'), { params });
  }

  getFacilityBedOccupancy(facilityCode: string): Observable<BedOccupancyData> {
    return this.http.get<BedOccupancyData>(apiUrl(`dha/facilities/${facilityCode}/beds/occupancy/`));
  }

  // ------------------------------------------------------------------
  // 3. AUTHORIZATIONS & PREAUTH CONSENT
  // ------------------------------------------------------------------
  getAuthorization(token: string, guid: string, beneficiaryCode?: string): Observable<DHAAuthorization> {
    let params = new HttpParams().set('token', token).set('guid', guid);
    if (beneficiaryCode) {
      params = params.set('beneficiary_code', beneficiaryCode);
    }
    return this.http.get<DHAAuthorization>(apiUrl('dha/claims/authorizations/'), { params });
  }

  createAuthorization(payload: {
    patient_id: string;
    service_type: 'OUTPATIENT' | 'INPATIENT';
    otp: string;
    interventions: string[];
    patient_name?: string;
  }): Observable<DHAAuthorization> {
    return this.http.post<DHAAuthorization>(apiUrl('dha/claims/authorize/'), payload);
  }

  rejectAuthorization(consentToken: string): Observable<any> {
    return this.http.post<any>(apiUrl(`dha/claims/authorizations/${consentToken}/reject/`), {});
  }

  // ------------------------------------------------------------------
  // 4. VIRTUAL CLAIMS & VISIT CONSENT
  // ------------------------------------------------------------------
  startVirtualClaimVisit(payload: {
    patient_id: string;
    service_type: 'CAPITATION' | 'OUTPATIENT' | 'INPATIENT' | 'EMERGENCY';
    otp: string;
    intervention_codes: string[];
  }): Observable<DHAClaim> {
    return this.http.post<DHAClaim>(apiUrl('dha/claims/visit/'), payload);
  }

  // ------------------------------------------------------------------
  // 5. CLAIM BILLING, DIAGNOSES, LINES & ATTACHMENTS
  // ------------------------------------------------------------------
  addClaimDiagnosis(payload: {
    consent_token: string;
    icd_code: string;
    intervention_code: string;
    facilityID?: string;
  }): Observable<any> {
    return this.http.post<any>(apiUrl('dha/claims/diagnoses/'), payload);
  }

  removeClaimDiagnosis(payload: { consent_token: string; icd_code: string; intervention_code: string }): Observable<any> {
    return this.http.patch<any>(apiUrl('dha/claims/diagnoses/'), payload);
  }

  addClaimLineItem(payload: {
    consent_token: string;
    intervention_code: string;
    unit_price: number;
    quantity: number;
    scheme_code?: string;
  }): Observable<any> {
    return this.http.post<any>(apiUrl('dha/claims/lines/'), payload);
  }

  removeClaimLineItem(payload: { consent_token: string; line_guid: string }): Observable<any> {
    return this.http.patch<any>(apiUrl('dha/claims/lines/'), payload);
  }

  editClaimLineItem(payload: { line_id: string; quantity?: number; unit_price?: number; scheme_code?: string }): Observable<any> {
    return this.http.patch<any>(apiUrl('dha/claims/lines/edit/'), payload);
  }

  resubmitClaimLineItem(consent_token: string): Observable<any> {
    return this.http.post<any>(apiUrl('dha/claims/lines/resubmit/'), { consent_token });
  }

  addClaimAttachment(payload: {
    consent_token: string;
    intervention_code: string;
    document_type: string;
  }): Observable<any> {
    return this.http.post<any>(apiUrl('dha/claims/attachments/'), payload);
  }

  removeClaimAttachment(payload: { attachment_id: string; consent_token: string; intervention_code: string }): Observable<any> {
    return this.http.patch<any>(apiUrl('dha/claims/attachments/'), payload);
  }

  // ------------------------------------------------------------------
  // 6. E-PRESCRIPTIONS & DISPENSES
  // ------------------------------------------------------------------
  previewPrescription(consentToken: string): Observable<DHAPrescription> {
    const params = new HttpParams().set('consent_token', consentToken);
    return this.http.get<DHAPrescription>(apiUrl('dha/prescriptions/'), { params });
  }

  createPrescription(payload: {
    consent_token: string;
    intervention_code: string;
    items: any[];
    identification_number?: string;
    identification_type?: string;
    regulation_body?: string;
  }): Observable<DHAPrescription> {
    return this.http.post<DHAPrescription>(apiUrl('dha/prescriptions/'), payload);
  }

  createDispense(payload: {
    consent_token: string;
    intervention_code: string;
    actual_products: any[];
    doctors: any[];
  }): Observable<any> {
    return this.http.post<any>(apiUrl('dha/prescriptions/dispenses/'), payload);
  }

  removePrescriptionDoctor(payload: {
    consent_token: string;
    intervention_code: string;
    practitioner_registration_number: string;
  }): Observable<any> {
    return this.http.request<any>('delete', apiUrl('dha/prescriptions/doctors/'), { body: payload });
  }

  // ------------------------------------------------------------------
  // 7. CLAIM DISPATCH, INPATIENT DISCHARGE & CLOSE
  // ------------------------------------------------------------------
  sendDischargeOtp(consentToken: string, patientId: string): Observable<any> {
    return this.http.post<any>(apiUrl('dha/claims/otp/discharge/'), { consent_token: consentToken, patient_id: patientId });
  }

  dischargeInpatient(payload: {
    consent_token: string;
    discharge_date: string;
    discharge_reason: 'RECOVERED' | 'REFERRED' | 'DECEASED' | 'ABSCONDED' | 'OTHER';
    invoice_number: string;
    otp: string;
  }): Observable<any> {
    return this.http.post<any>(apiUrl('dha/claims/discharge/'), payload);
  }

  closeClaim(payload: {
    consent_token: string;
    cancel_reason_text: string;
    cancel_reason_type: 'WRONG_PATIENT' | 'NO_SERVICE_GIVEN' | 'WRONG_BENEFIT' | 'EXPIRED_VISIT' | 'EXHAUSTED_BENEFIT' | 'OTHER';
  }): Observable<any> {
    return this.http.post<any>(apiUrl('dha/claims/close/'), payload);
  }

  submitVirtualClaim(payload: { consent_token: string; invoice_number?: string; reason_for_unknown_patient?: string }): Observable<DHAClaim> {
    return this.http.post<DHAClaim>(apiUrl('dha/claims/submit/'), payload);
  }

  addNextOfKinContact(payload: {
    consent_token: string;
    contact_value: string;
    next_of_kin_full_name: string;
    next_of_kin_id_number: string;
    next_of_kin_id_number_type: string;
  }): Observable<any> {
    return this.http.post<any>(apiUrl('dha/patients/next-of-kin/contacts/'), payload);
  }

  // ------------------------------------------------------------------
  // 8. EMERGENCY CASES & EMT PROTOCOLS
  // ------------------------------------------------------------------
  createEmergencyCaseClaim(payload: any): Observable<DHAClaim> {
    return this.http.post<DHAClaim>(apiUrl('dha/claims/emergency/'), payload);
  }

  getEmergencyProtocols(active: boolean = true, interventionCode: string = 'INT-EMERG-01'): Observable<any> {
    const params = new HttpParams().set('active', String(active)).set('intervention_code', interventionCode);
    return this.http.get<any>(apiUrl('dha/claims/emergency/protocols/'), { params });
  }

  addEmergencyProtocol(payload: any): Observable<any> {
    return this.http.post<any>(apiUrl('dha/claims/emergency/protocols/'), payload);
  }

  createEMTClaim(payload: any): Observable<DHAClaim> {
    return this.http.post<DHAClaim>(apiUrl('dha/claims/emt/'), payload);
  }

  addEmergencyDoctor(payload: { consent_token: string; identification_number: string; identification_type: string; regulation_body: string }): Observable<any> {
    return this.http.post<any>(apiUrl('dha/claims/doctors/'), payload);
  }

  removeEmergencyDoctor(consent_token: string): Observable<any> {
    return this.http.request<any>('delete', apiUrl('dha/claims/doctors/'), { body: { consent_token } });
  }

  // ------------------------------------------------------------------
  // 9. SECURITY AUDIT LOGS
  // ------------------------------------------------------------------
  getAuditLogs(): Observable<DHALog[]> {
    return this.http.get<any>(apiUrl('dha/logs/')).pipe(
      map((res: any) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.results)) return res.results;
        if (res && Array.isArray(res.data)) return res.data;
        return [];
      })
    );
  }
}

