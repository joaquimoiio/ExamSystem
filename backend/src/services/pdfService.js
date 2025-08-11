const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

class PDFService {
  constructor() {
    this.uploadPaths = {
      pdfs: path.join(__dirname, '../uploads/pdfs')
    };
    
    // Ensure directory exists
    if (!fs.existsSync(this.uploadPaths.pdfs)) {
      fs.mkdirSync(this.uploadPaths.pdfs, { recursive: true });
    }
  }

  async generateExamPDF(exam, variation, options = {}) {
    try {
      const {
        includeAnswerKey = false,
        watermark = null,
        customHeader = null
      } = options;

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      // Generate filename
      const filename = `exam_${exam.id}_variation_${variation.variationLetter}_${Date.now()}.pdf`;
      const filepath = path.join(this.uploadPaths.pdfs, filename);
      
      // Pipe to file
      doc.pipe(fs.createWriteStream(filepath));

      // Generate QR Code
      const qrCodeDataURL = await QRCode.toDataURL(variation.qrCode, {
        width: 100,
        margin: 1
      });

      // Add header
      await this.addHeader(doc, exam, variation, qrCodeDataURL, customHeader);

      // Add instructions if available
      if (exam.instructions) {
        this.addInstructions(doc, exam.instructions);
      }

      // Add questions
      await this.addQuestions(doc, variation.questions, includeAnswerKey);

      // Add footer
      this.addFooter(doc, exam, variation);

      // Add watermark if specified
      if (watermark) {
        this.addWatermark(doc, watermark);
      }

      // Finalize PDF
      doc.end();

      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          resolve({
            filename,
            filepath,
            url: `/uploads/pdfs/${filename}`
          });
        });

        doc.on('error', reject);
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  async addHeader(doc, exam, variation, qrCodeDataURL, customHeader) {
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    
    // School/Institution name (if provided in custom header)
    if (customHeader?.institution) {
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text(customHeader.institution, { align: 'center' });
      doc.moveDown(0.5);
    }

    // Exam title
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text(exam.title, { align: 'center' });
    
    // Subject name (if available through association)
    if (exam.subject?.name) {
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Disciplina: ${exam.subject.name}`, { align: 'center' });
    }

    doc.moveDown(1);

    // Create a box for exam info and QR code
    const boxY = doc.y;
    const qrSize = 80;
    
    // Left side - Exam information
    doc.fontSize(10)
       .font('Helvetica');

    const leftInfo = [
      `Versão: ${variation.variationLetter}`,
      `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      `Total de Questões: ${variation.questions.length}`,
      exam.timeLimit ? `Tempo Limite: ${exam.timeLimit} minutos` : null,
      `Nota Mínima: ${exam.passingScore}%`
    ].filter(Boolean);

    leftInfo.forEach((info, index) => {
      doc.text(info, doc.page.margins.left, boxY + (index * 15));
    });

    // Right side - QR Code
    const qrX = pageWidth - qrSize + doc.page.margins.left;
    
    // Convert base64 QR code to buffer
    const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
    doc.image(qrBuffer, qrX, boxY, {
      width: qrSize,
      height: qrSize
    });

    // QR Code label
    doc.fontSize(8)
       .text('Código da Prova', qrX, boxY + qrSize + 5, {
         width: qrSize,
         align: 'center'
       });

    // Student information section
    doc.y = boxY + qrSize + 30;
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('DADOS DO ALUNO:', doc.page.margins.left);
    
    doc.moveDown(0.5);
    doc.font('Helvetica');
    
    const studentFields = [
      'Nome: ___________________________________________________________',
      'Matrícula: ___________________________ Turma: ___________________',
      'Data: _____________________ Assinatura: _________________________'
    ];

    studentFields.forEach(field => {
      doc.text(field);
      doc.moveDown(0.5);
    });

    // Separator line
    doc.moveDown(0.5);
    doc.strokeColor('#000000')
       .lineWidth(1)
       .moveTo(doc.page.margins.left, doc.y)
       .lineTo(pageWidth + doc.page.margins.left, doc.y)
       .stroke();
    
    doc.moveDown(1);
  }

  addInstructions(doc, instructions) {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('INSTRUÇÕES:', { underline: true });
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .font('Helvetica')
       .text(instructions, {
         align: 'justify',
         lineGap: 2
       });
    
    doc.moveDown(1);
  }

  async addQuestions(doc, questions, includeAnswerKey = false) {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('QUESTÕES:', { underline: true });
    
    doc.moveDown(1);

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const questionNumber = i + 1;

      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      // Question number and text
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text(`${questionNumber}. `, { continued: true })
         .font('Helvetica')
         .text(question.text, {
           align: 'justify',
           lineGap: 2
         });

      doc.moveDown(0.5);

      // Alternatives
      question.alternatives.forEach(alternative => {
        const prefix = includeAnswerKey && alternative.letter === question.correctAnswer 
          ? `● ${alternative.letter}) ` 
          : `${alternative.letter}) `;
        
        doc.fontSize(10)
           .font(includeAnswerKey && alternative.letter === question.correctAnswer ? 'Helvetica-Bold' : 'Helvetica')
           .text(prefix, { continued: true })
           .text(alternative.text, {
             align: 'justify',
             indent: 20,
             lineGap: 1
           });
        
        doc.moveDown(0.3);
      });

      // Answer space for students
      if (!includeAnswerKey) {
        doc.fontSize(10)
           .text(`Resposta: ____`, {
             align: 'right'
           });
      }

      doc.moveDown(1);

      // Add some spacing between questions
      if (i < questions.length - 1) {
        doc.moveDown(0.5);
      }
    }
  }

  addFooter(doc, exam, variation) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Footer line
      const footerY = doc.page.height - doc.page.margins.bottom + 10;
      doc.strokeColor('#CCCCCC')
         .lineWidth(0.5)
         .moveTo(doc.page.margins.left, footerY)
         .lineTo(doc.page.width - doc.page.margins.right, footerY)
         .stroke();

      // Footer text
      doc.fontSize(8)
         .fillColor('#666666')
         .text(
           `${exam.title} - Versão ${variation.variationLetter} | Página ${i + 1} de ${pageCount}`,
           doc.page.margins.left,
           footerY + 5,
           {
             width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
             align: 'center'
           }
         );
    }
  }

  addWatermark(doc, watermarkText) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      doc.save();
      doc.rotate(45, {
        origin: [doc.page.width / 2, doc.page.height / 2]
      });
      
      doc.fontSize(60)
         .fillColor('#EEEEEE')
         .text(watermarkText, 0, 0, {
           width: doc.page.width,
           height: doc.page.height,
           align: 'center',
           valign: 'center'
         });
      
      doc.restore();
    }
  }

  async generateAnswerKeyPDF(exam, variations) {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const filename = `answer_key_${exam.id}_${Date.now()}.pdf`;
      const filepath = path.join(this.uploadPaths.pdfs, filename);
      
      doc.pipe(fs.createWriteStream(filepath));

      // Header
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('GABARITO', { align: 'center' });
      
      doc.fontSize(14)
         .text(exam.title, { align: 'center' });
      
      doc.moveDown(2);

      // Answer key for each variation
      variations.forEach((variation, index) => {
        if (index > 0) doc.addPage();

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text(`Versão ${variation.variationLetter}`, { underline: true });
        
        doc.moveDown(1);

        // Create answer table
        const cols = 5;
        const questionsPerCol = Math.ceil(variation.questions.length / cols);
        
        doc.fontSize(10);
        
        for (let col = 0; col < cols; col++) {
          const startQuestion = col * questionsPerCol;
          const endQuestion = Math.min(startQuestion + questionsPerCol, variation.questions.length);
          
          const colX = doc.page.margins.left + (col * 100);
          let currentY = doc.y;
          
          for (let q = startQuestion; q < endQuestion; q++) {
            const questionNum = q + 1;
            const answer = variation.answerKey[q]?.correctAnswer || 'N/A';
            
            doc.text(`${questionNum.toString().padStart(2, '0')}. ${answer}`, colX, currentY);
            currentY += 15;
          }
        }
      });

      doc.end();

      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          resolve({
            filename,
            filepath,
            url: `/uploads/pdfs/${filename}`
          });
        });

        doc.on('error', reject);
      });

    } catch (error) {
      console.error('Error generating answer key PDF:', error);
      throw error;
    }
  }

  deleteFile(filepath) {
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting PDF file:', error);
      return false;
    }
  }
}

module.exports = new PDFService();