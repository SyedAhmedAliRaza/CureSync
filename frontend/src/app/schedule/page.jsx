'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageTransition from '@/components/PageTransition';
import DrugSearchInput from '@/components/DrugSearchInput';
import MedicationRow from '@/components/MedicationRow';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  listMedications,
  createMedication,
  deleteMedication,
  deactivateMedication,
} from '@/services/api';

export default function MedicationSchedulePage() {
  const { language } = useLanguage();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    times: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const fetchMedications = async () => {
    try {
      const data = await listMedications(false);
      setMedications(data);
    } catch (err) {
      console.error('Failed to load medications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const handleDrugSelect = (drug) => {
    setFormData((prev) => ({
      ...prev,
      name: drug.name,
      dosage: drug.common_dosages?.[0] || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Medication name is required.');
      return;
    }
    try {
      await createMedication({
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        times: formData.times
          ? formData.times.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        notes: formData.notes,
      });
      setFormData({ name: '', dosage: '', frequency: '', times: '', notes: '' });
      setShowForm(false);
      setError('');
      fetchMedications();
    } catch (err) {
      setError('Failed to add medication. Please try again.');
    }
  };

  const handleDelete = async (medId) => {
    try {
      await deleteMedication(medId);
      fetchMedications();
    } catch (err) {
      console.error('Failed to delete medication:', err);
    }
  };

  const handleDeactivate = async (medId) => {
    try {
      await deactivateMedication(medId);
      fetchMedications();
    } catch (err) {
      console.error('Failed to deactivate medication:', err);
    }
  };

  const activeMeds = medications.filter((m) => m.active);
  const inactiveMeds = medications.filter((m) => !m.active);

  return (
    <ProtectedRoute>
      <Layout>
        <PageTransition>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">Medication Schedule</h1>
                <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
                  Manage your medications and set reminders.
                </p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                {showForm ? 'Cancel' : '+ Add Medication'}
              </button>
            </div>

            {/* Add medication form */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 p-6 shadow-sm">
                    <h3 className="font-semibold text-slate-800 dark:text-neutral-100 mb-4">Add New Medication</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">
                          Medication Name *
                        </label>
                        <DrugSearchInput
                          onSelect={handleDrugSelect}
                          language={language}
                          showVoice={false}
                          placeholder="Search or type medication name..."
                        />
                        {formData.name && (
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 mt-2"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Dosage</label>
                          <input
                            type="text"
                            value={formData.dosage}
                            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                            placeholder="e.g. 500mg"
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Frequency</label>
                          <input
                            type="text"
                            value={formData.frequency}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                            placeholder="e.g. Twice daily"
                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">
                          Reminder Times <span className="text-slate-400 dark:text-neutral-500">(comma-separated)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.times}
                          onChange={(e) => setFormData({ ...formData, times: e.target.value })}
                          placeholder="e.g. 08:00, 14:00, 20:00"
                          className="w-full px-4 py-2.5 border border-slate-300 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Notes</label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="e.g. Take with food"
                          rows={2}
                          className="w-full px-4 py-2.5 border border-slate-300 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        />
                      </div>

                      {error && (
                        <div className="p-3 bg-danger-50 dark:bg-danger-950 border border-danger-100 dark:border-danger-900 rounded-lg text-sm text-danger-700 dark:text-danger-500">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors text-sm"
                      >
                        Add Medication
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active medications */}
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-500 dark:text-neutral-400 mt-3">Loading medications...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {activeMeds.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-neutral-300 uppercase tracking-wide mb-3">
                      Active Medications ({activeMeds.length})
                    </h3>
                    <AnimatePresence>
                      <div className="space-y-2">
                        {activeMeds.map((med) => (
                          <MedicationRow
                            key={med.id}
                            medication={med}
                            onDelete={handleDelete}
                            onDeactivate={handleDeactivate}
                          />
                        ))}
                      </div>
                    </AnimatePresence>
                  </div>
                )}

                {inactiveMeds.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wide mb-3">
                      Inactive ({inactiveMeds.length})
                    </h3>
                    <AnimatePresence>
                      <div className="space-y-2">
                        {inactiveMeds.map((med) => (
                          <MedicationRow
                            key={med.id}
                            medication={med}
                            onDelete={handleDelete}
                            onDeactivate={handleDeactivate}
                          />
                        ))}
                      </div>
                    </AnimatePresence>
                  </div>
                )}

                {medications.length === 0 && (
                  <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700">
                    <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-neutral-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                    <h3 className="text-lg font-medium text-slate-600 dark:text-neutral-300 mb-1">No medications yet</h3>
                    <p className="text-sm text-slate-400 dark:text-neutral-500">
                      Add your first medication or scan a prescription to get started.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </PageTransition>
      </Layout>
    </ProtectedRoute>
  );
}
