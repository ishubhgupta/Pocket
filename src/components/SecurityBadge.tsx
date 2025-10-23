import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface SecurityBadgeProps {
  isPrivate: boolean;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({ isPrivate }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
        isPrivate
          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
          : 'bg-green-500/20 text-green-400 border border-green-500/30'
      }`}
    >
      {isPrivate ? <Lock size={12} /> : <Unlock size={12} />}
      {isPrivate ? 'Private' : 'Public'}
    </span>
  );
};
