/**
 * Computer Vision Service for gabarito detection using OpenCV.js
 */
class VisionService {
  constructor() {
    this.cv = null;
    this.initialized = false;
  }

  /**
   * Initialize OpenCV.js
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load OpenCV.js
      if (typeof cv === 'undefined') {
        await this.loadOpenCV();
      }
      
      this.cv = cv;
      this.initialized = true;
      console.log('✅ OpenCV.js initialized');
    } catch (error) {
      console.error('❌ Failed to initialize OpenCV.js:', error);
      throw new Error('Falha ao inicializar sistema de visão computacional');
    }
  }

  /**
   * Load OpenCV.js dynamically
   */
  async loadOpenCV() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
      script.onload = () => {
        // OpenCV.js needs time to initialize
        const checkCV = () => {
          if (typeof cv !== 'undefined' && cv.Mat) {
            resolve();
          } else {
            setTimeout(checkCV, 100);
          }
        };
        checkCV();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Detect and correct perspective of gabarito
   */
  async correctGabaritoPerspective(imageElement) {
    await this.initialize();
    
    const mat = this.cv.imread(imageElement);
    const gray = new this.cv.Mat();
    const binary = new this.cv.Mat();
    const contours = new this.cv.MatVector();
    const hierarchy = new this.cv.Mat();

    try {
      // Convert to grayscale
      this.cv.cvtColor(mat, gray, this.cv.COLOR_RGBA2GRAY);
      
      // Apply Gaussian blur
      const ksize = new this.cv.Size(5, 5);
      this.cv.GaussianBlur(gray, gray, ksize, 0);
      
      // Apply adaptive threshold
      this.cv.adaptiveThreshold(
        gray, binary, 255,
        this.cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        this.cv.THRESH_BINARY_INV,
        11, 2
      );

      // Find contours
      this.cv.findContours(
        binary, contours, hierarchy,
        this.cv.RETR_EXTERNAL,
        this.cv.CHAIN_APPROX_SIMPLE
      );

      // Find the largest rectangular contour (should be the gabarito)
      let largestArea = 0;
      let bestContour = null;

      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = this.cv.contourArea(contour);
        
        if (area > largestArea && area > 10000) { // Minimum area threshold
          const approx = new this.cv.Mat();
          const peri = this.cv.arcLength(contour, true);
          this.cv.approxPolyDP(contour, approx, 0.02 * peri, true);
          
          if (approx.total() === 4) { // Rectangle should have 4 corners
            largestArea = area;
            bestContour = approx.clone();
          }
          approx.delete();
        }
        contour.delete();
      }

      if (!bestContour) {
        throw new Error('Gabarito não encontrado. Certifique-se de que todos os 4 cantos estão visíveis.');
      }

      // Extract corner points
      const corners = this.extractCornerPoints(bestContour);
      bestContour.delete();

      // Apply perspective correction
      const corrected = this.applyPerspectiveCorrection(mat, corners);
      
      return corrected;
      
    } finally {
      // Cleanup
      mat.delete();
      gray.delete();
      binary.delete();
      contours.delete();
      hierarchy.delete();
    }
  }

  /**
   * Extract corner points from contour
   */
  extractCornerPoints(contour) {
    const points = [];
    for (let i = 0; i < contour.rows; i++) {
      const point = contour.data32S.slice(i * 2, i * 2 + 2);
      points.push({ x: point[0], y: point[1] });
    }

    // Sort points to get consistent order: top-left, top-right, bottom-right, bottom-left
    const center = points.reduce((acc, p) => ({
      x: acc.x + p.x / points.length,
      y: acc.y + p.y / points.length
    }), { x: 0, y: 0 });

    const sortedPoints = points.sort((a, b) => {
      const angleA = Math.atan2(a.y - center.y, a.x - center.x);
      const angleB = Math.atan2(b.y - center.y, b.x - center.x);
      return angleA - angleB;
    });

    return sortedPoints;
  }

  /**
   * Apply perspective correction
   */
  applyPerspectiveCorrection(mat, corners) {
    const width = 800;  // Standard width for gabarito
    const height = 1000; // Standard height for gabarito

    // Source points (detected corners)
    const srcPoints = this.cv.matFromArray(4, 1, this.cv.CV_32FC2, [
      corners[0].x, corners[0].y,
      corners[1].x, corners[1].y,
      corners[2].x, corners[2].y,
      corners[3].x, corners[3].y
    ]);

    // Destination points (corrected rectangle)
    const dstPoints = this.cv.matFromArray(4, 1, this.cv.CV_32FC2, [
      0, 0,
      width, 0,
      width, height,
      0, height
    ]);

    // Get perspective transform matrix
    const M = this.cv.getPerspectiveTransform(srcPoints, dstPoints);
    
    // Apply transformation
    const corrected = new this.cv.Mat();
    const dsize = new this.cv.Size(width, height);
    this.cv.warpPerspective(mat, corrected, M, dsize);

    // Cleanup
    srcPoints.delete();
    dstPoints.delete();
    M.delete();

    return corrected;
  }

  /**
   * Detect filled bubbles in gabarito
   */
  async detectAnswers(correctedMat, totalQuestions = 20) {
    await this.initialize();

    const gray = new this.cv.Mat();
    const binary = new this.cv.Mat();
    const contours = new this.cv.MatVector();
    const hierarchy = new this.cv.Mat();

    try {
      // Convert to grayscale if needed
      if (correctedMat.channels() > 1) {
        this.cv.cvtColor(correctedMat, gray, this.cv.COLOR_RGBA2GRAY);
      } else {
        correctedMat.copyTo(gray);
      }

      // Apply threshold to find dark areas (filled bubbles)
      this.cv.threshold(gray, binary, 120, 255, this.cv.THRESH_BINARY_INV);

      // Find contours
      this.cv.findContours(
        binary, contours, hierarchy,
        this.cv.RETR_EXTERNAL,
        this.cv.CHAIN_APPROX_SIMPLE
      );

      // Detect circular contours (bubbles)
      const bubbles = [];
      const minArea = 50; // Minimum bubble area
      const maxArea = 2000; // Maximum bubble area

      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = this.cv.contourArea(contour);
        
        if (area >= minArea && area <= maxArea) {
          // Check if contour is roughly circular
          const perimeter = this.cv.arcLength(contour, true);
          const circularity = 4 * Math.PI * area / (perimeter * perimeter);
          
          if (circularity > 0.5) { // Reasonable circularity threshold
            const moments = this.cv.moments(contour);
            const centerX = moments.m10 / moments.m00;
            const centerY = moments.m01 / moments.m00;
            
            bubbles.push({
              x: centerX,
              y: centerY,
              area: area,
              filled: this.isBubbleFilled(gray, centerX, centerY)
            });
          }
        }
        contour.delete();
      }

      // Organize bubbles into questions and alternatives
      const answers = this.organizeBubblesIntoAnswers(bubbles, totalQuestions);
      
      return {
        answers,
        confidence: this.calculateConfidence(bubbles, answers),
        totalBubbles: bubbles.length
      };

    } finally {
      // Cleanup
      gray.delete();
      binary.delete();
      contours.delete();
      hierarchy.delete();
    }
  }

  /**
   * Check if bubble is filled
   */
  isBubbleFilled(grayMat, centerX, centerY) {
    const radius = 10;
    const rect = new this.cv.Rect(
      Math.max(0, centerX - radius),
      Math.max(0, centerY - radius),
      Math.min(grayMat.cols - centerX + radius, radius * 2),
      Math.min(grayMat.rows - centerY + radius, radius * 2)
    );

    const roi = grayMat.roi(rect);
    const mean = this.cv.mean(roi);
    roi.delete();

    // If mean brightness is low, bubble is likely filled
    return mean[0] < 100; // Threshold for filled bubble
  }

  /**
   * Organize detected bubbles into answers
   */
  organizeBubblesIntoAnswers(bubbles, totalQuestions) {
    // Sort bubbles by position (top to bottom, left to right)
    bubbles.sort((a, b) => {
      const rowDiff = Math.abs(a.y - b.y);
      if (rowDiff < 20) { // Same row threshold
        return a.x - b.x; // Sort by x if in same row
      }
      return a.y - b.y; // Sort by y
    });

    const answers = [];
    const questionsPerRow = 5; // Assuming 5 alternatives per question
    
    for (let q = 0; q < totalQuestions; q++) {
      const startIndex = q * questionsPerRow;
      const questionBubbles = bubbles.slice(startIndex, startIndex + questionsPerRow);
      
      // Find filled bubble in this question
      const filledBubble = questionBubbles.findIndex(bubble => bubble.filled);
      answers.push(filledBubble !== -1 ? filledBubble : null);
    }

    return answers;
  }

  /**
   * Calculate detection confidence
   */
  calculateConfidence(bubbles, answers) {
    const expectedBubbles = answers.length * 5; // 5 alternatives per question
    const detectedBubbles = bubbles.length;
    const filledAnswers = answers.filter(answer => answer !== null).length;
    
    const detectionRate = Math.min(detectedBubbles / expectedBubbles, 1);
    const answerRate = filledAnswers / answers.length;
    
    return Math.round((detectionRate * 0.6 + answerRate * 0.4) * 100);
  }

  /**
   * Convert OpenCV Mat to Canvas for display
   */
  matToCanvas(mat, canvasId) {
    this.cv.imshow(canvasId, mat);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // OpenCV.js handles most cleanup automatically
    console.log('🧹 Vision service cleanup completed');
  }
}

export default new VisionService();