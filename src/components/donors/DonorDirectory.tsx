import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Edit2,
  Power,
  Trash2,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  LayoutGrid,
  List,
  AlertCircle,
} from 'lucide-react';
import { Donor, BloodGroup, DonorStatus } from '../../types';
import { calculateDaysSince } from '../../services/matching';
import { exportDonorsCsv } from '../../services/export';
import { ClinicalWarningBanner } from '../common/ClinicalWarningBanner';

interface DonorDirectoryProps {
  donors: Donor[];
  cooldownDays: number;
  onAddDonor: () => void;
  onEditDonor: (donor: Donor) => void;
  onToggleStatus: (donorId: string) => void;
  onDeleteDonor: (donorId: string) => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export const DonorDirectory: React.FC<DonorDirectoryProps> = ({
  donors,
  cooldownDays,
  onAddDonor,
  onEditDonor,
  onToggleStatus,
  onDeleteDonor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [selectedEligibility, setSelectedEligibility] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [donorToDelete, setDonorToDelete] = useState<Donor | null>(null);

  // Extract unique cities
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    donors.forEach((d) => {
      if (d.city) set.add(d.city.trim());
    });
    return Array.from(set).sort();
  }, [donors]);

  // Filtered donors
  const filteredDonors = useMemo(() => {
    return donors.filter((d) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = d.fullName.toLowerCase().includes(query);
        const matchesPhone = d.phone.toLowerCase().includes(query);
        const matchesEmail = d.email.toLowerCase().includes(query);
        const matchesNotes = (d.notes || '').toLowerCase().includes(query);
        const matchesCity = d.city.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesNotes && !matchesCity) {
          return false;
        }
      }

      // Blood group
      if (selectedBloodGroup !== 'ALL' && d.bloodGroup !== selectedBloodGroup) {
        return false;
      }

      // City
      if (selectedCity !== 'ALL' && d.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      // Eligibility
      if (selectedEligibility !== 'ALL') {
        const days = calculateDaysSince(d.lastDonationDate);
        const isEligible = d.status === 'ACTIVE' && (days === null || days >= cooldownDays);
        const isCooldown = d.status === 'ACTIVE' && days !== null && days < cooldownDays;
        const isInactive = d.status === 'INACTIVE';

        if (selectedEligibility === 'ELIGIBLE' && !isEligible) return false;
        if (selectedEligibility === 'COOLDOWN' && !isCooldown) return false;
        if (selectedEligibility === 'INACTIVE' && !isInactive) return false;
      }

      return true;
    });
  }, [donors, searchQuery, selectedBloodGroup, selectedCity, selectedEligibility, cooldownDays]);

  const handleExport = () => {
    exportDonorsCsv(filteredDonors.length > 0 ? filteredDonors : donors);
  };

  const confirmDelete = () => {
    if (donorToDelete) {
      onDeleteDonor(donorToDelete.id);
      setDonorToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Blood Donor Directory</h1>
          <p className="text-xs text-slate-500">
            {donors.length} registered donors · {donors.filter((d) => d.status === 'ACTIVE').length} active in network
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
            title="Export current list as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onAddDonor}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md text-white bg-red-600 hover:bg-red-700 active:bg-red-800 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Donor</span>
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
              placeholder="Search donor name, phone, email, notes, or location..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
            />
          </div>

          {/* Blood Group Filter */}
          <div className="w-full md:w-36">
            <select
              value={selectedBloodGroup}
              onChange={(e) => setSelectedBloodGroup(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-300 py-1.5 px-2.5 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="ALL">All Blood Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  Type {bg}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div className="w-full md:w-36">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-300 py-1.5 px-2.5 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="ALL">All Cities</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Eligibility Filter */}
          <div className="w-full md:w-44">
            <select
              value={selectedEligibility}
              onChange={(e) => setSelectedEligibility(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-300 py-1.5 px-2.5 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="ELIGIBLE">Ready Now (Cooldown Satisfied)</option>
              <option value="COOLDOWN">In Recovery Cooldown</option>
              <option value="INACTIVE">Inactive Profiles</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-md p-0.5 bg-slate-50 self-end md:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Result Counter */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-900 font-semibold">{filteredDonors.length}</strong> of{' '}
            {donors.length} donors
          </div>
          {(searchQuery || selectedBloodGroup !== 'ALL' || selectedCity !== 'ALL' || selectedEligibility !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedBloodGroup('ALL');
                setSelectedCity('ALL');
                setSelectedEligibility('ALL');
              }}
              className="text-red-600 hover:text-red-700 font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Directory Views */}
      {filteredDonors.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900">No Donors Match Your Filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search terms, blood group filter, or location settings.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedBloodGroup('ALL');
              setSelectedCity('ALL');
              setSelectedEligibility('ALL');
            }}
            className="px-4 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-md hover:bg-red-50"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Donor Name</th>
                  <th className="py-3 px-3">Blood Type</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Recovery Cooldown</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDonors.map((donor) => {
                  const days = calculateDaysSince(donor.lastDonationDate);
                  const isEligible = donor.status === 'ACTIVE' && (days === null || days >= cooldownDays);
                  const isCooldown = donor.status === 'ACTIVE' && days !== null && days < cooldownDays;
                  const cooldownRemaining = days !== null && days < cooldownDays ? cooldownDays - days : 0;

                  return (
                    <tr key={donor.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Basic */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{donor.fullName}</div>
                        <div className="text-[11px] text-slate-500">
                          {donor.age} yrs · {donor.weightKg} kg · {donor.totalDonations} donations
                        </div>
                        {donor.notes && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1 max-w-xs">
                            {donor.notes}
                          </div>
                        )}
                      </td>

                      {/* Blood Group */}
                      <td className="py-3 px-3">
                        <div className="inline-flex items-center gap-1">
                          <span className="font-extrabold text-sm text-slate-900 bg-red-50 text-red-700 border border-red-200/80 px-2 py-0.5 rounded">
                            {donor.bloodGroup}
                          </span>
                          {donor.bloodGroup === 'O-' && (
                            <span className="text-[10px] text-slate-500" title="Universal RBC Donor">
                              (Univ)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3 text-slate-700">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {donor.city}
                            {donor.stateOrRegion ? `, ${donor.stateOrRegion}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3 text-slate-600 space-y-0.5">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{donor.phone}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[150px]">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span title={donor.email}>{donor.email}</span>
                        </div>
                      </td>

                      {/* Recovery Cooldown */}
                      <td className="py-3 px-3">
                        {days === null ? (
                          <div className="text-emerald-700 text-[11px] font-medium flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>First-time / Ready</span>
                          </div>
                        ) : isEligible ? (
                          <div>
                            <div className="text-emerald-700 text-[11px] font-medium flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Eligible</span>
                            </div>
                            <div className="text-[10px] text-slate-500">{days}d since donation</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-amber-700 text-[11px] font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Cooldown ({cooldownRemaining}d left)</span>
                            </div>
                            <div className="text-[10px] text-slate-500">Donated {days}d ago</div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-xs font-semibold ${
                            donor.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          {donor.status}
                        </span>
                        {donor.status === 'ACTIVE' && donor.isAvailableNow && (
                          <div className="text-[10px] text-slate-500">Immediate Reach</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onEditDonor(donor)}
                            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Edit Donor Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleStatus(donor.id)}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              donor.status === 'ACTIVE'
                                ? 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title={donor.status === 'ACTIVE' ? 'Deactivate alerts for donor' : 'Reactivate donor'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDonorToDelete(donor)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Remove Donor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDonors.map((donor) => {
            const days = calculateDaysSince(donor.lastDonationDate);
            const isEligible = donor.status === 'ACTIVE' && (days === null || days >= cooldownDays);
            const isCooldown = donor.status === 'ACTIVE' && days !== null && days < cooldownDays;
            const cooldownRemaining = days !== null && days < cooldownDays ? cooldownDays - days : 0;

            return (
              <div
                key={donor.id}
                className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">{donor.fullName}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {donor.city}
                          {donor.stateOrRegion ? `, ${donor.stateOrRegion}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 text-red-700 font-extrabold text-sm px-2.5 py-1 rounded">
                      {donor.bloodGroup}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 my-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-mono">{donor.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="truncate max-w-[170px]" title={donor.email}>{donor.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Age / Weight:</span>
                      <span>{donor.age} yrs · {donor.weightKg} kg</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total Donations:</span>
                      <span className="font-semibold text-slate-800">{donor.totalDonations} units</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cooldown Status:</span>
                      <span>
                        {days === null ? (
                          <span className="text-emerald-700 font-medium">Ready (First-time)</span>
                        ) : isEligible ? (
                          <span className="text-emerald-700 font-medium">Eligible ({days}d ago)</span>
                        ) : (
                          <span className="text-amber-700 font-semibold">{cooldownRemaining}d left</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {donor.notes && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 italic line-clamp-2 mb-3">
                      "{donor.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span
                    className={`font-semibold text-[11px] ${
                      donor.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {donor.status}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onToggleStatus(donor.id)}
                      className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      {donor.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => onEditDonor(donor)}
                      className="px-2 py-1 text-[11px] text-red-600 hover:text-red-700 border border-red-200 rounded hover:bg-red-50 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {donorToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">Remove Donor from Directory?</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to remove <strong>{donorToDelete.fullName}</strong> ({donorToDelete.bloodGroup},{' '}
              {donorToDelete.city})? This donor will no longer receive emergency alerts.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDonorToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
