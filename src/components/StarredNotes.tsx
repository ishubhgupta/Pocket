import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Lock } from 'lucide-react';
import { NoteData } from '../types';

interface StarredNotesProps {
  notes: NoteData[];
}

export const StarredNotes: React.FC<StarredNotesProps> = ({ notes }) => {
  const navigate = useNavigate();

  if (notes.length === 0) {
    return null;
  }

  // Different colors for notes
  const noteColors = [
    'bg-gradient-to-br from-yellow-100 to-yellow-200',
    'bg-gradient-to-br from-pink-100 to-pink-200',
    'bg-gradient-to-br from-blue-100 to-blue-200',
    'bg-gradient-to-br from-green-100 to-green-200',
    'bg-gradient-to-br from-purple-100 to-purple-200',
    'bg-gradient-to-br from-orange-100 to-orange-200',
  ];

  // Different rotation angles for variety
  const rotations = ['rotate-1', '-rotate-1', 'rotate-2', '-rotate-2', 'rotate-0'];

  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Star size={24} className="text-amber-500 fill-amber-500" />
        <h2 className="text-2xl font-bold text-neutral-900 font-heading">Starred Notes</h2>
      </div>

      {/* Desktop: Masonry/Board Layout */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-auto">
        {notes.map((note, index) => {
          const colorClass = noteColors[index % noteColors.length];
          const rotationClass = rotations[index % rotations.length];
          const isLarge = index % 5 === 0; // Every 5th note is larger

          return (
            <button
              key={note.id}
              onClick={() => navigate(`/record/${note.id}`)}
              className={`group relative p-4 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 text-left ${colorClass} ${rotationClass} hover:rotate-0 hover:scale-105 active:scale-95 ${
                isLarge ? 'md:col-span-2 md:row-span-2' : ''
              }`}
              style={{
                minHeight: isLarge ? '200px' : '120px',
                animationDelay: `${index * 50}ms`,
              }}
            >
              {/* Pin effect at top */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-red-400 shadow-md opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-600" />

              {/* Content */}
              <div className="relative">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-neutral-900 text-lg font-heading line-clamp-2 flex-1">
                    {note.title}
                  </h3>
                  <div className="flex gap-1 flex-shrink-0">
                    {note.isPrivate && <Lock size={14} className="text-neutral-700" />}
                    <Star size={16} className="text-amber-500 fill-amber-500" />
                  </div>
                </div>
                <p className={`text-neutral-700 text-sm leading-relaxed ${isLarge ? 'line-clamp-6' : 'line-clamp-3'}`}>
                  {note.content}
                </p>
                
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {note.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-neutral-900/10 text-neutral-800 rounded font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-xs text-neutral-600 font-medium">+{note.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Tape effect */}
              <div className="absolute -top-3 right-8 w-16 h-6 bg-white/40 rotate-12 opacity-50" />
            </button>
          );
        })}
      </div>

      {/* Mobile: Card Layout */}
      <div className="md:hidden space-y-3">
        {notes.map((note, index) => {
          const colorClass = noteColors[index % noteColors.length];

          return (
            <button
              key={note.id}
              onClick={() => navigate(`/record/${note.id}`)}
              className={`group relative w-full p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-left ${colorClass} active:scale-95`}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {/* Pin effect at top */}
              <div className="absolute -top-2 left-6 w-5 h-5 rounded-full bg-red-400 shadow-md" />
              <div className="absolute -top-1 left-7 w-2 h-2 rounded-full bg-red-600" />

              {/* Content */}
              <div className="relative">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-neutral-900 text-base font-heading line-clamp-1 flex-1">
                    {note.title}
                  </h3>
                  <div className="flex gap-1 flex-shrink-0">
                    {note.isPrivate && <Lock size={14} className="text-neutral-700" />}
                    <Star size={16} className="text-amber-500 fill-amber-500" />
                  </div>
                </div>
                <p className="text-neutral-700 text-sm leading-relaxed line-clamp-2">
                  {note.content}
                </p>
                
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-neutral-900/10 text-neutral-800 rounded font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-xs text-neutral-600 font-medium">+{note.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
