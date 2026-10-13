import {
  Donor,
  BloodRequest,
  AlertLog,
  ActivityLogItem,
  SystemSettings,
  BloodGroup,
} from '../types';

const STORAGE_KEYS = {
  INITIALIZED: 'lifelink_initialized_v1',
  DONORS: 'lifelink_donors_v1',
  REQUESTS: 'lifelink_requests_v1',
  ALERTS: 'lifelink_alerts_v1',
  ACTIVITY: 'lifelink_activity_v1',
  SETTINGS: 'lifelink_settings_v1',
};

export const DEFAULT_SETTINGS: SystemSettings = {
  cooldownPeriodDays: 56, // American Red Cross standard for whole blood
  enableDuplicateAlertWindowHours: 24,
  defaultAlertChannel: 'SMS',
  organizationName: 'LifeLink Regional Blood Exchange',
  helplinePhone: '+1 (800) 555-0199',
  soundAlertsEnabled: true,
};

// Safe helper
function safeJsonParse<T>(jsonStr: string | null, fallback: T): T {
  if (!jsonStr) return fallback;
  try {
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    console.error('SafeJsonParse error:', err);
    return fallback;
  }
}

// Custom event for reactive UI updates
export function emitDataChange(source: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lifelink_data_changed', { detail: { source } }));
  }
}

// Generate realistic seed donors
function getSeedDonors(): Donor[] {
  return [
    {
      id: 'dnr-001',
      fullName: 'Dr. Sarah Lin',
      bloodGroup: 'O-',
      city: 'Seattle',
      stateOrRegion: 'WA',
      phone: '+1 (206) 555-0142',
      email: 'sarah.lin.demo@hospitalnet.org',
      age: 34,
      weightKg: 64,
      gender: 'FEMALE',
      status: 'ACTIVE',
      lastDonationDate: '2026-06-15', // ~120 days ago (fully eligible)
      totalDonations: 8,
      isAvailableNow: true,
      registeredAt: '2025-01-10T08:00:00Z',
      notes: 'Universal donor. Regular platelet and whole blood volunteer.',
    },
    {
      id: 'dnr-002',
      fullName: 'Marcus Vance',
      bloodGroup: 'O+',
      city: 'Seattle',
      stateOrRegion: 'WA',
      phone: '+1 (206) 555-0188',
      email: 'marcus.vance.demo@gmail.com',
      age: 29,
      weightKg: 78,
      gender: 'MALE',
      status: 'ACTIVE',
      lastDonationDate: '2026-09-28', // ~15 days ago (currently in recovery cooldown)
      totalDonations: 4,
      isAvailableNow: true,
      registeredAt: '2025-04-18T10:30:00Z',
      notes: 'Donated recently at Westside Community Blood Drive.',
    },
    {
      id: 'dnr-003',
      fullName: 'Elena Rostova',
      bloodGroup: 'A+',
      city: 'Seattle',
      stateOrRegion: 'WA',
      phone: '+1 (206) 555-0211',
      email: 'elena.rostova.demo@outlook.com',
      age: 41,
      weightKg: 58,
      gender: 'FEMALE',
      status: 'ACTIVE',
      lastDonationDate: '2026-04-10', // ~185 days ago (fully eligible)
      totalDonations: 12,
      isAvailableNow: true,
      registeredAt: '2024-09-01T14:15:00Z',
      notes: 'Frequent donor at Swedish First Hill campus.',
    },
    {
      id: 'dnr-004',
      fullName: 'David K. Chen',
      bloodGroup: 'A-',
      city: 'Bellevue',
      stateOrRegion: 'WA',
      phone: '+1 (425) 555-0174',
      email: 'david.chen.demo@proton.me',
      age: 26,
      weightKg: 71,
      gender: 'MALE',
      status: 'ACTIVE',
      lastDonationDate: null, // First-time / unrecorded (eligible)
      totalDonations: 0,
      isAvailableNow: true,
      registeredAt: '2026-08-12T11:00:00Z',
      notes: 'New volunteer donor. Verified hemoglobin during registration.',
    },
    {
      id: 'dnr-005',
      fullName: 'Amara Okafor',
      bloodGroup: 'B+',
      city: 'Seattle',
      stateOrRegion: 'WA',
      phone: '+1 (206) 555-0319',
      email: 'amara.okafor.demo@icloud.com',
      age: 31,
      weightKg: 62,
      gender: 'FEMALE',
      status: 'ACTIVE',
      lastDonationDate: '2026-05-20', // ~145 days ago (eligible)
      totalDonations: 5,
      isAvailableNow: true,
      registeredAt: '2025-02-14T09:40:00Z',
      notes: 'Available for evening emergency dispatches.',
    },
    {
      id: 'dnr-006',
      fullName: 'Carlos Mendoza',
      bloodGroup: 'B-',
      city: 'Tacoma',
      stateOrRegion: 'WA',
      phone: '+1 (253) 555-0193',
      email: 'carlos.mendoza.demo@yahoo.com',
      age: 38,
      weightKg: 82,
      gender: 'MALE',
      status: 'ACTIVE',
      lastDonationDate: '2026-07-02', // ~103 days ago (eligible)
      totalDonations: 7,
      isAvailableNow: false,
      registeredAt: '2024-11-20T16:20:00Z',
      notes: 'Rare B- donor. Currently traveling until Friday.',
    },
    {
      id: 'dnr-007',
      fullName: 'Priya Sharma',
      bloodGroup: 'AB+',
      city: 'Seattle',
      stateOrRegion: 'WA',
      phone: '+1 (206) 555-0450',
      email: 'priya.sharma.demo@techlab.org',
      age: 28,
      weightKg: 55,
      gender: 'FEMALE',
      status: 'ACTIVE',
      lastDonationDate: '2026-03-14', // > 200 days ago (eligible)
      totalDonations: 6,
      isAvailableNow: true,
      registeredAt: '2025-06-01T12:00:00Z',
      notes: 'Universal plasma donor. Registered at Harborview clinic.',
    },
    {
      id: 'dnr-008',
      fullName: 'Liam Patrick Gallagher',
      bloodGroup: 'AB-',
      city: 'Portland',
      stateOrRegion: 'OR',
      phone: '+1 (503) 555-0162',
      email: 'liam.gallagher.demo@mail.com',
      age: 45,
      weightKg: 85,
      gender: 'MALE',
      status: 'ACTIVE',
      lastDonationDate: '2026-06-30', // ~105 days ago (eligible)
      totalDonations: 15,
      isAvailableNow: true,
      registeredAt: '2023-10-15T09:00:00Z',
      notes: 'Veteran AB- donor. Willing to travel for critical pediatric cases.',
    },
    {
      id: 'dnr-009',
      fullName: 'Rachel Goldberg',
      bloodGroup: 'O-',
      city: 'Bellevue',
      stateOrRegion: 'WA',
      phone: '+1 (425) 555-0288',
      email: 'rachel.g.demo@gmail.com',
      age: 32,
      weightKg: 59,
      gender: 'FEMALE',
      status: 'ACTIVE',
      lastDonationDate: '2026-09-05', // ~38 days ago (in cooldown for 18 more days)
      totalDonations: 9,
      isAvailableNow: false,
      registeredAt: '2024-05-11T13:20:00Z',
      notes: 'Universal donor. Scheduled next donation in 3 weeks.',
    },
    {
      id: 'dnr-010',
      fullName: 'Tariq Al-Mansoor',
      bloodGroup: 'A+',
      city: 'Seattle',
      stateOrRegion: 'WA',
      phone: '+1 (206) 555-0512',
      email: 'tariq.mansoor.demo@biocare.com',
      age: 36,
      weightKg: 74,
      gender: 'MALE',
      status: 'ACTIVE',
      lastDonationDate: '2026-07-20', // ~85 days ago (eligible)
      totalDonations: 3,
      isAvailableNow: true,
      registeredAt: '2025-08-04T15:45:00Z',
      notes: 'Responds within 30 minutes for emergency alerts.',
    },
    {
      id: 'dnr-011',
      fullName: 'Zoe Alexandra Mitchell',
      bloodGroup: 'O+',
      city: 'Tacoma',
      stateOrRegion: 'WA',
      phone: '+1 (253) 555-0331',
      email: 'zoe.mitchell.demo@gmail.com',
      age: 23,
      weightKg: 52,
      gender: 'FEMALE',
      status: 'INACTIVE',
      lastDonationDate: '2026-01-10',
      totalDonations: 2,
      isAvailableNow: false,
      registeredAt: '2025-09-12T10:00:00Z',
      notes: 'Temporarily paused due to minor dental procedure.',
    },
    {
      id: 'dnr-012',
      fullName: 'Hassan Jabari',
      bloodGroup: 'B+',
      city: 'Seattle',
      stateOrRegion: 'WA',
      phone: '+1 (206) 555-0677',
      email: 'hassan.jabari.demo@edu.org',
      age: 40,
      weightKg: 80,
      gender: 'MALE',
      status: 'ACTIVE',
      lastDonationDate: '2026-06-01', // ~134 days ago (eligible)
      totalDonations: 10,
      isAvailableNow: true,
      registeredAt: '2024-02-18T14:00:00Z',
      notes: 'Campus liaison for community blood donation campaigns.',
    },
    {
      id: 'dnr-013',
      fullName: 'Hannah Elizabeth Scott',
      bloodGroup: 'O-',
      city: 'Seattle',
      stateOrRegion: 'WA',
      phone: '+1 (206) 555-0722',
      email: 'hannah.scott.demo@gmail.com',
      age: 27,
      weightKg: 61,
      gender: 'FEMALE',
      status: 'ACTIVE',
      lastDonationDate: '2026-05-10', // ~156 days ago (eligible)
      totalDonations: 5,
      isAvailableNow: true,
      registeredAt: '2025-03-22T08:15:00Z',
      notes: 'Available on weekends and immediate call.',
    },
  ];
}

// Generate realistic seed blood requests
function getSeedRequests(): BloodRequest[] {
  return [
    {
      id: 'req-101',
      patientNameOrRef: 'Case #4082 (Trauma Surgery)',
      bloodGroup: 'O-',
      unitsNeeded: 4,
      unitsFulfilled: 1,
      hospitalName: 'Harborview Medical Center',
      hospitalDepartment: 'Emergency Trauma Level 1',
      city: 'Seattle',
      urgency: 'CRITICAL',
      status: 'IN_PROGRESS',
      contactPerson: 'Dr. Raymond Holt, Transfusion Coordinator',
      contactPhone: '+1 (206) 555-9911',
      requiredDate: '2026-10-13T18:00:00Z',
      createdAt: '2026-10-13T07:30:00Z',
      clinicalReason: 'Multiple trauma post-MVA with severe hemorrhage. Urgent uncrossmatched O- required.',
      notes: 'Hospital transfusion medicine unit standing by.',
    },
    {
      id: 'req-102',
      patientNameOrRef: 'Case #4083 (Pediatric Cardiac)',
      bloodGroup: 'A+',
      unitsNeeded: 3,
      unitsFulfilled: 0,
      hospitalName: 'Seattle Children’s Hospital',
      hospitalDepartment: 'Pediatric Cardiac ICU',
      city: 'Seattle',
      urgency: 'CRITICAL',
      status: 'PENDING',
      contactPerson: 'Nurse Specialist Clara Oswald',
      contactPhone: '+1 (206) 555-9922',
      requiredDate: '2026-10-14T08:00:00Z',
      createdAt: '2026-10-13T08:15:00Z',
      clinicalReason: 'Congenital heart defect corrective surgery scheduled tomorrow morning.',
      notes: 'Prefers CMV-negative or thoroughly screened donors.',
    },
    {
      id: 'req-103',
      patientNameOrRef: 'Case #4079 (Obstetric Hemorrhage)',
      bloodGroup: 'B+',
      unitsNeeded: 2,
      unitsFulfilled: 2,
      hospitalName: 'Swedish Medical Center First Hill',
      hospitalDepartment: 'Labor & Delivery',
      city: 'Seattle',
      urgency: 'URGENT',
      status: 'FULFILLED',
      contactPerson: 'Midwife Supervisor Maria Santos',
      contactPhone: '+1 (206) 555-9933',
      requiredDate: '2026-10-12T16:00:00Z',
      createdAt: '2026-10-12T11:00:00Z',
      fulfilledAt: '2026-10-12T15:20:00Z',
      clinicalReason: 'Postpartum hemorrhage stabilized after 2 units whole blood transfusion.',
      notes: 'Fully resolved and patient in stable recovery.',
    },
    {
      id: 'req-104',
      patientNameOrRef: 'Case #4085 (Oncology Anemia)',
      bloodGroup: 'AB-',
      unitsNeeded: 2,
      unitsFulfilled: 0,
      hospitalName: 'Fred Hutchinson Cancer Center',
      hospitalDepartment: 'Hematology Day Ward',
      city: 'Seattle',
      urgency: 'URGENT',
      status: 'PENDING',
      contactPerson: 'Dr. Gregory House, Clinical Hematologist',
      contactPhone: '+1 (206) 555-9944',
      requiredDate: '2026-10-15T12:00:00Z',
      createdAt: '2026-10-12T14:40:00Z',
      clinicalReason: 'Severe aplastic anemia maintenance transfusion.',
      notes: 'Rare AB- recipient requiring compatible RBC units.',
    },
    {
      id: 'req-105',
      patientNameOrRef: 'Case #4081 (Elective Orthopedic)',
      bloodGroup: 'O+',
      unitsNeeded: 2,
      unitsFulfilled: 1,
      hospitalName: 'Overlake Medical Center',
      hospitalDepartment: 'Orthopedics Pre-op',
      city: 'Bellevue',
      urgency: 'STANDARD',
      status: 'IN_PROGRESS',
      contactPerson: 'Nurse Lead Kevin Tran',
      contactPhone: '+1 (425) 555-9955',
      requiredDate: '2026-10-16T09:00:00Z',
      createdAt: '2026-10-11T10:00:00Z',
      clinicalReason: 'Total hip arthroplasty standby inventory.',
      notes: 'Standard scheduled procedure.',
    },
    {
      id: 'req-106',
      patientNameOrRef: 'Case #4075 (Gastrointestinal Bleed)',
      bloodGroup: 'A-',
      unitsNeeded: 3,
      unitsFulfilled: 3,
      hospitalName: 'Virginia Mason Hospital',
      hospitalDepartment: 'Gastroenterology ICU',
      city: 'Seattle',
      urgency: 'URGENT',
      status: 'FULFILLED',
      contactPerson: 'Dr. Allison Cameron',
      contactPhone: '+1 (206) 555-9966',
      requiredDate: '2026-10-10T14:00:00Z',
      createdAt: '2026-10-10T06:00:00Z',
      fulfilledAt: '2026-10-10T13:45:00Z',
      clinicalReason: 'Acute upper GI bleed successfully treated with endoscopy and 3 units RBC.',
    },
  ];
}

// Generate realistic seed alerts
function getSeedAlerts(): AlertLog[] {
  return [
    {
      id: 'alt-501',
      requestId: 'req-101',
      donorId: 'dnr-001',
      donorName: 'Dr. Sarah Lin',
      recipientContact: '+1 (206) 555-0142',
      bloodGroup: 'O-',
      urgency: 'CRITICAL',
      hospitalName: 'Harborview Medical Center',
      city: 'Seattle',
      channel: 'SMS',
      message: 'CRITICAL ALERT (LifeLink): Harborview Medical Center urgently needs 4 units of O- blood for emergency trauma. As an eligible O- universal donor, your immediate support can save a life. Please call +1 (206) 555-9911 or visit Harborview ER triage.',
      sentAt: '2026-10-13T07:45:00Z',
      status: 'DELIVERED',
      isDuplicateSuppressed: false,
    },
    {
      id: 'alt-502',
      requestId: 'req-103',
      donorId: 'dnr-005',
      donorName: 'Amara Okafor',
      recipientContact: '+1 (206) 555-0319',
      bloodGroup: 'B+',
      urgency: 'URGENT',
      hospitalName: 'Swedish Medical Center First Hill',
      city: 'Seattle',
      channel: 'WHATSAPP',
      message: 'URGENT (LifeLink): Swedish Medical Center First Hill needs 2 units of B+ blood for Labor & Delivery. Please reply YES if you are able to donate today.',
      sentAt: '2026-10-12T11:15:00Z',
      status: 'ACKNOWLEDGED',
      isDuplicateSuppressed: false,
    },
    {
      id: 'alt-503',
      requestId: 'req-106',
      donorId: 'dnr-004',
      donorName: 'David K. Chen',
      recipientContact: '+1 (425) 555-0174',
      bloodGroup: 'A-',
      urgency: 'URGENT',
      hospitalName: 'Virginia Mason Hospital',
      city: 'Seattle',
      channel: 'SMS',
      message: 'URGENT (LifeLink): Virginia Mason Hospital requests A- blood donor assistance. Call +1 (206) 555-9966 if available.',
      sentAt: '2026-10-10T06:30:00Z',
      status: 'DELIVERED',
      isDuplicateSuppressed: false,
    },
  ];
}

// Generate realistic activity log
function getSeedActivity(): ActivityLogItem[] {
  return [
    {
      id: 'act-001',
      timestamp: '2026-10-13T08:15:00Z',
      category: 'REQUEST',
      action: 'Request Created',
      description: 'Pediatric Cardiac Case #4083 created for Seattle Children’s Hospital (A+, 3 units). Urgency: CRITICAL.',
      actor: 'Nurse Clara Oswald',
      metadata: { requestId: 'req-102' },
    },
    {
      id: 'act-002',
      timestamp: '2026-10-13T07:45:00Z',
      category: 'ALERT',
      action: 'Emergency SMS Dispatched',
      description: 'Urgent notification sent to Dr. Sarah Lin (O-) for Harborview Trauma Case #4082.',
      actor: 'Dispatch Coordinator',
      metadata: { alertId: 'alt-501', donorId: 'dnr-001' },
    },
    {
      id: 'act-003',
      timestamp: '2026-10-13T07:30:00Z',
      category: 'REQUEST',
      action: 'Emergency Request Created',
      description: 'Critical Trauma Case #4082 registered by Harborview Medical Center (O-, 4 units).',
      actor: 'Dr. Raymond Holt',
      metadata: { requestId: 'req-101' },
    },
    {
      id: 'act-004',
      timestamp: '2026-10-12T15:20:00Z',
      category: 'REQUEST',
      action: 'Request Fulfilled',
      description: 'Case #4079 (Swedish Medical Center) marked FULFILLED (2/2 units collected).',
      actor: 'Blood Bank Pathologist',
      metadata: { requestId: 'req-103' },
    },
    {
      id: 'act-005',
      timestamp: '2026-10-11T10:00:00Z',
      category: 'SYSTEM',
      action: 'Network Initialized',
      description: 'LifeLink Regional Blood Exchange initialized with local storage registry.',
      actor: 'System Admin',
    },
  ];
}

/**
 * Storage Service singleton class
 */
export const StorageService = {
  /**
   * Initializes sample records ONLY if this is the first launch.
   * If records already exist, it leaves them completely intact.
   */
  initOnFirstLaunch(): void {
    if (typeof window === 'undefined') return;
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInitialized) {
      localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(getSeedDonors()));
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(getSeedRequests()));
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(getSeedAlerts()));
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(getSeedActivity()));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      emitDataChange('init');
    }
  },

  /**
   * Confirmed reset of demo data. Completely re-seeds the default records
   * and records an audit activity item.
   */
  resetDemoData(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(getSeedDonors()));
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(getSeedRequests()));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(getSeedAlerts()));
    const resetActivity: ActivityLogItem[] = [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        category: 'SYSTEM',
        action: 'Demo Data Reset',
        description: 'System state was safely reset to standard clinical demonstration datasets.',
        actor: 'Network Administrator',
      },
      ...getSeedActivity(),
    ];
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(resetActivity));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    emitDataChange('reset');
  },

  // ------------------- DONORS -------------------
  getDonors(): Donor[] {
    if (typeof window === 'undefined') return [];
    this.initOnFirstLaunch();
    const data = localStorage.getItem(STORAGE_KEYS.DONORS);
    return safeJsonParse<Donor[]>(data, []);
  },

  saveDonor(donor: Donor): void {
    const donors = this.getDonors();
    const index = donors.findIndex((d) => d.id === donor.id);
    let isNew = false;
    if (index >= 0) {
      donors[index] = donor;
    } else {
      isNew = true;
      donors.unshift(donor);
    }
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(donors));

    this.addActivityItem({
      category: 'DONOR',
      action: isNew ? 'Donor Registered' : 'Donor Profile Updated',
      description: `${donor.fullName} (${donor.bloodGroup}, ${donor.city}) ${isNew ? 'registered in directory' : 'profile modified'}.`,
      actor: 'Coordinator',
      metadata: { donorId: donor.id, bloodGroup: donor.bloodGroup },
    });

    emitDataChange('donors');
  },

  deleteDonor(donorId: string): void {
    const donors = this.getDonors();
    const target = donors.find((d) => d.id === donorId);
    const filtered = donors.filter((d) => d.id !== donorId);
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(filtered));

    if (target) {
      this.addActivityItem({
        category: 'DONOR',
        action: 'Donor Removed',
        description: `${target.fullName} (${target.bloodGroup}) was removed from active directory.`,
        actor: 'Coordinator',
      });
    }

    emitDataChange('donors');
  },

  toggleDonorStatus(donorId: string): void {
    const donors = this.getDonors();
    const target = donors.find((d) => d.id === donorId);
    if (!target) return;
    target.status = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(donors));

    this.addActivityItem({
      category: 'DONOR',
      action: 'Status Toggled',
      description: `${target.fullName} set to ${target.status}.`,
      actor: 'Coordinator',
    });

    emitDataChange('donors');
  },

  // ------------------- REQUESTS -------------------
  getRequests(): BloodRequest[] {
    if (typeof window === 'undefined') return [];
    this.initOnFirstLaunch();
    const data = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    return safeJsonParse<BloodRequest[]>(data, []);
  },

  saveRequest(req: BloodRequest): void {
    const requests = this.getRequests();
    const index = requests.findIndex((r) => r.id === req.id);
    let isNew = false;
    if (index >= 0) {
      requests[index] = req;
    } else {
      isNew = true;
      requests.unshift(req);
    }
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));

    this.addActivityItem({
      category: 'REQUEST',
      action: isNew ? 'Request Created' : 'Request Updated',
      description: `${req.hospitalName} requested ${req.unitsNeeded} units of ${req.bloodGroup} (${req.urgency}).`,
      actor: 'Hospital Liaison',
      metadata: { requestId: req.id, urgency: req.urgency, bloodGroup: req.bloodGroup },
    });

    emitDataChange('requests');
  },

  updateRequestStatus(requestId: string, newStatus: BloodRequest['status'], unitsFulfilled?: number): void {
    const requests = this.getRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    req.status = newStatus;
    if (typeof unitsFulfilled === 'number') {
      req.unitsFulfilled = unitsFulfilled;
    }
    if (newStatus === 'FULFILLED') {
      req.fulfilledAt = new Date().toISOString();
      if (req.unitsFulfilled < req.unitsNeeded) {
        req.unitsFulfilled = req.unitsNeeded;
      }
    }

    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));

    this.addActivityItem({
      category: 'REQUEST',
      action: `Request ${newStatus}`,
      description: `Request #${req.id.replace('req-', '')} at ${req.hospitalName} marked as ${newStatus}.`,
      actor: 'Transfusion Coordinator',
      metadata: { requestId: req.id, status: newStatus },
    });

    emitDataChange('requests');
  },

  deleteRequest(requestId: string): void {
    const requests = this.getRequests();
    const target = requests.find((r) => r.id === requestId);
    const filtered = requests.filter((r) => r.id !== requestId);
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(filtered));

    if (target) {
      this.addActivityItem({
        category: 'REQUEST',
        action: 'Request Cancelled / Removed',
        description: `Request for ${target.bloodGroup} at ${target.hospitalName} was removed.`,
        actor: 'Coordinator',
      });
    }

    emitDataChange('requests');
  },

  // ------------------- ALERTS -------------------
  getAlerts(): AlertLog[] {
    if (typeof window === 'undefined') return [];
    this.initOnFirstLaunch();
    const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
    return safeJsonParse<AlertLog[]>(data, []);
  },

  dispatchAlert(alert: AlertLog): { success: boolean; duplicateSuppressed: boolean; message: string } {
    const alerts = this.getAlerts();
    const settings = this.getSettings();
    const now = new Date();

    // Check duplicate alert window
    const recentDuplicate = alerts.find((a) => {
      if (a.requestId !== alert.requestId || a.donorId !== alert.donorId) return false;
      const sentTime = new Date(a.sentAt).getTime();
      const hoursAgo = (now.getTime() - sentTime) / (1000 * 60 * 60);
      return hoursAgo <= settings.enableDuplicateAlertWindowHours;
    });

    if (recentDuplicate) {
      // Record suppressed or notify user
      return {
        success: false,
        duplicateSuppressed: true,
        message: `Duplicate alert prevented: Donor was already contacted for this request within the last ${settings.enableDuplicateAlertWindowHours} hours.`,
      };
    }

    // Add alert
    alerts.unshift(alert);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));

    this.addActivityItem({
      category: 'ALERT',
      action: `Alert Sent (${alert.channel})`,
      description: `Dispatched ${alert.urgency} alert to ${alert.donorName} for ${alert.hospitalName}.`,
      actor: 'Smart Alert System',
      metadata: { alertId: alert.id, donorId: alert.donorId, requestId: alert.requestId },
    });

    emitDataChange('alerts');
    return {
      success: true,
      duplicateSuppressed: false,
      message: `Alert successfully dispatched via ${alert.channel} to ${alert.donorName}.`,
    };
  },

  forceDispatchAlert(alert: AlertLog): void {
    const alerts = this.getAlerts();
    alerts.unshift(alert);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));

    this.addActivityItem({
      category: 'ALERT',
      action: `Alert Dispatched [Override] (${alert.channel})`,
      description: `Dispatched override alert to ${alert.donorName} for ${alert.hospitalName}.`,
      actor: 'Coordinator Override',
      metadata: { alertId: alert.id, donorId: alert.donorId, requestId: alert.requestId },
    });

    emitDataChange('alerts');
  },

  // ------------------- ACTIVITY / AUDIT -------------------
  getActivity(): ActivityLogItem[] {
    if (typeof window === 'undefined') return [];
    this.initOnFirstLaunch();
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    return safeJsonParse<ActivityLogItem[]>(data, []);
  },

  addActivityItem(item: Omit<ActivityLogItem, 'id' | 'timestamp'>): void {
    const current = this.getActivity();
    const newItem: ActivityLogItem = {
      ...item,
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    current.unshift(newItem);
    // Keep max 200 items in storage
    const trimmed = current.slice(0, 200);
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(trimmed));
    emitDataChange('activity');
  },

  clearActivityLog(): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify([]));
    emitDataChange('activity');
  },

  // ------------------- SETTINGS -------------------
  getSettings(): SystemSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    this.initOnFirstLaunch();
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return safeJsonParse<SystemSettings>(data, DEFAULT_SETTINGS);
  },

  saveSettings(newSettings: SystemSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    this.addActivityItem({
      category: 'SYSTEM',
      action: 'Settings Updated',
      description: `Configuration parameters adjusted (Cooldown: ${newSettings.cooldownPeriodDays} days).`,
      actor: 'Admin',
    });
    emitDataChange('settings');
  },

  // ------------------- BACKUP / EXPORT / IMPORT -------------------
  exportAllDataJson(): string {
    const exportBundle = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      settings: this.getSettings(),
      donors: this.getDonors(),
      requests: this.getRequests(),
      alerts: this.getAlerts(),
      activity: this.getActivity(),
    };
    return JSON.stringify(exportBundle, null, 2);
  },

  importDataJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.donors) && Array.isArray(parsed.requests)) {
        localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(parsed.donors));
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(parsed.requests));
        if (Array.isArray(parsed.alerts)) {
          localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(parsed.alerts));
        }
        if (Array.isArray(parsed.activity)) {
          localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(parsed.activity));
        }
        if (parsed.settings) {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed.settings));
        }
        emitDataChange('import');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  },
};
