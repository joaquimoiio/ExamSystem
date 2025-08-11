import React, { createContext, useContext, useReducer } from 'react'
import { toast } from 'react-toastify'

const ExamContext = createContext()

const initialState = {
  currentExam: null,
  examVariation: null,
  studentAnswers: [],
  timeStarted: null,
  timeRemaining: null,
  isSubmitting: false,
  submissionResult: null
}

const examReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CURRENT_EXAM':
      return {
        ...state,
        currentExam: action.payload.exam,
        examVariation: action.payload.variation,
        studentAnswers: new Array(action.payload.exam.totalQuestions).fill(null),
        timeStarted: new Date(),
        timeRemaining: action.payload.exam.timeLimit ? action.payload.exam.timeLimit * 60 : null
      }
    case 'UPDATE_ANSWER':
      const newAnswers = [...state.studentAnswers]
      newAnswers[action.payload.questionIndex] = action.payload.answer
      return {
        ...state,
        studentAnswers: newAnswers
      }
    case 'UPDATE_TIME_REMAINING':
      return {
        ...state,
        timeRemaining: action.payload
      }
    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload
      }
    case 'SET_SUBMISSION_RESULT':
      return {
        ...state,
        submissionResult: action.payload,
        isSubmitting: false
      }
    case 'RESET_EXAM':
      return initialState
    default:
      return state
  }
}

export const ExamProvider = ({ children }) => {
  const [state, dispatch] = useReducer(examReducer, initialState)

  const setCurrentExam = (examData) => {
    dispatch({
      type: 'SET_CURRENT_EXAM',
      payload: examData
    })
  }

  const updateAnswer = (questionIndex, answer) => {
    dispatch({
      type: 'UPDATE_ANSWER',
      payload: { questionIndex, answer }
    })
  }

  const updateTimeRemaining = (timeRemaining) => {
    dispatch({
      type: 'UPDATE_TIME_REMAINING',
      payload: timeRemaining
    })
  }

  const setSubmitting = (isSubmitting) => {
    dispatch({
      type: 'SET_SUBMITTING',
      payload: isSubmitting
    })
  }

  const setSubmissionResult = (result) => {
    dispatch({
      type: 'SET_SUBMISSION_RESULT',
      payload: result
    })
  }

  const resetExam = () => {
    dispatch({ type: 'RESET_EXAM' })
  }

  const getAnsweredQuestions = () => {
    return state.studentAnswers.filter(answer => answer !== null).length
  }

  const getUnansweredQuestions = () => {
    return state.studentAnswers.filter(answer => answer === null).length
  }

  const getTimeSpent = () => {
    if (!state.timeStarted) return 0
    return Math.floor((new Date() - state.timeStarted) / 1000)
  }

  const isTimeUp = () => {
    return state.timeRemaining !== null && state.timeRemaining <= 0
  }

  const canSubmit = () => {
    return getAnsweredQuestions() > 0 && !state.isSubmitting
  }

  const formatTimeRemaining = () => {
    if (state.timeRemaining === null) return null
    
    const hours = Math.floor(state.timeRemaining / 3600)
    const minutes = Math.floor((state.timeRemaining % 3600) / 60)
    const seconds = state.timeRemaining % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getCompletionPercentage = () => {
    if (!state.currentExam) return 0
    return Math.round((getAnsweredQuestions() / state.currentExam.totalQuestions) * 100)
  }

  const value = {
    ...state,
    setCurrentExam,
    updateAnswer,
    updateTimeRemaining,
    setSubmitting,
    setSubmissionResult,
    resetExam,
    getAnsweredQuestions,
    getUnansweredQuestions,
    getTimeSpent,
    isTimeUp,
    canSubmit,
    formatTimeRemaining,
    getCompletionPercentage
  }

  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  )
}

export const useExamContext = () => {
  const context = useContext(ExamContext)
  if (!context) {
    throw new Error('useExamContext must be used within an ExamProvider')
  }
  return context
}