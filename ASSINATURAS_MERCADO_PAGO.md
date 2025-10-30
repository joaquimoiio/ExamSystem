# Sistema de Assinaturas - Mercado Pago

Sistema completo de assinaturas integrado ao Mercado Pago usando preapproval (assinaturas recorrentes).

## 📋 Visão Geral

O sistema implementa assinaturas mensais e anuais para controlar o acesso às funcionalidades principais do Exam System. Usuários sem assinatura ativa (`subscriptionStatus != 'authorized'`) são bloqueados de acessar recursos como disciplinas, questões e provas.

## 🔧 Configuração

### 1. Configurar Variável de Ambiente

Adicione no arquivo `.env`:

```env
MP_ACCESS_TOKEN=seu_access_token_do_mercado_pago
```

**Como obter o Access Token:**
1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Vá em "Suas integrações" → Criar aplicação
3. Copie o **Access Token** (use o de produção em produção, teste em desenvolvimento)

### 2. Banco de Dados

O banco será atualizado automaticamente quando o servidor iniciar (auto-sync do Sequelize). Os seguintes campos serão adicionados à tabela `users`:

- `subscriptionStatus` - Status da assinatura (pending, authorized, paused, cancelled)
- `mercadoPagoSubscriptionId` - ID da assinatura no Mercado Pago
- `subscriptionPlan` - Plano escolhido (monthly, annual)
- `subscriptionStartDate` - Data de início da assinatura
- `subscriptionEndDate` - Data de fim da assinatura

## 📊 Planos Disponíveis

### Plano Mensal
- **Valor:** R$ 49,90/mês
- **Cobrança:** Mensal automática
- **Cancelamento:** A qualquer momento

### Plano Anual
- **Valor:** R$ 479,00/ano (economize 20%)
- **Cobrança:** Anual automática
- **Cancelamento:** A qualquer momento

## 🚀 Endpoints da API

### 1. Listar Planos Disponíveis
```
GET /api/assinatura/planos
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "monthly",
      "name": "Plano Mensal - Exam System",
      "description": "Assinatura mensal do sistema de provas",
      "price": 49.90,
      "frequency": 1,
      "frequencyType": "months",
      "currency": "BRL"
    },
    {
      "id": "annual",
      "name": "Plano Anual - Exam System",
      "description": "Assinatura anual do sistema de provas (economize 20%)",
      "price": 479.00,
      "frequency": 1,
      "frequencyType": "years",
      "currency": "BRL"
    }
  ]
}
```

### 2. Criar Assinatura
```
POST /api/assinatura/criar
Authorization: Bearer {token}
```

**Body:**
```json
{
  "planType": "monthly"  // ou "annual"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Assinatura criada com sucesso",
  "data": {
    "subscriptionId": "xxx-xxx-xxx",
    "initPoint": "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=xxx",
    "status": "pending",
    "planType": "monthly",
    "amount": 49.90
  }
}
```

**Uso:** Redirecione o usuário para o `initPoint` para completar o pagamento.

### 3. Obter Status da Assinatura
```
GET /api/assinatura/status
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "status": "authorized",
    "plan": "monthly",
    "startDate": "2024-01-15T10:00:00.000Z",
    "endDate": null,
    "mercadoPagoId": "xxx-xxx-xxx",
    "isActive": true,
    "planDetails": {
      "name": "Plano Mensal - Exam System",
      "amount": 49.90,
      "frequency": "1 months",
      "currency": "BRL"
    }
  }
}
```

### 4. Cancelar Assinatura
```
POST /api/assinatura/cancelar
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Assinatura cancelada com sucesso",
  "data": {
    "success": true,
    "message": "Assinatura cancelada com sucesso",
    "cancelledAt": "2024-01-20T15:30:00.000Z"
  }
}
```

### 5. Webhook do Mercado Pago
```
POST /api/assinatura/webhook
```

**Este endpoint é usado pelo Mercado Pago** para notificar mudanças de status. Configure no painel do Mercado Pago:
- URL: `https://seu-dominio.com/api/assinatura/webhook`
- Eventos: `preapproval`

## 🔒 Middleware de Proteção

O middleware `requireActiveSubscription` foi aplicado em todas as rotas principais:

### Rotas Protegidas
- **Subjects (Disciplinas):** Todas as rotas
- **Questions (Questões):** Todas as rotas
- **Exams (Provas):** Todas as rotas

### Comportamento
Quando um usuário sem assinatura ativa tenta acessar uma rota protegida:

```json
{
  "success": false,
  "message": "Assinatura inativa. Você precisa de uma assinatura ativa para acessar este recurso.",
  "subscriptionStatus": "pending",
  "requiresSubscription": true
}
```

**HTTP Status:** 403 Forbidden

## 📥 Fluxo de Assinatura

### 1. Criar Assinatura
```javascript
// Frontend
const response = await fetch('/api/assinatura/criar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ planType: 'monthly' })
});

const data = await response.json();

// Redirecionar para checkout
window.location.href = data.data.initPoint;
```

### 2. Webhook Atualiza Status
Após o pagamento ser aprovado, o Mercado Pago envia uma notificação para o webhook. O sistema:

1. Recebe a notificação
2. Busca informações atualizadas no Mercado Pago
3. Atualiza o status do usuário no banco de dados
4. Define `subscriptionStartDate` e `subscriptionEndDate` (para planos anuais)

### 3. Verificação de Acesso
Cada requisição às rotas protegidas:

1. Verifica se o usuário está autenticado
2. Verifica se `subscriptionStatus === 'authorized'`
3. Permite ou bloqueia o acesso

## 🛠️ Arquivos Criados/Modificados

### Criados
1. **`/backend/src/config/mercadopago.js`** - Configuração do SDK
2. **`/backend/src/services/subscriptionService.js`** - Lógica de negócio
3. **`/backend/src/controllers/subscriptionController.js`** - Controladores
4. **`/backend/src/middleware/subscriptionCheck.js`** - Middleware de verificação
5. **`/backend/src/routes/subscriptions.js`** - Rotas

### Modificados
1. **`/backend/src/models/User.js`** - Adicionados campos de assinatura
2. **`/backend/src/routes/index.js`** - Registradas rotas de assinatura
3. **`/backend/src/routes/subjects.js`** - Aplicado middleware
4. **`/backend/src/routes/questions.js`** - Aplicado middleware
5. **`/backend/src/routes/exams.js`** - Aplicado middleware
6. **`/backend/.env.example`** - Adicionada variável MP_ACCESS_TOKEN
7. **`/backend/package.json`** - Instalada dependência mercadopago

## 🧪 Testando

### 1. Testar Criação de Assinatura
```bash
curl -X POST http://localhost:5000/api/assinatura/criar \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planType": "monthly"}'
```

### 2. Testar Status
```bash
curl -X GET http://localhost:5000/api/assinatura/status \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 3. Testar Acesso Bloqueado
```bash
# Tente acessar disciplinas sem assinatura ativa
curl -X GET http://localhost:5000/api/subjects \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 4. Testar Webhook (Localmente com ngrok)
```bash
# Instale ngrok: https://ngrok.com/
ngrok http 5000

# Use a URL do ngrok no painel do Mercado Pago
# https://abc123.ngrok.io/api/assinatura/webhook
```

## 📱 Integração no Frontend

### Verificar Status da Assinatura
```javascript
const checkSubscription = async () => {
  const response = await api.get('/assinatura/status');

  if (!response.data.isActive) {
    // Redirecionar para página de assinatura
    navigate('/assinar');
  }
};
```

### Tratar Erro de Assinatura Inativa
```javascript
// Interceptor do axios
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.data?.requiresSubscription) {
      // Mostrar modal ou redirecionar para assinatura
      showSubscriptionModal();
    }
    return Promise.reject(error);
  }
);
```

## ⚠️ Observações Importantes

1. **Ambiente de Teste:** Use credenciais de teste do Mercado Pago durante desenvolvimento
2. **Webhook URL:** Deve ser HTTPS em produção
3. **Status da Assinatura:** O webhook pode demorar alguns minutos para ser processado
4. **Cancelamento:** Não há reembolso automático - implementar lógica separada se necessário
5. **Admin Bypass:** Você pode adicionar lógica para administradores ignorarem a verificação de assinatura

## 🔄 Status Possíveis

- **pending:** Assinatura criada, aguardando pagamento
- **authorized:** Assinatura ativa e pagamento aprovado
- **paused:** Assinatura pausada (por falha de pagamento, por exemplo)
- **cancelled:** Assinatura cancelada pelo usuário ou sistema

## 🎯 Próximos Passos (Opcional)

1. Criar interface no frontend para gerenciar assinaturas
2. Adicionar notificações por email quando assinatura muda de status
3. Implementar período de trial gratuito
4. Criar dashboard de métricas de assinaturas (admin)
5. Adicionar opção de downgrade/upgrade entre planos
