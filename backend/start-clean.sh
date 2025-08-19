#!/bin/bash

# Script para iniciar o servidor backend garantindo que a porta esteja livre
PORT=5000

echo "🔧 Limpando recursos antes de iniciar o servidor..."

# Função para matar processos com segurança
safe_kill() {
    if [ ! -z "$1" ]; then
        for pid in $1; do
            if ps -p $pid > /dev/null 2>&1; then
                echo "  🔪 Matando PID: $pid"
                kill -9 $pid 2>/dev/null
            fi
        done
    fi
}

# 1. Limpar porta 5000
echo "📍 Verificando porta $PORT..."
PID=$(lsof -ti:$PORT 2>/dev/null)
if [ ! -z "$PID" ]; then
    echo "⚠️  Processo encontrado na porta $PORT (PID: $PID)"
    safe_kill "$PID"
    sleep 1
    echo "✅ Porta $PORT limpa"
else
    echo "✅ Porta $PORT está livre"
fi

# 2. Limpar processos nodemon do backend
echo "🔧 Limpando processos nodemon do backend..."
NODEMON_PIDS=$(ps aux | grep "nodemon.*server.js" | grep -v grep | awk '{print $2}')
if [ ! -z "$NODEMON_PIDS" ]; then
    echo "⚠️  Encontrados processos nodemon do backend:"
    safe_kill "$NODEMON_PIDS"
    sleep 1
fi

# 3. Limpar processos node server.js
echo "🔧 Limpando processos node server.js..."
NODE_SERVER_PIDS=$(ps aux | grep "node.*server.js" | grep -v grep | awk '{print $2}')
if [ ! -z "$NODE_SERVER_PIDS" ]; then
    echo "⚠️  Encontrados processos node server.js:"
    safe_kill "$NODE_SERVER_PIDS"
    sleep 1
fi

# 4. Verificação final
echo "🔍 Verificação final da porta $PORT..."
if lsof -ti:$PORT > /dev/null 2>&1; then
    echo "❌ Erro: Porta $PORT ainda está em uso!"
    lsof -i:$PORT
    exit 1
else
    echo "✅ Porta $PORT confirmada como livre"
fi

echo "🚀 Iniciando servidor backend..."
echo "📝 Logs do servidor:"
echo "----------------------------------------"

# Definir variáveis de ambiente necessárias
export JWT_SECRET='exam_system_super_secret_key_2024_muito_segura'
export NODE_ENV='development'

# Iniciar o servidor
exec npm run dev