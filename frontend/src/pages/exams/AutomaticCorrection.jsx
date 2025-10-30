import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, QrCode, CheckCircle, XCircle,
  Camera, AlertCircle, ScanLine, Zap
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import apiService from '../../services/api';
import QRScanner from '../../components/correction/QRScanner';
import GabaritoScanner from '../../components/correction/GabaritoScanner';

/**
 * Automatic Correction Page
 * Flow: Scan QR Code → Scan Answer Sheet → Get Result
 * NO MANUAL INPUT REQUIRED!
 */
export default function AutomaticCorrection() {
  const [step, setStep] = useState(1); // 1: QR, 2: Gabarito, 3: Results
  const [qrData, setQrData] = useState(null);
  const [detectedAnswers, setDetectedAnswers] = useState(null);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    email: '',
    studentId: ''
  });
  const [correctionResult, setCorrectionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showGabaritoScanner, setShowGabaritoScanner] = useState(false);

  const navigate = useNavigate();
  const { success, error } = useToast();

  // Handle QR Code Detection
  const handleQRDetected = (result) => {
    setQrData(result.qrData);
    setShowQRScanner(false);
    setStep(2);
    success('QR Code detectado! Agora escaneie o gabarito preenchido.');
  };

  // Handle Answer Sheet Detection
  const handleAnswersDetected = async (result) => {
    setDetectedAnswers(result.answers);
    setShowGabaritoScanner(false);

    // Immediately proceed to correction
    await performCorrection(result.answers);
  };

  // Perform automatic correction
  const performCorrection = async (answers) => {
    setIsLoading(true);
    try {
      const response = await apiService.post('/corrections/correct-exam', {
        qrData: qrData,
        studentAnswers: answers,
        studentInfo: studentInfo
      });

      setCorrectionResult(response.data);
      setStep(3);
      success('Correção realizada com sucesso!');

    } catch (err) {
      console.error('Correction error:', err);
      error(err.response?.data?.message || 'Erro ao realizar correção');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset and start new correction
  const resetCorrection = () => {
    setStep(1);
    setQrData(null);
    setDetectedAnswers(null);
    setCorrectionResult(null);
    setStudentInfo({ name: '', email: '', studentId: '' });
    setShowQRScanner(false);
    setShowGabaritoScanner(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/exams')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar para Provas
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Correção Automática Completa
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Escaneie o QR Code + Gabarito = Resultado instantâneo! Sem digitação manual.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[
              { num: 1, label: 'QR Code' },
              { num: 2, label: 'Gabarito' },
              { num: 3, label: 'Resultado' }
            ].map((stepInfo, index) => (
              <React.Fragment key={stepInfo.num}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepInfo.num
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepInfo.num}
                  </div>
                  <span className="text-xs text-gray-500 mt-2">{stepInfo.label}</span>
                </div>
                {index < 2 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > stepInfo.num ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {/* Step 1: Scan QR Code */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <QrCode className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Passo 1: Escaneie o QR Code da Prova
                </h2>
                <p className="text-gray-600">
                  O QR Code contém o gabarito oficial da variação da prova
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg flex items-center gap-3"
                >
                  <Camera className="w-6 h-6" />
                  Abrir Scanner de QR Code
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Dica:</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      O QR Code fica no canto superior esquerdo da prova impressa.
                      Certifique-se de que está bem visível e sem amassados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Scan Answer Sheet */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <ScanLine className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Passo 2: Escaneie o Gabarito Preenchido
                </h2>
                <p className="text-gray-600">
                  Tire uma foto do gabarito com as respostas marcadas pelo aluno
                </p>
              </div>

              {/* QR Data Summary */}
              {qrData && (
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Prova:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{qrData.examTitle}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Variação:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{qrData.variationNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Questões:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{qrData.totalQuestions}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Pontos:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{qrData.totalPoints}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Optional Student Info */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Dados do Aluno (Opcional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={studentInfo.name}
                    onChange={(e) => setStudentInfo({...studentInfo, name: e.target.value})}
                    className="border border-gray-300 rounded-lg p-2 text-sm"
                    placeholder="Nome"
                  />
                  <input
                    type="email"
                    value={studentInfo.email}
                    onChange={(e) => setStudentInfo({...studentInfo, email: e.target.value})}
                    className="border border-gray-300 rounded-lg p-2 text-sm"
                    placeholder="Email"
                  />
                  <input
                    type="text"
                    value={studentInfo.studentId}
                    onChange={(e) => setStudentInfo({...studentInfo, studentId: e.target.value})}
                    className="border border-gray-300 rounded-lg p-2 text-sm"
                    placeholder="Matrícula"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  onClick={() => setShowGabaritoScanner(true)}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Escanear Gabarito
                </button>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-orange-500 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                      Para melhor detecção:
                    </h4>
                    <ul className="text-sm text-orange-600 dark:text-orange-300 space-y-1">
                      <li>• Todos os 4 cantos do gabarito devem estar visíveis</li>
                      <li>• Use boa iluminação, sem sombras</li>
                      <li>• Gabarito plano, sem dobras</li>
                      <li>• Bolhas bem preenchidas e escuras</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && correctionResult && (
            <div className="space-y-6">
              <div className="text-center">
                {correctionResult.data?.correction?.score >= 6 ? (
                  <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
                ) : (
                  <XCircle className="w-20 h-20 mx-auto text-red-500 mb-4" />
                )}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Correção Automática Concluída!
                </h2>
                {qrData && (
                  <p className="text-gray-600">
                    {qrData.examTitle} - Variação {qrData.variationNumber}
                  </p>
                )}
              </div>

              {/* Score Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/30 dark:to-green-900/30 rounded-lg p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {correctionResult.data?.correction?.score?.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">Nota (0-10)</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">
                      {correctionResult.data?.correction?.results?.filter(r => r.isCorrect).length}
                    </div>
                    <div className="text-sm text-gray-500">Acertos</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {correctionResult.data?.correction?.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-500">Total</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${
                      correctionResult.data?.correction?.score >= 6 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {correctionResult.data?.correction?.score >= 6 ? '✓ APROVADO' : '✗ REPROVADO'}
                    </div>
                    <div className="text-sm text-gray-500">Status</div>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Detalhamento por Questão:</span>
                  <span className="text-sm font-normal text-gray-500">
                    ({correctionResult.data?.correction?.results?.filter(r => r.isCorrect).length}/{correctionResult.data?.correction?.totalQuestions} corretas)
                  </span>
                </h3>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {correctionResult.data?.correction?.results?.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded border ${
                        result.isCorrect
                          ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                          : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {result.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            Questão {result.questionNumber}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({result.difficulty})
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span>Aluno:</span>
                          <span className={`font-medium px-2 py-1 rounded ${
                            result.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {['A', 'B', 'C', 'D', 'E'][result.studentAnswer] || '?'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Gabarito:</span>
                          <span className="font-medium px-2 py-1 rounded bg-blue-100 text-blue-700">
                            {['A', 'B', 'C', 'D', 'E'][result.correctAnswer] || '?'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">{result.points}/{result.maxPoints}</span>
                          <span className="text-xs ml-1">pts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={resetCorrection}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  ↻ Nova Correção
                </button>
                <button
                  onClick={() => navigate('/exams')}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  Voltar para Provas
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600 mb-4"></div>
              <p className="text-gray-600">Processando correção automática...</p>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onQRDetected={handleQRDetected}
        title="Escanear QR Code da Prova"
      />

      {/* Gabarito Scanner Modal */}
      <GabaritoScanner
        isOpen={showGabaritoScanner}
        onClose={() => setShowGabaritoScanner(false)}
        onAnswersDetected={handleAnswersDetected}
        qrData={qrData}
        title="Detectar Respostas do Gabarito"
      />
    </div>
  );
}
