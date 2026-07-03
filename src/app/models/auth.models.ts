export type FacilityType = 'hospital' | 'clinic';

export type LoginRequest = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
};

export type SignupRequest = {
  facilityType: FacilityType;
  facilityName: string;
  registrationNumber: string;
  adminFirstName: string;
  adminLastName: string;
  email: string;
  phone: string;
  password: string;
};

export type SignupResponse = {
  organizationId?: number | string;
  organization_id?: number | string;
  onboardingRequired?: boolean;
  onboarding_required?: boolean;
  message?: string;
};

export type FacilityOnboardingRequest = {
  organization_id: number | string;
  facilityType: FacilityType;
  facilityName: string;
  address: string;
  city: string;
  phone: string;
  facilityEmail: string;
  licenseNumber: string;
  numberOfBeds?: number | null;
  specialization?: string;
  emailOtp?: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  modules: string[];
  selectedPlan: string;
};

export type FacilityOnboardingResponse = {
  facilityId: number | string;
  onboardingCompleted: boolean;
  message?: string;
};
