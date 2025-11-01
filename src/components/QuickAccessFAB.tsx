import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import { DataType } from '../types';

export const QuickAccessFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<DataType | null>(null);
  const navigate = useNavigate();

  const quickActions = [
    { 
      type: 'card' as DataType, 
      label: 'Card', 
      bgClass: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600',
      delay: '0.05s'
    },
    { 
      type: 'netbanking' as DataType, 
      label: 'Net Banking', 
      bgClass: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600',
      delay: '0.1s'
    },
    { 
      type: 'password' as DataType, 
      label: 'Password', 
      bgClass: 'bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600',
      delay: '0.15s'
    },
    { 
      type: 'note' as DataType, 
      label: 'Note', 
      bgClass: 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500',
      delay: '0.2s'
    },
  ];

  const handleAction = (type: DataType) => {
    setIsOpen(false);
    setIsPinned(false);
    navigate(`/add/${type}`);
  };

  const handleMainButtonClick = () => {
    setIsPinned(!isPinned);
    setIsOpen(!isOpen);
  };

  const handleMainButtonHover = (hover: boolean) => {
    if (!isPinned) {
      setIsOpen(hover);
    }
  };

  const shouldShowActions = isOpen || isPinned;

  return (
    <>
      {/* Backdrop - shows on hover or when pinned */}
      {shouldShowActions && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 animate-fade-in"
          onClick={() => {
            setIsOpen(false);
            setIsPinned(false);
          }}
        />
      )}

      {/* FAB Container */}
      <div 
        className="fixed bottom-6 right-6 z-50"
        onMouseEnter={() => handleMainButtonHover(true)}
        onMouseLeave={() => handleMainButtonHover(false)}
      >
        <div className="flex items-center gap-3">
          {/* Quick Action Buttons */}
          {shouldShowActions && (
            <>
              {quickActions.map((action, index) => (
                <div
                  key={action.type}
                  className="relative animate-slide-left"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onMouseEnter={() => setHoveredItem(action.type)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Label - shows on hover above the button */}
                  {hoveredItem === action.type && (
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 animate-fade-in">
                      <span className="px-4 py-2 bg-white text-neutral-800 font-semibold rounded-xl shadow-lg text-sm whitespace-nowrap">
                        Add {action.label}
                      </span>
                    </div>
                  )}
                  
                  {/* Icon Button */}
                  <button
                    onClick={() => handleAction(action.type)}
                    className={`w-14 h-14 ${action.bgClass} rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer`}
                  >
                    <CategoryIcon type={action.type} size={24} />
                  </button>
                </div>
              ))}
            </>
          )}

          {/* Main FAB Button */}
          <button
            onClick={handleMainButtonClick}
            className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
              isPinned
                ? 'bg-gradient-to-br from-red-500 to-red-600 rotate-45 scale-110' 
                : 'bg-gradient-to-br from-primary-500 to-primary-600 hover:scale-110 active:scale-95'
            }`}
            aria-label={isPinned ? 'Close menu' : 'Quick add'}
          >
            <Plus size={28} className="text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes slide-left {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-left {
          animation: slide-left 0.3s ease-out forwards;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};
