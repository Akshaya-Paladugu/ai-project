import React, { useState, useEffect, useCallback } from 'react';
import {
  Donor,
  BloodRequest,
  AlertLog,
  ActivityLogItem,
  SystemSettings,
} from './types';
import { StorageService, DEFAULT_SETTINGS } from './services/storage';
import { exportDonorsCsv } from './services/export';
import { Navbar, NavigationTab } from './components/layout/Navbar';
import { Dashboard } from './components/dashboard/Dashboard';
import { DonorDirectory } from './components/donors/DonorDirectory';
import { DonorModal } from './components/donors/DonorModal';
import { RequestList } from './components/requests/RequestList';
import { RequestModal } from './components/requests/RequestModal';
import { MatchingView } from './components/matching/MatchingView';
import { AlertHistoryView } from './components/alerts/AlertHistoryView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditLogView } from './components/audit/AuditLogView';
import { SettingsModal } from './components/settings/SettingsModal';
import { ToastProvider, useToast } from './components/common/Toast';
import { ShieldCheck, Droplet, HeartHandshake, PhoneCall } from 'lucide-react';

function AppContent() {
  const { showToast } = useToast();

  // Storage State
  const [donors, setDonors] = useState<Donor[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [activity, setActivity] = useState<ActivityLogItem[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedRequestIdForMatching, setSelectedRequestIdForMatching] = useState<string | null>(null);

  // Modals State
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [donorToEdit, setDonorToEdit] = useState<Donor | null>(null);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestToEdit, setRequestToEdit] = useState<BloodRequest | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Load from Storage
  const refreshData = useCallback(() => {
    setDonors(StorageService.getDonors());
    setRequests(StorageService.getRequests());
    setAlerts(StorageService.getAlerts());
    setActivity(StorageService.getActivity());
    setSettings(StorageService.getSettings());
  }, []);

  useEffect(() => {
    // Initial load
    StorageService.initOnFirstLaunch();
    refreshData();

    // Listen to reactive storage events
    const handleStorageChange = () => {
      refreshData();
    };

    window.addEventListener('lifelink_data_changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('lifelink_data_changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshData]);

  // Handlers for Donors
  const handleOpenAddDonor = () => {
    setDonorToEdit(null);
    setIsDonorModalOpen(true);
  };

  const handleOpenEditDonor = (donor: Donor) => {
    setDonorToEdit(donor);
    setIsDonorModalOpen(true);
  };

  const handleSaveDonor = (donor: Donor) => {
    StorageService.saveDonor(donor);
    setIsDonorModalOpen(false);
    showToast('success', 'Donor Saved', `${donor.fullName} (${donor.bloodGroup}) recorded in directory.`);
  };

  const handleDeleteDonor = (donorId: string) => {
    StorageService.deleteDonor(donorId);
    showToast('info', 'Donor Removed', 'Donor record removed from active directory.');
  };

  const handleToggleDonorStatus = (donorId: string) => {
    StorageService.toggleDonorStatus(donorId);
    showToast('info', 'Status Updated', 'Donor availability status updated.');
  };

  // Handlers for Requests
  const handleOpenAddRequest = () => {
    setRequestToEdit(null);
    setIsRequestModalOpen(true);
  };

  const handleOpenEditRequest = (req: BloodRequest) => {
    setRequestToEdit(req);
    setIsRequestModalOpen(true);
  };

  const handleSaveRequest = (req: BloodRequest) => {
    StorageService.saveRequest(req);
    setIsRequestModalOpen(false);
    showToast('success', 'Request Saved', `Hospital order for ${req.bloodGroup} at ${req.hospitalName} recorded.`);
  };

  const handleDeleteRequest = (reqId: string) => {
    StorageService.deleteRequest(reqId);
    showToast('info', 'Request Cancelled', 'Blood request removed.');
  };

  const handleUpdateRequestStatus = (reqId: string, status: BloodRequest['status'], unitsFulfilled?: number) => {
    StorageService.updateRequestStatus(reqId, status, unitsFulfilled);
    showToast('success', 'Status Updated', `Request marked as ${status}.`);
  };

  // Handler for jumping from dashboard/list into matching
  const handleSelectRequestForMatching = (req: BloodRequest) => {
    setSelectedRequestIdForMatching(req.id);
    setCurrentTab('matching');
  };

  // Handlers for Alerts
  const handleDispatchAlert = (alert: AlertLog, forceOverride: boolean = false) => {
    if (forceOverride) {
      StorageService.forceDispatchAlert(alert);
      return {
        success: true,
        duplicateSuppressed: false,
        message: `Alert dispatched with operator override to ${alert.donorName}.`,
      };
    }
    return StorageService.dispatchAlert(alert);
  };

  const handleResendAlert = (alert: AlertLog) => {
    const resendLog: AlertLog = {
      ...alert,
      id: `alt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sentAt: new Date().toISOString(),
      status: 'DELIVERED',
    };
    StorageService.forceDispatchAlert(resendLog);
  };

  // Handlers for Settings & Demo Data
  const handleSaveSettings = (newSettings: SystemSettings) => {
    StorageService.saveSettings(newSettings);
  };

  const handleResetDemoData = () => {
    StorageService.resetDemoData();
    refreshData();
  };

  const handleClearActivityLog = () => {
    StorageService.clearActivityLog();
  };

  const handleExportDonors = () => {
    exportDonorsCsv(donors);
    showToast('success', 'Donors Exported', 'CSV download initiated.');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans antialiased selection:bg-red-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        requests={requests}
        settings={settings}
        onOpenNewRequest={handleOpenAddRequest}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            donors={donors}
            requests={requests}
            alerts={alerts}
            activity={activity}
            cooldownDays={settings.cooldownPeriodDays}
            onNavigateTab={setCurrentTab}
            onSelectRequestForMatching={handleSelectRequestForMatching}
            onOpenNewDonorModal={handleOpenAddDonor}
            onOpenNewRequestModal={handleOpenAddRequest}
            onExportDonors={handleExportDonors}
          />
        )}

        {currentTab === 'donors' && (
          <DonorDirectory
            donors={donors}
            cooldownDays={settings.cooldownPeriodDays}
            onAddDonor={handleOpenAddDonor}
            onEditDonor={handleOpenEditDonor}
            onToggleStatus={handleToggleDonorStatus}
            onDeleteDonor={handleDeleteDonor}
          />
        )}

        {currentTab === 'requests' && (
          <RequestList
            requests={requests}
            onAddRequest={handleOpenAddRequest}
            onEditRequest={handleOpenEditRequest}
            onDeleteRequest={handleDeleteRequest}
            onUpdateStatus={handleUpdateRequestStatus}
            onSelectForMatching={handleSelectRequestForMatching}
          />
        )}

        {currentTab === 'matching' && (
          <MatchingView
            requests={requests}
            donors={donors}
            alerts={alerts}
            settings={settings}
            selectedRequestId={selectedRequestIdForMatching}
            onSelectRequestId={setSelectedRequestIdForMatching}
            onDispatchAlert={handleDispatchAlert}
            onUpdateRequestStatus={handleUpdateRequestStatus}
          />
        )}

        {currentTab === 'alerts' && (
          <AlertHistoryView alerts={alerts} onResendAlert={handleResendAlert} />
        )}

        {currentTab === 'analytics' && (
          <ReportsView
            donors={donors}
            requests={requests}
            alerts={alerts}
            activity={activity}
            cooldownDays={settings.cooldownPeriodDays}
          />
        )}

        {currentTab === 'audit' && (
          <AuditLogView activity={activity} onClearLog={handleClearActivityLog} />
        )}
      </main>

      {/* Clinical Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-red-600 flex items-center justify-center text-white">
              <Droplet className="w-3 h-3 fill-white" />
            </div>
            <span className="font-bold text-slate-800">LifeLink Regional Blood Exchange</span>
            <span>·</span>
            <span>Local Demonstration Prototype</span>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-500 max-w-xl">
            For demonstration purposes only with synthetic fictional data. All blood donations require licensed
            pathology crossmatching and blood bank clinical intake protocols before medical administration.
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <DonorModal
        isOpen={isDonorModalOpen}
        donorToEdit={donorToEdit}
        onClose={() => setIsDonorModalOpen(false)}
        onSave={handleSaveDonor}
      />

      <RequestModal
        isOpen={isRequestModalOpen}
        requestToEdit={requestToEdit}
        onClose={() => setIsRequestModalOpen(false)}
        onSave={handleSaveRequest}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        settings={settings}
        onClose={() => setIsSettingsModalOpen(false)}
        onSaveSettings={handleSaveSettings}
        onResetDemoData={handleResetDemoData}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
