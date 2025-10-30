# 📖 Guia Rápido: Correção de Provas via QR Code

## 🎯 Para Professores

Este guia mostra como usar o sistema de correção automática via QR Code de forma simples e rápida.

---

## 📋 Passo a Passo Completo

### 1️⃣ **Criar e Gerar a Prova**

1. Acesse o sistema e faça login
2. Vá em **"Provas"** → **"Nova Prova"**
3. Preencha os dados:
   - Título da prova
   - Disciplina
   - Selecione as questões do banco
4. **Gere as variações** (ex: 30 variações para 30 alunos)
5. Clique em **"Gerar PDF"**
6. Baixe o arquivo PDF gerado

✅ **Resultado:** Você terá um PDF com todas as variações, cada uma com seu QR Code único no canto superior esquerdo.

---

### 2️⃣ **Imprimir e Aplicar a Prova**

1. Imprima o PDF (cada página é uma variação diferente)
2. Distribua uma variação para cada aluno
3. Aplique a prova normalmente
4. **Importante:** Peça aos alunos para marcarem as respostas de forma clara

---

### 3️⃣ **Corrigir a Prova com QR Code**

#### **Método 1: Interface Web (Mais Fácil)**

1. Acesse: **Menu** → **"Correção via QR"** (ou `/exams/qr-correction`)

2. **PASSO 1: QR Code**
   - Escaneie o QR Code da prova com seu celular OU
   - Cole os dados do QR Code manualmente
   - Clique em **"Continuar"**

3. **PASSO 2: Respostas do Aluno**
   - Digite as respostas que o aluno marcou
   - **Formato:** Use números separados por vírgula
   - **Conversão:**
     - A = 0
     - B = 1
     - C = 2
     - D = 3
     - E = 4

   **Exemplo:** Se o aluno marcou `A, B, C, A, D`, digite: `0,1,2,0,3`

4. **PASSO 3: Dados do Aluno (Opcional)**
   - Nome
   - Email
   - Matrícula
   - Clique em **"Corrigir Prova"**

5. **PASSO 4: Resultado Instantâneo** ✨
   - Nota (0-10)
   - Status: Aprovado/Reprovado
   - Número de acertos
   - Detalhamento questão por questão:
     - ✅ Verde = Acertou
     - ❌ Vermelho = Errou
     - Mostra resposta do aluno vs. gabarito correto

---

#### **Método 2: Escaneamento via Câmera** 📱

1. Use o botão **"Escanear QR"** na interface
2. Permita acesso à câmera quando solicitado
3. Aponte a câmera para o QR Code da prova
4. Aguarde a detecção automática
5. Continue com os passos 2-4 do Método 1

---

### 4️⃣ **Visualizar Estatísticas da Turma**

Após corrigir várias provas, você pode:

1. Acessar **"Estatísticas da Prova"**
2. Ver:
   - Nota média da turma
   - Taxa de aprovação
   - Distribuição de notas:
     - Excelente (9-10)
     - Bom (7-9)
     - Satisfatório (6-7)
     - Precisa melhorar (<6)
   - Questões mais erradas
   - Desempenho por dificuldade

---

## 💡 Dicas e Truques

### ✅ Melhores Práticas

1. **QR Code Visível**
   - Certifique-se de que o QR Code foi impresso claramente
   - Evite amassados ou manchas no QR

2. **Respostas Claras**
   - Oriente os alunos a marcarem bem as respostas
   - Uma marcação clara facilita a correção

3. **Organização**
   - Separe as provas por variação (se possível)
   - Corrija em lote para agilizar

4. **Correção Rápida**
   - Com prática, você corrige cada prova em ~30 segundos
   - Para 30 provas = ~15 minutos total

### ⚡ Atalhos

- **Cole JSON diretamente:** Se você tem o JSON do QR Code, cole direto no campo de texto
- **Use Tab:** Navegue entre campos com Tab para mais rapidez
- **Enter para continuar:** Pressione Enter após preencher cada campo

---

## 🔢 Tabela de Conversão Rápida

Para facilitar a digitação das respostas:

| Alternativa | Número |
|-------------|--------|
| **A**       | **0**  |
| **B**       | **1**  |
| **C**       | **2**  |
| **D**       | **3**  |
| **E**       | **4**  |

### Exemplos Práticos:

| Gabarito do Aluno | Digite no Sistema |
|-------------------|-------------------|
| A, B, C, D, E     | `0,1,2,3,4`      |
| A, A, A, A, A     | `0,0,0,0,0`      |
| B, C, D, A, E     | `1,2,3,0,4`      |
| C, C, B, B, A     | `2,2,1,1,0`      |

---

## ❓ Resolução de Problemas

### **Problema:** QR Code não reconhecido
**Solução:**
- Verifique se o QR está nítido
- Tente escanear com mais luz
- Use o método de colar JSON manualmente

### **Problema:** Número de respostas incorreto
**Solução:**
- Confira se digitou todas as respostas
- Verifique se usou vírgulas para separar
- Exemplo correto para 5 questões: `0,1,2,0,3`

### **Problema:** Aluno marcou duas alternativas
**Solução:**
- Considere como errado (marque qualquer opção)
- OU defina critério próprio (ex: primeira marcada)
- Anote para correção manual posterior

### **Problema:** Questão dissertativa
**Solução:**
- O sistema marca como 0 pontos inicialmente
- Use a **Correção Manual** depois:
  1. Acesse o resultado salvo
  2. Clique em "Corrigir Dissertativas"
  3. Atribua nota e feedback
  4. Sistema recalcula a nota final automaticamente

---

## 📊 Exemplo Completo

### Cenário Real:

**Prova:** Matemática Básica (10 questões)
**Aluno:** João Silva
**Variação:** 3

**Gabarito do Aluno:**
1. A
2. B
3. C
4. A
5. D
6. E
7. B
8. A
9. C
10. D

### **Entrada no Sistema:**

**Passo 2 (Respostas):** `0,1,2,0,3,4,1,0,2,3`

**Passo 3 (Dados):**
- Nome: `João Silva`
- Email: `joao.silva@escola.com`
- Matrícula: `2024001`

### **Resultado:**

```
Nota: 8.5
Status: ✅ APROVADO
Acertos: 17/20
Pontos: 8.5/10

Detalhamento:
✅ Questão 1: A | Gabarito: A | 0.5 pts
✅ Questão 2: B | Gabarito: B | 0.5 pts
❌ Questão 3: C | Gabarito: A | 0.0 pts
✅ Questão 4: A | Gabarito: A | 0.5 pts
...
```

---

## 🎓 Vantagens do Sistema

1. **Rapidez:** 30s por prova vs. 5-10min manual
2. **Precisão:** Zero erros de cálculo ou comparação
3. **Rastreabilidade:** Histórico completo de correções
4. **Estatísticas:** Análise automática da turma
5. **Flexibilidade:** Variações diferentes, mesma rapidez
6. **Transparência:** Alunos podem ver detalhamento

---

## 📱 Uso Mobile

O sistema funciona perfeitamente em celulares:

1. Acesse pelo navegador do celular
2. Use a câmera para escanear QR
3. Digite as respostas
4. Veja o resultado na tela

**Dica:** Ótimo para corrigir em qualquer lugar!

---

## 🔐 Segurança e Privacidade

- ✅ Todas as correções são autenticadas
- ✅ Apenas professores podem corrigir
- ✅ Dados dos alunos protegidos
- ✅ Histórico rastreável
- ✅ Gabarito criptografado no QR Code

---

## 📞 Precisa de Ajuda?

1. Consulte a **Documentação Completa:** `CORRECAO_QR_CODE.md`
2. Veja os **Tutoriais em Vídeo** (se disponíveis)
3. Entre em contato com o **Suporte Técnico**

---

## ✨ Resumo Visual

```
1. GERAR PROVA COM QR
   ↓
2. IMPRIMIR E APLICAR
   ↓
3. ESCANEAR QR CODE
   ↓
4. DIGITAR RESPOSTAS (0,1,2,3,4)
   ↓
5. VER RESULTADO INSTANTÂNEO! ✅
```

---

**Feito com ❤️ para facilitar a vida dos professores!**

**Status:** ✅ Sistema Pronto para Uso
**Última Atualização:** 15/10/2025
