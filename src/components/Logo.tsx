import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'full' | 'icon';
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ size = 40, className = '', variant = 'icon', onClick }) => {
  const handleClick = onClick ? { onClick, style: { cursor: 'pointer' } } : {};
  
  if (variant === 'icon') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...handleClick}
      >
        {/* Outer Shield/Pocket Shape */}
        <path
          d="M50 10 L85 25 L85 50 C85 70 70 85 50 90 C30 85 15 70 15 50 L15 25 Z"
          fill="url(#gradient1)"
          stroke="url(#gradient2)"
          strokeWidth="2"
        />
        
        {/* Inner Pocket Opening */}
        <path
          d="M35 35 L50 30 L65 35 L65 55 C65 62 58 68 50 70 C42 68 35 62 35 55 Z"
          fill="url(#gradient3)"
          opacity="0.9"
        />
        
        {/* Lock Symbol */}
        <circle cx="50" cy="52" r="6" fill="white" opacity="0.95" />
        <rect x="48" y="52" width="4" height="8" rx="1" fill="white" opacity="0.95" />
        <path
          d="M45 52 L45 48 C45 45.2 47.2 43 50 43 C52.8 43 55 45.2 55 48 L55 52"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.95"
        />
        
        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="gradient3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`} {...handleClick}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M50 10 L85 25 L85 50 C85 70 70 85 50 90 C30 85 15 70 15 50 L15 25 Z"
          fill="url(#gradient1)"
          stroke="url(#gradient2)"
          strokeWidth="2"
        />
        <path
          d="M35 35 L50 30 L65 35 L65 55 C65 62 58 68 50 70 C42 68 35 62 35 55 Z"
          fill="url(#gradient3)"
          opacity="0.9"
        />
        <circle cx="50" cy="52" r="6" fill="white" opacity="0.95" />
        <rect x="48" y="52" width="4" height="8" rx="1" fill="white" opacity="0.95" />
        <path
          d="M45 52 L45 48 C45 45.2 47.2 43 50 43 C52.8 43 55 45.2 55 48 L55 52"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.95"
        />
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="gradient3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent font-heading">
        Pocket
      </span>
    </div>
  );
};
