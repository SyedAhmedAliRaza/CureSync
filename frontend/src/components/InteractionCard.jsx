'use client';

import { motion } from 'framer-motion';

const severityConfig = {
  high: {
    bg: 'bg-danger-50 dark:bg-danger-950 border-danger-500',
    badge: 'bg-danger-600 text-white',
    label: 'HIGH RISK',
  },
  medium: {
    bg: 'bg-warning-50 dark:bg-warning-100 border-warning-500',
    badge: 'bg-warning-600 text-white',
    label: 'MODERATE',
  },
  low: {
    bg: 'bg-primary-50 dark:bg-primary-950 border-primary-400',
    badge: 'bg-primary-500 text-white',
    label: 'LOW',
  },
};

export default function InteractionCard({ interaction }) {
  const config = severityConfig[interaction.severity] || severityConfig.low;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.25 }}
      className={`border-l-4 rounded-lg p-4 ${config.bg}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${config.badge}`}>
              {config.label}
            </span>
            <span className="text-sm font-semibold text-slate-700 dark:text-neutral-200">
              {interaction.drug_a} + {interaction.drug_b}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-neutral-300 mt-1">{interaction.description}</p>
          {interaction.recommendation && (
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-2 italic">{interaction.recommendation}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
