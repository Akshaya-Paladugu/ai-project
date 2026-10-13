import { Donor, BloodRequest, AlertLog, ActivityLogItem } from '../types';

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function triggerDownload(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportDonorsCsv(donors: Donor[]) {
  const headers = [
    'Donor ID',
    'Full Name',
    'Blood Group',
    'City',
    'State/Region',
    'Phone',
    'Email',
    'Age',
    'Weight (kg)',
    'Gender',
    'Status',
    'Available Now',
    'Last Donation Date',
    'Total Donations',
    'Registration Date',
    'Notes',
  ];

  const rows = donors.map((d) => [
    escapeCsvCell(d.id),
    escapeCsvCell(d.fullName),
    escapeCsvCell(d.bloodGroup),
    escapeCsvCell(d.city),
    escapeCsvCell(d.stateOrRegion || ''),
    escapeCsvCell(d.phone),
    escapeCsvCell(d.email),
    escapeCsvCell(d.age),
    escapeCsvCell(d.weightKg),
    escapeCsvCell(d.gender),
    escapeCsvCell(d.status),
    escapeCsvCell(d.isAvailableNow ? 'YES' : 'NO'),
    escapeCsvCell(d.lastDonationDate || 'None / First Time'),
    escapeCsvCell(d.totalDonations),
    escapeCsvCell(d.registeredAt),
    escapeCsvCell(d.notes || ''),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  triggerDownload(csv, `lifelink-donors-${dateStr}.csv`);
}

export function exportRequestsCsv(requests: BloodRequest[]) {
  const headers = [
    'Request ID',
    'Patient/Ref',
    'Blood Group',
    'Units Needed',
    'Units Fulfilled',
    'Hospital Name',
    'Department',
    'City',
    'Urgency',
    'Status',
    'Contact Person',
    'Contact Phone',
    'Required Date',
    'Created At',
    'Fulfilled At',
    'Clinical Reason',
  ];

  const rows = requests.map((r) => [
    escapeCsvCell(r.id),
    escapeCsvCell(r.patientNameOrRef),
    escapeCsvCell(r.bloodGroup),
    escapeCsvCell(r.unitsNeeded),
    escapeCsvCell(r.unitsFulfilled),
    escapeCsvCell(r.hospitalName),
    escapeCsvCell(r.hospitalDepartment || ''),
    escapeCsvCell(r.city),
    escapeCsvCell(r.urgency),
    escapeCsvCell(r.status),
    escapeCsvCell(r.contactPerson),
    escapeCsvCell(r.contactPhone),
    escapeCsvCell(r.requiredDate),
    escapeCsvCell(r.createdAt),
    escapeCsvCell(r.fulfilledAt || ''),
    escapeCsvCell(r.clinicalReason || ''),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  triggerDownload(csv, `lifelink-requests-${dateStr}.csv`);
}

export function exportAlertsCsv(alerts: AlertLog[]) {
  const headers = [
    'Alert ID',
    'Request Ref',
    'Donor ID',
    'Donor Name',
    'Recipient Contact',
    'Blood Group',
    'Urgency',
    'Hospital',
    'City',
    'Channel',
    'Status',
    'Dispatched At',
    'Message Text',
  ];

  const rows = alerts.map((a) => [
    escapeCsvCell(a.id),
    escapeCsvCell(a.requestId),
    escapeCsvCell(a.donorId),
    escapeCsvCell(a.donorName),
    escapeCsvCell(a.recipientContact),
    escapeCsvCell(a.bloodGroup),
    escapeCsvCell(a.urgency),
    escapeCsvCell(a.hospitalName),
    escapeCsvCell(a.city),
    escapeCsvCell(a.channel),
    escapeCsvCell(a.status),
    escapeCsvCell(a.sentAt),
    escapeCsvCell(a.message),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  triggerDownload(csv, `lifelink-alerts-${dateStr}.csv`);
}

export function exportActivityCsv(activity: ActivityLogItem[]) {
  const headers = ['Activity ID', 'Timestamp', 'Category', 'Action', 'Description', 'Actor'];

  const rows = activity.map((act) => [
    escapeCsvCell(act.id),
    escapeCsvCell(act.timestamp),
    escapeCsvCell(act.category),
    escapeCsvCell(act.action),
    escapeCsvCell(act.description),
    escapeCsvCell(act.actor),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  triggerDownload(csv, `lifelink-audit-log-${dateStr}.csv`);
}
