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
          margin: 30
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
          margin: 30
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
          margin: 30
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
  async generateAllVariationsPDF(exam, variations, examHeader, outputPath, layout = 'single') {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('🔄 PDFService: Iniciando geração de PDF');
        console.log(`📊 Exame: ${exam?.title}`);
        console.log(`📋 Variações: ${variations?.length}`);
        console.log(`📄 Arquivo: ${outputPath}`);

        const doc = new PDFDocument({
          size: 'A4',
          margin: 30
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);
        
        let processedVariations = 0;

        for (let i = 0; i < variations.length; i++) {
          const variation = variations[i];
          
          // Use questions already loaded with include
          const questions = variation.examQuestions?.map(eq => {
            if (!eq.question) {
              console.error(`❌ Questão sem dados: examQuestionId=${eq.id}, questionId=${eq.questionId}`);
              return null;
            }
            
            // Get question data from the nested question object
            const question = eq.question.dataValues || eq.question;
            
            return {
              ...question,
              examQuestionOrder: eq.questionOrder,
              examPoints: eq.points,
              shuffledAlternatives: eq.shuffledAlternatives,
              // Keep the full examQuestion object for reference
              examQuestion: eq
            };
          }).filter(q => q !== null) || [];
          
          console.log(`🔄 Processando variação ${variation.variationNumber} com ${questions.length} questões`);
          
          // Debug: Log first question structure
          if (questions.length > 0) {
            const firstQ = questions[0];
            console.log(`🔍 Primeira questão da variação ${variation.variationNumber}:`, {
              id: firstQ.id,
              title: firstQ.title,
              text: firstQ.text,
              hasText: !!firstQ.text,
              textLength: firstQ.text ? firstQ.text.length : 0,
              alternatives: firstQ.alternatives ? firstQ.alternatives.length : 0,
              originalExamQuestion: !!firstQ.examQuestion
            });
          }
          
          if (questions.length === 0) {
            console.log(`⚠️  Pulando variação ${variation.variationNumber} - sem questões`);
            continue;
          }
          
          if (processedVariations > 0) {
            // Add new page for each variation (except the first)
            doc.addPage();
          }
          
          try {
            // Add exam header with variation info
            await this.addExamHeaderWithVariation(doc, examHeader, exam, variation);
            
            // Add QR code and answer key section
            await this.addQRCodeAndAnswerKey(doc, exam, variation, questions);
            
            // Add questions
            await this.addExamQuestions(doc, questions, layout);
            
            processedVariations++;
            console.log(`✅ Variação ${variation.variationNumber} processada`);
            
          } catch (variationError) {
            console.error(`❌ Erro ao processar variação ${variation.variationNumber}:`, variationError);
            // Continue com as outras variações
          }
          
          // Add space before next variation
          if (i < variations.length - 1) {
            doc.y = 800; // Force new page
          }
        }
        
        console.log(`📊 Total de variações processadas: ${processedVariations}`);
        
        if (processedVariations === 0) {
          throw new Error('Nenhuma variação com questões foi encontrada para gerar o PDF');
        }
        
        // Add footer to all pages
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          console.log('✅ PDFService: PDF finalizado com sucesso');
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          console.error('❌ PDFService: Erro no stream:', error);
          reject(error);
        });
      } catch (error) {
        console.error('❌ PDFService: Erro geral:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate complete exam PDF with questions, QR code and answer key
   */
  async generateExamPDF(exam, variation, questions, examHeader, outputPath, layout = 'single') {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 30
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Add exam header
        await this.addExamHeader(doc, examHeader, exam);
        
        // Add QR code and answer key section
        await this.addQRCodeAndAnswerKey(doc, exam, variation, questions);
        
        // Add questions
        await this.addExamQuestions(doc, questions, layout);
        
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
          margin: 30
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
    
    // Ensure we have valid page range
    if (!pages || pages.count === 0) {
      console.log('⚠️ No pages in PDF buffer to add footer');
      return;
    }
    
    console.log(`📄 Adding footer to ${pages.count} pages (range: ${pages.start} to ${pages.start + pages.count - 1})`);
    
    for (let i = 0; i < pages.count; i++) {
      const pageIndex = pages.start + i;
      
      try {
        doc.switchToPage(pageIndex);
        
        // Footer line
        doc.moveTo(50, 770)
           .lineTo(550, 770)
           .stroke();
        
        // Footer text
        doc.fontSize(8).font(this.fonts.regular);
        doc.text('Generated by Exam System', 50, 780);
        doc.text(`Generated on ${formatDateBR(new Date())}`, 50, 790);
        doc.text(`Page ${i + 1} of ${pages.count}`, 500, 780);
      } catch (error) {
        console.error(`❌ Error adding footer to page ${pageIndex}:`, error.message);
        // Continue with other pages
      }
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
          margin: 30
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
    let y = 40; // Reduzido de 50 para 40
    
    // Ensure examHeader is not null/undefined
    const header = examHeader || {};
    
    // School info
    doc.fontSize(12).font(this.fonts.bold); // Reduzido de 16 para 12
    doc.text(header.schoolName || 'Escola', 50, y, { align: 'center' });
    
    y += 16; // Reduzido de 25 para 16
    doc.fontSize(10).font(this.fonts.regular); // Reduzido de 12 para 10
    // Garantir que a disciplina seja exibida corretamente
    const subjectName = exam.subject?.name || header.subjectName || 'Disciplina não informada';
    doc.text(`Disciplina: ${subjectName}`, 50, y);
    doc.text(`Ano: ${header.year || new Date().getFullYear()}`, 350, y);
    
    y += 14; // Reduzido de 20 para 14
    doc.text(`Prova: ${exam.title}`, 50, y);
    doc.text(`Variação: ${variation.variationNumber}`, 350, y);
    
    y += 14; // Reduzido de 20 para 14
    doc.text(`Data: ___/___/______`, 50, y);
    // Removed time limit since it's a physical PDF exam
    
    // Student info section
    y += 18; // Reduzido de 30 para 18
    doc.fontSize(9).font(this.fonts.regular); // Reduzido de 10 para 9
    doc.text('Nome: _________________________________________________ Turma: _______', 50, y);
    
    
    // Evaluation criteria
    if (header.evaluationCriteria) {
      y += 16; // Reduzido de 25 para 16
      doc.fontSize(8).font(this.fonts.bold); // Reduzido de 9 para 8
      doc.text('Critérios de Avaliação:', 50, y);
      y += 10; // Reduzido de 12 para 10
      doc.fontSize(7).font(this.fonts.regular); // Reduzido de 8 para 7
      const lines = header.evaluationCriteria.split('\n');
      lines.forEach(line => {
        doc.text(line, 50, y);
        y += 8; // Reduzido de 10 para 8
      });
    }
    
    // Instructions
    if (header.instructions) {
      y += 14; // Reduzido de 20 para 14
      doc.fontSize(8).font(this.fonts.bold); // Reduzido de 9 para 8
      doc.text('Instruções:', 50, y);
      
      // Removed separator line after instructions title
      y += 10; // Reduzido de 12 para 10
      
      doc.fontSize(7).font(this.fonts.regular); // Reduzido de 8 para 7
      const lines = header.instructions.split('\n');
      
      lines.forEach(line => {
        doc.text(line, 50, y);
        y += 10; // Reduzido de 12 para 10
      });
      
      // Removed bottom separator line after instructions text
      y += 10; // Reduzido de 15 para 10
    }
    
    // Separator line
    y += 10; // Reduzido de 15 para 10
    doc.moveTo(50, y)
       .lineTo(550, y)
       .stroke();
    
    return y + 8; // Reduzido de 10 para 8
  }

  /**
   * Add exam header section
   */
  async addExamHeader(doc, examHeader, exam) {
    let y = 40; // Reduzido de 50 para 40
    
    // Ensure examHeader is not null/undefined
    const header = examHeader || {};
    
    // School info
    doc.fontSize(12).font(this.fonts.bold); // Reduzido de 16 para 12
    doc.text(header.schoolName || 'Escola', 50, y, { align: 'center' });
    
    y += 16; // Reduzido de 25 para 16
    doc.fontSize(10).font(this.fonts.regular); // Reduzido de 12 para 10
    // Garantir que a disciplina seja exibida corretamente
    const subjectName = exam.subject?.name || header.subjectName || 'Disciplina não informada';
    doc.text(`Disciplina: ${subjectName}`, 50, y);
    doc.text(`Ano: ${header.year || new Date().getFullYear()}`, 350, y);
    
    y += 14; // Reduzido de 20 para 14
    doc.text(`Prova: ${exam.title}`, 50, y);
    doc.text(`Variação: ${exam.variationNumber || 'A'}`, 350, y);
    
    y += 14; // Reduzido de 20 para 14
    doc.text(`Data: ___/___/______`, 50, y);
    // Removed time limit since it's a physical PDF exam
    
    // Student info section
    y += 18; // Reduzido de 30 para 18
    doc.fontSize(9).font(this.fonts.regular); // Reduzido de 10 para 9
    doc.text('Nome: _________________________________________________ Turma: _______', 50, y);
    
    
    // Evaluation criteria
    if (header.evaluationCriteria) {
      y += 16; // Reduzido de 25 para 16
      doc.fontSize(8).font(this.fonts.bold); // Reduzido de 9 para 8
      doc.text('Critérios de Avaliação:', 50, y);
      y += 10; // Reduzido de 12 para 10
      doc.fontSize(7).font(this.fonts.regular); // Reduzido de 8 para 7
      const lines = header.evaluationCriteria.split('\n');
      lines.forEach(line => {
        doc.text(line, 50, y);
        y += 8; // Reduzido de 10 para 8
      });
    }
    
    // Instructions
    if (header.instructions) {
      y += 14; // Reduzido de 20 para 14
      doc.fontSize(8).font(this.fonts.bold); // Reduzido de 9 para 8
      doc.text('Instruções:', 50, y);
      
      // Removed separator line after instructions title
      y += 10; // Reduzido de 12 para 10
      
      doc.fontSize(7).font(this.fonts.regular); // Reduzido de 8 para 7
      const lines = header.instructions.split('\n');
      
      lines.forEach(line => {
        doc.text(line, 50, y);
        y += 10; // Reduzido de 12 para 10
      });
      
      // Removed bottom separator line after instructions text
      y += 10; // Reduzido de 15 para 10
    }
    
    // Separator line
    y += 10; // Reduzido de 15 para 10
    doc.moveTo(50, y)
       .lineTo(550, y)
       .stroke();
    
    return y + 8; // Reduzido de 10 para 8
  }

  /**
   * Add visual answer grid positioned to the right of QR code
   * This creates BLANK circles for students to fill in their answers
   */
  addVisualAnswerGridSideways(doc, examQuestions, startX, startY) {
    let y = startY;
    
    doc.fontSize(10).font(this.fonts.bold);
    doc.text('GABARITO', startX, y);
    
    y += 15;
    doc.fontSize(8).font(this.fonts.regular);
    doc.text('Preencha completamente o círculo', startX, y);
    doc.text('correspondente à sua resposta', startX, y + 10);
    
    y += 30;
    
    // Store initial Y position and calculate estimated final position
    const initialY = y - 10;
    const cornerSize = 8;
    const endX = startX + 220; // Width of the answer grid
    
    // Top-left and top-right corners
    doc.rect(startX - 20, initialY, cornerSize, cornerSize).fillAndStroke('black', 'black');
    doc.rect(endX - cornerSize, initialY, cornerSize, cornerSize).fillAndStroke('black', 'black');
    
    // Table header
    doc.fontSize(9).font(this.fonts.bold);
    doc.text('Q', startX, y); // Question column header
    doc.text('A', startX + 30, y);
    doc.text('B', startX + 55, y);
    doc.text('C', startX + 80, y);
    doc.text('D', startX + 105, y);
    doc.text('E', startX + 130, y);
    
    y += 15;
    
    // Header separator line (removed)
    y += 10;
    
    const rowHeight = 15;
    const questionColumn = startX;
    const alternativeColumns = [startX + 30, startX + 55, startX + 80, startX + 105, startX + 130]; // A, B, C, D, E positions
    
    examQuestions.forEach((examQuestion, index) => {
      const questionNum = index + 1;
      
      // Check if we need a new page (keeping same logic)
      if (y > 720) {
        doc.addPage();
        y = 50;
        
        // Repeat header on new page
        doc.fontSize(10).font(this.fonts.bold);
        doc.text('GABARITO (continuação)', startX, y);
        y += 25;
        
        doc.fontSize(9).font(this.fonts.bold);
        doc.text('Q', startX, y);
        doc.text('A', startX + 30, y);
        doc.text('B', startX + 55, y);
        doc.text('C', startX + 80, y);
        doc.text('D', startX + 105, y);
        doc.text('E', startX + 130, y);
        y += 15;
        
        // Removed separator line below header
        y += 10;
      }
      
      // Question number
      doc.fontSize(9).font(this.fonts.regular);
      doc.text(`${questionNum}`, questionColumn, y);
      
      // Draw EMPTY circles for each alternative (A, B, C, D, E) for student to fill
      const options = ['A', 'B', 'C', 'D', 'E'];
      options.forEach((option, optIndex) => {
        const optX = alternativeColumns[optIndex];
        const optY = y + 3;
        
        // Always draw empty circles - student will fill them in
        doc.circle(optX, optY, 4).stroke();
      });
      
      y += rowHeight;
      
      // Add a light separator line every 5 questions for better readability
      if ((index + 1) % 5 === 0) {
        doc.strokeOpacity(0.3);
        doc.moveTo(startX - 5, y + 2).lineTo(startX + 150, y + 2).stroke();
        doc.strokeOpacity(1);
        y += 5;
      }
    });
    
    // Final border
    doc.moveTo(startX - 5, y + 5).lineTo(startX + 150, y + 5).stroke();
    
    // Draw bottom reference squares now that we know the final position
    const finalY = y + 10;
    doc.rect(startX - 20, finalY, cornerSize, cornerSize).fillAndStroke('black', 'black');
    doc.rect(endX - cornerSize, finalY, cornerSize, cornerSize).fillAndStroke('black', 'black');
    
    return y + 20;
  }

  /**
   * Add visual answer grid in table format with question numbers vertically and alternatives horizontally
   * This creates BLANK circles for students to fill in their answers
   */
  addVisualAnswerGrid(doc, examQuestions) {
    let y = doc.y;
    
    doc.fontSize(10).font(this.fonts.bold);
    doc.text('GABARITO', 50, y);
    
    y += 15;
    doc.fontSize(8).font(this.fonts.regular);
    doc.text('Preencha completamente o círculo correspondente à sua resposta', 50, y);
    
    y += 25;
    
    // Store initial Y position and calculate estimated final position
    const initialY = y - 10;
    const estimatedRows = examQuestions.length + Math.floor(examQuestions.length / 5); // Add separator lines
    const estimatedFinalY = y + (estimatedRows * 15) + 30;
    
    // Draw top reference squares immediately
    const cornerSize = 8;
    const startX = 30;
    const endX = 220;
    
    // Top-left and top-right corners
    doc.rect(startX, initialY, cornerSize, cornerSize).fillAndStroke('black', 'black');
    doc.rect(endX - cornerSize, initialY, cornerSize, cornerSize).fillAndStroke('black', 'black');
    
    // Table header
    doc.fontSize(9).font(this.fonts.bold);
    doc.text('Q', 50, y); // Question column header
    doc.text('A', 80, y);
    doc.text('B', 105, y);
    doc.text('C', 130, y);
    doc.text('D', 155, y);
    doc.text('E', 180, y);
    
    y += 15;
    
    // Removed header separator line
    y += 10;
    
    const rowHeight = 15;
    const questionColumn = 50;
    const alternativeColumns = [80, 105, 130, 155, 180]; // A, B, C, D, E positions
    
    examQuestions.forEach((examQuestion, index) => {
      const questionNum = index + 1;
      
      // Check if we need a new page
      if (y > 720) {
        doc.addPage();
        y = 50;
        
        // Repeat header on new page
        doc.fontSize(10).font(this.fonts.bold);
        doc.text('GABARITO (continuação)', 50, y);
        y += 25;
        
        doc.fontSize(9).font(this.fonts.bold);
        doc.text('Q', 50, y);
        doc.text('A', 80, y);
        doc.text('B', 105, y);
        doc.text('C', 130, y);
        doc.text('D', 155, y);
        doc.text('E', 180, y);
        y += 15;
        
        doc.moveTo(45, y).lineTo(200, y).stroke();
        y += 10;
      }
      
      // Question number
      doc.fontSize(9).font(this.fonts.regular);
      doc.text(`${questionNum}`, questionColumn, y);
      
      // Draw EMPTY circles for each alternative (A, B, C, D, E) for student to fill
      const options = ['A', 'B', 'C', 'D', 'E'];
      options.forEach((option, optIndex) => {
        const optX = alternativeColumns[optIndex];
        const optY = y + 3;
        
        // Always draw empty circles - student will fill them in
        doc.circle(optX, optY, 4).stroke();
      });
      
      y += rowHeight;
      
      // Add a light separator line every 5 questions for better readability
      if ((index + 1) % 5 === 0) {
        doc.strokeOpacity(0.3);
        doc.moveTo(45, y + 2).lineTo(200, y + 2).stroke();
        doc.strokeOpacity(1);
        y += 5;
      }
    });
    
    // Final border
    doc.moveTo(45, y + 5).lineTo(200, y + 5).stroke();
    
    // Draw bottom reference squares now that we know the final position
    const finalY = y + 10;
    doc.rect(startX, finalY, cornerSize, cornerSize).fillAndStroke('black', 'black');
    doc.rect(endX - cornerSize, finalY, cornerSize, cornerSize).fillAndStroke('black', 'black');
    
    return y + 20;
  }


  /**
   * Add QR code and visual answer key section with shuffled alternatives support
   */
  async addQRCodeAndAnswerKey(doc, exam, variation, examQuestions) {
    let y = doc.y || 200;
    const startY = y;
    
    // Add separator line before QR code and answer grid section
    doc.lineWidth(1);
    doc.moveTo(50, y - 10)
       .lineTo(550, y - 10)
       .stroke();
    
    // Add some spacing after the separator line
    y += 15;
    
    // Generate QR code with answer key (including shuffled alternatives)
    const qrResult = await qrService.generateAnswerKeyQR(exam, variation, examQuestions);
    const qrBuffer = await qrService.generateQRBuffer(JSON.stringify(qrResult.qrData), { width: 120 });
    
    // QR Code section - LEFT SIDE
    // (removed "GABARITO DO PROFESSOR" text as requested)
    
    // Add QR code image on the left
    doc.image(qrBuffer, 50, y, { width: 80, height: 80 });
    
    // Instructions below QR code
    doc.fontSize(8).font(this.fonts.regular);
    doc.text('Professor: Escaneie este', 50, y + 85);
    doc.text('QR Code para correção', 50, y + 95);
    doc.text('automática', 50, y + 105);
    doc.text(`Variação: ${variation.variationNumber}`, 50, y + 115);
    
    // FOLHA DE RESPOSTAS section - RIGHT SIDE
    const answersStartX = 180; // Position with proper spacing from QR code
    const answersStartY = startY;
    
    // Call modified addVisualAnswerGrid that will handle positioning
    const finalY = this.addVisualAnswerGridSideways(doc, examQuestions, answersStartX, answersStartY);
    
    // Calculate final Y position (max between QR section and answer grid)
    const qrFinalY = y + 130;
    const maxY = Math.max(qrFinalY, finalY);
    
    // Add extra spacing to separate from questions section
    const separatedY = maxY + 45;
    
    // Stronger separator line with more visual emphasis
    doc.lineWidth(1.5);
    doc.moveTo(50, separatedY)
       .lineTo(550, separatedY)
       .stroke();
    doc.lineWidth(1); // Reset line width
    
    // Clean separator without decorative elements
    
    // Set doc.y to ensure questions start below this section with more space
    doc.y = separatedY + 25;
    
    return separatedY + 15;
  }

  /**
   * Add exam questions section with support for shuffled alternatives and column layout
   */
  async addExamQuestions(doc, examQuestions, layout = 'single') {
    // Use the current doc.y position set by previous sections
    let y = doc.y;
    
    // Ensure we have a minimum Y position (fallback)
    if (!y || y < 350) {
      y = 350;
    }
    
    // Section title with more visual emphasis
    doc.fontSize(14).font(this.fonts.bold);
    doc.text('QUESTÕES:', 50, y);
    
    // Add underline for QUESTÕES title
    doc.lineWidth(1);
    doc.moveTo(50, y + 16)
       .lineTo(130, y + 16)
       .stroke();
    
    y += 45; // More spacing between header and first question
    
    if (layout === 'double') {
      return this.addExamQuestionsDoubleColumn(doc, examQuestions, y);
    }
    
    // Single column layout (original)
    examQuestions.forEach((examQuestion, index) => {
      // Get question data - examQuestion is now the flattened question with all properties
      const question = examQuestion;
      
      // Use shuffled alternatives if available, otherwise use original
      let alternatives = question.alternatives;
      if (question.shuffledAlternatives && question.shuffledAlternatives.alternatives) {
        alternatives = question.shuffledAlternatives.alternatives;
        console.log(`🔀 Using shuffled alternatives for question ${question.id}`);
      }
      
      console.log(`🔍 Questão ${index + 1}:`, {
        id: question.id,
        title: question.title,
        text: question.text,
        hasAlternatives: alternatives && alternatives.length > 0,
        alternativesCount: alternatives ? alternatives.length : 0
      });
      
      // Simple space check - if we're too close to bottom, start new page
      const pageBottomMargin = 100; // Leave space at bottom
      if (y > 800 - pageBottomMargin) {
        doc.addPage();
        y = 50;
        
        // Add header again on new page
        doc.fontSize(12).font(this.fonts.bold);
        doc.text('QUESTÕES:', 50, y);
        y += 25; // Reduced spacing
      }
      
      // Question number and title
      doc.fontSize(10).font(this.fonts.bold);
      const questionHeader = `${index + 1}. ${question.title || `Questão ${index + 1}`}`;
      doc.text(questionHeader, 50, y);
      
      // Points removed from student PDF - only shown in teacher's answer key
      // const points = examQuestion.points || question.points;
      // Points will be visible only in the teacher's answer key section
      
      y += 12; // Reduced spacing from 20 to 12
      
      // Question text - garantir que o enunciado apareça
      doc.fontSize(9).font(this.fonts.regular);
      let text = '';
      
      // Debug: log question properties
      console.log(`🔍 Debug Questão ${index + 1}:`, {
        hasText: !!question.text,
        textValue: question.text,
        hasTitle: !!question.title,
        titleValue: question.title,
        hasStatement: !!question.statement,
        questionKeys: Object.keys(question)
      });
      
      // Priorizar question.text, depois question.statement, depois question.title
      if (question.text && typeof question.text === 'string' && question.text.trim()) {
        text = question.text.trim();
      } else if (question.statement && typeof question.statement === 'string' && question.statement.trim()) {
        text = question.statement.trim();
      } else if (question.title && typeof question.title === 'string' && question.title.trim()) {
        text = question.title.trim();
      } else {
        text = 'Texto da questão não disponível';
        console.error(`❌ Questão ${index + 1} sem texto válido:`, {
          text: question.text,
          statement: question.statement,  
          title: question.title,
          id: question.id
        });
      }
      
      console.log(`📝 Questão ${index + 1}: "${text.substring(0, 50)}..." (${text.length} chars)`);
      
      // Render text using improved text wrapping
      const maxTextWidth = 480; // Reduced width to ensure better wrapping
      const textOptions = {
        width: maxTextWidth,
        align: 'left',
        lineGap: 3,
        indent: 0,
        paragraphGap: 2,
        ellipsis: false,
        features: ['liga']
      };
      
      // Check if we need a new page before rendering text
      if (y > 700) {
        doc.addPage();
        y = 50;
        doc.fontSize(12).font(this.fonts.bold);
        doc.text('QUESTÕES (continuação):', 50, y);
        y += 25;
        doc.fontSize(9).font(this.fonts.regular);
      }
      
      // Render the complete text in one call - let PDFKit handle wrapping
      const textHeight = doc.heightOfString(text, textOptions);
      
      // Final check if text will fit on current page
      if (y + textHeight > 750) {
        doc.addPage();
        y = 50;
        doc.fontSize(12).font(this.fonts.bold);
        doc.text('QUESTÕES (continuação):', 50, y);
        y += 25;
        doc.fontSize(9).font(this.fonts.regular);
      }
      
      // Apply additional text wrapping before PDFKit rendering
      const wrappedText = this.wrapText(doc, text, maxTextWidth);
      
      // Recalculate height with wrapped text
      const wrappedTextHeight = doc.heightOfString(wrappedText, textOptions);
      
      // Render the text
      doc.text(wrappedText, 50, y, textOptions);
      y += wrappedTextHeight + 8; // Add gap after text
      
      // Question type specific content - garantir que alternativas apareçam
      if (question.type === 'multiple_choice') {
        // Garantir que temos alternativas
        let finalAlternatives = alternatives;
        
        // Se não temos alternativas nas variações embaralhadas, pegar as originais
        if (!finalAlternatives || finalAlternatives.length === 0) {
          finalAlternatives = question.alternatives || [];
        }
        
        // Filtrar alternativas válidas
        const validAlternatives = finalAlternatives.filter(alt => alt && alt.trim && alt.trim() !== '');
        
        console.log(`🔄 Questão ${index + 1}: ${validAlternatives.length} alternativas válidas`);
        
        if (validAlternatives.length > 0) {
          const letters = ['A', 'B', 'C', 'D', 'E'];
          validAlternatives.forEach((alternative, altIndex) => {
            if (altIndex < 5) { // Máximo 5 alternativas (A-E)
              const altText = `${letters[altIndex]}) ${alternative.trim()}`;
              
              // Check if we need a new page before each alternative
              if (y > 720) {
                doc.addPage();
                y = 50;
                doc.fontSize(12).font(this.fonts.bold);
                doc.text('QUESTÕES (continuação):', 50, y);
                y += 25;
                doc.fontSize(9).font(this.fonts.regular);
              }
              
              // Render alternative using PDFKit's automatic wrapping
              const altOptions = {
                width: 480,
                align: 'left',
                indent: 10
              };
              
              const altHeight = doc.heightOfString(altText, altOptions);
              
              // Final check if alternative will fit
              if (y + altHeight > 750) {
                doc.addPage();
                y = 50;
                doc.fontSize(12).font(this.fonts.bold);
                doc.text('QUESTÕES (continuação):', 50, y);
                y += 25;
                doc.fontSize(9).font(this.fonts.regular);
              }
              
              // Apply text wrapping to alternative
              const wrappedAltText = this.wrapText(doc, altText, 460);
              
              // Recalculate height with wrapped text
              const wrappedAltHeight = doc.heightOfString(wrappedAltText, altOptions);
              
              // Render the alternative
              doc.text(wrappedAltText, 60, y, altOptions);
              y += wrappedAltHeight + 4; // Small gap between alternatives
            }
          });
        } else {
          doc.fontSize(8).font(this.fonts.italic);
          doc.text('(Alternativas não disponíveis)', 60, y);
          y += 12;
        }
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
      
      y += 8; // Reduced space between questions from 15 to 8
    });
    
    return y;
  }

  /**
   * Add exam questions in double column layout
   */
  async addExamQuestionsDoubleColumn(doc, examQuestions, startY) {
    let y = startY;
    const leftColumnX = 50;
    const rightColumnX = 310;
    const columnWidth = 240;
    
    let currentColumn = 'left';
    let leftColumnY = y;
    let rightColumnY = y;
    
    examQuestions.forEach((examQuestion, index) => {
      const question = examQuestion;
      
      // Use shuffled alternatives if available, otherwise use original
      let alternatives = question.alternatives;
      if (question.shuffledAlternatives && question.shuffledAlternatives.alternatives) {
        alternatives = question.shuffledAlternatives.alternatives;
      }
      
      // Simple space check for double column
      const pageBottomMargin = 120; // More margin for double column
      
      // Determine which column to use and current Y position
      let currentX, currentY;
      if (currentColumn === 'left') {
        currentX = leftColumnX;
        currentY = leftColumnY;
        
        // Check if question fits in current page for left column  
        if (currentY > 800 - pageBottomMargin) {
          doc.addPage();
          leftColumnY = 50;
          rightColumnY = 50;
          currentY = leftColumnY;
          
          // Add header again on new page
          doc.fontSize(12).font(this.fonts.bold);
          doc.text('QUESTÕES:', 50, 50);
          leftColumnY += 35;
          rightColumnY += 35;
          currentY = leftColumnY;
        }
      } else {
        currentX = rightColumnX;
        currentY = rightColumnY;
        
        // Check if question fits in current page for right column
        if (currentY > 800 - pageBottomMargin) {
          // Move to left column of next page
          doc.addPage();
          leftColumnY = 50;
          rightColumnY = 50;
          currentColumn = 'left';
          currentX = leftColumnX;
          currentY = leftColumnY;
          
          // Add header again on new page
          doc.fontSize(12).font(this.fonts.bold);
          doc.text('QUESTÕES:', 50, 50);
          leftColumnY += 35;
          rightColumnY += 35;
          currentY = leftColumnY;
        }
      }
      
      // Question number and title
      doc.fontSize(10).font(this.fonts.bold);
      const questionHeader = `${index + 1}. ${question.title || `Questão ${index + 1}`}`;
      
      // Wrap text to fit column width
      const wrappedHeader = this.wrapText(doc, questionHeader, columnWidth - 10); // Maximum width - no points needed
      doc.text(wrappedHeader, currentX, currentY);
      
      // Points removed from student PDF - only shown in teacher's answer key
      // const points = examQuestion.points || question.points;
      // Points will be visible only in the teacher's answer key section
      
      currentY += 12; // Reduced from 20 to 12
      
      // Question text
      doc.fontSize(9).font(this.fonts.regular);
      let text = '';
      
      if (question.text && typeof question.text === 'string' && question.text.trim()) {
        text = question.text.trim();
      } else if (question.statement && typeof question.statement === 'string' && question.statement.trim()) {
        text = question.statement.trim();
      } else if (question.title && typeof question.title === 'string' && question.title.trim()) {
        text = question.title.trim();
      } else {
        text = 'Texto da questão não disponível';
      }
      
      // Apply text wrapping for double column
      const wrappedText = this.wrapText(doc, text, columnWidth - 15);
      
      // Render text using PDFKit's automatic wrapping for double column
      const textOptions = {
        width: columnWidth - 15,
        align: 'left',
        lineGap: 3,
        paragraphGap: 2
      };
      
      // Check if text will fit in current column
      const textHeight = doc.heightOfString(wrappedText, textOptions);
      if (currentY + textHeight > 700) {
        if (currentColumn === 'left') {
          // Move to right column
          currentColumn = 'right';
          currentX = rightColumnX;
          currentY = rightColumnY;
        } else {
          // Move to next page
          doc.addPage();
          leftColumnY = 50;
          rightColumnY = 50;
          currentColumn = 'left';
          currentX = leftColumnX;
          currentY = leftColumnY;
          
          // Add header on new page
          doc.fontSize(12).font(this.fonts.bold);
          doc.text('QUESTÕES:', 50, 50);
          leftColumnY += 35;
          rightColumnY += 35;
          currentY = leftColumnY;
          doc.fontSize(9).font(this.fonts.regular);
        }
      }
      
      // Render the text
      doc.text(wrappedText, currentX, currentY, textOptions);
      currentY += textHeight + 8;
      
      // Question alternatives
      if (question.type === 'multiple_choice') {
        const validAlternatives = alternatives?.filter(alt => alt && alt.trim && alt.trim() !== '') || [];
        
        if (validAlternatives.length > 0) {
          const letters = ['A', 'B', 'C', 'D', 'E'];
          validAlternatives.forEach((alternative, altIndex) => {
            if (altIndex < 5) {
              const altText = `${letters[altIndex]}) ${alternative.trim()}`;
              
              const altOptions = {
                width: columnWidth - 20,
                align: 'left',
                indent: 10
              };
              
              const altHeight = doc.heightOfString(altText, altOptions);
              
              // Check if alternative will fit in current column
              if (currentY + altHeight > 700) {
                if (currentColumn === 'left') {
                  // Move to right column
                  currentColumn = 'right';
                  currentX = rightColumnX;
                  currentY = rightColumnY;
                } else {
                  // Move to next page
                  doc.addPage();
                  leftColumnY = 50;
                  rightColumnY = 50;
                  currentColumn = 'left';
                  currentX = leftColumnX;
                  currentY = leftColumnY;
                  
                  // Add header on new page
                  doc.fontSize(12).font(this.fonts.bold);
                  doc.text('QUESTÕES:', 50, 50);
                  leftColumnY += 35;
                  rightColumnY += 35;
                  currentY = leftColumnY;
                  doc.fontSize(9).font(this.fonts.regular);
                }
              }
              
              // Render the alternative
              doc.text(altText, currentX + 10, currentY, altOptions);
              currentY += altHeight + 3;
            }
          });
        }
      } else if (question.type === 'true_false') {
        doc.text('A) Verdadeiro', currentX + 10, currentY);
        currentY += 12;
        doc.text('B) Falso', currentX + 10, currentY);
        currentY += 12;
      }
      
      currentY += 15; // Space between questions
      
      // Update column Y positions and switch columns
      if (currentColumn === 'left') {
        leftColumnY = currentY;
        currentColumn = 'right';
      } else {
        rightColumnY = currentY;
        currentColumn = 'left';
      }
    });
    
    // Return the maximum Y position
    return Math.max(leftColumnY, rightColumnY);
  }

  /**
   * Wrap text to fit within specified width
   */
  wrapText(doc, text, maxWidth) {
    if (!text || !text.trim()) return '';
    
    // Handle existing line breaks first
    const paragraphs = text.split('\n');
    const allLines = [];
    
    paragraphs.forEach(paragraph => {
      if (!paragraph.trim()) {
        allLines.push(''); // Preserve empty lines
        return;
      }
      
      const words = paragraph.split(' ');
      const lines = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const testWidth = doc.widthOfString(testLine);
        
        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // Word is too long for one line, break it more aggressively
            if (word.length > 25) {
              // Break very long words at reasonable points
              const chunks = [];
              for (let i = 0; i < word.length; i += 20) {
                chunks.push(word.substring(i, i + 20) + (i + 20 < word.length ? '-' : ''));
              }
              lines.push(...chunks);
              currentLine = '';
            } else {
              lines.push(word);
              currentLine = '';
            }
          }
        }
      });
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      allLines.push(...lines);
    });
    
    return allLines.join('\n');
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