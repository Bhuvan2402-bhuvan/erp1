require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const app  = express();
const PORT = process.env.PORT || 10000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// ALLOWED_ORIGIN must be set in the Render environment.
// Supports a comma-separated list for multi-domain setups
// (e.g. "https://myapp.vercel.app,http://localhost:3000").

const rawOrigins = process.env.ALLOWED_ORIGIN || process.env.CORS_ORIGIN || '';

const allowedOrigins = rawOrigins
  ? rawOrigins.split(',').map(o => o.trim()).filter(Boolean)
  : [];

const corsOptions = {
  origin: (incomingOrigin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!incomingOrigin) return callback(null, true);

    // Development safety valve
    if (process.env.NODE_ENV !== 'production') return callback(null, true);

    if (allowedOrigins.length === 0 || allowedOrigins.includes(incomingOrigin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS: Origin "${incomingOrigin}" not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-user-id',
    'x-user-email',
    'x-user-role',
  ],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pre-flight for all routes

// ─── Body parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// ─── Request logging ──────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Health check ─────────────────────────────────────────────────────────────
// Lightweight endpoint used by external ping services to keep the Render
// free-tier instance alive and prevent cold-start sleep.

app.get('/health', (_req, res) =>
  res.json({
    status:  'ok',
    service: 'VVITU NSS ERP Backend',
    uptime:  process.uptime(),
    env:     process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  })
);

app.get('/api/health', (_req, res) =>
  res.json({
    status:    'ok',
    storage:   'Cloudflare R2',
    timestamp:  new Date().toISOString(),
  })
);

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/events',        require('./routes/events'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/attendance',    require('./routes/attendance'));
app.use('/api/certificates',  require('./routes/certificates'));
app.use('/api/documentation', require('./routes/documentation'));
app.use('/api/finance',       require('./routes/finance'));
app.use('/api/issues',        require('./routes/issues'));
app.use('/api/points',        require('./routes/points'));
app.use('/api/warnings',      require('./routes/warnings'));
app.use('/api/departments',   require('./routes/departments'));
app.use('/api/faculty-desk',  require('./routes/faculty-desk'));
app.use('/api/campaign-widget', require('./routes/campaign-widget'));
app.use('/api/testimonials',  require('./routes/testimonials'));
app.use('/api/public',        require('./routes/public'));
app.use('/api/chat',          require('./routes/chat'));
app.use('/api/admin',         require('./routes/admin'));

// NEW — Media / file storage (presigned R2 URLs)
app.use('/api/media',         require('./routes/media'));

// ─── 404 fallback ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.path}` });
});

// ─── Global error handler ─────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  // Surface CORS errors as 403 instead of 500
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ message: err.message });
  }

  console.error('[Unhandled Express Error]', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 VVITU NSS ERP Express Backend — port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`📡 Cloudflare R2 bucket  : ${process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME || 'vvitu-erp-storage'}`);
  console.log(`🌐 CORS allowed origins  : ${allowedOrigins.join(', ') || '(all — set ALLOWED_ORIGIN in production)'}`);
});

module.exports = app;
