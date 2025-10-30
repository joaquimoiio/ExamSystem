const express = require('express');
const router = express.Router();

// Import routes with fallback
let authRoutes, subjectRoutes, questionRoutes, examRoutes, examHeaderRoutes, correctionRoutes, planRoutes, subscriptionRoutes;

try {
  authRoutes = require('./auth');
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
  authRoutes = express.Router();
  authRoutes.post('/login', (req, res) => {
    res.status(500).json({ success: false, message: 'Auth module not available' });
  });
}

try {
  subjectRoutes = require('./subjects');
  console.log('✅ Subject routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading subject routes:', error.message);
  subjectRoutes = express.Router();
  subjectRoutes.get('/', (req, res) => {
    res.json({ success: true, data: { subjects: [], total: 0 } });
  });
  subjectRoutes.get('/stats', (req, res) => {
    res.json({ success: true, data: { total: 0 } });
  });
}

try {
  questionRoutes = require('./questions');
  console.log('✅ Question routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading question routes:', error.message);
  questionRoutes = express.Router();
  questionRoutes.get('/', (req, res) => {
    res.json({ success: true, data: { questions: [], total: 0 } });
  });
  questionRoutes.get('/stats', (req, res) => {
    res.json({ success: true, data: { total: 0 } });
  });
}

try {
  examRoutes = require('./exams');
  console.log('✅ Exam routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading exam routes:', error.message);
  examRoutes = express.Router();
  examRoutes.get('/', (req, res) => {
    res.json({ success: true, data: { exams: [], total: 0 } });
  });
  examRoutes.get('/stats', (req, res) => {
    res.json({ success: true, data: { total: 0, published: 0 } });
  });
}

try {
  examHeaderRoutes = require('./examHeaders');
  console.log('✅ Exam header routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading exam header routes:', error.message);
  examHeaderRoutes = express.Router();
  examHeaderRoutes.get('/', (req, res) => {
    res.json({ success: true, data: { headers: [], total: 0 } });
  });
}

try {
  correctionRoutes = require('./corrections');
  console.log('✅ Correction routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading correction routes:', error.message);
  correctionRoutes = express.Router();
  correctionRoutes.post('/validate-qr', (req, res) => {
    res.status(500).json({ success: false, message: 'Correction module not available' });
  });
  correctionRoutes.post('/correct-exam', (req, res) => {
    res.status(500).json({ success: false, message: 'Correction module not available' });
  });
}

try {
  planRoutes = require('./planRoutes');
  console.log('✅ Plan routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading plan routes:', error.message);
  planRoutes = express.Router();
  planRoutes.get('/plans', (req, res) => {
    res.json({ success: true, data: [] });
  });
  planRoutes.get('/my-plan', (req, res) => {
    res.json({ success: true, data: { plan: { name: 'free' }, usage: {} } });
  });
}

try {
  subscriptionRoutes = require('./subscriptions');
  console.log('✅ Subscription routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading subscription routes:', error.message);
  subscriptionRoutes = express.Router();
  subscriptionRoutes.get('/status', (req, res) => {
    res.json({ success: true, data: { status: 'pending' } });
  });
}

// API info
router.get('/', (req, res) => {
  console.log('📋 API info accessed');
  res.json({
    success: true,
    message: 'Exam System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      health: '/api/health'
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  console.log('💚 Health check accessed');
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Recent Activity endpoint
router.get('/activity/recent', async (req, res) => {
  console.log('📋 Buscando atividade recente');
  try {
    const { Subject, Question, Exam, User } = require('../models');

    // Buscar atividades recentes dos últimos 7 dias
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);

    const activities = [];

    // Buscar disciplinas criadas recentemente
    const recentSubjects = await Subject.findAll({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: recentDate
        }
      },
      include: [{
        model: User,
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Buscar questões criadas recentemente
    const recentQuestions = await Question.findAll({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: recentDate
        }
      },
      include: [{
        model: Subject,
        attributes: ['name']
      }, {
        model: User,
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Buscar provas criadas recentemente
    const recentExams = await Exam.findAll({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: recentDate
        }
      },
      include: [{
        model: Subject,
        attributes: ['name']
      }, {
        model: User,
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Processar disciplinas
    recentSubjects.forEach(subject => {
      activities.push({
        id: `subject_${subject.id}`,
        type: 'subject',
        action: 'criou a disciplina',
        item: subject.name,
        user: subject.User?.name || 'Usuário',
        time: subject.createdAt,
        icon: 'BookOpen',
        color: 'primary'
      });
    });

    // Processar questões
    recentQuestions.forEach(question => {
      activities.push({
        id: `question_${question.id}`,
        type: 'question',
        action: 'criou a questão',
        item: `${question.title} (${question.Subject?.name})`,
        user: question.User?.name || 'Usuário',
        time: question.createdAt,
        icon: 'FileText',
        color: 'success'
      });
    });

    // Processar provas
    recentExams.forEach(exam => {
      activities.push({
        id: `exam_${exam.id}`,
        type: 'exam',
        action: 'criou a prova',
        item: `${exam.title} (${exam.Subject?.name})`,
        user: exam.User?.name || 'Usuário',
        time: exam.createdAt,
        icon: 'BarChart3',
        color: 'warning'
      });
    });

    // Ordenar por data mais recente e limitar a 10 itens
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const limitedActivities = activities.slice(0, 10);

    // Formatar tempo relativo
    const formatRelativeTime = (date) => {
      const now = new Date();
      const diffInMinutes = Math.floor((now - new Date(date)) / (1000 * 60));

      if (diffInMinutes < 1) return 'agora mesmo';
      if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h atrás`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d atrás`;

      return new Date(date).toLocaleDateString('pt-BR');
    };

    // Formatar atividades para o frontend
    const formattedActivities = limitedActivities.map(activity => ({
      ...activity,
      time: formatRelativeTime(activity.time)
    }));

    console.log(`📋 Encontradas ${formattedActivities.length} atividades recentes`);

    res.json({
      success: true,
      data: formattedActivities
    });

  } catch (error) {
    console.error('❌ Erro ao buscar atividade recente:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Mount auth routes
router.use('/auth', authRoutes);

// Mount subscription routes
router.use('/assinatura', subscriptionRoutes);

// Mount other routes
router.use('/subjects', subjectRoutes);
router.use('/questions', questionRoutes);
router.use('/exams', examRoutes);
router.use('/exam-headers', examHeaderRoutes);
router.use('/corrections', correctionRoutes);
router.use('/', planRoutes);

// Catch-all for undefined routes
router.use('*', (req, res) => {
  console.log('❓ Undefined API route:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Endpoint da API não encontrado',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    available_endpoints: [
      'GET /api',
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/profile',
      'GET /api/subjects',
      'GET /api/subjects/stats',
      'GET /api/questions',
      'GET /api/questions/stats',
      'GET /api/exams',
      'GET /api/exams/stats'
    ]
  });
});

module.exports = router;