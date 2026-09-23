import { Injectable } from '@angular/core';
import { AllergyItem, CdsAlert, ProblemItem, VitalSignsRecord } from '../models/ehr.models';
import { Prescription } from '../models/pharmacy.models';

@Injectable({ providedIn: 'root' })
export class CdsService {
  /**
   * Evaluates patient data (allergies, problem list, prescriptions, vitals, lab results)
   * against clinical decision support rules. Returns active CDS safety alerts.
   */
  evaluatePatientAlerts(params: {
    age: number;
    gender: string;
    allergies?: AllergyItem[];
    problems?: ProblemItem[];
    prescriptions?: Prescription[];
    vitals?: VitalSignsRecord;
    labResults?: any[];
  }): CdsAlert[] {
    const alerts: CdsAlert[] = [];

    // Rule 1: Drug-Allergy Safety Cross Check
    if (params.allergies && params.prescriptions) {
      for (const rx of params.prescriptions) {
        const drugName = (rx.medication || rx.drugs?.[0]?.name || '').toLowerCase();
        if (!drugName) continue;

        const match = params.allergies.find((allergy) => {
          const allergen = (allergy.allergenName || '').toLowerCase();
          return drugName.includes(allergen) || allergen.includes(drugName);
        });

        if (match) {
          alerts.push({
            id: `CDS-ALG-${Math.random().toString(36).substring(2, 7)}`,
            type: 'ALLERGY_ALERT',
            severity: match.severity === 'Severe' || match.severity === 'Anaphylactic' ? 'Critical' : 'Warning',
            title: `DRUG ALLERGY WARNING: ${rx.medication || rx.drugs?.[0]?.name || 'Prescribed Drug'}`,
            message: `Patient has a recorded ${match.severity} allergy to ${match.allergenName} (Reaction: ${match.reaction}).`,
            recommendation: `Consider an alternative medication class or verify with prescribing physician.`,
            source: 'HPT Registry & KNHTS Allergy Cross-Check Engine',
          });
        }
      }
    }

    // Rule 2: Vital Signs Hypertensive Crisis / High BP Warning
    if (params.vitals) {
      const { bloodPressureSystolic: sbp, bloodPressureDiastolic: dbp } = params.vitals;
      if (sbp >= 180 || dbp >= 120) {
        alerts.push({
          id: `CDS-VIT-CRIT`,
          type: 'HIGH_VITALS',
          severity: 'Critical',
          title: 'HYPERTENSIVE CRISIS WARNING',
          message: `Blood Pressure is dangerously elevated: ${sbp}/${dbp} mmHg.`,
          recommendation: 'Evaluate immediately for target organ damage and administer fast-acting antihypertensive therapy.',
          source: 'MOH Kenya Clinical Practice Guidelines (Hypertension)',
        });
      } else if (sbp >= 140 || dbp >= 90) {
        alerts.push({
          id: `CDS-VIT-WARN`,
          type: 'HIGH_VITALS',
          severity: 'Warning',
          title: 'Stage 2 Hypertension Warning',
          message: `Blood Pressure is ${sbp}/${dbp} mmHg.`,
          recommendation: 'Verify lifestyle modifications and check adherence to antihypertensive regimen.',
          source: 'KNHTS Clinical Decision Protocol',
        });
      }

      if (params.vitals.temperatureC >= 38.5) {
        alerts.push({
          id: `CDS-VIT-FEVER`,
          type: 'HIGH_VITALS',
          severity: 'Warning',
          title: 'High Pyrexia / Fever Alert',
          message: `Recorded Temperature: ${params.vitals.temperatureC}°C.`,
          recommendation: 'Screen for acute systemic infection or malaria (mRDT / Blood smear).',
          source: 'Kenya Integrated Management of Newborn & Childhood Illnesses (IMNCI)',
        });
      }
    }

    // Rule 3: Pediatric Age Dosage Caution
    if (params.age < 12 && params.prescriptions && params.prescriptions.length > 0) {
      alerts.push({
        id: `CDS-PED-DOSAGE`,
        type: 'AGE_DOSAGE_WARNING',
        severity: 'Info',
        title: 'Pediatric Patient Prescribing Alert',
        message: `Patient is ${params.age} years old.`,
        recommendation: 'Ensure all medication doses are weight-adjusted (mg/kg) per MOH pediatric dosage guidelines.',
        source: 'Kenya Pediatric Formulary & HPT Guidelines',
      });
    }

    return alerts;
  }
}
