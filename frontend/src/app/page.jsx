'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageTransition from '@/components/PageTransition';

const features = [
  {
    to: '/interactions',
    title: 'Drug Interaction Checker',
    description: 'Enter your medications and instantly check for harmful drug interactions with severity ratings and AI-powered analysis.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    color: 'bg-danger-50 dark:bg-danger-950 text-danger-600 dark:text-danger-500',
    border: 'hover:border-danger-200 dark:hover:border-danger-700',
  },
  {
    to: '/scan',
    title: 'Prescription Scanner',
    description: 'Upload a photo of your prescription and our AI will extract medicine names, dosages, and frequencies using OCR.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
      </svg>
    ),
    color: 'bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400',
    border: 'hover:border-primary-200 dark:hover:border-primary-700',
  },
  {
    to: '/chat',
    title: 'AI Health Assistant',
    description: 'Ask health-related questions in natural language. Get clear explanations about medications, side effects, and wellness tips.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    color: 'bg-medical-50 dark:bg-medical-950 text-medical-600 dark:text-medical-400',
    border: 'hover:border-medical-200 dark:hover:border-medical-700',
  },
  {
    to: '/schedule',
    title: 'Medication Schedule',
    description: 'Manage your medication schedule with reminders. Track what you take, when you take it, and stay on top of your health.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    color: 'bg-success-50 dark:bg-success-100 text-success-600',
    border: 'hover:border-success-200 dark:hover:border-success-600',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.3 } }),
};

export default function HomePage() {
  return (
    <ProtectedRoute>
      <Layout>
        <PageTransition>
          <div>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-neutral-100 mb-4">
                Your AI-Powered <span className="text-primary-600 dark:text-primary-400">Medication Assistant</span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-neutral-400 max-w-2xl mx-auto">
                CureSync helps you manage medications safely. Check drug interactions,
                scan prescriptions, get AI-powered health advice, and stay on schedule
                with your medications.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-warning-50 dark:bg-warning-100 border border-warning-100 rounded-lg">
                <svg className="w-4 h-4 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-warning-600 font-medium">
                  This tool provides informational guidance only. Always consult a healthcare professional for medical decisions.
                </span>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.to}
                  custom={i}
                  initial="hidden"
                  animate="show"
                  variants={cardVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <Link
                    href={feature.to}
                    className={`block p-6 bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700 shadow-sm transition-all hover:shadow-md ${feature.border}`}
                  >
                    <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-neutral-100 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-neutral-400 leading-relaxed">{feature.description}</p>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400">
                      Get started
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Stats / Info */}
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-8 px-6 py-4 bg-white dark:bg-neutral-800 rounded-xl border border-slate-200 dark:border-neutral-700">
                <div>
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">1,900+</div>
                  <div className="text-xs text-slate-500 dark:text-neutral-400">Medications in Database</div>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-neutral-600" />
                <div>
                  <div className="text-2xl font-bold text-medical-600 dark:text-medical-400">25,000+</div>
                  <div className="text-xs text-slate-500 dark:text-neutral-400">Known Interactions</div>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-neutral-600" />
                <div>
                  <div className="text-2xl font-bold text-success-600">AI</div>
                  <div className="text-xs text-slate-500 dark:text-neutral-400">Powered by Qwen Model</div>
                </div>
              </div>
            </div>
          </div>
        </PageTransition>
      </Layout>
    </ProtectedRoute>
  );
}
