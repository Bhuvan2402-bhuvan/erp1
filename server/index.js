require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev/staging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-email', 'x-user-role']
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoints for Render
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'VVITU NSS ERP Backend', uptime: process.uptime() }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', storage: 'Cloudflare R2', timestamp: new Date().toISOString() }));

// Mount API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/users', require('./routes/users'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/documentation', require('./routes/documentation'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/points', require('./routes/points'));
app.use('/api/warnings', require('./routes/warnings'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/faculty-desk', require('./routes/faculty-desk'));
app.use('/api/campaign-widget', require('./routes/campaign-widget'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/public', require('./routes/public'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.path}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Express Error]', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 VVITU NSS ERP Express Backend running on port ${PORT}`);
  console.log(`📡 Cloudflare R2 Storage Bucket: ${process.env.CLOUDFLARE_R2_BUCKET_NAME || 'vvitu-erp-storage'}`);
});

module.exports = app;
