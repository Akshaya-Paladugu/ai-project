import React, { useState, useMemo } from 'react';
import {
  Send,
  Droplet,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldAlert,
  Info,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import {
  BloodRequest,
  Donor,
  AlertLog,
  DonorMatchResult,
  AlertDraft,
  AlertChannel,
  SystemSettings,
} from '../../types';
import { findPotentialDonors } from '../../services/matching';
import { createDraftAlerts, draftToAlertLog } from '../../services/alerts';
import { generateSmartOutreachMessage } from '../../services/ai';
import { ClinicalWarningBanner } from '../common/ClinicalWarningBanner';
import { useToast } from '../common/Toast';

interface MatchingViewProps {
  requests: BloodRequest[];
  donors: Donor[];
  alerts: AlertLog[];
  settings: SystemSettings;
  selectedRequestId: string | null;
  onSelectRequestId: (id: string) => void;
  onDispatchAlert: (alert: AlertLog, forceOverride?: boolean) => { success: boolean; duplicateSuppressed: boolean; message: string };
  onUpdateRequestStatus: (requestId: string, status: BloodRequest['status']) => void;
}

export const MatchingView: React.FC<MatchingViewProps> = ({
  requests,
  donors,
  alerts,
  settings,
  selectedRequestId,
  onSelectRequestId,
  onDispatchAlert,
  onUpdateRequestStatus,
}) => {
  const { showToast } = useToast();

  // Active requests candidate list
  const activeRequests = useMemo(() => {
    return requests.filter((r) => r.status !== 'FULFILLED' && r.status !== 'CANCELLED');
  }, [requests]);

  // Determine current selected request
  const currentRequest = useMemo(() => {
    if (selectedRequestId) {
      const found = requests.find((r) => r.id === selectedRequestId);
      if (found) return found;
    }
    // Default to most critical active request, or first available
    if (activeRequests.length > 0) {
      const critical = activeRequests.find((r) => r.urgency === 'CRITICAL');
      return critical || activeRequests[0];
    }
    return requests[0] || null;
  }, [requests, activeRequests, selectedRequestId]);

  // Compute Rule-based Matches
  const matches = useMemo(() => {
    if (!currentRequest) return [];
    return findPotentialDonors(
      currentRequest,
      donors,
      alerts,
      settings.cooldownPeriodDays,
      settings.enableDuplicateAlertWindowHours
    );
  }, [currentRequest, donors, alerts, settings]);

  // State for selected donors to draft alerts
  const [selectedDonorIds, setSelectedDonorIds] = useState<string[]>([]);
  const [expandedDonorId, setExpandedDonorId] = useState<string | null>(null);

  // Draft review modal state
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [activeDrafts, setActiveDrafts] = useState<AlertDraft[]>([]);
  const [draftChannel, setDraftChannel] = useState<AlertChannel>(settings.defaultAlertChannel);
  const [isAiGeneratingIndex, setIsAiGeneratingIndex] = useState<number | null>(null);

  // Toggle selection
  const handleToggleSelect = (donorId: string) => {
    setSelectedDonorIds((prev) =>
      prev.includes(donorId) ? prev.filter((id) => id !== donorId) : [...prev, donorId]
    );
  };

  const handleSelectAllCompatible = () => {
    const compatibleEligibleIds = matches
      .filter((m) => m.isCompatible && m.isCooldownEligible && m.donor.status === 'ACTIVE')
      .map((m) => m.donor.id);
    setSelectedDonorIds(compatibleEligibleIds);
  };

  const handleClearSelection = () => {
    setSelectedDonorIds([]);
  };

  // Open Draft Modal
  const handleOpenDraftModal = () => {
    if (!currentRequest) return;
    const selectedDonors = donors.filter((d) => selectedDonorIds.includes(d.id));
    if (selectedDonors.length === 0) {
      showToast('warning', 'No donors selected', 'Select at least one compatible donor to generate notification drafts.');
      return;
    }
    const drafts = createDraftAlerts(
      currentRequest,
      selectedDonors,
      draftChannel,
      settings.helplinePhone
    );
    setActiveDrafts(drafts);
    setIsDraftModalOpen(true);
  };

  // Switch channel for all drafts
  const handleSwitchChannel = (newChannel: AlertChannel) => {
    setDraftChannel(newChannel);
    if (!currentRequest) return;
    const selectedDonors = donors.filter((d) => selectedDonorIds.includes(d.id));
    const updated = createDraftAlerts(
      currentRequest,
      selectedDonors,
      newChannel,
      settings.helplinePhone
    );
    setActiveDrafts(updated);
  };

  // Update draft message text
  const handleUpdateDraftMessage = (index: number, newText: string) => {
    setActiveDrafts((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], messageContent: newText };
      return copy;
    });
  };

  // Remove individual draft from modal
  const handleRemoveDraft = (index: number) => {
    setActiveDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  // AI Outreach message generator for a single draft
  const handleRegenerateWithAi = async (index: number, tone: 'EMERGENCY' | 'WARM_PERSONAL' | 'FORMAL_CLINICAL') => {
    const draft = activeDrafts[index];
    if (!draft || !currentRequest) return;
    const donor = donors.find((d) => d.id === draft.donorId);
    if (!donor) return;

    setIsAiGeneratingIndex(index);
    try {
      const res = await generateSmartOutreachMessage(donor, currentRequest, tone);
      handleUpdateDraftMessage(index, res.message);
      showToast(
        'info',
        res.isAiGenerated ? 'Draft personalized via AI' : 'Draft personalized with clinical template',
        `Adjusted tone to ${tone.replace('_', ' ').toLowerCase()}`
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiGeneratingIndex(null);
    }
  };

  // Dispatch individual draft
  const handleDispatchSingleDraft = (draft: AlertDraft, override: boolean = false) => {
    const log = draftToAlertLog(draft);
    const result = onDispatchAlert(log, override);
    if (result.success) {
      showToast('success', 'Alert Dispatched', result.message);
      // Remove from drafts
      setActiveDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      // Update request to IN_PROGRESS if pending
      if (currentRequest && currentRequest.status === 'PENDING') {
        onUpdateRequestStatus(currentRequest.id, 'IN_PROGRESS');
      }
    } else if (result.duplicateSuppressed) {
      showToast('warning', 'Duplicate Alert Prevented', result.message);
    }
  };

  // Dispatch all active drafts
  const handleDispatchAllDrafts = (overrideAll: boolean = false) => {
    let sentCount = 0;
    let duplicateCount = 0;

    activeDrafts.forEach((draft) => {
      const log = draftToAlertLog(draft);
      const res = onDispatchAlert(log, overrideAll);
      if (res.success) {
        sentCount++;
      } else if (res.duplicateSuppressed) {
        duplicateCount++;
      }
    });

    if (sentCount > 0) {
      showToast('success', 'Batch Alerts Dispatched', `Successfully dispatched ${sentCount} notifications.`);
      if (currentRequest && currentRequest.status === 'PENDING') {
        onUpdateRequestStatus(currentRequest.id, 'IN_PROGRESS');
      }
    }

    if (duplicateCount > 0 && !overrideAll) {
      showToast(
        'warning',
        'Duplicate Alerts Suppressed',
        `${duplicateCount} duplicate alert(s) prevented within the ${settings.enableDuplicateAlertWindowHours}h window.`
      );
    }

    setIsDraftModalOpen(false);
    setSelectedDonorIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Clinical Warning Banner */}
      <ClinicalWarningBanner />

      {/* Header and Request Selector */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Rule-Based Blood Matching & Alert Dispatch
            </h1>
            <p className="text-xs text-slate-500">
              Evaluates theoretical red cell ABO/Rh compatibility, 56-day donation recovery cooldown, and geographic proximity
            </p>
          </div>

          {/* Request Dropdown */}
          <div className="w-full md:w-80">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Select Active Blood Request to Match:
            </label>
            <select
              value={currentRequest ? currentRequest.id : ''}
              onChange={(e) => onSelectRequestId(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-300 py-2 px-3 text-slate-900 bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
            >
              {requests.map((r) => (
                <option key={r.id} value={r.id}>
                  [{r.urgency}] {r.bloodGroup} · {r.hospitalName} ({r.unitsFulfilled}/{r.unitsNeeded}u) - {r.status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Request Summary Banner */}
        {currentRequest && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-lg bg-red-600 text-white font-extrabold flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] uppercase font-semibold leading-none">Need</span>
                <span className="text-lg leading-tight">{currentRequest.bloodGroup}</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{currentRequest.hospitalName}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-xs text-slate-600">{currentRequest.city}</span>
                  <span className="text-slate-400">·</span>
                  <span
                    className={`text-xs font-bold ${
                      currentRequest.urgency === 'CRITICAL'
                        ? 'text-red-600'
                        : currentRequest.urgency === 'URGENT'
                        ? 'text-amber-700'
                        : 'text-slate-600'
                    }`}
                  >
                    {currentRequest.urgency}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{currentRequest.patientNameOrRef}</span>
                  <span className="mx-1.5">·</span>
                  <span>{currentRequest.unitsNeeded} units needed ({currentRequest.unitsFulfilled} fulfilled)</span>
                  {currentRequest.hospitalDepartment && (
                    <>
                      <span className="mx-1.5">·</span>
                      <span>{currentRequest.hospitalDepartment}</span>
                    </>
                  )}
                </div>
                {currentRequest.clinicalReason && (
                  <p className="text-xs text-slate-500 italic line-clamp-1">
                    "{currentRequest.clinicalReason}"
                  </p>
                )}
              </div>
            </div>

            {/* Actions for Selected Donors */}
            <div className="flex items-center gap-2 self-end md:self-center">
              <button
                onClick={handleSelectAllCompatible}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
              >
                Select Ready Matches
              </button>
              <button
                onClick={handleOpenDraftModal}
                disabled={selectedDonorIds.length === 0}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Prepare Alert Drafts ({selectedDonorIds.length})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Matches List */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Ranked Donor Candidates for {currentRequest?.bloodGroup} ({matches.length} total)
            </h2>
            <p className="text-xs text-slate-500">
              Matches ordered by ABO/Rh compatibility, cooldown eligibility, location proximity, and availability
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">
              Selected: <strong className="text-slate-900 font-semibold">{selectedDonorIds.length}</strong>
            </span>
            {selectedDonorIds.length > 0 && (
              <button
                onClick={handleClearSelection}
                className="text-red-600 hover:text-red-700 font-medium cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No registered donors in directory to evaluate.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {matches.map((result) => {
              const {
                donor,
                matchScore,
                isCompatible,
                compatibilityType,
                isCooldownEligible,
                daysSinceLastDonation,
                cooldownDaysRemaining,
                locationMatch,
                matchFactors,
                eligibilityExplanation,
                alreadyAlertedForThisRequest,
                lastAlertTimestamp,
              } = result;

              const isSelected = selectedDonorIds.includes(donor.id);
              const isExpanded = expandedDonorId === donor.id;

              return (
                <div
                  key={donor.id}
                  className={`p-4 transition-colors ${
                    !isCompatible
                      ? 'bg-slate-50/50 opacity-60'
                      : isSelected
                      ? 'bg-red-50/30'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Checkbox, Blood Group, Donor info */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(donor.id)}
                        disabled={!isCompatible || donor.status === 'INACTIVE'}
                        className="w-4 h-4 mt-1 text-red-600 rounded border-slate-300 focus:ring-red-500 disabled:opacity-40 cursor-pointer"
                      />

                      {/* Blood Badge */}
                      <div className="w-10 h-10 rounded font-black text-sm flex items-center justify-center shrink-0 border bg-white border-slate-200 text-slate-900">
                        {donor.bloodGroup}
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{donor.fullName}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {donor.city}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          {/* Compatibility Tag */}
                          {compatibilityType === 'EXACT' ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                              Exact Match ({donor.bloodGroup})
                            </span>
                          ) : compatibilityType === 'UNIVERSAL_COMPATIBLE' ? (
                            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                              Universal Donor (O-)
                            </span>
                          ) : compatibilityType === 'RH_COMPATIBLE' ? (
                            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                              Compatible Alternate
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400">
                              Incompatible
                            </span>
                          )}

                          {/* Duplicate Alert Tag */}
                          {alreadyAlertedForThisRequest && (
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                              Alert Dispatched {lastAlertTimestamp ? new Date(lastAlertTimestamp).toLocaleDateString() : 'Recently'}
                            </span>
                          )}
                        </div>

                        {/* Cooldown & Phone Line */}
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span>{donor.phone}</span>
                          <span>·</span>
                          {isCooldownEligible ? (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {daysSinceLastDonation === null
                                ? 'First-time / Fully recovered'
                                : `${daysSinceLastDonation}d since donation (Eligible)`}
                            </span>
                          ) : (
                            <span className="text-amber-700 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Cooldown Active ({cooldownDaysRemaining} days remaining)
                            </span>
                          )}
                        </div>

                        {/* Summary explanation */}
                        <p className="text-xs text-slate-600 mt-1">{eligibilityExplanation}</p>
                      </div>
                    </div>

                    {/* Right: Score & Toggle Breakdown */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-xs text-slate-500 font-medium">Match Score</div>
                        <div
                          className={`text-lg font-black ${
                            matchScore >= 80
                              ? 'text-emerald-700'
                              : matchScore >= 50
                              ? 'text-amber-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {matchScore}%
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedDonorId(isExpanded ? null : donor.id)}
                        className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="View Score Breakdown"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Breakdown Accordion */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200 text-xs bg-slate-50/70 p-3 rounded-md space-y-2">
                      <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                        Scoring & Rule Factor Attribution:
                      </div>
                      <div className="space-y-1.5">
                        {matchFactors.map((factor, idx) => (
                          <div key={idx} className="flex items-start justify-between text-xs">
                            <div className="flex items-start gap-1.5">
                              {factor.isPositive ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              )}
                              <span className="text-slate-700">
                                <strong>{factor.title}</strong>: {factor.description}
                              </span>
                            </div>
                            <span
                              className={`font-mono text-xs font-semibold ml-2 shrink-0 ${
                                factor.scoreImpact > 0
                                  ? 'text-emerald-700'
                                  : factor.scoreImpact < 0
                                  ? 'text-red-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {factor.scoreImpact > 0 ? `+${factor.scoreImpact}` : factor.scoreImpact}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DRAFT REVIEW & MANUAL DISPATCH APPROVAL MODAL */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-3xl w-full shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Review & Approve Local Notification Drafts
                </h3>
                <p className="text-xs text-slate-500">
                  Review recipient messages before simulating dispatch. Manual operator approval required.
                </p>
              </div>
              <button
                onClick={() => setIsDraftModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Channel Switcher */}
            <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Dispatch Channel:</span>
                <div className="flex items-center gap-1 border border-slate-200 rounded-md p-0.5 bg-slate-50">
                  {(['SMS', 'WHATSAPP', 'EMAIL'] as AlertChannel[]).map((chan) => (
                    <button
                      key={chan}
                      onClick={() => handleSwitchChannel(chan)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                        draftChannel === chan
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {chan}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                {activeDrafts.length} draft message{activeDrafts.length > 1 ? 's' : ''} prepared
              </div>
            </div>

            {/* Drafts List */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {activeDrafts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  All notification drafts have been approved or dismissed.
                </div>
              ) : (
                activeDrafts.map((draft, idx) => {
                  const donor = donors.find((d) => d.id === draft.donorId);
                  const isRecent = alerts.some((a) => a.requestId === draft.requestId && a.donorId === draft.donorId);

                  return (
                    <div key={draft.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{draft.donorName}</span>
                          <span className="text-xs text-slate-500">({draft.donorBloodGroup})</span>
                          <span className="text-xs font-mono text-slate-600">
                            {draft.channel === 'EMAIL' ? draft.donorEmail : draft.donorPhone}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRemoveDraft(idx)}
                            className="text-xs text-slate-400 hover:text-red-600 px-2 py-1 rounded"
                            title="Exclude this donor from this batch"
                          >
                            Exclude
                          </button>
                        </div>
                      </div>

                      {/* Duplicate Warning if already contacted */}
                      {isRecent && (
                        <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>
                            Donor was previously alerted for this case. Dispatching will trigger an operator override.
                          </span>
                        </div>
                      )}

                      {/* Message Textarea */}
                      <textarea
                        rows={3}
                        value={draft.messageContent}
                        onChange={(e) => handleUpdateDraftMessage(idx, e.target.value)}
                        className="w-full text-xs font-mono rounded border border-slate-300 p-2.5 text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
                      />

                      {/* AI Tone Customizers & Single Dispatch */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-slate-500 text-[11px]">AI Tone:</span>
                          <button
                            type="button"
                            onClick={() => handleRegenerateWithAi(idx, 'EMERGENCY')}
                            disabled={isAiGeneratingIndex === idx}
                            className="px-2 py-0.5 text-[11px] bg-white border border-slate-200 hover:border-slate-300 rounded text-slate-700 cursor-pointer"
                          >
                            Emergency
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRegenerateWithAi(idx, 'WARM_PERSONAL')}
                            disabled={isAiGeneratingIndex === idx}
                            className="px-2 py-0.5 text-[11px] bg-white border border-slate-200 hover:border-slate-300 rounded text-slate-700 cursor-pointer"
                          >
                            Warm
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRegenerateWithAi(idx, 'FORMAL_CLINICAL')}
                            disabled={isAiGeneratingIndex === idx}
                            className="px-2 py-0.5 text-[11px] bg-white border border-slate-200 hover:border-slate-300 rounded text-slate-700 cursor-pointer"
                          >
                            Clinical
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDispatchSingleDraft(draft, isRecent)}
                          className="px-3 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded shadow-xs cursor-pointer"
                        >
                          Send Single &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Safe dispatch: No external SMS charges or live cellular messaging configured.
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDraftModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDispatchAllDrafts(true)}
                  disabled={activeDrafts.length === 0}
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-md shadow-sm disabled:opacity-40"
                >
                  Approve All & Dispatch ({activeDrafts.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
