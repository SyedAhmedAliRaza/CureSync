'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchDrugs } from '@/services/api';
import VoiceInputButton from './VoiceInputButton';

export default function DrugSearchInput({ onSelect, placeholder = 'Search for a medication...', language = 'en', showVoice = true }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const drugs = await searchDrugs(query, 8);
        setResults(drugs);
        setShowDropdown(true);
      } catch (err) {
        console.error('Drug search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (drug) => {
    onSelect(drug);
    setQuery('');
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-16 border border-slate-300 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && (
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          )}
          {showVoice && (
            <VoiceInputButton
              language={language}
              onResult={(text) => setQuery((prev) => (prev ? prev + ' ' : '') + text)}
              className="w-8 h-8"
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {showDropdown && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {results.map((drug, index) => {
              const brandName = drug.brand_names?.[0];
              return (
                <motion.button
                  key={drug.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleSelect(drug)}
                  className="w-full text-left px-4 py-2.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border-b border-slate-100 dark:border-neutral-700 last:border-0"
                >
                  {brandName ? (
                    <>
                      <div className="text-sm font-medium text-slate-800 dark:text-neutral-100">{brandName}</div>
                      <div className="text-xs text-slate-500 dark:text-neutral-400">{drug.name} &bull; {drug.category}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-slate-800 dark:text-neutral-100">{drug.name}</div>
                      <div className="text-xs text-slate-500 dark:text-neutral-400">{drug.category}</div>
                    </>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
