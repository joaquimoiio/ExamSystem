import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, CheckCircle, Clock, Star, Users,
  BarChart3, FileText, Shuffle, QrCode, Menu, X,
  ArrowRight, Zap, Shield, Heart, BookOpen,
  PenTool, Calendar, Trophy, Apple, Coffee,
  Glasses, Briefcase, Lightbulb, Calculator,
  Globe, Beaker, Book, Building, Flag,
  Bookmark, Library, ScrollText, NotebookPen
} from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">ExamSystem</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#recursos" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium transition-colors">
                Recursos
              </a>
              <a href="#planos" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium transition-colors">
                Planos
              </a>
              <a href="#contato" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium transition-colors">
                Contato
              </a>
              <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium transition-colors">
                Entrar
              </Link>
              <ThemeToggle />
              <Link
                to="/register"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Começar Agora
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-4">
              <div className="flex flex-col space-y-4 px-4">
                <a href="#recursos" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium">
                  Recursos
                </a>
                <a href="#planos" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium">
                  Planos
                </a>
                <a href="#contato" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium">
                  Contato
                </a>
                <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium">
                  Entrar
                </Link>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">Tema</span>
                  <ThemeToggle showLabel />
                </div>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
                >
                  Começar Agora
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 py-20 relative overflow-hidden">
        {/* Educational Background Elements - Books and School Items */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large Books */}
          <div className="absolute top-10 left-16 text-blue-400 dark:text-blue-400 opacity-70 dark:opacity-40 transform rotate-12">
            <BookOpen className="w-24 h-24" />
          </div>
          <div className="absolute top-32 right-20 text-emerald-400 dark:text-emerald-400 opacity-60 dark:opacity-35 transform -rotate-12">
            <Book className="w-20 h-20" />
          </div>
          <div className="absolute bottom-32 left-10 text-purple-400 dark:text-purple-400 opacity-75 dark:opacity-45 transform rotate-45">
            <Library className="w-28 h-28" />
          </div>

          {/* Medium Books */}
          <div className="absolute top-1/2 right-12 text-amber-400 dark:text-amber-400 opacity-65 dark:opacity-40 transform -rotate-45">
            <ScrollText className="w-16 h-16" />
          </div>
          <div className="absolute top-20 left-1/3 text-rose-400 dark:text-rose-400 opacity-60 dark:opacity-35 transform rotate-25">
            <NotebookPen className="w-14 h-14" />
          </div>
          <div className="absolute bottom-20 right-1/4 text-indigo-400 dark:text-indigo-400 opacity-65 dark:opacity-40 transform -rotate-30">
            <Bookmark className="w-12 h-12" />
          </div>

          {/* Small Educational Items */}
          <div className="absolute top-64 left-1/4 text-emerald-500 dark:text-emerald-500 opacity-55 dark:opacity-30">
            <PenTool className="w-10 h-10" />
          </div>
          <div className="absolute top-16 right-1/3 text-violet-500 dark:text-violet-500 opacity-60 dark:opacity-35 transform rotate-15">
            <GraduationCap className="w-14 h-14" />
          </div>
          <div className="absolute bottom-40 left-1/2 text-cyan-500 dark:text-cyan-500 opacity-55 dark:opacity-30 transform rotate-75">
            <Trophy className="w-12 h-12" />
          </div>
          <div className="absolute top-2/3 left-8 text-orange-500 dark:text-orange-500 opacity-60 dark:opacity-35">
            <Lightbulb className="w-10 h-10" />
          </div>

          {/* Stack of Books Effect */}
          <div className="absolute bottom-16 right-16 transform rotate-6">
            <div className="relative">
              <Book className="w-18 h-18 text-blue-500 dark:text-blue-500 opacity-80 dark:opacity-50" />
              <Book className="w-18 h-18 text-emerald-500 dark:text-emerald-500 opacity-75 dark:opacity-45 absolute -top-1 -left-1" />
              <Book className="w-18 h-18 text-rose-500 dark:text-rose-500 opacity-70 dark:opacity-40 absolute -top-2 -left-2" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Glasses className="w-4 h-4 mr-2" />
                Feito especialmente para professores
              </div>

              <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-6 leading-tight">
                Monte suas provas em{' '}
                <span className="text-blue-600">minutos</span>, sem complicação
              </h1>

              <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
                Feito para professores que querem otimizar tempo e facilitar a correção de provas.
                Do ensino fundamental ao superior. <strong>Simples, rápido e eficiente.</strong>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center"
                >
                  <PenTool className="w-5 h-5 mr-2" />
                  Criar minha prova
                </Link>
                <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Explorar recursos
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Teste grátis para sempre
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Sem cartão de crédito
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Suporte em português
                </div>
              </div>
            </div>

            {/* Right Content - Professor-themed Mockup */}
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-700 p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300 border-l-4 border-blue-600">
                {/* Header with teacher context */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Calculator className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">Prova de Matemática</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">8º Ano • Álgebra • 20 questões</p>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Pronta
                  </span>
                </div>

                {/* Professor stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">5</div>
                    <div className="text-xs text-gray-500">Versões</div>
                  </div>
                  <div className="text-center bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">2min</div>
                    <div className="text-xs text-gray-500">Criação</div>
                  </div>
                  <div className="text-center bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">Auto</div>
                    <div className="text-xs text-gray-500">Correção</div>
                  </div>
                </div>

                {/* Teacher actions */}
                <div className="space-y-2">
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Gerar PDF
                  </button>
                  <button className="w-full border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Ver Relatório
                  </button>
                </div>

                {/* Mini teacher avatar */}
                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border-2 border-blue-600">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              {/* Floating teacher badges */}
              <div className="absolute -top-4 -left-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold flex items-center">
                <Zap className="w-3 h-3 mr-1" />
                Rápido
              </div>
              <div className="absolute -bottom-4 -right-4 bg-green-400 text-green-900 px-3 py-1 rounded-full text-sm font-bold flex items-center">
                <Heart className="w-3 h-3 mr-1" />
                Fácil
              </div>
            </div>
          </div>

          {/* Teacher personas */}
          <div className="mt-16 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Usado por professores de:</p>
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400 dark:text-gray-500">
              <div className="flex items-center">
                <Calculator className="w-6 h-6 mr-2 text-blue-500" />
                <span className="text-sm">Matemática</span>
              </div>
              <div className="flex items-center">
                <Globe className="w-6 h-6 mr-2 text-green-500" />
                <span className="text-sm">Geografia</span>
              </div>
              <div className="flex items-center">
                <Beaker className="w-6 h-6 mr-2 text-purple-500" />
                <span className="text-sm">Química</span>
              </div>
              <div className="flex items-center">
                <Book className="w-6 h-6 mr-2 text-red-500" />
                <span className="text-sm">Português</span>
              </div>
              <div className="flex items-center">
                <Building className="w-6 h-6 mr-2 text-yellow-600" />
                <span className="text-sm">História</span>
              </div>
              <div className="flex items-center">
                <Flag className="w-6 h-6 mr-2 text-blue-600" />
                <span className="text-sm">Inglês</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 bg-white dark:bg-gray-900 relative overflow-hidden">
        {/* Background Books for Features */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-8 text-blue-400 dark:text-blue-400 opacity-80 dark:opacity-50">
            <BookOpen className="w-32 h-32 transform rotate-12" />
          </div>
          <div className="absolute bottom-20 right-12 text-purple-400 dark:text-purple-400 opacity-70 dark:opacity-45">
            <Library className="w-28 h-28 transform -rotate-12" />
          </div>
          <div className="absolute top-1/2 left-1/4 text-emerald-400 dark:text-emerald-400 opacity-60 dark:opacity-40">
            <ScrollText className="w-24 h-24 transform rotate-45" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Criação, aplicação e correção de provas de forma simples e eficiente para professores
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center bg-blue-50 dark:bg-gray-800 p-8 rounded-2xl hover:shadow-lg dark:hover:shadow-gray-700 transition-shadow relative">
              <div className="bg-blue-100 dark:bg-blue-900 p-6 rounded-2xl mb-6 mx-auto w-20 h-20 flex items-center justify-center">
                <Zap className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Criação Rápida</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Monte provas profissionais em minutos. Interface pensada para professores ocupados.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center bg-green-50 dark:bg-gray-800 p-8 rounded-2xl hover:shadow-lg dark:hover:shadow-gray-700 transition-shadow relative">
              <div className="bg-green-100 dark:bg-green-900 p-6 rounded-2xl mb-6 mx-auto w-20 h-20 flex items-center justify-center">
                <QrCode className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Correção por QR</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Escaneie o QR da prova e tenha a correção instantânea. Sem papel, sem erro manual.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center bg-purple-50 dark:bg-gray-800 p-8 rounded-2xl hover:shadow-lg dark:hover:shadow-gray-700 transition-shadow relative">
              <div className="bg-purple-100 dark:bg-purple-900 p-6 rounded-2xl mb-6 mx-auto w-20 h-20 flex items-center justify-center">
                <Shuffle className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Múltiplas Versões</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Gere até 50 versões diferentes. Evite cola e facilite aplicação para turmas grandes.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center bg-orange-50 dark:bg-gray-800 p-8 rounded-2xl hover:shadow-lg dark:hover:shadow-gray-700 transition-shadow relative">
              <div className="bg-orange-100 dark:bg-orange-900 p-6 rounded-2xl mb-6 mx-auto w-20 h-20 flex items-center justify-center">
                <BarChart3 className="w-10 h-10 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Relatórios Completos</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Veja o desempenho detalhado por aluno, questão e turma. Identifique dificuldades rapidamente.
              </p>
            </div>
          </div>

          {/* Extra feature highlight for teachers */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center relative overflow-hidden">
            {/* Background books in the highlight section */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-4 right-8 text-white opacity-10">
                <BookOpen className="w-20 h-20 transform rotate-12" />
              </div>
              <div className="absolute bottom-4 left-8 text-white opacity-10">
                <Library className="w-16 h-16 transform -rotate-12" />
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 mr-3" />
                <h3 className="text-2xl font-bold text-white">Feito sob medida para o dia a dia do professor</h3>
              </div>
              <p className="text-blue-100 dark:text-blue-200 text-lg max-w-3xl mx-auto">
                Banco de questões por matéria, níveis de dificuldade personalizáveis,
                integração com calendário escolar, e muito mais recursos pensados especialmente para você.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Updated with correct free plan limits */}
      <section id="planos" className="py-20 bg-gray-50 dark:bg-gray-800 relative overflow-hidden">
        {/* Background Books for Pricing */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-16 right-16 text-indigo-400 dark:text-indigo-400 opacity-50 dark:opacity-35">
            <NotebookPen className="w-40 h-40 transform rotate-15" />
          </div>
          <div className="absolute bottom-16 left-16 text-teal-400 dark:text-teal-400 opacity-60 dark:opacity-40">
            <ScrollText className="w-36 h-36 transform -rotate-15" />
          </div>
          <div className="absolute top-1/2 right-1/3 text-rose-400 dark:text-rose-400 opacity-40 dark:opacity-30">
            <Book className="w-24 h-24 transform rotate-30" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Escolha o plano ideal para você
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300">
              Comece grátis e evolua conforme sua necessidade como professor
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg dark:shadow-gray-700 border border-gray-200 dark:border-gray-700 hover:shadow-xl dark:hover:shadow-gray-600 transition-shadow relative">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full mr-3">
                    <BookOpen className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Plano Gratuito</h3>
                </div>
                <div className="text-5xl font-bold text-gray-800 dark:text-white mb-3">R$ 0</div>
                <p className="text-gray-700 dark:text-gray-300 text-lg">Para sempre • Perfeito para começar</p>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">Até <strong>2 matérias</strong></span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Até <strong>10 questões</strong></span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Até <strong>1 prova</strong></span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Correção automática</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Exportação PDF</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Suporte básico</span>
                </li>
              </ul>

              <div className="mt-auto">
                <Link
                  to="/register"
                  className="w-full block text-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold text-lg"
                >
                  Começar Agora
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-3">Ideal para professores experimentarem</p>
              </div>
            </div>

            {/* Plus Plan */}
            <div className="bg-blue-600 dark:bg-blue-700 p-8 rounded-2xl shadow-xl text-white relative border-4 border-yellow-400 dark:border-yellow-500 transform scale-105">
              {/* Background decoration */}
              <div className="absolute top-4 right-4 text-white opacity-10">
                <Library className="w-16 h-16 transform rotate-12" />
              </div>

              {/* Popular badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full text-sm font-bold flex items-center shadow-lg">
                  <Trophy className="w-4 h-4 mr-2" />
                  MAIS ESCOLHIDO
                </div>
              </div>

              <div className="text-center mb-8 pt-4">
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-white bg-opacity-20 p-3 rounded-full mr-3">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Plano Plus</h3>
                </div>
                <div className="text-5xl font-bold text-white mb-3">R$ 29,90</div>
                <p className="text-blue-100 text-lg">por mês • Para professores ativos</p>
              </div>

              <ul className="space-y-4 mb-10 relative z-10">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span className="text-white"><strong>Matérias ilimitadas</strong></span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span className="text-white"><strong>Questões ilimitadas</strong></span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span className="text-white"><strong>Provas ilimitadas</strong></span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span className="text-white">Análises avançadas</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span className="text-white">Suporte prioritário</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span className="text-white">Marca personalizada</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                  <span className="text-white">Todos os recursos</span>
                </li>
              </ul>

              <div className="mt-auto relative z-10">
                <Link
                  to="/register"
                  className="w-full block text-center bg-white text-blue-600 py-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-100 transition-colors font-bold text-lg shadow-lg"
                >
                  Assinar Agora
                </Link>
                <p className="text-sm text-blue-100 text-center mt-3">Para professores que querem o máximo</p>
              </div>
            </div>
          </div>

          {/* Price comparison for teachers */}
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center">
              <Coffee className="w-5 h-5 mr-2 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                <strong>Dica de professor:</strong> O Plano Plus custa menos que 1 café por dia
                e economiza horas de trabalho por semana!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 bg-white dark:bg-gray-900 relative overflow-hidden">
        {/* Background Books for Testimonial */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-12 left-12 text-blue-400 dark:text-blue-400 opacity-70 dark:opacity-50">
            <BookOpen className="w-28 h-28 transform rotate-6" />
          </div>
          <div className="absolute bottom-12 right-12 text-violet-400 dark:text-violet-400 opacity-65 dark:opacity-45">
            <ScrollText className="w-24 h-24 transform -rotate-12" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="bg-blue-50 dark:bg-gray-800 rounded-2xl p-12 relative overflow-hidden">
            <div className="absolute -top-4 -right-4">
              <div className="bg-blue-600 p-4 rounded-full">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
            </div>
            {/* Small books decoration in testimonial */}
            <div className="absolute top-8 left-8 text-cyan-400 dark:text-cyan-400 opacity-60 dark:opacity-40">
              <Book className="w-8 h-8 transform rotate-12" />
            </div>
            <div className="absolute bottom-8 right-20 text-emerald-400 dark:text-emerald-400 opacity-60 dark:opacity-40">
              <Bookmark className="w-6 h-6 transform -rotate-12" />
            </div>

            <div className="flex justify-center mb-6 relative">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
            <blockquote className="text-2xl font-medium text-gray-800 dark:text-white mb-6 relative">
              "Revolucionou minha sala de aula! O que levava 3 horas para criar e corrigir,
              agora faço em 15 minutos. Meus alunos adoram a correção instantânea!"
            </blockquote>
            <div className="flex items-center justify-center relative">
              <img
                src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face&auto=format"
                alt="Professora Maria"
                className="w-12 h-12 rounded-full mr-4"
              />
              <div className="text-left">
                <div className="font-semibold text-gray-800 dark:text-white">Prof. Maria Silva</div>
                <div className="text-gray-700 dark:text-gray-300 flex items-center">
                  <Calculator className="w-4 h-4 mr-1" />
                  Matemática • Ensino Fundamental II
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400 font-medium">
            <Shield className="w-5 h-5" />
            <span>Feito de professor para professor</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-blue-600 relative overflow-hidden">
        {/* Background education icons - including books */}
        <div className="absolute inset-0 opacity-15 dark:opacity-15 overflow-hidden">
          <div className="absolute top-10 left-10 text-cyan-200 dark:text-cyan-300">
            <BookOpen className="w-32 h-32 transform rotate-12" />
          </div>
          <div className="absolute top-20 right-20 text-yellow-200 dark:text-yellow-300">
            <GraduationCap className="w-40 h-40 transform -rotate-6" />
          </div>
          <div className="absolute bottom-20 left-1/4 text-purple-200 dark:text-purple-300">
            <Library className="w-36 h-36 transform rotate-15" />
          </div>
          <div className="absolute top-1/2 left-16 text-emerald-200 dark:text-emerald-300">
            <ScrollText className="w-24 h-24 transform -rotate-30" />
          </div>
          <div className="absolute bottom-32 right-1/3 text-rose-200 dark:text-rose-300">
            <NotebookPen className="w-28 h-28 transform rotate-45" />
          </div>
          <div className="absolute top-32 right-1/4 text-indigo-200 dark:text-indigo-300">
            <Book className="w-20 h-20 transform -rotate-20" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="flex justify-center mb-6">
            <div className="flex space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-6">
            Comece grátis e descubra como é fácil criar suas provas
          </h2>
          <p className="text-xl text-blue-100 dark:text-blue-200 mb-8">
            Junte-se a milhares de professores que já estão economizando tempo e melhorando suas aulas
          </p>
          <Link
            to="/register"
            className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg"
          >
            <PenTool className="w-5 h-5 mr-2" />
            Experimente agora grátis
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-gray-900 dark:bg-gray-950 text-white py-12 relative overflow-hidden">
        {/* Background books in footer */}
        <div className="absolute inset-0 opacity-8 dark:opacity-8 overflow-hidden">
          <div className="absolute top-8 right-16 text-blue-300 dark:text-blue-400">
            <BookOpen className="w-20 h-20 transform rotate-12" />
          </div>
          <div className="absolute bottom-8 left-16 text-purple-300 dark:text-purple-400">
            <Library className="w-24 h-24 transform -rotate-12" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">ExamSystem</span>
              </div>
              <p className="text-gray-400 dark:text-gray-500 flex items-center">
                <Heart className="w-4 h-4 mr-2" />
                Simplificando a vida dos professores na hora de avaliar.
                Feito com carinho por educadores.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400 dark:text-gray-500">
                <li><a href="#recursos" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#planos" className="hover:text-white transition-colors">Preços</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Entrar</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400 dark:text-gray-500">
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Central de Ajuda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Contato
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Tutoriais
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 dark:border-gray-700 mt-8 pt-8 text-center text-gray-400 dark:text-gray-500">
            <p>&copy; 2025 ExamSystem. Todos os direitos reservados. Feito com carinho para professores brasileiros.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}