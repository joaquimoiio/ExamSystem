import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, X, Upload, CheckCircle, AlertCircle, 
  RefreshCw, Info, ScanLine, Eye, Settings, 
  ZoomIn, RotateCw 
} from 'lucide-react';
import visionService from '../../services/visionService';

const GabaritoScanner = ({ 
  onAnswersDetected, 
  onClose, 
  qrData,
  title = "Detectar Respostas do Gabarito",
  isOpen = false 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [detectedAnswers, setDetectedAnswers] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'file'
  const [stream, setStream] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const totalQuestions = qrData?.totalQuestions || 20;

  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen, scanMode]);

  const startCamera = async () => {
    try {
      setError(null);
      
      // Request camera access
      const mediaStream = await visionService.cv ? 
        navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        }) : 
        await requestCameraFallback();
        
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      setError('Erro ao acessar câmera: ' + err.message);
    }
  };

  const requestCameraFallback = async () => {
    return navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment'
      }
    });
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureAndProcess = async () => {
    if (!videoRef.current) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Capture frame from video
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Create image element for processing
      const imageElement = new Image();
      imageElement.onload = async () => {
        await processGabarito(imageElement);
      };
      imageElement.src = canvas.toDataURL();
      
    } catch (err) {
      setError('Erro ao capturar imagem: ' + err.message);
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      
      const imageElement = new Image();
      imageElement.onload = async () => {
        await processGabarito(imageElement);
      };
      
      const reader = new FileReader();
      reader.onload = (e) => {
        imageElement.src = e.target.result;
      };
      reader.readAsDataURL(file);
      
    } catch (err) {
      setError('Erro ao carregar arquivo: ' + err.message);
      setIsProcessing(false);
    }
  };

  const processGabarito = async (imageElement) => {
    try {
      // Initialize vision service
      await visionService.initialize();
      
      // Correct perspective
      const correctedMat = await visionService.correctGabaritoPerspective(imageElement);
      
      // Show corrected image in preview
      if (previewCanvasRef.current) {
        visionService.matToCanvas(correctedMat, previewCanvasRef.current.id);
        setShowPreview(true);
      }
      
      // Detect answers
      const detectionResult = await visionService.detectAnswers(correctedMat, totalQuestions);
      
      setDetectedAnswers(detectionResult.answers);
      setConfidence(detectionResult.confidence);
      setProcessedImage(correctedMat);
      
      // Cleanup
      correctedMat.delete();
      
    } catch (err) {
      setError('Erro ao processar gabarito: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAnswers = () => {
    if (detectedAnswers && onAnswersDetected) {
      onAnswersDetected({
        answers: detectedAnswers,
        confidence: confidence,
        totalQuestions: totalQuestions
      });
    }
  };

  const resetDetection = () => {
    setDetectedAnswers(null);
    setConfidence(0);
    setError(null);
    setShowPreview(false);
    if (processedImage) {
      processedImage.delete();
      setProcessedImage(null);
    }
  };

  const handleClose = () => {
    stopCamera();
    resetDetection();
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {qrData?.examTitle} - Variação {qrData?.variationNumber}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Scan Mode Toggle */}
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setScanMode('camera')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                scanMode === 'camera'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Câmera
            </button>
            <button
              onClick={() => setScanMode('file')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                scanMode === 'file'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Arquivo
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scanner Area */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Captura</h3>
              
              {scanMode === 'camera' && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-80 bg-gray-900 rounded-lg object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {stream && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <button
                        onClick={captureAndProcess}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium shadow-lg"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-5 h-5 inline mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Camera className="w-5 h-5 inline mr-2" />
                            Capturar Gabarito
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {!stream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                      <button
                        onClick={startCamera}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                      >
                        <Camera className="w-5 h-5 inline mr-2" />
                        Iniciar Câmera
                      </button>
                    </div>
                  )}
                </div>
              )}

              {scanMode === 'file' && (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Selecione uma foto do gabarito preenchido
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 inline mr-2" />
                        Escolher Arquivo
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Preview and Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Resultado</h3>
                {showPreview && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    {showPreview ? 'Ocultar' : 'Mostrar'} Preview
                  </button>
                )}
              </div>

              {showPreview && (
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <canvas
                    ref={previewCanvasRef}
                    id="preview-canvas"
                    className="max-w-full h-auto rounded"
                  />
                </div>
              )}

              {detectedAnswers && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <div>
                        <h4 className="font-medium text-green-800 dark:text-green-200">
                          Respostas Detectadas
                        </h4>
                        <p className="text-sm text-green-600 dark:text-green-300">
                          Confiança: {confidence}% | {detectedAnswers.filter(a => a !== null).length}/{totalQuestions} questões
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Answer Grid */}
                  <div className="grid grid-cols-5 gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg max-h-60 overflow-y-auto">
                    {detectedAnswers.map((answer, index) => (
                      <div
                        key={index}
                        className={`text-center p-2 rounded text-sm font-medium ${
                          answer !== null
                            ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <div className="font-bold">{index + 1}</div>
                        <div>{answer !== null ? ['A', 'B', 'C', 'D', 'E'][answer] : '?'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-200">Erro</h4>
                  <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={resetDetection}
                className="mt-3 text-sm text-red-600 dark:text-red-300 hover:text-red-700 dark:hover:text-red-200 font-medium"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Instructions */}
          {!detectedAnswers && !isProcessing && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Dicas para melhor detecção:</h4>
                  <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                    <li>• Certifique-se de que todos os 4 cantos do gabarito estão visíveis</li>
                    <li>• Use boa iluminação, evite sombras</li>
                    <li>• Mantenha o gabarito plano e sem dobras</li>
                    <li>• As bolhas devem estar bem preenchidas e escuras</li>
                    <li>• Evite borrões ou rasuras no gabarito</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {detectedAnswers && (
          <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Confiança da detecção: <span className="font-medium">{confidence}%</span>
              {confidence < 70 && (
                <span className="text-orange-600 dark:text-orange-400 ml-2">
                  (Recomendamos verificar manualmente)
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetDetection}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Detectar Novamente
              </button>
              <button
                onClick={handleConfirmAnswers}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                Confirmar e Corrigir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GabaritoScanner;