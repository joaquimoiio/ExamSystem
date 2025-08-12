import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { useExamContext } from '../context/ExamContext'
import { examService } from '../services/exam'
import AnswerForm from '../components/Correction/AnswerForm'
import CorrectionSummary from '../components/Correction/CorrectionSummary'
import Results from '../components/Correction/Results'
import QRScanner, { QRScannerButton } from '../components/Correction/QRScanner'
import Button from '../components/Common/Button'
import Loading from '../components/Common/Loading'
import { showOperationToast } from '../components/Common/Toast'

const CorrectionPage = () => {
  const { examId, variationId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [currentStep, setCurrentStep] = useState('loading') // loading, form, submitting, results
  const [studentData, setStudentData] = useState({
    name: '',
    email: '',
    studentId: ''
  })
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [showQRScanner, setShowQRScanner] = useState(false)

  const { useApiQuery, useApiMutation } = useApi()
  const {
    currentExam,
    examVariation,
    studentAnswers,
    setCurrentExam,
    updateAnswer,
    resetExam,
    formatTimeRemaining,
    getCompletionPercentage,
    canSubmit
  } = useExamContext()

  // Check if this is a QR code scan access
  const isQRAccess = searchParams.has('qr') || window.location.pathname.includes('/scan/')
  const submissionId = searchParams.get('submission')

  // Fetch exam data
  const { data: examData, isLoading: examLoading, error: examError } = useApiQuery(
    ['public-exam', examId, variationId],
    () => examService.getPublicExam(examId, variationId),
    {
      enabled: !!examId,
      retry: 1
    }
  )

  // Fetch submission result if submission ID is provided
  const { data: submissionData, isLoading: submissionLoading } = useApiQuery(
    ['submission-result', submissionId],
    () => examService.getSubmissionResult(submissionId),
    {
      enabled: !!submissionId,
      retry: 1
    }
  )

  // Submit answers mutation
  const submitAnswersMutation = useApiMutation(
    (submissionData) => examService.submitExamAnswers(examId, submissionData),
    {
      onSuccess: (response) => {
        setSubmissionResult(response.data)
        setCurrentStep('results')
        showOperationToast.submitted()
      },
      onError: (error) => {
        setCurrentStep('form')
        showOperationToast.error('Erro ao enviar respostas')
      }
    }
  )

  // Load exam data into context
  useEffect(() => {
    if (examData?.data) {
      const exam = examData.data.exam
      const variation = examData.data.variation || null
      
      setCurrentExam({
        exam,
        variation
      })
      
      setCurrentStep('form')
      
      // Set up timer if exam has time limit
      if (exam.timeLimit) {
        setTimeRemaining(exam.timeLimit * 60) // Convert minutes to seconds
      }
    }
  }, [examData, setCurrentExam])

  // Handle submission results
  useEffect(() => {
    if (submissionData?.data) {
      setSubmissionResult(submissionData.data)
      setCurrentStep('results')
    }
  }, [submissionData])

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || currentStep !== 'form') return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - auto submit
          handleSubmitAnswers()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, currentStep])

  const handleAnswerChange = (answers) => {
    // Update answers in context
    answers.forEach((answer, index) => {
      if (answer !== studentAnswers[index]) {
        updateAnswer(index, answer)
      }
    })
  }

  const handleSubmitAnswers = async () => {
    if (!canSubmit()) {
      showOperationToast.warning('Responda pelo menos uma questão antes de enviar')
      return
    }

    setCurrentStep('submitting')

    const submissionData = {
      examId,
      variationId,
      answers: studentAnswers.map((answer, questionIndex) => ({
        questionIndex,
        selectedAlternative: answer,
        answeredAt: new Date().toISOString()
      })),
      studentData,
      timeSpent: currentExam?.timeLimit ? 
        (currentExam.timeLimit * 60) - (timeRemaining || 0) : null,
      submittedAt: new Date().toISOString()
    }

    submitAnswersMutation.mutate(submissionData)
  }

  const handleRetakeExam = () => {
    resetExam()
    setCurrentStep('form')
    setSubmissionResult(null)
    
    // Reset timer
    if (currentExam?.timeLimit) {
      setTimeRemaining(currentExam.timeLimit * 60)
    }
  }

  const handleQRScanSuccess = (scannedText) => {
    try {
      // Parse QR code data
      const qrData = JSON.parse(scannedText)
      
      if (qrData.examId && qrData.variationId) {
        // Navigate to the exam from QR code
        navigate(`/correction/${qrData.examId}/${qrData.variationId}?qr=true`)
      } else if (qrData.submissionId) {
        // Navigate to submission results
        navigate(`/correction/${examId}/${variationId}?submission=${qrData.submissionId}`)
      } else {
        showOperationToast.error('QR Code inválido')
      }
    } catch (error) {
      // Try direct URL parsing
      if (scannedText.includes('/correction/')) {
        window.location.href = scannedText
      } else {
        showOperationToast.error('QR Code não reconhecido')
      }
    }
    setShowQRScanner(false)
  }

  const handleShareResult = () => {
    if (submissionResult?.shareUrl) {
      navigator.clipboard.writeText(submissionResult.shareUrl)
      showOperationToast.copied()
    } else {
      showOperationToast.info('Link de compartilhamento não disponível')
    }
  }

  const handleViewCorrection = () => {
    // Show detailed correction
    setCurrentStep('correction')
  }

  // Loading state
  if (examLoading || submissionLoading || currentStep === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading message="Carregando prova..." />
      </div>
    )
  }

  // Error state
  if (examError && !currentExam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Prova não encontrada
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            A prova que você está tentando acessar não existe ou não está mais disponível.
          </p>
          <div className="space-y-3">
            <QRScannerButton
              onScanSuccess={handleQRScanSuccess}
              buttonText="Escanear QR Code"
              buttonVariant="primary"
              className="w-full"
            />
            <Button
              variant="secondary"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // No exam ID provided - show QR scanner
  if (!examId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 4h5v5H4V4zm11 11h5v5h-5v-5zM4 15h5v5H4v-5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Acesso à Prova
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Escaneie o QR Code fornecido pelo professor para acessar a prova.
          </p>
          <QRScannerButton
            onScanSuccess={handleQRScanSuccess}
            buttonText="Escanear QR Code"
            buttonVariant="primary"
            className="w-full"
          />
        </div>
      </div>
    )
  }

  // Student info form (for first time access)
  if (currentStep === 'form' && !studentData.name && !isQRAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {currentExam?.title}
            </h3>
            <p className="text-sm text-gray-500">
              Preencha seus dados para iniciar a prova
            </p>
          </div>
          
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              setStudentData({
                name: formData.get('name'),
                email: formData.get('email'),
                studentId: formData.get('studentId')
              })
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                name="name"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Seu nome completo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="seu@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matrícula/ID
              </label>
              <input
                type="text"
                name="studentId"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Número de matrícula"
              />
            </div>
            
            <Button
              type="submit"
              variant="primary"
              className="w-full"
            >
              Iniciar Prova
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // Render based on current step
  switch (currentStep) {
    case 'form':
      return (
        <div className="min-h-screen bg-gray-50">
          {/* Timer */}
          {timeRemaining !== null && (
            <div className="fixed top-4 right-4 z-50">
              <div className={`bg-white rounded-lg shadow-lg p-3 border-l-4 ${
                timeRemaining < 300 ? 'border-red-500' : 
                timeRemaining < 900 ? 'border-yellow-500' : 'border-green-500'
              }`}>
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`font-mono text-lg font-bold ${
                    timeRemaining < 300 ? 'text-red-600' : 
                    timeRemaining < 900 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {formatTimeRemaining()}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Tempo restante
                </div>
              </div>
            </div>
          )}

          <AnswerForm
            exam={currentExam}
            examVariation={examVariation}
            onSubmit={handleSubmitAnswers}
            onAnswerChange={handleAnswerChange}
            initialAnswers={studentAnswers}
            timeRemaining={timeRemaining}
            isSubmitting={submitAnswersMutation.isLoading}
          />
        </div>
      )

    case 'submitting':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Enviando respostas...
            </h3>
            <p className="text-sm text-gray-500">
              Aguarde enquanto processamos suas respostas
            </p>
          </div>
        </div>
      )

    case 'results':
      return (
        <div className="min-h-screen bg-gray-50 py-8">
          <Results
            exam={currentExam}
            submission={submissionResult}
            onRetakeExam={currentExam?.allowRetake ? handleRetakeExam : undefined}
            onViewCorrection={handleViewCorrection}
            onShareResult={handleShareResult}
          />
        </div>
      )

    case 'correction':
      return (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="mb-6">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep('results')}
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                }
              >
                Voltar aos Resultados
              </Button>
            </div>
            
            <CorrectionSummary
              exam={currentExam}
              submission={submissionResult}
              showCorrectAnswers={true}
              showExplanations={true}
            />
          </div>
        </div>
      )

    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loading />
        </div>
      )
  }
}

export default CorrectionPage