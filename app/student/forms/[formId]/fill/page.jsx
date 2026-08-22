'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import FormFillingInterface from '@/components/forms/FormFillingInterface';

export default function FillFormPage() {
  const { formId } = useParams();
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [existingResponse, setExistingResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/forms/${formId}`).then(r => r.json()),
      fetch(`/api/forms/${formId}/responses`).then(r => r.json()),
    ]).then(([formData, respData]) => {
      if (!formData.form) { setError('Form not found'); return; }
      if (formData.form.status !== 'PUBLISHED') { setError('This form is not accepting submissions right now.'); return; }
      setForm(formData.form);
      if (respData.response) setExistingResponse(respData.response);
    }).catch(() => setError('Failed to load form')).finally(() => setLoading(false));
  }, [formId]);

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-36 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
      {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      <p className="text-lg font-semibold text-red-500">{error}</p>
      <button onClick={() => router.back()} className="mt-4 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
        Go Back
      </button>
    </div>
  );

  if (!form) return null;

  // Check if already submitted (not a draft)
  if (existingResponse && existingResponse.status !== 'DRAFT' && !form.allowMultipleSubmissions) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-4">
          <p className="text-lg font-bold text-slate-900 dark:text-white">Already Submitted</p>
          <p className="text-sm text-slate-500">You have already submitted this form.</p>
          <button onClick={() => router.push(`/student/forms/${formId}/submission`)}
            className="px-5 py-2.5 bg-logo-teal text-white rounded-xl text-sm font-semibold hover:opacity-90 transition">
            View My Submission
          </button>
        </div>
      </div>
    );
  }

  return (
    <FormFillingInterface
      form={form}
      existingResponse={existingResponse?.status === 'DRAFT' ? existingResponse : null}
      onSuccess={() => router.push('/student/forms/my-submissions')}
    />
  );
}
