const nodemailer = require('nodemailer');
const { AppError } = require('../utils/appError');

/**
 * Email Service for sending notifications and reports
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }

  /**
   * Test email connection
   */
  async testConnection() {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options) {
    if (!this.transporter) {
      throw new AppError('Email service not configured', 500);
    }

    const { to, subject, text, html, attachments } = options;

    const mailOptions = {
      from: `"Exam System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully'
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new AppError('Failed to send email', 500);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email, resetToken, userName) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>You requested a password reset for your Exam System account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><strong>This link will expire in 10 minutes.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          This is an automated message from Exam System. Please do not reply to this email.
        </p>
      </div>
    `;

    const text = `
      Password Reset Request
      
      Hello ${userName},
      
      You requested a password reset for your Exam System account.
      
      Please visit the following link to reset your password:
      ${resetUrl}
      
      This link will expire in 10 minutes.
      
      If you didn't request this password reset, please ignore this email.
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Password Reset - Exam System',
      text,
      html
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email, userName) {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Exam System!</h2>
        <p>Hello ${userName},</p>
        <p>Welcome to the Exam System! Your account has been created successfully.</p>
        <p>You can now:</p>
        <ul>
          <li>Create and manage subjects</li>
          <li>Build question banks</li>
          <li>Create and publish exams</li>
          <li>Track student performance</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" 
             style="background-color: #28a745; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Login Now
          </a>
        </div>
        <p>If you have any questions, feel free to contact our support team.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          This is an automated message from Exam System.
        </p>
      </div>
    `;

    const text = `
      Welcome to Exam System!
      
      Hello ${userName},
      
      Welcome to the Exam System! Your account has been created successfully.
      
      You can now:
      - Create and manage subjects
      - Build question banks
      - Create and publish exams
      - Track student performance
      
      Visit ${loginUrl} to get started.
      
      If you have any questions, feel free to contact our support team.
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to Exam System!',
      text,
      html
    });
  }

  /**
   * Send exam published notification
   */
  async sendExamPublishedNotification(email, userName, examTitle, accessCode) {
    const examUrl = `${process.env.FRONTEND_URL}/exam/access/${accessCode}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Exam Published Successfully!</h2>
        <p>Hello ${userName},</p>
        <p>Your exam <strong>"${examTitle}"</strong> has been published successfully!</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Exam Details:</h3>
          <p><strong>Exam Title:</strong> ${examTitle}</p>
          <p><strong>Access Code:</strong> <code style="background-color: #e9ecef; padding: 2px 6px; border-radius: 3px;">${accessCode}</code></p>
          <p><strong>Exam URL:</strong> <a href="${examUrl}">${examUrl}</a></p>
        </div>
        <p>Students can now access your exam using the access code or direct URL.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${examUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            View Exam
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          This is an automated notification from Exam System.
        </p>
      </div>
    `;

    const text = `
      Exam Published Successfully!
      
      Hello ${userName},
      
      Your exam "${examTitle}" has been published successfully!
      
      Exam Details:
      - Exam Title: ${examTitle}
      - Access Code: ${accessCode}
      - Exam URL: ${examUrl}
      
      Students can now access your exam using the access code or direct URL.
    `;

    return await this.sendEmail({
      to: email,
      subject: `Exam Published: ${examTitle}`,
      text,
      html
    });
  }

  /**
   * Send exam results summary
   */
  async sendExamResultsSummary(email, userName, examTitle, stats) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Exam Results Summary</h2>
        <p>Hello ${userName},</p>
        <p>Here's a summary of results for your exam <strong>"${examTitle}"</strong>:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Statistics:</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p><strong>Total Submissions:</strong> ${stats.totalSubmissions}</p>
              <p><strong>Average Score:</strong> ${stats.averageScore}</p>
            </div>
            <div>
              <p><strong>Passed:</strong> ${stats.passedCount} (${stats.passRate}%)</p>
              <p><strong>Failed:</strong> ${stats.failedCount}</p>
            </div>
          </div>
        </div>
        
        <p>You can view detailed results and analytics in your dashboard.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background-color: #28a745; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            View Dashboard
          </a>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          This is an automated summary from Exam System.
        </p>
      </div>
    `;

    const text = `
      Exam Results Summary
      
      Hello ${userName},
      
      Here's a summary of results for your exam "${examTitle}":
      
      Statistics:
      - Total Submissions: ${stats.totalSubmissions}
      - Average Score: ${stats.averageScore}
      - Passed: ${stats.passedCount} (${stats.passRate}%)
      - Failed: ${stats.failedCount}
      
      You can view detailed results and analytics in your dashboard.
    `;

    return await this.sendEmail({
      to: email,
      subject: `Results Summary: ${examTitle}`,
      text,
      html
    });
  }

  /**
   * Send bulk email (for notifications to multiple users)
   */
  async sendBulkEmail(recipients, subject, message) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.sendEmail({
          to: recipient.email,
          subject,
          text: message,
          html: message.replace(/\n/g, '<br>')
        });
        
        results.push({
          email: recipient.email,
          status: 'sent',
          messageId: result.messageId
        });
      } catch (error) {
        results.push({
          email: recipient.email,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Send email with attachment
   */
  async sendEmailWithAttachment(options) {
    const { to, subject, text, html, attachmentPath, attachmentName } = options;
    
    const attachments = attachmentPath ? [{
      filename: attachmentName || 'attachment',
      path: attachmentPath
    }] : [];

    return await this.sendEmail({
      to,
      subject,
      text,
      html,
      attachments
    });
  }
}

module.exports = new EmailService();