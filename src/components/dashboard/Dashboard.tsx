import React from 'react';
import {
  Users,
  Droplet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Plus,
  Send,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import { Donor, BloodRequest, AlertLog, ActivityLogItem, BloodGroup } from '../../types';
import { ClinicalWarningBanner } from '../common/ClinicalWarningBanner';
import { calculateDaysSince } from '../../services/matching';

interface DashboardProps {
  donors: Donor[];
  requests: BloodRequest[];
  alerts: AlertLog[];
  activity: ActivityLogItem[];
  cooldownDays: number;
  onNavigateTab: (tab: any) => void;
  onSelectRequestForMatching: (req: BloodRequest) => void;
  onOpenNewDonorModal: () => void;
  onOpenNewRequestModal: () => void;
  onExportDonors: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  donors,
  requests,
  alerts,
  activity,
  cooldownDays,
  onNavigateTab,
  onSelectRequestForMatching,
  onOpenNewDonorModal,
  onOpenNewRequestModal,
  onExportDonors,
}) => {
  // Compute Key Metrics
  const totalDonors = donors.length;
  const activeDonors = donors.filter((d) => d.status === 'ACTIVE').length;

  const eligibleNowDonors = donors.filter((d) => {
    if (d.status !== 'ACTIVE') return false;
    const days = calculateDaysSince(d.lastDonationDate);
    return days === null || days >= cooldownDays;
  }).length;

  const totalDonationsCount = donors.reduce((acc, d) => acc + (d.totalDonations || 0), 0);

  const activeRequests = requests.filter((r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS');
  const criticalRequests = requests.filter((r) => r.urgency === 'CRITICAL' && r.status !== 'FULFILLED' && r.status !== 'CANCELLED');
  const fulfilledRequests = requests.filter((r) => r.status === 'FULFILLED');

  const totalUnitsRequested = requests.reduce((acc, r) => acc + r.unitsNeeded, 0);
  const totalUnitsFulfilled = requests.reduce((acc, r) => acc + r.unitsFulfilled, 0);
  const fulfillmentPercentage = totalUnitsRequested > 0 ? Math.round((totalUnitsFulfilled / totalUnitsRequested) * 100) : 0;

  // Blood group breakdown for donors
  const bloodGroups: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
  const donorCountsByGroup: Record<BloodGroup, number> = {
    'O-': 0, 'O+': 0, 'A-': 0, 'A+': 0, 'B-': 0, 'B+': 0, 'AB-': 0, 'AB+': 0,
  };
  donors.forEach((d) => {
    if (donorCountsByGroup[d.bloodGroup] !== undefined) {
      donorCountsByGroup[d.bloodGroup]++;
    }
  });

  const maxGroupCount = Math.max(...Object.values(donorCountsByGroup), 1);

  return (
    <div className="space-y-6">
      {/* Top Clinical Disclaimer */}
      <ClinicalWarningBanner />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Donors */}
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Donors</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalDonors}</span>
            <span className="text-xs text-slate-500">
              <strong className="text-emerald-700 font-semibold">{eligibleNowDonors}</strong> ready now
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Active: {activeDonors}</span>
            <span>Total Units Donated: {totalDonationsCount}</span>
          </div>
        </div>

        {/* Card 2: Critical Blood Emergencies */}
        <div className={`p-5 rounded-lg border transition-all ${criticalRequests.length > 0 ? 'bg-red-50/60 border-red-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${criticalRequests.length > 0 ? 'text-red-700' : 'text-slate-500'}`}>
              Critical Emergencies
            </span>
            <AlertTriangle className={`w-4 h-4 ${criticalRequests.length > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${criticalRequests.length > 0 ? 'text-red-700' : 'text-slate-900'}`}>
              {criticalRequests.length}
            </span>
            <span className="text-xs text-slate-600">
              {activeRequests.length} total active requests
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2 text-slate-500">
            <span>In-Progress: {requests.filter((r) => r.status === 'IN_PROGRESS').length}</span>
            <button
              onClick={() => onNavigateTab('requests')}
              className="text-red-600 hover:text-red-700 font-medium cursor-pointer"
            >
              View all &rarr;
            </button>
          </div>
        </div>

        {/* Card 3: Blood Fulfillment Rate */}
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Units Fulfillment</span>
            <Droplet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{fulfillmentPercentage}%</span>
            <span className="text-xs text-slate-500">
              {totalUnitsFulfilled} of {totalUnitsRequested} units
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-red-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${fulfillmentPercentage}%` }}
            />
          </div>
        </div>

        {/* Card 4: Dispatched Alerts */}
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Dispatched Alerts</span>
            <Send className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{alerts.length}</span>
            <span className="text-xs text-slate-500">
              {alerts.filter((a) => a.status === 'DELIVERED' || a.status === 'ACKNOWLEDGED').length} delivered
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Channels: SMS, WA, Email</span>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              History &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Urgent Requests Spotlight + Quick Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Urgent Requests & Match Spotlight */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent Blood Requests Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Urgent Blood Requests Requiring Action</h2>
                <p className="text-xs text-slate-500">Prioritized by clinical severity and units required</p>
              </div>
              <button
                onClick={() => onNavigateTab('requests')}
                className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View all ({requests.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                No pending or critical blood requests at this time. All demands fulfilled.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeRequests.slice(0, 4).map((req) => {
                  const isCrit = req.urgency === 'CRITICAL';
                  const isUrg = req.urgency === 'URGENT';
                  return (
                    <div
                      key={req.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-md transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-md font-bold text-xs flex flex-col items-center justify-center shrink-0 border ${
                            isCrit
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : isUrg
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span className="text-[10px] uppercase font-semibold leading-none">Type</span>
                          <span className="text-sm font-extrabold">{req.bloodGroup}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900">{req.hospitalName}</span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-600">{req.city}</span>
                            <span className="text-xs text-slate-400">·</span>
                            <span
                              className={`text-[11px] font-semibold ${
                                isCrit ? 'text-red-600' : isUrg ? 'text-amber-700' : 'text-slate-600'
                              }`}
                            >
                              {req.urgency}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            <span>{req.patientNameOrRef}</span>
                            <span className="mx-1.5">·</span>
                            <span>{req.unitsNeeded} units needed ({req.unitsFulfilled} fulfilled)</span>
                            {req.hospitalDepartment && (
                              <>
                                <span className="mx-1.5">·</span>
                                <span>{req.hospitalDepartment}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => onSelectRequestForMatching(req)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Match Donors</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Blood Inventory Distribution Chart */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Donor Registry Distribution by Blood Group</h2>
                <p className="text-xs text-slate-500">Live counts of registered donors in database</p>
              </div>
              <button
                onClick={() => onNavigateTab('donors')}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Directory &rarr;
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {bloodGroups.map((group) => {
                const count = donorCountsByGroup[group];
                const pct = totalDonors > 0 ? Math.round((count / totalDonors) * 100) : 0;
                const isUniversal = group === 'O-';
                return (
                  <div key={group} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1">
                        {group}
                        {isUniversal && (
                          <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1 rounded" title="Universal RBC Donor">
                            Univ
                          </span>
                        )}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{count} donors</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-1">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isUniversal ? 'bg-red-600' : 'bg-slate-700'
                        }`}
                        style={{ width: `${Math.max(5, (count / maxGroupCount) * 100)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 text-right">{pct}% of network</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Quick Actions & Recent Activity Feed */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Operations</h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={onOpenNewRequestModal}
                className="w-full flex items-center justify-between p-2.5 rounded-md border border-slate-200 hover:border-red-300 hover:bg-red-50/50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-red-100 text-red-700 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Create Blood Request</div>
                    <div className="text-[11px] text-slate-500">Record emergency hospital demand</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={onOpenNewDonorModal}
                className="w-full flex items-center justify-between p-2.5 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Register New Donor</div>
                    <div className="text-[11px] text-slate-500">Add volunteer to directory</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateTab('matching')}
                className="w-full flex items-center justify-between p-2.5 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Smart Donor Matcher</div>
                    <div className="text-[11px] text-slate-500">Rule-based scoring & dispatch</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={onExportDonors}
                className="w-full flex items-center justify-between p-2.5 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Export Donors CSV</div>
                    <div className="text-[11px] text-slate-500">Download formatted spreadsheet</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Recent Activity Log Stream */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Recent Network Activity</h3>
              <button
                onClick={() => onNavigateTab('audit')}
                className="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
              >
                View all &rarr;
              </button>
            </div>

            <div className="space-y-3">
              {activity.slice(0, 5).map((act) => {
                const date = new Date(act.timestamp);
                const timeAgo = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={act.id} className="text-xs border-b border-slate-100 pb-2.5 last:border-none last:pb-0">
                    <div className="flex items-center justify-between text-slate-400 mb-0.5">
                      <span className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider">
                        {act.action}
                      </span>
                      <span className="text-[11px]">{timeAgo}</span>
                    </div>
                    <div className="text-slate-600 leading-snug line-clamp-2">{act.description}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Actor: {act.actor}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blood Compatibility Guide */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-2">
              <Info className="w-4 h-4 text-red-600" />
              <span>Transfusion Matrix Rule Reference</span>
            </div>
            <p className="leading-relaxed mb-2 text-[11px]">
              Whole blood / RBC compatibility relies on antigen matching:
            </p>
            <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-700">
              <li><strong className="text-slate-900">O- (Universal Donor)</strong>: Red cells compatible with all 8 groups.</li>
              <li><strong className="text-slate-900">AB+ (Universal Recipient)</strong>: Can safely receive red cells from all groups.</li>
              <li><strong className="text-slate-900">Rh- to Rh+</strong>: Safe, but Rh+ to Rh- causes anti-D alloimmunization.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
