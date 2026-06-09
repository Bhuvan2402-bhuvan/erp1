'use client';
import { useState, useEffect } from 'react';
import ProfileTab from '@/components/ProfileTab';

export default function AdminProfile() {
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) setDbUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !dbUser) return <div className="text-slate-500 py-8">Loading profile...</div>;

  return (
    <ProfileTab
      user={dbUser}
      onUpdate={(updated) => setDbUser(updated)}
    />
  );
}
