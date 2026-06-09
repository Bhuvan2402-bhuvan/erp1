import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 max-w-md text-center">
        <h1 className="text-6xl font-extrabold text-logo-teal mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block bg-gradient-to-r from-logo-navy to-logo-teal hover:opacity-90 text-white px-6 py-3 rounded-lg font-medium transition shadow-lg shadow-logo-teal/25"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}
