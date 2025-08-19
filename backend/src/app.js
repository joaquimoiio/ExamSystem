const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// MIDDLEWARE BÁSICO
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MIDDLEWARE DE LOG
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// ROTA RAIZ
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Exam System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    health: '/api/health'
  });
});

// IMPORTAR E USAR ROTAS DA API
try {
  const apiRoutes = require('./routes');
  app.use('/api', apiRoutes);
  console.log('✅ API routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading API routes:', error);
  
  // Router de fallback mínimo
  const fallbackRouter = express.Router();
  
  fallbackRouter.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'API is healthy (fallback mode)',
      timestamp: new Date().toISOString()
    });
  });
  
  fallbackRouter.use('*', (req, res) => {
    res.status(500).json({
      success: false,
      message: 'API routes not available',
      error: 'Internal server error'
    });
  });
  
  app.use('/api', fallbackRouter);
}

// MIDDLEWARE DE ERRO GLOBAL
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// CATCH-ALL PARA ROTAS NÃO ENCONTRADAS
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;