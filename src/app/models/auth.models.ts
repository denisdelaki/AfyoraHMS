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
  organizationId: string;
  onboardingRequired: boolean;
};
