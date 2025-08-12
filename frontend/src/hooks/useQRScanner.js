import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode'

/**
 * Hook for QR Code scanning functionality
 * @param {object} config - Scanner configuration
 * @returns {object} Scanner state and methods
 */
export const useQRScanner = (config = {}) => {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState(null)
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState(null)
  const [hasPermission, setHasPermission] = useState(null)
  
  const scannerRef = useRef(null)
  const elementRef = useRef(null)

  // Default configuration
  const defaultConfig = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    disableFlip: false,
    verbose: process.env.NODE_ENV === 'development',
    formatsToSupport: ['QR_CODE'],
    ...config
  }

  // Get available cameras
  const getCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras()
      setCameras(devices)
      
      if (devices.length > 0) {
        // Prefer back camera if available
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        )
        setSelectedCamera(backCamera ? backCamera.id : devices[0].id)
      }
      
      return devices
    } catch (err) {
      console.error('Error getting cameras:', err)
      setError('Não foi possível acessar as câmeras')
      return []
    }
  }, [])

  // Check camera permission
  const checkPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      setHasPermission(true)
      return true
    } catch (err) {
      setHasPermission(false)
      setError('Permissão de câmera negada')
      return false
    }
  }, [])

  // Start scanning
  const startScanning = useCallback(async (elementId) => {
    if (isScanning) return

    try {
      setError(null)
      setIsScanning(true)

      // Check permission first
      const permissionGranted = await checkPermission()
      if (!permissionGranted) {
        setIsScanning(false)
        return
      }

      // Get cameras if not already loaded
      if (cameras.length === 0) {
        await getCameras()
      }

      const scanner = new Html5QrcodeScanner(
        elementId,
        {
          fps: defaultConfig.fps,
          qrbox: defaultConfig.qrbox,
          aspectRatio: defaultConfig.aspectRatio,
          disableFlip: defaultConfig.disableFlip,
          verbose: defaultConfig.verbose,
          formatsToSupport: defaultConfig.formatsToSupport
        },
        false // verbose
      )

      scanner.render(
        (decodedText, decodedResult) => {
          setScanResult({
            text: decodedText,
            result: decodedResult,
            timestamp: new Date().toISOString()
          })
          
          if (config.onScanSuccess) {
            config.onScanSuccess(decodedText, decodedResult)
          }
        },
        (error) => {
          // Only log errors in development
          if (defaultConfig.verbose && !error.includes('NotFoundException')) {
            console.warn('QR scan error:', error)
          }
          
          if (config.onScanFailure) {
            config.onScanFailure(error)
          }
        }
      )

      scannerRef.current = scanner
    } catch (err) {
      console.error('Error starting scanner:', err)
      setError('Erro ao iniciar o scanner')
      setIsScanning(false)
    }
  }, [isScanning, cameras, selectedCamera, checkPermission, getCameras, config, defaultConfig])

  // Stop scanning
  const stopScanning = useCallback(async () => {
    if (!isScanning || !scannerRef.current) return

    try {
      await scannerRef.current.clear()
      scannerRef.current = null
      setIsScanning(false)
      setScanResult(null)
      setError(null)
    } catch (err) {
      console.error('Error stopping scanner:', err)
      setError('Erro ao parar o scanner')
    }
  }, [isScanning])

  // Scan from file
  const scanFromFile = useCallback(async (file) => {
    try {
      setError(null)
      
      if (!file) {
        setError('Nenhum arquivo selecionado')
        return null
      }

      if (!file.type.startsWith('image/')) {
        setError('Arquivo deve ser uma imagem')
        return null
      }

      const html5QrCode = new Html5Qrcode('temp-scanner')
      const result = await html5QrCode.scanFile(file, true)
      
      const scanResult = {
        text: result,
        timestamp: new Date().toISOString(),
        source: 'file',
        fileName: file.name
      }
      
      setScanResult(scanResult)
      
      if (config.onScanSuccess) {
        config.onScanSuccess(result, scanResult)
      }
      
      return scanResult
    } catch (err) {
      const errorMessage = 'QR Code não encontrado na imagem'
      setError(errorMessage)
      
      if (config.onScanFailure) {
        config.onScanFailure(errorMessage)
      }
      
      return null
    }
  }, [config])

  // Switch camera
  const switchCamera = useCallback(async (cameraId) => {
    if (!cameraId || cameraId === selectedCamera) return

    try {
      if (isScanning) {
        await stopScanning()
        setSelectedCamera(cameraId)
        
        // Restart with new camera
        setTimeout(() => {
          if (elementRef.current) {
            startScanning(elementRef.current.id)
          }
        }, 100)
      } else {
        setSelectedCamera(cameraId)
      }
    } catch (err) {
      console.error('Error switching camera:', err)
      setError('Erro ao trocar câmera')
    }
  }, [isScanning, selectedCamera, stopScanning, startScanning])

  // Reset scanner state
  const reset = useCallback(() => {
    setScanResult(null)
    setError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
  }, [])

  // Load cameras on mount
  useEffect(() => {
    getCameras()
  }, [getCameras])

  return {
    // State
    isScanning,
    scanResult,
    error,
    cameras,
    selectedCamera,
    hasPermission,
    
    // Methods
    startScanning,
    stopScanning,
    scanFromFile,
    switchCamera,
    reset,
    checkPermission,
    getCameras,
    
    // Refs
    elementRef,
    scannerRef
  }
}

/**
 * Hook for simple QR code scanning with automatic start/stop
 * @param {string} elementId - HTML element ID for scanner
 * @param {function} onScan - Callback when QR is scanned
 * @param {object} options - Scanner options
 * @returns {object} Scanner state and methods
 */
export const useSimpleQRScanner = (elementId, onScan, options = {}) => {
  const [isActive, setIsActive] = useState(false)
  
  const scanner = useQRScanner({
    ...options,
    onScanSuccess: (text, result) => {
      if (onScan) {
        onScan(text, result)
      }
      if (options.stopOnScan !== false) {
        setIsActive(false)
      }
    }
  })

  // Auto start/stop based on isActive
  useEffect(() => {
    if (isActive && elementId) {
      scanner.startScanning(elementId)
    } else if (!isActive && scanner.isScanning) {
      scanner.stopScanning()
    }
  }, [isActive, elementId, scanner])

  const toggle = useCallback(() => {
    setIsActive(prev => !prev)
  }, [])

  const start = useCallback(() => {
    setIsActive(true)
  }, [])

  const stop = useCallback(() => {
    setIsActive(false)
  }, [])

  return {
    ...scanner,
    isActive,
    toggle,
    start,
    stop
  }
}

/**
 * Hook for QR scanner with result validation
 * @param {function} validator - Function to validate scan result
 * @param {object} config - Scanner configuration
 * @returns {object} Scanner state and methods
 */
export const useValidatedQRScanner = (validator, config = {}) => {
  const [validationError, setValidationError] = useState(null)
  const [validResult, setValidResult] = useState(null)

  const scanner = useQRScanner({
    ...config,
    onScanSuccess: (text, result) => {
      setValidationError(null)
      
      try {
        const isValid = validator ? validator(text, result) : true
        
        if (isValid) {
          setValidResult({ text, result, timestamp: new Date().toISOString() })
          
          if (config.onValidScan) {
            config.onValidScan(text, result)
          }
        } else {
          setValidationError('QR Code inválido')
          
          if (config.onInvalidScan) {
            config.onInvalidScan(text, result)
          }
        }
      } catch (err) {
        setValidationError('Erro na validação do QR Code')
        console.error('Validation error:', err)
      }
    }
  })

  const reset = useCallback(() => {
    scanner.reset()
    setValidationError(null)
    setValidResult(null)
  }, [scanner])

  return {
    ...scanner,
    validationError,
    validResult,
    reset
  }
}

/**
 * Hook for batch QR scanning
 * @param {object} config - Scanner configuration
 * @returns {object} Scanner state and methods
 */
export const useBatchQRScanner = (config = {}) => {
  const [scannedCodes, setScannedCodes] = useState([])
  const [duplicatesCount, setDuplicatesCount] = useState(0)

  const scanner = useQRScanner({
    ...config,
    onScanSuccess: (text, result) => {
      setScannedCodes(prev => {
        const exists = prev.some(item => item.text === text)
        
        if (exists) {
          setDuplicatesCount(count => count + 1)
          
          if (config.onDuplicateScan) {
            config.onDuplicateScan(text, result)
          }
          
          return prev
        }
        
        const newItem = {
          text,
          result,
          timestamp: new Date().toISOString(),
          id: Date.now() + Math.random()
        }
        
        if (config.onNewScan) {
          config.onNewScan(text, result, newItem)
        }
        
        return [...prev, newItem]
      })
    }
  })

  const removeScanned = useCallback((id) => {
    setScannedCodes(prev => prev.filter(item => item.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setScannedCodes([])
    setDuplicatesCount(0)
  }, [])

  const exportResults = useCallback(() => {
    return {
      codes: scannedCodes,
      total: scannedCodes.length,
      duplicates: duplicatesCount,
      exportedAt: new Date().toISOString()
    }
  }, [scannedCodes, duplicatesCount])

  return {
    ...scanner,
    scannedCodes,
    duplicatesCount,
    removeScanned,
    clearAll,
    exportResults
  }
}

export default useQRScanner