import React, { useState, useMemo } from 'react';
import {
  Droplet,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { BloodRequest, BloodGroup, RequestUrgency, RequestStatus } from '../../types';
import { exportRequestsCsv } from '../../services/export';
import { ClinicalWarningBanner } from '../common/ClinicalWarningBanner';

interface RequestListProps {
  requests: BloodRequest[];
  onAddRequest: () => void;
  onEditRequest: (req: BloodRequest) => void;
  onDeleteRequest: (requestId: string) => void;
  onUpdateStatus: (requestId: string, status: RequestStatus, unitsFulfilled?: number) => void;
  onSelectForMatching: (req: BloodRequest) => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
const URGENCIES: RequestUrgency[] = ['CRITICAL', 'URGENT', 'STANDARD'];
const STATUSES: RequestStatus[] = ['PENDING', 'IN_PROGRESS', 'FULFILLED', 'CANCELLED'];

export const RequestList: React.FC<RequestListProps> = ({
  requests,
  onAddRequest,
  onEditRequest,
  onDeleteRequest,
  onUpdateStatus,
  onSelectForMatching,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('ALL');
  const [requestToDelete, setRequestToDelete] = useState<BloodRequest | null>(null);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesHospital = r.hospitalName.toLowerCase().includes(q);
        const matchesRef = r.patientNameOrRef.toLowerCase().includes(q);
        const matchesCity = r.city.toLowerCase().includes(q);
        const matchesReason = (r.clinicalReason || '').toLowerCase().includes(q);
        const matchesContact = r.contactPerson.toLowerCase().includes(q);
        if (!matchesHospital && !matchesRef && !matchesCity && !matchesReason && !matchesContact) {
          return false;
        }
      }

      if (selectedUrgency !== 'ALL' && r.urgency !== selectedUrgency) return false;
      if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
      if (selectedBloodGroup !== 'ALL' && r.bloodGroup !== selectedBloodGroup) return false;

      return true;
    });
  }, [requests, searchQuery, selectedUrgency, selectedStatus, selectedBloodGroup]);

  const handleExport = () => {
    exportRequestsCsv(filteredRequests.length > 0 ? filteredRequests : requests);
  };

  const confirmDelete = () => {
    if (requestToDelete) {
      onDeleteRequest(requestToDelete.id);
      setRequestToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Blood Requests Tracker</h1>
          <p className="text-xs text-slate-500">
            {requests.length} total hospital orders ·{' '}
            {requests.filter((r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length} active demand
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onAddRequest}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md text-white bg-red-600 hover:bg-red-700 active:bg-red-800 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Request</span>
          </button>
        </div>
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
              placeholder="Search hospital, case ref, city, diagnosis, coordinator..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
            />
          </div>

          {/* Urgency Filter */}
          <div className="w-full md:w-36">
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-300 py-1.5 px-2.5 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="ALL">All Urgencies</option>
              {URGENCIES.map((u) => (
                <option key={u} value={u}>
                  {u}
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
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Blood Group Filter */}
          <div className="w-full md:w-36">
            <select
              value={selectedBloodGroup}
              onChange={(e) => setSelectedBloodGroup(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-300 py-1.5 px-2.5 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="ALL">All Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  Type {bg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Counter & Reset */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-900 font-semibold">{filteredRequests.length}</strong> of{' '}
            {requests.length} requests
          </div>
          {(searchQuery || selectedUrgency !== 'ALL' || selectedStatus !== 'ALL' || selectedBloodGroup !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedUrgency('ALL');
                setSelectedStatus('ALL');
                setSelectedBloodGroup('ALL');
              }}
              className="text-red-600 hover:text-red-700 font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Requests List Card Collection */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Droplet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900">No Blood Requests Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search criteria or create a new emergency blood demand record.
          </p>
          <button
            onClick={onAddRequest}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Create New Request
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const isCrit = req.urgency === 'CRITICAL';
            const isUrg = req.urgency === 'URGENT';
            const isFulfilled = req.status === 'FULFILLED';
            const pct = req.unitsNeeded > 0 ? Math.round((req.unitsFulfilled / req.unitsNeeded) * 100) : 0;

            const requiredTime = new Date(req.requiredDate).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={req.id}
                className={`bg-white rounded-lg border p-4 sm:p-5 transition-all shadow-xs ${
                  isCrit && !isFulfilled ? 'border-red-300 bg-red-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex items-start gap-4">
                    {/* Big Blood Badge */}
                    <div
                      className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center shrink-0 border ${
                        isCrit
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : isUrg
                          ? 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider leading-none">Type</span>
                      <span className="text-xl font-black">{req.bloodGroup}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-base text-slate-900">{req.hospitalName}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-medium text-slate-600">{req.city}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span
                          className={`text-xs font-bold ${
                            isCrit ? 'text-red-600' : isUrg ? 'text-amber-700' : 'text-slate-600'
                          }`}
                        >
                          {req.urgency}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span
                          className={`text-xs font-semibold ${
                            isFulfilled
                              ? 'text-emerald-700'
                              : req.status === 'IN_PROGRESS'
                              ? 'text-blue-700'
                              : req.status === 'CANCELLED'
                              ? 'text-slate-400'
                              : 'text-amber-800'
                          }`}
                        >
                          {req.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-slate-800">{req.patientNameOrRef}</span>
                        {req.hospitalDepartment && <span>({req.hospitalDepartment})</span>}
                        <span>·</span>
                        <span>
                          Required by: <strong>{requiredTime}</strong>
                        </span>
                      </div>

                      {req.clinicalReason && (
                        <p className="text-xs text-slate-500 italic mt-1 line-clamp-1">
                          "{req.clinicalReason}"
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{req.contactPerson}: {req.contactPhone}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Progress & Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Units Fulfilled Bar */}
                    <div className="w-full sm:w-44 lg:text-right">
                      <div className="flex items-center justify-between lg:justify-end gap-2 text-xs mb-1">
                        <span className="text-slate-500">Collected:</span>
                        <span className="font-bold text-slate-900">
                          {req.unitsFulfilled} / {req.unitsNeeded} Units
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isFulfilled ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {/* Match Donors Button */}
                      {!isFulfilled && req.status !== 'CANCELLED' && (
                        <button
                          onClick={() => onSelectForMatching(req)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Match Donors</span>
                        </button>
                      )}

                      {/* Quick Fulfill Toggle */}
                      {req.status !== 'FULFILLED' && req.status !== 'CANCELLED' && (
                        <button
                          onClick={() => onUpdateStatus(req.id, 'FULFILLED', req.unitsNeeded)}
                          className="px-2.5 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                          title="Mark Request as completely Fulfilled"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => onEditRequest(req)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                        title="Edit Request"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setRequestToDelete(req)}
                        className="p-1.5 text-slate-400 hover:text-red-600 border border-slate-200 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Delete Request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {requestToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Blood Request?</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to delete order for <strong>{requestToDelete.unitsNeeded} units of {requestToDelete.bloodGroup}</strong> at{' '}
              {requestToDelete.hospitalName}? This action will permanently remove it from active records.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setRequestToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm"
              >
                Delete Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
