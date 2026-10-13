import {
  Donor,
  BloodRequest,
  AlertDraft,
  AlertChannel,
  AlertLog,
} from '../types';

/**
 * Creates a standard notification message template for a donor match
 */
export function generateAlertMessageText(
  donor: Donor,
  request: BloodRequest,
  channel: AlertChannel,
  helplinePhone: string = '+1 (800) 555-0199'
): string {
  const urgencyLabel =
    request.urgency === 'CRITICAL'
      ? '🚨 CRITICAL EMERGENCY'
      : request.urgency === 'URGENT'
      ? '⚠️ URGENT BLOOD NEED'
      : 'STANDARD BLOOD REQUEST';

  if (channel === 'SMS') {
    return `${urgencyLabel} (LifeLink): Dear ${donor.fullName}, ${request.hospitalName} in ${request.city} needs ${request.bloodGroup} blood (${request.unitsNeeded} units). As an eligible donor, your support is vital. Reply YES or call ${request.contactPhone || helplinePhone}.`;
  }

  if (channel === 'WHATSAPP') {
    return `${urgencyLabel} — LifeLink Blood Alert\n\nDear ${donor.fullName},\n\nA patient at *${request.hospitalName}* (${request.city}) requires *${request.bloodGroup}* blood (${request.unitsNeeded} units needed).\n\nUrgency Level: ${request.urgency}\nDepartment: ${request.hospitalDepartment || 'Transfusion Medicine'}\n\nIf you are available to donate, please confirm by replying to this message or call the coordinator at ${request.contactPhone || helplinePhone}.\n\nThank you for being a registered lifesaver!`;
  }

  // EMAIL
  return `Subject: ${urgencyLabel}: Urgent Need for ${request.bloodGroup} Blood at ${request.hospitalName}\n\nDear ${donor.fullName},\n\nWe are reaching out from the LifeLink Regional Blood Exchange on behalf of ${request.hospitalName} in ${request.city}.\n\nThere is an active ${request.urgency.toLowerCase()} request for ${request.unitsNeeded} unit(s) of ${request.bloodGroup} blood.\n\nCase Details:\n- Patient/Ref: ${request.patientNameOrRef}\n- Hospital: ${request.hospitalName} (${request.city})\n- Department: ${request.hospitalDepartment || 'Transfusion Medicine'}\n- Coordinator: ${request.contactPerson} (${request.contactPhone})\n\nIf you are feeling healthy, satisfy the minimum donation cooldown, and can visit the hospital transfusion center, please contact the coordinator or reply to this alert.\n\nWarm regards,\nLifeLink Coordination Team`;
}

/**
 * Create alert draft objects for matched donors
 */
export function createDraftAlerts(
  request: BloodRequest,
  selectedDonors: Donor[],
  channel: AlertChannel = 'SMS',
  helplinePhone?: string
): AlertDraft[] {
  return selectedDonors.map((donor) => {
    return {
      id: `dft-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      requestId: request.id,
      donorId: donor.id,
      donorName: donor.fullName,
      donorPhone: donor.phone,
      donorEmail: donor.email,
      donorBloodGroup: donor.bloodGroup,
      requestHospital: request.hospitalName,
      requestCity: request.city,
      unitsNeeded: request.unitsNeeded,
      urgency: request.urgency,
      channel,
      messageContent: generateAlertMessageText(donor, request, channel, helplinePhone),
      createdAt: new Date().toISOString(),
    };
  });
}

/**
 * Convert an approved draft into an alert log for storage dispatch
 */
export function draftToAlertLog(draft: AlertDraft): AlertLog {
  const contact = draft.channel === 'EMAIL' ? draft.donorEmail : draft.donorPhone;
  return {
    id: `alt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    requestId: draft.requestId,
    donorId: draft.donorId,
    donorName: draft.donorName,
    recipientContact: contact,
    bloodGroup: draft.donorBloodGroup,
    urgency: draft.urgency,
    hospitalName: draft.requestHospital,
    city: draft.requestCity,
    channel: draft.channel,
    message: draft.messageContent,
    sentAt: new Date().toISOString(),
    status: 'DELIVERED',
    isDuplicateSuppressed: false,
  };
}
