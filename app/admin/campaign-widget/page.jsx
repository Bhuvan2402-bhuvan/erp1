'use client';
import { useState, useEffect, useCallback } from 'react';
import { Save, RefreshCw, Eye, EyeOff, Zap, Activity, Plus, Trash2, GripVertical, Users, Award, Star, Bell, CheckCircle, AlertCircle, Heart, BookOpen, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';

const ICON_OPTIONS = [
  { key: 'zap',          label: 'Zap',         Icon: Zap },
  { key: 'users',        label: 'Users',       Icon: Users },
  { key: 'award',        label: 'Award',       Icon: Award },
  { key: 'activity',     label: 'Activity',    Icon: Activity },
  { key: 'star',         label: 'Star',        Icon: Star },
  { key: 'bell',         label: 'Bell',        Icon: Bell },
  { key: 'check',        label: 'Check',       Icon: CheckCircle },
  { key: 'alert',        label: 'Alert',       Icon: AlertCircle },
  { key: 'heart',        label: 'Heart',       Icon: Heart },
  { key: 'book',         label: 'Book',        Icon: BookOpen },
  { key: 'calendar',     label: 'Calendar',    Icon: Calendar },
];

const ICON_COLORS = [
  'bg-logo-teal/10 text-logo-teal',
  'bg-logo-green/10 text-logo-green',
  'bg-logo-navy/10 text-logo-navy dark:text-logo-teal',
  'bg-amber-100 text-amber-600',
  'bg-rose-100 text-rose-600',
  'bg-purple-100 text-purple-600',
  'bg-blue-100 text-blue-600',
  'bg-emerald-100 text-emerald-600',
];

function getIconComponent(key) {
  return ICON_OPTIONS.find(o => o.key === key)?.Icon || Zap;
}

const DEFAULT_ACTIVITIES = [
  { title: 'Arun K. (Student) joined', subtitle: 'Registered for Plantation Drive • 2 mins ago', icon: 'users' },
  { title: 'Hour Audits Completed', subtitle: 'Dr. Srinivasan approved 12 certificates • 1 hour ago', icon: 'award' },
];

const DEFAULT_FORM = {
  campaignName: 'Blood Drive Registration',
  currentCount: 124,
  targetCount: 150,
  activities: DEFAULT_ACTIVITIES,
  isActive: true,
};

export default function AdminCampaignWidget() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchWidget = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaign-widget');
      const data = await res.json();
      if (data.widget) {
        const acts = Array.isArray(data.widget.activities) && data.widget.activities.length > 0
          ? data.widget.activities
          : DEFAULT_ACTIVITIES;
        setForm({ ...DEFAULT_FORM, ...data.widget, activities: acts });
      }
    } catch {
      toast.error('Failed to load widget data');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchWidget(); }, [fetchWidget]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/campaign-widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) toast.success('Hero widget updated — live on homepage!');
      else toast.error(data.message || 'Failed to save');
    } catch {
      toast.error('Failed to save widget');
    }
    setSaving(false);
  };

  // Activity helpers
  const addActivity = () => {
    setForm(f => ({
      ...f,
      activities: [...f.activities, { title: '', subtitle: '', icon: 'zap' }]
    }));
  };

  const removeActivity = (idx) => {
    setForm(f => ({ ...f, activities: f.activities.filter((_, i) => i !== idx) }));
  };

  const updateActivity = (idx, field, value) => {
    setForm(f => ({
      ...f,
      activities: f.activities.map((a, i) => i === idx ? { ...a, [field]: value } : a)
    }));
  };

  const moveActivity = (idx, dir) => {
    const newArr = [...form.activities];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= newArr.length) return;
    [newArr[idx], newArr[swapIdx]] = [newArr[swapIdx], newArr[idx]];
    setForm(f => ({ ...f, activities: newArr }));
  };

  const pct = form.targetCount > 0 ? Math.min(100, Math.round((form.currentCount / form.targetCount) * 100)) : 0;

  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700';
  const inputClass = 'w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-logo-teal/50 transition';
  const labelClass = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Live Campaign Widget</h2>
          <p className="text-slate-500 text-sm mt-1">Fully customize the hero card shown on the public homepage.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchWidget} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-logo-navy to-logo-teal text-white rounded-xl hover:opacity-90 transition text-sm font-semibold shadow-sm disabled:opacity-60">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ── LEFT: Edit Form ── */}
        <div className="space-y-4">

          {/* Campaign Progress Bar */}
          <div className={`${cardClass} p-5 space-y-4`}>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-logo-teal" /> Campaign Progress Bar
            </p>
            <div>
              <label className={labelClass}>Campaign Name</label>
              <input className={inputClass} value={form.campaignName}
                onChange={e => setForm(f => ({ ...f, campaignName: e.target.value }))}
                placeholder="e.g. Blood Drive Registration" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Current Count</label>
                <input type="number" min={0} className={inputClass} value={form.currentCount}
                  onChange={e => setForm(f => ({ ...f, currentCount: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className={labelClass}>Target Count</label>
                <input type="number" min={1} className={inputClass} value={form.targetCount}
                  onChange={e => setForm(f => ({ ...f, targetCount: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>
          </div>

          {/* Activity Feed — Dynamic */}
          <div className={`${cardClass} p-5 space-y-4`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-logo-teal" /> Activity Feed
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 font-medium">{form.activities.length}</span>
              </p>
              <button onClick={addActivity}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-logo-teal/10 text-logo-teal hover:bg-logo-teal/20 transition">
                <Plus className="w-3.5 h-3.5" /> Add Activity
              </button>
            </div>

            {form.activities.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl">
                No activities yet. Click &ldquo;Add Activity&rdquo; to create one.
              </div>
            )}

            <div className="space-y-3">
              {form.activities.map((act, idx) => {
                const IconComp = getIconComponent(act.icon);
                const colorClass = ICON_COLORS[idx % ICON_COLORS.length];
                return (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    {/* Activity header row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                        <span className="text-xs font-bold text-slate-500">Activity {idx + 1}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveActivity(idx, -1)} disabled={idx === 0}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30 transition" title="Move up">
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => moveActivity(idx, 1)} disabled={idx === form.activities.length - 1}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30 transition" title="Move down">
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeActivity(idx)}
                          className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition" title="Remove">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Icon picker */}
                    <div>
                      <label className={labelClass}>Icon</label>
                      <div className="flex flex-wrap gap-2">
                        {ICON_OPTIONS.map(({ key, label, Icon: Ic }) => (
                          <button key={key} type="button" onClick={() => updateActivity(idx, 'icon', key)}
                            title={label}
                            className={`p-2 rounded-lg border-2 transition ${act.icon === key
                              ? 'border-logo-teal bg-logo-teal/10 text-logo-teal'
                              : 'border-slate-200 dark:border-slate-600 text-slate-400 hover:border-slate-300 hover:text-slate-600'}`}>
                            <Ic className="w-3.5 h-3.5" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title + Subtitle */}
                    <div>
                      <label className={labelClass}>Title</label>
                      <input className={inputClass} value={act.title}
                        onChange={e => updateActivity(idx, 'title', e.target.value)}
                        placeholder="e.g. Arun K. (Student) joined" />
                    </div>
                    <div>
                      <label className={labelClass}>Subtitle / Detail</label>
                      <input className={inputClass} value={act.subtitle}
                        onChange={e => updateActivity(idx, 'subtitle', e.target.value)}
                        placeholder="e.g. Registered for Plantation Drive • 2 mins ago" />
                    </div>
                  </div>
                );
              })}
            </div>

            {form.activities.length > 0 && (
              <button onClick={addActivity}
                className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-400 hover:text-logo-teal hover:border-logo-teal/40 transition flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Another Activity
              </button>
            )}
          </div>

          {/* Visibility toggle */}
          <div className={`${cardClass} p-5`}>
            <label className="relative inline-flex items-center cursor-pointer gap-3">
              <input type="checkbox" className="sr-only peer" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-logo-teal"></div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {form.isActive ? 'Widget visible on homepage' : 'Widget hidden from homepage'}
                </p>
                <p className="text-xs text-slate-400">Toggle to show or hide the entire hero widget card</p>
              </div>
            </label>
          </div>
        </div>

        {/* ── RIGHT: Live Preview ── */}
        <div className="space-y-3 sticky top-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Preview</p>
          <div className={`${cardClass} p-5`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-logo-green animate-ping" />
                Live Campaign Activity
              </span>
            </div>

            <div className="space-y-3">
              {/* Progress bar */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate pr-2">{form.campaignName || '—'}</span>
                  <span className="text-xs font-extrabold text-logo-navy dark:text-logo-teal whitespace-nowrap">{form.currentCount} / {form.targetCount} Target</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-500 to-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 text-right">{pct}% of target</p>
              </div>

              {/* Activities preview */}
              {form.activities.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-3">No activities to preview</p>
              )}
              <div className="space-y-2">
                {form.activities.map((a, idx) => {
                  const IconComp = getIconComponent(a.icon);
                  const colorClass = ICON_COLORS[idx % ICON_COLORS.length];
                  return (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-900/30 rounded-xl">
                      <div className={`p-1.5 rounded-lg ${colorClass} shrink-0`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{a.title || '—'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{a.subtitle || '—'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5">
            {form.isActive
              ? <><Eye className="w-3 h-3 text-emerald-500" /> Widget is <span className="text-emerald-600 font-semibold">visible</span> on the homepage</>
              : <><EyeOff className="w-3 h-3 text-slate-400" /> Widget is <span className="font-semibold">hidden</span> from the homepage</>
            }
          </p>
        </div>
      </div>
    </div>
  );
}
