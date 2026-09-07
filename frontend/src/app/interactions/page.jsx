'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageTransition from '@/components/PageTransition';
import DrugSearchInput from '@/components/DrugSearchInput';
import InteractionCard from '@/components/InteractionCard';
import { checkInteractions } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';

export default function InteractionCheckerPage() {
  const { language } = useLanguage();
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDrugSelect = (drug) => {
    if (selectedDrugs.some((d) => d.name === drug.name)) return;
    setSelectedDrugs([...selectedDrugs, drug]);
    setReport(null);
    setError('');
  };

  const removeDrug = (name) => {
    setSelectedDrugs(selectedDrugs.filter((d) => d.name !== name));
    setReport(null);
  };

  const handleCheck = async () => {
    if (selectedDrugs.length < 2) {
      setError('Please add at least 2 medications to check interactions.');
      return;
    }
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const result = await checkInteractions(selectedDrugs.map((d) => d.name), language);
      setReport(result);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to check interactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <PageTransition>
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">Drug Interaction Checker</h1>
              <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
                Add your medications below and check for potential drug interactions.
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 p-6 shadow-sm">
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-2">
                Search and add medications
              </label>
              <DrugSearchInput onSelect={handleDrugSelect} language={language} showVoice={false} placeholder="Type a medication name..." />

              {/* Selected drug chips */}
              {selectedDrugs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <AnimatePresence>
                    {selectedDrugs.map((drug) => (
                      <motion.span
                        key={drug.name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium"
                      >
                        {drug.brand_names?.[0] || drug.name}
                        <button
                          onClick={() => removeDrug(drug.name)}
                          className="w-4 h-4 rounded-full bg-primary-200 dark:bg-primary-800 hover:bg-primary-300 dark:hover:bg-primary-700 flex items-center justify-center transition-colors"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              <button
                onClick={handleCheck}
                disabled={selectedDrugs.length < 2 || loading}
                className="mt-6 w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing interactions...
                  </span>
                ) : (
                  'Check Interactions'
                )}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-danger-50 dark:bg-danger-950 border border-danger-100 dark:border-danger-900 rounded-lg text-sm text-danger-700 dark:text-danger-500">
                  {error}
                </div>
              )}
            </div>

            {/* Results */}
            <AnimatePresence>
              {report && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-4"
                >
                  {/* Emergency alert */}
                  {report.emergency_alert && (
                    <motion.div
                      animate={{ scale: [1, 1.01, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="p-4 bg-danger-600 text-white rounded-xl shadow-lg"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <span className="font-bold text-lg">EMERGENCY ALERT</span>
                      </div>
                      <p className="text-sm">{report.emergency_message}</p>
                    </motion.div>
                  )}

                  {/* Summary */}
                  <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 p-5 shadow-sm">
                    <h3 className="font-semibold text-slate-800 dark:text-neutral-100 mb-2">Summary</h3>
                    <p className="text-sm text-slate-600 dark:text-neutral-300">{report.summary}</p>
                  </div>

                  {/* Interactions list */}
                  {report.interactions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-slate-800 dark:text-neutral-100">Interactions Found</h3>
                      {report.interactions.map((ix, idx) => (
                        <InteractionCard key={idx} interaction={ix} />
                      ))}
                    </div>
                  )}

                  {/* AI Analysis */}
                  {report.ai_analysis && (
                    <div className="bg-medical-50 dark:bg-medical-950 border border-medical-100 dark:border-medical-900 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-medical-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold">AI</span>
                        </div>
                        <h3 className="font-semibold text-medical-800 dark:text-medical-300">AI Analysis</h3>
                      </div>
                      <div className="markdown-body text-sm text-medical-700 dark:text-medical-400 leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.ai_analysis}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </PageTransition>
      </Layout>
    </ProtectedRoute>
  );
}
