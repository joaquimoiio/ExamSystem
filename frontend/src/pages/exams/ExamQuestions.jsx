import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Save, Search, Filter,
  FileText, CheckCircle, AlertTriangle, BarChart3, X
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { LoadingPage } from '../../components/common/Loading';
import Loading from '../../components/common/Loading';
import apiService from '../../services/api';
import { ConfirmationModal } from '../../components/ui/Modal';

const difficultyConfig = {
  easy: { label: 'Fácil', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Médio', color: 'bg-yellow-100 text-yellow-800' },
  hard: { label: 'Difícil', color: 'bg-red-100 text-red-800' }
};

const typeConfig = {
  multiple_choice: { label: 'Múltipla Escolha', icon: CheckCircle },
  true_false: { label: 'Verdadeiro/Falso', icon: CheckCircle },
  essay: { label: 'Dissertativa', icon: FileText }
};

export default function ExamQuestions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  // States
  const [exam, setExam] = useState(null);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [questionToRemove, setQuestionToRemove] = useState(null);
  const [subjects, setSubjects] = useState([]);

  // Load data
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load exam details
      const examResponse = await apiService.getExamById(id);
      console.log('🔍 Exam Response:', examResponse);
      const exam = examResponse.data.exam;
      console.log('🔍 Exam Data:', exam);
      console.log('🔍 Exam Questions:', exam.questions);
      setExam(exam);
      
      // Load exam questions
      if (exam.questions && exam.questions.length > 0) {
        console.log('✅ Carregando questões selecionadas:', exam.questions.length);
        const mappedQuestions = exam.questions.map((q, index) => {
          console.log('📝 Questão:', q);
          console.log('📝 ExamQuestion data:', q.ExamQuestion);
          return {
            ...q,
            questionOrder: q.ExamQuestion?.questionOrder || index + 1,
            points: q.ExamQuestion?.points || q.points || 1
          };
        });
        console.log('✅ Questões mapeadas:', mappedQuestions);
        setSelectedQuestions(mappedQuestions);
      } else {
        console.log('❌ Nenhuma questão encontrada para esta prova');
      }

      // Load available questions (from all subjects)
      const questionsResponse = await apiService.getQuestions();
      setAvailableQuestions(questionsResponse.data.questions || []);

      // Load subjects
      const subjectsResponse = await apiService.getSubjects();
      setSubjects(subjectsResponse.data.subjects || []);

    } catch (error) {
      console.error('Error loading data:', error);
      showError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Filter available questions
  const filteredQuestions = availableQuestions.filter(q => {
    // Exclude already selected questions
    if (selectedQuestions.find(sq => sq.id === q.id)) return false;
    
    // Apply filters
    if (searchTerm && !q.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !q.text.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (filterSubject && q.subjectId !== filterSubject) return false;
    if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
    
    return true;
  });

  // Add question to exam
  const addQuestion = (question) => {
    const newQuestion = {
      ...question,
      questionOrder: selectedQuestions.length + 1,
      points: question.points || 1
    };
    setSelectedQuestions([...selectedQuestions, newQuestion]);
    success(`Questão "${question.title}" adicionada`);
  };

  // Remove question from exam
  const removeQuestion = (questionId) => {
    setSelectedQuestions(prev => 
      prev.filter(q => q.id !== questionId)
        .map((q, index) => ({ ...q, questionOrder: index + 1 }))
    );
    setQuestionToRemove(null);
    setShowConfirmModal(false);
    success('Questão removida da prova');
  };

  // Update question points
  const updateQuestionPoints = (questionId, points) => {
    setSelectedQuestions(prev =>
      prev.map(q => q.id === questionId ? { ...q, points: parseFloat(points) || 1 } : q)
    );
  };

  // Move question up/down
  const moveQuestion = (index, direction) => {
    const newQuestions = [...selectedQuestions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newQuestions.length) {
      [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
      
      // Update order numbers
      newQuestions.forEach((q, i) => {
        q.questionOrder = i + 1;
      });
      
      setSelectedQuestions(newQuestions);
    }
  };

  // Save questions to exam
  const saveQuestions = async () => {
    try {
      setSaving(true);
      
      const questionData = selectedQuestions.map(q => ({
        questionId: q.id,
        questionOrder: q.questionOrder,
        points: q.points
      }));

      await apiService.updateExamQuestions(id, { questions: questionData });
      
      success('Questões da prova atualizadas com sucesso');
      navigate(`/exams/${id}`);
      
    } catch (error) {
      console.error('Error saving questions:', error);
      showError('Erro ao salvar questões da prova');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingPage />;

  const totalPoints = selectedQuestions.reduce((sum, q) => sum + (q.points || 1), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/exams/${id}`)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gerenciar Questões
            </h1>
            <p className="text-gray-600">
              {exam?.title}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            {selectedQuestions.length} questões • {totalPoints} pontos
          </div>
          <button
            onClick={saveQuestions}
            disabled={saving || selectedQuestions.length === 0}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loading size="small" showText={false} className="mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Salvando...' : 'Salvar Questões'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Questions */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Questões Disponíveis
            </h2>
            
            {/* Filters */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar questões..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Todas as disciplinas</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Todas as dificuldades</option>
                  <option value="easy">Fácil</option>
                  <option value="medium">Médio</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>
            </div>
          </div>

          {/* Available Questions List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map(question => {
                const TypeIcon = typeConfig[question.type]?.icon || FileText;
                
                return (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyConfig[question.difficulty]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {difficultyConfig[question.difficulty]?.label || 'N/A'}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {question.points || 1} pts
                        </span>
                      </div>
                      <button
                        onClick={() => addQuestion(question)}
                        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                        title="Adicionar à prova"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <h3 className="font-medium text-gray-900 text-sm mb-1">
                      {question.title || 'Sem título'}
                    </h3>
                    <p className="text-gray-600 text-xs line-clamp-2">
                      {question.text || 'Texto não disponível'}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className="flex items-center">
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {typeConfig[question.type]?.label || 'N/A'}
                        </span>
                        {question.alternatives && (
                          <span>{question.alternatives.length} alternativas</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {searchTerm || filterSubject || filterDifficulty
                    ? 'Nenhuma questão encontrada com os filtros aplicados'
                    : 'Nenhuma questão disponível'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Questions */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Questões da Prova ({selectedQuestions.length})
          </h2>

          {selectedQuestions.length > 0 ? (
            <div className="space-y-3">
              {selectedQuestions.map((question, index) => {
                const TypeIcon = typeConfig[question.type]?.icon || FileText;
                
                return (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          #{question.questionOrder}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyConfig[question.difficulty]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {difficultyConfig[question.difficulty]?.label || 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => moveQuestion(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                            title="Mover para cima"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveQuestion(index, 'down')}
                            disabled={index === selectedQuestions.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                            title="Mover para baixo"
                          >
                            ↓
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setQuestionToRemove(question.id);
                            setShowConfirmModal(true);
                          }}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors ml-2"
                          title="Remover da prova"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-gray-900 text-sm mb-1">
                      {question.title || 'Sem título'}
                    </h3>
                    <p className="text-gray-600 text-xs line-clamp-2 mb-3">
                      {question.text || 'Texto não disponível'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className="flex items-center">
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {typeConfig[question.type]?.label || 'N/A'}
                        </span>
                        {question.alternatives && (
                          <span>{question.alternatives.length} alternativas</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <label className="text-xs text-gray-600">Pontos:</label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={question.points}
                          onChange={(e) => updateQuestionPoints(question.id, e.target.value)}
                          className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma questão selecionada</h3>
              <p className="text-gray-500 text-sm">
                Selecione questões da lista ao lado para adicionar à prova.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => removeQuestion(questionToRemove)}
        title="Remover Questão"
        message="Tem certeza que deseja remover esta questão da prova?"
        confirmButtonText="Remover"
        type="danger"
      />
    </div>
  );
}