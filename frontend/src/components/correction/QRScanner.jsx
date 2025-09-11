import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, X, Upload, CheckCircle, AlertCircle, 
  RefreshCw, Info, ScanLine 
} from 'lucide-react';
import qrService from '../../services/qrService';

const QRScanner = ({ 
  onQRDetected, 
  onClose, 
  title = "Escanear QR Code do Gabarito",
  isOpen = false 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [qrInfo, setQrInfo] = useState(null);
  const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'file'
  const [stream, setStream] = useState(null);
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      startCameraScanning();
    }
    
    return () => {
      stopScanning();
    };
  }, [isOpen, scanMode]);

  const startCameraScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);
      
      // Request camera access
      const mediaStream = await qrService.requestCameraAccess();
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        
        // Start QR scanning loop
        const scanLoop = async () => {
          try {
            const result = await qrService.scanQRFromVideo(videoRef.current);
            handleQRDetected(result);
          } catch (scanError) {
            if (scanError.message.includes('Timeout')) {
              setError('QR Code não encontrado. Posicione o QR Code na frente da câmera.');
            }
          }
        };
        
        // Start scanning after video is ready
        videoRef.current.onloadedmetadata = () => {
          scanIntervalRef.current = setInterval(scanLoop, 1000);
        };
      }
    } catch (err) {
      setError(err.message);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setError(null);
      setIsScanning(true);
      
      const result = await qrService.scanQRFromFile(file);
      handleQRDetected(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleQRDetected = (result) => {
    try {
      // Validate QR code
      const validation = qrService.validateAnswerKeyQR(result.data);
      
      if (!validation.valid) {
        setError(validation.message);
        return;
      }

      // Format QR data for display
      const formattedData = qrService.formatQRDataForDisplay(result.data);
      setQrInfo(formattedData);
      
      // Stop scanning
      stopScanning();
      
      // Notify parent component
      if (onQRDetected) {
        onQRDetected({
          qrData: result.data,
          rawData: result.rawData,
          formattedData,
          location: result.location
        });
      }
    } catch (err) {
      setError('Erro ao processar QR Code: ' + err.message);
    }
  };

  const resetScanner = () => {
    setError(null);
    setQrInfo(null);
    if (scanMode === 'camera') {
      startCameraScanning();
    }
  };

  const handleClose = () => {
    stopScanning();
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
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

          {/* Scanner Area */}
          <div className="relative">
            {scanMode === 'camera' && (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <ScanLine className="w-16 h-16 text-green-500 animate-pulse" />
                      <div className="absolute inset-0 border-2 border-green-500 rounded-lg animate-ping"></div>
                    </div>
                  </div>
                )}
                
                {!isScanning && !qrInfo && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                    <button
                      onClick={startCameraScanning}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                      <Camera className="w-5 h-5 inline mr-2" />
                      Iniciar Escaneamento
                    </button>
                  </div>
                )}
              </div>
            )}

            {scanMode === 'file' && (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Selecione uma imagem contendo o QR Code
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
                  disabled={isScanning}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
                >
                  {isScanning ? (
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
                onClick={resetScanner}
                className="mt-3 text-sm text-red-600 dark:text-red-300 hover:text-red-700 dark:hover:text-red-200 font-medium"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Success Display */}
          {qrInfo && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    QR Code Detectado com Sucesso!
                  </h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Prova:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{qrInfo.examTitle}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Variação:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{qrInfo.variationNumber}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Disciplina:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{qrInfo.subjectName}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Questões:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{qrInfo.totalQuestions}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!qrInfo && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Como usar:</h4>
                  <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                    <li>• Posicione o QR Code da prova na frente da câmera</li>
                    <li>• Certifique-se de que há boa iluminação</li>
                    <li>• Mantenha a câmera estável até a detecção</li>
                    <li>• Ou selecione uma imagem do QR Code do seu dispositivo</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {qrInfo && (
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={resetScanner}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Escanear Outro
            </button>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;