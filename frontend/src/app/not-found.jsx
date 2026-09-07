import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 px-4">
      <div className="text-center">
        <img src="/CureSync_Icon.png" alt="CureSync" className="w-16 h-16 rounded-xl mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-slate-900 dark:text-neutral-100 mb-2">404</h1>
        <p className="text-lg text-slate-500 dark:text-neutral-400 mb-6">Page not found</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors text-sm"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
