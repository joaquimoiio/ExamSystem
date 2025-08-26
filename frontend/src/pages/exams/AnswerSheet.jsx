import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Printer, Download, QrCode } from 'lucide-react';
import apiService from '../../services/api';

export default function AnswerSheet() {
  const { id } = useParams();
  const [gabarito, setGabarito] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGabarito = async () => {
      try {
        const response = await apiService.generateAnswerSheet(id);
        setGabarito(response.data.gabarito);
      } catch (err) {
        setError('Erro ao carregar gabarito');
        console.error('Erro ao carregar gabarito:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGabarito();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando gabarito...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Erro ao Carregar</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!gabarito) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Gabarito não encontrado</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header de impressão (oculto na impressão) */}
      <div className="print:hidden bg-gray-50 border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-primary-600" />
            <h1 className="text-xl font-semibold text-gray-900">Gabarito - {gabarito.exam.title}</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo do gabarito */}
      <div className="max-w-4xl mx-auto p-8 print:p-4">
        {/* Cabeçalho da prova */}
        {gabarito.examHeader && (
          <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {gabarito.examHeader.schoolName}
            </h1>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {gabarito.examHeader.subjectName} - {gabarito.examHeader.year}
            </h2>
            <h3 className="text-lg font-medium text-gray-700">
              {gabarito.exam.title}
            </h3>
            {gabarito.exam.description && (
              <p className="text-gray-600 mt-2">{gabarito.exam.description}</p>
            )}
          </div>
        )}

        {/* Informações do aluno */}
        <div className="mb-8 p-4 border border-gray-300 rounded-lg bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome:</label>
              <div className="h-8 border-b border-gray-400"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula:</label>
              <div className="h-8 border-b border-gray-400"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turma:</label>
              <div className="h-8 border-b border-gray-400"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data:</label>
              <div className="h-8 border-b border-gray-400"></div>
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="mb-8 p-4 border border-gray-300 rounded-lg bg-blue-50">
          <h4 className="font-semibold text-gray-900 mb-2">Instruções:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Preencha completamente o círculo correspondente à sua resposta</li>
            <li>• Use caneta esferográfica azul ou preta</li>
            <li>• Não use corretivo ou borracha</li>
            <li>• Marque apenas uma alternativa por questão</li>
            <li>• Total de questões: {gabarito.exam.totalQuestions}</li>
          </ul>
        </div>

        {/* Gabarito com círculos para marcar */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Gabarito de Respostas</h4>
          <div className="grid grid-cols-5 gap-6 print:grid-cols-10 print:gap-2">
            {gabarito.questions.map((question, index) => (
              <div key={question.id} className="text-center">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  {question.number}
                </div>
                <div className="space-y-1">
                  {question.hasAlternatives ? (
                    ['A', 'B', 'C', 'D', 'E'].slice(0, question.alternatives.length).map((letter) => (
                      <div key={letter} className="flex items-center justify-center">
                        <span className="text-xs mr-1 w-3">{letter}</span>
                        <div className="w-6 h-6 border-2 border-gray-400 rounded-full"></div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 p-2 border border-gray-300 rounded">
                      Dissertativa
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code para correção */}
        <div className="mt-8 pt-6 border-t border-gray-300 text-center">
          <div className="flex items-center justify-center space-x-4">
            <QrCode className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                QR Code para Correção Automática
              </p>
              <p className="text-xs text-gray-500">
                ID da Prova: {gabarito.exam.id}
              </p>
            </div>
          </div>
        </div>

        {/* Detalhes das questões (para referência do professor) */}
        <div className="mt-12 print:break-before-page">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">Questões da Prova (Referência do Professor)</h4>
          <div className="space-y-6">
            {gabarito.questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      Questão {question.number}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.difficulty === 'easy' ? 'Fácil' :
                       question.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {question.points} {question.points === 1 ? 'ponto' : 'pontos'}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3">{question.text}</p>
                
                {question.hasAlternatives && (
                  <div className="space-y-1">
                    {question.alternatives.map((alt, altIndex) => (
                      <div key={altIndex} className="flex items-start space-x-2">
                        <span className="text-sm font-medium text-gray-600 w-6">
                          {String.fromCharCode(65 + altIndex)})
                        </span>
                        <span className="text-sm text-gray-700">{alt}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {question.type === 'essay' && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>Questão Dissertativa:</strong> Correção manual necessária
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>Gabarito gerado em {new Date(gabarito.metadata.generatedAt).toLocaleString('pt-BR')}</p>
          <p>Sistema de Provas - ID: {gabarito.exam.id}</p>
        </div>
      </div>
    </div>
  );
}