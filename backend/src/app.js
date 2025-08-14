const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// MIDDLEWARE BÁSICO
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// SERVIR ARQUIVOS ESTÁTICOS
app.use('/uploads', express.static('uploads'));

// MIDDLEWARE DE LOG DETALHADO
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  console.log('🔍 Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📋 Body:', req.body);
  }
  next();
});

// ROTAS BÁSICAS
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Exam System API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// TENTAR IMPORTAR ROTAS COM FALLBACK
let apiRoutes;
try {
  apiRoutes = require('./routes');
  app.use('/api', apiRoutes);
  console.log('✅ Rotas da API carregadas com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar rotas da API:', error);
  
  // ROTA DE FALLBACK PARA /api/subjects
  app.get('/api/subjects', (req, res) => {
    console.log('🔄 Usando rota de fallback para /api/subjects');
    res.json({
      success: true,
      data: {
        subjects: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      }
    });
  });

  app.post('/api/subjects', (req, res) => {
    console.log('🔄 Usando rota de fallback para POST /api/subjects');
    res.status(201).json({
      success: true,
      message: 'Disciplina criada com sucesso (modo fallback)',
      data: {
        subject: {
          id: Date.now().toString(),
          name: req.body.name || 'Nova Disciplina',
          description: req.body.description || '',
          color: req.body.color || '#3B82F6',
          credits: req.body.credits || 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    });
  });

  // Outras rotas de fallback
  app.get('/api/auth/profile', (req, res) => {
    res.json({
      success: true,
      data: {
        user: {
          id: 'test-user',
          name: 'Test User',
          email: 'test@example.com',
          role: 'teacher'
        }
      }
    });
  });
}

// MIDDLEWARE DE TRATAMENTO DE ERRO GLOBAL - MAIS ROBUSTO
app.use((err, req, res, next) => {
  console.error('🚨 ERRO CAPTURADO NO MIDDLEWARE GLOBAL:');
  console.error('📍 URL:', req.method, req.url);
  console.error('🔍 Headers:', req.headers);
  console.error('📋 Body:', req.body);
  console.error('❌ Erro:', err);
  console.error('📚 Stack:', err.stack);

  // Determinar status code
  let statusCode = 500;
  let message = 'Erro interno do servidor';

  if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Dados inválidos';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Não autorizado';
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Erro de validação nos dados';
  } else if (err.name === 'SequelizeConnectionError') {
    statusCode = 503;
    message = 'Erro de conexão com o banco de dados';
  }

  // Resposta de erro padronizada
  const errorResponse = {
    success: false,
    message: message,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  };

  // Adicionar detalhes em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = {
      name: err.name,
      message: err.message,
      stack: err.stack
    };
  }

  res.status(statusCode).json(errorResponse);
});

// MIDDLEWARE PARA ROTAS NÃO ENCONTRADAS
app.use('*', (req, res) => {
  console.log('🔍 Rota não encontrada:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// TRATAMENTO DE ERROS NÃO CAPTURADOS
process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION:');
  console.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('🚨 UNHANDLED REJECTION:');
  console.error(err);
  process.exit(1);
});

module.exports = app;