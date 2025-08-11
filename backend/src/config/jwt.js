require('dotenv').config();

const jwtConfig = {
  secret: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Token generation options
  issuer: 'exam-system',
  audience: 'exam-system-users',
  
  // Refresh token configuration
  refreshExpiresIn: '30d',
  
  // Password reset token configuration
  resetTokenExpiresIn: '1h',
  
  // Email verification token configuration
  verifyTokenExpiresIn: '24h',
};

module.exports = jwtConfig;