import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { CLIPBOARD_CLEAR_TIMEOUT } from '../utils/constants';

interface CopyButtonProps {
  text: string;
  label?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text, label = 'Copy' }) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      // Clear clipboard after timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(async () => {
        try {
          await navigator.clipboard.writeText('');
        } catch (error) {
          console.error('Failed to clear clipboard:', error);
        }
      }, CLIPBOARD_CLEAR_TIMEOUT);

      // Reset copied state
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [text]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
      aria-label={label}
    >
      {copied ? (
        <>
          <Check size={16} />
          Copied
        </>
      ) : (
        <>
          <Copy size={16} />
          {label}
        </>
      )}
    </button>
  );
};
