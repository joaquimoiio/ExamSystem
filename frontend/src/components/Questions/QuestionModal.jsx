import React, { useState } from 'react'
import Modal, { ConfirmationModal } from '../Common/Modal'
import Button from '../Common/Button'

const ALTERNATIVE_LETTERS = ['A', 'B', 'C', 'D', 'E']

const QuestionModal = ({
  question,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleActive,
  deleteLoading = false
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  if (!question) return null

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'Fácil'
      case 'medium':
        return 'Médio'
      case 'hard':
        return 'Difícil'
      default: