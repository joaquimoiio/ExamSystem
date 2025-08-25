const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { AppError } = require('../utils/appError');
// Local helper function for date formatting
const formatDateBR = (date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date));
};
const qrService = require('./qrService');

/**
 * PDF Service for generating exam reports and documents
 */
class PDFService {
  constructor() {
    this.fonts = {
      regular: 'Helvetica',
      bold: 'Helvetica-Bold',
      italic: 'Helvetica-Oblique'
    };
  }

  /**
   * Generate exam report PDF
   */
  async generateExamReport(exam, submissions, statistics, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Header
        this.addHeader(doc, 'Exam Report');
        
        // Exam information
        this.addExamInfo(doc, exam);
        
        // Statistics
        this.addStatistics(doc, statistics);
        
        // Submissions summary
        this.addSubmissionsSummary(doc, submissions);
        
        // Footer
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate QR codes sheet PDF
   */
  async generateQRCodesSheet(exam, variations, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Header
        this.addHeader(doc, 'Exam QR Codes');
        
        // Exam info
        doc.fontSize(14).font(this.fonts.bold);
        doc.text(`Exam: ${exam.title}`, 50, 120);
        doc.text(`Access Code: ${exam.accessCode}`, 50, 140);
        doc.text(`Total Variations: ${variations.length}`, 50, 160);
        
        doc.moveDown(2);

        // QR codes grid
        this.addQRCodesGrid(doc, variations);
        
        // Footer
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate student results PDF
   */
  async generateStudentResults(submission, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Header
        this.addHeader(doc, 'Exam Results');
        
        // Student information
        this.addStudentInfo(doc, submission);
        
        // Results summary
        this.addResultsSummary(doc, submission);
        
        // Detailed answers (if allowed)
        if (submission.exam.showCorrectAnswers) {
          this.addDetailedAnswers(doc, submission);
        }
        
        // Footer
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate complete PDF with all exam variations
   */
  async generateAllVariationsPDF(exam, variations, examHeader, outputPath) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        for (let i = 0; i < variations.length; i++) {
          const variation = variations[i];
          
          // Get questions for this variation
          const questions = await variation.getQuestionsWithOrder();
          
          if (i > 0) {
            // Add new page for each variation (except the first)
            doc.addPage();
          }
          
          // Add exam header with variation info
          await this.addExamHeaderWithVariation(doc, examHeader, exam, variation);
          
          // Add QR code and answer key section
          await this.addQRCodeAndAnswerKey(doc, exam, variation, questions);
          
          // Add questions
          await this.addExamQuestions(doc, questions);
          
          // Add space before next variation
          if (i < variations.length - 1) {
            doc.y = 800; // Force new page
          }
        }
        
        // Add footer to all pages
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate complete exam PDF with questions, QR code and answer key
   */
  async generateExamPDF(exam, variation, questions, examHeader, outputPath) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Add exam header
        await this.addExamHeader(doc, examHeader, exam);
        
        // Add QR code and answer key section
        await this.addQRCodeAndAnswerKey(doc, exam, variation, questions);
        
        // Add questions
        await this.addExamQuestions(doc, questions);
        
        // Add footer
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate exam answer sheet PDF
   */
  async generateAnswerSheet(exam, variation, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Header
        this.addHeader(doc, 'Answer Sheet');
        
        // Exam information
        doc.fontSize(12).font(this.fonts.bold);
        doc.text(`Exam: ${exam.title}`, 50, 120);
        doc.text(`Variation: ${variation.variationNumber}`, 50, 140);
        doc.text(`Date: ${formatDateBR(new Date())}`, 50, 160);
        
        doc.moveDown(2);

        // Student information fields
        this.addStudentInfoFields(doc);
        
        // Answer grid
        this.addAnswerGrid(doc, exam.totalQuestions);
        
        // Footer
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add header to PDF
   */
  addHeader(doc, title) {
    doc.fontSize(20).font(this.fonts.bold);
    doc.text('Exam System', 50, 50);
    
    doc.fontSize(16).font(this.fonts.regular);
    doc.text(title, 50, 80);
    
    // Line under header
    doc.moveTo(50, 105)
       .lineTo(550, 105)
       .stroke();
  }

  /**
   * Add exam information section
   */
  addExamInfo(doc, exam) {
    let y = 130;
    
    doc.fontSize(14).font(this.fonts.bold);
    doc.text('Exam Information', 50, y);
    
    y += 25;
    doc.fontSize(10).font(this.fonts.regular);
    
    const info = [
      [`Title: ${exam.title}`],
      [`Subject: ${exam.subject?.name || 'N/A'}`],
      [`Total Questions: ${exam.totalQuestions}`],
      [`Time Limit: ${exam.timeLimit ? `${exam.timeLimit} minutes` : 'No limit'}`],
      [`Passing Score: ${exam.passingScore}`],
      [`Published: ${exam.publishedAt ? formatDateBR(exam.publishedAt) : 'Not published'}`],
      [`Access Code: ${exam.accessCode || 'N/A'}`]
    ];

    info.forEach(([text]) => {
      doc.text(text, 50, y);
      y += 15;
    });

    return y + 10;
  }

  /**
   * Add statistics section
   */
  addStatistics(doc, stats) {
    let y = doc.y + 20;
    
    doc.fontSize(14).font(this.fonts.bold);
    doc.text('Statistics', 50, y);
    
    y += 25;
    doc.fontSize(10).font(this.fonts.regular);
    
    const statistics = [
      [`Total Submissions: ${stats.totalSubmissions}`],
      [`Average Score: ${stats.averageScore}`],
      [`Minimum Score: ${stats.minScore}`],
      [`Maximum Score: ${stats.maxScore}`],
      [`Students Passed: ${stats.passedCount} (${stats.passRate}%)`],
      [`Students Failed: ${stats.failedCount}`]
    ];

    statistics.forEach(([text]) => {
      doc.text(text, 50, y);
      y += 15;
    });

    return y + 10;
  }

  /**
   * Add submissions summary
   */
  addSubmissionsSummary(doc, submissions) {
    let y = doc.y + 20;
    
    doc.fontSize(14).font(this.fonts.bold);
    doc.text('Recent Submissions', 50, y);
    
    y += 25;
    doc.fontSize(8).font(this.fonts.regular);
    
    // Table headers
    doc.font(this.fonts.bold);
    doc.text('Student Name', 50, y);
    doc.text('Score', 200, y);
    doc.text('Grade', 250, y);
    doc.text('Status', 300, y);
    doc.text('Submitted', 400, y);
    
    y += 15;
    
    // Line under headers
    doc.moveTo(50, y)
       .lineTo(550, y)
       .stroke();
    
    y += 10;
    
    // Submissions data
    doc.font(this.fonts.regular);
    submissions.slice(0, 20).forEach(submission => { // Limit to 20 entries
      doc.text(submission.studentName || 'Anonymous', 50, y);
      doc.text(submission.score?.toFixed(2) || '0.00', 200, y);
      doc.text(submission.calculateGrade?.() || 'N/A', 250, y);
      doc.text(submission.isPassed ? 'Passed' : 'Failed', 300, y);
      doc.text(formatDateBR(submission.submittedAt), 400, y);
      
      y += 12;
      
      // Check if we need a new page
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    return y + 10;
  }

  /**
   * Add QR codes grid
   */
  addQRCodesGrid(doc, variations) {
    let x = 50;
    let y = 200;
    const qrSize = 100;
    const spacing = 20;
    const cols = 2;
    
    variations.forEach((variation, index) => {
      if (index > 0 && index % cols === 0) {
        y += qrSize + spacing + 40;
        x = 50;
      }

      // Variation label
      doc.fontSize(10).font(this.fonts.bold);
      doc.text(`Variation ${variation.variationNumber}`, x, y);
      
      // QR code placeholder (would need actual QR code image)
      doc.rect(x, y + 15, qrSize, qrSize).stroke();
      doc.fontSize(8).font(this.fonts.regular);
      doc.text('QR Code', x + qrSize/2 - 15, y + qrSize/2 + 10);
      
      x += qrSize + spacing + 100;
      
      // Check if we need a new page
      if (y > 650) {
        doc.addPage();
        y = 50;
        x = 50;
      }
    });
  }

  /**
   * Add student information section
   */
  addStudentInfo(doc, submission) {
    let y = 130;
    
    doc.fontSize(14).font(this.fonts.bold);
    doc.text('Student Information', 50, y);
    
    y += 25;
    doc.fontSize(10).font(this.fonts.regular);
    
    const info = [
      [`Name: ${submission.studentName}`],
      [`ID: ${submission.studentId || 'Not provided'}`],
      [`Email: ${submission.studentEmail || 'Not provided'}`],
      [`Exam: ${submission.exam.title}`],
      [`Subject: ${submission.exam.subject?.name || 'N/A'}`],
      [`Submitted: ${formatDateBR(submission.submittedAt)}`],
      [`Time Spent: ${submission.getTimeSpentFormatted?.() || 'N/A'}`]
    ];

    info.forEach(([text]) => {
      doc.text(text, 50, y);
      y += 15;
    });

    return y + 10;
  }

  /**
   * Add results summary section
   */
  addResultsSummary(doc, submission) {
    let y = doc.y + 20;
    
    doc.fontSize(14).font(this.fonts.bold);
    doc.text('Results Summary', 50, y);
    
    y += 25;
    
    // Score box
    doc.rect(50, y, 100, 60).stroke();
    doc.fontSize(24).font(this.fonts.bold);
    doc.text(submission.score?.toFixed(1) || '0.0', 75, y + 15);
    doc.fontSize(12).font(this.fonts.regular);
    doc.text('Score', 75, y + 45);
    
    // Grade box
    doc.rect(170, y, 80, 60).stroke();
    doc.fontSize(20).font(this.fonts.bold);
    doc.text(submission.calculateGrade?.() || 'N/A', 195, y + 20);
    doc.fontSize(12).font(this.fonts.regular);
    doc.text('Grade', 195, y + 45);
    
    // Status
    y += 80;
    doc.fontSize(12).font(this.fonts.bold);
    const status = submission.isPassed ? 'PASSED' : 'FAILED';
    const color = submission.isPassed ? 'green' : 'red';
    doc.fillColor(color).text(`Status: ${status}`, 50, y);
    doc.fillColor('black');
    
    y += 25;
    doc.fontSize(10).font(this.fonts.regular);
    doc.text(`Correct Answers: ${submission.correctAnswers} of ${submission.totalQuestions}`, 50, y);
    doc.text(`Accuracy: ${((submission.correctAnswers / submission.totalQuestions) * 100).toFixed(1)}%`, 50, y + 15);

    return y + 30;
  }

  /**
   * Add detailed answers section
   */
  addDetailedAnswers(doc, submission) {
    let y = doc.y + 20;
    
    doc.fontSize(14).font(this.fonts.bold);
    doc.text('Detailed Results', 50, y);
    
    y += 25;
    doc.fontSize(8).font(this.fonts.regular);
    
    if (submission.answers && Array.isArray(submission.answers)) {
      submission.answers.forEach((answer, index) => {
        if (y > 720) {
          doc.addPage();
          y = 50;
        }

        doc.font(this.fonts.bold);
        doc.text(`Question ${index + 1}:`, 50, y);
        
        const status = answer.correct ? '✓ Correct' : '✗ Incorrect';
        const statusColor = answer.correct ? 'green' : 'red';
        doc.fillColor(statusColor).text(status, 450, y);
        doc.fillColor('black');
        
        y += 12;
        doc.font(this.fonts.regular);
        doc.text(`Your answer: ${answer.answer}`, 60, y);
        doc.text(`Correct answer: ${answer.correctAnswer}`, 60, y + 10);
        doc.text(`Points: ${answer.points}/${answer.maxPoints}`, 60, y + 20);
        
        y += 35;
      });
    }

    return y;
  }

  /**
   * Add student information fields for answer sheet
   */
  addStudentInfoFields(doc) {
    let y = 180;
    
    doc.fontSize(12).font(this.fonts.bold);
    doc.text('Student Information:', 50, y);
    
    y += 25;
    doc.fontSize(10).font(this.fonts.regular);
    
    // Name field
    doc.text('Name: ', 50, y);
    doc.moveTo(80, y + 12).lineTo(300, y + 12).stroke();
    
    // ID field
    y += 25;
    doc.text('Student ID: ', 50, y);
    doc.moveTo(100, y + 12).lineTo(300, y + 12).stroke();
    
    // Email field
    y += 25;
    doc.text('Email: ', 50, y);
    doc.moveTo(80, y + 12).lineTo(300, y + 12).stroke();
    
    // Date field
    y += 25;
    doc.text('Date: ', 50, y);
    doc.moveTo(80, y + 12).lineTo(200, y + 12).stroke();

    return y + 40;
  }

  /**
   * Add answer grid for answer sheet
   */
  addAnswerGrid(doc, totalQuestions) {
    let y = 320;
    
    doc.fontSize(12).font(this.fonts.bold);
    doc.text('Answer Grid:', 50, y);
    doc.fontSize(8).font(this.fonts.regular);
    doc.text('Fill in the circle completely for your answer choice', 50, y + 15);
    
    y += 40;
    
    const questionsPerRow = 5;
    const questionWidth = 100;
    const rowHeight = 60;
    
    for (let i = 0; i < totalQuestions; i++) {
      const row = Math.floor(i / questionsPerRow);
      const col = i % questionsPerRow;
      
      const x = 50 + (col * questionWidth);
      const questionY = y + (row * rowHeight);
      
      // Check if we need a new page
      if (questionY > 700) {
        doc.addPage();
        y = 50;
        continue;
      }
      
      // Question number
      doc.fontSize(10).font(this.fonts.bold);
      doc.text(`${i + 1}`, x + 20, questionY);
      
      // Answer options (A, B, C, D, E)
      const options = ['A', 'B', 'C', 'D', 'E'];
      options.forEach((option, optIndex) => {
        const optY = questionY + 15 + (optIndex * 8);
        
        // Circle for answer
        doc.circle(x + 5, optY + 3, 3).stroke();
        
        // Option letter
        doc.fontSize(8).font(this.fonts.regular);
        doc.text(option, x + 15, optY);
      });
    }

    return y + Math.ceil(totalQuestions / questionsPerRow) * rowHeight + 20;
  }

  /**
   * Add footer to PDF
   */
  addFooter(doc) {
    const pages = doc.bufferedPageRange();
    
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Footer line
      doc.moveTo(50, 770)
         .lineTo(550, 770)
         .stroke();
      
      // Footer text
      doc.fontSize(8).font(this.fonts.regular);
      doc.text('Generated by Exam System', 50, 780);
      doc.text(`Generated on ${formatDateBR(new Date())}`, 50, 790);
      doc.text(`Page ${i + 1} of ${pages.count}`, 500, 780);
    }
  }

  /**
   * Generate submissions export CSV
   */
  async generateSubmissionsCSV(submissions, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const headers = [
          'Student Name',
          'Student ID',
          'Student Email',
          'Score',
          'Grade',
          'Correct Answers',
          'Total Questions',
          'Status',
          'Time Spent',
          'Submitted At'
        ];

        let csvContent = headers.join(',') + '\n';

        submissions.forEach(submission => {
          const row = [
            `"${submission.studentName || ''}"`,
            `"${submission.studentId || ''}"`,
            `"${submission.studentEmail || ''}"`,
            submission.score?.toFixed(2) || '0.00',
            `"${submission.calculateGrade?.() || 'N/A'}"`,
            submission.correctAnswers || 0,
            submission.totalQuestions || 0,
            submission.isPassed ? 'Passed' : 'Failed',
            `"${submission.getTimeSpentFormatted?.() || 'N/A'}"`,
            `"${formatDateBR(submission.submittedAt)}"`
          ];
          
          csvContent += row.join(',') + '\n';
        });

        fs.writeFileSync(outputPath, csvContent, 'utf8');
        resolve(outputPath);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate question analysis report PDF
   */
  async generateQuestionAnalysis(exam, questionStats, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Header
        this.addHeader(doc, 'Question Analysis Report');
        
        // Exam info
        let y = 130;
        doc.fontSize(12).font(this.fonts.bold);
        doc.text(`Exam: ${exam.title}`, 50, y);
        doc.text(`Analysis Date: ${formatDateBR(new Date())}`, 50, y + 15);
        
        y += 50;
        
        // Question statistics
        Object.keys(questionStats).forEach((questionId, index) => {
          const stats = questionStats[questionId];
          
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
          
          doc.fontSize(10).font(this.fonts.bold);
          doc.text(`Question ${stats.questionNumber}`, 50, y);
          
          y += 15;
          doc.fontSize(8).font(this.fonts.regular);
          doc.text(`Difficulty: ${stats.difficulty}`, 50, y);
          doc.text(`Success Rate: ${stats.successRate}%`, 200, y);
          doc.text(`Total Attempts: ${stats.totalAttempts}`, 350, y);
          
          y += 12;
          doc.text(`Correct Attempts: ${stats.correctAttempts}`, 50, y);
          
          // Answer distribution
          if (stats.alternativeDistribution) {
            y += 15;
            doc.text('Answer Distribution:', 50, y);
            y += 10;
            
            Object.keys(stats.alternativeDistribution).forEach(answer => {
              const count = stats.alternativeDistribution[answer];
              const percentage = ((count / stats.totalAttempts) * 100).toFixed(1);
              doc.text(`  Option ${answer}: ${count} (${percentage}%)`, 60, y);
              y += 10;
            });
          }
          
          y += 15;
          
          // Separator line
          doc.moveTo(50, y)
             .lineTo(550, y)
             .stroke();
          
          y += 10;
        });
        
        // Footer
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDir(outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Generate temporary file path
   */
  generateTempPath(prefix, extension = 'pdf') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `${prefix}_${timestamp}_${random}.${extension}`;
    return path.join(__dirname, '../uploads/temp', filename);
  }

  /**
   * Add exam header section with variation info
   */
  async addExamHeaderWithVariation(doc, examHeader, exam, variation) {
    let y = 50;
    
    // School info
    doc.fontSize(16).font(this.fonts.bold);
    doc.text(examHeader.schoolName || 'Escola', 50, y, { align: 'center' });
    
    y += 25;
    doc.fontSize(12).font(this.fonts.regular);
    doc.text(`Disciplina: ${examHeader.subjectName || exam.subject?.name || 'N/A'}`, 50, y);
    doc.text(`Ano: ${examHeader.year || new Date().getFullYear()}`, 350, y);
    
    y += 20;
    doc.text(`Prova: ${exam.title}`, 50, y);
    doc.text(`Variação: ${variation.variationNumber}`, 350, y);
    
    y += 20;
    doc.text(`Data: ___/___/______`, 50, y);
    // Removed time limit since it's a physical PDF exam
    
    // Student info section
    y += 30;
    doc.fontSize(10).font(this.fonts.regular);
    doc.text('Nome: _________________________________________________ Turma: _______', 50, y);
    
    y += 20;
    doc.text('Matrícula: ________________________ Data de Nascimento: ___/___/______', 50, y);
    
    // Evaluation criteria
    if (examHeader.evaluationCriteria) {
      y += 25;
      doc.fontSize(9).font(this.fonts.bold);
      doc.text('Critérios de Avaliação:', 50, y);
      y += 12;
      doc.fontSize(8).font(this.fonts.regular);
      const lines = examHeader.evaluationCriteria.split('\n');
      lines.forEach(line => {
        doc.text(line, 50, y);
        y += 10;
      });
    }
    
    // Instructions
    if (examHeader.instructions) {
      y += 15;
      doc.fontSize(9).font(this.fonts.bold);
      doc.text('Instruções:', 50, y);
      y += 12;
      doc.fontSize(8).font(this.fonts.regular);
      const lines = examHeader.instructions.split('\n');
      lines.forEach(line => {
        doc.text(line, 50, y);
        y += 10;
      });
    }
    
    // Separator line
    y += 15;
    doc.moveTo(50, y)
       .lineTo(550, y)
       .stroke();
    
    return y + 10;
  }

  /**
   * Add exam header section
   */
  async addExamHeader(doc, examHeader, exam) {
    let y = 50;
    
    // School info
    doc.fontSize(16).font(this.fonts.bold);
    doc.text(examHeader.schoolName || 'Escola', 50, y, { align: 'center' });
    
    y += 25;
    doc.fontSize(12).font(this.fonts.regular);
    doc.text(`Disciplina: ${examHeader.subjectName || exam.subject?.name || 'N/A'}`, 50, y);
    doc.text(`Ano: ${examHeader.year || new Date().getFullYear()}`, 350, y);
    
    y += 20;
    doc.text(`Prova: ${exam.title}`, 50, y);
    doc.text(`Variação: ${exam.variationNumber || 'A'}`, 350, y);
    
    y += 20;
    doc.text(`Data: ___/___/______`, 50, y);
    // Removed time limit since it's a physical PDF exam
    
    // Student info section
    y += 30;
    doc.fontSize(10).font(this.fonts.regular);
    doc.text('Nome: _________________________________________________ Turma: _______', 50, y);
    
    y += 20;
    doc.text('Matrícula: ________________________ Data de Nascimento: ___/___/______', 50, y);
    
    // Evaluation criteria
    if (examHeader.evaluationCriteria) {
      y += 25;
      doc.fontSize(9).font(this.fonts.bold);
      doc.text('Critérios de Avaliação:', 50, y);
      y += 12;
      doc.fontSize(8).font(this.fonts.regular);
      const lines = examHeader.evaluationCriteria.split('\n');
      lines.forEach(line => {
        doc.text(line, 50, y);
        y += 10;
      });
    }
    
    // Instructions
    if (examHeader.instructions) {
      y += 15;
      doc.fontSize(9).font(this.fonts.bold);
      doc.text('Instruções:', 50, y);
      y += 12;
      doc.fontSize(8).font(this.fonts.regular);
      const lines = examHeader.instructions.split('\n');
      lines.forEach(line => {
        doc.text(line, 50, y);
        y += 10;
      });
    }
    
    // Separator line
    y += 15;
    doc.moveTo(50, y)
       .lineTo(550, y)
       .stroke();
    
    return y + 10;
  }

  /**
   * Add QR code and visual answer key section
   */
  async addQRCodeAndAnswerKey(doc, exam, variation, questions) {
    let y = doc.y || 200;
    
    // Generate QR code with answer key
    const qrResult = await qrService.generateAnswerKeyQR(exam, variation, questions);
    const qrBuffer = await qrService.generateQRBuffer(JSON.stringify(qrResult.qrData), { width: 120 });
    
    // Generate visual answer key
    const visualAnswerKey = qrService.generateVisualAnswerKey(questions);
    
    // QR Code section title
    doc.fontSize(10).font(this.fonts.bold);
    doc.text('Gabarito para Correção:', 50, y);
    
    y += 20;
    
    // Add QR code image
    doc.image(qrBuffer, 50, y, { width: 120, height: 120 });
    
    // Visual answer key next to QR code
    let answerX = 190;
    let answerY = y;
    
    doc.fontSize(9).font(this.fonts.bold);
    doc.text('Gabarito Visual:', answerX, answerY);
    
    answerY += 15;
    doc.fontSize(8).font(this.fonts.regular);
    
    // Display answers in a grid format
    const itemsPerRow = 10;
    visualAnswerKey.forEach((item, index) => {
      if (index > 0 && index % itemsPerRow === 0) {
        answerY += 12;
        answerX = 190;
      }
      
      const text = `${item.number}:${item.answer}`;
      doc.text(text, answerX, answerY);
      answerX += 35;
    });
    
    // Separator line
    y += 140;
    doc.moveTo(50, y)
       .lineTo(550, y)
       .stroke();
    
    return y + 10;
  }

  /**
   * Add exam questions section
   */
  async addExamQuestions(doc, questions) {
    let y = doc.y || 300;
    
    doc.fontSize(12).font(this.fonts.bold);
    doc.text('QUESTÕES:', 50, y);
    
    y += 25;
    
    questions.forEach((question, index) => {
      // Estimate space needed for this question
      const questionLines = (question.text || question.title || '').split('\n');
      const alternativesCount = question.alternatives ? question.alternatives.filter(alt => alt && alt.trim()).length : 0;
      const estimatedLines = questionLines.length + alternativesCount + 6; // Header + spaces
      const estimatedHeight = estimatedLines * 12;
      
      // Check if we need a new page
      if (y + estimatedHeight > 750) {
        doc.addPage();
        y = 50;
        
        // Add header again on new page
        doc.fontSize(12).font(this.fonts.bold);
        doc.text('QUESTÕES (continuação):', 50, y);
        y += 25;
      }
      
      // Question number and title
      doc.fontSize(10).font(this.fonts.bold);
      const questionHeader = `${index + 1}. ${question.title || `Questão ${index + 1}`}`;
      doc.text(questionHeader, 50, y);
      
      // Points
      if (question.points) {
        doc.text(`(${question.points} pts)`, 450, y);
      }
      
      y += 15;
      
      // Question text
      doc.fontSize(9).font(this.fonts.regular);
      const text = question.text || question.title || 'Texto da questão não disponível';
      const textLines = text.split('\n');
      textLines.forEach(line => {
        // Check for line wrap
        if (line.length > 80) {
          const words = line.split(' ');
          let currentLine = '';
          
          words.forEach(word => {
            if (currentLine.length + word.length > 75) {
              doc.text(currentLine, 50, y);
              y += 12;
              currentLine = word + ' ';
            } else {
              currentLine += word + ' ';
            }
          });
          
          if (currentLine.trim()) {
            doc.text(currentLine, 50, y);
            y += 12;
          }
        } else {
          doc.text(line, 50, y);
          y += 12;
        }
      });
      
      y += 5;
      
      // Question type specific content
      if (question.type === 'multiple_choice' && question.alternatives) {
        const letters = ['A', 'B', 'C', 'D', 'E'];
        question.alternatives.forEach((alternative, altIndex) => {
          if (alternative && alternative.trim()) {
            // Check if we need a new page for alternatives
            if (y > 720) {
              doc.addPage();
              y = 50;
            }
            
            const altText = `${letters[altIndex]}) ${alternative}`;
            
            // Handle long alternatives
            if (altText.length > 75) {
              const words = altText.split(' ');
              let currentLine = words[0] + ' '; // Start with A), B), etc.
              
              for (let i = 1; i < words.length; i++) {
                if (currentLine.length + words[i].length > 70) {
                  doc.text(currentLine, 60, y);
                  y += 12;
                  currentLine = '   ' + words[i] + ' '; // Indent continuation
                } else {
                  currentLine += words[i] + ' ';
                }
              }
              
              if (currentLine.trim()) {
                doc.text(currentLine, 60, y);
                y += 12;
              }
            } else {
              doc.text(altText, 60, y);
              y += 12;
            }
          }
        });
      } else if (question.type === 'true_false') {
        doc.text('A) Verdadeiro', 60, y);
        y += 12;
        doc.text('B) Falso', 60, y);
        y += 12;
      } else if (question.type === 'essay') {
        // Essay question - add lines for answer
        doc.text('Resposta:', 50, y);
        y += 15;
        
        // Add answer lines
        for (let i = 0; i < 8; i++) {
          if (y > 750) {
            doc.addPage();
            y = 50;
          }
          doc.moveTo(50, y)
             .lineTo(550, y)
             .stroke();
          y += 20;
        }
      }
      
      y += 15; // Space between questions
    });
    
    return y;
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(filePaths) {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error('Error cleaning up temp file:', filePath, error);
      }
    }
  }

  /**
   * Batch generate PDFs
   */
  async batchGenerate(operations) {
    const results = [];
    
    for (const operation of operations) {
      try {
        let result;
        
        switch (operation.type) {
          case 'exam_report':
            result = await this.generateExamReport(
              operation.exam,
              operation.submissions,
              operation.statistics,
              operation.outputPath
            );
            break;
            
          case 'student_results':
            result = await this.generateStudentResults(
              operation.submission,
              operation.outputPath
            );
            break;
            
          case 'qr_codes':
            result = await this.generateQRCodesSheet(
              operation.exam,
              operation.variations,
              operation.outputPath
            );
            break;
            
          case 'answer_sheet':
            result = await this.generateAnswerSheet(
              operation.exam,
              operation.variation,
              operation.outputPath
            );
            break;
            
          case 'exam_pdf':
            result = await this.generateExamPDF(
              operation.exam,
              operation.variation,
              operation.questions,
              operation.examHeader,
              operation.outputPath
            );
            break;
            
          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }
        
        results.push({
          id: operation.id,
          status: 'success',
          path: result
        });
      } catch (error) {
        results.push({
          id: operation.id,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return results;
  }
}

module.exports = new PDFService();