import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PatientVitals } from '../../../models/patients.models';

@Component({
  selector: 'app-vitals-summary-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div *ngIf="vitals" class="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5 text-xs text-slate-700 shadow-xs">
      <div class="flex items-center justify-between border-b border-slate-200/60 pb-2">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <mat-icon class="!w-4 !h-4 !text-base">monitor_heart</mat-icon>
          </span>
          <span class="font-bold text-slate-800 tracking-tight">Patient Vitals</span>
          <span *ngIf="vitals.recordedAt" class="text-[10px] text-slate-400">
            ({{ vitals.recordedAt | date:'short' }})
          </span>
        </div>
        <div class="flex items-center gap-1.5 flex-wrap">
          <!-- BMI Badge -->
          <span *ngIf="calculatedBmi" [class]="'px-2 py-0.5 rounded-full text-[10px] font-bold ' + bmiBadgeClass">
            BMI: {{ calculatedBmi }} ({{ bmiCategory }})
          </span>
          <!-- Captured By -->
          <span *ngIf="vitals.capturedByName" class="text-[10px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">
            By: {{ vitals.capturedByName }}
          </span>
        </div>
      </div>

      <!-- Vitals Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 font-medium">
        <!-- BP -->
        <div *ngIf="vitals.systolicBp || vitals.diastolicBp" class="bg-white p-2 rounded-lg border border-slate-200/80 flex items-center gap-2">
          <mat-icon class="!w-4 !h-4 !text-base text-rose-500">favorite</mat-icon>
          <div>
            <div class="text-[10px] text-slate-400 font-semibold uppercase">Blood Pressure</div>
            <div class="text-xs font-bold text-slate-800" [class.text-rose-600]="isBpHigh">
              {{ vitals.systolicBp || '--' }}/{{ vitals.diastolicBp || '--' }} <span class="text-[10px] font-normal text-slate-400">mmHg</span>
            </div>
          </div>
        </div>

        <!-- Temperature -->
        <div *ngIf="vitals.temperatureC" class="bg-white p-2 rounded-lg border border-slate-200/80 flex items-center gap-2">
          <mat-icon class="!w-4 !h-4 !text-base text-amber-500">thermostat</mat-icon>
          <div>
            <div class="text-[10px] text-slate-400 font-semibold uppercase">Temperature</div>
            <div class="text-xs font-bold text-slate-800" [class.text-amber-600]="isFever">
              {{ vitals.temperatureC }}°C
            </div>
          </div>
        </div>

        <!-- Pulse / HR -->
        <div *ngIf="vitals.heartRateBpm" class="bg-white p-2 rounded-lg border border-slate-200/80 flex items-center gap-2">
          <mat-icon class="!w-4 !h-4 !text-base text-emerald-500">pulse_meter</mat-icon>
          <div>
            <div class="text-[10px] text-slate-400 font-semibold uppercase">Heart Rate</div>
            <div class="text-xs font-bold text-slate-800">
              {{ vitals.heartRateBpm }} <span class="text-[10px] font-normal text-slate-400">bpm</span>
            </div>
          </div>
        </div>

        <!-- SpO2 -->
        <div *ngIf="vitals.spo2Percent" class="bg-white p-2 rounded-lg border border-slate-200/80 flex items-center gap-2">
          <mat-icon class="!w-4 !h-4 !text-base text-cyan-500">air</mat-icon>
          <div>
            <div class="text-[10px] text-slate-400 font-semibold uppercase">SpO2</div>
            <div class="text-xs font-bold text-slate-800" [class.text-rose-600]="isLowSpo2">
              {{ vitals.spo2Percent }}%
            </div>
          </div>
        </div>

        <!-- Resp Rate -->
        <div *ngIf="vitals.respiratoryRate" class="bg-white p-2 rounded-lg border border-slate-200/80 flex items-center gap-2">
          <mat-icon class="!w-4 !h-4 !text-base text-indigo-500">lung</mat-icon>
          <div>
            <div class="text-[10px] text-slate-400 font-semibold uppercase">Resp Rate</div>
            <div class="text-xs font-bold text-slate-800">
              {{ vitals.respiratoryRate }} <span class="text-[10px] font-normal text-slate-400">/min</span>
            </div>
          </div>
        </div>

        <!-- Blood Glucose -->
        <div *ngIf="vitals.bloodGlucoseMmol" class="bg-white p-2 rounded-lg border border-slate-200/80 flex items-center gap-2">
          <mat-icon class="!w-4 !h-4 !text-base text-purple-500">water_drop</mat-icon>
          <div>
            <div class="text-[10px] text-slate-400 font-semibold uppercase">Blood Glucose</div>
            <div class="text-xs font-bold text-slate-800">
              {{ vitals.bloodGlucoseMmol }} <span class="text-[10px] font-normal text-slate-400">mmol/L</span>
            </div>
          </div>
        </div>

        <!-- Height & Weight -->
        <div *ngIf="vitals.heightCm || vitals.weightKg" class="bg-white p-2 rounded-lg border border-slate-200/80 flex items-center gap-2">
          <mat-icon class="!w-4 !h-4 !text-base text-blue-500">straighten</mat-icon>
          <div>
            <div class="text-[10px] text-slate-400 font-semibold uppercase">Height / Weight</div>
            <div class="text-xs font-bold text-slate-800">
              {{ vitals.heightCm || '--' }} cm / {{ vitals.weightKg || '--' }} kg
            </div>
          </div>
        </div>

        <!-- Pain Score -->
        <div *ngIf="vitals.painScore !== undefined && vitals.painScore !== null" class="bg-white p-2 rounded-lg border border-slate-200/80 flex items-center gap-2">
          <mat-icon class="!w-4 !h-4 !text-base text-rose-400">sentiment_very_dissatisfied</mat-icon>
          <div>
            <div class="text-[10px] text-slate-400 font-semibold uppercase">Pain Score</div>
            <div class="text-xs font-bold text-slate-800">
              {{ vitals.painScore }} / 10
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div *ngIf="vitals.notes" class="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/60 italic">
        <span class="font-semibold text-slate-700 not-italic">Notes:</span> {{ vitals.notes }}
      </div>
    </div>
  `,
  styles: [],
})
export class VitalsSummaryCardComponent {
  @Input() vitals?: PatientVitals;

  get calculatedBmi(): string | null {
    if (this.vitals?.bmi) {
      return String(this.vitals.bmi);
    }
    const h = Number(this.vitals?.heightCm);
    const w = Number(this.vitals?.weightKg);
    if (h > 0 && w > 0) {
      const heightM = h / 100;
      const bmiVal = w / (heightM * heightM);
      return bmiVal.toFixed(1);
    }
    return null;
  }

  get bmiCategory(): string {
    const val = Number(this.calculatedBmi);
    if (!val) return 'Normal';
    if (val < 18.5) return 'Underweight';
    if (val < 25) return 'Normal';
    if (val < 30) return 'Overweight';
    return 'Obese';
  }

  get bmiBadgeClass(): string {
    const cat = this.bmiCategory;
    if (cat === 'Underweight') return 'bg-amber-100 text-amber-800 border border-amber-300';
    if (cat === 'Normal') return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    if (cat === 'Overweight') return 'bg-orange-100 text-orange-800 border border-orange-300';
    return 'bg-rose-100 text-rose-800 border border-rose-300';
  }

  get isFever(): boolean {
    return Number(this.vitals?.temperatureC) >= 38.0;
  }

  get isBpHigh(): boolean {
    return Number(this.vitals?.systolicBp) >= 140 || Number(this.vitals?.diastolicBp) >= 90;
  }

  get isLowSpo2(): boolean {
    return Number(this.vitals?.spo2Percent) < 95 && Number(this.vitals?.spo2Percent) > 0;
  }
}
