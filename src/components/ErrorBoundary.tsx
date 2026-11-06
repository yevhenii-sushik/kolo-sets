import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { Button, Heading, Text } from '../ui';

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const { t } = useI18n();
  const e = t.error;
  return (
    <div className="min-h-dvh grid place-items-center bg-bg px-4 py-16">
      <div className="grid max-w-md justify-items-center gap-6 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-danger-soft text-danger">
          <AlertTriangle size={26} />
        </span>
        <div className="grid gap-3">
          <Heading size={1}>{e.title}</Heading>
          <Text tone="muted">
            {e.text}{' '}
            <a href={`mailto:${e.contact}`} className="font-semibold text-accent-ink hover:underline underline-offset-2">
              {e.contact}
            </a>
          </Text>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" iconLeft={<RefreshCw size={18} />} onClick={onReset}>
            {e.retry}
          </Button>
          {/* Полная перезагрузка: состояние после ошибки могло испортиться */}
          <Button size="lg" variant="secondary" onClick={() => { window.location.href = '/'; }}>
            {e.home}
          </Button>
        </div>
        {error && (
          <details className="w-full text-left">
            <summary className="cursor-pointer text-center text-sm font-medium text-faint transition-colors hover:text-muted">
              {e.details}
            </summary>
            <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-2xl border border-line bg-surface p-4 text-xs leading-relaxed text-muted">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
