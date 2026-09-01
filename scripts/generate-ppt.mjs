import pptxgen from 'pptxgenjs';

async function createPresentation() {
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Bhuvana Mohan Chowdary';
  pptx.company = 'Vasireddy Venkatadri Institute of Technology (Autonomous)';
  pptx.title = 'VVITU NSS ERP — Institutional Resource Planning & Monitoring Portal';

  // Theme Colors
  const BG_DARK = '0B1120';
  const CARD_BG = '1E293B';
  const ACCENT_TEAL = '14B8A6';
  const ACCENT_CYAN = '0EA5E9';
  const ACCENT_GOLD = 'F59E0B';
  const TEXT_WHITE = 'FFFFFF';
  const TEXT_MUTED = '94A3B8';
  const BORDER_COLOR = '334155';

  // Helper for Standard Dark Slide
  function createStandardSlide(title, subtitle) {
    const slide = pptx.addSlide();
    slide.background = { color: BG_DARK };

    // Top Header Banner
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.6, y: 0.4, w: 12.13, h: 0.9,
      fill: { color: CARD_BG },
      line: { color: BORDER_COLOR, width: 1 }
    });

    slide.addText(title, {
      x: 0.8, y: 0.48, w: 9.5, h: 0.45,
      fontSize: 20, bold: true, color: TEXT_WHITE, fontFace: 'Calibri'
    });

    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.8, y: 0.92, w: 9.5, h: 0.3,
        fontSize: 11, color: ACCENT_TEAL, fontFace: 'Calibri'
      });
    }

    // Top Right Badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 10.5, y: 0.6, w: 2.0, h: 0.5,
      fill: { color: '064E3B' },
      line: { color: ACCENT_TEAL, width: 1 },
      rectRadius: 0.2
    });
    slide.addText('VVITU NSS ERP', {
      x: 10.5, y: 0.6, w: 2.0, h: 0.5,
      fontSize: 10, bold: true, color: ACCENT_TEAL, align: 'center', valign: 'middle'
    });

    // Footer
    slide.addText('Vasireddy Venkatadri Institute of Technology (Autonomous) • NSS ERP Portal', {
      x: 0.6, y: 7.0, w: 10.0, h: 0.3,
      fontSize: 9, color: '64748B', fontFace: 'Calibri'
    });

    return slide;
  }

  // ─────────────────────────────────────────────────────────────
  // SLIDE 1: Title Slide
  // ─────────────────────────────────────────────────────────────
  const s1 = pptx.addSlide();
  s1.background = { color: BG_DARK };

  s1.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 0.8, w: 11.73, h: 5.8,
    fill: { color: CARD_BG },
    line: { color: ACCENT_TEAL, width: 1.5 },
    rectRadius: 0.3
  });

  s1.addText('VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY (AUTONOMOUS)', {
    x: 1.2, y: 1.2, w: 11.0, h: 0.4,
    fontSize: 13, bold: true, color: ACCENT_TEAL, fontFace: 'Calibri', tracking: 2
  });

  s1.addText('VVITU NSS ERP', {
    x: 1.2, y: 1.7, w: 11.0, h: 1.0,
    fontSize: 40, bold: true, color: TEXT_WHITE, fontFace: 'Calibri'
  });

  s1.addText('Centralized Institutional Resource Planning, Anti-Proxy Attendance & Activity Auditing Portal', {
    x: 1.2, y: 2.8, w: 11.0, h: 0.5,
    fontSize: 15, color: TEXT_MUTED, fontFace: 'Calibri'
  });

  // Feature Highlights Box Grid
  const s1Boxes = [
    { title: 'Academic Year Monitoring', desc: '5-Year Evaluation & YoY Trends', color: ACCENT_CYAN },
    { title: 'Financial Audit & Ledger', desc: 'Budgets, Expenses & Digital Receipts', color: ACCENT_TEAL },
    { title: 'Anti-Proxy QR Attendance', desc: 'Dynamic Camera Verification', color: ACCENT_GOLD },
    { title: 'Unit-Wise Event Operations', desc: 'Drive Photos & Lightbox Galleries', color: 'A855F7' }
  ];

  s1Boxes.forEach((b, idx) => {
    const xPos = 1.2 + (idx * 2.7);
    s1.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 3.6, w: 2.55, h: 1.4,
      fill: { color: '0F172A' },
      line: { color: b.color, width: 1 },
      rectRadius: 0.15
    });
    s1.addText(b.title, {
      x: xPos + 0.15, y: 3.75, w: 2.25, h: 0.5,
      fontSize: 12, bold: true, color: TEXT_WHITE, fontFace: 'Calibri'
    });
    s1.addText(b.desc, {
      x: xPos + 0.15, y: 4.3, w: 2.25, h: 0.5,
      fontSize: 10, color: TEXT_MUTED, fontFace: 'Calibri'
    });
  });

  s1.addText('Live Production Portal: https://erp-tan-six.vercel.app', {
    x: 1.2, y: 5.4, w: 11.0, h: 0.4,
    fontSize: 12, bold: true, color: ACCENT_TEAL, fontFace: 'Calibri'
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 2: Problem vs Solution
  // ─────────────────────────────────────────────────────────────
  const s2 = createStandardSlide('Problem Statement & Core Motivation', 'Bridging the operational gaps in institutional volunteering drives');

  // Left Card: The Challenge
  s2.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 1.5, w: 5.9, h: 5.2,
    fill: { color: CARD_BG },
    line: { color: 'EF4444', width: 1.5 },
    rectRadius: 0.2
  });
  s2.addText('❌ Traditional Operations & Pain Points', {
    x: 0.8, y: 1.7, w: 5.5, h: 0.4,
    fontSize: 15, bold: true, color: 'EF4444', fontFace: 'Calibri'
  });

  const problems = [
    '• Proxy Attendance & Fraud: Unverifiable paper sign-in sheets or forwarded QR screenshots.',
    '• Scattered Financial Records: Receipts stored in personal chats with zero budget accountability.',
    '• Missing Academic Year Trends: No historical data to track YoY volunteering growth.',
    '• Fragmented Photo Archives: Event photos scattered across social media without attribution.',
    '• Manual Approvals: Slow manual paper registration without real-time quotas.'
  ];
  s2.addText(problems.join('\n\n'), {
    x: 0.8, y: 2.3, w: 5.5, h: 4.1,
    fontSize: 11, color: TEXT_MUTED, fontFace: 'Calibri', lineSpacing: 18
  });

  // Right Card: The Solution
  s2.addShape(pptx.ShapeType.roundRect, {
    x: 6.8, y: 1.5, w: 5.9, h: 5.2,
    fill: { color: CARD_BG },
    line: { color: ACCENT_TEAL, width: 1.5 },
    rectRadius: 0.2
  });
  s2.addText('✅ VVITU NSS ERP Ecosystem', {
    x: 7.0, y: 1.7, w: 5.5, h: 0.4,
    fontSize: 15, bold: true, color: ACCENT_TEAL, fontFace: 'Calibri'
  });

  const solutions = [
    '• Anti-Proxy QR Gate: Dynamic time-sensitive QR codes with mobile camera presence verification.',
    '• Centralized Financial Ledger: Itemized budgets, expense meters, proof receipts & 1-click audit CSVs.',
    '• AY Monitoring Engine: 5-Year historical analysis, department rankings & accreditation compliance.',
    '• Unit-Wise Media Hub: Client-compressed photo uploads, unit badges & public lightbox galleries.',
    '• Role Governance & Quotas: Strict quotas (4 Admins | 15 Faculty | 20 Coordinators).'
  ];
  s2.addText(solutions.join('\n\n'), {
    x: 7.0, y: 2.3, w: 5.5, h: 4.1,
    fontSize: 11, color: TEXT_WHITE, fontFace: 'Calibri', lineSpacing: 18
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 3: System Architecture & Tech Stack
  // ─────────────────────────────────────────────────────────────
  const s3 = createStandardSlide('System Architecture & Technology Stack', 'Enterprise-grade serverless cloud infrastructure built for speed and resilience');

  const stackCards = [
    { title: 'Frontend Layer', items: ['Next.js 14 App Router', 'React 18 & Server Components', 'Tailwind CSS Design System', 'Lucide React Icons'], color: ACCENT_CYAN },
    { title: 'Security & Auth Gate', items: ['Edge Route Middleware', 'HTTPOnly Signed JWTs', 'Google OAuth 2.0 (PKCE)', 'IP Rate-Limiting Engine'], color: ACCENT_TEAL },
    { title: 'Database & Realtime', items: ['Supabase PostgreSQL', 'Prisma ORM v5.22 Schema', 'Transaction Connection Pooling', 'Supabase Realtime Websockets'], color: ACCENT_GOLD },
    { title: 'Cloud & CI/CD', items: ['Vercel Edge Serverless', 'Global CDN Edge Caching', 'Self-Destructing Cache Buster', 'Automated GitHub Deployments'], color: 'A855F7' }
  ];

  stackCards.forEach((c, idx) => {
    const xPos = 0.6 + (idx * 3.1);
    s3.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 1.6, w: 2.9, h: 5.0,
      fill: { color: CARD_BG },
      line: { color: c.color, width: 1.5 },
      rectRadius: 0.2
    });

    s3.addText(c.title, {
      x: xPos + 0.15, y: 1.8, w: 2.6, h: 0.4,
      fontSize: 14, bold: true, color: c.color, fontFace: 'Calibri'
    });

    s3.addText(c.items.map(i => `• ${i}`).join('\n\n'), {
      x: xPos + 0.15, y: 2.4, w: 2.6, h: 4.0,
      fontSize: 11, color: TEXT_WHITE, fontFace: 'Calibri', lineSpacing: 18
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 4: Role-Based Access Control (RBAC)
  // ─────────────────────────────────────────────────────────────
  const s4 = createStandardSlide('Role-Based Access Control (RBAC) & Governance', 'Hard-capped account quotas ensuring operational integrity and verified hierarchy');

  const rbacTiers = [
    { role: 'System Admin (Max 4)', scope: 'Institutional Master Oversight', permissions: ['Full Platform Governance', 'Academic Year Monitoring', 'Master Financial Audit & Budgets', 'User Role Approvals & Quotas'], color: 'EF4444' },
    { role: 'Faculty Coordinator (Max 15)', scope: 'Department Branch Officers', permissions: ['Branch-Scoped Volunteer Auditing', 'Unit Campaign Creation & Photos', 'Branch Financial Ledger Entries', 'Sign-up Approvals for Department'], color: ACCENT_TEAL },
    { role: 'Student Coordinator (Max 20)', scope: 'Branch Volunteer Leads', permissions: ['Branch Volunteers Management', 'Custom Forms Builder & Reviews', 'QR Attendance Verification', 'Performance Point Allotments'], color: ACCENT_CYAN },
    { role: 'Student Volunteer (Unlimited)', scope: 'Active Enrolled Students', permissions: ['Event Registration & Drive Feed', 'Mobile QR Attendance Scanner', 'myBharat ID & Portfolio Transcript', '1:1 Grievance Box Submissions'], color: ACCENT_GOLD }
  ];

  rbacTiers.forEach((t, idx) => {
    const yPos = 1.6 + (idx * 1.25);
    s4.addShape(pptx.ShapeType.roundRect, {
      x: 0.6, y: yPos, w: 12.13, h: 1.15,
      fill: { color: CARD_BG },
      line: { color: t.color, width: 1 },
      rectRadius: 0.15
    });

    s4.addText(t.role, {
      x: 0.8, y: yPos + 0.15, w: 3.2, h: 0.35,
      fontSize: 13, bold: true, color: t.color, fontFace: 'Calibri'
    });
    s4.addText(t.scope, {
      x: 0.8, y: yPos + 0.55, w: 3.2, h: 0.4,
      fontSize: 10, color: TEXT_MUTED, fontFace: 'Calibri'
    });

    s4.addText(t.permissions.map(p => `✔ ${p}`).join('   •   '), {
      x: 4.2, y: yPos + 0.2, w: 8.3, h: 0.75,
      fontSize: 10, color: TEXT_WHITE, fontFace: 'Calibri'
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 5: Academic Year Monitoring Engine
  // ─────────────────────────────────────────────────────────────
  const s5 = createStandardSlide('Flagship 1: Academic Year Monitoring Engine', 'Comprehensive multi-year evaluation, department benchmarking & automated NAAC reports');

  const s5Metrics = [
    { label: 'Active Enrolled Volunteers', val: '1,200+', desc: 'Across 10 Academic Branches' },
    { label: 'Verified Service Hours', val: '15,000+', desc: 'Avg 12.5 hrs / volunteer' },
    { label: 'Campaigns & Drives', val: '45+', desc: 'Blood camps, rallies & surveys' },
    { label: 'Student Coordinators', val: '20', desc: 'Active Branch Unit Leads' }
  ];

  s5Metrics.forEach((m, idx) => {
    const xPos = 0.6 + (idx * 3.1);
    s5.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 1.5, w: 2.9, h: 1.6,
      fill: { color: CARD_BG },
      line: { color: ACCENT_TEAL, width: 1 },
      rectRadius: 0.15
    });
    s5.addText(m.label, { x: xPos + 0.15, y: 1.65, w: 2.6, h: 0.3, fontSize: 10, bold: true, color: TEXT_MUTED });
    s5.addText(m.val, { x: xPos + 0.15, y: 1.95, w: 2.6, h: 0.6, fontSize: 24, bold: true, color: TEXT_WHITE });
    s5.addText(m.desc, { x: xPos + 0.15, y: 2.6, w: 2.6, h: 0.35, fontSize: 9, color: ACCENT_TEAL });
  });

  // Lower Section: Key Capabilities
  s5.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 3.3, w: 12.13, h: 3.4,
    fill: { color: CARD_BG },
    line: { color: BORDER_COLOR, width: 1 },
    rectRadius: 0.2
  });

  s5.addText('Key Innovations & Capabilities:', {
    x: 0.9, y: 3.5, w: 11.5, h: 0.35,
    fontSize: 13, bold: true, color: ACCENT_CYAN
  });

  const s5Feats = [
    '• Interactive Academic Year Pills: Seamlessly switch between AY 2026-2027, 2025-2026, 2024-2025, 2023-2024, and 2022-2023.',
    '• Department Performance Matrix: Comparative leaderboard ranking all 10 branches (CSE, ECE, EEE, MECH, CIVIL, IT, CSM, CSD, AID, CIC).',
    '• Year-over-Year Growth Comparison: 5-Year longitudinal audit visualizer comparing volunteer participation curves.',
    '• AY Top Volunteers Leaderboard: Recognizes highest point earners and service hour contributors in the academic cycle.',
    '• 1-Click Institutional Report (CSV): Instant download of the full institutional academic year report formatted for accreditation.'
  ];

  s5.addText(s5Feats.join('\n\n'), {
    x: 0.9, y: 3.9, w: 11.5, h: 2.6,
    fontSize: 11, color: TEXT_WHITE, lineSpacing: 16
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 6: Financial Reports & Audit Ledger
  // ─────────────────────────────────────────────────────────────
  const s6 = createStandardSlide('Flagship 2: Year-Wise Financial Reports & Audit Ledger', 'Real-time financial accountability, budget utilization tracking & itemized transaction ledgers');

  const s6Cards = [
    { label: 'Allocated Budget', val: '₹1,50,000', color: ACCENT_CYAN, desc: 'Annual Institutional Allocation' },
    { label: 'Incurred Expenses', val: '₹95,400', color: 'EF4444', desc: '63.6% Budget Utilized' },
    { label: 'Sponsorships / Inflows', val: '₹40,000', color: ACCENT_TEAL, desc: 'Donations & Partner Funds' },
    { label: 'Remaining Balance', val: '₹94,600', color: ACCENT_GOLD, desc: 'Available for Upcoming Drives' }
  ];

  s6Cards.forEach((c, idx) => {
    const xPos = 0.6 + (idx * 3.1);
    s6.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 1.5, w: 2.9, h: 1.6,
      fill: { color: CARD_BG },
      line: { color: c.color, width: 1 },
      rectRadius: 0.15
    });
    s6.addText(c.label, { x: xPos + 0.15, y: 1.65, w: 2.6, h: 0.3, fontSize: 10, bold: true, color: TEXT_MUTED });
    s6.addText(c.val, { x: xPos + 0.15, y: 1.95, w: 2.6, h: 0.6, fontSize: 22, bold: true, color: c.color });
    s6.addText(c.desc, { x: xPos + 0.15, y: 2.6, w: 2.6, h: 0.35, fontSize: 9, color: TEXT_WHITE });
  });

  // Expense Category Matrix
  s6.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 3.3, w: 5.9, h: 3.4,
    fill: { color: CARD_BG },
    line: { color: BORDER_COLOR, width: 1 },
    rectRadius: 0.2
  });
  s6.addText('📊 Expense Category Matrix', { x: 0.8, y: 3.5, w: 5.5, h: 0.35, fontSize: 13, bold: true, color: ACCENT_TEAL });
  const cats = [
    '• Event Logistics & Venue Setup: ₹32,000 (34%)',
    '• Refreshments & Volunteer Food: ₹24,500 (26%)',
    '• Medical & First Aid Supplies: ₹18,200 (19%)',
    '• Transportation & Fuel: ₹12,000 (12%)',
    '• Printing, Banners & Certificates: ₹8,700 (9%)'
  ];
  s6.addText(cats.join('\n\n'), { x: 0.8, y: 4.0, w: 5.5, h: 2.5, fontSize: 10, color: TEXT_WHITE, lineSpacing: 14 });

  // Audit Capabilities
  s6.addShape(pptx.ShapeType.roundRect, {
    x: 6.8, y: 3.3, w: 5.9, h: 3.4,
    fill: { color: CARD_BG },
    line: { color: BORDER_COLOR, width: 1 },
    rectRadius: 0.2
  });
  s6.addText('📑 Auditing & Compliance Features', { x: 7.0, y: 3.5, w: 5.5, h: 0.35, fontSize: 13, bold: true, color: ACCENT_CYAN });
  const auditFeats = [
    '• Year-over-Year Audit Comparisons: Track budget trends across multiple academic years.',
    '• Digital Receipt Storage: Attach and preview verified invoice URLs directly in the transaction ledger.',
    '• Multi-Branch Accounting: Scope finances to specific departments or central unit.',
    '• 1-Click Financial Audit CSV: Download itemized spreadsheets for university auditors.'
  ];
  s6.addText(auditFeats.join('\n\n'), { x: 7.0, y: 4.0, w: 5.5, h: 2.5, fontSize: 10, color: TEXT_WHITE, lineSpacing: 14 });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 7: Unit-Wise Event Operations & Photos
  // ─────────────────────────────────────────────────────────────
  const s7 = createStandardSlide('Flagship 3: Unit-Wise Event Operations & Photo Galleries', 'Departmental campaign canvas, client-side photo compression & public lightbox showcase');

  const s7Features = [
    { title: 'Unit Scoping & Tagging', desc: 'Faculty Coordinators launch campaigns tagged under their departmental branch (e.g. CSE Unit, ECE Unit). Volunteers can filter drives by their branch.', color: ACCENT_TEAL },
    { title: 'Client-Side Image Compression', desc: 'High-resolution drive photos are compressed in-browser (JPEG 0.8 quality, 1024px max) before uploading, preventing cloud storage timeouts and lag.', color: ACCENT_CYAN },
    { title: 'Interactive Photo Gallery & Lightbox', desc: 'Event details include high-res photo albums with captions, upload timestamps, and coordinator attribution accessible to all volunteers.', color: ACCENT_GOLD },
    { title: 'Visitor Directory Integration', desc: 'Photos uploaded by unit faculty coordinators automatically feed into the public visitor activity stream with department badges.', color: 'A855F7' }
  ];

  s7Features.forEach((f, idx) => {
    const xPos = idx % 2 === 0 ? 0.6 : 6.8;
    const yPos = idx < 2 ? 1.6 : 4.3;
    s7.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: yPos, w: 5.9, h: 2.4,
      fill: { color: CARD_BG },
      line: { color: f.color, width: 1.5 },
      rectRadius: 0.2
    });
    s7.addText(f.title, { x: xPos + 0.2, y: yPos + 0.2, w: 5.5, h: 0.35, fontSize: 13, bold: true, color: f.color });
    s7.addText(f.desc, { x: xPos + 0.2, y: yPos + 0.65, w: 5.5, h: 1.5, fontSize: 11, color: TEXT_WHITE, lineSpacing: 16 });
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 8: Anti-Proxy QR Attendance Gate
  // ─────────────────────────────────────────────────────────────
  const s8 = createStandardSlide('Flagship 4: Anti-Proxy QR Attendance Gate', 'Tamper-resistant digital attendance gate with automated service hour calculations');

  const s8Steps = [
    { step: '1. Dynamic QR Display', desc: 'Faculty Coordinator projects a time-sensitive dynamic QR code during live drives.' },
    { step: '2. Mobile Camera Scan', desc: 'Student volunteer scans the projected QR code directly from their mobile camera in /student/events.' },
    { step: '3. Physical Verification', desc: 'System checks active registration, verifies single-scan validity, and blocks proxy attempts.' },
    { step: '4. Service Hour Credit', desc: 'Automatically logs verified presence and credits +3 community service hours to the student transcript.' }
  ];

  s8Steps.forEach((st, idx) => {
    const xPos = 0.6 + (idx * 3.1);
    s8.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 1.6, w: 2.9, h: 4.8,
      fill: { color: CARD_BG },
      line: { color: ACCENT_TEAL, width: 1 },
      rectRadius: 0.2
    });
    s8.addText(st.step, { x: xPos + 0.15, y: 1.9, w: 2.6, h: 0.5, fontSize: 13, bold: true, color: ACCENT_TEAL });
    s8.addText(st.desc, { x: xPos + 0.15, y: 2.6, w: 2.6, h: 3.5, fontSize: 11, color: TEXT_WHITE, lineSpacing: 16 });
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 9: Dynamic Custom Forms Engine
  // ─────────────────────────────────────────────────────────────
  const s9 = createStandardSlide('Flagship 5: Dynamic Custom Form Builder & Submissions', 'Enterprise drag-and-drop forms, multi-stage approval workflows & visual response analytics');

  const s9Items = [
    { title: '18+ Input Field Types', desc: 'Short text, paragraphs, single select, multi-select checkboxes, rating scales, linear 1-10 scales, yes/no toggles, and file attachments.', color: ACCENT_CYAN },
    { title: 'Publishing Lifecycle', desc: 'Full draft-to-archive governance (DRAFT ➔ PUBLISHED ➔ CLOSED) with strict branch targeting and department visibility controls.', color: ACCENT_TEAL },
    { title: 'Multi-Stage Review Workflow', desc: 'Coordinators review submissions, append audit notes, and mark responses as APPROVED, UNDER_REVIEW, or REJECTED.', color: ACCENT_GOLD },
    { title: 'Visual Analytics & Excel Export', desc: 'Real-time response distribution charts, summary metrics, and 1-click export to .xlsx Excel spreadsheets.', color: 'A855F7' }
  ];

  s9Items.forEach((f, idx) => {
    const xPos = idx % 2 === 0 ? 0.6 : 6.8;
    const yPos = idx < 2 ? 1.6 : 4.3;
    s9.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: yPos, w: 5.9, h: 2.4,
      fill: { color: CARD_BG },
      line: { color: f.color, width: 1.5 },
      rectRadius: 0.2
    });
    s9.addText(f.title, { x: xPos + 0.2, y: yPos + 0.2, w: 5.5, h: 0.35, fontSize: 13, bold: true, color: f.color });
    s9.addText(f.desc, { x: xPos + 0.2, y: yPos + 0.65, w: 5.5, h: 1.5, fontSize: 11, color: TEXT_WHITE, lineSpacing: 16 });
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 10: Faculty Desk & Public Showcase
  // ─────────────────────────────────────────────────────────────
  const s10 = createStandardSlide('Flagship 6: Faculty Leadership Showcase & Public Directory', 'Institutional transparency showcasing leadership vision, unit officers & volunteer achievements');

  const s10Cols = [
    { title: 'Program Coordinator Spotlight', items: ['Institutional leadership vision & message', 'Official profile photo & designation', 'Key achievements & milestones', 'Publicly featured on Home Page'], color: ACCENT_CYAN },
    { title: 'Program Officers (POs) Directory', items: ['Department coordinators for all 10 branches', 'Direct email & employee affiliations', 'Unit badges (CSE, ECE, MECH, etc.)', 'Dynamic Admin Manager (/admin/faculty-desk)'], color: ACCENT_TEAL },
    { title: 'Public Visitor Transparency', items: ['Open impact metrics for parents & auditors', 'Verified volunteer roster with achievement tiers', 'Activity photo stream with unit badges', 'Zero private contact leak (privacy compliant)'], color: ACCENT_GOLD }
  ];

  s10Cols.forEach((c, idx) => {
    const xPos = 0.6 + (idx * 4.15);
    s10.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 1.6, w: 3.85, h: 5.0,
      fill: { color: CARD_BG },
      line: { color: c.color, width: 1.5 },
      rectRadius: 0.2
    });
    s10.addText(c.title, { x: xPos + 0.2, y: 1.8, w: 3.45, h: 0.45, fontSize: 13, bold: true, color: c.color });
    s10.addText(c.items.map(i => `• ${i}`).join('\n\n'), {
      x: xPos + 0.2, y: 2.4, w: 3.45, h: 4.0, fontSize: 11, color: TEXT_WHITE, lineSpacing: 18
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 11: Volunteer Gamification & myBharat Sync
  // ─────────────────────────────────────────────────────────────
  const s11 = createStandardSlide('Flagship 7: Gamified Portfolios & Government myBharat Sync', 'Motivating student community service with tiered recognition and official government integration');

  const badges = [
    { tier: '🥉 Bronze Tier', pts: '< 50 Points', desc: 'Entry-level participation in campus drives', color: 'CD7F32' },
    { tier: '🥈 Silver Tier', pts: '50 – 149 Points', desc: 'Active volunteer contributing across multiple camps', color: 'C0C0C0' },
    { tier: '🥇 Gold Tier', pts: '150 – 299 Points', desc: 'Distinguished volunteer & drive coordinator lead', color: 'FFD700' },
    { tier: '💎 Platinum Tier', pts: '300+ Points', desc: 'Exceptional institutional social impact awardee', color: '00FFFF' }
  ];

  badges.forEach((b, idx) => {
    const xPos = 0.6 + (idx * 3.1);
    s11.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 1.6, w: 2.9, h: 2.0,
      fill: { color: CARD_BG },
      line: { color: b.color, width: 1.5 },
      rectRadius: 0.15
    });
    s11.addText(b.tier, { x: xPos + 0.15, y: 1.8, w: 2.6, h: 0.35, fontSize: 13, bold: true, color: b.color });
    s11.addText(b.pts, { x: xPos + 0.15, y: 2.2, w: 2.6, h: 0.3, fontSize: 11, bold: true, color: TEXT_WHITE });
    s11.addText(b.desc, { x: xPos + 0.15, y: 2.6, w: 2.6, h: 0.8, fontSize: 9, color: TEXT_MUTED });
  });

  // Lower Box: myBharat Integration
  s11.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 3.9, w: 12.13, h: 2.8,
    fill: { color: CARD_BG },
    line: { color: ACCENT_TEAL, width: 1 },
    rectRadius: 0.2
  });
  s11.addText('🏛️ Official Government myBharat Portal Integration', { x: 0.9, y: 4.1, w: 11.5, h: 0.35, fontSize: 13, bold: true, color: ACCENT_TEAL });
  const govtPoints = [
    '• myBharat ID Synchronization: Volunteers can link and verify their official national myBharat Government volunteer IDs.',
    '• Verified Certificate Repository: Direct cloud storage and verification of government-issued NSS camp certificates.',
    '• Printable Institutional Service Record: 1-Click PDF/print transcript summarizing total service hours, camps, and achievements.'
  ];
  s11.addText(govtPoints.join('\n\n'), { x: 0.9, y: 4.6, w: 11.5, h: 1.9, fontSize: 11, color: TEXT_WHITE, lineSpacing: 16 });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 12: Live Demo Walkthrough & Credentials Roster
  // ─────────────────────────────────────────────────────────────
  const s12 = createStandardSlide('Live Demo Script & Access Credentials', 'Step-by-step presentation script and pre-configured access accounts');

  // Left: 5-Step Demo Script
  s12.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 1.5, w: 5.9, h: 5.2,
    fill: { color: CARD_BG },
    line: { color: ACCENT_CYAN, width: 1 },
    rectRadius: 0.2
  });
  s12.addText('🎬 10-Minute Presentation Script', { x: 0.8, y: 1.7, w: 5.5, h: 0.35, fontSize: 13, bold: true, color: ACCENT_CYAN });
  const steps = [
    '1. Public Visitor Portal (/visitor): Show faculty leadership spotlight, activity feed & branch directories.',
    '2. Admin AY Monitoring (/admin/monitoring): Switch academic years, show department matrix & export CSV.',
    '3. Financial Audit Ledger (/admin/finance): Demonstrate budget vs spend meters, category breakdowns & receipts.',
    '4. Faculty Coordinator (/faculty/events): Show unit event updates, photo compressor & attendance viewer.',
    '5. Student Volunteer View (/student/events): Demonstrate mobile camera QR attendance scanner & portfolio.'
  ];
  s12.addText(steps.join('\n\n'), { x: 0.8, y: 2.2, w: 5.5, h: 4.2, fontSize: 10, color: TEXT_WHITE, lineSpacing: 14 });

  // Right: Credentials Roster
  s12.addShape(pptx.ShapeType.roundRect, {
    x: 6.8, y: 1.5, w: 5.9, h: 5.2,
    fill: { color: CARD_BG },
    line: { color: ACCENT_TEAL, width: 1 },
    rectRadius: 0.2
  });
  s12.addText('🔑 Pre-Configured Demo Accounts', { x: 7.0, y: 1.7, w: 5.5, h: 0.35, fontSize: 13, bold: true, color: ACCENT_TEAL });
  const accounts = [
    '• System Admin 1: admin1@erp.com / Admin@12345 (Master Governance)',
    '• System Admin 2: admin2@erp.com / Admin@12345 (Operations & Finance)',
    '• Faculty Coordinator (CSE): faculty.cse@erp.com / Faculty@12345',
    '• Faculty Coordinator (ECE): faculty.ece@erp.com / Faculty@12345',
    '• Student Coordinator: lead.cse1@erp.com / Student@12345 (Branch Lead)',
    '• Student Volunteer: student.cse1@erp.com / Student@12345 (Volunteer)'
  ];
  s12.addText(accounts.join('\n\n'), { x: 7.0, y: 2.2, w: 5.5, h: 4.2, fontSize: 10, color: TEXT_WHITE, lineSpacing: 14 });

  // Save the presentation
  const fileName = 'VVITU_NSS_ERP_Presentation.pptx';
  await pptx.writeFile({ fileName });
  console.log(`✅ Presentation saved successfully as ${fileName}`);
}

createPresentation().catch(err => {
  console.error('Error generating presentation:', err);
  process.exit(1);
});
