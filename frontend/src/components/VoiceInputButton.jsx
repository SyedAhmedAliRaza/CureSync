'use client';

import { motion } from 'framer-motion';
import useVoiceInput from '@/hooks/useVoiceInput';

/**
 * Microphone button that captures voice input and appends text to a target field.
 *
 * Props:
 *   language  - CureSync language code (en, bal, sd, ps, pa)
 *   onResult  - callback(text) fired when speech is finalised
 *   className - optional extra Tailwind classes for sizing/colour
 */
export default function VoiceInputButton({ language = 'en', onResult, className = '' }) {
  const { isListening, startListening, stopListening, isSupported } = useVoiceInput(language);

  if (!isSupported) return null;

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((text) => {
        if (onResult) onResult(text);
      });
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.9 }}
      animate={isListening ? { scale: [1, 1.1, 1] } : {}}
      transition={isListening ? { repeat: Infinity, duration: 1 } : {}}
      title={isListening ? 'Stop listening...' : 'Voice input'}
      className={`flex-shrink-0 flex items-center justify-center rounded-lg transition-colors ${
        isListening
          ? 'bg-danger-100 dark:bg-danger-900/40 text-danger-600 dark:text-danger-400'
          : 'bg-slate-100 dark:bg-neutral-700 text-slate-500 dark:text-neutral-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400'
      } ${className}`}
    >
      {isListening ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4m-4 0h8"
          />
        </svg>
      )}
    </motion.button>
  );
}
