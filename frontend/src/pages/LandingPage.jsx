import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, CheckCircle, Star, Users, Award, Clock, 
  Shield, ArrowRight, Menu, X, Play, Sparkles,
  Database, Shuffle, QrCode, FileText, BarChart3,
  Check, GraduationCap, Download, Home, ArrowLeft,
  Facebook, Instagram, Linkedin, Youtube, ChevronDown,
  AlertTriangle, Mail, Phone
} from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState({});

  const toggleFaq = (index) => {
    setFaqOpen(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  useEffect(() => {
    // Smooth scroll for anchor links
    const handleClick = (e) => {
      const href = e.target.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-800/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">MontAí</span>
              <span className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">BETA</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                Recursos
              </a>
              <a href="#pricing" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                Preços
              </a>
              <a href="#testimonials" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                Cases
              </a>
              <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                Entrar
              </Link>
              <Link to="/register" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg">
                Teste Grátis
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-4 font-medium">
                  Recursos
                </a>
                <a href="#pricing" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-4 font-medium">
                  Preços
                </a>
                <a href="#testimonials" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-4 font-medium">
                  Cases
                </a>
                <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-4 text-left font-medium">
                  Entrar
                </Link>
                <Link to="/register" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-4 text-center font-medium">
                  Teste Grátis
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 lg:pt-32 lg:pb-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Novidade: Correção por IA disponível
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Crie provas profissionais em{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  minutos
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
                Transforme a criação de provas de algo que demora horas em algo que leva minutos. 
                Sistema completo para professores modernos.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  to="/register" 
                  className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  🚀 Assine Agora
                </Link>
                <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  📱 Ver Funções
                </button>
              </div>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Prático e fácil
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Suporte em português
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Cancele quando quiser
                </div>
              </div>
            </div>

            <div className="lg:pl-8">
              <div className="relative">
                {/* Main dashboard mockup */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700 transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Prova de Matemática</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">9º Ano - Ensino Fundamental</p>
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Ativa
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">5</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Versões</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">85%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Taxa de Acerto</div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-3">
                    <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Gerar PDF</span>
                    </button>
                    <button className="w-full border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                      <QrCode className="w-4 h-4" />
                      <span>QR Code</span>
                    </button>
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                  Novo!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Tudo que você precisa para criar{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                provas perfeitas
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Do banco de questões à correção automática, temos todas as ferramentas que você precisa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl inline-flex mb-6">
                <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Banco de Questões Inteligente</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Organize suas questões por matéria, dificuldade e tema. Sistema de tags avançado para encontrar qualquer questão em segundos.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Questões ilimitadas
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Filtros avançados
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Importação em lote
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl inline-flex mb-6">
                <Shuffle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Múltiplas Versões Automáticas</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Gere até 50 versões diferentes da mesma prova automaticamente, embaralhando questões e alternativas.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Até 50 versões
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Embaralhamento inteligente
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Gabaritos automáticos
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl inline-flex mb-6">
                <QrCode className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Correção por QR Code</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Facilitar a correções das diversas provas. Correção e nota instantâneas!
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Correção instantânea
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Sem papel extra
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Feedback imediato
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl inline-flex mb-6">
                <FileText className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">PDFs Profissionais</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Provas em PDF com formatação perfeita, logotipo da escola, cabeçalho personalizado e layout otimizado para impressão.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Layout personalizável
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Logo da escola
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Qualidade impressão
                </li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl inline-flex mb-6">
                <BarChart3 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Relatórios Detalhados</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Veja estatísticas completas: questões mais erradas, desempenho por aluno, comparação entre turmas e muito mais.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Análise por questão
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Ranking de turmas
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Exportar para Excel
                </li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-xl inline-flex mb-6">
                <Users className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Colaboração em Equipe</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Trabalhe com outros professores, compartilhe bancos de questões e crie provas em conjunto.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Equipes ilimitadas
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Compartilhamento fácil
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Controle de permissões
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Planos que{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                cabem no seu bolso
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Comece grátis e evolua conforme sua necessidade. Sem pegadinhas, sem surpresas.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Plano Free</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">R$ 0</div>
                <p className="text-gray-600 dark:text-gray-300">Para sempre</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">2 matérias</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">10 questões</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">1 prova</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Correção automática</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Exportação para PDF</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Suporte básico</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="w-full block text-center bg-gray-900 dark:bg-gray-700 text-white py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors font-medium">
                Começar Agora
              </Link>
            </div>

            {/* Plus Plan */}
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-2xl shadow-xl text-white relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-yellow-600 text-yellow-100 px-4 py-1 rounded-full text-sm font-bold">
                  MAIS POPULAR
                </div>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Plano Plus</h3>
                <div className="text-4xl font-bold mb-2">R$ 19,99</div>
                <p className="text-yellow-100">por mês</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-100 mr-3" />
                  <span>Matérias ilimitadas</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-100 mr-3" />
                  <span>Questões ilimitadas</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-100 mr-3" />
                  <span>Provas ilimitadas</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-100 mr-3" />
                  <span>Análises avançadas</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-100 mr-3" />
                  <span>Suporte prioritário</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-100 mr-3" />
                  <span>Marca personalizada</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="w-full block text-center bg-white text-yellow-600 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-100 transition-colors font-medium">
                Começar Agora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              O que dizem nossos{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                professores
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Mais de 15.000 professores já transformaram sua forma de avaliar
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                "Revolucionou minha forma de criar provas! O que levava 3 horas agora faço em 15 minutos. A correção por QR Code é fantástica!"
              </p>
              <div className="flex items-center">
                <img 
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face&auto=format" 
                  alt="Maria" 
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Maria Silva</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Professora de Matemática</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                "Os relatórios são incríveis! Consigo identificar exatamente onde meus alunos têm dificuldade e ajustar minha metodologia."
              </p>
              <div className="flex items-center">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face&auto=format" 
                  alt="João" 
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">João Santos</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Professor de História</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                "Finalmente um sistema brasileiro que entende nossas necessidades! O suporte é excepcional e está sempre disponível."
              </p>
              <div className="flex items-center">
                <img 
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face&auto=format" 
                  alt="Ana" 
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Ana Costa</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Coordenadora Pedagógica</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Perguntas{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Frequentes
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Tire suas dúvidas sobre o MontAí
            </p>
          </div>

          <div className="space-y-6">
            {/* FAQ 1 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
              <button 
                onClick={() => toggleFaq(1)} 
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Como funciona a correção por QR Code?
                </h3>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                    faqOpen[1] ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {faqOpen[1] && (
                <div className="mt-4 text-gray-600 dark:text-gray-300">
                  O professor escaneia o QR Code na prova, ira analizar os quadrados preenchidos e recebera a nota.
                </div>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
              <button 
                onClick={() => toggleFaq(2)} 
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Posso usar questões que já tenho?
                </h3>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                    faqOpen[2] ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {faqOpen[2] && (
                <div className="mt-4 text-gray-600 dark:text-gray-300">
                  Sim! Você pode importar suas questões do Word, Excel ou digitar diretamente na plataforma. Também temos um banco com milhares de questões prontas.
                </div>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
              <button 
                onClick={() => toggleFaq(3)} 
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  É difícil de usar?
                </h3>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                    faqOpen[3] ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {faqOpen[3] && (
                <div className="mt-4 text-gray-600 dark:text-gray-300">
                  Em 10 minutos você já está criando sua primeira prova. Temos tutoriais em vídeo e suporte em português.
                </div>
              )}
            </div>

            {/* FAQ 4 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
              <button 
                onClick={() => toggleFaq(4)} 
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Posso cancelar a qualquer momento?
                </h3>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                    faqOpen[4] ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {faqOpen[4] && (
                <div className="mt-4 text-gray-600 dark:text-gray-300">
                  Sim! Não há fidelidade ou multa por cancelamento. Cancele quando quiser com 1 clique. Seus dados ficam salvos por 30 dias caso mude de ideia.
                </div>
              )}
            </div>

            {/* FAQ 5 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
              <button 
                onClick={() => toggleFaq(5)} 
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Funciona para todas as matérias?
                </h3>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                    faqOpen[5] ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {faqOpen[5] && (
                <div className="mt-4 text-gray-600 dark:text-gray-300">
                  Sim! Matemática, Português, História, Geografia, Ciências, Inglês... Qualquer matéria que use questões de múltipla escolha ou verdadeiro/falso.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="col-span-1 lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">MontAí</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                A plataforma mais completa para criação de provas no Brasil. 
                Transforme horas de trabalho em minutos de produtividade.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Facebook className="w-4 h-4" />
                  </div>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                    <Instagram className="w-4 h-4" />
                  </div>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                    <Linkedin className="w-4 h-4" />
                  </div>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">YouTube</span>
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    <Youtube className="w-4 h-4" />
                  </div>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-lg">Produto</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutoriais</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-lg">Suporte</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="https://docs.google.com/forms/d/e/1FAIpQLScOg6vtPAy0kf_CE9JJRhQ-YsXVpDYoeQ7clA6PrSi1oqJ6qw/viewform?usp=sharing&ouid=113425038951165086167" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Whatsapp</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © 2025 MontAí. Todos os direitos reservados.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacidade</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Termos</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}