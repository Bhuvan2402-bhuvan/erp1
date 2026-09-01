import pptxgen from 'pptxgenjs';

async function buildOptimizedPresentation() {
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9'; // 13.33 x 7.5 inches
  pptx.author = 'Bhuvana Mohan Chowdary';
  pptx.company = 'Vasireddy Venkatadri Institute of Technology (Autonomous)';
  pptx.title = 'VVITU NSS ERP — Institutional Resource Planning & Monitoring Portal';

  // ── Palette System ──
  const C_BG_DARK    = '080E1A'; // Deep Navy Slate
  const C_CARD_BG    = '131D31'; // Card Surface
  const C_CARD_INNER = '1A2640'; // Inner Card Surface
  const C_BORDER     = '253554'; // Subtle Border
  const C_TEAL       = '00D2B4'; // Primary Accent
  const C_CYAN       = '38BDF8'; // Secondary Accent
  const C_GOLD       = 'FBBF24'; // Warning / Points Accent
  const C_RED        = 'F87171'; // Critical Accent
  const C_EMERALD    = '34D399'; // Success Accent
  const C_PURPLE     = 'C084FC'; // Innovation Accent
  const C_TEXT_MAIN  = 'FFFFFF'; // Headings & Strong
  const C_TEXT_BODY  = 'E2E8F0'; // Body text
  const C_TEXT_MUTED = '94A3B8'; // Subtitles & Captions
  const FONT_HEADING = 'Segoe UI';
  const FONT_BODY    = 'Segoe UI';

  // ── Standard Master Template Builder ──
  function addHeader(slide, title, category = 'INSTITUTIONAL ERP') {
    slide.background = { color: C_BG_DARK };

    // Header Background Bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.6, y: 0.35, w: 12.13, h: 0.85,
      fill: { color: C_CARD_BG },
      line: { color: C_BORDER, width: 1 }
    });

    // Category Pill
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 0.45, w: 2.2, h: 0.26,
      fill: { color: '064E3B' },
      line: { color: C_TEAL, width: 0.75 },
      rectRadius: 0.13
    });
    slide.addText(category, {
      x: 0.8, y: 0.45, w: 2.2, h: 0.26,
      fontSize: 8.5, bold: true, color: C_TEAL, align: 'center', valign: 'middle', fontFace: FONT_HEADING
    });

    // Main Slide Title
    slide.addText(title, {
      x: 3.15, y: 0.45, w: 7.2, h: 0.65,
      fontSize: 17, bold: true, color: C_TEXT_MAIN, fontFace: FONT_HEADING
    });

    // Right Branding Badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 10.6, y: 0.45, w: 1.95, h: 0.65,
      fill: { color: '0F172A' },
      line: { color: C_BORDER, width: 1 },
      rectRadius: 0.12
    });
    slide.addText('VVITU NSS ERP\nAuto Portal', {
      x: 10.6, y: 0.45, w: 1.95, h: 0.65,
      fontSize: 8.5, bold: true, color: C_CYAN, align: 'center', valign: 'middle', fontFace: FONT_HEADING
    });

    // Global Footer Line & Text
    slide.addShape(pptx.ShapeType.line, {
      x: 0.6, y: 7.0, w: 12.13, h: 0,
      line: { color: C_BORDER, width: 0.75 }
    });
    slide.addText('Vasireddy Venkatadri Institute of Technology (Autonomous) • NSS ERP Platform • https://erp-tan-six.vercel.app', {
      x: 0.6, y: 7.05, w: 12.13, h: 0.3,
      fontSize: 8.5, color: C_TEXT_MUTED, fontFace: FONT_BODY
    });
  }

  // ─────────────────────────────────────────────────────────────
  // SLIDE 1: Title Slide (Hero Presentation Deck)
  // ─────────────────────────────────────────────────────────────
  const s1 = pptx.addSlide();
  s1.background = { color: C_BG_DARK };

  // Main Hero Glass Frame
  s1.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 0.6, w: 12.13, h: 6.3,
    fill: { color: C_CARD_BG },
    line: { color: C_TEAL, width: 1.5 },
    rectRadius: 0.3
  });

  // Institution Sub-header
  s1.addText('VASIREDDY VENKATADRI INSTITUTE OF TECHNOLOGY (AUTONOMOUS)', {
    x: 1.0, y: 0.95, w: 11.3, h: 0.35,
    fontSize: 11, bold: true, color: C_TEAL, fontFace: FONT_HEADING, tracking: 2
  });

  // Big Title
  s1.addText('VVITU NSS ERP', {
    x: 1.0, y: 1.35, w: 11.3, h: 0.9,
    fontSize: 38, bold: true, color: C_TEXT_MAIN, fontFace: FONT_HEADING
  });

  // Tagline
  s1.addText('Centralized Institutional Resource Planning, Anti-Proxy Attendance & Activity Auditing Portal', {
    x: 1.0, y: 2.3, w: 11.3, h: 0.4,
    fontSize: 14, color: C_CYAN, fontFace: FONT_BODY
  });

  s1.addText('Designed for University Accreditation (NAAC/NIRF), Real-Time Financial Audits & Departmental Unit Operations', {
    x: 1.0, y: 2.7, w: 11.3, h: 0.35,
    fontSize: 11, color: C_TEXT_MUTED, fontFace: FONT_BODY
  });

  // 4 Pillar Metric Feature Cards
  const heroPillars = [
    { title: 'AY Monitoring Engine', stat: '5-Year Trends', desc: 'Multi-cycle analytics, YoY growth & 1-click NAAC CSV export', color: C_CYAN },
    { title: 'Financial Audit & Ledger', stat: 'Real-Time ₹', desc: 'Budgets, operational spend, receipts & audit reports', color: C_TEAL },
    { title: 'Anti-Proxy QR Gate', stat: 'Zero Proxy', desc: 'Dynamic camera scanning & +3 verified service hrs/camp', color: C_GOLD },
    { title: 'Unit-Wise Event Media', stat: '10 Branches', desc: 'Client-compressed drive photos & public lightbox gallery', color: C_PURPLE }
  ];

  heroPillars.forEach((p, idx) => {
    const xPos = 1.0 + (idx * 2.85);
    s1.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 3.25, w: 2.7, h: 2.4,
      fill: { color: C_CARD_INNER },
      line: { color: p.color, width: 1 },
      rectRadius: 0.15
    });

    s1.addShape(pptx.ShapeType.roundRect, {
      x: xPos + 0.15, y: 3.4, w: 1.3, h: 0.28,
      fill: { color: '0A1220' },
      line: { color: p.color, width: 0.5 },
      rectRadius: 0.1
    });
    s1.addText(p.stat, {
      x: xPos + 0.15, y: 3.4, w: 1.3, h: 0.28,
      fontSize: 8.5, bold: true, color: p.color, align: 'center', valign: 'middle', fontFace: FONT_HEADING
    });

    s1.addText(p.title, {
      x: xPos + 0.15, y: 3.8, w: 2.4, h: 0.55,
      fontSize: 13, bold: true, color: C_TEXT_MAIN, fontFace: FONT_HEADING
    });

    s1.addText(p.desc, {
      x: xPos + 0.15, y: 4.4, w: 2.4, h: 1.1,
      fontSize: 10, color: C_TEXT_BODY, fontFace: FONT_BODY, lineSpacing: 14
    });
  });

  // Footer URL bar inside hero
  s1.addShape(pptx.ShapeType.roundRect, {
    x: 1.0, y: 5.9, w: 11.33, h: 0.65,
    fill: { color: '0A1220' },
    line: { color: C_BORDER, width: 1 },
    rectRadius: 0.12
  });
  s1.addText('🌐 Production Portal: https://erp-tan-six.vercel.app   •   Next.js 14  |  Prisma ORM  |  Supabase PostgreSQL  |  Vercel Edge', {
    x: 1.2, y: 5.9, w: 10.9, h: 0.65,
    fontSize: 10.5, bold: true, color: C_TEAL, valign: 'middle', fontFace: FONT_HEADING
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 2: Problem vs Solution Matrix
  // ─────────────────────────────────────────────────────────────
  const s2 = pptx.addSlide();
  addHeader(s2, 'The Operational Challenge vs The ERP Solution', 'PROBLEM & VALUE PROPOSITION');

  // Left Card: Legacy Challenges
  s2.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 1.35, w: 5.9, h: 5.45,
    fill: { color: C_CARD_BG },
    line: { color: C_RED, width: 1.5 },
    rectRadius: 0.2
  });

  s2.addShape(pptx.ShapeType.roundRect, {
    x: 0.85, y: 1.55, w: 5.4, h: 0.45,
    fill: { color: '450A0A' },
    line: { color: C_RED, width: 0.75 },
    rectRadius: 0.12
  });
  s2.addText('❌ Legacy Manual NSS Operations & Risks', {
    x: 0.85, y: 1.55, w: 5.4, h: 0.45,
    fontSize: 12, bold: true, color: C_RED, align: 'center', valign: 'middle', fontFace: FONT_HEADING
  });

  const legacyPoints = [
    '• Proxy Attendance Fraud: Paper sign-up sheets and shared QR screenshot forwarding lead to unverified volunteer hours.',
    '• Zero Financial Accountability: Expenses and sponsorships tracked informally in WhatsApp groups without verified receipts.',
    '• No Multi-Year Analytics: High administrative friction during NAAC/NIRF inspections due to missing historical trends.',
    '• Fragmented Photo Archives: Event memories lost across personal phones without captions or department attribution.',
    '• Unstructured Grievances: Volunteer complaints lost in chats without formal resolution status tracking.'
  ];
  s2.addText(legacyPoints.join('\n\n'), {
    x: 0.85, y: 2.15, w: 5.4, h: 4.4,
    fontSize: 10.5, color: C_TEXT_BODY, fontFace: FONT_BODY, lineSpacing: 15
  });

  // Right Card: Modern ERP Solution
  s2.addShape(pptx.ShapeType.roundRect, {
    x: 6.8, y: 1.35, w: 5.9, h: 5.45,
    fill: { color: C_CARD_BG },
    line: { color: C_TEAL, width: 1.5 },
    rectRadius: 0.2
  });

  s2.addShape(pptx.ShapeType.roundRect, {
    x: 7.05, y: 1.55, w: 5.4, h: 0.45,
    fill: { color: '064E3B' },
    line: { color: C_TEAL, width: 0.75 },
    rectRadius: 0.12
  });
  s2.addText('✅ VVITU NSS ERP Automated Capabilities', {
    x: 7.05, y: 1.55, w: 5.4, h: 0.45,
    fontSize: 12, bold: true, color: C_TEAL, align: 'center', valign: 'middle', fontFace: FONT_HEADING
  });

  const modernPoints = [
    '• Dynamic QR Gate: Time-sensitive projected QR codes verified via mobile camera (+3 verified service hours credited).',
    '• Centralized Audit Ledger: Budget utilization progress meters, itemized transaction ledgers & 1-click audit CSV export.',
    '• Academic Year Monitoring: 5-Year evaluation (2022-2027) with comparative department benchmarking across 10 branches.',
    '• Unit-Wise Media Canvas: In-browser image compression, unit tags (CSE Unit) & interactive visitor lightbox galleries.',
    '• 1:1 Grievance Box: Direct volunteer ticketing with formal NOT_SOLVED / SOLVED status resolution workflows.'
  ];
  s2.addText(modernPoints.join('\n\n'), {
    x: 7.05, y: 2.15, w: 5.4, h: 4.4,
    fontSize: 10.5, color: C_TEXT_MAIN, fontFace: FONT_BODY, lineSpacing: 15
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 3: System Architecture
  // ─────────────────────────────────────────────────────────────
  const s3 = pptx.addSlide();
  addHeader(s3, 'System Architecture & Resilient Tech Stack', 'TECHNICAL SPECIFICATIONS');

  const archLayers = [
    {
      layer: 'Layer 1: Client Experience',
      tech: 'Next.js 14 App Router • React 18 • Tailwind CSS',
      highlights: ['Responsive Progressive Web App (PWA)', 'Tailored Dark/Light Mode Design System', 'Client-Side JPEG Image Compressor (0.8 quality)', 'HTML5 Mobile Camera QR Code Scanner'],
      color: C_CYAN
    },
    {
      layer: 'Layer 2: Edge Security & Middleware',
      tech: 'Vercel Edge Runtime • Next.js Middleware Gate',
      highlights: ['HTTPOnly SameSite Signed JWT Session Cookies', 'Google OAuth 2.0 (PKCE) Social Login Integration', 'IP-based API Rate-Limiting Protection', 'Strict Role-Based Edge Route Redirections'],
      color: C_TEAL
    },
    {
      layer: 'Layer 3: Backend & Database',
      tech: 'Prisma ORM v5.22 • Supabase PostgreSQL Cloud',
      highlights: ['18 Strongly-Typed Relational Models', 'Transaction Connection Pooling for High Concurrency', 'Supabase Realtime Websockets for 1:1 Chat', 'Automated Database Migrations & Validation'],
      color: C_GOLD
    },
    {
      layer: 'Layer 4: Deployment & CDN',
      tech: 'Vercel Serverless Network • Global Edge CDN',
      highlights: ['Automated GitHub CI/CD Pipeline', 'Self-Destructing Service Worker Cache Purge', 'Sub-second API Execution Times', 'High-Availability Production Uptime (99.9%)'],
      color: C_PURPLE
    }
  ];

  archLayers.forEach((l, idx) => {
    const xPos = 0.6 + (idx * 3.1);
    s3.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 1.35, w: 2.9, h: 5.45,
      fill: { color: C_CARD_BG },
      line: { color: l.color, width: 1.25 },
      rectRadius: 0.2
    });

    s3.addText(l.layer, {
      x: xPos + 0.15, y: 1.55, w: 2.6, h: 0.45,
      fontSize: 11.5, bold: true, color: l.color, fontFace: FONT_HEADING
    });

    s3.addShape(pptx.ShapeType.roundRect, {
      x: xPos + 0.15, y: 2.05, w: 2.6, h: 0.65,
      fill: { color: C_CARD_INNER },
      line: { color: C_BORDER, width: 0.5 },
      rectRadius: 0.1
    });
    s3.addText(l.tech, {
      x: xPos + 0.2, y: 2.05, w: 2.5, h: 0.65,
      fontSize: 8.5, bold: true, color: C_TEXT_MUTED, valign: 'middle', fontFace: FONT_BODY
    });

    s3.addText(l.highlights.map(h => `✔ ${h}`).join('\n\n'), {
      x: xPos + 0.15, y: 2.85, w: 2.6, h: 3.8,
      fontSize: 9.5, color: C_TEXT_BODY, fontFace: FONT_BODY, lineSpacing: 13
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 4: Role-Based Access Control (RBAC) Matrix
  // ─────────────────────────────────────────────────────────────
  const s4 = pptx.addSlide();
  addHeader(s4, 'Role-Based Access Control (RBAC) & Governance Matrix', 'SECURITY & ACCOUNT QUOTAS');

  const rbacRoles = [
    {
      title: 'System Admin (Master Authority)',
      quota: 'Max 4 System-Wide',
      color: C_RED,
      scope: 'Institutional Administration & Audit',
      duties: ['Master User & Role Approval/Rejection Gate', 'Full Academic Year Monitoring & Multi-Year Trends', 'Master Financial Audit, Budgets & Expense Authorization', 'Institution-wide Data Backup (JSON/CSV Dumps)']
    },
    {
      title: 'Faculty Coordinator (Program Officer)',
      quota: 'Max 15 System-Wide',
      color: C_TEAL,
      scope: 'Departmental Branch Oversight (CSE, ECE, etc.)',
      duties: ['Branch-Scoped Volunteer Monitoring & Hours Audit', 'Unit Event Campaign Creation & Drive Photo Uploads', 'Departmental Financial Ledger Entries & Receipts', 'Approval of Student Registrations for Branch']
    },
    {
      title: 'Student Coordinator (Branch Lead)',
      quota: 'Max 20 System-Wide',
      color: C_CYAN,
      scope: 'Branch Volunteer Leadership',
      duties: ['Custom Forms Builder (Create, Publish, Close)', 'Volunteer Response Review & Status Approvals', 'Dynamic QR Code Attendance Generation', 'Allotting Gamified Performance Points & Badges']
    },
    {
      title: 'Student Volunteer (Enrolled Member)',
      quota: 'Unlimited Self-Registration',
      color: C_GOLD,
      scope: 'Community Volunteer Participation',
      duties: ['Browse Campaign Feed & 1-Click Event Registration', 'Anti-Proxy Mobile Camera Attendance Scanning', 'Government myBharat ID & Certificate Linking', '1:1 Confidential Grievance Redressal Submissions']
    }
  ];

  rbacRoles.forEach((r, idx) => {
    const yPos = 1.35 + (idx * 1.35);
    s4.addShape(pptx.ShapeType.roundRect, {
      x: 0.6, y: yPos, w: 12.13, h: 1.22,
      fill: { color: C_CARD_BG },
      line: { color: r.color, width: 1 },
      rectRadius: 0.15
    });

    s4.addText(r.title, {
      x: 0.8, y: yPos + 0.12, w: 3.4, h: 0.35,
      fontSize: 12, bold: true, color: r.color, fontFace: FONT_HEADING
    });

    s4.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: yPos + 0.52, w: 1.8, h: 0.28,
      fill: { color: '0A1220' },
      line: { color: r.color, width: 0.5 },
      rectRadius: 0.08
    });
    s4.addText(r.quota, {
      x: 0.8, y: yPos + 0.52, w: 1.8, h: 0.28,
      fontSize: 8, bold: true, color: r.color, align: 'center', valign: 'middle'
    });

    s4.addText(r.scope, {
      x: 0.8, y: yPos + 0.85, w: 3.4, h: 0.3,
      fontSize: 8.5, color: C_TEXT_MUTED, fontFace: FONT_BODY
    });

    s4.addText(r.duties.map(d => `✔ ${d}`).join('\n'), {
      x: 4.4, y: yPos + 0.12, w: 8.1, h: 0.98,
      fontSize: 9.5, color: C_TEXT_BODY, fontFace: FONT_BODY, lineSpacing: 14
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 5: Flagship 1 - Academic Year Monitoring
  // ─────────────────────────────────────────────────────────────
  const s5 = pptx.addSlide();
  addHeader(s5, 'Flagship 1: Academic Year Monitoring Engine', 'INSTITUTIONAL METRICS & NAAC AUDITS');

  const s5KPIs = [
    { label: 'Active Enrolled Volunteers', val: '1,200+', sub: 'Across 10 Engineering Branches', color: C_CYAN },
    { label: 'Verified Service Hours', val: '15,000+', sub: 'Avg 12.5 hrs / volunteer', color: C_TEAL },
    { label: 'Campaigns & Drives Executed', val: '45+', sub: 'Medical, Blood, Rallies & Drives', color: C_GOLD },
    { label: 'Student Unit Coordinators', val: '20', sub: 'Elected Branch Student Leads', color: C_PURPLE }
  ];

  s5KPIs.forEach((k, idx) => {
    const xPos = 0.6 + (idx * 3.1);
    s5.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 1.35, w: 2.9, h: 1.6,
      fill: { color: C_CARD_BG },
      line: { color: k.color, width: 1.25 },
      rectRadius: 0.15
    });

    s5.addText(k.label, { x: xPos + 0.15, y: 1.45, w: 2.6, h: 0.3, fontSize: 9.5, bold: true, color: C_TEXT_MUTED });
    s5.addText(k.val, { x: xPos + 0.15, y: 1.75, w: 2.6, h: 0.6, fontSize: 24, bold: true, color: k.color, fontFace: FONT_HEADING });
    s5.addText(k.sub, { x: xPos + 0.15, y: 2.45, w: 2.6, h: 0.35, fontSize: 8.5, color: C_TEXT_BODY });
  });

  // Bottom Content Card
  s5.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 3.1, w: 12.13, h: 3.7,
    fill: { color: C_CARD_BG },
    line: { color: C_BORDER, width: 1 },
    rectRadius: 0.2
  });

  s5.addText('Core Capabilities of the Academic Year Monitoring Engine (/admin/monitoring & /faculty/monitoring):', {
    x: 0.9, y: 3.3, w: 11.5, h: 0.35,
    fontSize: 12, bold: true, color: C_TEAL, fontFace: FONT_HEADING
  });

  const s5Details = [
    '• Interactive Academic Year Selector: Switch instantaneously between AY 2026-2027, 2025-2026, 2024-2025, 2023-2024, and 2022-2023.',
    '• Department Performance Matrix: Live comparative leaderboard benchmarking student enrollment, events, and hours across all 10 branches (CSE, ECE, EEE, MECH, CIVIL, IT, CSM, CSD, AID, CIC).',
    '• 5-Year Growth Progression Visualizer: Historical comparison bars tracking volunteer engagement curves across multi-year cycles.',
    '• Academic Year Top Volunteers Leaderboard: Recognizes highest point earners and service hour contributors for each academic session.',
    '• 1-Click Institutional Compliance Export (CSV): Download the complete annual institutional audit report formatted for NAAC accreditation.'
  ];
  s5.addText(s5Details.join('\n\n'), {
    x: 0.9, y: 3.7, w: 11.5, h: 2.9,
    fontSize: 10, color: C_TEXT_BODY, fontFace: FONT_BODY, lineSpacing: 14
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 6: Flagship 2 - Financial Reports & Ledger
  // ─────────────────────────────────────────────────────────────
  const s6 = pptx.addSlide();
  addHeader(s6, 'Flagship 2: Year-Wise Financial Reports & Audit Ledger', 'FISCAL ACCOUNTABILITY & BUDGETS');

  const s6FinanceCards = [
    { label: 'Allocated Budget', val: '₹1,50,000', sub: 'Annual Institutional Grant', color: C_CYAN },
    { label: 'Total Incurred Expenses', val: '₹95,400', sub: '63.6% Budget Utilization', color: C_RED },
    { label: 'Sponsorships & Donations', val: '₹40,000', sub: 'External Partner Funding', color: C_EMERALD },
    { label: 'Net Available Balance', val: '₹94,600', sub: 'Available for Future Drives', color: C_GOLD }
  ];

  s6FinanceCards.forEach((c, idx) => {
    const xPos = 0.6 + (idx * 3.1);
    s6.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 1.35, w: 2.9, h: 1.6,
      fill: { color: C_CARD_BG },
      line: { color: c.color, width: 1.25 },
      rectRadius: 0.15
    });
    s6.addText(c.label, { x: xPos + 0.15, y: 1.45, w: 2.6, h: 0.3, fontSize: 9.5, bold: true, color: C_TEXT_MUTED });
    s6.addText(c.val, { x: xPos + 0.15, y: 1.75, w: 2.6, h: 0.6, fontSize: 22, bold: true, color: c.color, fontFace: FONT_HEADING });
    s6.addText(c.sub, { x: xPos + 0.15, y: 2.45, w: 2.6, h: 0.35, fontSize: 8.5, color: C_TEXT_BODY });
  });

  // Left Box: Category Breakdown
  s6.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 3.1, w: 5.9, h: 3.7,
    fill: { color: C_CARD_BG },
    line: { color: C_BORDER, width: 1 },
    rectRadius: 0.2
  });
  s6.addText('📊 Expense Category Breakdown', {
    x: 0.85, y: 3.25, w: 5.4, h: 0.35,
    fontSize: 12, bold: true, color: C_TEAL, fontFace: FONT_HEADING
  });
  const expCats = [
    '• Event Logistics & Venue Setup: ₹32,000 (34%)',
    '• Refreshments & Volunteer Food: ₹24,500 (26%)',
    '• Medical & First Aid Camp Supplies: ₹18,200 (19%)',
    '• Transportation & Volunteer Bus Fuel: ₹12,000 (12%)',
    '• Printing, Banners & Certificate Mementos: ₹8,700 (9%)'
  ];
  s6.addText(expCats.join('\n\n'), {
    x: 0.85, y: 3.7, w: 5.4, h: 2.9,
    fontSize: 10, color: C_TEXT_BODY, fontFace: FONT_BODY, lineSpacing: 14
  });

  // Right Box: Auditing Capabilities
  s6.addShape(pptx.ShapeType.roundRect, {
    x: 6.8, y: 3.1, w: 5.9, h: 3.7,
    fill: { color: C_CARD_BG },
    line: { color: C_BORDER, width: 1 },
    rectRadius: 0.2
  });
  s6.addText('📑 Fiscal Auditing & Compliance Engine', {
    x: 7.05, y: 3.25, w: 5.4, h: 0.35,
    fontSize: 12, bold: true, color: C_CYAN, fontFace: FONT_HEADING
  });
  const audPoints = [
    '• Budget Utilization Meter: Real-time progress bars prevent over-expenditures and ensure transparent allocation.',
    '• Multi-Year Audit Comparisons: Compare annual spending across 5 academic years in a single view.',
    '• Digital Receipt Storage: Attach and preview verified invoice URLs directly within each transaction entry.',
    '• 1-Click Financial Audit CSV: Download itemized spreadsheets formatted for college management and auditors.'
  ];
  s6.addText(audPoints.join('\n\n'), {
    x: 7.05, y: 3.7, w: 5.4, h: 2.9,
    fontSize: 10, color: C_TEXT_BODY, fontFace: FONT_BODY, lineSpacing: 14
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 7: Flagship 3 - Unit-Wise Event Operations & Media
  // ─────────────────────────────────────────────────────────────
  const s7 = pptx.addSlide();
  addHeader(s7, 'Flagship 3: Unit-Wise Event Operations & Media Hub', 'CAMPAIGN MANAGEMENT & GALLERIES');

  const s7Cards = [
    {
      title: 'Unit Scoping & Tagging',
      badge: 'DEPARTMENTAL ISOLATION',
      desc: 'Faculty Coordinators post drives tagged under their departmental branch (e.g. CSE Unit, ECE Unit). Volunteers can filter events by their own unit or browse all college drives.',
      color: C_TEAL
    },
    {
      title: 'In-Browser Image Compressor',
      badge: 'OPTIMIZED UPLOADS',
      desc: 'High-resolution camera photos are compressed client-side (JPEG 0.8 quality, 1024px max) before uploading, preventing slow uploads and serverless timeout errors.',
      color: C_CYAN
    },
    {
      title: 'Interactive Photo Lightbox',
      badge: 'ALBUM GALLERIES',
      desc: 'Each campaign features an interactive photo gallery with captions, uploader attribution, and full-screen lightbox viewing accessible to volunteers and coordinators.',
      color: C_GOLD
    },
    {
      title: 'Public Visitor Feed Integration',
      badge: 'CAMPUS TRANSPARENCY',
      desc: 'Photos uploaded by unit faculty coordinators automatically feed into the public visitor directory with branch badges, showcasing social impact to parents and guests.',
      color: C_PURPLE
    }
  ];

  s7Cards.forEach((c, idx) => {
    const xPos = idx % 2 === 0 ? 0.6 : 6.8;
    const yPos = idx < 2 ? 1.35 : 4.15;
    s7.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: yPos, w: 5.9, h: 2.65,
      fill: { color: C_CARD_BG },
      line: { color: c.color, width: 1.25 },
      rectRadius: 0.2
    });

    s7.addShape(pptx.ShapeType.roundRect, {
      x: xPos + 0.2, y: yPos + 0.18, w: 2.2, h: 0.26,
      fill: { color: '0A1220' },
      line: { color: c.color, width: 0.5 },
      rectRadius: 0.08
    });
    s7.addText(c.badge, {
      x: xPos + 0.2, y: yPos + 0.18, w: 2.2, h: 0.26,
      fontSize: 7.5, bold: true, color: c.color, align: 'center', valign: 'middle'
    });

    s7.addText(c.title, {
      x: xPos + 0.2, y: yPos + 0.52, w: 5.5, h: 0.4,
      fontSize: 13, bold: true, color: C_TEXT_MAIN, fontFace: FONT_HEADING
    });

    s7.addText(c.desc, {
      x: xPos + 0.2, y: yPos + 0.95, w: 5.5, h: 1.55,
      fontSize: 10, color: C_TEXT_BODY, fontFace: FONT_BODY, lineSpacing: 14
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 8: Flagship 4 - Anti-Proxy QR Attendance Gate
  // ─────────────────────────────────────────────────────────────
  const s8 = pptx.addSlide();
  addHeader(s8, 'Flagship 4: Anti-Proxy QR Attendance Gate', 'VERIFIED PHYSICAL PARTICIPATION');

  const s8Steps = [
    {
      step: 'Step 1: Dynamic QR Projection',
      desc: 'Faculty Coordinator opens /faculty/events and projects a live, time-sensitive dynamic QR code on the auditorium screen during the active event drive.',
      color: C_CYAN
    },
    {
      step: 'Step 2: Mobile Camera Scan',
      desc: 'Enrolled student volunteers open /student/events on their mobile smartphones and scan the live QR code using the built-in HTML5 camera scanner.',
      color: C_TEAL
    },
    {
      step: 'Step 3: Anti-Proxy Validation',
      desc: 'The edge gate authenticates active registration, verifies single-scan validity, prevents duplicate logins, and eliminates screenshot forwarding fraud.',
      color: C_GOLD
    },
    {
      step: 'Step 4: Automated Credit (+3 hrs)',
      desc: 'The system instantly records verified physical presence and credits +3 verified community service hours directly to the student portfolio transcript.',
      color: C_EMERALD
    }
  ];

  s8Steps.forEach((st, idx) => {
    const xPos = 0.6 + (idx * 3.1);
    s8.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 1.35, w: 2.9, h: 5.45,
      fill: { color: C_CARD_BG },
      line: { color: st.color, width: 1.25 },
      rectRadius: 0.2
    });

    s8.addShape(pptx.ShapeType.roundRect, {
      x: xPos + 0.15, y: 1.55, w: 0.6, h: 0.6,
      fill: { color: '0A1220' },
      line: { color: st.color, width: 1 },
      rectRadius: 0.12
    });
    s8.addText(`${idx + 1}`, {
      x: xPos + 0.15, y: 1.55, w: 0.6, h: 0.6,
      fontSize: 16, bold: true, color: st.color, align: 'center', valign: 'middle'
    });

    s8.addText(st.step, {
      x: xPos + 0.15, y: 2.3, w: 2.6, h: 0.6,
      fontSize: 12, bold: true, color: C_TEXT_MAIN, fontFace: FONT_HEADING
    });

    s8.addText(st.desc, {
      x: xPos + 0.15, y: 3.0, w: 2.6, h: 3.6,
      fontSize: 10, color: C_TEXT_BODY, fontFace: FONT_BODY, lineSpacing: 15
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 9: Flagship 5 - Dynamic Custom Forms Engine
  // ─────────────────────────────────────────────────────────────
  const s9 = pptx.addSlide();
  addHeader(s9, 'Flagship 5: Dynamic Custom Form Builder & Submissions', 'SURVEYS, REGISTRATIONS & ANALYTICS');

  const s9Features = [
    {
      title: '18+ Input Field Types',
      points: ['Short text & multi-line paragraphs', 'Single-select dropdowns & radio groups', 'Multi-select checkboxes & tag groups', 'Rating scales & linear 1-10 matrices', 'Yes/No toggles & file attachments'],
      color: C_CYAN
    },
    {
      title: 'Publishing Lifecycle',
      points: ['DRAFT: In-progress form composition', 'PUBLISHED: Live for student submissions', 'CLOSED: Archived read-only state', 'Branch scoping: Target specific units', 'Submission quota controls'],
      color: C_TEAL
    },
    {
      title: 'Multi-Stage Review Workflow',
      points: ['SUBMITTED: Initial volunteer entry', 'UNDER_REVIEW: Coordinator audit', 'APPROVED: Validated registration', 'REJECTED: Feedback note appended', 'Audit logs with reviewer names'],
      color: C_GOLD
    },
    {
      title: 'Visual Analytics & Excel Export',
      points: ['Real-time submission counters', 'Categorical response distribution charts', '1-Click .xlsx Excel matrix export', 'CSV export for external tools', 'Instant search by roll number'],
      color: C_PURPLE
    }
  ];

  s9Features.forEach((f, idx) => {
    const xPos = 0.6 + (idx * 3.1);
    s9.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 1.35, w: 2.9, h: 5.45,
      fill: { color: C_CARD_BG },
      line: { color: f.color, width: 1.25 },
      rectRadius: 0.2
    });

    s9.addText(f.title, {
      x: xPos + 0.15, y: 1.55, w: 2.6, h: 0.55,
      fontSize: 12, bold: true, color: f.color, fontFace: FONT_HEADING
    });

    s9.addText(f.points.map(p => `• ${p}`).join('\n\n'), {
      x: xPos + 0.15, y: 2.2, w: 2.6, h: 4.4,
      fontSize: 9.5, color: C_TEXT_BODY, fontFace: FONT_BODY, lineSpacing: 14
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 10: Flagship 6 - Faculty Leadership Showcase
  // ─────────────────────────────────────────────────────────────
  const s10 = pptx.addSlide();
  addHeader(s10, 'Flagship 6: Faculty Leadership Showcase & Public Directory', 'CAMPUS TRANSPARENCY & DESK');

  const s10Sections = [
    {
      title: 'Program Coordinator (PC) Spotlight',
      color: C_CYAN,
      items: [
        '• Institutional Vision: Highlights the Program Coordinator vision, message, and guidance.',
        '• Public Spotlight Card: Prominently featured on the main portal landing page.',
        '• Milestone Achievements: Highlights university awards, state recognitions, and major social drives.',
        '• Full Profile Visibility: Designation, official email, and contact channel.'
      ]
    },
    {
      title: 'Program Officers (POs) Directory',
      color: C_TEAL,
      items: [
        '• All 10 Engineering Branches: Lists departmental faculty coordinators with unit badges.',
        '• Dynamic Admin Manager (/admin/faculty-desk): Real-time CRUD tool to update bios and photos.',
        '• Visibility Controls: 1-click toggle to show or hide faculty profiles.',
        '• Direct Volunteer Routing: Students can directly locate their departmental unit officer.'
      ]
    },
    {
      title: 'Public Visitor Directory (/visitor)',
      color: C_GOLD,
      items: [
        '• Open Community Statistics: Live totals of active volunteers, drives executed, and service hours.',
        '• Verified Volunteer Roster: Public directory with achievement tiers (Bronze ➔ Platinum).',
        '• Activity Photo Feed: Real-time drive memories with departmental unit badges.',
        '• Strict Privacy Compliance: Mobile numbers and private emails are strictly shielded.'
      ]
    }
  ];

  s10Sections.forEach((sec, idx) => {
    const xPos = 0.6 + (idx * 4.15);
    s10.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 1.35, w: 3.85, h: 5.45,
      fill: { color: C_CARD_BG },
      line: { color: sec.color, width: 1.25 },
      rectRadius: 0.2
    });

    s10.addText(sec.title, {
      x: xPos + 0.2, y: 1.55, w: 3.45, h: 0.5,
      fontSize: 12.5, bold: true, color: sec.color, fontFace: FONT_HEADING
    });

    s10.addText(sec.items.join('\n\n'), {
      x: xPos + 0.2, y: 2.2, w: 3.45, h: 4.4,
      fontSize: 10, color: C_TEXT_BODY, fontFace: FONT_BODY, lineSpacing: 15
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 11: Flagship 7 - Gamification & myBharat Sync
  // ─────────────────────────────────────────────────────────────
  const s11 = pptx.addSlide();
  addHeader(s11, 'Flagship 7: Gamified Portfolios & Government myBharat Sync', 'VOLUNTEER MOTIVATION & RECOGNITION');

  const badges = [
    { tier: '🥉 Bronze Tier', pts: '< 50 Points', desc: 'Foundational entry-level participation in campus cleanliness & plantation drives.', color: 'CD7F32' },
    { tier: '🥈 Silver Tier', pts: '50 – 149 Points', desc: 'Active volunteer contributing across multiple blood donation and awareness camps.', color: 'C0C0C0' },
    { tier: '🥇 Gold Tier', pts: '150 – 299 Points', desc: 'Distinguished volunteer & student coordinator driving departmental campaigns.', color: 'FFD700' },
    { tier: '💎 Platinum Tier', pts: '300+ Points', desc: 'Exceptional institutional social impact awardee with outstanding service leadership.', color: '00FFFF' }
  ];

  badges.forEach((b, idx) => {
    const xPos = 0.6 + (idx * 3.1);
    s11.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 1.35, w: 2.9, h: 2.4,
      fill: { color: C_CARD_BG },
      line: { color: b.color, width: 1.25 },
      rectRadius: 0.15
    });

    s11.addText(b.tier, { x: xPos + 0.15, y: 1.5, w: 2.6, h: 0.35, fontSize: 12.5, bold: true, color: b.color, fontFace: FONT_HEADING });
    s11.addText(b.pts, { x: xPos + 0.15, y: 1.9, w: 2.6, h: 0.3, fontSize: 10, bold: true, color: C_TEXT_MAIN });
    s11.addText(b.desc, { x: xPos + 0.15, y: 2.25, w: 2.6, h: 1.4, fontSize: 9, color: C_TEXT_BODY, lineSpacing: 13 });
  });

  // Lower Government Integration Box
  s11.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 3.95, w: 12.13, h: 2.85,
    fill: { color: C_CARD_BG },
    line: { color: C_TEAL, width: 1 },
    rectRadius: 0.2
  });

  s11.addText('🏛️ Official Government myBharat Portal Integration & Service Transcripts', {
    x: 0.9, y: 4.15, w: 11.5, h: 0.35,
    fontSize: 12.5, bold: true, color: C_TEAL, fontFace: FONT_HEADING
  });

  const govtFeatures = [
    '• myBharat National ID Sync: Student volunteers link their official Ministry of Youth Affairs myBharat volunteer IDs directly in /student/profile.',
    '• Verified Certificate Repository: Cloud storage and URL verification for state and national level NSS camp participation certificates.',
    '• Printable Institutional Service Transcript (/student/portfolio): Generates clean, printable transcripts summarizing total verified service hours, completed campaigns, and achievement badges for job and higher-education applications.'
  ];
  s11.addText(govtFeatures.join('\n\n'), {
    x: 0.9, y: 4.6, w: 11.5, h: 2.0,
    fontSize: 10, color: C_TEXT_BODY, fontFace: FONT_BODY, lineSpacing: 14
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 12: Live Demo Script & Access Roster
  // ─────────────────────────────────────────────────────────────
  const s12 = pptx.addSlide();
  addHeader(s12, 'Live Demonstration Walkthrough & Test Accounts Roster', 'PRESENTATION GUIDE & CREDENTIALS');

  // Left Box: 5-Step Demo
  s12.addShape(pptx.ShapeType.roundRect, {
    x: 0.6, y: 1.35, w: 5.9, h: 5.45,
    fill: { color: C_CARD_BG },
    line: { color: C_CYAN, width: 1.25 },
    rectRadius: 0.2
  });
  s12.addText('🎬 10-Minute Live Presentation Script', {
    x: 0.85, y: 1.55, w: 5.4, h: 0.35,
    fontSize: 12, bold: true, color: C_CYAN, fontFace: FONT_HEADING
  });
  const liveSteps = [
    '1. Public Visitor Portal (/visitor): Show home page leadership spotlight, activity photo stream & department directory.',
    '2. Admin AY Monitoring (/admin/monitoring): Switch academic years, show 10-branch matrix & export institutional CSV.',
    '3. Financial Audit Ledger (/admin/finance): Demonstrate budget vs spend meters, category breakdowns & proof receipts.',
    '4. Faculty Coordinator (/faculty/events): Show unit event updates, in-browser photo compressor & attendance viewer.',
    '5. Student Volunteer View (/student/events): Demonstrate HTML5 mobile camera QR attendance scanning & portfolio.'
  ];
  s12.addText(liveSteps.join('\n\n'), {
    x: 0.85, y: 2.0, w: 5.4, h: 4.6,
    fontSize: 9.5, color: C_TEXT_BODY, fontFace: FONT_BODY, lineSpacing: 14
  });

  // Right Box: Demo Credentials
  s12.addShape(pptx.ShapeType.roundRect, {
    x: 6.8, y: 1.35, w: 5.9, h: 5.45,
    fill: { color: C_CARD_BG },
    line: { color: C_TEAL, width: 1.25 },
    rectRadius: 0.2
  });
  s12.addText('🔑 Pre-Configured Demo Accounts Roster', {
    x: 7.05, y: 1.55, w: 5.4, h: 0.35,
    fontSize: 12, bold: true, color: C_TEAL, fontFace: FONT_HEADING
  });
  const demoAccounts = [
    '• System Admin 1: admin1@erp.com / Admin@12345 (Master Authority)',
    '• System Admin 2: admin2@erp.com / Admin@12345 (Operations & Finance)',
    '• Faculty Coordinator (CSE): faculty.cse@erp.com / Faculty@12345',
    '• Faculty Coordinator (ECE): faculty.ece@erp.com / Faculty@12345',
    '• Student Coordinator: lead.cse1@erp.com / Student@12345 (CSE Lead)',
    '• Student Volunteer: student.cse1@erp.com / Student@12345 (Volunteer)',
    '• Production URL: https://erp-tan-six.vercel.app'
  ];
  s12.addText(demoAccounts.join('\n\n'), {
    x: 7.05, y: 2.0, w: 5.4, h: 4.6,
    fontSize: 9.5, color: C_TEXT_MAIN, fontFace: FONT_BODY, lineSpacing: 14
  });

  // Write out the file
  const fileName = 'VVITU_NSS_ERP_Presentation.pptx';
  await pptx.writeFile({ fileName });
  console.log(`✨ Optimized presentation saved as ${fileName}`);
}

buildOptimizedPresentation().catch(err => {
  console.error('Failed to build optimized presentation:', err);
  process.exit(1);
});
