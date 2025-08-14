import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, X, Smartphone, AlertCircle, CheckCircle, 
  RotateCcw, Flashlight, Settings, ArrowLeft, QrCode,
  Wifi, WifiOff, Clock, User
} from 'lucide-react';
import { useQRScanner } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/api';

export default function QRScanner() {
  const [scannerActive, setScannerActive] = useState(false);
  const [validatingQR, setValidatingQR] = useState(false);
  const [examData, setExamData] = useState(null);
  const [studentInfo, setStudentInfo] = useState(() => {
    const saved = localStorage.getItem('studentInfo');
    return saved ? JSON.parse(saved) : { name: '', studentId: '' };
  });
  const [step, setStep] = useState('info'); // 'info', 'scan', 'validated'
  
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { offline } = useApp();
  const scannerElementRef = useRef(null);

  const {
    isScanning,
    result,
    error: scanError,
    startScanning,
    stopScanning,
    clearResult,
    clearError,
  } = useQRScanner();

  // Handle QR scan result
  useEffect(() => {
    if (result && !validatingQR) {
      validateQRCode(result);
    }
  }, [result, validatingQR]);

  const validateQRCode = async (qrData) => {
    if (validatingQR) return;
    
    setValidatingQR(true);
    stopScanning();

    try {
      // Parse QR code data
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch {
        throw new Error('QR Code inválido - formato incorreto');
      }

      if (!parsedData.examId || !parsedData.variationId) {
        throw new Error('QR Code inválido - dados incompletos');
      }

      // Validate with API
      const response = await apiService.validateQR(qrData);
      
      if (response.success) {
        // Get exam details
        const examResponse = await apiService.scanQR(parsedData.examId, parsedData.variationId);
        
        setExamData({
          ...examResponse.data,
          examId: parsedData.examId,
          variationId: parsedData.variationId,
        });
        
        setStep('validated');
        success('QR Code válido! Prova encontrada.');
      }
    } catch (error) {
      showError(error.message || 'Erro ao validar QR Code');
      clearResult();
      setValidatingQR(false);
      // Restart scanning after error
      setTimeout(() => {
        if (step === 'scan') {
          handleStartScanning();
        }
      }, 2000);
    }
  };

  const handleStartScanning = () => {
    if (offline) {
      showError('Scanner QR requer conexão com a internet');
      return;
    }

    clearError();
    clearResult();
    setValidatingQR(false);
    setScannerActive(true);
    setStep('scan');
    
    // Small delay to ensure DOM element is ready
    setTimeout(() => {
      startScanning('qr-scanner', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
      });
    }, 100);
  };

  const handleStopScanning = () => {
    stopScanning();
    setScannerActive(false);
    setStep('info');
    clearResult();
    clearError();
    setValidatingQR(false);
  };

  const handleStudentInfoSubmit = (e) => {
    e.preventDefault();
    if (!studentInfo.name.trim() || !studentInfo.studentId.trim()) {
      showError('Preencha todos os campos obrigatórios');
      return;
    }
    
    // Save student info
    localStorage.setItem('studentInfo', JSON.stringify(studentInfo));
    handleStartScanning();
  };

  const handleStartExam = () => {
    if (!examData) return;
    
    // Navigate to exam taking page
    navigate(`/exam/${examData.examId}/${examData.variationId}`, {
      state: { 
        studentInfo,
        examData 
      }
    });
  };

  const handleRetryScanning = () => {
    clearResult();
    clearError();
    setValidatingQR(false);
    handleStartScanning();
  };

  if (step === 'info') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary-600 p-4 rounded-2xl shadow-lg">
                <QrCode className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Scanner de Prova</h1>
            <p className="text-gray-600">Digite suas informações para acessar a prova</p>
          </div>

          {/* Student Info Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleStudentInfoSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={studentInfo.name}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                  Matrícula/ID *
                </label>
                <input
                  id="studentId"
                  type="text"
                  value={studentInfo.studentId}
                  onChange={(e) => setStudentInfo(prev => ({ ...prev, studentId: e.target.value }))}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Sua matrícula ou ID"
                  required
                />
              </div>

              {/* Network Status */}
              <div className="flex items-center justify-center space-x-2 text-sm">
                {offline ? (
                  <div className="flex items-center text-red-600">
                    <WifiOff className="w-4 h-4 mr-1" />
                    <span>Sem conexão - Scanner indisponível</span>
                  </div>
                ) : (
                  <div className="flex items-center text-green-600">
                    <Wifi className="w-4 h-4 mr-1" />
                    <span>Conectado</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={offline}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <Camera className="w-5 h-5 mr-2" />
                Continuar para Scanner
              </button>
            </form>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Como usar:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>1. Preencha suas informações</li>
                <li>2. Escaneie o QR Code da prova</li>
                <li>3. Confirme os dados e inicie a prova</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'scan') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="bg-black bg-opacity-50 p-4 flex items-center justify-between">
          <button
            onClick={handleStopScanning}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <h1 className="text-white font-semibold">Scanner QR</h1>
            <p className="text-gray-300 text-sm">Aponte para o QR Code da prova</p>
          </div>
          
          <button
            onClick={handleStopScanning}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full">
            {/* Scanner Element */}
            <div 
              id="qr-scanner" 
              ref={scannerElementRef}
              className="w-full rounded-lg overflow-hidden"
            />
            
            {/* Loading Overlay */}
            {validatingQR && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Validando QR Code...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-black bg-opacity-50 p-4 text-center">
          <div className="max-w-md mx-auto">
            <div className="flex justify-center mb-2">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <p className="text-white text-sm mb-1">
              Posicione o QR Code dentro da área de escaneamento
            </p>
            <p className="text-gray-300 text-xs">
              Mantenha o dispositivo estável e bem iluminado
            </p>
          </div>
        </div>

        {/* Error Display */}
        {scanError && (
          <div className="absolute bottom-20 left-4 right-4">
            <div className="bg-red-500 text-white p-3 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{scanError}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === 'validated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500 p-4 rounded-2xl shadow-lg">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Code Válido!</h1>
            <p className="text-gray-600">Prova encontrada e validada</p>
          </div>

          {/* Exam Details */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-xl font-semibold mb-4">Detalhes da Prova</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Disciplina:</span>
                <span className="font-medium">{examData?.subject?.name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Prova:</span>
                <span className="font-medium">{examData?.title}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Variação:</span>
                <span className="font-medium">#{examData?.variationId}</span>
              </div>
              
              {examData?.duration && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Duração:</span>
                  <span className="font-medium flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {examData.duration} minutos
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Questões:</span>
                <span className="font-medium">{examData?.questions?.length || 0}</span>
              </div>
            </div>

            <hr className="my-4" />

            <div className="space-y-2">
              <h3 className="font-medium">Dados do Estudante:</h3>
              <div className="text-sm text-gray-600">
                <div>Nome: {studentInfo.name}</div>
                <div>Matrícula: {studentInfo.studentId}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleStartExam}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
            >
              Iniciar Prova
            </button>
            
            <button
              onClick={handleRetryScanning}
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Escanear Novamente
            </button>
          </div>

          {/* Warning */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Atenção:</p>
                <p>
                  Ao iniciar a prova, o tempo começará a contar. 
                  Certifique-se de estar preparado antes de continuar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}