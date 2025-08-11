const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    this.fromEmail = process.env.EMAIL_USER || 'noreply@examsystem.com';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: `"Sistema de Provas" <${this.fromEmail}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinir Senha - Sistema de Provas</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Sistema de Provas Online</h1>
          </div>
          <div class="content">
            <h2>Olá, ${user.name}!</h2>
            <p>Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma nova senha:</p>
            <a href="${resetUrl}" class="button">Redefinir Senha</a>
            <p>Se você não conseguir clicar no botão, copie e cole este link no seu navegador:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p><strong>Este link expira em 1 hora.</strong></p>
            <p>Se você não solicitou esta redefinição, ignore este email.</p>
          </div>
          <div class="footer">
            <p>Sistema de Provas Online | Não responda este email</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(
      user.email,
      'Redefinir Senha - Sistema de Provas',
      html
    );
  }

  async sendWelcomeEmail(user, temporaryPassword = null) {
    const loginUrl = `${this.frontendUrl}/login`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo - Sistema de Provas</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .credentials { background: #EFF6FF; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bem-vindo ao Sistema de Provas!</h1>
          </div>
          <div class="content">
            <h2>Olá, ${user.name}!</h2>
            <p>Sua conta foi criada com sucesso no Sistema de Provas Online.</p>
            
            ${temporaryPassword ? `
            <div class="credentials">
              <h3>Suas credenciais de acesso:</h3>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Senha temporária:</strong> ${temporaryPassword}</p>
              <p><em>Por favor, altere sua senha no primeiro acesso.</em></p>
            </div>
            ` : ''}
            
            <p>Agora você pode:</p>
            <ul>
              <li>Criar e gerenciar disciplinas</li>
              <li>Cadastrar questões com diferentes níveis de dificuldade</li>
              <li>Gerar provas com múltiplas variações</li>
              <li>Corrigir provas automaticamente via QR Code</li>
              <li>Acompanhar estatísticas de desempenho</li>
            </ul>
            
            <a href="${loginUrl}" class="button">Acessar Sistema</a>
          </div>
          <div class="footer">
            <p>Sistema de Provas Online | Não responda este email</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(
      user.email,
      'Bem-vindo ao Sistema de Provas Online',
      html
    );
  }

  async sendExamNotificationEmail(teacher, exam, type = 'created') {
    let subject, content;
    
    switch (type) {
      case 'published':
        subject = `Prova "${exam.title}" foi publicada`;
        content = `
          <h2>Prova Publicada</h2>
          <p>A prova "${exam.title}" foi publicada com sucesso e está disponível para os alunos.</p>
          <p><strong>Detalhes:</strong></p>
          <ul>
            <li>Total de questões: ${exam.totalQuestions}</li>
            <li>Variações geradas: ${exam.totalVariations}</li>
            <li>Nota mínima: ${exam.passingScore}%</li>
            ${exam.expiresAt ? `<li>Expira em: ${new Date(exam.expiresAt).toLocaleString('pt-BR')}</li>` : ''}
          </ul>
        `;
        break;
      
      default:
        subject = `Nova prova "${exam.title}" foi criada`;
        content = `
          <h2>Nova Prova Criada</h2>
          <p>A prova "${exam.title}" foi criada com sucesso.</p>
          <p>Lembre-se de publicá-la quando estiver pronta para disponibilizar aos alunos.</p>
        `;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Sistema de Provas Online</h1>
          </div>
          <div class="content">
            <h2>Olá, ${teacher.name}!</h2>
            ${content}
            <a href="${this.frontendUrl}/exams/${exam.id}" class="button">Ver Prova</a>
          </div>
          <div class="footer">
            <p>Sistema de Provas Online | Não responda este email</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(teacher.email, subject, html);
  }

  async sendSubmissionNotificationEmail(teacher, submission, exam) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nova Submissão - ${exam.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .score { font-size: 24px; font-weight: bold; color: ${submission.isPassed ? '#10B981' : '#EF4444'}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nova Submissão Recebida</h1>
          </div>
          <div class="content">
            <h2>Olá, ${teacher.name}!</h2>
            <p>Uma nova submissão foi recebida para a prova "${exam.title}".</p>
            
            <h3>Detalhes da Submissão:</h3>
            <ul>
              <li><strong>Aluno:</strong> ${submission.studentName}</li>
              ${submission.studentId ? `<li><strong>Matrícula:</strong> ${submission.studentId}</li>` : ''}
              <li><strong>Nota:</strong> <span class="score">${submission.score.toFixed(1)}%</span></li>
              <li><strong>Acertos:</strong> ${submission.correctAnswers}/${submission.totalQuestions}</li>
              <li><strong>Status:</strong> ${submission.isPassed ? 'Aprovado' : 'Reprovado'}</li>
              <li><strong>Submetido em:</strong> ${new Date(submission.submittedAt).toLocaleString('pt-BR')}</li>
            </ul>
            
            <a href="${this.frontendUrl}/exams/${exam.id}/submissions" class="button">Ver Todas as Submissões</a>
          </div>
          <div class="footer">
            <p>Sistema de Provas Online | Não responda este email</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(
      teacher.email,
      `Nova Submissão - ${exam.title}`,
      html
    );
  }

  async sendBulkEmail(recipients, subject, html) {
    const promises = recipients.map(email => 
      this.sendEmail(email, subject, html)
    );
    
    try {
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      return {
        sent: successful,
        failed: failed,
        total: recipients.length
      };
    } catch (error) {
      console.error('Error in bulk email sending:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();