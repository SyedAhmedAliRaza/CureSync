'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/interactions', label: 'Interaction Checker' },
  { to: '/scan', label: 'Prescription Scanner' },
  { to: '/chat', label: 'Health Assistant' },
  { to: '/schedule', label: 'Medication Schedule' },
];

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const fadeSlideIn = {
  hidden: { opacity: 0, y: -4 },
  show: { opacity: 1, y: 0 },
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { language, setLanguage, languages } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const userMenuRef = useRef(null);
  const langMenuRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) setLangMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <nav className="bg-white dark:bg-neutral-800 border-b border-slate-200 dark:border-neutral-700 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/CureSync_Icon.png" alt="CureSync" className="w-9 h-9 rounded-lg" />
            <span className="text-xl font-bold text-slate-800 dark:text-neutral-100">
              Cure<span className="text-primary-600 dark:text-primary-400">Sync</span>
            </span>
          </Link>

          {!isAuthPage && user && (
            <>
              {/* Desktop nav */}
              <motion.div
                className="hidden md:flex items-center gap-1"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {navLinks.map((link) => {
                  const isActive = pathname === link.to;
                  return (
                    <motion.div key={link.to} variants={fadeSlideIn}>
                      <Link
                        href={link.to}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-700 hover:text-slate-900 dark:hover:text-neutral-100'
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Right side: theme toggle + language + user */}
              <div className="hidden md:flex items-center gap-2">
                {/* Theme toggle */}
                {mounted && (
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-lg text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {theme === 'dark' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                      </svg>
                    )}
                  </button>
                )}

                {/* Language selector */}
                <div className="relative" ref={langMenuRef}>
                  <button
                    onClick={() => setLangMenuOpen(!langMenuOpen)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                    <span className="text-xs font-medium">
                      {languages.find((l) => l.code === language)?.name || 'English'}
                    </span>
                  </button>
                  <AnimatePresence>
                    {langMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-1 w-40 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-600 rounded-lg shadow-lg py-1 z-50"
                      >
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => { setLanguage(lang.code); setLangMenuOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                              language === lang.code
                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                                : 'text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-700'
                            }`}
                          >
                            {lang.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center text-xs font-bold">
                      {(user.full_name || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-700 dark:text-neutral-200 max-w-[120px] truncate">
                      {user.full_name || user.email}
                    </span>
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-1 w-48 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-600 rounded-lg shadow-lg py-1 z-50"
                      >
                        <div className="px-3 py-2 border-b border-slate-100 dark:border-neutral-700">
                          <p className="text-xs text-slate-500 dark:text-neutral-400">Signed in as</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-neutral-200 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-sm text-danger-600 dark:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950 transition-colors"
                        >
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          )}

          {/* Mobile hamburger */}
          {!isAuthPage && user && (
            <button
              className="md:hidden flex items-center px-2 text-slate-600 dark:text-neutral-300"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && !isAuthPage && user && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-slate-100 dark:border-neutral-700"
            >
              <div className="pt-2 pb-3">
                {navLinks.map((link) => {
                  const isActive = pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      href={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                {/* Mobile language selector */}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-neutral-700">
                  <p className="px-3 py-1 text-xs text-slate-400 dark:text-neutral-500 uppercase">Language</p>
                  <div className="flex flex-wrap gap-1 px-3">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); }}
                        className={`text-xs px-2 py-1 rounded ${
                          language === lang.code
                            ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium'
                            : 'bg-slate-100 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300'
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Mobile theme toggle */}
                {mounted && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-neutral-700 px-3">
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-300 py-1"
                    >
                      {theme === 'dark' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                      )}
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                  </div>
                )}
                {/* Mobile logout */}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-neutral-700">
                  <button
                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                    className="block w-full text-left px-3 py-2 text-sm text-danger-600 dark:text-danger-500 font-medium"
                  >
                    Sign Out ({user.email})
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
