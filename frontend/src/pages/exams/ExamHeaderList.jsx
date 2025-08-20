import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Star, StarOff, 
  School, Calendar, Clock, FileText 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import apiService from '../../services/api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Loading from '../../components/common/Loading';

export default function ExamHeaderList() {
  const [deleteModal, setDeleteModal] = useState({ open: false, header: null });
  const navigate = useNavigate();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  // Fetch exam headers
  const { data: headersData, isLoading } = useQuery({
    queryKey: ['examHeaders'],
    queryFn: () => apiService.get('/exam-headers')
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => apiService.delete(`/exam-headers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examHeaders'] });
      success('Cabeçalho deletado com sucesso');
      setDeleteModal({ open: false, header: null });
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Erro ao deletar cabeçalho');
    }
  });

  // Set as default mutation
  const setDefaultMutation = useMutation({
    mutationFn: (id) => apiService.put(`/exam-headers/${id}/set-default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examHeaders'] });
      success('Cabeçalho definido como padrão');
    },
    onError: (err) => {
      error(err.response?.data?.message || 'Erro ao definir como padrão');
    }
  });

  const headers = headersData?.data?.headers || [];

  const handleDelete = (header) => {
    setDeleteModal({ open: true, header });
  };

  const confirmDelete = () => {
    if (deleteModal.header) {
      deleteMutation.mutate(deleteModal.header.id);
    }
  };

  const handleSetDefault = (id) => {
    setDefaultMutation.mutate(id);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cabeçalhos de Prova</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os cabeçalhos que aparecerão em suas provas
          </p>
        </div>
        <Button onClick={() => navigate('/exam-headers/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cabeçalho
        </Button>
      </div>

      {/* Headers Grid */}
      {headers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum cabeçalho encontrado
          </h3>
          <p className="text-gray-600 mb-6">
            Crie seu primeiro cabeçalho de prova para começar a personalizar suas avaliações.
          </p>
          <Button onClick={() => navigate('/exam-headers/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Cabeçalho
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {headers.map((header) => (
            <div
              key={header.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-6 hover:shadow-md transition-shadow ${
                header.isDefault ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {/* Header Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <School className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-900 truncate">
                      {header.schoolName}
                    </h3>
                    {header.isDefault && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Matéria:</strong> {header.subjectName}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{header.year}</span>
                    {header.timeLimit && (
                      <>
                        <Clock className="w-4 h-4 ml-2" />
                        <span>{header.timeLimit} min</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Evaluation Criteria Preview */}
              {header.evaluationCriteria && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Critérios de Avaliação:</p>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {header.evaluationCriteria}
                  </p>
                </div>
              )}

              {/* Instructions Preview */}
              {header.instructions && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Instruções:</p>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {header.instructions}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/exam-headers/${header.id}/edit`)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(header)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Deletar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {!header.isDefault && (
                  <button
                    onClick={() => handleSetDefault(header.id)}
                    className="flex items-center gap-1 px-3 py-1 text-xs text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                    title="Definir como padrão"
                  >
                    <StarOff className="w-3 h-3" />
                    Definir como padrão
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, header: null })}
        title="Deletar Cabeçalho"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Tem certeza que deseja deletar o cabeçalho "{deleteModal.header?.schoolName}"?
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, header: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              loading={deleteMutation.isLoading}
            >
              Deletar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}