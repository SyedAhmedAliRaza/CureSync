'use client';

import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 transition-colors">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-200 dark:border-neutral-800 py-6 text-center text-sm text-slate-500 dark:text-neutral-400 transition-colors">
        <p>CureSync MVP - AI Medicine Interaction &amp; Personalized Medication Assistant</p>
        <p className="mt-1 text-xs text-slate-400 dark:text-neutral-500">
          Disclaimer: This tool provides informational guidance only. Always consult a healthcare professional.
        </p>
      </footer>
    </div>
  );
}
