// frontend/src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Clock, 
  CheckCircle, 
  Zap, 
  Shield, 
  ArrowRight, 
  Star,
  ChevronDown,
  Menu,
  X,
  GraduationCap,
  FileText,
  BarChart3,
  Shuffle,
  QrCode,
  PenTool,
  Play,
  Video,
  LogIn,
  UserPlus,
  Phone
} from 'lucide-react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.getElementById('navbar');
      if (navbar) {
        if (window.scrollY > 50) {
          navbar.classList.add('bg-white/95', 'backdrop-blur-sm', 'shadow-lg');
        } else {
          navbar.classList.remove('bg-white/95', 'backdrop-blur-sm', 'shadow-lg');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Shuffle className="w-8 h-8" />,
      title: "Embaralhamento Inteligente",
      description: "Algoritmo exclusivo que gera versões diferentes mantendo o mesmo nível de dificuldade. Adeus cola!"
    },
    {
      icon: <QrCode className="w-8 h-8" />,
      title: "QR Code Mágico",
      description: "Cada prova recebe um QR Code único. Aluno escaneia e responde pelo celular. Correção instantânea!"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Relatórios Incríveis",
      description: "Gráficos automáticos de desempenho, estatísticas por questão, comparação entre turmas e muito mais!"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Economia de Tempo",
      description: "De 6 horas para 15 minutos por avaliação. Mais tempo para o que realmente importa: ENSINAR!"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Dados Seguros",
      description: "Backup automático na nuvem, criptografia de ponta, conformidade com LGPD. Seus dados sempre protegidos!"
    },
    {
      icon: <PenTool className="w-8 h-8" />,
      title: "Mobile First",
      description: "Funciona perfeitamente no celular, tablet e computador. Acesse de qualquer lugar, a qualquer hora!"
    }
  ];

  const testimonials = [
    {
      name: "Professora Maria Silva",
      role: "Matemática - SP",
      content: "Minha vida mudou completamente! Antes eu passava o fim de semana inteiro corrigindo provas. Agora tenho tempo para a família e para me aperfeiçoar como professora.",
      rating: 5
    },
    {
      name: "Professora Ana Costa",
      role: "Português - RJ",
      content: "Os relatórios automáticos são incríveis! Consigo identificar exatamente onde cada aluno tem dificuldade. Meu trabalho como educadora nunca foi tão eficiente.",
      rating: 5
    },
    {
      name: "Professora Carla Santos",
      role: "História - MG",
      content: "Desde que uso o ExamSystem, zero problema com cola! Cada turma recebe uma versão diferente e os resultados são muito mais justos. Recomendo para todas as colegas!",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "É realmente grátis para começar?",
      answer: "Sim! O plano gratuito permite até 50 alunos por mês e 3 versões por prova. Não pedimos cartão de crédito e você pode usar para sempre sem custo."
    },
    {
      question: "Meus alunos precisam de celular para responder?",
      answer: "Sim, mas funciona em qualquer smartphone simples. Eles só escaneiam o QR Code e respondem pelo navegador. Também oferecemos a opção de correção manual para escolas sem acesso a tecnologia."
    },
    {
      question: "É difícil de usar? Não sou muito boa com tecnologia...",
      answer: "Absolutamente não! Foi criado pensando em professores, não em técnicos. Em 10 minutos você já está criando sua primeira prova. Temos tutoriais em vídeo e suporte em português."
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim! Não há fidelidade ou multa por cancelamento. Cancele quando quiser com 1 clique. Seus dados ficam salvos por 30 dias caso mude de ideia."
    },
    {
      question: "Funciona para todas as matérias?",
      answer: "Sim! Matemática, Português, História, Geografia, Ciências, Inglês... Qualquer matéria que use questões de múltipla escolha ou verdadeiro/falso."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav id="navbar" className="fixed top-0 w-full z-50 transition-all duration-300 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ExamSystem</span>
              <span className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">BETA</span>
            </div>

            {/* Desktop Menu */}
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
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Entrar
              </Link>
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

          {/* Mobile Menu */}
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
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-blue-600 transition-colors px-4 font-medium"
                >
                  Entrar
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-4 text-center font-medium"
                >
                  Teste Grátis
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-blue-200">
                <Zap className="w-4 h-4 mr-2" />
                Transformando a Educação Brasileira
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                A Revolução que toda 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  {" "}professora esperava
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Pare de perder <strong className="text-red-600">horas preciosas</strong> criando e corrigindo provas! 
                O ExamSystem automatiza todo o processo de avaliação, gerando 
                <strong className="text-green-600"> versões únicas</strong> da mesma prova e 
                <strong className="text-blue-600"> corrigindo automaticamente</strong>. 
                <span className="text-lg text-purple-600 font-semibold">Economize 90% do seu tempo!</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link 
                  to="/register"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all duration-300 text-lg font-medium flex items-center justify-center group shadow-lg"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Começar Teste Grátis
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all duration-300 text-lg font-medium flex items-center justify-center">
                  <Video className="mr-2 w-5 h-5" />
                  Ver Demonstração
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  14 dias grátis
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Sem cartão de crédito
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Suporte em português
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Cancele quando quiser
                </div>
              </div>
            </div>

            <div className="lg:pl-8">
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Prova de Matemática</h3>
                        <p className="text-sm text-gray-600">9º Ano - Ensino Fundamental</p>
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Ativa
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="text-2xl font-bold text-blue-600">5</div>
                      <div className="text-sm text-blue-600">Versões Geradas</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <div className="text-2xl font-bold text-green-600">32</div>
                      <div className="text-sm text-green-600">Alunos Avaliados</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                          <QrCode className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-blue-800">Versão A - Turma 9A</span>
                      </div>
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                        8.7/10
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                          <QrCode className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-green-800">Versão B - Turma 9B</span>
                      </div>
                      <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                        7.9/10
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
                          <QrCode className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-purple-800">Versão C - Turma 9C</span>
                      </div>
                      <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                        8.2/10
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-orange-600 mr-2" />
                        <span className="text-sm font-medium text-orange-800">
                          Tempo economizado: 4h 30min! ⚡
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating benefits */}
                <div className="absolute -top-6 -right-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg transform rotate-12">
                  90% Menos Trabalho! 🚀
                </div>
                <div className="absolute -bottom-6 -left-6 bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg transform -rotate-12">
                  100% Automático! 🎯
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Recursos que vão mudar sua vida profissional
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tecnologia de ponta desenvolvida especificamente para professores brasileiros
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="bg-blue-600 text-white p-3 rounded-xl inline-flex mb-4 group-hover:bg-blue-700 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-blue-700 mb-3">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">15.000+</div>
              <div className="text-gray-600">Professoras ativas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">2.8M+</div>
              <div className="text-gray-600">Provas geradas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">95%</div>
              <div className="text-gray-600">Economia de tempo</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">4.9/5</div>
              <div className="text-gray-600">Avaliação média</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              O que as professoras estão falando
            </h2>
            <p className="text-xl text-gray-600">
              Depoimentos reais de quem transformou sua rotina
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-gray-50 p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-xl text-gray-600">
              Tire suas dúvidas sobre o ExamSystem
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                  onClick={() => setActiveAccordion(activeAccordion === index ? null : index)}
                >
                  <span className="text-lg font-medium text-gray-900">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      activeAccordion === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {activeAccordion === index && (
                  <div className="px-8 pb-6">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Pronta para revolucionar suas avaliações?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a <strong>15.000+ professoras</strong> que já economizam <strong>6+ horas por semana</strong> 
            com o ExamSystem. Comece gratuitamente agora mesmo!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 text-lg font-medium flex items-center justify-center group shadow-lg"
            >
              Começar Gratuitamente
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/login"
              className="border-2 border-white text-white px-8 py-4 rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300 text-lg font-medium flex items-center justify-center"
            >
              Já tenho conta
            </Link>
          </div>
          <p className="text-blue-100 text-sm mt-4">
            ✅ Sem cartão de crédito • ✅ Configuração em 2 minutos • ✅ Suporte gratuito
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">ExamSystem</span>
                <span className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">BETA</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                A primeira plataforma brasileira de criação e correção automática de provas, 
                desenvolvida especialmente para professores que querem economizar tempo.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutoriais</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ExamSystem. Todos os direitos reservados. Feito com ❤️ para professoras brasileiras.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}