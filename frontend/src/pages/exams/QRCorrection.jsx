import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, QrCode, CheckCircle, XCircle, 
  FileText, Camera, Upload, AlertCircle 
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import apiService from '../../services/api';

export default function QRCorrection() {
  const [qrData, setQrData] = useState('');
  const [studentAnswers, setStudentAnswers] = useState('');
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    email: '',
    studentId: ''
  });
  const [correctionResult, setCorrectionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: QR, 2: Answers, 3: Student Info, 4: Results

  const navigate = useNavigate();
  const { success, error } = useToast();
  const fileInputRef = useRef(null);

  // Handle QR code input
  const handleQRInput = (value) => {
    setQrData(value);
    if (value.trim()) {
      try {
        const parsedData = JSON.parse(value);
        if (parsedData.type === 'answer_key') {
          setStep(2);
          success('QR Code válido encontrado!');
        } else {
          error('QR Code não é um gabarito válido');
        }
      } catch (e) {
        error('QR Code com formato inválido');
      }
    }
  };

  // Handle student answers input
  const handleAnswersInput = (value) => {
    setStudentAnswers(value);
    if (value.trim()) {
      setStep(3);
    }
  };

  // Process correction
  const handleCorrection = async () => {
    if (!qrData || !studentAnswers) {
      error('Dados incompletos para correção');
      return;
    }

    setIsLoading(true);
    try {
      // Parse answers - expecting format like "1,2,0,3,1" (0-indexed)
      const parsedAnswers = studentAnswers.split(',').map(ans => parseInt(ans.trim()));
      
      const response = await apiService.post('/exams/validate-qr', {
        qrData: JSON.parse(qrData),
        studentAnswers: parsedAnswers,
        studentInfo: studentInfo
      });

      setCorrectionResult(response.data);
      setStep(4);
      success('Correção realizada com sucesso!');

    } catch (err) {
      console.error('Correction error:', err);
      error(err.message || 'Erro ao realizar correção');
    } finally {
      setIsLoading(false);
    }
  };

  // File upload for QR code image
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // In a real implementation, you would use a QR code reader library
      // For now, we'll show a placeholder
      error('Upload de imagem QR não implementado ainda. Cole o texto do QR Code manualmente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/exams')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar para Provas
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Correção via QR Code</h1>
          <p className="text-gray-600 mt-2">
            Escaneie o QR Code da prova e insira as respostas do aluno para correção automática
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNum ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>QR Code</span>
            <span>Respostas</span>
            <span>Dados</span>
            <span>Resultado</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {/* Step 1: QR Code Input */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Escaneie ou Cole o QR Code
                </h2>
                <p className="text-gray-600">
                  Use o QR Code do gabarito da prova para começar a correção
                </p>
              </div>

              {/* QR Code Input Methods */}
              <div className="space-y-4">
                {/* Manual Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cole os dados do QR Code:
                  </label>
                  <textarea
                    rows={6}
                    value={qrData}
                    onChange={(e) => handleQRInput(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono"
                    placeholder='{"type":"answer_key","examId":"...","variationId":"...",...}'
                  />
                </div>

                {/* File Upload (placeholder) */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Ou faça upload da imagem do QR Code
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Escolher Arquivo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Student Answers */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Respostas do Aluno
                </h2>
                <p className="text-gray-600">
                  Digite as respostas marcadas pelo aluno (A=0, B=1, C=2, D=3, E=4)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Respostas (separadas por vírgula):
                </label>
                <input
                  type="text"
                  value={studentAnswers}
                  onChange={(e) => handleAnswersInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3"
                  placeholder="0,1,2,0,3 (exemplo para questões 1:A, 2:B, 3:C, 4:A, 5:D)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Exemplo: "0,1,2,0,3" significa A, B, C, A, D
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Voltar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Student Info */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Dados do Aluno (Opcional)
                </h2>
                <p className="text-gray-600">
                  Preencha os dados para salvar o resultado da correção
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Aluno
                  </label>
                  <input
                    type="text"
                    value={studentInfo.name}
                    onChange={(e) => setStudentInfo({...studentInfo, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-3"
                    placeholder="João Silva"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={studentInfo.email}
                    onChange={(e) => setStudentInfo({...studentInfo, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-3"
                    placeholder="joao@exemplo.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Matrícula/ID
                  </label>
                  <input
                    type="text"
                    value={studentInfo.studentId}
                    onChange={(e) => setStudentInfo({...studentInfo, studentId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-3"
                    placeholder="2023001"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCorrection}
                  disabled={isLoading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {isLoading ? 'Corrigindo...' : 'Corrigir Prova'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && correctionResult && (
            <div className="space-y-6">
              <div className="text-center">
                {correctionResult.score >= 6 ? (
                  <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                ) : (
                  <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                )}
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Resultado da Correção
                </h2>
                <p className="text-gray-600">
                  {correctionResult.examTitle} - Variação {correctionResult.variationNumber}
                </p>
              </div>

              {/* Score Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {correctionResult.score}
                    </div>
                    <div className="text-sm text-gray-500">Nota</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {correctionResult.results.filter(r => r.isCorrect).length}
                    </div>
                    <div className="text-sm text-gray-500">Acertos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {correctionResult.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-500">Total</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${
                      correctionResult.score >= 6 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {correctionResult.score >= 6 ? 'APROVADO' : 'REPROVADO'}
                    </div>
                    <div className="text-sm text-gray-500">Status</div>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Detalhamento por Questão:</h3>
                {correctionResult.results.map((result, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-3 rounded border ${
                      result.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center">
                      {result.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mr-2" />
                      )}
                      <span className="font-medium">Questão {result.questionNumber}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Resposta: {['A', 'B', 'C', 'D', 'E'][result.studentAnswer] || '?'} | 
                      Gabarito: {['A', 'B', 'C', 'D', 'E'][result.correctAnswer] || '?'} | 
                      Pontos: {result.points}/{result.maxPoints}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setCorrectionResult(null);
                    setQrData('');
                    setStudentAnswers('');
                    setStudentInfo({ name: '', email: '', studentId: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Nova Correção
                </button>
                <button
                  onClick={() => navigate('/exams')}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Voltar para Provas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}