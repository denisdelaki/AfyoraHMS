import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardPlus,
  CreditCard,
  FileText,
  FlaskConical,
  HeartPulse,
  LucideAngularModule,
  Package,
  Pill,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-angular';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  readonly ArrowRight = ArrowRight;
  readonly ChevronRight = ChevronRight;
  readonly Check = Check;
  readonly HeartPulse = HeartPulse;
  readonly ShieldCheck = ShieldCheck;
  readonly Building2 = Building2;

  readonly capabilities = [
    { icon: Users, title: 'Patient care, connected', text: 'Register patients, book appointments, and keep every interaction in one secure timeline.' },
    { icon: FileText, title: 'Records that follow the patient', text: 'Bring clinical notes, prescriptions, laboratory findings, and imaging results together.' },
    { icon: CreditCard, title: 'Revenue with clarity', text: 'Turn care into accurate invoices, track payments, and understand your facility performance.' },
    { icon: Package, title: 'Stock under control', text: 'Stay ahead of low stock and expiry risks across pharmacy and medical supplies.' },
    { icon: Stethoscope, title: 'Teams in sync', text: 'Organise departments, staff, shifts, and the workflows that keep care moving.' },
    { icon: BarChart3, title: 'Decisions backed by data', text: 'Use reports and live operational indicators to focus attention where it is needed.' },
  ];

  readonly setupSteps = [
    { number: '01', title: 'Create your facility account', text: 'Choose Hospital or Clinic and enter your facility and administrator details.', icon: Building2 },
    { number: '02', title: 'Verify and personalise', text: 'Confirm your email, add facility information, choose modules, then select a plan.', icon: ShieldCheck },
    { number: '03', title: 'Run your day with confidence', text: 'Sign in to your dashboard and move between the tools your team needs.', icon: Activity },
  ];

  readonly workspace = [
    { icon: ClipboardPlus, label: 'Patients', detail: 'Registration, profiles & appointments' },
    { icon: FileText, label: 'EHR', detail: 'Clinical records & care history' },
    { icon: Pill, label: 'Pharmacy', detail: 'Drugs, prescriptions & expiry alerts' },
    { icon: FlaskConical, label: 'Laboratory', detail: 'Test orders, results & catalogue' },
    { icon: Boxes, label: 'Inventory', detail: 'Supplies, vendors & purchase orders' },
    { icon: CalendarDays, label: 'Reports', detail: 'Operational and financial insight' },
  ];
}
