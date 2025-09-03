import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, School, BookOpen, Calendar, Clock, FileText, Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import apiService from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Loading from '../../components/common/Loading';

export default function ExamHeaderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    schoolName: '',
    subjectName: '',
    year: new Date().getFullYear(),
    evaluationCriteria: '',
    instructions: '',
    timeLimit: '',
    isDefault: false
  });

  // Fetch header data if editing
  const { data: headerData, isLoading } = useQuery({
    queryKey: ['examHeader', id],
    queryFn: () => apiService.get(`/exam-headers/${id}`),
    enabled: isEdit
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEdit) {
        return apiService.put(`/exam-headers/${id}`, data);
      }
      return apiService.post('/exam-headers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examHeaders'] });
      success(isEdit ? 'Cabeçalho atualizado com sucesso' : 'Cabeçalho criado com sucesso');
      navigate('/exam-headers');
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Erro ao salvar cabeçalho');
    }
  });

  // Populate form when editing
  useEffect(() => {
    if (headerData?.data?.header) {
      const header = headerData.data.header;
      setFormData({
        schoolName: header.schoolName || '',
        subjectName: header.subjectName || '',
        year: header.year || new Date().getFullYear(),
        evaluationCriteria: header.evaluationCriteria || '',
        instructions: header.instructions || '',
        timeLimit: header.timeLimit || '',
        isDefault: header.isDefault || false
      });
    }
  }, [headerData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.schoolName.trim()) {
      error('Nome da escola é obrigatório');
      return;
    }
    if (!formData.subjectName.trim()) {
      error('Nome da matéria é obrigatório');
      return;
    }
    if (!formData.year) {
      error('Ano é obrigatório');
      return;
    }

    // Prepare data
    const submitData = {
      ...formData,
      timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null
    };

    mutation.mutate(submitData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (isEdit && isLoading) {
    return <Loading />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/exam-headers')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Editar Cabeçalho' : 'Novo Cabeçalho'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Altere as informações do cabeçalho' : 'Crie um novo cabeçalho para suas provas'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* School Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <School className="w-4 h-4 inline mr-1" />
                Nome da Escola *
              </label>
              <Input
                name="schoolName"
                value={formData.schoolName}
                onChange={handleChange}
                placeholder="Ex: Escola Estadual Dom Pedro II"
                required
              />
            </div>

            {/* Subject Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <BookOpen className="w-4 h-4 inline mr-1" />
                Nome da Matéria *
              </label>
              <Input
                name="subjectName"
                value={formData.subjectName}
                onChange={handleChange}
                placeholder="Ex: Matemática, História, etc."
                required
              />
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Ano *
              </label>
              <Input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="2020"
                max="2050"
                required
              />
            </div>

            {/* Time Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Tempo Limite (minutos)
              </label>
              <Input
                type="number"
                name="timeLimit"
                value={formData.timeLimit}
                onChange={handleChange}
                placeholder="Ex: 60, 90, 120..."
                min="15"
                max="480"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Deixe em branco se não houver limite de tempo
              </p>
            </div>

            {/* Evaluation Criteria */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Critérios de Avaliação
              </label>
              <textarea
                name="evaluationCriteria"
                value={formData.evaluationCriteria}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Questões de múltipla escolha valem 1,0 ponto cada. Questões dissertativas valem 2,0 pontos cada..."
              />
            </div>

            {/* Instructions */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Instruções Gerais
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Leia atentamente todas as questões antes de começar. Use caneta azul ou preta. Não é permitido uso de calculadora..."
              />
            </div>

            {/* Is Default */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Definir como cabeçalho padrão
                  </span>
                </div>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
                Este cabeçalho será usado automaticamente ao criar novas provas
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pré-visualização</h3>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {formData.schoolName || '[Nome da Escola]'}
              </h2>
              <p className="text-lg text-gray-900 dark:text-white">
                Prova de {formData.subjectName || '[Matéria]'} - {formData.year}
              </p>
              {formData.timeLimit && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tempo: {formData.timeLimit} minutos
                </p>
              )}
            </div>
            
            <div className="mt-6 space-y-4 text-sm text-gray-900 dark:text-white">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <strong>Nome:</strong> ___________________________
                </div>
                <div>
                  <strong>Série:</strong> ___________________________
                </div>
                <div>
                  <strong>Data:</strong> ___________________________
                </div>
              </div>

              {formData.evaluationCriteria && (
                <div>
                  <strong>Critérios de Avaliação:</strong>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{formData.evaluationCriteria}</p>
                </div>
              )}

              {formData.instructions && (
                <div>
                  <strong>Instruções:</strong>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{formData.instructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/exam-headers')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={mutation.isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {isEdit ? 'Atualizar' : 'Criar'} Cabeçalho
          </Button>
        </div>
      </form>
    </div>
  );
}