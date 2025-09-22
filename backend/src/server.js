const app = require('./app');
const { sequelize } = require('./models');
const winston = require('winston');

const PORT = process.env.PORT || 5000;

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'exam-system-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: process.env.LOG_FILE || 'logs/combined.log' }),
  ],
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Test database connection
async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');
    logger.info('ℹ️  Database schema should be created manually using setup-database.sql');
  } catch (error) {
    logger.error('❌ Unable to connect to database:', error);
    logger.error('ℹ️  Make sure PostgreSQL is running and database is created using setup-database.sql');
    process.exit(1);
  }
}

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  try {
    await sequelize.close();
    logger.info('✅ Database connection closed');
  } catch (error) {
    logger.error('❌ Error closing database connection:', error);
  }
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled promise rejection handler
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start server
async function startServer() {
  try {
    await testDatabaseConnection();
    
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api/health`);
    });

    // Handle server errors
    server.on('error', (error) => {
      logger.error('❌ Server error:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();