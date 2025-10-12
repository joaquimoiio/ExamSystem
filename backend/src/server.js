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

// Função para criar dados iniciais (seed)
async function seedInitialData() {
  try {
    const { Plan } = require('./models');

    // Verificar se já existem planos
    const existingPlans = await Plan.count();

    if (existingPlans === 0) {
      logger.info('🌱 Criando dados iniciais...');

      // Criar planos padrão
      await Plan.bulkCreate([
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'free',
          displayName: 'Plano Gratuito',
          description: 'Plano gratuito com limitações básicas',
          price: 0.00,
          maxSubjects: 2,
          maxQuestions: 50,
          maxExams: 3,
          isActive: true,
          features: { pdfExport: true, basicSupport: true }
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'plus',
          displayName: 'Plano Plus',
          description: 'Plano completo com recursos ilimitados',
          price: 29.90,
          maxSubjects: -1,
          maxQuestions: -1,
          maxExams: -1,
          isActive: true,
          features: {
            pdfExport: true,
            advancedAnalytics: true,
            prioritySupport: true,
            customBranding: true
          }
        }
      ]);

      logger.info('✅ Dados iniciais criados com sucesso');
    } else {
      logger.info(`ℹ️  Dados iniciais já existem (${existingPlans} planos encontrados)`);
    }
  } catch (error) {
    logger.warn('⚠️  Erro ao criar dados iniciais:', error.message);
  }
}

// Test database connection and sync
async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Conexão com o banco de dados estabelecida com sucesso');

    // Sincronizar automaticamente o schema (igual Spring Boot JPA)
    // alter: true -> Atualiza as tabelas existentes sem perder dados
    // force: false -> NÃO apaga dados existentes
    logger.info('🔄 Sincronizando schema do banco de dados...');

    await sequelize.sync({ alter: true });

    logger.info('✅ Schema sincronizado com sucesso');
    logger.info('📊 Tabelas criadas/atualizadas automaticamente');

    // Criar dados iniciais se necessário
    await seedInitialData();

  } catch (error) {
    logger.error('❌ Erro ao conectar com o banco de dados:', error);
    logger.error('ℹ️  Verifique se o PostgreSQL está rodando e as credenciais no .env estão corretas');

    // Mostrar detalhes da configuração (sem mostrar senha)
    logger.error('📝 Configuração atual:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    });

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