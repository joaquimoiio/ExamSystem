import React, { useState, useEffect, useRef } from 'react'
import { useQRScanner } from '../../hooks/useQRScanner'
import Button from '../Common/Button'
import Modal from '../Common/Modal'

const QRScanner = ({ 
  onScanSuccess, 
  onScanError, 
  isOpen = false, 
  onClose,
  title = "Escanear QR Code",
  description = "Posicione o QR Code dentro da área de escaneamento"
}) => {
  const [scannerElementId] = useState('qr-scanner-' + Math.random().toString(36).substr(2, 9))
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  const {
    isScanning,
    scanResult,
    error,
    cameras,
    selectedCamera,
    hasPermission,
    startScanning,
    stopScanning,
    scanFromFile,
    switchCamera,
    reset,
    checkPermission
  } = useQRScanner({
    onScanSuccess: (text, result) => {
      if (onScanSuccess) {
        onScanSuccess(text, result)
      }
      // Auto close on successful scan
      if (onClose) {
        onClose()
      }
    },
    onScanFailure: (error) => {
      if (onScanError) {
        onScanError(error)
      }
    }
  })

  // Start scanning when modal opens
  useEffect(() => {
    if (isOpen && !isScanning) {
      const timer = setTimeout(() => {
        startScanning(scannerElementId)
      }, 500) // Small delay to ensure DOM is ready
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, startScanning, scannerElementId, isScanning])

  // Stop scanning when modal closes
  useEffect(() => {
    if (!isOpen && isScanning) {
      stopScanning()
    }
  }, [isOpen, isScanning, stopScanning])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isScanning) {
        stopScanning()
      }
    }
  }, [isScanning, stopScanning])

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      await scanFromFile(file)
    }
  }

  const handleFileScanClick = () => {
    fileInputRef.current?.click()
  }

  const handleRetry = () => {
    reset()
    if (hasPermission) {
      startScanning(scannerElementId)
    } else {
      checkPermission()
    }
  }

  const handleClose = () => {
    if (isScanning) {
      stopScanning()
    }
    reset()
    setSelectedFile(null)
    if (onClose) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
      className="qr-scanner-modal"
    >
      <div className="space-y-6">
        {/* Description */}
        <p className="text-sm text-gray-600 text-center">
          {description}
        </p>

        {/* Permission Error */}
        {hasPermission === false && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Permissão de câmera necessária
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  Para escanear QR codes, é necessário permitir o acesso à câmera. 
                  Clique em "Permitir" quando solicitado pelo navegador.
                </p>
                <div className="mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={checkPermission}
                  >
                    Solicitar Permissão
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scanner Container */}
        {hasPermission !== false && (
          <div className="relative">
            {/* Scanner Element */}
            <div 
              id={scannerElementId}
              className="qr-scanner-container bg-black rounded-lg overflow-hidden"
              style={{ minHeight: '300px' }}
            />

            {/* Loading Overlay */}
            {!isScanning && hasPermission === null && (
              <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Iniciando câmera...</p>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 bg-red-900 bg-opacity-75 flex items-center justify-center rounded-lg">
                <div className="text-center text-white p-4">
                  <svg className="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm font-medium mb-2">Erro no Scanner</p>
                  <p className="text-xs mb-3">{error}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRetry}
                  >
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Camera Selection */}
        {cameras.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Câmera
            </label>
            <select
              value={selectedCamera || ''}
              onChange={(e) => switchCamera(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || `Câmera ${camera.id}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* File Upload Alternative */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600 text-center mb-3">
            Ou selecione uma imagem com QR Code do seu dispositivo
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            variant="secondary"
            onClick={handleFileScanClick}
            className="w-full"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          >
            Selecionar Imagem
          </Button>

          {selectedFile && (
            <div className="mt-2 text-sm text-gray-600 text-center">
              Arquivo selecionado: {selectedFile.name}
            </div>
          )}
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  QR Code Escaneado com Sucesso!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p className="font-mono bg-green-100 p-2 rounded border">
                    {scanResult.text}
                  </p>
                </div>
                {scanResult.source === 'file' && (
                  <p className="mt-1 text-xs text-green-600">
                    Escaneado do arquivo: {scanResult.fileName}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Como usar o scanner
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Posicione o QR Code dentro da área de escaneamento</li>
                  <li>Mantenha o código bem iluminado e nítido</li>
                  <li>Aguarde alguns segundos para o escaneamento automático</li>
                  <li>Se a câmera não funcionar, use a opção de upload de imagem</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          {isScanning && (
            <Button
              variant="secondary"
              onClick={stopScanning}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l6 6m0-6l-6 6" />
                </svg>
              }
            >
              Parar Scanner
            </Button>
          )}
          
          {!isScanning && hasPermission && (
            <Button
              variant="primary"
              onClick={() => startScanning(scannerElementId)}
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M12 5v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              Iniciar Scanner
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={handleClose}
          >
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Simple QR Scanner Button Component
export const QRScannerButton = ({ 
  onScanSuccess, 
  onScanError, 
  buttonText = "Escanear QR Code",
  buttonVariant = "primary",
  buttonSize = "md",
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleScanSuccess = (text, result) => {
    setIsOpen(false)
    if (onScanSuccess) {
      onScanSuccess(text, result)
    }
  }

  const handleScanError = (error) => {
    if (onScanError) {
      onScanError(error)
    }
  }

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setIsOpen(true)}
        className={className}
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 4h5v5H4V4zm11 11h5v5h-5v-5zM4 15h5v5H4v-5z" />
          </svg>
        }
      >
        {buttonText}
      </Button>

      <QRScanner
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />
    </>
  )
}

// Inline QR Scanner Component (without modal)
export const InlineQRScanner = ({ 
  onScanSuccess, 
  onScanError,
  className = "",
  height = "300px"
}) => {
  const [scannerElementId] = useState('inline-qr-scanner-' + Math.random().toString(36).substr(2, 9))

  const {
    isScanning,
    scanResult,
    error,
    cameras,
    selectedCamera,
    hasPermission,
    startScanning,
    stopScanning,
    switchCamera,
    reset,
    checkPermission
  } = useQRScanner({
    onScanSuccess,
    onScanFailure: onScanError
  })

  useEffect(() => {
    if (hasPermission && !isScanning) {
      startScanning(scannerElementId)
    }
  }, [hasPermission, isScanning, startScanning, scannerElementId])

  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Permission Error */}
      {hasPermission === false && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-sm font-medium text-red-800 mb-2">
              Permissão de câmera necessária
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={checkPermission}
            >
              Permitir Câmera
            </Button>
          </div>
        </div>
      )}

      {/* Scanner Container */}
      {hasPermission !== false && (
        <div className="relative">
          <div 
            id={scannerElementId}
            className="qr-scanner-container bg-black rounded-lg overflow-hidden"
            style={{ height }}
          />

          {/* Loading State */}
          {!isScanning && hasPermission === null && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">Iniciando câmera...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 bg-red-900 bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="text-center text-white p-4">
                <svg className="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm font-medium mb-2">Erro no Scanner</p>
                <p className="text-xs mb-3">{error}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    reset()
                    startScanning(scannerElementId)
                  }}
                >
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Camera Selection */}
      {cameras.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Câmera
          </label>
          <select
            value={selectedCamera || ''}
            onChange={(e) => switchCamera(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Câmera ${camera.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scanner Controls */}
      <div className="flex justify-center space-x-3">
        {isScanning ? (
          <Button
            variant="secondary"
            onClick={stopScanning}
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l6 6m0-6l-6 6" />
              </svg>
            }
          >
            Parar
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => startScanning(scannerElementId)}
            disabled={hasPermission === false}
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M12 5v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            Iniciar
          </Button>
        )}
      </div>

      {/* Success Message */}
      {scanResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                QR Code Escaneado!
              </h3>
              <p className="mt-1 text-sm text-green-700 font-mono bg-green-100 p-2 rounded">
                {scanResult.text}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QRScanner