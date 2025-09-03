import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      eventId: Date.now().toString(),
    });

    // Log error to console for development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Here you could send error to monitoring service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    const { error, errorInfo, eventId } = this.state;
    const errorReport = {
      eventId,
      error: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Copy error details to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Detalhes do erro copiados para a área de transferência');
      })
      .catch(() => {
        console.log('Error report:', errorReport);
        alert('Não foi possível copiar. Verifique o console para detalhes do erro.');
      });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 p-4 rounded-full">
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ops! Algo deu errado
            </h1>

            {/* Error Description */}
            <p className="text-gray-600 mb-8">
              Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada 
              e está trabalhando para resolver o problema.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Tentar Novamente
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Voltar ao Início
              </button>

              <button
                onClick={this.handleReportError}
                className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Bug className="w-5 h-5 mr-2" />
                Reportar Erro
              </button>
            </div>

            {/* Error ID */}
            {this.state.eventId && (
              <div className="text-sm text-gray-500 mb-4">
                ID do Erro: {this.state.eventId}
              </div>
            )}

            {/* Development Error Details */}
            {isDevelopment && error && (
              <details className="text-left bg-gray-100 rounded-lg p-4 mt-6">
                <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                  Detalhes do Erro (Desenvolvimento)
                </summary>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-red-600 mb-2">Erro:</h3>
                    <pre className="text-sm bg-red-50 p-2 rounded overflow-auto">
                      {error.toString()}
                    </pre>
                  </div>

                  {error.stack && (
                    <div>
                      <h3 className="font-semibold text-red-600 mb-2">Stack Trace:</h3>
                      <pre className="text-xs bg-red-50 p-2 rounded overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo && errorInfo.componentStack && (
                    <div>
                      <h3 className="font-semibold text-red-600 mb-2">Component Stack:</h3>
                      <pre className="text-xs bg-red-50 p-2 rounded overflow-auto max-h-40">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Additional Help */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">
                Precisa de Ajuda?
              </h3>
              <p className="text-sm text-blue-700">
                Se o problema persistir, entre em contato com o suporte técnico 
                e informe o ID do erro acima.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component wrapper
export function withErrorBoundary(Component, errorBoundaryProps = {}) {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error reporting
export function useErrorHandler() {
  const handleError = (error, errorInfo = {}) => {
    console.error('Handled error:', error, errorInfo);
    
    // You could send to monitoring service here
    // Example: Sentry.captureException(error, { extra: errorInfo });
  };

  return handleError;
}

export default ErrorBoundary;