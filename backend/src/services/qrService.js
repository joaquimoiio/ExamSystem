const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

class QRService {
  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Generate QR code data for exam variation
   */
  generateExamVariationData(examId, variationId) {
    return {
      type: 'exam_variation',
      examId,
      variationId,
      timestamp: new Date().toISOString(),
      id: uuidv4()
    };
  }

  /**
   * Generate QR code URL for exam variation
   */
  generateExamVariationUrl(examId, variationId) {
    return `${this.baseUrl}/correction/${examId}/${variationId}`;
  }

  /**
   * Generate QR code as base64 data URL
   */
  async generateQRCodeDataURL(data, options = {}) {
    try {
      const qrOptions = {
        width: options.width || 200,
        margin: options.margin || 2,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        },
        errorCorrectionLevel: options.errorCorrectionLevel || 'M'
      };

      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      return await QRCode.toDataURL(dataString, qrOptions);
    } catch (error) {
      console.error('Error generating QR code data URL:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code as SVG string
   */
  async generateQRCodeSVG(data, options = {}) {
    try {
      const qrOptions = {
        width: options.width || 200,
        margin: options.margin || 2,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        },
        errorCorrectionLevel: options.errorCorrectionLevel || 'M'
      };

      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      return await QRCode.toString(dataString, { 
        type: 'svg',
        ...qrOptions 
      });
    } catch (error) {
      console.error('Error generating QR code SVG:', error);
      throw new Error('Failed to generate QR code SVG');
    }
  }

  /**
   * Generate QR code as buffer (for PDF embedding)
   */
  async generateQRCodeBuffer(data, options = {}) {
    try {
      const qrOptions = {
        width: options.width || 200,
        margin: options.margin || 2,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        },
        errorCorrectionLevel: options.errorCorrectionLevel || 'M'
      };

      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      return await QRCode.toBuffer(dataString, qrOptions);
    } catch (error) {
      console.error('Error generating QR code buffer:', error);
      throw new Error('Failed to generate QR code buffer');
    }
  }

  /**
   * Generate unique QR code for exam variation
   */
  async generateExamVariationQR(examId, variationId, options = {}) {
    try {
      const qrData = this.generateExamVariationData(examId, variationId);
      const qrUrl = this.generateExamVariationUrl(examId, variationId);
      
      // Use URL for the actual QR code (easier for students to scan)
      const qrCodeDataURL = await this.generateQRCodeDataURL(qrUrl, options);
      
      return {
        data: qrData,
        url: qrUrl,
        qrCode: qrUrl, // Store the URL as the QR code data
        qrCodeDataURL,
        qrCodeId: qrData.id
      };
    } catch (error) {
      console.error('Error generating exam variation QR:', error);
      throw new Error('Failed to generate exam variation QR code');
    }
  }

  /**
   * Validate QR code data
   */
  validateQRData(qrData) {
    try {
      // If it's a URL, validate the format
      if (typeof qrData === 'string' && qrData.startsWith(this.baseUrl)) {
        const urlPattern = new RegExp(`^${this.baseUrl}/correction/([a-f0-9-]+)/([a-f0-9-]+)$`);
        return urlPattern.test(qrData);
      }

      // If it's JSON data, validate the structure
      if (typeof qrData === 'object') {
        return (
          qrData.type === 'exam_variation' &&
          qrData.examId &&
          qrData.variationId &&
          qrData.timestamp &&
          qrData.id
        );
      }

      // Try to parse as JSON
      const parsed = JSON.parse(qrData);
      return this.validateQRData(parsed);
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract exam and variation IDs from QR data
   */
  extractExamData(qrData) {
    try {
      // If it's a URL
      if (typeof qrData === 'string' && qrData.startsWith(this.baseUrl)) {
        const match = qrData.match(/\/correction\/([a-f0-9-]+)\/([a-f0-9-]+)$/);
        if (match) {
          return {
            examId: match[1],
            variationId: match[2]
          };
        }
      }

      // If it's JSON data
      if (typeof qrData === 'object') {
        return {
          examId: qrData.examId,
          variationId: qrData.variationId
        };
      }

      // Try to parse as JSON
      const parsed = JSON.parse(qrData);
      return this.extractExamData(parsed);
    } catch (error) {
      console.error('Error extracting exam data from QR:', error);
      return null;
    }
  }

  /**
   * Generate batch QR codes for multiple variations
   */
  async generateBatchQRCodes(examId, variations, options = {}) {
    try {
      const qrCodes = [];

      for (const variation of variations) {
        const qrData = await this.generateExamVariationQR(
          examId, 
          variation.id, 
          options
        );
        
        qrCodes.push({
          variationId: variation.id,
          variationNumber: variation.variationNumber,
          variationLetter: variation.variationLetter,
          ...qrData
        });
      }

      return qrCodes;
    } catch (error) {
      console.error('Error generating batch QR codes:', error);
      throw new Error('Failed to generate batch QR codes');
    }
  }

  /**
   * Generate QR code for answer sheet submission
   */
  async generateAnswerSheetQR(examId, variationId, studentData = {}) {
    try {
      const qrData = {
        type: 'answer_sheet',
        examId,
        variationId,
        studentId: studentData.studentId || null,
        studentName: studentData.studentName || null,
        timestamp: new Date().toISOString(),
        id: uuidv4()
      };

      const qrUrl = `${this.baseUrl}/submit/${examId}/${variationId}`;
      const qrCodeDataURL = await this.generateQRCodeDataURL(qrUrl);

      return {
        data: qrData,
        url: qrUrl,
        qrCode: qrUrl,
        qrCodeDataURL,
        qrCodeId: qrData.id
      };
    } catch (error) {
      console.error('Error generating answer sheet QR:', error);
      throw new Error('Failed to generate answer sheet QR code');
    }
  }

  /**
   * Generate custom QR code with logo/branding
   */
  async generateBrandedQRCode(data, logoPath = null, options = {}) {
    try {
      // Basic QR code generation
      const qrOptions = {
        width: options.width || 300,
        margin: options.margin || 2,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // High error correction for logo overlay
      };

      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const qrCodeDataURL = await QRCode.toDataURL(dataString, qrOptions);

      // If logo is provided, we would need additional image processing
      // For now, return the basic QR code
      return {
        qrCodeDataURL,
        hasLogo: !!logoPath,
        logoPath
      };
    } catch (error) {
      console.error('Error generating branded QR code:', error);
      throw new Error('Failed to generate branded QR code');
    }
  }
}

module.exports = new QRService();