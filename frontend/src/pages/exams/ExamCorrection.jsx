import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, XCircle, Circle, QrCode, 
  Save, RotateCcw, Download, Calculator, Eye
} from 'lucide-react';
import { useExam } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import { LoadingPage } from '../../components/common/Loading';
import apiService from '../../services/api';
import QRCodeLib from 'qrcode';

export default function ExamCorrection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { data: examData, isLoading } = useExam(id);
  
  const [selectedVariation, setSelectedVariation] = useState('');
  const [answerKey, setAnswerKey] = useState({});
  const [studentAnswers, setStudentAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const qrCanvasRef = useRef(null);

  const exam = examData?.data?.exam;
  
  useEffect(() => {
    if (exam && exam.variations && exam.variations.length > 0) {
      if (!selectedVariation) {
        setSelectedVariation(exam.variations[0].id);
      }
    }
  }, [exam, selectedVariation]);

  useEffect(() => {
    if (selectedVariation && exam) {
      generateAnswerKeyAndQR();
    }
  }, [selectedVariation, exam]);

  const generateAnswerKeyAndQR = async () => {
    try {
      const variation = exam.variations.find(v => v.id === selectedVariation);
      if (!variation) return;

      // Buscar as questões da variação com respostas corretas
      const response = await apiService.getExamVariation(exam.id, selectedVariation);
      const questions = response.data.variation.examQuestions || [];
      
      // Criar gabarito baseado nas questões
      const correctAnswers = {};
      questions.forEach((eq, index) => {
        const question = eq.question;
        if (question.type === 'multiple_choice') {
          correctAnswers[index + 1] = question.correctAnswer;
        }
      });

      setAnswerKey(correctAnswers);

      // Gerar QR code para correção
      const qrData = {
        type: 'exam_correction',
        examId: exam.id,
        examTitle: exam.title,
        variationId: selectedVariation,
        variationNumber: variation.variationNumber,
        totalQuestions: questions.length,
        answerKey: correctAnswers,
        generatedAt: new Date().toISOString(),
        version: '1.0'
      };

      // Gerar QR Code real
      if (qrCanvasRef.current) {
        QRCodeLib.toCanvas(qrCanvasRef.current, JSON.stringify(qrData), {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      }
      
      setQrCode(qrData);
      
    } catch (error) {
      showError('Erro ao gerar gabarito');
      console.error(error);
    }
  };

  const handleStudentAnswerChange = (questionNumber, answer) => {
    setStudentAnswers(prev => ({
      ...prev,
      [questionNumber]: answer
    }));
  };

  const correctExam = () => {
    if (!answerKey || Object.keys(studentAnswers).length === 0) {
      showError('Preencha ao menos uma resposta do aluno');
      return;
    }

    const totalQuestions = Object.keys(answerKey).length;
    let correctCount = 0;
    const questionResults = {};

    Object.keys(answerKey).forEach(questionNumber => {
      const studentAnswer = studentAnswers[questionNumber];
      const correctAnswer = answerKey[questionNumber];
      const isCorrect = parseInt(studentAnswer) === correctAnswer;
      
      if (isCorrect) correctCount++;
      
      questionResults[questionNumber] = {
        studentAnswer,
        correctAnswer,
        isCorrect
      };
    });

    const score = (correctCount / totalQuestions) * 10;
    const percentage = (correctCount / totalQuestions) * 100;

    setResults({
      totalQuestions,
      correctCount,
      incorrectCount: totalQuestions - correctCount,
      score: score.toFixed(1),
      percentage: percentage.toFixed(1),
      questions: questionResults
    });

    setShowResults(true);
    success(`Correção concluída! Nota: ${score.toFixed(1)}`);
  };

  const resetCorrection = () => {
    setStudentAnswers({});
    setResults(null);
    setShowResults(false);
  };

  if (isLoading) {
    return <LoadingPage title="Carregando prova para correção..." />;
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Prova não encontrada</h3>
        <button
          onClick={() => navigate('/exams')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Voltar para Provas
        </button>
      </div>
    );
  }

  const totalQuestions = Object.keys(answerKey).length;
  const alternatives = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/exams/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Correção de Prova</h1>
            <p className="text-gray-600">{exam.title}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {results && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">{results.score}</div>
              <div className="text-sm text-gray-600">Nota</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seleção de Variação */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecionar Variação</h2>
            <select
              value={selectedVariation}
              onChange={(e) => setSelectedVariation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {exam.variations?.map(variation => (
                <option key={variation.id} value={variation.id}>
                  Variação {variation.variationNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Campo de Gabarito */}
          {totalQuestions > 0 && (
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Gabarito da Prova ({totalQuestions} questões)
                </h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={resetCorrection}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Limpar
                  </button>
                  <button
                    onClick={correctExam}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Corrigir
                  </button>
                </div>
              </div>

              {/* Grade de Questões */}
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Marque as respostas que o aluno deu em sua prova física:
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(answerKey).map(questionNumber => (
                    <div key={questionNumber} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900">Questão {questionNumber}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Gabarito:</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                            {alternatives[answerKey[questionNumber]]}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600 min-w-0">Resposta do aluno:</span>
                        <div className="flex space-x-2">
                          {alternatives.slice(0, 5).map((alt, index) => (
                            <button
                              key={alt}
                              onClick={() => handleStudentAnswerChange(questionNumber, index)}
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                                studentAnswers[questionNumber] === index
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-300 hover:border-blue-400'
                              }`}
                            >
                              {alt}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Status da questão */}
                      {results && results.questions[questionNumber] && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className={`flex items-center text-sm ${
                            results.questions[questionNumber].isCorrect 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {results.questions[questionNumber].isCorrect ? (
                              <CheckCircle className="w-4 h-4 mr-1" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-1" />
                            )}
                            {results.questions[questionNumber].isCorrect ? 'Correta' : 'Incorreta'}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Painel Lateral */}
        <div className="space-y-6">
          {/* QR Code para Correção */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <QrCode className="w-5 h-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">QR Code para Correção</h3>
            </div>
            
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <canvas 
                  ref={qrCanvasRef} 
                  className="border-2 border-gray-200 rounded-lg"
                  width="200" 
                  height="200"
                />
              </div>
              <p className="text-xs text-gray-600">
                QR Code com gabarito para correção automática via scanner
              </p>
              {qrCode && (
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Variação: {qrCode.variationNumber}</div>
                  <div>Questões: {qrCode.totalQuestions}</div>
                </div>
              )}
              <button 
                onClick={() => {
                  if (qrCanvasRef.current) {
                    const link = document.createElement('a');
                    link.download = `gabarito-qr-variacao-${qrCode?.variationNumber || 'unknown'}.png`;
                    link.href = qrCanvasRef.current.toDataURL();
                    link.click();
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4 mr-1 inline" />
                Baixar QR Code
              </button>
            </div>
          </div>

          {/* Resultados */}
          {results && (
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de questões:</span>
                  <span className="font-medium">{results.totalQuestions}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-green-600">Acertos:</span>
                  <span className="font-medium text-green-600">{results.correctCount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-red-600">Erros:</span>
                  <span className="font-medium text-red-600">{results.incorrectCount}</span>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Nota:</span>
                    <span className="font-bold text-primary-600">{results.score}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Percentual:</span>
                    <span>{results.percentage}%</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => console.log('Salvar resultado')}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Resultado
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}