# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Exam System** - a full-stack web application for creating, managing, and correcting online exams with multiple variations. The system generates unique exam variations with intelligent question distribution and provides automatic grading.

## Architecture

### Full-Stack Structure
- **Backend**: Node.js + Express.js REST API (`/backend`)
- **Frontend**: React 18 + Vite SPA (`/frontend`)
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT-based with refresh tokens

### Key Backend Components
- **Models**: Sequelize ORM models in `/backend/src/models/`
  - Users (Admin/Professor roles)
  - Subjects, Questions (with difficulty levels)
  - Exams, ExamVariations, ExamQuestions (N:N)
  - Answers (student submissions)
- **Services**: Core business logic in `/backend/src/services/`
  - `pdfService.js`: PDF generation with PDFKit
  - `emailService.js`: Nodemailer email functionality
- **Controllers**: RESTful API endpoints following MVC pattern
- **Smart Exam Generation**: Algorithm distributes questions by difficulty (Easy/Medium/Hard) across multiple variations

### Key Frontend Components  
- **React Router**: SPA routing with protected routes
- **TanStack Query**: Server state management and caching
- **Tailwind CSS**: Utility-first styling
- **Context API**: Auth and Toast contexts
- **Responsive Design**: Mobile-optimized interface

## Development Commands

### Backend (Node.js + Express)
```bash
cd backend
npm install                    # Install dependencies
npm run dev                    # Development with nodemon (auto-sync DB)
npm start                      # Production server
npm test                       # Run Jest tests
npm run db:create              # Create PostgreSQL database
npm run db:migrate             # Run Sequelize migrations
npm run db:seed                # Seed database with sample data
npm run db:reset               # Drop, recreate, migrate, and seed DB
npm run db:generate-setup      # Generate setup-database.sql from models
```

### Frontend (React + Vite)
```bash
cd frontend  
npm install                    # Install dependencies
npm run dev                    # Development server (port 3000)
npm run build                  # Production build
npm run preview                # Preview production build
npm run lint                   # ESLint code checking
npm run format                 # Prettier code formatting
npm serve                      # Serve built files
```

## Key Features & Workflows

### Exam Creation & Variation Generation
- Professors create exams by selecting questions from subject question banks
- System automatically generates multiple variations (up to 50) using Fisher-Yates shuffle
- Each variation maintains question difficulty distribution
- PDF generation creates printable exams

### Student Workflow
- Students access exams through the web interface
- Responsive UI for answer submission
- Immediate feedback with scores and statistics after submission

### Correction System  
- Automatic grading based on correct answers stored in database
- Statistical analysis of performance across variations and difficulty levels
- Export capabilities for grades and analytics

## Database Configuration

The system requires PostgreSQL. Key environment variables:
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`
- `FRONTEND_URL` (for CORS)

### Database Setup & Synchronization

**Development Mode (Automatic Sync):**
- Backend automatically syncs database schema when `NODE_ENV !== 'production'`
- Uses `sequelize.sync({ alter: true })` to update tables without data loss
- Always run `npm run db:generate-setup` after model changes to update setup-database.sql

**Production Mode (Manual Setup):**
- Use `setup-database.sql` for initial database creation
- No automatic schema changes in production
- Manual migrations required for schema updates

**Workflow for Database Changes:**
1. Modify Sequelize models in `/backend/src/models/`
2. Test changes with `npm run dev` (auto-sync in development)
3. Run `npm run db:generate-setup` to update setup-database.sql
4. Commit both model changes AND updated setup-database.sql
5. For production: Apply setup-database.sql manually

## File Upload System

Uses Multer middleware for handling:
- User avatars (`/backend/src/uploads/avatars/`)
- Question images (`/backend/src/uploads/images/`)
- Document uploads (`/backend/src/uploads/documents/`)

## Development Notes

### Backend Patterns
- Express.js middleware chain with auth, validation, error handling
- Joi validation for request data
- Winston logging to files and console in development
- Rate limiting and security headers (Helmet, CORS)

### Frontend Patterns  
- Component composition with reusable UI components in `/src/components/ui/`
- Form handling with React Hook Form
- API integration through centralized service layer (`/src/services/`)
- Responsive design with Tailwind breakpoints

### Testing
- Backend: Jest with Supertest for API testing
- Frontend: Component testing (no specific framework configured yet)

## API Structure

RESTful API with base path `/api`:
- `/auth` - Authentication (login, register, profile)  
- `/subjects` - Subject CRUD operations
- `/questions` - Question bank management
- `/exams` - Exam creation and variation generation
- `/corrections` - Grade submission and statistics

## Production Considerations

- Backend serves on port 5000, Frontend on port 3000
- Database migrations must be run in production
- Environment variables required for email, JWT, and DB configuration
- Static file serving for uploaded content
- Winston logging configured for production monitoring