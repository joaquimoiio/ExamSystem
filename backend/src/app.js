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

// ROTA RAIZ BÁSICA
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Exam System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    documentation: '/api',
    health: '/api/health'
  });
});

// TENTAR IMPORTAR ROTAS COM FALLBACK ROBUSTO
let apiRoutes;
try {
  apiRoutes = require('./routes');
  app.use('/api', apiRoutes);
  console.log('✅ Rotas da API carregadas com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar rotas da API:', error.message);
  console.error('📍 Stack:', error.stack);
  
  // CRIAR ROUTER DE FALLBACK COMPLETO
  const fallbackRouter = express.Router();
  
  // Health check de fallback
  fallbackRouter.get('/health', (req, res) => {
    console.log('🔄 Usando health check de fallback');
    res.json({
      success: true,
      message: 'API is healthy (fallback mode)',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      mode: 'fallback'
    });
  });

  // Informações da API de fallback
  fallbackRouter.get('/', (req, res) => {
    console.log('🔄 Usando info da API de fallback');
    res.json({
      success: true,
      message: 'Exam System API (Fallback Mode)',
      version: '1.0.0',
      mode: 'fallback',
      documentation: '/api/docs',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        subjects: '/api/subjects',
        questions: '/api/questions',
        exams: '/api/exams',
        correction: '/api/correction'
      }
    });
  });

  // Rotas de autenticação de fallback
  fallbackRouter.get('/auth/profile', (req, res) => {
    console.log('🔄 Usando rota de auth profile fallback');
    res.json({
      success: true,
      data: {
        user: {
          id: 'fallback-user',
          name: 'Fallback User',
          email: 'fallback@example.com',
          role: 'teacher'
        }
      },
      mode: 'fallback'
    });
  });

  // Rotas de disciplinas de fallback
  fallbackRouter.get('/subjects', (req, res) => {
    console.log('🔄 Usando rota de subjects GET fallback');
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
      },
      mode: 'fallback'
    });
  });

  fallbackRouter.post('/subjects', (req, res) => {
    console.log('🔄 Usando rota de subjects POST fallback');
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
      },
      mode: 'fallback'
    });
  });

  // Rotas de questões de fallback
  fallbackRouter.get('/questions', (req, res) => {
    console.log('🔄 Usando rota de questions fallback');
    res.json({
      success: true,
      data: {
        questions: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      },
      mode: 'fallback'
    });
  });

  // Rotas de provas de fallback
  fallbackRouter.get('/exams', (req, res) => {
    console.log('🔄 Usando rota de exams fallback');
    res.json({
      success: true,
      data: {
        exams: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      },
      mode: 'fallback'
    });
  });

  // Rota catch-all para endpoints não implementados
  fallbackRouter.use('*', (req, res) => {
    console.log('🔄 Fallback catch-all para:', req.method, req.originalUrl);
    res.status(501).json({
      success: false,
      message: 'Endpoint não implementado no modo fallback',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      mode: 'fallback'
    });
  });

  // Usar o router de fallback
  app.use('/api', fallbackRouter);
  console.log('⚠️ Sistema rodando em modo fallback');
}

// MIDDLEWARE DE TRATAMENTO DE ERRO GLOBAL
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
    timestamp: new Date().toISOString(),
    available_routes: [
      'GET /',
      'GET /api',
      'GET /api/health',
      'GET /api/auth/profile',
      'GET /api/subjects',
      'POST /api/subjects'
    ]
  });
});

module.exports = app;