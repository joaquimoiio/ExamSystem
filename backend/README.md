# Sistema de Provas Online - Backend

Sistema completo de geração e correção de provas online com múltiplas variações e correção automática via QR Code.

## 🚀 Funcionalidades Principais

### ✅ Gestão de Usuários
- Autenticação JWT com refresh tokens
- Roles de Admin e Professor
- Recuperação de senha via email
- Perfis de usuário personalizáveis

### ✅ Gestão de Disciplinas
- CRUD completo de disciplinas
- Cores personalizáveis
- Estatísticas por disciplina
- Sistema de duplicação

### ✅ Banco de Questões Inteligente
- Questões com múltiplas alternativas (2-5)
- Três níveis de dificuldade (Fácil, Médio, Difícil)
- Sistema de tags para organização
- Importação/exportação em JSON
- Estatísticas de desempenho por questão

### ✅ Gerador de Provas com Múltiplas Variações
- **Algoritmo inteligente** de distribuição de questões por dificuldade
- Geração automática de até 50 variações diferentes
- Embaralhamento de questões e alternativas
- QR Code único para cada variação
- Validação de disponibilidade de questões

### ✅ Sistema de Correção Automática
- Correção via QR Code mobile
- Interface de resposta otimizada para dispositivos móveis
- Feedback imediato com nota e estatísticas
- Relatórios detalhados de desempenho

### ✅ Geração de PDFs Profissionais
- PDFs únicos para cada variação
- Cabeçalhos personalizáveis
- QR Codes integrados
- Gabaritos separados
- Layout otimizado para impressão

### ✅ OCR e Digitalização
- Reconhecimento óptico de caracteres
- Processamento de gabaritos digitalizados
- Detecção automática de QR Codes
- Extração de informações do aluno

### ✅ Relatórios e Estatísticas
- Dashboard completo para professores
- Análise de desempenho por dificuldade
- Comparação entre variações
- Exportação de dados em múltiplos formatos
- Gráficos e métricas detalhadas

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js + Express.js
- **Banco de Dados**: PostgreSQL + Sequelize ORM
- **Autenticação**: JWT + bcrypt
- **Validação**: Joi
- **Upload de Arquivos**: Multer + Sharp
- **Geração de PDF**: PDFKit
- **QR Codes**: qrcode
- **OCR**: Tesseract.js
- **Email**: Nodemailer
- **Logs**: Winston
- **Segurança**: Helmet + CORS + Rate Limiting

## 📦 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <repository-url>
cd exam-system-backend
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_NAME=exam_system
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 4. Configure o banco de dados
```bash
# Criar banco de dados
npm run db:create

# Executar migrações
npm run db:migrate

# (Opcional) Executar seeds
npm run db:seed
```

### 5. Inicie o servidor
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

O servidor estará rodando em `http://localhost:5000`

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── app.js                     # Configuração do Express
│   ├── server.js                  # Inicialização do servidor
│   ├── config/
│   │   ├── database.js            # Configuração do Sequelize
│   │   └── jwt.js                 # Configuração JWT
│   ├── controllers/
│   │   ├── authController.js      # Autenticação
│   │   ├── subjectController.js   # Disciplinas
│   │   ├── questionController.js  # Questões
│   │   ├── examController.js      # Provas
│   │   └── correctionController.js # Correção
│   ├── middleware/
│   │   ├── auth.js               # Autenticação
│   │   ├── validation.js         # Validação
│   │   ├── upload.js             # Upload de arquivos
│   │   └── errorHandler.js       # Tratamento de erros
│   ├── models/
│   │   ├── index.js              # Inicialização do Sequelize
│   │   ├── User.js               # Modelo de usuário
│   │   ├── Subject.js            # Modelo de disciplina
│   │   ├── Question.js           # Modelo de questão
│   │   ├── Exam.js               # Modelo de prova
│   │   ├── ExamVariation.js      # Modelo de variação
│   │   ├── ExamQuestion.js       # Tabela N:N
│   │   └── Answer.js             # Modelo de resposta
│   ├── routes/
│   │   ├── index.js              # Router principal
│   │   ├── auth.js               # Rotas de autenticação
│   │   ├── subjects.js           # Rotas de disciplinas
│   │   ├── questions.js          # Rotas de questões
│   │   ├── exams.js              # Rotas de provas
│   │   ├── corrections.js        # Rotas de correção
│   │   ├── public.js             # Rotas públicas
│   │   └── admin.js              # Rotas de admin
│   ├── services/
│   │   ├── pdfService.js         # Geração de PDFs
│   │   ├── qrService.js          # Geração de QR Codes
│   │   ├── ocrService.js         # OCR/Tesseract
│   │   └── emailService.js       # Envio de emails
│   ├── utils/
│   │   ├── helpers.js            # Funções auxiliares
│   │   └── constants.js          # Constantes do sistema
│   └── uploads/
│       ├── images/               # Imagens
│       ├── pdfs/                 # PDFs gerados
│       └── temp/                 # Arquivos temporários
├── package.json
├── .env.example
└── README.md
```

## 🔌 API Endpoints

### Autenticação
```
POST /api/auth/register          # Registrar usuário
POST /api/auth/login            # Login
POST /api/auth/logout           # Logout
POST /api/auth/forgot-password  # Esqueci minha senha
POST /api/auth/reset-password   # Redefinir senha
GET  /api/auth/profile          # Perfil do usuário
PUT  /api/auth/profile          # Atualizar perfil
```

### Disciplinas
```
GET    /api/subjects            # Listar disciplinas
POST   /api/subjects            # Criar disciplina
GET    /api/subjects/:id        # Obter disciplina
PUT    /api/subjects/:id        # Atualizar disciplina
DELETE /api/subjects/:id        # Deletar disciplina
```

### Questões
```
GET    /api/questions           # Listar questões
POST   /api/questions           # Criar questão
GET    /api/questions/:id       # Obter questão
PUT    /api/questions/:id       # Atualizar questão
DELETE /api/questions/:id       # Deletar questão
POST   /api/questions/bulk      # Criação em lote
```

### Provas
```
GET    /api/exams               # Listar provas
POST   /api/exams               # Criar prova (com variações)
GET    /api/exams/:id           # Obter prova
PUT    /api/exams/:id           # Atualizar prova
DELETE /api/exams/:id           # Deletar prova
POST   /api/exams/:id/publish   # Publicar prova
POST   /api/exams/:id/generate-pdfs # Gerar PDFs
```

### Correção
```
POST /api/corrections/submit/:examId/:variationId  # Submeter respostas
GET  /api/corrections/exams/:examId/submissions    # Listar submissões
GET  /api/corrections/exams/:examId/statistics     # Estatísticas
```

### Rotas Públicas (Estudantes)
```
GET  /api/public/scan/:examId/:variationId  # Acessar prova via QR
POST /api/public/submit/:examId/:variationId # Submeter respostas
POST /api/public/validate-qr                # Validar QR Code
```

## ⚙️ Algoritmo de Geração de Variações

O sistema implementa um algoritmo inteligente para gerar múltiplas variações de prova:

### 1. **Seleção Inteligente de Questões**
```javascript
// Distribuição configurável por dificuldade
const examConfig = {
  totalQuestions: 20,
  easyQuestions: 8,    // 40%
  mediumQuestions: 8,  // 40%
  hardQuestions: 4     // 20%
}
```

### 2. **Embaralhamento Avançado**
- **Fisher-Yates shuffle** para randomização verdadeira
- Embaralhamento independente de questões e alternativas
- Manutenção da integridade das respostas corretas

### 3. **Geração de QR Codes Únicos**
- QR Code exclusivo para cada variação
- Validação de integridade
- Rastreamento de uso

### 4. **Validações de Integridade**
- Verificação de disponibilidade de questões
- Validação de distribuição de dificuldade
- Prevenção de duplicação de questões

## 🔒 Segurança

### Autenticação e Autorização
- JWT com refresh tokens
- Hashing de senhas com bcrypt (12 rounds)
- Rate limiting por IP
- Roles baseadas em permissões

### Validação de Dados
- Sanitização de entrada com Joi
- Validação de tipos de arquivo
- Limitação de tamanho de upload
- Validação de estrutura de dados

### Headers de Segurança
- CORS configurado
- Helmet para headers seguros
- Compressão gzip
- Logs de auditoria

## 📊 Monitoramento e Logs

### Sistema de Logs
```javascript
// Winston configurado para múltiplos níveis
logger.info('User logged in', { userId, ip });
logger.error('Database error', { error, query });
```

### Health Checks
```bash
GET /api/health      # Status da API
GET /api/version     # Informações de versão
```

### Métricas do Sistema
- Uptime do servidor
- Uso de memória
- Conexões de banco
- Status dos serviços

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes com coverage
npm run test:coverage

# Testes de integração
npm run test:integration
```

## 🚀 Deploy em Produção

### 1. Configuração de Ambiente
```bash
NODE_ENV=production
PORT=5000
```

### 2. Configuração do Banco
```bash
# Configurar PostgreSQL em produção
# Executar migrações
npm run db:migrate
```

### 3. Configuração de SSL
```bash
# Configurar certificados SSL
# Usar proxy reverso (nginx)
```

### 4. Monitoramento
```bash
# PM2 para gestão de processos
npm install -g pm2
pm2 start src/server.js --name exam-system
```

## 🔧 Troubleshooting

### Problemas Comuns

**Erro de Conexão com Banco**
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar configurações no .env
```

**Erro de Upload de Arquivos**
```bash
# Verificar permissões da pasta uploads
chmod 755 src/uploads
```

**Erro de Geração de PDF**
```bash
# Verificar dependências do PDFKit
npm ls pdfkit
```

## 📚 Documentação da API

A documentação completa da API estará disponível em:
- Desenvolvimento: `http://localhost:5000/api-docs`
- Produção: `https://your-domain.com/api-docs`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- Email: suporte@examsystem.com
- Issues: GitHub Issues
- Documentação: Wiki do projeto

---

**Sistema de Provas Online** - Desenvolvido com ❤️ para revolucionar a educação digital.

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"