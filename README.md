# Sistema de Provas

Um sistema completo para criação, gerenciamento e correção de provas online com múltiplas variações. O sistema gera variações únicas de exames com distribuição inteligente de questões e fornece correção automática.

## 🚀 Características Principais

- **Criação de Provas**: Interface intuitiva para criação de exames com banco de questões
- **Múltiplas Variações**: Geração automática de até 50 variações por prova
- **Correção Automática**: Sistema de avaliação instantânea com estatísticas detalhadas
- **Visão Computacional**: Correção automática de gabaritos via camera usando OpenCV.js
- **QR Code Inteligente**: Gabaritos com QR codes contendo chaves de correção
- **Gestão de Questões**: Banco de questões organizado por disciplinas e níveis de dificuldade
- **Interface Responsiva**: Funciona perfeitamente em dispositivos móveis e desktop
- **Relatórios em PDF**: Geração de provas e relatórios em formato PDF

## 🏗️ Arquitetura

### Stack Tecnológico
- **Backend**: Node.js + Express.js + PostgreSQL
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Visão Computacional**: OpenCV.js para detecção de gabaritos
- **QR Codes**: qrcode (backend) + jsqr (frontend) para códigos inteligentes
- **Autenticação**: JWT com refresh tokens
- **ORM**: Sequelize
- **PDF**: PDFKit para geração de documentos

### Estrutura do Projeto
```
ExamSystem/
├── backend/           # API REST em Node.js
│   ├── src/
│   │   ├── controllers/  # Controladores da API
│   │   ├── models/       # Modelos Sequelize
│   │   ├── routes/       # Rotas da API
│   │   ├── services/     # Lógica de negócio
│   │   │   ├── qrService.js      # 🔍 Geração de QR codes com gabarito
│   │   │   └── pdfService.js     # 📄 Geração de PDFs com QR codes
│   │   └── middleware/   # Middlewares
│   └── uploads/          # Arquivos de upload
├── frontend/          # Aplicação React
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   │   └── correction/       # 📷 Componentes de correção
│   │   │       ├── QRScanner.jsx     # Scanner de QR codes
│   │   │       └── GabaritoScanner.jsx # Scanner de gabaritos
│   │   ├── pages/        # Páginas da aplicação
│   │   ├── services/     # Serviços de API
│   │   │   ├── qrService.js      # 🔍 Leitura de QR codes
│   │   │   └── visionService.js  # 👁️ Visão computacional (OpenCV.js)
│   │   └── hooks/        # Custom hooks
└── README.md
```

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js >= 16.0.0
- PostgreSQL
- npm >= 8.0.0

### 1. Clone o repositório
```bash
git clone <repository-url>
cd ExamSystem
```

### 2. Configure o Backend
```bash
cd backend
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Configurar banco de dados
npm run db:create
npm run db:migrate
npm run db:seed
```

### 3. Configure o Frontend
```bash
cd frontend
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com a URL do backend
```

### 4. Execute a aplicação

**Backend** (porta 5000):
```bash
cd backend
npm run dev
```

**Frontend** (porta 3000):
```bash
cd frontend
npm run dev
```

## 📝 Variáveis de Ambiente

### Backend (.env)
```env
# Banco de dados
DB_NAME=exam_system
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET=seu_jwt_secret
JWT_EXPIRES_IN=24h

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🎯 Funcionalidades

### Para Professores
- Criação e gestão de disciplinas
- Banco de questões por disciplina
- Criação de provas com múltiplas variações
- Geração de PDFs para impressão com QR codes inteligentes
- Correção automática via câmera/upload de gabaritos
- Relatórios de desempenho dos alunos

### Para Alunos
- Acesso às provas via interface web
- Submissão de respostas
- Visualização de resultados e estatísticas
- Interface responsiva para dispositivos móveis

### Sistema de Variações
- Algoritmo inteligente de distribuição de questões
- Manutenção da proporção de dificuldades (Fácil/Médio/Difícil)
- Geração de até 50 variações únicas por prova
- QR Codes únicos para cada variação

## 🔍 Sistema de Visão Computacional e QR Codes

### Geração de QR Codes Inteligentes
**Localização**: `backend/src/services/qrService.js`

O sistema gera QR codes únicos que contêm toda a informação necessária para correção:

```javascript
// Estrutura do QR Code
{
  type: 'answer_key',
  examId: 'uuid-da-prova',
  variationId: 'uuid-da-variacao',
  answerKey: [
    {
      questionNumber: 1,
      correctAnswer: 2, // 0=A, 1=B, 2=C, 3=D, 4=E
      points: 1.0,
      type: 'multiple_choice'
    }
    // ... outras questões
  ],
  totalPoints: 20,
  generatedAt: '2024-01-01T10:00:00Z'
}
```

**Funcionalidades principais**:
- `generateAnswerKeyQR()` - Gera QR code com gabarito completo
- `validateAnswerKeyQR()` - Valida estrutura do QR code
- `correctExam()` - Corrige respostas usando dados do QR

### Leitura de QR Codes
**Localização**: `frontend/src/services/qrService.js` e `frontend/src/components/correction/QRScanner.jsx`

Sistema de leitura via:
- **Câmera em tempo real**: Usa `jsqr` para detectar códigos automaticamente
- **Upload de imagem**: Processa imagens enviadas pelo usuário

**Tecnologias**:
- `jsqr` - Biblioteca JavaScript para detecção de QR codes
- `getUserMedia()` - API do navegador para acesso à câmera

### Detecção de Gabaritos via Visão Computacional
**Localização**: `frontend/src/services/visionService.js` e `frontend/src/components/correction/GabaritoScanner.jsx`

Sistema completo de correção automática usando **OpenCV.js**:

#### Etapas do Processamento:
1. **Correção de Perspectiva**:
   - Detecta os 4 cantos do gabarito
   - Aplica transformação perspectiva para criar imagem retangular
   - Padroniza dimensões (800x1000px)

2. **Detecção de Bolhas**:
   - Converte para escala de cinza
   - Aplica threshold binário para detectar áreas escuras
   - Encontra contornos circulares (bolhas preenchidas)
   - Calcula nível de preenchimento de cada bolha

3. **Organização das Respostas**:
   - Ordena bolhas por posição (linha por linha)
   - Agrupa em questões (5 alternativas por questão)
   - Identifica qual alternativa foi marcada

**Algoritmos principais**:
- `correctGabaritoPerspective()` - Corrige distorção da imagem
- `detectAnswers()` - Detecta bolhas preenchidas
- `organizeBubblesIntoAnswers()` - Organiza em formato de respostas

### Fluxo Completo de Correção

1. **Professor gera PDF** (`backend/src/services/pdfService.js`):
   - Cria prova com QR code contendo gabarito
   - QR code inclui respostas corretas e pontuação

2. **Aluno preenche gabarito impresso**

3. **Correção automática** (`frontend/src/components/correction/`):
   - Scanner QR code: Extrai gabarito da prova
   - Scanner gabarito: Detecta respostas marcadas pelo aluno
   - Sistema compara respostas e calcula nota

4. **Resultado** (`backend/src/services/qrService.js`):
   - Gera relatório detalhado com acertos/erros
   - Calcula estatísticas de desempenho
   - Salva resultado no banco de dados

### Configurações de Detecção

**Parâmetros ajustáveis**:
- Threshold de binarização: `120` (detecta bolhas escuras)
- Área mínima de bolha: `50px²`
- Área máxima de bolha: `2000px²`
- Circularidade mínima: `0.5` (filtra objetos não circulares)
- Confiança mínima: `70%` (recomenda verificação manual se menor)

## 🧪 Testes

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm run lint
npm run format
```

## 📦 Build para Produção

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 🔧 Scripts Disponíveis

### Backend
- `npm run dev` - Servidor de desenvolvimento com nodemon
- `npm start` - Servidor de produção
- `npm test` - Executar testes
- `npm run db:reset` - Resetar banco de dados completo

### Frontend
- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run lint` - Verificação de código
- `npm run format` - Formatação de código

## 📊 API Endpoints

Base URL: `http://localhost:5000/api`

- **Auth**: `/auth` - Autenticação e perfil
- **Disciplinas**: `/subjects` - CRUD de disciplinas
- **Questões**: `/questions` - Gestão do banco de questões
- **Provas**: `/exams` - Criação e gestão de provas
- **Correções**: `/corrections` - Submissão e estatísticas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte ou dúvidas, abra uma issue no repositório ou entre em contato com a equipe de desenvolvimento.