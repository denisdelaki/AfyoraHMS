import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
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
} from 'lucide-angular';
import { FacilityService } from '../../../services/facility.service';
import { BillingService } from '../../../services/billing.service';
import {
  FacilityProfile,
  FacilityUpdateRequest,
  SubscribePayload,
  SubscriptionPaymentRecord,
} from '../../../models/facility.model';
import { MpesaConfig } from '../../../models/billing.models';

export interface PackageTier {
  id: 'basic' | 'professional' | 'enterprise';
  name: string;
  badge?: string;
  popular?: boolean;
  monthlyPriceKES: number;
  yearlyPriceKES: number;
  monthlyPriceUSD: number;
  yearlyPriceUSD: number;
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

  // Lucide Icons
  readonly Building2 = Building2;
  readonly Check = Check;
  readonly CreditCard = CreditCard;
  readonly Crown = Crown;
  readonly FileText = FileText;
  readonly Globe = Globe;
  readonly Hospital = Hospital;
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

  // Active Tab
  activeTab = signal<'profile' | 'subscription' | 'history' | 'mpesa'>('profile');

  // State Signals
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  subscribing = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // M-Pesa Config Signals
  savingMpesa = signal<boolean>(false);
  mpesaConfig = signal<MpesaConfig>({
    shortcode: '',
    passkey: '',
    consumer_key: '',
    consumer_secret: '',
    environment: 'sandbox',
    transaction_type: 'CustomerPayBillOnline',
    account_reference_prefix: 'AfyoraHMS',
    is_active: true,
  });

  // Facility & Payment Data
  facility = signal<FacilityProfile | null>(null);
  paymentHistory = signal<SubscriptionPaymentRecord[]>([]);

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
      monthlyPriceUSD: 24,
      yearlyPriceUSD: 230,
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
      monthlyPriceUSD: 48,
      yearlyPriceUSD: 460,
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
      monthlyPriceUSD: 104,
      yearlyPriceUSD: 998,
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

  loadMpesaConfig(facilityId: number | string): void {
    this.billingService.getMpesaConfig(facilityId).subscribe({
      next: (res) => {
        if (res.data) {
          this.mpesaConfig.set(res.data);
        }
      },
      error: (err) => {
        console.error('Failed to load M-Pesa config:', err);
      },
    });
  }

  saveMpesaSettings(): void {
    const fac = this.facility();
    if (!fac?.id) return;

    this.savingMpesa.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.billingService.saveMpesaConfig(fac.id, this.mpesaConfig()).subscribe({
      next: (res) => {
        if (res.data) {
          this.mpesaConfig.set(res.data);
        }
        this.savingMpesa.set(false);
        this.successMessage.set('M-Pesa payment configuration updated successfully!');
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: (err) => {
        console.error('Failed to save M-Pesa config:', err);
        this.savingMpesa.set(false);
        this.errorMessage.set(err?.error?.error || 'Failed to save M-Pesa configuration.');
      },
    });
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
        this.successMessage.set(
          'Facility profile updated successfully!',
        );
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

  startSubscriptionStatusPolling(checkoutReqId: string, packageName: string): void {
    this.clearSubscriptionPolling();
    let elapsed = 0;
    const maxAttempts = 20; // 60 seconds

    this.subscriptionPollTimer = setInterval(() => {
      elapsed++;
      if (elapsed > maxAttempts) {
        this.clearSubscriptionPolling();
        this.paymentProcessing.set(false);
        this.stkPushSent.set(false);
        this.errorMessage.set('M-Pesa transaction validation timed out. Please retry or check your PIN entry.');
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
                `Payment verified! Your facility has been successfully upgraded to ${packageName}.`
              );
              this.loadFacilityData();
              setTimeout(() => this.successMessage.set(null), 5000);
            } else if (status === 'Failed' || status === 'Cancelled') {
              this.clearSubscriptionPolling();
              this.paymentProcessing.set(false);
              this.stkPushSent.set(false);
              this.errorMessage.set(
                res.data.result_desc || `M-Pesa transaction was ${status.toLowerCase()}.`
              );
            }
          }
        },
        error: (err) => {
          console.error('Polling subscription error:', err);
        }
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
