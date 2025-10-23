import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface MaskedFieldProps {
  label: string;
  value: string;
  canCopy?: boolean;
}

export const MaskedField: React.FC<MaskedFieldProps> = ({ label, value, canCopy = true }) => {
  const [visible, setVisible] = useState(false);

  const handleLongPress = () => {
    if (canCopy && value) {
      navigator.clipboard.writeText(value);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <div className="relative flex items-center gap-2">
        <input
          type={visible ? 'text' : 'password'}
          value={value || ''}
          readOnly
          onTouchStart={handleLongPress}
          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={() => setVisible(!visible)}
          className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
          aria-label={visible ? 'Hide' : 'Show'}
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
};
