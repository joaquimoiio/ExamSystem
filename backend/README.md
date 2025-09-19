# Backend - Sistema de Provas

API REST desenvolvida em Node.js + Express.js para o sistema de provas online. Fornece endpoints para autenticação, gestão de disciplinas, questões, provas e correções automáticas.

## 🏗️ Arquitetura

### Stack Tecnológico
- **Node.js** >= 16.0.0
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **Sequelize** - ORM para PostgreSQL
- **JWT** - Autenticação stateless
- **PDFKit** - Geração de PDFs
- **Nodemailer** - Envio de emails
- **Winston** - Sistema de logs

### Estrutura de Diretórios
```
backend/
├── src/
│   ├── app.js              # Configuração do Express
│   ├── server.js           # Servidor principal
│   ├── config/            # Configurações (DB, email, etc)
│   ├── controllers/       # Controladores da API
│   ├── middleware/        # Middlewares customizados
│   ├── models/           # Modelos Sequelize
│   ├── routes/           # Definição de rotas
│   ├── services/         # Lógica de negócio
│   └── utils/            # Utilitários e helpers
├── uploads/              # Arquivos de upload
├── tests/               # Testes automatizados
└── package.json
```

## 🚀 Instalação e Execução

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Banco de dados
DB_NAME=exam_system
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET=seu_jwt_secret_muito_seguro
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=seu_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Email (opcional para notificações)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app

# Servidor
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Upload de arquivos
MAX_FILE_SIZE=5242880  # 5MB
```

### 3. Configurar banco de dados
```bash
# Criar banco de dados
npm run db:create

# Executar migrações
npm run db:migrate

# Popular com dados iniciais (opcional)
npm run db:seed

# Ou resetar tudo de uma vez
npm run db:reset
```

### 4. Executar aplicação
```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

O servidor estará disponível em `http://localhost:5000`

## 📋 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento com auto-reload
npm start           # Servidor de produção
npm test            # Executar testes com Jest
npm run db:create   # Criar banco de dados
npm run db:migrate  # Executar migrações
npm run db:seed     # Popular banco com dados iniciais
npm run db:reset    # Resetar banco completamente
```

## 🛣️ Rotas da API

Base URL: `http://localhost:5000/api`

### Autenticação (`/auth`)
- `POST /auth/register` - Registrar novo usuário
- `POST /auth/login` - Login do usuário
- `POST /auth/refresh` - Renovar token JWT
- `GET /auth/profile` - Obter perfil do usuário
- `PUT /auth/profile` - Atualizar perfil
- `POST /auth/logout` - Logout

### Disciplinas (`/subjects`)
- `GET /subjects` - Listar disciplinas
- `POST /subjects` - Criar disciplina
- `GET /subjects/:id` - Obter disciplina específica
- `PUT /subjects/:id` - Atualizar disciplina
- `DELETE /subjects/:id` - Excluir disciplina

### Questões (`/questions`)
- `GET /questions` - Listar questões (com filtros)
- `POST /questions` - Criar questão
- `GET /questions/:id` - Obter questão específica
- `PUT /questions/:id` - Atualizar questão
- `DELETE /questions/:id` - Excluir questão
- `POST /questions/bulk` - Importar questões em lote

### Provas (`/exams`)
- `GET /exams` - Listar provas
- `POST /exams` - Criar prova
- `GET /exams/:id` - Obter prova específica
- `PUT /exams/:id` - Atualizar prova
- `DELETE /exams/:id` - Excluir prova
- `POST /exams/:id/variations` - Gerar variações da prova
- `GET /exams/:id/pdf` - Gerar PDF da prova
- `GET /exams/variation/:variationId` - Acessar variação específica

### Correções (`/corrections`)
- `POST /corrections/submit` - Submeter respostas para correção
- `GET /corrections/exam/:examId` - Estatísticas da prova
- `GET /corrections/student/:studentId` - Resultados do aluno
- `GET /corrections/export/:examId` - Exportar resultados

## 🗃️ Modelos de Dados

### User
```javascript
{
  id: UUID,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ENUM('admin', 'professor', 'student'),
  avatar: String (opcional),
  createdAt: Date,
  updatedAt: Date
}
```

### Subject
```javascript
{
  id: UUID,
  name: String,
  description: Text,
  code: String (unique),
  userId: UUID (Foreign Key),
  createdAt: Date,
  updatedAt: Date
}
```

### Question
```javascript
{
  id: UUID,
  title: String,
  content: Text,
  options: JSON Array,
  correctAnswer: String,
  difficulty: ENUM('easy', 'medium', 'hard'),
  type: ENUM('multiple_choice', 'true_false', 'essay'),
  subjectId: UUID (Foreign Key),
  image: String (opcional),
  createdAt: Date,
  updatedAt: Date
}
```

### Exam
```javascript
{
  id: UUID,
  title: String,
  description: Text,
  instructions: Text,
  duration: Integer (minutos),
  totalQuestions: Integer,
  subjectId: UUID (Foreign Key),
  createdBy: UUID (Foreign Key),
  status: ENUM('draft', 'published', 'finished'),
  startDate: Date,
  endDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### ExamVariation
```javascript
{
  id: UUID,
  examId: UUID (Foreign Key),
  variationNumber: Integer,
  qrCode: String,
  questionOrder: JSON Array,
  createdAt: Date,
  updatedAt: Date
}
```

### Answer
```javascript
{
  id: UUID,
  examVariationId: UUID (Foreign Key),
  studentId: UUID (Foreign Key),
  answers: JSON Object,
  score: Float,
  totalQuestions: Integer,
  correctAnswers: Integer,
  submittedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Serviços

### PDFService (`/services/pdfService.js`)
- Geração de provas em PDF
- Criação de QR codes
- Layout responsivo para impressão

### EmailService (`/services/emailService.js`)
- Envio de notificações
- Templates de email personalizados
- Configuração SMTP

### ExamService (`/services/examService.js`)
- Algoritmo de geração de variações
- Distribuição inteligente de questões
- Lógica de correção automática

## 🛡️ Middleware

### Autenticação
- Verificação de tokens JWT
- Proteção de rotas privadas
- Renovação automática de tokens

### Validação
- Validação de dados com Joi
- Sanitização de inputs
- Tratamento de erros

### Segurança
- Rate limiting
- Helmet para headers de segurança
- CORS configurado
- Upload de arquivos seguro

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar testes específicos
npm test -- --grep "Auth"

# Executar com cobertura
npm test -- --coverage
```

### Estrutura de Testes
```
tests/
├── unit/           # Testes unitários
├── integration/    # Testes de integração
└── fixtures/       # Dados de teste
```

## 📊 Logs

O sistema utiliza Winston para logging:

- **Desenvolvimento**: Logs no console com cores
- **Produção**: Logs em arquivos rotativos

Localização dos logs: `logs/`
- `error.log` - Apenas erros
- `combined.log` - Todos os logs

## 🔒 Segurança

### Implementadas
- Autenticação JWT com refresh tokens
- Hash de senhas com bcrypt
- Rate limiting por IP
- Validação rigorosa de dados
- Headers de segurança (Helmet)
- CORS configurado
- Upload de arquivos validado

### Recomendações para Produção
- Use HTTPS sempre
- Configure variáveis de ambiente seguras
- Monitore logs de erro
- Implemente backup automático do banco
- Configure firewall adequado

## 🚀 Deploy

### Preparação
1. Configure variáveis de ambiente de produção
2. Execute migrações do banco
3. Configure proxy reverso (nginx)
4. Configure SSL/TLS

### PM2 (Recomendado)
```bash
npm install -g pm2
pm2 start src/server.js --name "exam-system-api"
pm2 save
pm2 startup
```

## 🤝 Contribuição

1. Siga o padrão de código existente
2. Adicione testes para novas funcionalidades
3. Atualize documentação quando necessário
4. Use commits descritivos

## 📞 Suporte

Para dúvidas técnicas ou bugs, abra uma issue no repositório com:
- Descrição detalhada do problema
- Steps para reproduzir
- Logs relevantes
- Ambiente (OS, Node.js version, etc.)