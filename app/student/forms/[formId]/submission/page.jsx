'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ResponseDetailView from '@/components/forms/ResponseDetailView';

export default function MySubmissionViewPage() {
  const { formId } = useParams();
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/forms/${formId}`).then(r => r.json()),
      fetch(`/api/forms/${formId}/responses`).then(r => r.json()),
    ]).then(([formData, respData]) => {
      if (formData.form) setForm(formData.form);
      if (respData.response) setResponse(respData.response);
    }).catch(() => toast.error('Failed to load submission')).finally(() => setLoading(false));
  }, [formId]);

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
      <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
      <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
    </div>
  );

  if (!response) return (
    <div className="max-w-3xl mx-auto py-20 text-center">
      <p className="text-slate-500">No submission found for this form.</p>
      <button onClick={() => router.push('/student/forms/available')}
        className="mt-4 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
        Browse Forms
      </button>
    </div>
  );

  return (
    <ResponseDetailView
      response={response}
      form={{ ...form, fields: form?.fields || [] }}
      canReview={false}
      backHref="/student/forms/my-submissions"
    />
  );
}
