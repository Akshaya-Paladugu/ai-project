import React from 'react';
import {
  BarChart3,
  PieChart,
  FileSpreadsheet,
  TrendingUp,
  Droplet,
  Users,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Donor, BloodRequest, AlertLog, ActivityLogItem, BloodGroup } from '../../types';
import {
  exportDonorsCsv,
  exportRequestsCsv,
  exportAlertsCsv,
  exportActivityCsv,
} from '../../services/export';
import { calculateDaysSince } from '../../services/matching';
import { useToast } from '../common/Toast';

interface ReportsViewProps {
  donors: Donor[];
  requests: BloodRequest[];
  alerts: AlertLog[];
  activity: ActivityLogItem[];
  cooldownDays: number;
}

const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export const ReportsView: React.FC<ReportsViewProps> = ({
  donors,
  requests,
  alerts,
  activity,
  cooldownDays,
}) => {
  const { showToast } = useToast();

  // Metrics
  const totalDonors = donors.length;
  const activeDonors = donors.filter((d) => d.status === 'ACTIVE').length;
  const readyNowDonors = donors.filter((d) => {
    if (d.status !== 'ACTIVE') return false;
    const days = calculateDaysSince(d.lastDonationDate);
    return days === null || days >= cooldownDays;
  }).length;

  const totalRequests = requests.length;
  const fulfilledRequests = requests.filter((r) => r.status === 'FULFILLED').length;
  const fulfillmentRate = totalRequests > 0 ? Math.round((fulfilledRequests / totalRequests) * 100) : 0;

  const totalUnitsNeeded = requests.reduce((acc, r) => acc + r.unitsNeeded, 0);
  const totalUnitsCollected = requests.reduce((acc, r) => acc + r.unitsFulfilled, 0);

  // Group Donors by Blood Group
  const donorCountsByGroup: Record<BloodGroup, number> = {
    'O-': 0, 'O+': 0, 'A-': 0, 'A+': 0, 'B-': 0, 'B+': 0, 'AB-': 0, 'AB+': 0,
  };
  donors.forEach((d) => {
    if (donorCountsByGroup[d.bloodGroup] !== undefined) {
      donorCountsByGroup[d.bloodGroup]++;
    }
  });

  const maxGroupCount = Math.max(...Object.values(donorCountsByGroup), 1);

  // Requests by Urgency
  const requestsByUrgency = {
    CRITICAL: requests.filter((r) => r.urgency === 'CRITICAL').length,
    URGENT: requests.filter((r) => r.urgency === 'URGENT').length,
    STANDARD: requests.filter((r) => r.urgency === 'STANDARD').length,
  };

  // Requests by Status
  const requestsByStatus = {
    PENDING: requests.filter((r) => r.status === 'PENDING').length,
    IN_PROGRESS: requests.filter((r) => r.status === 'IN_PROGRESS').length,
    FULFILLED: requests.filter((r) => r.status === 'FULFILLED').length,
    CANCELLED: requests.filter((r) => r.status === 'CANCELLED').length,
  };

  // Top Cities
  const cityCounts: Record<string, number> = {};
  donors.forEach((d) => {
    const c = d.city || 'Unknown';
    cityCounts[c] = (cityCounts[c] || 0) + 1;
  });
  const sortedCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header & Export Suite */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reports, Analytics & Data Export</h1>
          <p className="text-xs text-slate-500">
            Real-time blood stock distribution, order fulfillment metrics, and data export suite
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              exportDonorsCsv(donors);
              showToast('success', 'Exported Donors CSV');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Donors CSV</span>
          </button>

          <button
            onClick={() => {
              exportRequestsCsv(requests);
              showToast('success', 'Exported Requests CSV');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Requests CSV</span>
          </button>

          <button
            onClick={() => {
              exportAlertsCsv(alerts);
              showToast('success', 'Exported Alerts CSV');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Alerts CSV</span>
          </button>

          <button
            onClick={() => {
              exportActivityCsv(activity);
              showToast('success', 'Exported Audit CSV');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Audit Log CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Fulfillment Rate
          </div>
          <div className="text-2xl font-bold text-slate-900">{fulfillmentRate}%</div>
          <div className="text-xs text-slate-500 mt-1">
            {fulfilledRequests} of {totalRequests} orders completed
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Units Demand Met
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {totalUnitsCollected} / {totalUnitsNeeded}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {totalUnitsNeeded - totalUnitsCollected} units remaining
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Ready Donors (No Cooldown)
          </div>
          <div className="text-2xl font-bold text-emerald-700">{readyNowDonors}</div>
          <div className="text-xs text-slate-500 mt-1">
            {totalDonors - readyNowDonors} in cooldown or inactive
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Universal RBC Donors (O-)
          </div>
          <div className="text-2xl font-bold text-red-700">{donorCountsByGroup['O-']}</div>
          <div className="text-xs text-slate-500 mt-1">Emergency critical standby</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Donors by Blood Group Visual Bar Chart */}
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Blood Group Distribution in Directory</h2>
              <p className="text-xs text-slate-500">Number and proportion of registered donors per blood type</p>
            </div>
            <Droplet className="w-4 h-4 text-red-600" />
          </div>

          <div className="space-y-3 pt-2">
            {BLOOD_GROUPS.map((group) => {
              const count = donorCountsByGroup[group];
              const pct = totalDonors > 0 ? Math.round((count / totalDonors) * 100) : 0;
              const barWidth = Math.max(3, (count / maxGroupCount) * 100);

              return (
                <div key={group} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      Type {group}
                      {group === 'O-' && (
                        <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-1 rounded font-semibold">
                          Universal
                        </span>
                      )}
                    </span>
                    <span className="text-slate-600 font-mono">
                      <strong>{count}</strong> donors ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        group === 'O-'
                          ? 'bg-red-600'
                          : group.includes('+')
                          ? 'bg-slate-800'
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Urgency & Status Breakdown */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Hospital Orders by Urgency Tier</h2>
                <p className="text-xs text-slate-500">Distribution of clinical priorities</p>
              </div>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-red-700">Critical</div>
                <div className="text-xl font-black text-red-800 mt-0.5">{requestsByUrgency.CRITICAL}</div>
                <div className="text-[10px] text-red-600">Stat trauma orders</div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Urgent</div>
                <div className="text-xl font-black text-amber-900 mt-0.5">{requestsByUrgency.URGENT}</div>
                <div className="text-[10px] text-amber-700">Within hours</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Standard</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">{requestsByUrgency.STANDARD}</div>
                <div className="text-[10px] text-slate-500">Elective scheduled</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 mb-2">Order Lifecycle Progression</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Fulfilled:</span>
                <span className="font-semibold text-emerald-700">{requestsByStatus.FULFILLED} orders</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>In Progress (Alerts Dispatched):</span>
                <span className="font-semibold text-blue-700">{requestsByStatus.IN_PROGRESS} orders</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pending Donor Matches:</span>
                <span className="font-semibold text-amber-800">{requestsByStatus.PENDING} orders</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cancelled / Withdrawn:</span>
                <span className="font-semibold text-slate-500">{requestsByStatus.CANCELLED} orders</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Density Table */}
      <div className="bg-white p-5 rounded-lg border border-slate-200">
        <h2 className="text-sm font-bold text-slate-900 mb-1">Top Regional Donor Densities</h2>
        <p className="text-xs text-slate-500 mb-4">Geographic distribution of donor network volunteers</p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {sortedCities.map(([city, count]) => {
            const pct = totalDonors > 0 ? Math.round((count / totalDonors) * 100) : 0;
            return (
              <div key={city} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>{city}</span>
                </div>
                <div className="text-lg font-bold text-slate-900">{count} donors</div>
                <div className="text-[11px] text-slate-500">{pct}% of network</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
