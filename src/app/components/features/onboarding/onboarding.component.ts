import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { LogoComponent } from '../../shared/logo/logo.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    LogoComponent
  ],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css'
})
export class OnboardingComponent implements OnInit {
  currentStep = 0;
  selectedModules: string[] = [];
  facilityType: string = 'hospital';

  steps = [
    "Hospital Registration",
    "Email Verification",
    "Admin User",
    "Module Selection",
    "Subscription",
  ];

  modules = [
    "Patient Management",
    "Electronic Health Records",
    "Pharmacy Management",
    "Billing & Finance",
    "Employee Management",
    "Inventory Management",
    "Laboratory Management",
    "Radiology Management",
    "Reports & Analytics",
  ];

  plans = [
    {
      name: "Basic",
      price: "$299",
      features: ["Up to 100 patients", "3 users", "Basic modules", "Email support"],
    },
    {
      name: "Professional",
      price: "$599",
      features: ["Up to 500 patients", "15 users", "All modules", "Priority support"],
    },
    {
      name: "Enterprise",
      price: "$1299",
      features: ["Unlimited patients", "Unlimited users", "All modules", "24/7 support"],
    },
  ];

  Math = Math; // to allow Math.max usage in template

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.facilityType = params['type'] || 'hospital';
    });
  }

  handleComplete(): void {
    this.router.navigate(['/']);
  }

  toggleModule(module: string): void {
    const index = this.selectedModules.indexOf(module);
    if (index > -1) {
      this.selectedModules.splice(index, 1);
    } else {
      this.selectedModules.push(module);
    }
  }

  isModuleSelected(module: string): boolean {
    return this.selectedModules.includes(module);
  }
}
