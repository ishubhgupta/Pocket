import React from 'react';
import { CreditCard, Building2, User, StickyNote, Key } from 'lucide-react';
import { DataType } from '../types';

interface CategoryIconProps {
  type: DataType;
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ type, size = 24, className = '' }) => {
  const iconProps = {
    size,
    className: className || 'text-white',
    strokeWidth: 2.5,
  };

  const icons = {
    card: <CreditCard {...iconProps} />,
    netbanking: <Building2 {...iconProps} />,
    account: <User {...iconProps} />,
    note: <StickyNote {...iconProps} />,
    password: <Key {...iconProps} />,
  };

  return <>{icons[type]}</>;
};
