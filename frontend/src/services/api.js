// frontend/src/services/api/subjectService.js
import apiClient from './apiClient';

class SubjectService {
  constructor() {
    this.baseUrl = '/subjects';
  }

  // Função auxiliar para tratar erros
  handleError(error) {
    console.error('❌ Erro na API de disciplinas:', error);
    
    if (error.response) {
      // Erro da resposta do servidor
      const message = error.response.data?.message || 'Erro no servidor';
      const status = error.response.status;
      
      console.error(`❌ Status ${status}: ${message}`);
      throw new Error(message);
    } else if (error.request) {
      // Erro de rede
      console.error('❌ Erro de rede:', error.request);
      throw new Error('Erro de conexão. Verifique sua internet.');
    } else {
      // Erro de configuração ou outro
      console.error('❌ Erro desconhecido:', error.message);
      throw new Error(error.message || 'Erro desconhecido');
    }
  }

  // Buscar todas as disciplinas com paginação e filtros
  async getAll(params = {}) {
    try {
      console.log('🔍 SubjectService.getAll - Parâmetros:', params);
      
      const response = await apiClient.get(this.baseUrl, { params });
      
      console.log('✅ SubjectService.getAll - Resposta:', response.data);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Buscar disciplina por ID
  async getById(id) {
    try {
      console.log('🔍 SubjectService.getById - ID:', id);
      
      if (!id) {
        throw new Error('ID da disciplina é obrigatório');
      }
      
      const response = await apiClient.get(`${this.baseUrl}/${id}`);
      
      console.log('✅ SubjectService.getById - Resposta:', response.data);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Criar nova disciplina
  async create(subjectData) {
    try {
      console.log('🆕 SubjectService.create - Dados:', subjectData);
      
      // Validações básicas
      if (!subjectData.name || !subjectData.name.trim()) {
        throw new Error('Nome da disciplina é obrigatório');
      }
      
      if (!subjectData.color) {
        throw new Error('Cor da disciplina é obrigatória');
      }
      
      // Preparar dados
      const dataToSend = {
        name: subjectData.name.trim(),
        description: subjectData.description ? subjectData.description.trim() : '',
        color: subjectData.color,
        code: subjectData.code ? subjectData.code.trim() : null,
        credits: parseInt(subjectData.credits) || 1,
        isActive: subjectData.isActive !== undefined ? Boolean(subjectData.isActive) : true
      };

      console.log('🆕 SubjectService.create - Dados preparados:', dataToSend);
      
      const response = await apiClient.post(this.baseUrl, dataToSend);
      
      console.log('✅ SubjectService.create - Resposta:', response.data);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Atualizar disciplina
  async update(id, subjectData) {
    try {
      console.log('✏️ SubjectService.update - ID:', id, 'Dados:', subjectData);
      
      if (!id) {
        throw new Error('ID da disciplina é obrigatório');
      }
      
      // Preparar dados (remover campos undefined/null)
      const dataToSend = {};
      
      if (subjectData.name !== undefined) {
        dataToSend.name = subjectData.name.trim();
      }
      
      if (subjectData.description !== undefined) {
        dataToSend.description = subjectData.description ? subjectData.description.trim() : '';
      }
      
      if (subjectData.color !== undefined) {
        dataToSend.color = subjectData.color;
      }
      
      if (subjectData.code !== undefined) {
        dataToSend.code = subjectData.code ? subjectData.code.trim() : null;
      }
      
      if (subjectData.credits !== undefined) {
        dataToSend.credits = parseInt(subjectData.credits) || 1;
      }
      
      if (subjectData.isActive !== undefined) {
        dataToSend.isActive = Boolean(subjectData.isActive);
      }

      console.log('✏️ SubjectService.update - Dados preparados:', dataToSend);
      
      const response = await apiClient.put(`${this.baseUrl}/${id}`, dataToSend);
      
      console.log('✅ SubjectService.update - Resposta:', response.data);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Excluir disciplina
  async delete(id) {
    try {
      console.log('🗑️ SubjectService.delete - ID:', id);
      
      if (!id) {
        throw new Error('ID da disciplina é obrigatório');
      }
      
      const response = await apiClient.delete(`${this.baseUrl}/${id}`);
      
      console.log('✅ SubjectService.delete - Resposta:', response.data);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Buscar estatísticas das disciplinas
  async getStats() {
    try {
      console.log('📊 SubjectService.getStats');
      
      const response = await apiClient.get(`${this.baseUrl}/stats`);
      
      console.log('✅ SubjectService.getStats - Resposta:', response.data);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Buscar disciplinas ativas (para seleção em formulários)
  async getActive() {
    try {
      console.log('🔍 SubjectService.getActive');
      
      const response = await apiClient.get(this.baseUrl, {
        params: {
          isActive: true,
          limit: 100 // Buscar todas as ativas
        }
      });
      
      console.log('✅ SubjectService.getActive - Resposta:', response.data);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Validar se o nome da disciplina já existe
  async validateName(name, excludeId = null) {
    try {
      console.log('🔍 SubjectService.validateName - Nome:', name);
      
      if (!name || !name.trim()) {
        return { isValid: false, message: 'Nome é obrigatório' };
      }
      
      const response = await this.getAll({
        search: name.trim(),
        limit: 100
      });
      
      if (response.success && response.data.subjects) {
        const existingSubject = response.data.subjects.find(subject => 
          subject.name.toLowerCase() === name.trim().toLowerCase() &&
          subject.id !== excludeId
        );
        
        if (existingSubject) {
          return { 
            isValid: false, 
            message: 'Já existe uma disciplina com este nome' 
          };
        }
      }
      
      return { isValid: true };
    } catch (error) {
      console.error('❌ Erro ao validar nome:', error);
      return { isValid: true }; // Em caso de erro, permitir validação
    }
  }

  // Validar se o código da disciplina já existe
  async validateCode(code, excludeId = null) {
    try {
      console.log('🔍 SubjectService.validateCode - Código:', code);
      
      if (!code || !code.trim()) {
        return { isValid: true }; // Código é opcional
      }
      
      const response = await this.getAll({
        search: code.trim(),
        limit: 100
      });
      
      if (response.success && response.data.subjects) {
        const existingSubject = response.data.subjects.find(subject => 
          subject.code && 
          subject.code.toLowerCase() === code.trim().toLowerCase() &&
          subject.id !== excludeId
        );
        
        if (existingSubject) {
          return { 
            isValid: false, 
            message: 'Já existe uma disciplina com este código' 
          };
        }
      }
      
      return { isValid: true };
    } catch (error) {
      console.error('❌ Erro ao validar código:', error);
      return { isValid: true }; // Em caso de erro, permitir validação
    }
  }

  // Gerar código automático para disciplina
  generateCode(name) {
    if (!name || !name.trim()) {
      return '';
    }
    
    const words = name.trim().toUpperCase().split(' ');
    let code = '';
    
    if (words.length === 1) {
      // Uma palavra: primeiras 3 letras + 101
      code = words[0].substring(0, 3) + '101';
    } else if (words.length === 2) {
      // Duas palavras: primeira letra de cada + 01
      code = words[0].charAt(0) + words[1].charAt(0) + '01';
    } else {
      // Três ou mais palavras: primeira letra das 3 primeiras
      code = words[0].charAt(0) + words[1].charAt(0) + words[2].charAt(0);
    }
    
    // Adicionar número aleatório se muito curto
    if (code.length < 4) {
      code += Math.floor(Math.random() * 90) + 10; // 10-99
    }
    
    return code;
  }

  // Buscar disciplinas para uso em dropdowns/selects
  async getForSelect(activeOnly = true) {
    try {
      const params = activeOnly ? { isActive: true, limit: 100 } : { limit: 100 };
      const response = await this.getAll(params);
      
      if (response.success && response.data.subjects) {
        return response.data.subjects.map(subject => ({
          value: subject.id,
          label: subject.name,
          code: subject.code,
          color: subject.color
        }));
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar disciplinas para select:', error);
      return [];
    }
  }
}

// Exportar instância única
const subjectService = new SubjectService();
export { subjectService };
export default subjectService;