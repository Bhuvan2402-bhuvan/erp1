'use client';

const FIELD_TYPES = {
  Basic: [
    { type: 'short_text', label: 'Short Text', icon: '—', desc: 'Single line text' },
    { type: 'long_text', label: 'Long Text', icon: '≡', desc: 'Multi-line paragraph' },
    { type: 'number', label: 'Number', icon: '#', desc: 'Numeric input' },
    { type: 'email', label: 'Email', icon: '@', desc: 'Email address' },
    { type: 'phone', label: 'Phone', icon: '☏', desc: 'Phone number' },
    { type: 'url', label: 'URL', icon: '🔗', desc: 'Web link' },
  ],
  Selection: [
    { type: 'dropdown', label: 'Dropdown', icon: '▼', desc: 'Select from list' },
    { type: 'radio', label: 'Radio', icon: '◉', desc: 'Single choice' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑', desc: 'Multiple choice' },
    { type: 'multi_select', label: 'Multi-Select', icon: '⊞', desc: 'Multiple selections' },
  ],
  'Date & Time': [
    { type: 'date', label: 'Date', icon: '📅', desc: 'Date picker' },
    { type: 'time', label: 'Time', icon: '⏰', desc: 'Time picker' },
    { type: 'datetime', label: 'Date & Time', icon: '🗓', desc: 'Combined picker' },
  ],
  Advanced: [
    { type: 'rating', label: 'Rating', icon: '★', desc: '1–5 star rating' },
    { type: 'linear_scale', label: 'Linear Scale', icon: '↔', desc: 'Scale 1–10' },
    { type: 'yes_no', label: 'Yes / No', icon: '✓✗', desc: 'Boolean choice' },
    { type: 'file_upload', label: 'File Upload', icon: '📎', desc: 'Attach a file' },
    { type: 'image_upload', label: 'Image Upload', icon: '🖼', desc: 'Attach an image' },
    { type: 'signature', label: 'Signature', icon: '✍', desc: 'Draw signature' },
  ],
  Layout: [
    { type: 'section', label: 'Section', icon: '§', desc: 'New section divider' },
    { type: 'heading', label: 'Heading', icon: 'H', desc: 'Bold heading text' },
    { type: 'description', label: 'Description', icon: 'T', desc: 'Informational text' },
    { type: 'divider', label: 'Divider', icon: '─', desc: 'Horizontal line' },
  ],
};

export default function FieldTypeSelector({ onSelect, compact = false }) {
  return (
    <div className="space-y-5">
      {Object.entries(FIELD_TYPES).map(([group, types]) => (
        <div key={group}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{group}</p>
          <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {types.map(ft => (
              <button
                key={ft.type}
                type="button"
                onClick={() => onSelect(ft.type)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-logo-teal hover:bg-logo-teal/5 transition-all group text-left"
              >
                <span className="text-lg w-6 text-center shrink-0 select-none">{ft.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{ft.label}</p>
                  {!compact && <p className="text-[10px] text-slate-400 truncate">{ft.desc}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export { FIELD_TYPES };
