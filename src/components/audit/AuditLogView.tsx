import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  FileSpreadsheet,
  Clock,
  User,
  Shield,
  Trash2,
} from 'lucide-react';
import { ActivityLogItem } from '../../types';
import { exportActivityCsv } from '../../services/export';
import { useToast } from '../common/Toast';

interface AuditLogViewProps {
  activity: ActivityLogItem[];
  onClearLog: () => void;
}

const CATEGORIES: ActivityLogItem['category'][] = ['DONOR', 'REQUEST', 'ALERT', 'SYSTEM', 'MATCH'];

export const AuditLogView: React.FC<AuditLogViewProps> = ({ activity, onClearLog }) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredItems = useMemo(() => {
    return activity.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAction = item.action.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesActor = item.actor.toLowerCase().includes(q);
        if (!matchesAction && !matchesDesc && !matchesActor) return false;
      }

      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;

      return true;
    });
  }, [activity, searchQuery, selectedCategory]);

  const handleExport = () => {
    exportActivityCsv(filteredItems.length > 0 ? filteredItems : activity);
    showToast('success', 'Export Complete', 'Audit log exported as CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Audit & Activity Log</h1>
          <p className="text-xs text-slate-500">
            Immutable trace of donor modifications, emergency dispatches, and hospital order status updates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Log CSV</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-1.5 text-slate-400 hover:text-red-600 border border-slate-200 hover:bg-red-50 rounded-md transition-colors"
            title="Clear Activity History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actions, events, coordinators, or case references..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div className="w-full sm:w-44">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-300 py-1.5 px-2.5 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} Events
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-900 font-semibold">{filteredItems.length}</strong> of{' '}
            {activity.length} event records
          </div>
          {(searchQuery || selectedCategory !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="text-red-600 hover:text-red-700 font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Activity Timeline List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900">No Activity Events Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Actions you perform in the app will be logged here automatically.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {filteredItems.map((item) => {
            const date = new Date(item.timestamp);
            const timeFormatted = date.toLocaleString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            const isAlert = item.category === 'ALERT';
            const isRequest = item.category === 'REQUEST';
            const isDonor = item.category === 'DONOR';

            return (
              <div key={item.id} className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                        isAlert
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : isRequest
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : isDonor
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.category}
                    </span>
                    <span className="font-bold text-sm text-slate-900">{item.action}</span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{item.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{item.actor}</span>
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right text-[11px] font-mono text-slate-500 shrink-0">
                  {timeFormatted}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">Clear Activity Log?</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              This will remove all recorded audit events from your local storage. It does not delete donors or blood
              requests.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearLog();
                  setShowClearConfirm(false);
                  showToast('info', 'Activity Log Cleared');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm"
              >
                Clear Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
