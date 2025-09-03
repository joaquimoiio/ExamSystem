import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Settings as SettingsIcon, Palette, User, Save,
  CheckCircle, Moon, Sun, Crown, Zap, Star
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingButton } from '../../components/common/Loading';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

export default function Settings() {
  const { success, error: showError } = useToast();
  const { theme, setTheme, toggleTheme, isDark } = useTheme();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      console.log('Saving settings:', data);
      success('Preferências salvas com sucesso!');
    } catch (error) {
      showError(error.message || 'Erro ao salvar preferências');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure suas preferências e visualize seu plano atual
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Plano Atual */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
            <Crown className="w-5 h-5 mr-2 text-yellow-500" />
            Seu Plano
          </h2>
          
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Star className="w-5 h-5 text-yellow-500 mr-2" />
                    Plano Gratuito
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Ideal para começar a usar o sistema
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">R$ 0</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">/mês</div>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Até 5 questões por prova
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Até 60 minutos por prova
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  2 variações por prova
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Banco básico de questões
                </div>
              </div>
            </div>

            {/* Upgrade Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pro Plan */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Plano Pro</h4>
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">R$ 29</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">/mês</div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <div>• Até 50 questões por prova</div>
                  <div>• Até 180 minutos por prova</div>
                  <div>• 10 variações por prova</div>
                  <div>• Relatórios básicos</div>
                </div>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Fazer Upgrade
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="border border-yellow-200 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Plano Enterprise</h4>
                  <Crown className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">R$ 99</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">/mês</div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <div>• Questões ilimitadas</div>
                  <div>• Tempo ilimitado</div>
                  <div>• 50 variações por prova</div>
                  <div>• Relatórios avançados</div>
                </div>
                <button className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                  Fazer Upgrade
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Configurações Gerais */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
            <SettingsIcon className="w-5 h-5 mr-2" />
            Configurações Gerais
          </h2>
          
          <div className="space-y-6">
            {/* Aparência */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white flex items-center mb-4">
                <Palette className="w-4 h-4 mr-2" />
                Tema da Interface
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Light Theme */}
                <div className={`
                  p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${theme === 'light' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }
                `}
                onClick={() => setTheme('light')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Sun className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium text-gray-900 dark:text-white">Claro</span>
                    </div>
                    {theme === 'light' && <CheckCircle className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div className="bg-white border border-gray-200 rounded p-2 h-20">
                    <div className="bg-gray-100 rounded h-2 mb-2"></div>
                    <div className="bg-gray-200 rounded h-2 w-3/4"></div>
                  </div>
                </div>

                {/* Dark Theme */}
                <div className={`
                  p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${theme === 'dark' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }
                `}
                onClick={() => setTheme('dark')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Moon className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-900 dark:text-white">Escuro</span>
                    </div>
                    {theme === 'dark' && <CheckCircle className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded p-2 h-20">
                    <div className="bg-gray-600 rounded h-2 mb-2"></div>
                    <div className="bg-gray-500 rounded h-2 w-3/4"></div>
                  </div>
                </div>

                {/* Auto Theme */}
                <div className={`
                  p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${theme === 'auto' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }
                `}
                onClick={() => setTheme('auto')}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <SettingsIcon className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white">Automático</span>
                    </div>
                    {theme === 'auto' && <CheckCircle className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div className="flex h-20 rounded overflow-hidden border border-gray-200 dark:border-gray-600">
                    <div className="bg-white flex-1 p-2">
                      <div className="bg-gray-100 rounded h-2 mb-2"></div>
                      <div className="bg-gray-200 rounded h-2 w-3/4"></div>
                    </div>
                    <div className="bg-gray-800 flex-1 p-2">
                      <div className="bg-gray-600 rounded h-2 mb-2"></div>
                      <div className="bg-gray-500 rounded h-2 w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                Escolha o tema da interface do sistema
              </p>
            </div>

            {/* Notificações */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Notificações</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receber alertas e notificações do sistema
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Auto-save */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Salvamento Automático</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Salvar automaticamente mudanças nos formulários
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Language */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Idioma do Sistema
              </label>
              <select className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="pt-br">Português (Brasil)</option>
                <option value="en" disabled>English (Em breve)</option>
                <option value="es" disabled>Español (Em breve)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions - apenas para salvar preferências quando necessário */}
        <div className="flex justify-end gap-3">
          <LoadingButton
            type="submit"
            loading={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Preferências
          </LoadingButton>
        </div>
      </form>

      {/* Upgrade Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pro Plan */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plano Pro</h3>
            <Zap className="w-6 h-6 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">R$ 29</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">/mês</div>
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Até 50 questões por prova
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Até 180 minutos por prova
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              10 variações por prova
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Relatórios básicos
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Suporte prioritário
            </div>
          </div>
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            Fazer Upgrade Pro
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-600 rounded-lg p-6 hover:shadow-lg transition-shadow relative">
          <div className="absolute -top-3 left-4 bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-bold">
            MAIS POPULAR
          </div>
          <div className="flex items-center justify-between mb-4 mt-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plano Enterprise</h3>
            <Crown className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">R$ 99</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">/mês</div>
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Questões ilimitadas
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Tempo ilimitado
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              50 variações por prova
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Relatórios avançados
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Suporte 24/7
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              API completa
            </div>
          </div>
          <button className="w-full bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold">
            Fazer Upgrade Enterprise
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Gerenciamento de Planos
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Os limites de questões, tempo e variações são definidos pelo seu plano atual. 
              Faça upgrade para ter mais recursos disponíveis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}