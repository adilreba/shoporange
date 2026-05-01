import { Component, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

function ErrorFallback({ error, onReset }: { error?: Error; onReset: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {t('error.title', 'Bir Hata Oluştu')}
        </h1>
        <p className="text-muted-foreground">
          {t('error.description', 'Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya ana sayfaya dönün.')}
        </p>
        {import.meta.env.DEV && error && (
          <pre className="text-left text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
            {error.stack}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onReset}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            {t('error.retry', 'Tekrar Dene')}
          </button>
          <a
            href="/"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-muted transition-colors"
          >
            {t('error.goHome', 'Ana Sayfa')}
          </a>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo.componentStack);

    // Production'da hata izleme servisine gönder (Sentry, vb.)
    // if (window.Sentry) { window.Sentry.captureException(error); }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}
