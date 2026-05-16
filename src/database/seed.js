const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('./connection');
const { getRedisClient } = require('./redis');

async function seed() {
  try {
    console.log('Starting database seeding...');

    const adminUserId = uuidv4();
    const testUserId = uuidv4();
    const adminPassword = await bcrypt.hash('admin123', 10);
    const testPassword = await bcrypt.hash('test123', 10);

    await db.query(
      `INSERT IGNORE INTO users (id, username, email, password_hash, display_name, email_verified, enabled, locale)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [adminUserId, 'admin', 'admin@example.com', adminPassword, 'System Administrator', true, true, 'zh-CN']
    );

    await db.query(
      `INSERT IGNORE INTO users (id, username, email, password_hash, display_name, email_verified, enabled, locale, phone, qq)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [testUserId, 'testuser', 'test@example.com', testPassword, 'Test User', true, true, 'zh-CN', '13800138000', '123456789']
    );

    const publicClientId = uuidv4();
    const confidentialClientId = uuidv4();

    await db.query(
      `INSERT IGNORE INTO clients (id, client_id, client_name, redirect_uris, grant_types, response_types, token_endpoint_auth_method, pkce_required)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        publicClientId,
        'public-client-app',
        'Public Client Application',
        JSON.stringify(['http://localhost:8080/callback', 'http://localhost:3001/callback']),
        JSON.stringify(['authorization_code', 'implicit']),
        JSON.stringify(['code', 'token', 'id_token']),
        'none',
        true
      ]
    );

    const hashedSecret = await bcrypt.hash('confidential-secret', 10);

    await db.query(
      `INSERT IGNORE INTO clients (id, client_id, client_secret, client_name, redirect_uris, grant_types, response_types, token_endpoint_auth_method, pkce_required)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        confidentialClientId,
        'confidential-client-app',
        hashedSecret,
        'Confidential Client Application',
        JSON.stringify(['http://localhost:8080/callback', 'http://localhost:3001/callback']),
        JSON.stringify(['authorization_code', 'refresh_token']),
        JSON.stringify(['code']),
        'client_secret_basic',
        false
      ]
    );

    const redis = getRedisClient();
    await redis.set('seed:completed', 'true', 'EX', 3600);

    console.log('Database seeding completed successfully');
    console.log('Admin user: admin@example.com / admin123');
    console.log('Test user: test@example.com / test123');
    console.log('Public client ID: public-client-app');
    console.log('Confidential client ID: confidential-client-app (secret: confidential-secret)');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seed };
