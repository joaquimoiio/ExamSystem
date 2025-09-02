import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Settings as SettingsIcon, Database, Shield, Bell, 
  Palette, Globe, Download, Upload, Trash2, 
  RefreshCw, Save, AlertTriangle, CheckCircle
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Input, Select, Switch, Textarea } from '../../components/ui/Input';
import { LoadingButton } from '../../components/common/Loading';
import { ConfirmationModal } from '../../components/ui/Modal';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

export default function Settings() {
  const { success, error: showError } = useToast();
  const { theme, toggleTheme, isDark } = useTheme();
  
  const [activeTab, setActiveTab] = useState('general');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    defaultValues: {
      // General Settings
      siteName: 'ExamSystem',
      siteDescription: 'Sistema de provas online',
      maxQuestionsPerExam: 50,
      defaultExamDuration: 60,
      allowGuestAccess: false,
      
      // Security Settings
      passwordMinLength: 8,
      requireStrongPassword: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      enableTwoFactor: false,
      
      // Email Settings
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: '',
      
      // Backup Settings
      autoBackup: true,
      backupFrequency: 'daily',
      backupRetention: 30,
      
      // Performance Settings
      cacheEnabled: true,
      cacheTimeout: 3600,
      compressionEnabled: true,
      maxFileSize: 10,
    },
  });

  const tabs = [
    { id: 'general', label: 'Geral', icon: SettingsIcon },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'email', label: 'Email', icon: Bell },
    { id: 'backup', label: 'Backup', icon: Database },
    { id: 'performance', label: 'Performance', icon: RefreshCw },
    { id: 'maintenance', label: 'Manutenção', icon: AlertTriangle },
  ];

  const onSubmit = async (data) => {
    try {
      // Here you would call your API to save settings
      console.log('Saving settings:', data);
      success('Configurações salvas com sucesso!');
    } catch (error) {
      showError(error.message || 'Erro ao salvar configurações');
    }
  };

  const handleReset = async () => {
    try {
      // Reset to default settings
      success('Configurações resetadas para o padrão!');
      setShowResetModal(false);
    } catch (error) {
      showError('Erro ao resetar configurações');
    }
  };

  const handleExport = async () => {
    try {
      // Export settings logic
      const settings = watch();
      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam-system-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      success('Configurações exportadas com sucesso!');
      setShowExportModal(false);
    } catch (error) {
      showError('Erro ao exportar configurações');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações do Sistema</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie as configurações globais do sistema</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
          <button
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Resetar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {activeTab === 'general' && (
            <GeneralTab register={register} errors={errors} />
          )}

          {activeTab === 'security' && (
            <SecurityTab register={register} errors={errors} />
          )}

          {activeTab === 'email' && (
            <EmailTab register={register} errors={errors} />
          )}

          {activeTab === 'backup' && (
            <BackupTab register={register} errors={errors} />
          )}

          {activeTab === 'performance' && (
            <PerformanceTab register={register} errors={errors} />
          )}

          {activeTab === 'appearance' && (
            <AppearanceTab />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceTab />
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700 mt-8">
            <LoadingButton
              type="submit"
              loading={isSubmitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </LoadingButton>
          </div>
        </form>
      </div>

      {/* Modals */}
      <ConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
        title="Resetar Configurações"
        message="Tem certeza que deseja resetar todas as configurações para o padrão? Esta ação não pode ser desfeita."
        confirmText="Resetar"
        confirmVariant="danger"
      />

      <ConfirmationModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={handleExport}
        title="Exportar Configurações"
        message="Isso irá baixar um arquivo JSON com todas as configurações atuais do sistema."
        confirmText="Exportar"
        confirmVariant="primary"
      />
    </div>
  );
}

// General Settings Tab
function GeneralTab({ register, errors }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <SettingsIcon className="w-5 h-5 text-primary-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Configurações Gerais</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Nome do Sistema"
          placeholder="ExamSystem"
          error={errors.siteName?.message}
          {...register('siteName', {
            required: 'Nome do sistema é obrigatório',
          })}
        />

        <Input
          label="Máximo de Questões por Prova"
          type="number"
          min="1"
          max="100"
          error={errors.maxQuestionsPerExam?.message}
          {...register('maxQuestionsPerExam', {
            required: 'Valor obrigatório',
            min: { value: 1, message: 'Mínimo 1 questão' },
            max: { value: 100, message: 'Máximo 100 questões' },
          })}
        />

        <Input
          label="Duração Padrão (minutos)"
          type="number"
          min="5"
          max="480"
          error={errors.defaultExamDuration?.message}
          {...register('defaultExamDuration', {
            required: 'Valor obrigatório',
            min: { value: 5, message: 'Mínimo 5 minutos' },
            max: { value: 480, message: 'Máximo 8 horas' },
          })}
        />
      </div>

      <Textarea
        label="Descrição do Sistema"
        placeholder="Sistema de provas online para instituições de ensino"
        rows={3}
        {...register('siteDescription')}
      />

      <div className="space-y-4">
        <Switch
          label="Permitir Acesso de Convidados"
          description="Permite que usuários não autenticados visualizem provas públicas"
          {...register('allowGuestAccess')}
        />
      </div>
    </div>
  );
}

// Security Settings Tab
function SecurityTab({ register, errors }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Shield className="w-5 h-5 text-primary-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Configurações de Segurança</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Comprimento Mínimo da Senha"
          type="number"
          min="6"
          max="32"
          error={errors.passwordMinLength?.message}
          {...register('passwordMinLength', {
            required: 'Valor obrigatório',
            min: { value: 6, message: 'Mínimo 6 caracteres' },
            max: { value: 32, message: 'Máximo 32 caracteres' },
          })}
        />

        <Input
          label="Timeout de Sessão (minutos)"
          type="number"
          min="5"
          max="1440"
          error={errors.sessionTimeout?.message}
          {...register('sessionTimeout', {
            required: 'Valor obrigatório',
            min: { value: 5, message: 'Mínimo 5 minutos' },
            max: { value: 1440, message: 'Máximo 24 horas' },
          })}
        />

        <Input
          label="Máximo de Tentativas de Login"
          type="number"
          min="3"
          max="10"
          error={errors.maxLoginAttempts?.message}
          {...register('maxLoginAttempts', {
            required: 'Valor obrigatório',
            min: { value: 3, message: 'Mínimo 3 tentativas' },
            max: { value: 10, message: 'Máximo 10 tentativas' },
          })}
        />
      </div>

      <div className="space-y-4">
        <Switch
          label="Exigir Senha Forte"
          description="Senhas devem conter maiúsculas, minúsculas, números e símbolos"
          {...register('requireStrongPassword')}
        />

        <Switch
          label="Autenticação de Dois Fatores"
          description="Habilitar 2FA para todos os usuários"
          {...register('enableTwoFactor')}
        />
      </div>
    </div>
  );
}

// Email Settings Tab
function EmailTab({ register, errors }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Bell className="w-5 h-5 text-primary-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Configurações de Email</h2>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
          <div>
            <h3 className="font-medium text-yellow-800">Configuração SMTP</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Configure seu servidor SMTP para envio de emails de notificação e recuperação de senha.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Servidor SMTP"
          placeholder="smtp.gmail.com"
          error={errors.smtpHost?.message}
          {...register('smtpHost')}
        />

        <Input
          label="Porta SMTP"
          type="number"
          placeholder="587"
          error={errors.smtpPort?.message}
          {...register('smtpPort')}
        />

        <Input
          label="Usuário SMTP"
          placeholder="seu@email.com"
          error={errors.smtpUser?.message}
          {...register('smtpUser')}
        />

        <Input
          label="Senha SMTP"
          type="password"
          placeholder="••••••••"
          error={errors.smtpPassword?.message}
          {...register('smtpPassword')}
        />

        <Input
          label="Email de Envio"
          type="email"
          placeholder="noreply@examsystem.com"
          error={errors.fromEmail?.message}
          {...register('fromEmail')}
        />

        <Input
          label="Nome do Remetente"
          placeholder="ExamSystem"
          error={errors.fromName?.message}
          {...register('fromName')}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Testar Configuração
        </button>
      </div>
    </div>
  );
}

// Backup Settings Tab
function BackupTab({ register, errors }) {
  const backupFrequencyOptions = [
    { value: 'hourly', label: 'A cada hora' },
    { value: 'daily', label: 'Diariamente' },
    { value: 'weekly', label: 'Semanalmente' },
    { value: 'monthly', label: 'Mensalmente' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Database className="w-5 h-5 text-primary-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Configurações de Backup</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Frequência de Backup"
          options={backupFrequencyOptions}
          error={errors.backupFrequency?.message}
          {...register('backupFrequency')}
        />

        <Input
          label="Retenção (dias)"
          type="number"
          min="1"
          max="365"
          error={errors.backupRetention?.message}
          {...register('backupRetention', {
            min: { value: 1, message: 'Mínimo 1 dia' },
            max: { value: 365, message: 'Máximo 365 dias' },
          })}
        />
      </div>

      <div className="space-y-4">
        <Switch
          label="Backup Automático"
          description="Executar backups automaticamente conforme a frequência configurada"
          {...register('autoBackup')}
        />
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Ações de Backup</h3>
        <div className="flex space-x-3">
          <button
            type="button"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Fazer Backup Agora
          </button>
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Ver Histórico
          </button>
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Restaurar Backup
          </button>
        </div>
      </div>
    </div>
  );
}

// Performance Settings Tab
function PerformanceTab({ register, errors }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <RefreshCw className="w-5 h-5 text-primary-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Configurações de Performance</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Timeout de Cache (segundos)"
          type="number"
          min="60"
          max="86400"
          error={errors.cacheTimeout?.message}
          {...register('cacheTimeout', {
            min: { value: 60, message: 'Mínimo 60 segundos' },
            max: { value: 86400, message: 'Máximo 24 horas' },
          })}
        />

        <Input
          label="Tamanho Máximo de Arquivo (MB)"
          type="number"
          min="1"
          max="100"
          error={errors.maxFileSize?.message}
          {...register('maxFileSize', {
            min: { value: 1, message: 'Mínimo 1 MB' },
            max: { value: 100, message: 'Máximo 100 MB' },
          })}
        />
      </div>

      <div className="space-y-4">
        <Switch
          label="Cache Habilitado"
          description="Usar cache para melhorar a performance do sistema"
          {...register('cacheEnabled')}
        />

        <Switch
          label="Compressão Habilitada"
          description="Comprimir respostas para reduzir o tempo de carregamento"
          {...register('compressionEnabled')}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
          <div>
            <h3 className="font-medium text-blue-800">Status do Sistema</h3>
            <div className="text-sm text-blue-700 mt-2 space-y-1">
              <p>• Cache: Ativo (98% hit rate)</p>
              <p>• Compressão: Ativa (35% redução média)</p>
              <p>• Tempo de resposta médio: 124ms</p>
              <p>• Uso de memória: 68%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Appearance Settings Tab
function AppearanceTab() {
  const { theme, setTheme, isDark } = useTheme();
  const [systemTheme, setSystemTheme] = useState('light');

  // Detect system theme
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    const handleChange = (e) => setSystemTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const themeOptions = [
    {
      id: 'light',
      name: 'Claro',
      description: 'Tema claro para uso durante o dia',
      icon: '☀️',
      preview: 'bg-white text-gray-900 border-gray-200'
    },
    {
      id: 'dark', 
      name: 'Escuro',
      description: 'Tema escuro para reduzir fadiga ocular',
      icon: '🌙',
      preview: 'bg-gray-800 text-white border-gray-600'
    },
    {
      id: 'system',
      name: 'Sistema',
      description: `Segue a preferência do sistema (${systemTheme === 'dark' ? 'escuro' : 'claro'})`,
      icon: '⚙️',
      preview: systemTheme === 'dark' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-200'
    }
  ];

  const handleThemeChange = (selectedTheme) => {
    if (selectedTheme === 'system') {
      // Remove from localStorage to use system preference
      localStorage.removeItem('exam-system-theme');
      setTheme(systemTheme);
    } else {
      setTheme(selectedTheme);
    }
  };

  const currentThemeSelection = (() => {
    const savedTheme = localStorage.getItem('exam-system-theme');
    return savedTheme || 'system';
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Palette className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Configurações de Aparência</h2>
      </div>

      {/* Theme Selection */}
      <div>
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Tema do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleThemeChange(option.id)}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                currentThemeSelection === option.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
              }`}
            >
              {/* Selection indicator */}
              {currentThemeSelection === option.id && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
              )}
              
              {/* Theme preview */}
              <div className={`w-full h-12 rounded border mb-3 ${option.preview}`}>
                <div className="p-2 text-xs font-medium">
                  <div className="w-8 h-2 bg-current opacity-70 rounded mb-1"></div>
                  <div className="w-6 h-1 bg-current opacity-50 rounded"></div>
                </div>
              </div>
              
              {/* Theme info */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{option.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{option.name}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current theme info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2" />
          <div>
            <h3 className="font-medium text-blue-800 dark:text-blue-200">Tema Atual</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Você está usando o tema <strong>{isDark ? 'escuro' : 'claro'}</strong>. 
              {currentThemeSelection === 'system' && ' O tema está sendo definido automaticamente pelo sistema.'}
            </p>
            <div className="mt-2 flex items-center space-x-4">
              <ThemeToggle />
              <span className="text-xs text-blue-600 dark:text-blue-400">Alternar rapidamente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility options */}
      <div>
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Acessibilidade</h3>
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              💡 <strong>Dica:</strong> O tema escuro pode ajudar a reduzir a fadiga ocular, especialmente em ambientes com pouca luz.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              🔄 Use a opção "Sistema" para que o tema mude automaticamente baseado nas configurações do seu dispositivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Maintenance Tab
function MaintenanceTab() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <AlertTriangle className="w-5 h-5 text-primary-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Manutenção do Sistema</h2>
      </div>

      <div className="space-y-6">
        {/* Maintenance Mode */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-yellow-800">Modo de Manutenção</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Ative para impedir o acesso dos usuários durante atualizações
              </p>
            </div>
            <Switch
              checked={isMaintenanceMode}
              onChange={setIsMaintenanceMode}
            />
          </div>
        </div>

        {/* System Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Limpar Cache</h3>
            <p className="text-sm text-gray-500 mb-4">
              Remove todos os dados em cache para forçar atualização
            </p>
            <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Limpar Cache
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Reindexar Dados</h3>
            <p className="text-sm text-gray-500 mb-4">
              Reconstrói os índices do banco de dados para melhor performance
            </p>
            <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Reindexar
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Verificar Integridade</h3>
            <p className="text-sm text-gray-500 mb-4">
              Verifica a integridade dos dados do sistema
            </p>
            <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Verificar
            </button>
          </div>

          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h3 className="font-medium text-red-900 mb-2">Resetar Sistema</h3>
            <p className="text-sm text-red-700 mb-4">
              ⚠️ Remove todos os dados do sistema (irreversível)
            </p>
            <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Resetar Sistema
            </button>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-4">Informações do Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Versão:</span>
              <span className="ml-2 text-gray-600">1.0.0</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Última atualização:</span>
              <span className="ml-2 text-gray-600">15/08/2024</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tempo ativo:</span>
              <span className="ml-2 text-gray-600">7 dias, 14h 32m</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Usuários ativos:</span>
              <span className="ml-2 text-gray-600">127</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Espaço em disco:</span>
              <span className="ml-2 text-gray-600">2.4 GB / 10 GB</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Backup mais recente:</span>
              <span className="ml-2 text-gray-600">Hoje, 03:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}