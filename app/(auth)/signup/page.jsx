'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';
import { useSupabase } from '@/lib/supabase/client-provider';

export default function Signup() {
  const router = useRouter();
  const { supabase } = useSupabase();

  const [role, setRole] = useState('STUDENT');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    departmentId: '',
    rollNo: '',
    year: '1',
    section: 'A',
    employeeId: '',
    designation: ''
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('details'); // 'details' | 'confirmation'

  useEffect(() => {
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => setDepartments(data.departments || []))
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      let supabaseUid = null;
      try {
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { name: formData.name, role } }
        });
        if (authErr) {
          setError(authErr.message || 'Unable to create authentication account.');
          setLoading(false);
          return;
        }
        supabaseUid = authData.user?.id;
      } catch (fbErr) {
        setError('Unable to create authentication account. Please try again.');
        setLoading(false);
        return;
      }

      // 2. Register in Database via API
      const payload = { ...formData, role, supabaseUid };
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setStep('confirmation');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error: authErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/api/auth/callback` }
      });
      if (authErr) throw authErr;
    } catch (err) {
      setError(err.message);
    }
  };

  const inputClass = "appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-logo-teal focus:border-logo-teal sm:text-sm dark:bg-slate-700 dark:text-white";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
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
          Create an Account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Or <Link href="/login" className="font-medium text-logo-teal hover:text-logo-navy">sign in to your account</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100 dark:border-slate-700">
          {step === 'details' ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
            
            <div className="flex space-x-4 mb-4">
              <button type="button" onClick={() => setRole('STUDENT')} className={`flex-1 py-2 text-sm font-medium rounded-md ${role === 'STUDENT' ? 'bg-gradient-to-r from-logo-navy to-logo-teal text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>Student</button>
              <button type="button" onClick={() => setRole('FACULTY')} className={`flex-1 py-2 text-sm font-medium rounded-md ${role === 'FACULTY' ? 'bg-gradient-to-r from-logo-navy to-logo-teal text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>Faculty</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="mt-1">
                  <input name="name" type="text" required onChange={handleChange} className={inputClass} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
                <div className="mt-1">
                  <input name="email" type="email" required onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <div className="mt-1">
                  <input name="password" type="password" required onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                <div className="mt-1">
                  <input name="confirmPassword" type="password" required onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                <div className="mt-1">
                  <input name="phone" type="text" onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                <div className="mt-1">
                  <select name="departmentId" required onChange={handleChange} className={inputClass}>
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {role === 'STUDENT' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Roll Number</label>
                    <div className="mt-1">
                      <input name="rollNo" type="text" required onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
                    <div className="mt-1">
                      <select name="year" onChange={handleChange} className={inputClass}>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Section</label>
                    <div className="mt-1">
                      <input name="section" type="text" required onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Employee ID</label>
                    <div className="mt-1">
                      <input name="employeeId" type="text" required onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Designation</label>
                    <div className="mt-1">
                      <input name="designation" type="text" required onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-logo-navy to-logo-teal hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-logo-teal disabled:opacity-50">
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300 dark:border-slate-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    <path fill="none" d="M1 1h22v22H1z" />
                  </svg>
                  Google
                </button>
              </div>
            </div>
          </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Registration Submitted!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Your registration request is under review. You will be able to access all portal features once approved by your faculty officer or administrator.
              </p>
              <div className="pt-4">
                <Link href="/login" className="inline-block px-6 py-2.5 rounded-full bg-gradient-to-r from-logo-navy to-logo-teal text-white font-semibold text-sm shadow">
                  Proceed to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
