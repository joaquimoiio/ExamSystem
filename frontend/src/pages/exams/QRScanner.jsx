import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, CheckCircle, XCircle, AlertTriangle, QrCode } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import apiService from '../../services/api';

export default function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [answerData, setAnswerData] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { success, error: showError } = useToast();

  // Função para iniciar a câmera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Usar câmera traseira se disponível
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (err) {
      setError('Erro ao acessar a câmera. Verifique as permissões.');
      console.error('Erro ao acessar câmera:', err);
    }
  }, []);

  // Função para parar a câmera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Função para processar arquivo de imagem
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setLoading(true);
    setError(null);

    try {
      // Simular leitura de QR code da imagem
      // Em uma implementação real, você usaria uma biblioteca como jsQR
      const formData = new FormData();
      formData.append('qrImage', file);
      
      // Por enquanto, vamos simular dados
      setTimeout(() => {
        const mockQRData = {
          examId: '12345',
          studentId: 'student123',
          answers: ['A', 'B', 'C', 'A', 'D'],
          submissionId: Date.now().toString()
        };
        
        setScanResult(mockQRData);
        processAnswers(mockQRData);
        setLoading(false);
      }, 2000);
      
    } catch (err) {
      setError('Erro ao processar imagem');
      setLoading(false);
    }
  };

  // Função para processar as respostas
  const processAnswers = async (qrData) => {
    try {
      setLoading(true);
      
      // Enviar dados para o backend para correção
      const response = await apiService.post('/exams/validate-qr', {
        examId: qrData.examId,
        studentId: qrData.studentId,
        answers: qrData.answers,
        submissionId: qrData.submissionId
      });
      
      setAnswerData(response.data);
      success('Respostas processadas com sucesso!');
      
    } catch (err) {
      setError('Erro ao processar respostas: ' + (err.message || 'Erro desconhecido'));
      showError('Erro ao validar respostas');
    } finally {
      setLoading(false);
    }
  };

  // Função para capturar frame da câmera
  const captureFrame = useCallback(() => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    // Aqui você processaria a imagem para detectar QR code
    // Por enquanto, vamos simular
    const mockData = {
      examId: '67890',
      studentId: 'student456',
      answers: ['C', 'A', 'B', 'D', 'A'],
      submissionId: Date.now().toString()
    };
    
    setScanResult(mockData);
    processAnswers(mockData);
    stopCamera();
  }, [stopCamera]);

  const resetScanner = () => {
    setScanResult(null);
    setAnswerData(null);
    setError(null);
    setSelectedFile(null);
    stopCamera();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <QrCode className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scanner de QR Code</h1>
        <p className="text-gray-600">Escaneie o QR code da folha de respostas para correção automática</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Scanner Options */}
      {!scanResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Camera Scanner */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Escanear com Câmera
            </h3>
            
            {!isScanning ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Use a câmera para escanear o QR code</p>
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Iniciar Câmera
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 bg-black rounded-lg"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={captureFrame}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Processando...' : 'Capturar QR Code'}
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Parar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Upload de Imagem
            </h3>
            
            <div className="text-center">
              <p className="text-gray-600 mb-4">Faça upload de uma foto do QR code</p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <span className="text-gray-600">Clique para selecionar</span>
                </div>
              </label>
              
              {selectedFile && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Arquivo: {selectedFile.name}
                  </p>
                  {loading && (
                    <div className="mt-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="text-xs text-gray-500 mt-1">Processando...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scan Result */}
      {scanResult && (
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            QR Code Detectado
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Dados Escaneados</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID da Prova:</span>
                  <span className="font-mono">{scanResult.examId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ID do Aluno:</span>
                  <span className="font-mono">{scanResult.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Respostas:</span>
                  <span className="font-mono">[{scanResult.answers.join(', ')}]</span>
                </div>
              </div>
            </div>
            
            {answerData && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Resultado da Correção</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nota:</span>
                    <span className={`font-semibold ${
                      answerData.score >= 7 ? 'text-green-600' : 
                      answerData.score >= 5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {answerData.score}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Acertos:</span>
                    <span>{answerData.correctAnswers}/{answerData.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Percentual:</span>
                    <span>{answerData.percentage}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={resetScanner}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Escanear Outro
            </button>
            {answerData && (
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Salvar Resultado
              </button>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-medium text-blue-900 mb-3 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Instruções
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Certifique-se de que o QR code está bem visível e focado</li>
          <li>• Use boa iluminação para melhor leitura</li>
          <li>• O QR code deve estar completo e sem distorções</li>
          <li>• Para melhores resultados, mantenha a câmera estável</li>
        </ul>
      </div>
    </div>
  );
}