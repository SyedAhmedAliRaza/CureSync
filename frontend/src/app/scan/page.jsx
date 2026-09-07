'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageTransition from '@/components/PageTransition';
import { scanPrescription, createMedication, listMedications } from '@/services/api';

const STORAGE_KEY = 'curesync_last_scan';

function parseFrequencyToTimes(frequency) {
  if (!frequency) return [];
  const f = frequency.toLowerCase();
  if (f.includes('once') || f.includes('1')) return ['08:00'];
  if (f.includes('twice') || f.includes('2')) return ['08:00', '20:00'];
  if (f.includes('thrice') || f.includes('3') || f.includes('three')) return ['08:00', '14:00', '20:00'];
  if (f.includes('4') || f.includes('four')) return ['06:00', '12:00', '18:00', '22:00'];
  return [];
}

export default function PrescriptionScannerPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addedMeds, setAddedMeds] = useState([]);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const restore = async () => {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setResult(parsed.result);
          setPreview(parsed.imagePreview);
          const savedMeds = parsed.addedMeds || [];
          try {
            const currentMeds = await listMedications(false);
            const scheduleNames = currentMeds.map((m) => m.name);
            const synced = savedMeds.filter((name) => scheduleNames.includes(name));
            setAddedMeds(synced);
          } catch {
            setAddedMeds(savedMeds);
          }
        }
      } catch {
        // Ignore parse errors
      }
    };
    restore();
  }, []);

  useEffect(() => {
    if (result) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          result,
          imagePreview: preview,
          addedMeds,
          timestamp: Date.now(),
        }));
      } catch {
        // Ignore storage errors
      }
    }
  }, [result, preview, addedMeds]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError('');
    setAddedMeds([]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith('image/')) {
      setFile(dropped);
      setPreview(URL.createObjectURL(dropped));
      setResult(null);
      setError('');
      setAddedMeds([]);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await scanPrescription(file);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to scan prescription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addToSchedule = async (med) => {
    try {
      const times = parseFrequencyToTimes(med.frequency);
      await createMedication({
        name: med.name,
        dosage: med.dosage || '',
        frequency: med.frequency || '',
        times,
      });
      setAddedMeds((prev) => [...prev, med.name]);
    } catch (err) {
      console.error('Failed to add medication:', err);
      setError(`Failed to add ${med.name} to schedule. Make sure you are logged in.`);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <PageTransition>
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">Prescription Scanner</h1>
              <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
                Upload a photo of your prescription to extract medication information using AI-powered OCR.
              </p>
            </div>

            {/* Upload area */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 p-6 shadow-sm">
              <motion.div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ borderColor: 'rgb(96 165 250)' }}
                className="border-2 border-dashed border-slate-300 dark:border-neutral-600 rounded-xl p-8 text-center cursor-pointer hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors"
              >
                {preview ? (
                  <img src={preview} alt="Prescription preview" className="max-h-64 mx-auto rounded-lg" />
                ) : (
                  <div>
                    <svg className="w-12 h-12 mx-auto text-slate-400 dark:text-neutral-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="text-sm text-slate-600 dark:text-neutral-300 font-medium">Drop your prescription image here</p>
                    <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">or click to browse (JPG, PNG, max 10MB)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </motion.div>

              {file && !result && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-slate-600 dark:text-neutral-300">{file.name}</span>
                  <button
                    onClick={handleScan}
                    disabled={loading}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-neutral-600 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Scanning...
                      </span>
                    ) : (
                      'Scan Prescription'
                    )}
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-danger-50 dark:bg-danger-950 border border-danger-100 dark:border-danger-900 rounded-lg text-sm text-danger-700 dark:text-danger-500">
                  {error}
                </div>
              )}
            </div>

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-4"
                >
                  {/* Raw text */}
                  <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 p-5 shadow-sm">
                    <h3 className="font-semibold text-slate-800 dark:text-neutral-100 mb-2">Extracted Text</h3>
                    <pre className="text-xs text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-950 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                      {result.raw_text || 'No text could be extracted from the image.'}
                    </pre>
                  </div>

                  {/* Extracted medicines */}
                  {result.medicines.length > 0 && (
                    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 p-5 shadow-sm">
                      <h3 className="font-semibold text-slate-800 dark:text-neutral-100 mb-3">Detected Medications</h3>
                      <div className="space-y-3">
                        {result.medicines.map((med, idx) => {
                          const isAdded = addedMeds.includes(med.name);
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-neutral-700/50 rounded-lg"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-slate-800 dark:text-neutral-100">{med.name}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                    med.confidence === 'high' ? 'bg-success-100 text-success-600' :
                                    med.confidence === 'medium' ? 'bg-warning-100 text-warning-600' :
                                    'bg-slate-200 dark:bg-neutral-600 text-slate-600 dark:text-neutral-300'
                                  }`}>
                                    {med.confidence} confidence
                                  </span>
                                </div>
                                <div className="flex gap-3 mt-1">
                                  {med.dosage && <span className="text-xs text-slate-500 dark:text-neutral-400">{med.dosage}</span>}
                                  {med.frequency && <span className="text-xs text-slate-500 dark:text-neutral-400">{med.frequency}</span>}
                                </div>
                              </div>
                              <button
                                onClick={() => addToSchedule(med)}
                                disabled={isAdded}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                                  isAdded
                                    ? 'bg-success-100 text-success-600 cursor-default'
                                    : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50'
                                }`}
                              >
                                {isAdded ? 'Added' : 'Add to Schedule'}
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>

                      {addedMeds.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-neutral-700">
                          <button
                            onClick={() => router.push('/schedule')}
                            className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
                          >
                            View Medication Schedule ({addedMeds.length} added)
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {result.medicines.length === 0 && result.raw_text && (
                    <div className="p-4 bg-warning-50 dark:bg-warning-100 border border-warning-100 rounded-xl text-sm text-warning-600">
                      Could not detect any medications from the extracted text. You can manually add them to your schedule.
                      <button
                        onClick={() => router.push('/schedule')}
                        className="ml-2 underline font-medium"
                      >
                        Go to Schedule
                      </button>
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
