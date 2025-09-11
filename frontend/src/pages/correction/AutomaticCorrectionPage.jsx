import React, { useState, useEffect } from 'react';
import { 
  QrCode, Camera, FileCheck, BarChart3, 
  Clock, Users, TrendingUp, Plus,
  Eye, Download, RefreshCw 
} from 'lucide-react';
import AutomaticCorrection from '../../components/correction/AutomaticCorrection';
import { useToast } from '../../contexts/ToastContext';
import apiService from '../../services/api';

const AutomaticCorrectionPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentCorrections, setRecentCorrections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalCorrections: 0,
    todayCorrections: 0,
    averageScore: 0,
    averageTime: 0
  });
  
  const { showToast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      // In a real app, you'd have specific endpoints for correction stats
      // For now, we'll simulate the data
      
      setTimeout(() => {
        setStats({
          totalCorrections: 127,
          todayCorrections: 8,
          averageScore: 7.3,
          averageTime: 45 // seconds
        });
        
        setRecentCorrections([
          {
            id: 1,
            studentName: 'Ana Silva',
            examTitle: 'Matemática - Álgebra',
            score: 8.5,
            correctedAt: new Date(Date.now() - 1000 * 60 * 30),
            confidence: 95
          },
          {
            id: 2,
            studentName: 'Carlos Santos',
            examTitle: 'Física - Mecânica',
            score: 6.0,
            correctedAt: new Date(Date.now() - 1000 * 60 * 60),
            confidence: 88
          },
          {
            id: 3,
            studentName: 'Maria Costa',
            examTitle: 'Química - Orgânica',
            score: 9.2,
            correctedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
            confidence: 92
          }
        ]);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setIsLoading(false);
    }
  };

  const handleCorrectionComplete = (result) => {
    // Add new correction to the list
    const newCorrection = {
      id: Date.now(),
      studentName: result.studentInfo?.name || 'Não informado',
      examTitle: result.examTitle,
      score: result.score,
      correctedAt: new Date(),
      confidence: result.detectionConfidence || result.confidence
    };
    
    setRecentCorrections(prev => [newCorrection, ...prev.slice(0, 9)]);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      totalCorrections: prev.totalCorrections + 1,
      todayCorrections: prev.todayCorrections + 1
    }));
    
    showToast('Correção automática concluída com sucesso!', 'success');
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}min atrás`;
    return 'Agora mesmo';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Correção Automática
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Corrija provas instantaneamente usando QR Code e visão computacional
              </p>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <QrCode className="w-5 h-5 inline mr-2" />
              Nova Correção
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Total de Correções
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.totalCorrections}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 dark:text-green-400 font-medium">+12%</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">vs mês passado</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Hoje
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.todayCorrections}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 dark:text-green-400 font-medium">+3</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">desde ontem</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Nota Média
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.averageScore}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-purple-600 dark:text-purple-400 font-medium">Escala 0-10</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Tempo Médio
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.averageTime}s
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Camera className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-orange-600 dark:text-orange-400 font-medium">Por correção</span>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Como Funciona
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg inline-block mb-4">
                <QrCode className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                1. Escaneie o QR Code
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Aponte a câmera para o QR Code da prova para carregar o gabarito oficial
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg inline-block mb-4">
                <Camera className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                2. Capture o Gabarito
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Fotografe o gabarito preenchido pelo aluno com os 4 cantos visíveis
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-lg inline-block mb-4">
                <FileCheck className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                3. Correção Automática
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                O sistema detecta as marcações e calcula a nota automaticamente
              </p>
            </div>
          </div>
        </div>

        {/* Recent Corrections */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Correções Recentes
            </h2>
            <button 
              onClick={loadDashboardData}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="overflow-hidden">
            {recentCorrections.length === 0 ? (
              <div className="text-center py-12">
                <QrCode className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhuma correção ainda
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Comece escaneando o QR Code de uma prova
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Fazer Primeira Correção
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentCorrections.map((correction) => (
                  <div key={correction.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {correction.studentName}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {correction.examTitle}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {correction.score}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Confiança: {correction.confidence}%
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatTimeAgo(correction.correctedAt)}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-green-600">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Automatic Correction Modal */}
      <AutomaticCorrection
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCorrectionComplete={handleCorrectionComplete}
      />
    </div>
  );
};

export default AutomaticCorrectionPage;