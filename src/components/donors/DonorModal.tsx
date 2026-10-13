import React, { useState, useEffect } from 'react';
import { X, User, Droplet, MapPin, Phone, Mail, Scale, Calendar, AlertCircle } from 'lucide-react';
import { Donor, BloodGroup, DonorStatus } from '../../types';

interface DonorModalProps {
  isOpen: boolean;
  donorToEdit: Donor | null;
  onClose: () => void;
  onSave: (donor: Donor) => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export const DonorModal: React.FC<DonorModalProps> = ({
  isOpen,
  donorToEdit,
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [city, setCity] = useState('');
  const [stateOrRegion, setStateOrRegion] = useState('WA');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState<number>(30);
  const [weightKg, setWeightKg] = useState<number>(68);
  const [gender, setGender] = useState<Donor['gender']>('PREFER_NOT_TO_SAY');
  const [status, setStatus] = useState<DonorStatus>('ACTIVE');
  const [isAvailableNow, setIsAvailableNow] = useState(true);
  const [lastDonationDate, setLastDonationDate] = useState<string>('');
  const [totalDonations, setTotalDonations] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (donorToEdit) {
      setFullName(donorToEdit.fullName);
      setBloodGroup(donorToEdit.bloodGroup);
      setCity(donorToEdit.city);
      setStateOrRegion(donorToEdit.stateOrRegion || '');
      setPhone(donorToEdit.phone);
      setEmail(donorToEdit.email);
      setAge(donorToEdit.age);
      setWeightKg(donorToEdit.weightKg);
      setGender(donorToEdit.gender);
      setStatus(donorToEdit.status);
      setIsAvailableNow(donorToEdit.isAvailableNow);
      setLastDonationDate(donorToEdit.lastDonationDate || '');
      setTotalDonations(donorToEdit.totalDonations);
      setNotes(donorToEdit.notes || '');
    } else {
      // Defaults for new donor
      setFullName('');
      setBloodGroup('O+');
      setCity('Seattle');
      setStateOrRegion('WA');
      setPhone('');
      setEmail('');
      setAge(28);
      setWeightKg(65);
      setGender('PREFER_NOT_TO_SAY');
      setStatus('ACTIVE');
      setIsAvailableNow(true);
      setLastDonationDate('');
      setTotalDonations(0);
      setNotes('');
    }
    setErrors({});
  }, [donorToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full Name is required';
    if (!city.trim()) errs.city = 'City is required';
    if (!phone.trim()) errs.phone = 'Phone number is required';
    if (!email.trim() || !email.includes('@')) errs.email = 'Valid email is required';
    if (age < 16 || age > 85) errs.age = 'Age must be between 16 and 85';
    if (weightKg < 40) errs.weightKg = 'Weight must be at least 40kg';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const donorData: Donor = {
      id: donorToEdit ? donorToEdit.id : `dnr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fullName: fullName.trim(),
      bloodGroup,
      city: city.trim(),
      stateOrRegion: stateOrRegion.trim(),
      phone: phone.trim(),
      email: email.trim(),
      age: Number(age),
      weightKg: Number(weightKg),
      gender,
      status,
      isAvailableNow,
      lastDonationDate: lastDonationDate.trim() ? lastDonationDate : null,
      totalDonations: Number(totalDonations),
      notes: notes.trim(),
      registeredAt: donorToEdit ? donorToEdit.registeredAt : new Date().toISOString(),
    };

    onSave(donorData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-2xl w-full shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-red-100 text-red-700 flex items-center justify-center">
              <Droplet className="w-4 h-4 fill-red-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {donorToEdit ? 'Edit Blood Donor Profile' : 'Register New Volunteer Donor'}
              </h2>
              <p className="text-xs text-slate-500">Record clinical details and contact availability</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {weightKg < 50 && (
            <div className="flex items-center gap-2 p-2.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Donors weighing under 50 kg (110 lbs) require clinical screening by a physician before whole blood donation.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Jane Smith"
                  className={`w-full text-xs rounded-md border px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 ${
                    errors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-red-600 focus:border-red-600'
                  }`}
                />
              </div>
              {errors.fullName && <p className="text-[11px] text-red-600 mt-0.5">{errors.fullName}</p>}
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Blood Group <span className="text-red-500">*</span>
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 font-bold"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg} {bg === 'O-' ? '(Universal RBC Donor)' : bg === 'AB+' ? '(Universal Recipient)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Seattle"
                className={`w-full text-xs rounded-md border px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 ${
                  errors.city ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-red-600 focus:border-red-600'
                }`}
              />
              {errors.city && <p className="text-[11px] text-red-600 mt-0.5">{errors.city}</p>}
            </div>

            {/* State / Region */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State / Province</label>
              <input
                type="text"
                value={stateOrRegion}
                onChange={(e) => setStateOrRegion(e.target.value)}
                placeholder="e.g. WA"
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (206) 555-0123"
                className={`w-full text-xs rounded-md border px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 ${
                  errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-red-600 focus:border-red-600'
                }`}
              />
              {errors.phone && <p className="text-[11px] text-red-600 mt-0.5">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="donor@example.org"
                className={`w-full text-xs rounded-md border px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 ${
                  errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-red-600 focus:border-red-600'
                }`}
              />
              {errors.email && <p className="text-[11px] text-red-600 mt-0.5">{errors.email}</p>}
            </div>

            {/* Age & Weight */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Years)</label>
              <input
                type="number"
                min="16"
                max="85"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
              />
              {errors.age && <p className="text-[11px] text-red-600 mt-0.5">{errors.age}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                min="40"
                max="250"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
              />
              {errors.weightKg && <p className="text-[11px] text-red-600 mt-0.5">{errors.weightKg}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Directory Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DonorStatus)}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
              >
                <option value="ACTIVE">ACTIVE (Receives emergency alerts)</option>
                <option value="INACTIVE">INACTIVE (Temporarily paused)</option>
              </select>
            </div>

            {/* Last Donation Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Blood Donation Date (Leave blank if first-time)
              </label>
              <input
                type="date"
                value={lastDonationDate}
                onChange={(e) => setLastDonationDate(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
              />
            </div>

            {/* Total Donations */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lifetime Donations Count</label>
              <input
                type="number"
                min="0"
                max="500"
                value={totalDonations}
                onChange={(e) => setTotalDonations(Number(e.target.value))}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
              />
            </div>
          </div>

          {/* Availability Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isAvailableNow"
              checked={isAvailableNow}
              onChange={(e) => setIsAvailableNow(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
            />
            <label htmlFor="isAvailableNow" className="text-xs font-medium text-slate-700 cursor-pointer">
              Donor is currently reachable and willing to respond to urgent notifications
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Notes & Availability Preferences
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Prefers evening dispatches, verified hemoglobin 14.2 g/dL, regular platelet volunteer..."
              className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-md shadow-sm transition-colors cursor-pointer"
            >
              {donorToEdit ? 'Save Changes' : 'Register Donor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
