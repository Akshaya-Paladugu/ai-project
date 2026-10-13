import { BloodGroup, Donor, BloodRequest, DonorMatchResult, MatchFactor, AlertLog } from '../types';

/**
 * Theoretical Red Blood Cell (RBC) compatibility matrix:
 * Key: Recipient blood group -> Array of compatible donor blood groups
 */
export const RBC_COMPATIBILITY_MATRIX: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

/**
 * Checks if a donor blood group can theoretically donate red cells to a recipient
 */
export function isBloodCompatible(donorGroup: BloodGroup, recipientGroup: BloodGroup): boolean {
  const allowed = RBC_COMPATIBILITY_MATRIX[recipientGroup] || [];
  return allowed.includes(donorGroup);
}

/**
 * Calculate days between two ISO date strings (or today if target is now)
 */
export function calculateDaysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const past = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - past.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Evaluate and rank matching donors for a given blood request
 */
export function findPotentialDonors(
  request: BloodRequest,
  donors: Donor[],
  alertHistory: AlertLog[],
  cooldownPeriodDays: number = 56,
  duplicateWindowHours: number = 24
): DonorMatchResult[] {
  const results: DonorMatchResult[] = [];
  const now = new Date();

  for (const donor of donors) {
    // Basic compatibility
    const compatible = isBloodCompatible(donor.bloodGroup, request.bloodGroup);
    const isExact = donor.bloodGroup === request.bloodGroup;
    const isUniversal = donor.bloodGroup === 'O-';

    let compatibilityType: DonorMatchResult['compatibilityType'] = 'INCOMPATIBLE';
    if (isExact) {
      compatibilityType = 'EXACT';
    } else if (isUniversal) {
      compatibilityType = 'UNIVERSAL_COMPATIBLE';
    } else if (compatible) {
      compatibilityType = 'RH_COMPATIBLE';
    }

    // Cooldown check
    const daysSince = calculateDaysSince(donor.lastDonationDate);
    const isCooldownEligible = daysSince === null || daysSince >= cooldownPeriodDays;
    const cooldownDaysRemaining =
      daysSince !== null && daysSince < cooldownPeriodDays
        ? cooldownPeriodDays - daysSince
        : 0;

    // Location comparison (normalized lowercase trim)
    const normReqCity = request.city.trim().toLowerCase();
    const normDonorCity = donor.city.trim().toLowerCase();
    const sameCity = normReqCity === normDonorCity;

    let locationMatch: DonorMatchResult['locationMatch'] = 'DIFFERENT_CITY';
    if (sameCity) {
      locationMatch = 'SAME_CITY';
    } else if (
      (normReqCity.includes('metro') && normDonorCity.includes('metro')) ||
      normDonorCity.includes(normReqCity) ||
      normReqCity.includes(normDonorCity)
    ) {
      locationMatch = 'NEARBY';
    }

    // Check duplicate alerts for this request within window
    const recentAlert = alertHistory.find((log) => {
      if (log.requestId !== request.id || log.donorId !== donor.id) return false;
      const sentTime = new Date(log.sentAt).getTime();
      const hoursAgo = (now.getTime() - sentTime) / (1000 * 60 * 60);
      return hoursAgo <= duplicateWindowHours;
    });

    // Score calculation & factor attribution
    const factors: MatchFactor[] = [];
    let score = 0;

    // Compatibility factor (max 50 points)
    if (isExact) {
      score += 50;
      factors.push({
        title: 'Exact Blood Group Match',
        isPositive: true,
        scoreImpact: 50,
        description: `Donor blood type ${donor.bloodGroup} precisely matches recipient ${request.bloodGroup}.`,
      });
    } else if (compatible) {
      score += 40;
      factors.push({
        title: 'Theoretically Compatible Alternative',
        isPositive: true,
        scoreImpact: 40,
        description: `Donor ${donor.bloodGroup} is red blood cell compatible with recipient ${request.bloodGroup}.`,
      });
    } else {
      score = 0;
      factors.push({
        title: 'Blood Type Incompatible',
        isPositive: false,
        scoreImpact: 0,
        description: `Donor ${donor.bloodGroup} cannot donate red cells to ${request.bloodGroup}.`,
      });
    }

    // Don't calculate high scores for incompatible donors
    if (!compatible) {
      results.push({
        donor,
        matchScore: 0,
        isCompatible: false,
        compatibilityType: 'INCOMPATIBLE',
        isCooldownEligible,
        daysSinceLastDonation: daysSince,
        cooldownDaysRemaining,
        locationMatch,
        matchFactors: factors,
        eligibilityExplanation: `Blood type mismatch: ${donor.bloodGroup} is not compatible with ${request.bloodGroup}.`,
        alreadyAlertedForThisRequest: !!recentAlert,
        lastAlertTimestamp: recentAlert?.sentAt,
      });
      continue;
    }

    // Cooldown factor (max 25 points)
    if (isCooldownEligible) {
      score += 25;
      const desc =
        daysSince === null
          ? 'First-time or unrecorded previous donation; full recovery assumed.'
          : `${daysSince} days since last donation (surpasses required ${cooldownPeriodDays}-day cooldown).`;
      factors.push({
        title: 'Donation Cooldown Satisfied',
        isPositive: true,
        scoreImpact: 25,
        description: desc,
      });
    } else {
      factors.push({
        title: 'Donation Recovery Cooldown Active',
        isPositive: false,
        scoreImpact: -20,
        description: `Last donation was only ${daysSince} days ago (${cooldownDaysRemaining} days remaining for minimum ${cooldownPeriodDays}-day red cell restoration).`,
      });
      score = Math.max(10, score - 20);
    }

    // Location factor (max 15 points)
    if (locationMatch === 'SAME_CITY') {
      score += 15;
      factors.push({
        title: 'Immediate City Match',
        isPositive: true,
        scoreImpact: 15,
        description: `Donor is located in ${donor.city}, same city as ${request.hospitalName}.`,
      });
    } else if (locationMatch === 'NEARBY') {
      score += 8;
      factors.push({
        title: 'Adjacent / Metro Area Match',
        isPositive: true,
        scoreImpact: 8,
        description: `Donor is in neighboring area (${donor.city}) close to ${request.city}.`,
      });
    } else {
      factors.push({
        title: 'Different City',
        isPositive: false,
        scoreImpact: 0,
        description: `Donor is in ${donor.city}, while patient is at ${request.hospitalName} in ${request.city}. Transit time may be higher.`,
      });
    }

    // Donor Activity and Availability factor (max 10 points)
    if (donor.status === 'ACTIVE' && donor.isAvailableNow) {
      score += 10;
      factors.push({
        title: 'Active & Available',
        isPositive: true,
        scoreImpact: 10,
        description: 'Donor has active profile and self-reported immediate availability.',
      });
    } else if (donor.status === 'ACTIVE') {
      score += 5;
      factors.push({
        title: 'Active Profile',
        isPositive: true,
        scoreImpact: 5,
        description: 'Donor profile is active in directory.',
      });
    } else {
      score = Math.max(5, score - 25);
      factors.push({
        title: 'Profile Currently Inactive',
        isPositive: false,
        scoreImpact: -25,
        description: 'Donor has deactivated their notifications or status.',
      });
    }

    // Weight and age suitability check
    if (donor.weightKg < 50) {
      score = Math.max(5, score - 15);
      factors.push({
        title: 'Weight Warning (< 50kg)',
        isPositive: false,
        scoreImpact: -15,
        description: 'Weight is below standard 50kg threshold; clinical assessment required.',
      });
    }

    // Deduct slightly if duplicate alert sent very recently
    if (recentAlert) {
      factors.push({
        title: 'Alert Dispatched Recently',
        isPositive: false,
        scoreImpact: 0,
        description: `An alert was already sent to this donor on ${new Date(recentAlert.sentAt).toLocaleDateString()} for this request.`,
      });
    }

    // Clamp score
    const finalScore = Math.min(100, Math.max(0, score));

    // Plain English summary explanation
    let explanation = '';
    if (isExact && isCooldownEligible && locationMatch === 'SAME_CITY') {
      explanation = `High Priority Match: Exact ${donor.bloodGroup} match in ${donor.city} with satisfied recovery period.`;
    } else if (isExact && !isCooldownEligible) {
      explanation = `Exact ${donor.bloodGroup} match, but donor requires ${cooldownDaysRemaining} more days of clinical recovery.`;
    } else if (compatible && locationMatch === 'SAME_CITY') {
      explanation = `Compatible alternate (${donor.bloodGroup} → ${request.bloodGroup}) in local city ${donor.city}.`;
    } else {
      explanation = `Compatible group (${donor.bloodGroup}), but located in ${donor.city} or requires extra screening.`;
    }

    results.push({
      donor,
      matchScore: finalScore,
      isCompatible: true,
      compatibilityType,
      isCooldownEligible,
      daysSinceLastDonation: daysSince,
      cooldownDaysRemaining,
      locationMatch,
      matchFactors: factors,
      eligibilityExplanation: explanation,
      alreadyAlertedForThisRequest: !!recentAlert,
      lastAlertTimestamp: recentAlert?.sentAt,
    });
  }

  // Sort: Compatible first, then by matchScore descending, then cooldown eligible first
  return results.sort((a, b) => {
    if (a.isCompatible !== b.isCompatible) return a.isCompatible ? -1 : 1;
    if (a.isCooldownEligible !== b.isCooldownEligible) return a.isCooldownEligible ? -1 : 1;
    return b.matchScore - a.matchScore;
  });
}
