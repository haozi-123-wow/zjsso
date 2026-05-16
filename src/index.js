const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { getPool, closePool } = require('./database/connection');
const { closeRedis } = require('./database/redis');

const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/email');
const geetestRoutes = require('./routes/geetest');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/geetest', geetestRoutes);

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