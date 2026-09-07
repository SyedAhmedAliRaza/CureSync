'use client';

import { motion } from 'framer-motion';

export default function MedicationRow({ medication, onDelete, onDeactivate }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
        medication.active
          ? 'bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700'
          : 'bg-slate-50 dark:bg-neutral-800/50 border-slate-100 dark:border-neutral-700/50 opacity-60'
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className={`font-medium text-sm ${
            medication.active
              ? 'text-slate-800 dark:text-neutral-100'
              : 'text-slate-500 dark:text-neutral-400 line-through'
          }`}>
            {medication.name}
          </h4>
          {medication.dosage && (
            <span className="text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded">
              {medication.dosage}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          {medication.frequency && (
            <span className="text-xs text-slate-500 dark:text-neutral-400">{medication.frequency}</span>
          )}
          {medication.times?.length > 0 && (
            <span className="text-xs text-slate-400 dark:text-neutral-500">
              {medication.times.join(', ')}
            </span>
          )}
        </div>
        {medication.notes && (
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1 italic">{medication.notes}</p>
        )}
      </div>
      {medication.active && (
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onDeactivate(medication.id)}
            className="text-xs px-3 py-1.5 text-warning-600 dark:text-warning-500 hover:bg-warning-50 dark:hover:bg-warning-950 rounded-lg transition-colors font-medium"
          >
            Stop
          </button>
          <button
            onClick={() => onDelete(medication.id)}
            className="text-xs px-3 py-1.5 text-danger-600 dark:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950 rounded-lg transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      )}
    </motion.div>
  );
}
