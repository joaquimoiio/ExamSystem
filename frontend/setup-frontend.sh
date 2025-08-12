#!/bin/bash

echo "🚀 Configurando Frontend do Sistema de Provas..."

# Navegar para o diretório frontend
cd frontend

# Limpar instalações anteriores
echo "🧹 Limpando instalações anteriores..."
rm -rf node_modules
rm -f package-lock.json

# Verificar se package.json está correto
echo "📦 Verificando package.json..."
if ! grep -q "react-router-dom" package.json; then
    echo "❌ package.json incorreto detectado!"
    echo "Por favor, substitua o package.json pelo conteúdo correto fornecido."
    exit 1
fi

# Instalar dependências principais
echo "📥 Instalando dependências principais..."
npm install

# Adicionar Tailwind CSS e plugins
echo "🎨 Configurando Tailwind CSS..."
npm install -D tailwindcss autoprefixer postcss @tailwindcss/forms @tailwindcss/typography

# Verificar se arquivos de configuração existem
echo "⚙️  Verificando arquivos de configuração..."

if [ ! -f "index.html" ]; then
    echo "❌ index.html não encontrado! Crie o arquivo usando o template fornecido."
fi

if [ ! -f "tailwind.config.js" ]; then
    echo "❌ tailwind.config.js não encontrado! Crie o arquivo usando o template fornecido."
fi

if [ ! -f "postcss.config.js" ]; then
    echo "❌ postcss.config.js não encontrado! Crie o arquivo usando o template fornecido."
fi

if [ ! -f ".env.example" ]; then
    echo "❌ .env.example não encontrado! Crie o arquivo usando o template fornecido."
fi

# Verificar estrutura de diretórios
echo "📁 Verificando estrutura de diretórios..."

directories=(
    "src/components/Auth"
    "src/components/Common"
    "src/components/Layout"
    "src/components/Subjects"
    "src/components/Questions"
    "src/components/Exams"
    "src/components/Correction"
    "src/pages"
    "src/context"
    "src/hooks"
    "src/services"
    "src/utils"
    "src/styles"
    "public"
)

for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "⚠️  Diretório $dir não encontrado!"
    fi
done

# Verificar arquivos principais
echo "📄 Verificando arquivos principais..."

files=(
    "src/main.jsx"
    "src/App.jsx"
    "src/styles/globals.css"
    "src/styles/components.css"
    "vite.config.js"
)

for file in "${files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️  Arquivo $file não encontrado!"
    fi
done

# Tentar executar build de teste
echo "🔨 Testando build..."
if npm run build; then
    echo "✅ Build bem-sucedido!"
else
    echo "❌ Erro no build. Verifique as dependências e configurações."
    exit 1
fi

echo ""
echo "✅ Configuração do frontend concluída!"
echo ""
echo "📝 Próximos passos:"
echo "1. Copie .env.example para .env e configure as variáveis"
echo "2. Execute 'npm run dev' para iniciar o servidor de desenvolvimento"
echo "3. Verifique se o backend está rodando na porta 5000"
echo ""
echo "🌐 URLs importantes:"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo ""