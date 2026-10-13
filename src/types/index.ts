export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type RequestUrgency = 'CRITICAL' | 'URGENT' | 'STANDARD';

export type RequestStatus = 'PENDING' | 'IN_PROGRESS' | 'FULFILLED' | 'CANCELLED';

export type DonorStatus = 'ACTIVE' | 'INACTIVE';

export type AlertChannel = 'SMS' | 'WHATSAPP' | 'EMAIL';

export type AlertStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED' | 'DECLINED';

export interface Donor {
  id: string;
  fullName: string;
  bloodGroup: BloodGroup;
  city: string;
  stateOrRegion?: string;
  phone: string;
  email: string;
  age: number;
  weightKg: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  status: DonorStatus;
  lastDonationDate: string | null; // ISO string 'YYYY-MM-DD' or null
  totalDonations: number;
  notes?: string;
  isAvailableNow: boolean;
  registeredAt: string; // ISO string
}

export interface BloodRequest {
  id: string;
  patientNameOrRef: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  unitsFulfilled: number;
  hospitalName: string;
  hospitalDepartment?: string;
  city: string;
  urgency: RequestUrgency;
  status: RequestStatus;
  contactPerson: string;
  contactPhone: string;
  requiredDate: string; // ISO string
  createdAt: string; // ISO string
  fulfilledAt?: string;
  clinicalReason?: string;
  notes?: string;
}

export interface MatchFactor {
  title: string;
  isPositive: boolean;
  scoreImpact: number;
  description: string;
}

export interface DonorMatchResult {
  donor: Donor;
  matchScore: number; // 0 - 100
  isCompatible: boolean;
  compatibilityType: 'EXACT' | 'UNIVERSAL_COMPATIBLE' | 'RH_COMPATIBLE' | 'INCOMPATIBLE';
  isCooldownEligible: boolean;
  daysSinceLastDonation: number | null;
  cooldownDaysRemaining: number;
  locationMatch: 'SAME_CITY' | 'NEARBY' | 'DIFFERENT_CITY';
  matchFactors: MatchFactor[];
  eligibilityExplanation: string;
  alreadyAlertedForThisRequest: boolean;
  lastAlertTimestamp?: string;
}

export interface AlertDraft {
  id: string;
  requestId: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  donorBloodGroup: BloodGroup;
  requestHospital: string;
  requestCity: string;
  unitsNeeded: number;
  urgency: RequestUrgency;
  channel: AlertChannel;
  messageContent: string;
  createdAt: string;
}

export interface AlertLog {
  id: string;
  requestId: string;
  donorId: string;
  donorName: string;
  recipientContact: string;
  bloodGroup: BloodGroup;
  urgency: RequestUrgency;
  hospitalName: string;
  city: string;
  channel: AlertChannel;
  message: string;
  sentAt: string;
  status: AlertStatus;
  isDuplicateSuppressed?: boolean;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  category: 'DONOR' | 'REQUEST' | 'ALERT' | 'SYSTEM' | 'MATCH';
  action: string;
  description: string;
  actor: string;
  metadata?: Record<string, any>;
}

export interface SystemSettings {
  cooldownPeriodDays: number; // standard red cell interval, typically 56 days
  enableDuplicateAlertWindowHours: number; // default 24 hours
  defaultAlertChannel: AlertChannel;
  organizationName: string;
  helplinePhone: string;
  soundAlertsEnabled: boolean;
}
