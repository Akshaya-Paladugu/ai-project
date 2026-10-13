import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  FileSpreadsheet,
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { AlertLog, AlertChannel, AlertStatus, RequestUrgency } from '../../types';
import { exportAlertsCsv } from '../../services/export';
import { useToast } from '../common/Toast';

interface AlertHistoryViewProps {
  alerts: AlertLog[];
  onResendAlert: (alert: AlertLog) => void;
}

const CHANNELS: AlertChannel[] = ['SMS', 'WHATSAPP', 'EMAIL'];
const STATUSES: AlertStatus[] = ['DELIVERED', 'ACKNOWLEDGED', 'SENT', 'QUEUED', 'DECLINED'];
const URGENCIES: RequestUrgency[] = ['CRITICAL', 'URGENT', 'STANDARD'];

export const AlertHistoryView: React.FC<AlertHistoryViewProps> = ({ alerts, onResendAlert }) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [selectedAlertForDetails, setSelectedAlertForDetails] = useState<AlertLog | null>(null);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDonor = a.donorName.toLowerCase().includes(q);
        const matchesHospital = a.hospitalName.toLowerCase().includes(q);
        const matchesContact = a.recipientContact.toLowerCase().includes(q);
        const matchesMsg = a.message.toLowerCase().includes(q);
        if (!matchesDonor && !matchesHospital && !matchesContact && !matchesMsg) return false;
      }

      if (selectedChannel !== 'ALL' && a.channel !== selectedChannel) return false;
      if (selectedStatus !== 'ALL' && a.status !== selectedStatus) return false;
      if (selectedUrgency !== 'ALL' && a.urgency !== selectedUrgency) return false;

      return true;
    });
  }, [alerts, searchQuery, selectedChannel, selectedStatus, selectedUrgency]);

  const handleExport = () => {
    exportAlertsCsv(filteredAlerts.length > 0 ? filteredAlerts : alerts);
    showToast('success', 'Export Complete', 'Alert history downloaded as CSV.');
  };

  const handleResend = (alert: AlertLog) => {
    onResendAlert(alert);
    showToast('success', 'Alert Re-Dispatched', `Simulated resend to ${alert.donorName} via ${alert.channel}.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Smart Alert Dispatch History</h1>
          <p className="text-xs text-slate-500">
            {alerts.length} total local notification dispatches recorded · Duplicate prevention enabled
          </p>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Export Alerts CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search donor name, hospital, phone/email, or message text..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
            />
          </div>

          {/* Channel Filter */}
          <div className="w-full md:w-36">
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-300 py-1.5 px-2.5 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="ALL">All Channels</option>
              {CHANNELS.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-36">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-300 py-1.5 px-2.5 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="ALL">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency Filter */}
          <div className="w-full md:w-36">
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-300 py-1.5 px-2.5 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="ALL">All Urgencies</option>
              {URGENCIES.map((ur) => (
                <option key={ur} value={ur}>
                  {ur}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Counter & Reset */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-900 font-semibold">{filteredAlerts.length}</strong> of{' '}
            {alerts.length} alert logs
          </div>
          {(searchQuery || selectedChannel !== 'ALL' || selectedStatus !== 'ALL' || selectedUrgency !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedChannel('ALL');
                setSelectedStatus('ALL');
                setSelectedUrgency('ALL');
              }}
              className="text-red-600 hover:text-red-700 font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Alert Log Table */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900">No Alert Logs Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Dispatch an alert from the Smart Match & Dispatch tab to see records here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Donor Recipient</th>
                  <th className="py-3 px-3">Blood Type</th>
                  <th className="py-3 px-3">Hospital / Urgency</th>
                  <th className="py-3 px-3">Channel & Destination</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAlerts.map((alert) => {
                  const sentDate = new Date(alert.sentAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={alert.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {sentDate}
                      </td>

                      {/* Recipient */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{alert.donorName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{alert.recipientContact}</div>
                      </td>

                      {/* Blood Type */}
                      <td className="py-3 px-3">
                        <span className="font-black text-sm text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          {alert.bloodGroup}
                        </span>
                      </td>

                      {/* Hospital & Urgency */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900">{alert.hospitalName}</div>
                        <div className="text-[11px] text-slate-500">
                          {alert.city} ·{' '}
                          <span
                            className={`font-semibold ${
                              alert.urgency === 'CRITICAL'
                                ? 'text-red-600'
                                : alert.urgency === 'URGENT'
                                ? 'text-amber-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {alert.urgency}
                          </span>
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700 text-xs">{alert.channel}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          {alert.status === 'DELIVERED' || alert.status === 'ACKNOWLEDGED' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                          <span
                            className={`text-xs font-semibold ${
                              alert.status === 'DELIVERED' || alert.status === 'ACKNOWLEDGED'
                                ? 'text-emerald-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {alert.status}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedAlertForDetails(alert)}
                            className="px-2 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded text-[11px] hover:bg-slate-50 cursor-pointer"
                          >
                            View Message
                          </button>
                          <button
                            onClick={() => handleResend(alert)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Resend this alert"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message Content Modal */}
      {selectedAlertForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Dispatched Message Preview</h3>
              <button
                onClick={() => setSelectedAlertForDetails(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Recipient:</span>
                <span className="font-semibold text-slate-900">{selectedAlertForDetails.donorName}</span>
              </div>
              <div className="flex justify-between">
                <span>Destination:</span>
                <span className="font-mono">{selectedAlertForDetails.recipientContact}</span>
              </div>
              <div className="flex justify-between">
                <span>Channel:</span>
                <span className="font-semibold text-slate-900">{selectedAlertForDetails.channel}</span>
              </div>
              <div className="flex justify-between">
                <span>Timestamp:</span>
                <span>{new Date(selectedAlertForDetails.sentAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-md border border-slate-200 font-mono text-xs whitespace-pre-wrap text-slate-800 max-h-48 overflow-y-auto">
              {selectedAlertForDetails.message}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedAlertForDetails(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
