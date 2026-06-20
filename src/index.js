const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { getPool, closePool } = require('./database/connection');
const { closeRedis } = require('./database/redis');

const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/email');
const geetestRoutes = require('./routes/geetest');
const oidcRoutes = require('./routes/oidc');
const wellknownRoutes = require('./routes/wellknown');
const socialRoutes = require('./routes/social');
const webauthnRoutes = require('./routes/webauthn');
const adminRoutes = require('./routes/admin');
const groupRoutes = require('./routes/groups');
const uploadRoutes = require('./routes/upload');
const totpRoutes = require('./routes/totp');
const verifyRoutes = require('./routes/verify');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如服务器端调用、同源请求）
    if (!origin || config.app.frontendUrls.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/auth', socialRoutes);
app.use('/api', socialRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/geetest', geetestRoutes);
app.use('/api/webauthn', webauthnRoutes);
app.use('/api/auth', totpRoutes.router);
app.use('/api/auth', verifyRoutes);
app.use('/api', adminRoutes);
app.use('/api', groupRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/oauth', oidcRoutes);
app.use('/userinfo', oidcRoutes);
app.use('/.well-known', wellknownRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: '服务器内部错误',
    statusCode: 500
  });
});

async function start() {
  try {
    console.log('=== ZJSSO Configuration ===');
    console.log(`APP_PORT:         ${config.app.port}`);
    console.log(`APP_HOST:         ${config.app.host}`);
    console.log(`ISSUER:           ${config.app.issuer}`);
    console.log(`DB_HOST:          ${config.database.host}`);
    console.log(`DB_PORT:          ${config.database.port}`);
    console.log(`DB_USER:          ${config.database.user}`);
    console.log(`DB_NAME:          ${config.database.name}`);
    console.log(`REDIS_HOST:       ${config.redis.host}`);
    console.log(`REDIS_PORT:       ${config.redis.port}`);
    console.log(`SESSION_MODE:     ${config.session.mode}`);
    console.log(`==========================`);

    await getPool();
    console.log('Database connected');

    const server = app.listen(config.app.port, config.app.host, () => {
      console.log(`Server running at http://${config.app.host}:${config.app.port}`);
      console.log(`OIDC Issuer: ${config.app.issuer}`);
      console.log(`Session mode: ${config.session.mode}`);
    });

    const shutdown = async () => {
      console.log('\nShutting down gracefully...');
      server.close(async () => {
        await closePool();
        await closeRedis();
        console.log('All connections closed');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
