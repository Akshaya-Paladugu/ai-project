import React from 'react';
import {
  Activity,
  Users,
  Droplet,
  Send,
  History,
  BarChart3,
  FileText,
  Settings as SettingsIcon,
  PlusCircle,
  AlertOctagon,
  PhoneCall,
} from 'lucide-react';
import { BloodRequest, SystemSettings } from '../../types';

export type NavigationTab =
  | 'dashboard'
  | 'donors'
  | 'requests'
  | 'matching'
  | 'alerts'
  | 'analytics'
  | 'audit';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  requests: BloodRequest[];
  settings: SystemSettings;
  onOpenNewRequest: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  requests,
  settings,
  onOpenNewRequest,
  onOpenSettings,
}) => {
  // Check critical pending requests for emergency ticker
  const criticalPending = requests.filter(
    (r) => r.urgency === 'CRITICAL' && (r.status === 'PENDING' || r.status === 'IN_PROGRESS')
  );

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badgeCount?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity className="w-4 h-4" /> },
    { id: 'donors', label: 'Donor Directory', icon: <Users className="w-4 h-4" /> },
    {
      id: 'requests',
      label: 'Blood Requests',
      icon: <Droplet className="w-4 h-4" />,
      badgeCount: criticalPending.length > 0 ? criticalPending.length : undefined,
    },
    { id: 'matching', label: 'Smart Match & Dispatch', icon: <Send className="w-4 h-4" /> },
    { id: 'alerts', label: 'Alert History', icon: <History className="w-4 h-4" /> },
    { id: 'analytics', label: 'Reports & Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'audit', label: 'Activity Log', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Critical Alert Bar if active emergencies exist */}
      {criticalPending.length > 0 && (
        <div className="bg-red-700 text-white text-xs px-4 py-1.5 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold uppercase tracking-wider">
              {criticalPending.length} Critical Blood Request{criticalPending.length > 1 ? 's' : ''} Active:
            </span>
            <span className="opacity-95 truncate">
              {criticalPending.map((c) => `${c.hospitalName} (${c.bloodGroup}, ${c.unitsNeeded}u)`).join(' · ')}
            </span>
          </div>
          <button
            onClick={() => onSelectTab('matching')}
            className="ml-3 shrink-0 underline hover:text-red-100 font-semibold cursor-pointer text-xs"
          >
            Dispatch Matching &rarr;
          </button>
        </div>
      )}

      {/* Main Top Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Clinical Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm group-hover:bg-red-700 transition-colors">
                <Droplet className="w-5 h-5 fill-white" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-slate-900">LifeLink</span>
                  <span className="text-xs font-semibold text-red-600 uppercase tracking-widest">Medical</span>
                </div>
                <div className="text-[11px] text-slate-500 font-normal leading-none hidden sm:block">
                  Regional Blood Donor Directory & Smart Alert Network
                </div>
              </div>
            </button>
          </div>

          {/* Quick Actions & Helpline & Settings */}
          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-md border border-slate-200/80">
              <PhoneCall className="w-3.5 h-3.5 text-red-600" />
              <span className="font-medium text-slate-700">Helpline:</span>
              <span className="font-mono text-slate-900">{settings.helplinePhone}</span>
            </div>

            <button
              onClick={onOpenNewRequest}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md text-white bg-red-600 hover:bg-red-700 active:bg-red-800 transition-colors shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Request</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
              title="System Settings & Demo Data"
              aria-label="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto border-t border-slate-100 py-1.5 -mb-px scrollbar-none" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-red-50 text-red-700 border border-red-200/70 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badgeCount !== undefined && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-red-600 text-white rounded text-[10px] font-bold">
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
