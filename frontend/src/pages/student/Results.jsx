import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Award, BarChart3, Clock, 
  Target, TrendingUp, RotateCcw, Home, Share2,
  User, BookOpen, FileText, Download, Eye
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export default function Results() {
  const { submissionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { success } = useToast();

  // Get data from navigation state or fetch from API
  const { studentInfo, examData, answers, results } = location.state || {};

  // Mock results data - in real app this would come from API
  const [submissionResults] = useState(() => {
    if (results) return results;
    
    // Generate mock results based on answers
    const totalQuestions = examData?.questions?.length || 0;
    const answeredQuestions = Object.keys(answers || {}).length;
    const correctAnswers = Math.floor(answeredQuestions * 0.7); // Mock 70% success rate
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      incorrectAnswers: answeredQuestions - correctAnswers,
      unansweredQuestions: totalQuestions - answeredQuestions,
      score: Math.round(score),
      grade: score >= 70 ? 'Aprovado' : score >= 50 ? 'Recuperação' : 'Reprovado',
      timeSpent: 45, // minutes
      submittedAt: new Date().toISOString(),
      detailedResults: examData?.questions?.map((question, index) => {
        const userAnswer = answers?.[index];
        const correctAnswer = question.alternatives?.findIndex(alt => alt.isCorrect);
        const isCorrect = userAnswer === correctAnswer;
        
        return {
          questionId: question.id,
          questionText: question.statement,
          userAnswer,
          correctAnswer,
          isCorrect,
          isAnswered: userAnswer !== undefined,
          points: isCorrect ? question.points : 0,
          maxPoints: question.points,
          alternatives: question.alternatives,
        };
      }) || [],
    };
  });

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'Aprovado':
        return 'text-green-600 bg-green-100';
      case 'Recuperação':
        return 'text-yellow-600 bg-yellow-100';
      case 'Reprovado':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleShare = () => {
    const shareData = {
      title: `Resultado da Prova: ${examData?.title}`,
      text: `Obtive ${submissionResults.score}% de aproveitamento na prova de ${examData?.subject?.name}`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
      success('Link copiado para a área de transferência!');
    }
  };

  const handleRetakeExam = () => {
    if (examData) {
      navigate(`/exam/${examData.examId}/${examData.variationId}`, {
        state: { studentInfo, examData }
      });
    } else {
      navigate('/scan');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className={`p-6 rounded-2xl ${submissionResults.score >= 70 ? 'bg-green-500' : submissionResults.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}>
              {submissionResults.score >= 70 ? (
                <Award className="w-16 h-16 text-white" />
              ) : submissionResults.score >= 50 ? (
                <Target className="w-16 h-16 text-white" />
              ) : (
                <RotateCcw className="w-16 h-16 text-white" />
              )}
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Resultado da Prova
          </h1>
          
          <p className="text-xl text-gray-600">
            {examData?.title || 'Prova concluída'}
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="text-6xl font-bold text-gray-900 mb-2">
              {submissionResults.score}%
            </div>
            <div className={`inline-flex items-center px-6 py-2 rounded-full text-lg font-semibold ${getGradeColor(submissionResults.grade)}`}>
              {submissionResults.grade}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {submissionResults.correctAnswers}
              </div>
              <div className="text-sm text-gray-500">Corretas</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {submissionResults.incorrectAnswers}
              </div>
              <div className="text-sm text-gray-500">Incorretas</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {submissionResults.unansweredQuestions}
              </div>
              <div className="text-sm text-gray-500">Não respondidas</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {submissionResults.timeSpent}min
              </div>
              <div className="text-sm text-gray-500">Tempo usado</div>
            </div>
          </div>
        </div>

        {/* Student and Exam Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Dados do Estudante</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Nome:</span>
                <div className="font-medium">{studentInfo?.name || 'Não informado'}</div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Matrícula:</span>
                <div className="font-medium">{studentInfo?.studentId || 'Não informado'}</div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Data da submissão:</span>
                <div className="font-medium">
                  {new Date(submissionResults.submittedAt).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BookOpen className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Dados da Prova</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Disciplina:</span>
                <div className="font-medium">{examData?.subject?.name || 'Não informado'}</div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Variação:</span>
                <div className="font-medium">#{examData?.variationId || 'N/A'}</div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Total de questões:</span>
                <div className="font-medium">{submissionResults.totalQuestions}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Analysis */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Análise de Desempenho</h3>
          </div>
          
          <div className="space-y-4">
            {/* Progress bars */}
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>Taxa de acerto</span>
                <span>{submissionResults.score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${submissionResults.score >= 70 ? 'bg-green-500' : submissionResults.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${submissionResults.score}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>Questões respondidas</span>
                <span>{Math.round((submissionResults.answeredQuestions / submissionResults.totalQuestions) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-blue-500"
                  style={{ width: `${(submissionResults.answeredQuestions / submissionResults.totalQuestions) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        {submissionResults.detailedResults && submissionResults.detailedResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Resultados Detalhados</h3>
              </div>
              <span className="text-sm text-gray-500">
                {submissionResults.detailedResults.length} questões
              </span>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {submissionResults.detailedResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    result.isCorrect 
                      ? 'border-green-200 bg-green-50' 
                      : result.isAnswered 
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900 flex-1 pr-4">
                      {index + 1}. {result.questionText}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {result.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : result.isAnswered ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-400" />
                      )}
                      <span className="text-sm font-medium">
                        {result.points}/{result.maxPoints} pts
                      </span>
                    </div>
                  </div>
                  
                  {result.alternatives && (
                    <div className="space-y-2">
                      {result.alternatives.map((alternative, altIndex) => (
                        <div 
                          key={altIndex}
                          className={`flex items-center space-x-2 text-sm p-2 rounded ${
                            altIndex === result.correctAnswer 
                              ? 'bg-green-100 text-green-800'
                              : altIndex === result.userAnswer && !result.isCorrect
                                ? 'bg-red-100 text-red-800'
                                : 'text-gray-700'
                          }`}
                        >
                          <span className="font-medium">
                            {String.fromCharCode(65 + altIndex)})
                          </span>
                          <span className="flex-1">{alternative.text}</span>
                          {altIndex === result.correctAnswer && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {altIndex === result.userAnswer && altIndex !== result.correctAnswer && (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/scan')}
            className="flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Home className="w-5 h-5 mr-2" />
            Nova Prova
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Compartilhar
          </button>
          
          {submissionResults.grade !== 'Aprovado' && (
            <button
              onClick={handleRetakeExam}
              className="flex items-center justify-center px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Refazer Prova
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Resultado gerado automaticamente pelo ExamSystem</p>
          <p>ID da submissão: {submissionId || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}