// Correção para frontend/src/pages/LandingPage.jsx
// A navegação React já está correta! Apenas confirme se está assim:

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, CheckCircle, Star, Users, Award, Clock, 
  Shield, ArrowRight, Menu, X, Play
} from 'lucide-react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ExamSystem</span>
              <span className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">BETA</span>
            </div>

            {/* Desktop Menu - NAVEGAÇÃO CORRETA */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Recursos
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Preços
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Cases
              </a>
              
              {/* ✅ CORRETO: Link direto para página */}
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Entrar
              </Link>
              
              {/* ✅ CORRETO: Link direto para página */}
              <Link 
                to="/register" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
              >
                Teste Grátis
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-blue-600"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu - NAVEGAÇÃO CORRETA */}
          {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors px-4 font-medium">
                  Recursos
                </a>
                <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors px-4 font-medium">
                  Preços
                </a>
                <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors px-4 font-medium">
                  Cases
                </a>
                
                {/* ✅ CORRETO: Link direto para página */}
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-blue-600 transition-colors px-4 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Entrar
                </Link>
                
                {/* ✅ CORRETO: Link direto para página */}
                <Link 
                  to="/register" 
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-4 text-center font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Teste Grátis
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 lg:pt-32 lg:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Conteúdo principal */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Crie provas profissionais em
                <span className="text-blue-600"> minutos</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                Transforme a criação de provas de algo que demora horas em algo que leva minutos. 
                Sistema completo para professores modernos.
              </p>
              
              {/* CTAs principais */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {/* ✅ CORRETO: Link direto para página */}
                <Link 
                  to="/register" 
                  className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  🚀 Começar Grátis
                </Link>
                
                <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors">
                  📱 Ver Demo
                </button>
              </div>
            </div>

            {/* Imagem/Visual */}
            <div className="relative">
              {/* Aqui você pode adicionar uma imagem ou componente visual */}
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Sistema Completo</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Banco de questões ilimitado
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Geração automática de PDFs
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Correção por QR Code
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Relatórios detalhados
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resto do componente... */}
    </div>
  );
}