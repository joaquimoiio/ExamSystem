// frontend/src/components/Subjects/SubjectCard.jsx
import React from 'react';
import { Edit, Trash2, Eye, FileText, HelpCircle, Calendar } from 'lucide-react';
import { Button } from '../Common';

const SubjectCard = ({ 
  subject, 
  onEdit, 
  onView, 
  onDelete, 
  loading = false 
}) => {
  if (!subject) return null;

  const {
    id,
    name,
    code,
    description,
    color,
    credits,
    isActive,
    questionsCount = 0,
    examsCount = 0,
    createdAt
  } = subject;

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  };

  // Função para gerar iniciais do nome
  const getInitials = (name) => {
    if (!name) return 'D';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
      {/* Header do Card */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Avatar da disciplina */}
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ backgroundColor: color || '#6B7280' }}
            >
              {getInitials(name)}
            </div>
            
            {/* Info da disciplina */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate" title={name}>
                {name}
              </h3>
              {code && (
                <p className="text-sm text-gray-500 font-mono">
                  {code}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {credits} crédito{credits !== 1 ? 's' : ''}
                </span>
                {!isActive && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inativa
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status indicator */}
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
            isActive ? 'bg-green-400' : 'bg-red-400'
          }`} title={isActive ? 'Ativa' : 'Inativa'} />
        </div>

        {/* Descrição */}
        {description && (
          <p className="text-sm text-gray-600 mt-3 line-clamp-2" title={description}>
            {description}
          </p>
        )}
      </div>

      {/* Estatísticas */}
      <div className="p-4 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600">
              <HelpCircle className="h-4 w-4" />
              <span className="font-semibold">{questionsCount}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Questão{questionsCount !== 1 ? 'ões' : ''}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-purple-600">
              <FileText className="h-4 w-4" />
              <span className="font-semibold">{examsCount}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Prova{examsCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Informações adicionais */}
      {createdAt && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>Criada em {formatDate(createdAt)}</span>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="p-3 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView && onView(subject)}
            disabled={loading}
            className="flex items-center gap-1 text-gray-600 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Ver</span>
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit && onEdit(subject)}
              disabled={loading}
              className="flex items-center gap-1 text-gray-600 hover:text-blue-600"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Editar</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete && onDelete(subject)}
              disabled={loading || questionsCount > 0}
              className="flex items-center gap-1 text-gray-600 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title={questionsCount > 0 ? 'Não é possível excluir disciplina com questões' : 'Excluir disciplina'}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Excluir</span>
            </Button>
          </div>
        </div>

        {/* Aviso sobre exclusão */}
        {questionsCount > 0 && (
          <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            Remove as questões antes de excluir
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Carregando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectCard;