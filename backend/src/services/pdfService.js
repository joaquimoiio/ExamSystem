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
          margin: 20 // Traditional school exam margins
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
          margin: 20 // Traditional school exam margins
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
          margin: 20 // Traditional school exam margins
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
          margin: 20 // Traditional school exam margins
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
          margin: 20 // Traditional school exam margins
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
          margin: 20 // Traditional school exam margins
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

    // Line under header removed
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

    // Line under headers removed

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
      doc.text('QR Code', x + qrSize / 2 - 15, y + qrSize / 2 + 10);

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
    // Line for name removed

    // ID field
    y += 25;
    doc.text('Student ID: ', 50, y);
    // Line for student ID removed

    // Email field
    y += 25;
    doc.text('Email: ', 50, y);
    // Line for email removed

    // Date field
    y += 25;
    doc.text('Date: ', 50, y);
    // Line for date removed

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

        // Footer line removed

        // Footer text removed
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
          margin: 20 // Traditional school exam margins
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

          // Separator line removed

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
    let y = 40;
    const header = examHeader || {};
    const marginLeft = 50;
    const marginRight = 350;
    
    // Track if we have optional content to adjust spacing
    const hasEvaluationCriteria = header.evaluationCriteria && header.evaluationCriteria.trim();
    const hasInstructions = header.instructions && header.instructions.trim();

    // School info - only if provided
    if (header.schoolName && header.schoolName.trim()) {
      doc.fontSize(12).font(this.fonts.bold);
      doc.text(header.schoolName.trim(), marginLeft, y, { align: 'center' });
      y += 16;
    }

    // Basic exam info (always present)
    doc.fontSize(10).font(this.fonts.regular);
    
    // Subject line - only if we have subject info
    const subjectName = exam.subject?.name || header.subjectName;
    if (subjectName && subjectName.trim()) {
      doc.text(`Disciplina: ${subjectName}`, marginLeft, y);
    }
    
    // Year - only if provided
    const year = header.year || new Date().getFullYear();
    if (year) {
      doc.text(`Ano: ${year}`, marginRight, y);
    }
    
    // Move down only if we had subject or year info
    if (subjectName || year) {
      y += 14;
    }

    // Exam title and variation (always present)
    doc.text(`Prova: ${exam.title}`, marginLeft, y);
    doc.text(`Variação: ${variation.variationNumber}`, marginRight, y);
    y += 14;
    
    // Date field (always present)
    doc.text(`Data: ___/___/______`, marginLeft, y);
    y += 16; // Slightly more space before student info

    // Student info section (always present)
    doc.fontSize(9).font(this.fonts.regular);
    doc.text('Nome: _________________________________________________ Turma: _______', marginLeft, y);
    y += 16; // Base spacing after student info

    // Evaluation criteria (optional - dynamic spacing)
    if (hasEvaluationCriteria) {
      y += 8; // Small gap before criteria
      doc.fontSize(8).font(this.fonts.bold);
      doc.text('Critérios de Avaliação:', marginLeft, y);
      y += 10;
      
      doc.fontSize(7).font(this.fonts.regular);
      const criteriaLines = header.evaluationCriteria.split('\n').filter(line => line.trim());
      criteriaLines.forEach(line => {
        if (line.trim()) {
          doc.text(line.trim(), marginLeft, y);
          y += 8;
        }
      });
      y += 6; // Extra space after criteria
    }

    // Instructions (optional - dynamic spacing)
    if (hasInstructions) {
      y += 8; // Small gap before instructions
      doc.fontSize(8).font(this.fonts.bold);
      doc.text('Instruções:', marginLeft, y);
      y += 10;

      doc.fontSize(7).font(this.fonts.regular);
      const instructionLines = header.instructions.split('\n').filter(line => line.trim());
      instructionLines.forEach(line => {
        if (line.trim()) {
          doc.text(line.trim(), marginLeft, y);
          y += 8;
        }
      });
      y += 6; // Extra space after instructions
    }

    // Final separator removed - adaptive spacing
    y += hasEvaluationCriteria || hasInstructions ? 10 : 16;

    return y + 8;
  }

  /**
   * Add exam header section
   */
  async addExamHeader(doc, examHeader, exam) {
    let y = 40;
    const header = examHeader || {};
    const marginLeft = 50;
    const marginRight = 350;
    
    // Track if we have optional content to adjust spacing
    const hasEvaluationCriteria = header.evaluationCriteria && header.evaluationCriteria.trim();
    const hasInstructions = header.instructions && header.instructions.trim();

    // School info - only if provided
    if (header.schoolName && header.schoolName.trim()) {
      doc.fontSize(12).font(this.fonts.bold);
      doc.text(header.schoolName.trim(), marginLeft, y, { align: 'center' });
      y += 16;
    }

    // Basic exam info (always present)
    doc.fontSize(10).font(this.fonts.regular);
    
    // Subject line - only if we have subject info
    const subjectName = exam.subject?.name || header.subjectName;
    if (subjectName && subjectName.trim()) {
      doc.text(`Disciplina: ${subjectName}`, marginLeft, y);
    }
    
    // Year - only if provided
    const year = header.year || new Date().getFullYear();
    if (year) {
      doc.text(`Ano: ${year}`, marginRight, y);
    }
    
    // Move down only if we had subject or year info
    if (subjectName || year) {
      y += 14;
    }

    // Exam title and variation (always present)
    doc.text(`Prova: ${exam.title}`, marginLeft, y);
    doc.text(`Variação: ${exam.variationNumber || 'A'}`, marginRight, y);
    y += 14;
    
    // Date field (always present)
    doc.text(`Data: ___/___/______`, marginLeft, y);
    y += 16; // Slightly more space before student info

    // Student info section (always present)
    doc.fontSize(9).font(this.fonts.regular);
    doc.text('Nome: _________________________________________________ Turma: _______', marginLeft, y);
    y += 16; // Base spacing after student info

    // Evaluation criteria (optional - dynamic spacing)
    if (hasEvaluationCriteria) {
      y += 8; // Small gap before criteria
      doc.fontSize(8).font(this.fonts.bold);
      doc.text('Critérios de Avaliação:', marginLeft, y);
      y += 10;
      
      doc.fontSize(7).font(this.fonts.regular);
      const criteriaLines = header.evaluationCriteria.split('\n').filter(line => line.trim());
      criteriaLines.forEach(line => {
        if (line.trim()) {
          doc.text(line.trim(), marginLeft, y);
          y += 8;
        }
      });
      y += 6; // Extra space after criteria
    }

    // Instructions (optional - dynamic spacing)
    if (hasInstructions) {
      y += 8; // Small gap before instructions
      doc.fontSize(8).font(this.fonts.bold);
      doc.text('Instruções:', marginLeft, y);
      y += 10;

      doc.fontSize(7).font(this.fonts.regular);
      const instructionLines = header.instructions.split('\n').filter(line => line.trim());
      instructionLines.forEach(line => {
        if (line.trim()) {
          doc.text(line.trim(), marginLeft, y);
          y += 8;
        }
      });
      y += 6; // Extra space after instructions
    }

    // Final separator removed - adaptive spacing
    y += hasEvaluationCriteria || hasInstructions ? 10 : 16;

    return y + 8;
  }

  /**
   * Add visual answer grid positioned to the right of QR code
   * This creates BLANK circles for students to fill in their answers
   */
  addVisualAnswerGridSideways(doc, examQuestions, startX, startY) {
    let y = startY;

    doc.fontSize(9).font(this.fonts.bold);
    doc.text('GABARITO', startX, y);

    y += 12; // Spacing after title
    doc.fontSize(7).font(this.fonts.regular);

    y += 16; // Reduced spacing before grid starts

    // Store initial Y position and calculate estimated final position
    const initialY = y - 10;
    const cornerSize = 8;
    const endX = startX + 220; // Width of the answer grid

    // Top-left and top-right corners
    doc.rect(startX - 20, initialY, cornerSize, cornerSize).fillAndStroke('black', 'black');
    doc.rect(endX - cornerSize, initialY, cornerSize, cornerSize).fillAndStroke('black', 'black');

    // Table header
    doc.fontSize(8).font(this.fonts.bold); // Reduced from 9 to 8
    doc.text('Q', startX, y); // Question column header
    doc.text('A', startX + 25, y); // Reduced spacing
    doc.text('B', startX + 45, y); // Reduced spacing
    doc.text('C', startX + 65, y); // Reduced spacing
    doc.text('D', startX + 85, y); // Reduced spacing
    doc.text('E', startX + 105, y); // Reduced spacing

    y += 12; // Reduced from 15 to 12

    // Header separator line (removed)
    y += 5; // Reduced from 10 to 5

    const rowHeight = 12; // Reduced from 15 to 12
    const questionColumn = startX;
    const alternativeColumns = [startX + 25, startX + 45, startX + 65, startX + 85, startX + 105]; // A, B, C, D, E positions - more compact

    examQuestions.forEach((examQuestion, index) => {
      const questionNum = index + 1;

      // Check if we need a new page (keeping same logic)
      if (y > 720) {
        doc.addPage();
        y = 40; // Start higher on new page

        // Repeat header on new page
        doc.fontSize(8).font(this.fonts.bold); // Reduced font
        doc.text('GABARITO (cont.)', startX, y);
        y += 15; // Reduced from 25 to 15

        doc.fontSize(8).font(this.fonts.bold);
        doc.text('Q', startX, y);
        doc.text('A', startX + 25, y);
        doc.text('B', startX + 45, y);
        doc.text('C', startX + 65, y);
        doc.text('D', startX + 85, y);
        doc.text('E', startX + 105, y);
        y += 12; // Reduced from 15 to 12

        y += 5; // Reduced from 10 to 5
      }

      // Question number
      doc.fontSize(8).font(this.fonts.regular); // Reduced from 9 to 8
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

      // Light separator line removed for cleaner look
      if ((index + 1) % 5 === 0) {
        y += 5;
      }
    });

    // Final border removed

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

        // Line removed
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

      // Light separator line removed for cleaner look
      if ((index + 1) % 5 === 0) {
        y += 5;
      }
    });

    // Final border removed

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

    // Separator line before QR code and answer grid section removed

    // Add more spacing between header sections and gabarito for better readability
    y += 25;

    // Generate QR code with answer key (including shuffled alternatives)
    const qrResult = await qrService.generateAnswerKeyQR(exam, variation, examQuestions);
    const qrBuffer = await qrService.generateQRBuffer(JSON.stringify(qrResult.qrData), { width: 120 });

    // QR Code section - LEFT SIDE
    // Add QR code image on the left - more compact
    doc.image(qrBuffer, 40, y, { width: 60, height: 60 }); // Reduced size from 80x80 to 60x60

    // Instructions below QR code - more compact
    doc.fontSize(7).font(this.fonts.regular); // Reduced from 8 to 7
    doc.text('Escaneie para', 40, y + 65);
    doc.text('correção automática', 40, y + 75);
    doc.text(`Variação: ${variation.variationNumber}`, 40, y + 85);

    // FOLHA DE RESPOSTAS section - RIGHT SIDE
    const answersStartX = 170; // Moved closer from 180 to 170
    const answersStartY = y; // Use the Y position with added spacing

    // Call modified addVisualAnswerGrid that will handle positioning
    const finalY = this.addVisualAnswerGridSideways(doc, examQuestions, answersStartX, answersStartY);

    // Calculate final Y position (max between QR section and answer grid)
    const qrFinalY = y + 100; // Reduced from 130 to 100
    const maxY = Math.max(qrFinalY, finalY);

    // Dynamically adjust spacing based on content - more responsive
    const baseSpacing = 15;
    const separatedY = maxY + baseSpacing;

    // Separator line removed

    // Set doc.y to ensure questions start below this section with minimal spacing
    doc.y = separatedY + 8;

    return separatedY + 8;
  }

  /**
   * Add exam questions section - TRADITIONAL SCHOOL EXAM FORMAT
   */
  async addExamQuestions(doc, examQuestions, layout = 'single') {
    // Use the current doc.y position set by previous sections
    let y = doc.y;

    // Dynamic minimum Y position - more responsive to actual content above
    // Only enforce minimum if we're too high up (indicating missing content above)
    if (!y || y < 200) {
      y = Math.max(y || 200, 200);
    }

    // Section title - traditional format
    doc.fontSize(11).font(this.fonts.bold);
    doc.text('QUESTÕES:', 40, y);

    y += 12; // Reduced space after title for more responsive layout

    if (layout === 'double') {
      return this.addExamQuestionsDoubleColumn(doc, examQuestions, y);
    }

    // Traditional single column layout
    examQuestions.forEach((examQuestion, index) => {
      // Get question data
      const question = examQuestion;

      // Use shuffled alternatives if available, otherwise use original
      let alternatives = question.alternatives;
      if (question.shuffledAlternatives && question.shuffledAlternatives.alternatives) {
        alternatives = question.shuffledAlternatives.alternatives;
      }

      // Dynamic page break calculation based on content
      const minSpaceNeeded = this.estimateQuestionSpace(doc, question, alternatives);
      if (y + minSpaceNeeded > 750) {
        doc.addPage();
        y = 40; // Start higher on new page
      }

      // Get question text
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

      // Traditional format: "01) Question text goes here and continues to almost the end of the line..."
      const questionNumber = String(index + 1).padStart(2, '0'); // Format: 01, 02, etc.
      const fullQuestionText = `${questionNumber}) ${text}`;

      // Maximum width for question text (traditional school format - almost full page)
      const questionMaxWidth = 530; // Adjusted for better margins (595 - 65 for margins)

      // Render question text using traditional format
      doc.fontSize(10).font(this.fonts.regular); // Reduced from 11 to 10

      // Calculate how much space we need
      const questionHeight = doc.heightOfString(fullQuestionText, {
        width: questionMaxWidth,
        align: 'justify'
      });

      // Check if question will fit on current page - more precise calculation
      const totalSpaceNeeded = questionHeight + (alternatives?.length || 0) * 12 + 30;
      if (y + totalSpaceNeeded > 750) {
        doc.addPage();
        y = 40;
      }

      // Render the complete question text in traditional format
      doc.text(fullQuestionText, 40, y, { // Moved from 20 to 40 for better left margin
        width: questionMaxWidth,
        align: 'justify', // Justified like traditional school exams
        lineGap: 2, // Reduced from 3 to 2
        ellipsis: false,
        height: undefined
      });

      y += questionHeight + 10; // Reduced space after question text from 15 to 10

      // Alternatives in traditional format
      if (question.type === 'multiple_choice') {
        let finalAlternatives = alternatives;

        if (!finalAlternatives || finalAlternatives.length === 0) {
          finalAlternatives = question.alternatives || [];
        }

        const validAlternatives = finalAlternatives.filter(alt => alt && alt.trim && alt.trim() !== '');

        if (validAlternatives.length > 0) {
          const letters = ['A', 'B', 'C', 'D', 'E'];

          // Traditional alternatives format - compact and organized
          validAlternatives.forEach((alternative, altIndex) => {
            if (altIndex < 5) {
              // Check if we need a new page for alternatives
              if (y > 730) {
                doc.addPage();
                y = 40;
              }

              const altLetter = letters[altIndex];
              const altText = alternative.trim();

              // Traditional format: letter, space, text with limited width for readability
              doc.fontSize(9).font(this.fonts.regular); // Reduced from 10 to 9

              // Alternative text with traditional formatting
              const alternativeMaxWidth = 480; // Increased width but still readable

              doc.text(`${altLetter}) `, 50, y, { continued: true }); // Moved from 30 to 50
              doc.text(altText, {
                width: alternativeMaxWidth,
                align: 'left', // Changed back to left for alternatives
                indent: 0,
                ellipsis: false,
                height: undefined
              });

              const altHeight = doc.heightOfString(altText, { width: alternativeMaxWidth });
              y += Math.max(altHeight + 3, 12); // Reduced spacing: 8->3, 18->12
            }
          });
        }
      } else if (question.type === 'true_false') {
        doc.fontSize(9).font(this.fonts.regular); // Reduced font size
        doc.text('A) Verdadeiro', 50, y);
        y += 12; // Reduced from 18 to 12
        doc.text('B) Falso', 50, y);
        y += 12; // Reduced from 18 to 12
      } else if (question.type === 'essay') {
        // Essay question - traditional answer lines
        doc.fontSize(9).font(this.fonts.regular); // Reduced font size
        doc.text('Resposta:', 40, y);
        y += 15; // Reduced from 20 to 15

        // Traditional answer lines
        for (let i = 0; i < 5; i++) { // Reduced from 6 to 5 lines
          if (y > 750) {
            doc.addPage();
            y = 40;
          }
          // Answer lines removed for cleaner look
          y += 20; // Reduced from 25 to 20
        }
      }

      y += 15; // Reduced space between questions from 20 to 15
    });

    return y;
  }

  /**
   * Add exam questions in double column layout
   */
  async addExamQuestionsDoubleColumn(doc, examQuestions, startY) {
    let y = startY;
    const leftColumnX = 25; // Start closer to edge  
    const rightColumnX = 297; // Adjusted for better spacing
    const columnWidth = 267; // Increased to maximize column space

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

      // Question number only (avoid duplication with text content)
      doc.fontSize(10).font(this.fonts.bold);
      const questionHeader = `${index + 1}.`;
      doc.text(questionHeader, currentX, currentY);

      currentY += 12; // Reduced from 20 to 12

      // Question text - COMPLETE without duplication
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

      // Split text into chunks for double column layout - FIXED to show complete text
      const maxColumnWidth = columnWidth - 10; // Reduced margin from 15 to 10
      const textChunks = this.splitTextIntoChunks(text, maxColumnWidth * 10); // Smaller chunks for columns

      textChunks.forEach((chunk, chunkIndex) => {
        // Render text using PDFKit's automatic wrapping for double column
        const textOptions = {
          width: maxColumnWidth,
          align: 'justify', // Changed from 'left' to 'justify' for better space usage
          lineGap: 2, // Reduced from 3 to 2 for tighter spacing
          paragraphGap: 2,
          ellipsis: false, // Critical: no truncation
          height: undefined // No height limit
        };

        // Check if text will fit in current column
        const textHeight = doc.heightOfString(chunk, textOptions);
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

        // Render the text chunk
        doc.text(chunk, currentX, currentY, textOptions);
        currentY += textHeight + (chunkIndex < textChunks.length - 1 ? 3 : 8); // Less spacing between chunks
      });

      // Question alternatives
      if (question.type === 'multiple_choice') {
        const validAlternatives = alternatives?.filter(alt => alt && alt.trim && alt.trim() !== '') || [];

        if (validAlternatives.length > 0) {
          const letters = ['A', 'B', 'C', 'D', 'E'];
          validAlternatives.forEach((alternative, altIndex) => {
            if (altIndex < 5) {
              const altText = `${letters[altIndex]}) ${alternative.trim()}`;

              const altOptions = {
                width: columnWidth - 15, // Reduced margin from 20 to 15 for more space
                align: 'justify', // Changed from 'left' to 'justify' for better space usage
                indent: 10,
                ellipsis: false, // Critical: no truncation
                height: undefined // No height limit
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

              // Render the complete alternative text
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
   * Estimate the space needed for a question
   */
  estimateQuestionSpace(doc, question, alternatives) {
    let estimatedHeight = 0;
    
    // Question text height estimate
    const questionText = question.text || question.statement || question.title || '';
    if (questionText) {
      const textHeight = doc.heightOfString(questionText, { width: 530 });
      estimatedHeight += textHeight + 15;
    }
    
    // Alternatives height estimate
    if (question.type === 'multiple_choice' && alternatives) {
      const validAlternatives = alternatives.filter(alt => alt && alt.trim && alt.trim() !== '');
      estimatedHeight += validAlternatives.length * 15; // Estimate 15pt per alternative
    } else if (question.type === 'essay') {
      estimatedHeight += 120; // Space for essay lines
    } else if (question.type === 'true_false') {
      estimatedHeight += 30; // Space for true/false options
    }
    
    // Add padding
    estimatedHeight += 25;
    
    return estimatedHeight;
  }

  /**
   * Split text into manageable chunks for PDF rendering
   */
  splitTextIntoChunks(text, maxChunkSize) {
    if (!text || text.length <= maxChunkSize) {
      return [text];
    }

    const chunks = [];
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
    let currentChunk = '';

    sentences.forEach(sentence => {
      if ((currentChunk + sentence).length <= maxChunkSize) {
        currentChunk += sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          // Sentence is longer than max chunk size, split by words
          const words = sentence.split(' ');
          let wordChunk = '';
          words.forEach(word => {
            if ((wordChunk + ' ' + word).length <= maxChunkSize) {
              wordChunk += (wordChunk ? ' ' : '') + word;
            } else {
              if (wordChunk) chunks.push(wordChunk.trim());
              wordChunk = word;
            }
          });
          if (wordChunk) chunks.push(wordChunk.trim());
          currentChunk = '';
        }
      }
    });

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length > 0);
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