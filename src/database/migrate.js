const mysql = require('mysql2/promise');
const config = require('../config');

const migrations = [
  {
    name: 'create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        display_name VARCHAR(255),
        picture VARCHAR(512),
        email_verified BOOLEAN DEFAULT FALSE,
        phone VARCHAR(20),
        phone_verified BOOLEAN DEFAULT FALSE,
        locale VARCHAR(10),
        zoneinfo VARCHAR(50),
        qq VARCHAR(20),
        enabled BOOLEAN DEFAULT TRUE,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        register_ip VARCHAR(45),
        register_ip_location VARCHAR(255),
        last_login_ip VARCHAR(45),
        last_login_ip_location VARCHAR(255),
        last_login_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'create_clients_table',
    sql: `
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(36) PRIMARY KEY,
        client_id VARCHAR(255) UNIQUE NOT NULL,
        client_secret VARCHAR(255),
        client_name VARCHAR(255) NOT NULL,
        client_description TEXT,
        logo_uri VARCHAR(512),
        homepage_uri VARCHAR(512),
        redirect_uris JSON NOT NULL,
        post_logout_redirect_uris JSON,
        grant_types JSON NOT NULL,
        response_types JSON NOT NULL,
        token_endpoint_auth_method VARCHAR(50) NOT NULL DEFAULT 'client_secret_basic',
        pkce_required BOOLEAN DEFAULT FALSE,
        access_token_expires_in INT DEFAULT 3600,
        refresh_token_expires_in INT DEFAULT 604800,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_client_id (client_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'create_user_consents_table',
    sql: `
      CREATE TABLE IF NOT EXISTS user_consents (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        client_id VARCHAR(36) NOT NULL,
        scopes JSON NOT NULL,
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        UNIQUE KEY unique_user_client (user_id, client_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'create_authorization_codes_table',
    sql: `
      CREATE TABLE IF NOT EXISTS authorization_codes (
        code VARCHAR(255) PRIMARY KEY,
        client_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        redirect_uri VARCHAR(512) NOT NULL,
        scope VARCHAR(512),
        state VARCHAR(255),
        nonce VARCHAR(255),
        code_challenge VARCHAR(255),
        code_challenge_method VARCHAR(10),
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'create_access_tokens_table',
    sql: `
      CREATE TABLE IF NOT EXISTS access_tokens (
        id VARCHAR(36) PRIMARY KEY,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        client_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36),
        scopes TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token_hash (token_hash),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'create_refresh_tokens_table',
    sql: `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id VARCHAR(36) PRIMARY KEY,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        client_id VARCHAR(36),
        user_id VARCHAR(36) NOT NULL,
        scopes TEXT,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        revoked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token_hash (token_hash),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'create_oidc_sessions_table',
    sql: `
      CREATE TABLE IF NOT EXISTS oidc_sessions (
        id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(36),
        client_id VARCHAR(36) NOT NULL,
        state VARCHAR(255),
        nonce VARCHAR(255),
        oauth_state VARCHAR(255),
        redirect_uri VARCHAR(512),
        scopes TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        INDEX idx_session_id (session_id),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'create_social_connections_table',
    sql: `
      CREATE TABLE IF NOT EXISTS social_connections (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        provider_user_id VARCHAR(255) NOT NULL,
        provider_username VARCHAR(255),
        provider_email VARCHAR(255),
        provider_avatar VARCHAR(512),
        raw_profile TEXT,
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP NULL,
        linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_provider_account (provider, provider_user_id),
        INDEX idx_user_id (user_id),
        INDEX idx_provider (provider)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'create_user_credentials_table',
    sql: `
      CREATE TABLE IF NOT EXISTS user_credentials (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        credential_id VARCHAR(512) NOT NULL,
        credential_public_key TEXT NOT NULL,
        counter BIGINT DEFAULT 0,
        credential_type VARCHAR(50) DEFAULT 'public-key',
        attestation_type VARCHAR(50),
        transports JSON,
        aaguid VARCHAR(36),
        nickname VARCHAR(255),
        device_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_credential_id (credential_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  }
];

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${config.database.name}\``);

    for (const migration of migrations) {
      console.log(`Running migration: ${migration.name}`);
      await connection.query(migration.sql);
      console.log(`Completed: ${migration.name}`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrate, migrations };
