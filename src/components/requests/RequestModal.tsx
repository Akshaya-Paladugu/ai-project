import React, { useState, useEffect } from 'react';
import {
  X,
  Droplet,
  Building2,
  AlertTriangle,
  Sparkles,
  Phone,
  User,
  Calendar,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { BloodRequest, BloodGroup, RequestUrgency, RequestStatus } from '../../types';
import { triageClinicalNote } from '../../services/ai';

interface RequestModalProps {
  isOpen: boolean;
  requestToEdit: BloodRequest | null;
  onClose: () => void;
  onSave: (req: BloodRequest) => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
const URGENCIES: RequestUrgency[] = ['CRITICAL', 'URGENT', 'STANDARD'];
const STATUSES: RequestStatus[] = ['PENDING', 'IN_PROGRESS', 'FULFILLED', 'CANCELLED'];

export const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  requestToEdit,
  onClose,
  onSave,
}) => {
  const [patientRef, setPatientRef] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O-');
  const [unitsNeeded, setUnitsNeeded] = useState<number>(2);
  const [unitsFulfilled, setUnitsFulfilled] = useState<number>(0);
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalDepartment, setHospitalDepartment] = useState('');
  const [city, setCity] = useState('');
  const [urgency, setUrgency] = useState<RequestUrgency>('URGENT');
  const [status, setStatus] = useState<RequestStatus>('PENDING');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [clinicalReason, setClinicalReason] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // AI Triage Assistant State
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [rawClinicalNote, setRawClinicalNote] = useState('');
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiParsedStatus, setAiParsedStatus] = useState<string | null>(null);

  useEffect(() => {
    if (requestToEdit) {
      setPatientRef(requestToEdit.patientNameOrRef);
      setBloodGroup(requestToEdit.bloodGroup);
      setUnitsNeeded(requestToEdit.unitsNeeded);
      setUnitsFulfilled(requestToEdit.unitsFulfilled);
      setHospitalName(requestToEdit.hospitalName);
      setHospitalDepartment(requestToEdit.hospitalDepartment || '');
      setCity(requestToEdit.city);
      setUrgency(requestToEdit.urgency);
      setStatus(requestToEdit.status);
      setContactPerson(requestToEdit.contactPerson);
      setContactPhone(requestToEdit.contactPhone);
      setRequiredDate(
        requestToEdit.requiredDate ? requestToEdit.requiredDate.slice(0, 16) : ''
      );
      setClinicalReason(requestToEdit.clinicalReason || '');
      setNotes(requestToEdit.notes || '');
    } else {
      // Defaults
      setPatientRef('');
      setBloodGroup('O-');
      setUnitsNeeded(2);
      setUnitsFulfilled(0);
      setHospitalName('Harborview Medical Center');
      setHospitalDepartment('Emergency Department');
      setCity('Seattle');
      setUrgency('CRITICAL');
      setStatus('PENDING');
      setContactPerson('Transfusion Coordinator');
      setContactPhone('+1 (206) 555-0199');
      // Set requiredDate to +6 hours from now
      const defaultDate = new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 16);
      setRequiredDate(defaultDate);
      setClinicalReason('');
      setNotes('');
    }
    setErrors({});
    setShowAiAssistant(false);
    setRawClinicalNote('');
    setAiParsedStatus(null);
  }, [requestToEdit, isOpen]);

  if (!isOpen) return null;

  const handleParseAiNote = async () => {
    if (!rawClinicalNote.trim()) return;
    setIsAiParsing(true);
    setAiParsedStatus(null);
    try {
      const result = await triageClinicalNote(rawClinicalNote);
      const data = result.data;
      setPatientRef(data.patientRef);
      setBloodGroup(data.bloodGroup);
      setUnitsNeeded(data.unitsNeeded);
      setHospitalName(data.hospitalName);
      setCity(data.city);
      setUrgency(data.urgency);
      setClinicalReason(data.clinicalReason);
      setContactPerson(data.contactPerson);
      setContactPhone(data.contactPhone);
      setAiParsedStatus(
        result.source === 'GEMINI_AI'
          ? 'Extracted via Gemini AI triage parser'
          : 'Extracted via clinical triage parser rules'
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiParsing(false);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!patientRef.trim()) errs.patientRef = 'Patient / Case Reference is required';
    if (!hospitalName.trim()) errs.hospitalName = 'Hospital Name is required';
    if (!city.trim()) errs.city = 'City is required';
    if (unitsNeeded < 1) errs.unitsNeeded = 'Units needed must be at least 1';
    if (!contactPhone.trim()) errs.contactPhone = 'Contact phone is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const reqData: BloodRequest = {
      id: requestToEdit ? requestToEdit.id : `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      patientNameOrRef: patientRef.trim(),
      bloodGroup,
      unitsNeeded: Number(unitsNeeded),
      unitsFulfilled: Number(unitsFulfilled),
      hospitalName: hospitalName.trim(),
      hospitalDepartment: hospitalDepartment.trim(),
      city: city.trim(),
      urgency,
      status,
      contactPerson: contactPerson.trim() || 'Transfusion Desk',
      contactPhone: contactPhone.trim(),
      requiredDate: requiredDate ? new Date(requiredDate).toISOString() : new Date().toISOString(),
      createdAt: requestToEdit ? requestToEdit.createdAt : new Date().toISOString(),
      clinicalReason: clinicalReason.trim(),
      notes: notes.trim(),
    };

    onSave(reqData);
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
                {requestToEdit ? 'Edit Blood Request Record' : 'Create Emergency / Clinical Blood Request'}
              </h2>
              <p className="text-xs text-slate-500">
                Specify target units, hospital destination, and urgency tier
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Optional AI Triage Parse Banner */}
        <div className="px-6 pt-4">
          <button
            type="button"
            onClick={() => setShowAiAssistant(!showAiAssistant)}
            className="w-full flex items-center justify-between p-2.5 rounded-md border border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 text-xs transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Sparkles className="w-4 h-4 text-red-600" />
              <span>Smart Clinical Note Triage Assistant</span>
              <span className="text-[10px] text-slate-500 font-normal">
                (Auto-fill from unstructured doctor note)
              </span>
            </div>
            <span className="text-red-600 font-medium text-[11px]">
              {showAiAssistant ? 'Hide Note Parser' : 'Open Note Parser'}
            </span>
          </button>

          {showAiAssistant && (
            <div className="mt-2.5 p-3 rounded-md bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-[11px] font-semibold text-slate-700">
                Paste doctor memo, trauma bay log, or hospital dispatch note:
              </label>
              <textarea
                rows={2}
                value={rawClinicalNote}
                onChange={(e) => setRawClinicalNote(e.target.value)}
                placeholder="e.g. Harborview ER Trauma Bay 1: Adult male post-MVA severe hemorrhagic shock, hemoglobin 5.8 g/dL. Immediate 4 units O neg stat needed. Contact Dr Raymond Holt ext 9911..."
                className="w-full text-xs rounded border border-slate-300 p-2 text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {aiParsedStatus ? (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {aiParsedStatus}
                    </span>
                  ) : (
                    'Parses patient, blood type, units, urgency, hospital and phone.'
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleParseAiNote}
                  disabled={isAiParsing || !rawClinicalNote.trim()}
                  className="px-3 py-1 text-xs font-semibold rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {isAiParsing ? 'Analyzing...' : 'Parse & Populate Form'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Patient Ref */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient / Case Reference <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={patientRef}
                onChange={(e) => setPatientRef(e.target.value)}
                placeholder="e.g. Case #4089 (Trauma ICU)"
                className={`w-full text-xs rounded-md border px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 ${
                  errors.patientRef ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-red-600'
                }`}
              />
              {errors.patientRef && <p className="text-[11px] text-red-600 mt-0.5">{errors.patientRef}</p>}
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Blood Group Needed <span className="text-red-500">*</span>
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-red-600 font-extrabold"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    Type {bg} {bg === 'O-' ? '(Universal RBC)' : bg === 'AB+' ? '(Universal Recipient)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Units Needed */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Units Needed <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={unitsNeeded}
                onChange={(e) => setUnitsNeeded(Number(e.target.value))}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600 font-bold"
              />
              {errors.unitsNeeded && <p className="text-[11px] text-red-600 mt-0.5">{errors.unitsNeeded}</p>}
            </div>

            {/* Units Fulfilled */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Units Fulfilled</label>
              <input
                type="number"
                min="0"
                max={unitsNeeded}
                value={unitsFulfilled}
                onChange={(e) => setUnitsFulfilled(Number(e.target.value))}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>

            {/* Hospital Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital / Transfusion Center <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="e.g. Harborview Medical Center"
                className={`w-full text-xs rounded-md border px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 ${
                  errors.hospitalName ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-red-600'
                }`}
              />
              {errors.hospitalName && <p className="text-[11px] text-red-600 mt-0.5">{errors.hospitalName}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Department</label>
              <input
                type="text"
                value={hospitalDepartment}
                onChange={(e) => setHospitalDepartment(e.target.value)}
                placeholder="e.g. Pediatric Surgery / ER Bay 2"
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
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
                  errors.city ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-red-600'
                }`}
              />
              {errors.city && <p className="text-[11px] text-red-600 mt-0.5">{errors.city}</p>}
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Urgency Level <span className="text-red-500">*</span>
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as RequestUrgency)}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-red-600 font-semibold"
              >
                <option value="CRITICAL">CRITICAL (STAT - Life-threatening emergency)</option>
                <option value="URGENT">URGENT (Required within 2-6 hours)</option>
                <option value="STANDARD">STANDARD (Scheduled elective procedure)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Request Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RequestStatus)}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
              >
                <option value="PENDING">PENDING (Awaiting donor matches)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Alerts active / donors en route)</option>
                <option value="FULFILLED">FULFILLED (Units collected & verified)</option>
                <option value="CANCELLED">CANCELLED (Withdrawn by hospital)</option>
              </select>
            </div>

            {/* Required Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Required By Date & Time</label>
              <input
                type="datetime-local"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Coordinator / Physician</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Dr. Raymond Holt"
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Direct Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 (206) 555-9911"
                className={`w-full text-xs rounded-md border px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 ${
                  errors.contactPhone ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-red-600'
                }`}
              />
              {errors.contactPhone && <p className="text-[11px] text-red-600 mt-0.5">{errors.contactPhone}</p>}
            </div>
          </div>

          {/* Clinical Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Reason / Diagnosis / Transfusion Indication
            </label>
            <textarea
              rows={2}
              value={clinicalReason}
              onChange={(e) => setClinicalReason(e.target.value)}
              placeholder="e.g. Polytrauma post-motor vehicle accident with severe active pelvic hemorrhage. Massive transfusion protocol activated."
              className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Hospital Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pre-transfusion crossmatch sample in blood bank lab."
              className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600"
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
              {requestToEdit ? 'Save Changes' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
