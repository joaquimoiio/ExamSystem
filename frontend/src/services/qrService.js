import jsQR from 'jsqr';

/**
 * QR Code Service for scanning and processing QR codes
 */
class QRService {
  constructor() {
    this.stream = null;
    this.video = null;
  }

  /**
   * Request camera access
   */
  async requestCameraAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera preferred for mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      this.stream = stream;
      return stream;
    } catch (error) {
      console.error('❌ Camera access denied:', error);
      throw new Error('Acesso à câmera negado. Verifique as permissões.');
    }
  }

  /**
   * Stop camera stream
   */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  /**
   * Scan QR code from video element
   */
  scanQRFromVideo(videoElement) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      const scan = () => {
        if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
          canvas.height = videoElement.videoHeight;
          canvas.width = videoElement.videoWidth;
          
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code) {
            try {
              const qrData = JSON.parse(code.data);
              resolve({
                data: qrData,
                rawData: code.data,
                location: code.location
              });
            } catch (parseError) {
              reject(new Error('QR Code inválido: dados corrompidos'));
            }
          } else {
            // Continue scanning
            requestAnimationFrame(scan);
          }
        } else {
          requestAnimationFrame(scan);
        }
      };
      
      scan();
      
      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Timeout: QR Code não encontrado'));
      }, 30000);
    });
  }

  /**
   * Scan QR code from image file
   */
  async scanQRFromFile(file) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          try {
            const qrData = JSON.parse(code.data);
            resolve({
              data: qrData,
              rawData: code.data,
              location: code.location
            });
          } catch (parseError) {
            reject(new Error('QR Code inválido: dados corrompidos'));
          }
        } else {
          reject(new Error('QR Code não encontrado na imagem'));
        }
      };
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar a imagem'));
      };
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate answer key QR code
   */
  validateAnswerKeyQR(qrData) {
    if (!qrData || typeof qrData !== 'object') {
      return {
        valid: false,
        message: 'Dados do QR code inválidos'
      };
    }

    if (qrData.type !== 'answer_key') {
      return {
        valid: false,
        message: 'QR Code não é de gabarito de prova'
      };
    }

    const requiredFields = ['examId', 'variationId', 'answerKey'];
    const missingFields = requiredFields.filter(field => !qrData[field]);
    
    if (missingFields.length > 0) {
      return {
        valid: false,
        message: `Campos obrigatórios ausentes: ${missingFields.join(', ')}`
      };
    }

    if (!Array.isArray(qrData.answerKey) || qrData.answerKey.length === 0) {
      return {
        valid: false,
        message: 'Gabarito deve conter pelo menos uma questão'
      };
    }

    return { valid: true };
  }

  /**
   * Format QR data for display
   */
  formatQRDataForDisplay(qrData) {
    if (!qrData) return null;

    return {
      examTitle: qrData.examTitle || 'Título não disponível',
      variationNumber: qrData.variationNumber || 'N/A',
      subjectName: qrData.subjectName || 'N/A',
      totalQuestions: qrData.totalQuestions || qrData.answerKey?.length || 0,
      totalPoints: qrData.totalPoints || 0,
      generatedAt: qrData.generatedAt ? new Date(qrData.generatedAt).toLocaleString('pt-BR') : 'N/A',
      version: qrData.version || '1.0'
    };
  }
}

export default new QRService();