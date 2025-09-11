import React, { useState, useEffect } from 'react';
import { 
  QrCode, Camera, CheckCircle, AlertCircle, 
  User, Mail, Hash, ArrowRight, Save,
  BarChart3, Trophy, Clock, FileCheck 
} from 'lucide-react';
import QRScanner from './QRScanner';
import GabaritoScanner from './GabaritoScanner';
import apiService from '../../services/api';
import { LoadingButton } from '../common/Loading';

const AutomaticCorrection = ({ isOpen, onClose, onCorrectionComplete }) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: QR, 2: Gabarito, 3: Student Info, 4: Results
  const [qrData, setQrData] = useState(null);
  const [detectedAnswers, setDetectedAnswers] = useState(null);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    email: '',
    studentId: ''
  });
  const [correctionResult, setCorrectionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState(0);

  const steps = [
    { number: 1, title: 'Escanear QR Code', description: 'Escaneie o QR code da prova' },
    { number: 2, title: 'Detectar Respostas', description: 'Capture o gabarito preenchido' },
    { number: 3, title: 'Dados do Aluno', description: 'Informe os dados do estudante' },
    { number: 4, title: 'Resultado', description: 'Visualize a correção automática' }
  ];

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setCurrentStep(1);
    setQrData(null);
    setDetectedAnswers(null);
    setStudentInfo({ name: '', email: '', studentId: '' });
    setCorrectionResult(null);
    setIsLoading(false);
    setError(null);
    setConfidence(0);
  };

  const handleQRDetected = (result) => {
    setQrData(result.qrData);
    setCurrentStep(2);
  };

  const handleAnswersDetected = (result) => {
    setDetectedAnswers(result.answers);
    setConfidence(result.confidence);
    setCurrentStep(3);
  };

  const handleStudentInfoChange = (field, value) => {
    setStudentInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const processCorrection = async () => {
    if (!qrData || !detectedAnswers) {
      setError('Dados incompletos para correção');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.correctAnswersFromCamera(
        qrData,
        detectedAnswers,
        studentInfo,
        confidence
      );

      setCorrectionResult(response.data);
      setCurrentStep(4);
      
    } catch (err) {
      console.error('Erro na correção:', err);
      setError(err.response?.data?.message || 'Erro ao processar correção automática');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    if (onCorrectionComplete && correctionResult) {
      onCorrectionComplete(correctionResult);
    }
    onClose();
  };

  const goToStep = (step) => {
    if (step <= currentStep || (step === 2 && qrData) || (step === 3 && qrData && detectedAnswers)) {
      setCurrentStep(step);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Correção Automática
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Escaneie o QR Code e o gabarito para correção instantânea
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <QrCode className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div 
                  className={`flex items-center cursor-pointer ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                  }`}
                  onClick={() => goToStep(step.number)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.number 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    {currentStep > step.number ? <CheckCircle className="w-5 h-5" /> : step.number}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-xs opacity-75">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: QR Scanner */}
          {currentStep === 1 && (
            <div className="text-center">
              <QrCode className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Escaneie o QR Code da Prova
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Posicione o QR Code da prova na frente da câmera ou selecione uma imagem
              </p>
              
              <QRScanner
                isOpen={true}
                onQRDetected={handleQRDetected}
                onClose={() => {}}
                title="Escanear QR Code do Gabarito"
              />
            </div>
          )}

          {/* Step 2: Gabarito Scanner */}
          {currentStep === 2 && qrData && (
            <div className="text-center">
              <Camera className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Detectar Respostas do Gabarito
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Capture uma foto do gabarito preenchido pelo aluno
              </p>
              
              <GabaritoScanner
                isOpen={true}
                qrData={qrData}
                onAnswersDetected={handleAnswersDetected}
                onClose={() => setCurrentStep(1)}
                title="Detectar Respostas do Gabarito"
              />
            </div>
          )}

          {/* Step 3: Student Info */}
          {currentStep === 3 && (
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Dados do Estudante
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Informe os dados para salvar o resultado da correção
                </p>
              </div>

              {/* Detection Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700 dark:text-blue-300">Respostas detectadas:</span>
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    {detectedAnswers?.filter(a => a !== null).length}/{qrData?.totalQuestions} questões
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-blue-700 dark:text-blue-300">Confiança:</span>
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    {confidence}%
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome do Estudante *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={studentInfo.name}
                      onChange={(e) => handleStudentInfoChange('name', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Digite o nome completo"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email (opcional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={studentInfo.email}
                      onChange={(e) => handleStudentInfoChange('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Matrícula (opcional)
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={studentInfo.studentId}
                      onChange={(e) => handleStudentInfoChange('studentId', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Digite a matrícula"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Voltar
                </button>
                <LoadingButton
                  onClick={processCorrection}
                  loading={isLoading}
                  disabled={!studentInfo.name.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium disabled:bg-gray-400"
                >
                  <FileCheck className="w-4 h-4 mr-2" />
                  Processar Correção
                </LoadingButton>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {currentStep === 4 && correctionResult && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <Trophy className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Correção Concluída!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  A prova foi corrigida automaticamente com sucesso
                </p>
              </div>

              {/* Score Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Nota Final</p>
                      <p className="text-3xl font-bold">{correctionResult.score.toFixed(1)}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Acertos</p>
                      <p className="text-3xl font-bold">{correctionResult.correctAnswers}</p>
                      <p className="text-green-100 text-xs">de {correctionResult.totalQuestions}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Aproveitamento</p>
                      <p className="text-3xl font-bold">{correctionResult.accuracy}%</p>
                    </div>
                    <Trophy className="w-8 h-8 text-purple-200" />
                  </div>
                </div>
              </div>

              {/* Student Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Dados do Estudante</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Nome:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{studentInfo.name}</p>
                  </div>
                  {studentInfo.email && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">Email:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{studentInfo.email}</p>
                    </div>
                  )}
                  {studentInfo.studentId && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">Matrícula:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{studentInfo.studentId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Exam Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Informações da Prova</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Prova:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{correctionResult.examTitle}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Variação:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{correctionResult.variationNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Método de Correção:</span>
                    <p className="font-medium text-gray-900 dark:text-white">Detecção Automática</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Confiança da Detecção:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{correctionResult.detectionConfidence}%</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Corrigir Outra Prova
                </button>
                <button
                  onClick={handleFinish}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  <Save className="w-4 h-4 mr-2 inline" />
                  Finalizar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutomaticCorrection;