import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Building2,
  Check,
  CreditCard,
  Crown,
  FileText,
  Globe,
  Hospital,
  Layers,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Users,
  AlertCircle,
  Clock,
  Download,
  Smartphone,
  Landmark,
  CheckCircle2,
  X,
  FileBadge2,
  Eye,
  EyeOff,
  Lock,
  FlaskConical,
  Pill,
  Scan,
  Package,
  BarChart3,
  UserCog,
  CalendarDays,
  LucideIconData,
} from 'lucide-angular';
import { FacilityService } from '../../../services/facility.service';
import { BillingService } from '../../../services/billing.service';
import { KnhtsService } from '../../../services/knhts.service';
import { ToastService } from '../../../core/toast.service';
import { PermissionsService } from '../../../core/permissions.service';
import {
  FacilityModulesConfig,
  FacilityProfile,
  FacilityUpdateRequest,
  ModuleDefinition,
  SelectableModuleKey,
  SubscribePayload,
  SubscriptionPaymentRecord,
} from '../../../models/facility.model';
import {
  MpesaConfig,
  MpesaConfigPayload,
  MpesaEnvironment,
  MpesaTransactionType,
} from '../../../models/billing.models';

/** Form model: secrets live here only while the user is typing them. */
export interface MpesaConfigForm {
  shortcode: string;
  consumer_key: string;
  passkey: string;
  consumer_secret: string;
  environment: MpesaEnvironment;
  transaction_type: MpesaTransactionType;
  account_reference_prefix: string;
  is_active: boolean;
}

export interface PackageTier {
  id: 'basic' | 'professional' | 'enterprise';
  name: string;
  badge?: string;
  popular?: boolean;
  monthlyPriceKES: number;
  yearlyPriceKES: number;
  staffLimit: string;
  features: string[];
}

@Component({
  selector: 'app-facility-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './facility-profile.component.html',
  styleUrl: './facility-profile.component.css',
})
export class FacilityProfileComponent implements OnInit {
  private readonly facilityService = inject(FacilityService);
  private readonly billingService = inject(BillingService);
  private readonly toast = inject(ToastService);

  // Lucide Icons
  readonly Building2 = Building2;
  readonly Check = Check;
  readonly CreditCard = CreditCard;
  readonly Crown = Crown;
  readonly FileText = FileText;
  readonly Globe = Globe;
  readonly Hospital = Hospital;
  readonly Layers = Layers;
  readonly Mail = Mail;
  readonly MapPin = MapPin;
  readonly Phone = Phone;
  readonly RefreshCw = RefreshCw;
  readonly Save = Save;
  readonly ShieldCheck = ShieldCheck;
  readonly Sparkles = Sparkles;
  readonly Users = Users;
  readonly AlertCircle = AlertCircle;
  readonly Clock = Clock;
  readonly Download = Download;
  readonly Smartphone = Smartphone;
  readonly Landmark = Landmark;
  readonly CheckCircle2 = CheckCircle2;
  readonly X = X;
  readonly FileBadge2 = FileBadge2;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Lock = Lock;

  // Active Tab
  activeTab = signal<
    'profile' | 'subscription' | 'history' | 'mpesa' | 'compliance' | 'modules'
  >('profile');

  // ─── Module management ───────────────────────────────────────────────────
  private readonly permissionsService = inject(PermissionsService);
  /** Config fetched from GET manage-modules/ */
  modulesConfig = signal<FacilityModulesConfig | null>(null);
  /** Resolved modules (from API or refreshed after save) */
  resolvedModules = signal<string[]>([]);
  /** Draft: the admin's pending toggle state, before saving */
  draftModules = signal<Set<SelectableModuleKey>>(new Set());
  loadingModules = signal<boolean>(false);
  savingModules = signal<boolean>(false);

  /** True if draftModules differs from what the server has */
  modulesHaveChanges = computed(() => {
    const cfg = this.modulesConfig();
    if (!cfg) return false;
    const serverSet = new Set(cfg.enabled_modules);
    const draft = this.draftModules();
    if (serverSet.size !== draft.size) return true;
    for (const k of draft) { if (!serverSet.has(k)) return true; }
    return false;
  });

  /** Canonical module definitions used in the Modules tab */
  readonly moduleDefinitions: ModuleDefinition[] = [
    { key: 'patients',     label: 'Patient Management',      description: 'Register and manage patient records & demographics.', icon: 'people',          },
    { key: 'appointments', label: 'Appointment Scheduling',  description: 'Book, reschedule and track patient appointments.',    icon: 'calendar_month',  autoEnables: ['patients'] },
    { key: 'ehr',          label: 'Consultation & EHR',      description: 'Visit history, triage, SOAP notes and clinical records.', icon: 'description',  autoEnables: ['patients', 'visit_queue'] },
    { key: 'pharmacy',     label: 'Pharmacy & Prescriptions',description: 'Dispense medications and manage prescriptions.',      icon: 'medication',      autoEnables: ['inventory'] },
    { key: 'laboratory',   label: 'Laboratory',              description: 'Lab test orders, samples and results management.',    icon: 'science',         autoEnables: ['patients'] },
    { key: 'radiology',    label: 'Radiology & Imaging',     description: 'Imaging orders, DICOM reports and results.',          icon: 'radiology',       autoEnables: ['patients'] },
    { key: 'billing',      label: 'Billing & Finance',       description: 'Invoices, payments and financial reports.',           icon: 'receipt_long',    autoEnables: ['insurance'] },
    { key: 'inventory',    label: 'Inventory Management',    description: 'Track drugs, supplies and stock levels.',             icon: 'inventory_2',     },
    { key: 'reports',      label: 'Reports & Analytics',     description: 'Facility-wide analytics, dashboards and exports.',    icon: 'bar_chart',       },
    { key: 'employees',    label: 'HR – Employees',          description: 'Staff records, contracts and payroll.',               icon: 'badge',           },
    { key: 'departments',  label: 'HR – Departments',        description: 'Manage clinical and administrative departments.',      icon: 'corporate_fare',  },
  ];

  /** Map from module key to its Lucide icon data */
  private readonly moduleIconMap: Record<string, LucideIconData> = {
    patients:     Users,
    appointments: CalendarDays,
    ehr:          FileText,
    pharmacy:     Pill,
    laboratory:   FlaskConical,
    radiology:    Scan,
    billing:      CreditCard,
    inventory:    Package,
    reports:      BarChart3,
    employees:    UserCog,
    departments:  Building2,
  };

  getModuleIcon(key: string): LucideIconData {
    return this.moduleIconMap[key] ?? Layers;
  }

  loadModulesConfig(facilityId: number | string): void {
    if (this.loadingModules()) return;
    this.loadingModules.set(true);
    this.facilityService.getModules(facilityId).subscribe({
      next: (cfg) => {
        this.modulesConfig.set(cfg);
        this.resolvedModules.set(cfg.resolved_modules ?? []);
        // Initialise draft from the server's enabled_modules (selectable keys only)
        const selectable = new Set(cfg.selectable_modules);
        const initial = new Set<SelectableModuleKey>(
          (cfg.enabled_modules as SelectableModuleKey[]).filter((k) => selectable.has(k)),
        );
        this.draftModules.set(initial);
        this.loadingModules.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingModules.set(false);
        this.toast.handleHttpError(err);
      },
    });
  }

  isDraftModuleEnabled(key: string): boolean {
    return this.draftModules().has(key as SelectableModuleKey);
  }

  toggleDraftModule(key: string): void {
    const k = key as SelectableModuleKey;
    const draft = new Set(this.draftModules());
    if (draft.has(k)) {
      draft.delete(k);
    } else {
      draft.add(k);
    }
    this.draftModules.set(draft);
  }

  cancelModuleChanges(): void {
    const cfg = this.modulesConfig();
    if (!cfg) return;
    const selectable = new Set(cfg.selectable_modules);
    const restored = new Set<SelectableModuleKey>(
      (cfg.enabled_modules as SelectableModuleKey[]).filter((k) => selectable.has(k)),
    );
    this.draftModules.set(restored);
  }

  saveModules(facilityId: number | string): void {
    if (this.savingModules() || !this.modulesHaveChanges()) return;
    this.savingModules.set(true);
    const modules = Array.from(this.draftModules());
    this.facilityService.updateModules(facilityId, { modules }).subscribe({
      next: (res) => {
        this.savingModules.set(false);
        // Merge updated lists back into the config
        const prev = this.modulesConfig();
        if (prev) {
          this.modulesConfig.set({
            ...prev,
            enabled_modules: res.enabled_modules,
            resolved_modules: res.resolved_modules,
          });
        }
        this.resolvedModules.set(res.resolved_modules ?? []);
        // Propagate to the global permission service so the sidebar updates
        this.permissionsService.setResolvedModules(res.resolved_modules ?? []);
        this.toast.showSuccess(res.message || 'Modules updated successfully.');
      },
      error: (err: HttpErrorResponse) => {
        this.savingModules.set(false);
        this.toast.handleHttpError(err);
      },
    });
  }
  // ─────────────────────────────────────────────────────────────────────────


  // State Signals
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  subscribing = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // M-Pesa Config Signals
  loadingMpesa = signal<boolean>(false);
  savingMpesa = signal<boolean>(false);
  /** Non-secret configuration as last returned by the API. */
  mpesaConfig = signal<MpesaConfig | null>(null);
  mpesaFieldErrors = signal<Record<string, string>>({});
  showPasskey = signal<boolean>(false);
  showConsumerSecret = signal<boolean>(false);

  readonly mpesaConfigured = computed(() => !!this.mpesaConfig()?.shortcode);

  /** Secrets are already stored server-side, so they become optional on edit. */
  readonly mpesaSecretsOnFile = computed(() => !!this.mpesaConfig()?.id);

  mpesaForm: MpesaConfigForm = this.emptyMpesaForm();

  // Facility & Payment Data
  facility = signal<FacilityProfile | null>(null);
  paymentHistory = signal<SubscriptionPaymentRecord[]>([]);

  // Compliance Data
  terminologyLogs = signal<any[]>([]);
  loadingLogs = signal<boolean>(false);
  private readonly knhtsService = inject(KnhtsService);

  // Profile Edit Form Model
  profileForm: FacilityUpdateRequest = {
    name: '',
    facility_type: 'clinic',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    website: '',
    description: '',
    logo: '',
  };

  // Subscription Settings
  billingCycle = signal<'monthly' | 'yearly'>('monthly');

  // Checkout Modal State
  showCheckoutModal = signal<boolean>(false);
  selectedPackageForCheckout = signal<PackageTier | null>(null);
  paymentMethod = signal<'mpesa' | 'card' | 'bank_transfer'>('mpesa');
  stkPhoneNumber = signal<string>('');
  cardNumber = signal<string>('');
  cardExpiry = signal<string>('');
  cardCvv = signal<string>('');
  paymentProcessing = signal<boolean>(false);
  stkPushSent = signal<boolean>(false);

  // Packages Configuration
  readonly packages: PackageTier[] = [
    {
      id: 'basic',
      name: 'Basic Plan',
      monthlyPriceKES: 2999,
      yearlyPriceKES: 28790,
      staffLimit: '3 Users • Up to 100 Patients',
      features: [
        'Up to 100 patients',
        '3 users',
        'Basic modules',
        'Email support',
      ],
    },
    {
      id: 'professional',
      name: 'Professional Plan',
      badge: 'Most Popular',
      popular: true,
      monthlyPriceKES: 5999,
      yearlyPriceKES: 57590,
      staffLimit: '15 Users • Up to 500 Patients',
      features: [
        'Up to 500 patients',
        '15 users',
        'All modules',
        'Priority support',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      monthlyPriceKES: 12999,
      yearlyPriceKES: 124790,
      staffLimit: 'Unlimited Users • Unlimited Patients',
      features: [
        'Unlimited patients',
        'Unlimited users',
        'All modules',
        '24/7 support',
      ],
    },
  ];

  ngOnInit(): void {
    this.loadFacilityData();
  }

  loadFacilityData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.facilityService.getMyFacility().subscribe({
      next: (data) => {
        this.facility.set(data);
        this.populateProfileForm(data);
        if (data.subscription_billing_cycle) {
          this.billingCycle.set(
            data.subscription_billing_cycle as 'monthly' | 'yearly',
          );
        }
        if (data.id) {
          this.loadSubscriptionHistory(data.id);
          this.loadMpesaConfig(data.id);
          this.loadTerminologyLogs(data.id);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load facility data:', err);
        this.errorMessage.set(
          err?.error?.detail || 'Failed to load facility profile details.',
        );
        this.loading.set(false);
      },
    });
  }

  private emptyMpesaForm(): MpesaConfigForm {
    return {
      shortcode: '',
      consumer_key: '',
      passkey: '',
      consumer_secret: '',
      environment: 'sandbox',
      transaction_type: 'CustomerPayBillOnline',
      account_reference_prefix: '',
      is_active: true,
    };
  }

  loadMpesaConfig(facilityId: number | string): void {
    this.loadingMpesa.set(true);
    this.billingService.getMpesaConfig(facilityId).subscribe({
      next: (res) => {
        const config = (res?.data ??
          res?.results ??
          null) as MpesaConfig | null;
        this.mpesaConfig.set(config?.shortcode ? config : null);
        this.applyMpesaConfigToForm(config);
        this.loadingMpesa.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingMpesa.set(false);
        // 404 simply means this facility has not configured M-Pesa yet.
        if (err.status === 404) {
          this.mpesaConfig.set(null);
          return;
        }
        this.toast.handleHttpError(err);
      },
    });
  }

  /** Secret fields are always left empty — the API never returns them. */
  private applyMpesaConfigToForm(config: MpesaConfig | null): void {
    const base = this.emptyMpesaForm();
    this.mpesaForm = config
      ? {
          ...base,
          shortcode: config.shortcode ?? '',
          consumer_key: config.consumer_key ?? '',
          environment: config.environment ?? 'sandbox',
          transaction_type: config.transaction_type ?? 'CustomerPayBillOnline',
          account_reference_prefix: config.account_reference_prefix ?? '',
          is_active: config.is_active ?? true,
        }
      : base;
    this.showPasskey.set(false);
    this.showConsumerSecret.set(false);
  }

  buildMpesaPayload(): MpesaConfigPayload {
    const form = this.mpesaForm;
    const payload: MpesaConfigPayload = {
      shortcode: form.shortcode.trim(),
      consumer_key: form.consumer_key.trim(),
      environment: form.environment,
      transaction_type: form.transaction_type,
      account_reference_prefix: form.account_reference_prefix.trim(),
      is_active: form.is_active,
    };
    if (form.passkey.trim()) {
      payload.passkey = form.passkey.trim();
    }
    if (form.consumer_secret.trim()) {
      payload.consumer_secret = form.consumer_secret.trim();
    }
    return payload;
  }

  validateMpesaForm(): Record<string, string> {
    const errors: Record<string, string> = {};
    const form = this.mpesaForm;
    const secretsOnFile = this.mpesaSecretsOnFile();

    if (!form.is_active) {
      return errors;
    }

    if (!form.shortcode.trim()) {
      errors['shortcode'] = 'Paybill/Till Number is required.';
    }
    if (!form.consumer_key.trim()) {
      errors['consumer_key'] = 'Daraja Consumer Key is required.';
    }
    if (!secretsOnFile && !form.passkey.trim()) {
      errors['passkey'] = 'Lipa na M-Pesa Passkey is required.';
    }
    if (!secretsOnFile && !form.consumer_secret.trim()) {
      errors['consumer_secret'] = 'Daraja Consumer Secret is required.';
    }
    return errors;
  }

  saveMpesaSettings(): void {
    const fac = this.facility();
    if (!fac?.id || this.savingMpesa()) return;

    const errors = this.validateMpesaForm();
    this.mpesaFieldErrors.set(errors);
    if (Object.keys(errors).length) {
      this.toast.showWarning(
        'Please complete the highlighted M-Pesa fields before saving.',
      );
      return;
    }

    this.savingMpesa.set(true);
    this.errorMessage.set(null);

    this.billingService
      .saveMpesaConfig(fac.id, this.buildMpesaPayload())
      .subscribe({
        next: () => {
          this.savingMpesa.set(false);
          this.mpesaForm.passkey = '';
          this.mpesaForm.consumer_secret = '';
          this.toast.showSuccess('M-Pesa payment configuration saved.');
          this.loadMpesaConfig(fac.id);
        },
        error: (err: HttpErrorResponse) => {
          this.savingMpesa.set(false);
          if (err.status === 400) {
            this.mpesaFieldErrors.set(this.extractMpesaFieldErrors(err));
          }
          this.toast.handleHttpError(err);
        },
      });
  }

  private extractMpesaFieldErrors(
    err: HttpErrorResponse,
  ): Record<string, string> {
    const body = err.error?.details ?? err.error?.errors ?? err.error;
    const errors: Record<string, string> = {};
    if (!body || typeof body !== 'object') return errors;

    for (const [field, value] of Object.entries(body)) {
      if (field === 'detail' || field === 'message') continue;
      if (Array.isArray(value)) {
        errors[field] = value.map((v) => String(v)).join(' ');
      } else if (typeof value === 'string') {
        errors[field] = value;
      }
    }
    return errors;
  }

  mpesaError(field: string): string | null {
    return this.mpesaFieldErrors()[field] ?? null;
  }

  populateProfileForm(data: FacilityProfile): void {
    this.profileForm = {
      name: data.name || '',
      facility_type: data.facility_type || 'clinic',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      city: data.city || '',
      country: data.country || 'Kenya',
      website: data.website || '',
      description: data.description || '',
      logo: data.logo || '',
    };
    if (data.phone) {
      this.stkPhoneNumber.set(data.phone);
    }
  }

  loadSubscriptionHistory(facilityId: number | string): void {
    this.facilityService.getSubscriptionHistory(facilityId).subscribe({
      next: (history) => {
        this.paymentHistory.set(history);
      },
      error: (err) => {
        console.error('Failed to load payment history:', err);
      },
    });
  }

  loadTerminologyLogs(facilityId: number | string, page = 1): void {
    this.loadingLogs.set(true);
    this.knhtsService.getTerminologyLog(facilityId, page, 50).subscribe({
      next: (res) => {
        if (res.results) {
          this.terminologyLogs.set(res.results);
        }
        this.loadingLogs.set(false);
      },
      error: (err) => {
        console.error('Failed to load terminology logs:', err);
        this.loadingLogs.set(false);
      },
    });
  }

  saveProfile(): void {
    const fac = this.facility();
    if (!fac?.id) return;

    this.saving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.facilityService.updateFacility(fac.id, this.profileForm).subscribe({
      next: (updated) => {
        this.facility.set(updated);
        this.populateProfileForm(updated);
        this.saving.set(false);
        this.successMessage.set('Facility profile updated successfully!');
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: (err) => {
        console.error('Error updating facility:', err);
        this.saving.set(false);
        this.errorMessage.set(
          err?.error?.detail ||
            err?.error?.email?.[0] ||
            err?.error?.name?.[0] ||
            'Failed to update facility profile.',
        );
      },
    });
  }

  openCheckoutModal(pkg: PackageTier): void {
    this.selectedPackageForCheckout.set(pkg);
    this.stkPushSent.set(false);
    this.paymentProcessing.set(false);
    this.showCheckoutModal.set(true);
  }

  closeCheckoutModal(): void {
    this.clearSubscriptionPolling();
    this.showCheckoutModal.set(false);
    this.selectedPackageForCheckout.set(null);
    this.stkPushSent.set(false);
    this.paymentProcessing.set(false);
  }

  private subscriptionPollTimer: any = null;

  startSubscriptionStatusPolling(
    checkoutReqId: string,
    packageName: string,
  ): void {
    this.clearSubscriptionPolling();
    let elapsed = 0;
    const maxAttempts = 20; // 60 seconds

    this.subscriptionPollTimer = setInterval(() => {
      elapsed++;
      if (elapsed > maxAttempts) {
        this.clearSubscriptionPolling();
        this.paymentProcessing.set(false);
        this.stkPushSent.set(false);
        this.errorMessage.set(
          'M-Pesa transaction validation timed out. Please retry or check your PIN entry.',
        );
        return;
      }

      this.billingService.queryStkStatus(checkoutReqId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const status = res.data.status;
            if (status === 'Completed') {
              this.clearSubscriptionPolling();
              this.paymentProcessing.set(false);
              this.closeCheckoutModal();

              this.successMessage.set(
                `Payment verified! Your facility has been successfully upgraded to ${packageName}.`,
              );
              this.loadFacilityData();
              setTimeout(() => this.successMessage.set(null), 5000);
            } else if (status === 'Failed' || status === 'Cancelled') {
              this.clearSubscriptionPolling();
              this.paymentProcessing.set(false);
              this.stkPushSent.set(false);
              this.errorMessage.set(
                res.data.result_desc ||
                  `M-Pesa transaction was ${status.toLowerCase()}.`,
              );
            }
          }
        },
        error: (err) => {
          console.error('Polling subscription error:', err);
        },
      });
    }, 3000);
  }

  clearSubscriptionPolling(): void {
    if (this.subscriptionPollTimer) {
      clearInterval(this.subscriptionPollTimer);
      this.subscriptionPollTimer = null;
    }
  }

  processSubscriptionPayment(): void {
    const fac = this.facility();
    const pkg = this.selectedPackageForCheckout();
    if (!fac?.id || !pkg) return;

    this.paymentProcessing.set(true);
    this.errorMessage.set(null);

    const payload: SubscribePayload = {
      package: pkg.id,
      billing_cycle: this.billingCycle(),
      payment_method: this.paymentMethod(),
      phone_number: this.stkPhoneNumber(),
      card_number: this.cardNumber(),
      card_expiry: this.cardExpiry(),
      card_cvv: this.cardCvv(),
    };

    this.facilityService.subscribePackage(fac.id, payload).subscribe({
      next: (res: any) => {
        if (this.paymentMethod() === 'mpesa' && res.checkoutRequestId) {
          this.stkPushSent.set(true);
          this.startSubscriptionStatusPolling(res.checkoutRequestId, pkg.name);
        } else {
          this.facility.set(res.facility);
          this.paymentHistory.update((prev) => [res.payment, ...prev]);
          this.paymentProcessing.set(false);
          this.closeCheckoutModal();

          this.successMessage.set(
            `Payment successful! Your facility has been upgraded to ${pkg.name}.`,
          );
          setTimeout(() => this.successMessage.set(null), 5000);
        }
      },
      error: (err) => {
        console.error('Subscription failed:', err);
        this.paymentProcessing.set(false);
        this.stkPushSent.set(false);
        this.errorMessage.set(
          err?.error?.detail ||
            err?.error?.error ||
            err?.error?.message ||
            'Payment processing failed. Please check your details and try again.',
        );
      },
    });
  }

  getDaysRemaining(endDateStr?: string | null): number {
    if (!endDateStr) return 0;
    const endDate = new Date(endDateStr);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  formatCurrency(amount: number | string): string {
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(val || 0);
  }
}
