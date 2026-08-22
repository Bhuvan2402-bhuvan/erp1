'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import ResponseDetailView from '@/components/forms/ResponseDetailView';

export default function ResponseDetailPage() {
  const { formId, responseId } = useParams();
  const [form, setForm] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/forms/${formId}`).then(r => r.json()),
      fetch(`/api/forms/${formId}/responses/${responseId}`).then(r => r.json()),
    ]).then(([formData, respData]) => {
      if (formData.form) setForm(formData.form);
      if (respData.response) setResponse(respData.response);
    }).catch(() => toast.error('Failed to load response')).finally(() => setLoading(false));
  }, [formId, responseId]);

  if (loading) return (
    <div className="max-w-3xl mx-auto animate-pulse space-y-4">
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
      <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
    </div>
  );

  if (!form || !response) return (
    <div className="text-center py-20 text-slate-400">Response not found</div>
  );

  return (
    <ResponseDetailView
      response={response}
      form={{ ...form, fields: form.fields || [] }}
      canReview={true}
      backHref={`/faculty/forms/${formId}/responses`}
    />
  );
}
