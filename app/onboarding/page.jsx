'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';
import { useSupabase } from '@/lib/supabase/client-provider';

export default function Onboarding() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useSupabase();
  const [role, setRole] = useState('STUDENT');
  
  const [formData, setFormData] = useState({
    name: '',
    departmentId: '', 
    rollNo: '', year: '', section: '', semester: '1',
    employeeId: '', designation: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }

    if (user) {
      const googleName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.name || '';
      if (googleName) {
        setFormData(prev => prev.name ? prev : { ...prev, name: googleName });
      }
    }

    fetch('/api/departments')
      .then(res => res.json())
      .then(data => setDepartments(data.departments || []))
      .catch(err => console.error(err));
  }, [authLoading, user, router]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { ...formData, role };
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else if (data.approvalStatus === 'PENDING') {
          window.location.href = '/pending';
        } else if (role === 'FACULTY') {
          window.location.href = '/faculty/branch';
        } else {
          window.location.href = '/student/events';
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex justify-center items-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4 flex gap-4">
        <button onClick={handleLogout} className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Logout</button>
        <ThemeToggle />
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Image src="/vvit-logo.jpg" alt="VVIT Logo" width={90} height={45} className="h-10 w-auto object-contain rounded" />
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
            <Image src="/nss-logo.png" alt="NSS Logo" width={110} height={45} className="h-10 w-auto object-contain" />
          </div>
          <span className="text-xl font-extrabold text-slate-800 dark:text-white tracking-wide">
            VVITU NSS ERP
          </span>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 dark:text-white">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Please provide some additional details to finish setting up your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100 dark:border-slate-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
            
            <div className="flex space-x-4 mb-4">
              <button type="button" onClick={() => setRole('STUDENT')} className={`flex-1 py-2 text-sm font-medium rounded-md ${role === 'STUDENT' ? 'bg-gradient-to-r from-logo-navy to-logo-teal text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>Volunteer (Student)</button>
              <button type="button" onClick={() => setRole('FACULTY')} className={`flex-1 py-2 text-sm font-medium rounded-md ${role === 'FACULTY' ? 'bg-gradient-to-r from-logo-navy to-logo-teal text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>Faculty / Coordinator</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="mt-1">
                  <input name="name" type="text" value={formData.name || ''} required onChange={handleChange} placeholder="Enter your full name" className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-logo-teal focus:border-logo-teal sm:text-sm dark:bg-slate-700 dark:text-white" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Branch / Department</label>
                <div className="mt-1">
                  <select name="departmentId" required onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-logo-teal focus:border-logo-teal sm:text-sm dark:bg-slate-700 dark:text-white">
                    <option value="">Select Branch</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {role === 'STUDENT' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Roll No</label>
                    <div className="mt-1">
                      <input name="rollNo" type="text" required onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-logo-teal focus:border-logo-teal sm:text-sm dark:bg-slate-700 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
                    <div className="mt-1">
                      <input name="year" type="number" min="1" max="4" required onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-logo-teal focus:border-logo-teal sm:text-sm dark:bg-slate-700 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Section</label>
                    <div className="mt-1">
                      <input name="section" type="text" required onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-logo-teal focus:border-logo-teal sm:text-sm dark:bg-slate-700 dark:text-white" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Employee ID</label>
                    <div className="mt-1">
                      <input name="employeeId" type="text" required onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-logo-teal focus:border-logo-teal sm:text-sm dark:bg-slate-700 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Designation</label>
                    <div className="mt-1">
                      <input name="designation" type="text" required onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-logo-teal focus:border-logo-teal sm:text-sm dark:bg-slate-700 dark:text-white" />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-logo-navy to-logo-teal hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-logo-teal disabled:opacity-50">
                {loading ? 'Saving...' : 'Complete Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
