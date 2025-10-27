const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Simple in-memory session store (in production, use Redis or database)
const adminSessions = new Map();

// Admin credentials (in production, store hashed passwords in database)
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123!@#'
};

/**
 * Generate a secure session token
 */
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash password using SHA-256 (in production, use bcrypt)
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify admin credentials
 */
function verifyCredentials(username, password) {
  const hashedPassword = hashPassword(password);
  return username === ADMIN_CREDENTIALS.username && 
         hashedPassword === hashPassword(ADMIN_CREDENTIALS.password);
}

/**
 * Create admin session
 */
function createAdminSession(username) {
  const sessionToken = generateSessionToken();
  const sessionData = {
    username,
    createdAt: new Date(),
    lastAccessed: new Date()
  };
  
  adminSessions.set(sessionToken, sessionData);
  
  // Clean up expired sessions (older than 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  for (const [token, session] of adminSessions.entries()) {
    if (session.lastAccessed < oneDayAgo) {
      adminSessions.delete(token);
    }
  }
  
  return sessionToken;
}

/**
 * Verify admin session
 */
function verifyAdminSession(sessionToken) {
  if (!sessionToken || !adminSessions.has(sessionToken)) {
    return null;
  }
  
  const session = adminSessions.get(sessionToken);
  session.lastAccessed = new Date();
  
  // Check if session is expired (24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (session.lastAccessed < oneDayAgo) {
    adminSessions.delete(sessionToken);
    return null;
  }
  
  return session;
}

/**
 * Destroy admin session
 */
function destroyAdminSession(sessionToken) {
  if (sessionToken && adminSessions.has(sessionToken)) {
    adminSessions.delete(sessionToken);
    return true;
  }
  return false;
}

/**
 * Middleware to check admin authentication
 */
function requireAdminAuth(req, res, next) {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                      req.cookies?.adminSession;
  
  const session = verifyAdminSession(sessionToken);
  
  if (!session) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin authentication required'
    });
  }
  
  req.adminSession = session;
  next();
}

module.exports = {
  verifyCredentials,
  createAdminSession,
  verifyAdminSession,
  destroyAdminSession,
  requireAdminAuth
};
