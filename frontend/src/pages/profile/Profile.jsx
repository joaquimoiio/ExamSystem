import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  User, Mail, Lock, Camera, Save, Edit, 
  Shield, Bell, Palette, Globe, Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Input, Textarea, Switch, Select } from '../../components/ui/Input';
import { LoadingButton } from '../../components/common/Loading';
import { ConfirmationModal } from '../../components/ui/Modal';

const timezoneOptions = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'America/New_York', label: 'Nova York (GMT-4)' },
  { value: 'Europe/London', label: 'Londres (GMT+0)' },
  { value: 'Asia/Tokyo', label: 'Tóquio (GMT+9)' },
];

const languageOptions = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
];

const themeOptions = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'auto', label: 'Automático' },
];

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const { success, error: showError } = useToast();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
    reset: resetProfile,
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      institution: user?.institution || '',
      position: user?.position || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
    reset: resetPassword,
    watch,
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const {
    register: registerSettings,
    handleSubmit: handleSettingsSubmit,
    formState: { isSubmitting: isSubmittingSettings },
    watch: watchSettings,
    setValue: setSettingsValue,
  } = useForm({
    defaultValues: {
      timezone: user?.settings?.timezone || 'America/Sao_Paulo',
      language: user?.settings?.language || 'pt-BR',
      theme: user?.settings?.theme || 'light',
      emailNotifications: user?.settings?.emailNotifications ?? true,
      browserNotifications: user?.settings?.browserNotifications ?? true,
      weeklyReport: user?.settings?.weeklyReport ?? false,
      autoSave: user?.settings?.autoSave ?? true,
    },
  });

  const newPassword = watch('newPassword');

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'preferences', label: 'Preferências', icon: Bell },
    { id: 'settings', label: 'Configurações', icon: Globe },
  ];

  const onProfileSubmit = async (data) => {
    try {
      await updateProfile(data);
      setIsEditingProfile(false);
      success('Perfil atualizado com sucesso!');
    } catch (error) {
      showError(error.message || 'Erro ao atualizar perfil');
    }
  };

  const onPasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      showError('Senhas não coincidem');
      return;
    }

    try {
      await changePassword(data.currentPassword, data.newPassword);
      success('Senha alterada com sucesso!');
      setShowPasswordModal(false);
      resetPassword();
    } catch (error) {
      showError(error.message || 'Erro ao alterar senha');
    }
  };

  const onSettingsSubmit = async (data) => {
    try {
      await updateProfile({ settings: data });
      success('Configurações salvas com sucesso!');
    } catch (error) {
      showError(error.message || 'Erro ao salvar configurações');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Camera className="w-3 h-3 text-gray-600" />
          </button>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{user?.name || 'Usuário'}</h1>
          <p className="text-gray-600">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
        <div className="p-6">
          {activeTab === 'profile' && (
            <ProfileTab
              user={user}
              isEditing={isEditingProfile}
              onEdit={() => setIsEditingProfile(true)}
              onCancel={() => {
                setIsEditingProfile(false);
                resetProfile();
              }}
              register={registerProfile}
              handleSubmit={handleProfileSubmit}
              onSubmit={onProfileSubmit}
              errors={profileErrors}
              isSubmitting={isSubmittingProfile}
            />
          )}

          {activeTab === 'security' && (
            <SecurityTab
              onChangePassword={() => setShowPasswordModal(true)}
            />
          )}

          {activeTab === 'preferences' && (
            <PreferencesTab
              register={registerSettings}
              handleSubmit={handleSettingsSubmit}
              onSubmit={onSettingsSubmit}
              watch={watchSettings}
              setValue={setSettingsValue}
              isSubmitting={isSubmittingSettings}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              register={registerSettings}
              handleSubmit={handleSettingsSubmit}
              onSubmit={onSettingsSubmit}
              watch={watchSettings}
              isSubmitting={isSubmittingSettings}
            />
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      <ConfirmationModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          resetPassword();
        }}
        title="Alterar Senha"
        confirmText="Alterar"
        onConfirm={handlePasswordSubmit(onPasswordSubmit)}
        isLoading={isSubmittingPassword}
        size="md"
      >
        <form className="space-y-4">
          <Input
            label="Senha Atual"
            type="password"
            placeholder="Digite sua senha atual"
            error={passwordErrors.currentPassword?.message}
            {...registerPassword('currentPassword', {
              required: 'Senha atual é obrigatória',
            })}
          />

          <Input
            label="Nova Senha"
            type="password"
            placeholder="Digite a nova senha"
            error={passwordErrors.newPassword?.message}
            {...registerPassword('newPassword', {
              required: 'Nova senha é obrigatória',
              minLength: {
                value: 8,
                message: 'Senha deve ter pelo menos 8 caracteres',
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Senha deve conter ao menos uma letra minúscula, uma maiúscula e um número',
              },
            })}
          />

          <Input
            label="Confirmar Nova Senha"
            type="password"
            placeholder="Confirme a nova senha"
            error={passwordErrors.confirmPassword?.message}
            {...registerPassword('confirmPassword', {
              required: 'Confirmação de senha é obrigatória',
              validate: (value) =>
                value === newPassword || 'Senhas não coincidem',
            })}
          />
        </form>
      </ConfirmationModal>
    </div>
  );
}

// Profile Tab Component
function ProfileTab({ 
  user, 
  isEditing, 
  onEdit, 
  onCancel, 
  register, 
  handleSubmit, 
  onSubmit, 
  errors, 
  isSubmitting 
}) {
  if (isEditing) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Editar Perfil</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nome Completo"
            placeholder="Seu nome completo"
            error={errors.name?.message}
            {...register('name', {
              required: 'Nome é obrigatório',
              minLength: {
                value: 2,
                message: 'Nome deve ter pelo menos 2 caracteres',
              },
            })}
          />

          <Input
            label="Email"
            type="email"
            placeholder="Seu email"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email é obrigatório',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email inválido',
              },
            })}
          />

          <Input
            label="Telefone"
            placeholder="(11) 99999-9999"
            {...register('phone')}
          />

          <Input
            label="Instituição"
            placeholder="Nome da sua instituição"
            {...register('institution')}
          />

          <Input
            label="Cargo/Posição"
            placeholder="Professor, Coordenador, etc."
            {...register('position')}
          />
        </div>

        <div>
          <Textarea
            label="Biografia"
            placeholder="Conte um pouco sobre você..."
            rows={3}
            {...register('bio', {
              maxLength: {
                value: 500,
                message: 'Biografia deve ter no máximo 500 caracteres',
              },
            })}
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <LoadingButton
            type="submit"
            loading={isSubmitting}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </LoadingButton>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Informações do Perfil</h2>
        <button
          onClick={onEdit}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Nome</label>
          <p className="text-lg text-gray-900">{user?.name || 'Não informado'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
          <p className="text-lg text-gray-900">{user?.email || 'Não informado'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Telefone</label>
          <p className="text-lg text-gray-900">{user?.phone || 'Não informado'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Instituição</label>
          <p className="text-lg text-gray-900">{user?.institution || 'Não informada'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Cargo/Posição</label>
          <p className="text-lg text-gray-900">{user?.position || 'Não informado'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Membro desde</label>
          <p className="text-lg text-gray-900">
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
          </p>
        </div>
      </div>

      {user?.bio && (
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Biografia</label>
          <p className="text-gray-900">{user.bio}</p>
        </div>
      )}
    </div>
  );
}

// Security Tab Component
function SecurityTab({ onChangePassword }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Segurança</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Senha</h3>
            <p className="text-sm text-gray-500">Altere sua senha regularmente para manter sua conta segura</p>
          </div>
          <button
            onClick={onChangePassword}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Alterar Senha
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Autenticação em Dois Fatores</h3>
            <p className="text-sm text-gray-500">Adicione uma camada extra de segurança à sua conta</p>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Configurar
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Sessões Ativas</h3>
            <p className="text-sm text-gray-500">Gerencie dispositivos conectados à sua conta</p>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Ver Sessões
          </button>
        </div>
      </div>
    </div>
  );
}

// Preferences Tab Component
function PreferencesTab({ register, handleSubmit, onSubmit, watch, setValue, isSubmitting }) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Preferências</h2>

      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-gray-900 mb-4">Notificações</h3>
          <div className="space-y-4">
            <Switch
              label="Notificações por Email"
              description="Receba atualizações importantes por email"
              {...register('emailNotifications')}
            />

            <Switch
              label="Notificações no Navegador"
              description="Permita notificações push no navegador"
              {...register('browserNotifications')}
            />

            <Switch
              label="Relatório Semanal"
              description="Receba um resumo semanal das suas atividades"
              {...register('weeklyReport')}
            />
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-4">Comportamento</h3>
          <div className="space-y-4">
            <Switch
              label="Salvamento Automático"
              description="Salve automaticamente as alterações enquanto você trabalha"
              {...register('autoSave')}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-200">
        <LoadingButton
          type="submit"
          loading={isSubmitting}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Preferências
        </LoadingButton>
      </div>
    </form>
  );
}

// Settings Tab Component
function SettingsTab({ register, handleSubmit, onSubmit, watch, isSubmitting }) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Configurações do Sistema</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Fuso Horário"
          options={timezoneOptions}
          {...register('timezone')}
        />

        <Select
          label="Idioma"
          options={languageOptions}
          {...register('language')}
        />

        <Select
          label="Tema"
          options={themeOptions}
          {...register('theme')}
        />
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-200">
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
  );
}