import React, { useState } from 'react';
import {
  X,
  Settings,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { SystemSettings, AlertChannel } from '../../types';
import { StorageService } from '../../services/storage';
import { useToast } from '../common/Toast';

interface SettingsModalProps {
  isOpen: boolean;
  settings: SystemSettings;
  onClose: () => void;
  onSaveSettings: (settings: SystemSettings) => void;
  onResetDemoData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSaveSettings,
  onResetDemoData,
}) => {
  const { showToast } = useToast();

  const [cooldownDays, setCooldownDays] = useState(settings.cooldownPeriodDays);
  const [duplicateHours, setDuplicateHours] = useState(settings.enableDuplicateAlertWindowHours);
  const [defaultChannel, setDefaultChannel] = useState<AlertChannel>(settings.defaultAlertChannel);
  const [orgName, setOrgName] = useState(settings.organizationName);
  const [helpline, setHelpline] = useState(settings.helplinePhone);

  // Confirmed Reset Dialog
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');

  // Backup & Restore
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      cooldownPeriodDays: Number(cooldownDays),
      enableDuplicateAlertWindowHours: Number(duplicateHours),
      defaultAlertChannel: defaultChannel,
      organizationName: orgName.trim(),
      helplinePhone: helpline.trim(),
      soundAlertsEnabled: true,
    });
    showToast('success', 'Settings Saved', 'System rules and parameters updated.');
    onClose();
  };

  const handleExecuteReset = () => {
    if (resetConfirmInput.trim().toUpperCase() !== 'RESET') {
      showToast('error', 'Confirmation Failed', 'You must type RESET in all caps to confirm.');
      return;
    }
    onResetDemoData();
    setShowResetConfirm(false);
    setResetConfirmInput('');
    showToast('info', 'Demo Data Reset', 'Re-initialized standard clinical demonstration records.');
    onClose();
  };

  const handleDownloadBackup = () => {
    const jsonStr = StorageService.exportAllDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifelink-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', 'Backup Downloaded', 'Full JSON database export created.');
  };

  const handleImportBackup = () => {
    if (!importJsonText.trim()) return;
    const ok = StorageService.importDataJson(importJsonText);
    if (ok) {
      showToast('success', 'Backup Restored', 'Database state replaced from JSON backup.');
      setShowImportBox(false);
      setImportJsonText('');
      onClose();
    } else {
      showToast('error', 'Import Failed', 'Invalid LifeLink JSON backup format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-slate-200 text-slate-700 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">System Parameters & Data Control</h2>
              <p className="text-xs text-slate-500">Configure matching cooldown rules and manage demonstration storage</p>
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
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Rule Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Clinical Matching Rules</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Whole Blood Recovery Cooldown (Days)
                </label>
                <input
                  type="number"
                  min="28"
                  max="180"
                  value={cooldownDays}
                  onChange={(e) => setCooldownDays(Number(e.target.value))}
                  className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
                <p className="text-[11px] text-slate-500 mt-0.5">
                  American Red Cross standard is 56 days between whole blood donations.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duplicate Alert Suppression Window (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={duplicateHours}
                  onChange={(e) => setDuplicateHours(Number(e.target.value))}
                  className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Prevents spamming the same donor for the same patient order.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Dispatch Channel
                </label>
                <select
                  value={defaultChannel}
                  onChange={(e) => setDefaultChannel(e.target.value as AlertChannel)}
                  className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
                >
                  <option value="SMS">SMS Message</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Helpline Contact Phone
                </label>
                <input
                  type="text"
                  value={helpline}
                  onChange={(e) => setHelpline(e.target.value)}
                  className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization / Blood Exchange Title
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Data Backup & Portability</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Entire JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImportBox(!showImportBox)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore from JSON</span>
              </button>
            </div>

            {showImportBox && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                <label className="block text-[11px] font-semibold text-slate-700">Paste backup JSON string:</label>
                <textarea
                  rows={3}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Paste { ... } here"
                  className="w-full text-xs font-mono p-2 rounded border border-slate-300"
                />
                <button
                  type="button"
                  onClick={handleImportBackup}
                  className="px-3 py-1 text-xs font-semibold bg-slate-800 text-white rounded hover:bg-slate-900"
                >
                  Confirm JSON Restore
                </button>
              </div>
            )}
          </div>

          {/* Reset Demo Data Danger Section */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider">Demo Data Reset (Confirmed)</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 text-xs text-red-950 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Re-seed Fictional Clinical Datasets</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Wipes current browser local storage and seeds the initial 14 donors, 6 sample hospital requests, and alert
                logs. Any custom additions will be replaced with standard demo records.
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded transition-colors shadow-xs"
                >
                  Reset to Initial Demo State...
                </button>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-md shadow-sm"
            >
              Save Parameters
            </button>
          </div>
        </form>
      </div>

      {/* CONFIRMED RESET MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-red-300 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-700">
              <ShieldAlert className="w-6 h-6" />
              <h4 className="text-base font-bold text-slate-900">Confirm Reset of All Local Data</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action cannot be undone. To prevent accidental data loss, please type{' '}
              <strong className="text-red-700 font-mono">RESET</strong> in the box below to confirm:
            </p>

            <input
              type="text"
              value={resetConfirmInput}
              onChange={(e) => setResetConfirmInput(e.target.value)}
              placeholder="Type RESET"
              className="w-full text-xs font-mono font-bold tracking-widest text-center uppercase p-2.5 rounded border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-600"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  setResetConfirmInput('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={resetConfirmInput.trim().toUpperCase() !== 'RESET'}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm disabled:opacity-40"
              >
                Confirm Full Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
