'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  User, Mail, Phone, BookOpen, Building2, Hash,
  Edit3, Save, X, Star, ShieldCheck, GraduationCap,
  CheckCircle2, AlertCircle, Camera, KeyRound, Lock,
  Upload, Eye, EyeOff
} from 'lucide-react';

const ROLE_CONFIG = {
  ADMIN: {
    label: 'Administrator',
    color: 'from-rose-500 to-orange-500',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    icon: ShieldCheck,
  },
  FACULTY: {
    label: 'Faculty',
    color: 'from-emerald-500 to-teal-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: GraduationCap,
  },
  STUDENT: {
    label: 'Volunteer',
    color: 'from-logo-navy to-logo-teal',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: User,
  },
};

// Client-side image optimization (resizes and compresses images to ~15KB JPEG)
const compressImageFile = (file, maxWidth = 256, maxHeight = 256, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

function Avatar({ name, avatarUrl, size = 96 }) {
  const [loaded, setLoaded] = useState(false);
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  if (avatarUrl) {
    return (
      <div className="relative overflow-hidden rounded-full ring-4 ring-white dark:ring-slate-800 shadow-lg bg-slate-100 dark:bg-slate-700" style={{ width: size, height: size }}>
        {!loaded && (
          <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center text-slate-400 font-bold text-xs">
            {initials}
          </div>
        )}
        <Image
          src={avatarUrl}
          alt={name || 'Avatar'}
          width={size}
          height={size}
          onLoad={() => setLoaded(true)}
          unoptimized={avatarUrl.startsWith('data:') || avatarUrl.includes('dicebear')}
          style={{ width: size, height: size }}
          className={`rounded-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="rounded-full bg-gradient-to-br from-logo-navy to-logo-teal flex items-center justify-center text-white font-bold ring-4 ring-white dark:ring-slate-800 shadow-lg select-none"
    >
      {initials}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-500">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-0.5 break-all">
          {value || <span className="text-slate-400 italic">Not set</span>}
        </p>
      </div>
    </div>
  );
}

// Security & Password Change Card Component
function PasswordChangeCard({ onToast }) {
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.newPassword || passwords.newPassword.length < 8) {
      onToast('error', 'New password must be at least 8 characters long.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      onToast('error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: passwords.newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        onToast('success', 'Password updated successfully!');
        setPasswords({ newPassword: '', confirmPassword: '' });
      } else {
        onToast('error', data.message || 'Failed to update password.');
      }
    } catch {
      onToast('error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStrength = (pw) => {
    if (!pw) return { score: 0, label: '', color: '' };
    if (pw.length < 8) return { score: 1, label: 'Weak (min 8 chars)', color: 'bg-red-500' };
    const hasNum = /\d/.test(pw);
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    if (hasNum && hasSpecial && pw.length >= 10) return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
    return { score: 2, label: 'Medium', color: 'bg-amber-500' };
  };

  const strength = getStrength(passwords.newPassword);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
        <Lock className="w-4 h-4 text-logo-teal" />
        Security & Password
      </h3>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              placeholder="At least 8 characters"
              className="w-full px-4 py-2.5 pr-10 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-logo-teal transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passwords.newPassword && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${strength.color}`}
                  style={{ width: `${(strength.score / 3) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">Strength: <span className="font-medium text-slate-700 dark:text-slate-300">{strength.label}</span></p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
            placeholder="Re-enter new password"
            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-logo-teal transition"
          />
          {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !passwords.newPassword || passwords.newPassword !== passwords.confirmPassword}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-logo-navy to-logo-teal hover:opacity-95 text-white text-sm font-medium rounded-xl transition shadow-sm disabled:opacity-50"
        >
          <KeyRound className="w-4 h-4" />
          {loading ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

export default function ProfileTab({ user, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
    myBharatId: user?.student?.myBharatId || '',
    myBharatCertUrl: user?.student?.myBharatCertUrl || '',
  });

  const roleKey = user?.role || 'STUDENT';
  const roleConfig = ROLE_CONFIG[roleKey] || ROLE_CONFIG.STUDENT;
  const RoleIcon = roleConfig.icon;

  const isCoordinator = roleKey === 'STUDENT' && user?.student?.isCoordinator;

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Profile updated successfully!');
        setEditing(false);
        if (onUpdate) onUpdate(data.user);
      } else {
        showToast('error', data.message || 'Failed to update profile.');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 256, 256, 0.85);
      setForm((prev) => ({ ...prev, avatarUrl: compressedDataUrl }));

      // Automatically save new profile picture
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, avatarUrl: compressedDataUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Profile picture updated successfully!');
        if (onUpdate) onUpdate(data.user);
      } else {
        showToast('error', data.message || 'Failed to save profile picture.');
      }
    } catch (err) {
      showToast('error', 'Error processing image upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      avatarUrl: user?.avatarUrl || '',
      myBharatId: user?.student?.myBharatId || '',
      myBharatCertUrl: user?.student?.myBharatCertUrl || '',
    });
    setEditing(false);
  };

  const inputClass =
    'w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-logo-teal transition';

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {/* Hidden file input for picture upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
        className="hidden"
      />

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium transition-all animate-slide-in ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
              : 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Hero card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Banner */}
        <div className={`h-32 bg-gradient-to-r ${roleConfig.color} relative`}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />
        </div>

        <div className="px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-6">
            {/* Avatar with Camera upload button */}
            <div className="relative w-fit group">
              <Avatar name={form.name || user?.name} avatarUrl={form.avatarUrl || user?.avatarUrl} size={96} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 p-2 bg-logo-teal hover:bg-logo-navy text-white rounded-full transition-all shadow-md group-hover:scale-110 disabled:opacity-60"
                title="Upload Profile Picture"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-12 sm:mt-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-60"
              >
                <Upload className="w-4 h-4 text-logo-teal" />
                {uploading ? 'Uploading...' : 'Upload Picture'}
              </button>

              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-logo-navy to-logo-teal hover:opacity-95 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Name + Role */}
          <div className="space-y-1 mb-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {user?.name || 'Unknown User'}
              </h2>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${roleConfig.badge}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                {roleConfig.label}
              </span>
              {isCoordinator && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  Coordinator
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm">{user?.email}</p>
          </div>

          {/* Bio */}
          {!editing && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {user?.bio || <span className="italic text-slate-400">No bio added yet.</span>}
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Edit / Personal Details card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
            <User className="w-4 h-4 text-logo-teal" />
            {editing ? 'Edit Details' : 'Personal Details'}
          </h3>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Profile Picture URL</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-logo-teal hover:underline flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" /> Upload File
                  </button>
                </div>
                <input
                  className={inputClass}
                  value={form.avatarUrl}
                  onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              {roleKey === 'STUDENT' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">myBharat Portal ID</label>
                    <input
                      className={inputClass}
                      value={form.myBharatId || ''}
                      onChange={(e) => setForm({ ...form, myBharatId: e.target.value })}
                      placeholder="MB-12345678"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">myBharat Certificate URL</label>
                    <input
                      className={inputClass}
                      value={form.myBharatCertUrl || ''}
                      onChange={(e) => setForm({ ...form, myBharatCertUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Bio</label>
                <textarea
                  className={inputClass + ' resize-none'}
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell us a bit about yourself..."
                />
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              <InfoRow icon={Mail} label="Email" value={user?.email} />
              <InfoRow icon={Phone} label="Phone" value={user?.phone} />
              <InfoRow icon={User} label="Role" value={roleConfig.label + (isCoordinator ? ' (Coordinator)' : '')} />
            </div>
          )}
        </div>

        {/* Academic / Org Details & Security Card Grid */}
        <div className="space-y-6">
          {/* Academic / Org Details card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-logo-teal" />
              {roleKey === 'FACULTY' ? 'Faculty Details' : roleKey === 'ADMIN' ? 'Admin Details' : 'Academic Details'}
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {roleKey === 'STUDENT' && (
                <>
                  <InfoRow icon={Hash} label="Roll Number" value={user?.student?.rollNo} />
                  <InfoRow icon={BookOpen} label="Department" value={user?.student?.department?.name} />
                  <InfoRow
                    icon={Building2}
                    label="Year / Section"
                    value={
                      user?.student?.year && user?.student?.section
                        ? `Year ${user.student.year} / Section ${user.student.section}`
                        : null
                    }
                  />
                  <InfoRow icon={ShieldCheck} label="myBharat Portal ID" value={user?.student?.myBharatId || 'Not set'} />
                  <InfoRow icon={CheckCircle2} label="myBharat Certificate URL" value={user?.student?.myBharatCertUrl} />
                  <InfoRow icon={Star} label="Volunteer Points" value={`${user?.student?.points || 0} pts`} />
                </>
              )}
              {roleKey === 'FACULTY' && (
                <>
                  <InfoRow icon={Hash} label="Employee ID" value={user?.faculty?.employeeId} />
                  <InfoRow icon={BookOpen} label="Assigned Branch" value={user?.faculty?.department?.name} />
                </>
              )}
              {roleKey === 'ADMIN' && (
                <InfoRow icon={ShieldCheck} label="Access Level" value="Full System Access" />
              )}

              <InfoRow
                icon={CheckCircle2}
                label="Account Status"
                value={
                  user?.approvalStatus === 'APPROVED'
                    ? '✅ Approved'
                    : user?.approvalStatus === 'PENDING'
                    ? '⏳ Pending Approval'
                    : user?.approvalStatus || 'Unknown'
                }
              />
              <InfoRow
                icon={Building2}
                label="Member Since"
                value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : null}
              />
            </div>
          </div>

          {/* Change Password Card */}
          <PasswordChangeCard onToast={showToast} />
        </div>
      </div>
    </div>
  );
}
