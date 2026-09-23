import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ShieldCheck, Plus, CheckCircle2, AlertTriangle, RefreshCw, Server, Key, Globe, Activity, Trash2, Edit3 } from 'lucide-angular';
import { DhaAfyaConnectService } from '../../../services/dha-afyaconnect.service';
import { InsuranceProvider } from '../../../models/dha-connect.models';

@Component({
  selector: 'app-insurance-management',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './insurance-management.component.html',
  styleUrl: './insurance-management.component.css'
})
export class InsuranceManagementComponent implements OnInit {
  private readonly dhaService = inject(DhaAfyaConnectService);

  readonly ShieldCheck = ShieldCheck;
  readonly Plus = Plus;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertTriangle = AlertTriangle;
  readonly RefreshCw = RefreshCw;
  readonly Server = Server;
  readonly Key = Key;
  readonly Globe = Globe;
  readonly Activity = Activity;
  readonly Trash2 = Trash2;
  readonly Edit3 = Edit3;

  providers: InsuranceProvider[] = [];
  loading = false;
  pingingId: number | null = null;

  showModal = false;
  isEditing = false;
  editingId: number | null = null;

  providerForm: Partial<InsuranceProvider> = {
    name: 'Social Health Authority (SHA)',
    code: 'SHA',
    payer_type: 'SOCIAL',
    gateway_url: 'https://ilm-dev.dha.go.ke/uat-middleware',
    facility_code: 'MOH-FAC-001',
    api_token: '',
    environment: 'UAT',
    is_active: true,
    sandbox_mode: true,
    supported_schemes: ['Outpatient', 'Inpatient', 'Emergency', 'Capitation']
  };

  schemeInput = '';
  alertMessage: { type: 'success' | 'danger' | 'info'; text: string } | null = null;

  get activeProvidersCount(): number {
    return Array.isArray(this.providers) ? this.providers.filter(p => p.is_active).length : 0;
  }

  ngOnInit(): void {

    this.loadProviders();
  }

  loadProviders(): void {
    this.loading = true;
    this.dhaService.getInsuranceProviders().subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.providers = data;
        } else if (data && Array.isArray(data.results)) {
          this.providers = data.results;
        } else if (data && Array.isArray(data.data)) {
          this.providers = data.data;
        } else {
          this.providers = [];
        }
        this.loading = false;
        if (this.providers.length === 0) {
          // Pre-populate SHA default if list is empty
          this.saveDefaultSHA();
        }
      },
      error: (err) => {
        this.showAlert('danger', 'Failed to load insurance providers.');
        this.loading = false;
      }
    });
  }

  private saveDefaultSHA(): void {
    const defaultSha: Partial<InsuranceProvider> = {
      name: 'Social Health Authority (SHA / DHA AfyaConnect)',
      code: 'SHA',
      payer_type: 'SOCIAL',
      gateway_url: 'https://ilm-dev.dha.go.ke/uat-middleware',
      facility_code: 'MOH-FAC-001',
      api_token: 'dha_uat_bearer_token_2026',
      environment: 'UAT',
      is_active: true,
      sandbox_mode: true,
      supported_schemes: ['Outpatient', 'Inpatient', 'Emergency', 'Capitation'],
      last_ping_status: 'Healthy (200 OK)',
      last_ping_at: new Date().toISOString()
    };

    this.dhaService.createInsuranceProvider(defaultSha).subscribe({
      next: () => this.loadProviders()
    });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.providerForm = {
      name: '',
      code: '',
      payer_type: 'SOCIAL',
      gateway_url: 'https://ilm-dev.dha.go.ke/uat-middleware',
      facility_code: 'MOH-FAC-001',
      api_token: '',
      environment: 'UAT',
      is_active: true,
      sandbox_mode: true,
      supported_schemes: ['Outpatient', 'Inpatient']
    };
    this.showModal = true;
  }

  openEditModal(provider: InsuranceProvider): void {
    this.isEditing = true;
    this.editingId = provider.id || null;
    this.providerForm = {
      name: provider.name,
      code: provider.code,
      payer_type: provider.payer_type,
      gateway_url: provider.gateway_url,
      facility_code: provider.facility_code,
      api_token: provider.api_token || '',
      environment: provider.environment,
      is_active: provider.is_active,
      sandbox_mode: provider.sandbox_mode,
      supported_schemes: [...(provider.supported_schemes || [])]
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  addScheme(): void {
    if (this.schemeInput.trim()) {
      if (!this.providerForm.supported_schemes) {
        this.providerForm.supported_schemes = [];
      }
      this.providerForm.supported_schemes.push(this.schemeInput.trim());
      this.schemeInput = '';
    }
  }

  removeScheme(index: number): void {
    this.providerForm.supported_schemes?.splice(index, 1);
  }

  saveProvider(): void {
    if (!this.providerForm.name || !this.providerForm.code || !this.providerForm.gateway_url) {
      this.showAlert('danger', 'Please complete all required fields.');
      return;
    }

    if (this.isEditing && this.editingId) {
      this.dhaService.updateInsuranceProvider(this.editingId, this.providerForm).subscribe({
        next: () => {
          this.showAlert('success', 'Insurance Provider updated successfully.');
          this.closeModal();
          this.loadProviders();
        },
        error: () => this.showAlert('danger', 'Error updating insurance provider.')
      });
    } else {
      this.dhaService.createInsuranceProvider(this.providerForm).subscribe({
        next: () => {
          this.showAlert('success', 'New Insurance Provider onboarded successfully!');
          this.closeModal();
          this.loadProviders();
        },
        error: () => this.showAlert('danger', 'Error onboarding insurance provider.')
      });
    }
  }

  toggleActive(provider: InsuranceProvider): void {
    if (!provider.id) return;
    const updated = { is_active: !provider.is_active };
    this.dhaService.updateInsuranceProvider(provider.id, updated).subscribe({
      next: () => {
        this.showAlert('info', `Provider ${provider.name} set to ${updated.is_active ? 'Active' : 'Inactive'}.`);
        this.loadProviders();
      }
    });
  }

  deleteProvider(provider: InsuranceProvider): void {
    if (!provider.id) return;
    if (confirm(`Are you sure you want to remove insurance configuration for ${provider.name}?`)) {
      this.dhaService.deleteInsuranceProvider(provider.id).subscribe({
        next: () => {
          this.showAlert('success', 'Insurance provider removed.');
          this.loadProviders();
        }
      });
    }
  }

  pingGateway(provider: InsuranceProvider): void {
    if (!provider.id) return;
    this.pingingId = provider.id;
    this.dhaService.pingInsuranceGateway(provider.id).subscribe({
      next: (res) => {
        this.pingingId = null;
        this.showAlert('success', `Gateway ping test successful for ${provider.name}: ${res.last_ping_status}`);
        this.loadProviders();
      },
      error: () => {
        this.pingingId = null;
        this.showAlert('danger', `Gateway connection check failed for ${provider.name}.`);
      }
    });
  }

  showAlert(type: 'success' | 'danger' | 'info', text: string): void {
    this.alertMessage = { type, text };
    setTimeout(() => {
      this.alertMessage = null;
    }, 5000);
  }
}
