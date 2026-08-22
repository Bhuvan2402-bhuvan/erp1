'use client';
import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import FormAnalyticsDashboard from '@/components/forms/FormAnalyticsDashboard';

export default function FormAnalyticsPage() {
  const { formId } = useParams();
  const pathname = usePathname();
  const baseHref = pathname.startsWith('/admin/forms')
    ? '/admin/forms'
    : pathname.startsWith('/student/forms')
    ? '/student/forms'
    : '/faculty/forms';

  const [form, setForm] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/forms/${formId}`).then(r => r.json()),
      fetch(`/api/forms/${formId}/analytics`).then(r => r.json()),
    ]).then(([formData, analyticsData]) => {
      if (formData.form) setForm(formData.form);
      if (analyticsData.analytics) setAnalytics(analyticsData.analytics);
    }).catch(() => toast.error('Failed to load analytics')).finally(() => setLoading(false));
  }, [formId]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`${baseHref}/${formId}/responses`} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          {form && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{form.title}</p>}
        </div>
      </div>

      <FormAnalyticsDashboard analytics={analytics} loading={loading} />
    </div>
  );
}
