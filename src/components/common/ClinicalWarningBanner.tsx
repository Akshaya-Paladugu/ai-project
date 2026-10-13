import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface ClinicalWarningBannerProps {
  compact?: boolean;
}

export const ClinicalWarningBanner: React.FC<ClinicalWarningBannerProps> = ({ compact = false }) => {
  return (
    <div
      role="alert"
      className={`border border-amber-200 bg-amber-50/80 text-amber-900 rounded-lg p-3 ${
        compact ? 'text-xs' : 'text-sm'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className={`text-amber-700 shrink-0 ${compact ? 'w-4 h-4 mt-0.5' : 'w-5 h-5 mt-0.5'}`} />
        <div className="flex-1 leading-relaxed">
          <span className="font-semibold text-amber-950">Clinical Verification Required:</span>{' '}
          LifeLink matching utilizes theoretical ABO and Rh(D) compatibility rules. Hospital transfusion medicine
          specialists, attending physicians, and blood bank pathologists must perform standard pre-transfusion testing,
          crossmatching, and clinical donor screening prior to collection or transfusion.
        </div>
      </div>
    </div>
  );
};
