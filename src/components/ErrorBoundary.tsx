import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#F5F2ED] dark:bg-[#0F0E0C] px-6 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6">
        <AlertTriangle size={28} className="text-red-500" />
      </div>
      <h1 className="text-4xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] tracking-tight mb-3">
        Something broke<span className="text-[#FF5733]">.</span>
      </h1>
      <p className="text-[14px] text-[#7A756E] dark:text-[#8A867F] font-medium max-w-sm mb-8 leading-relaxed">
        An unexpected error occurred. Your data is safe — this is just a display issue.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 bg-[#FF5733] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#E54D2A] transition-colors shadow-lg shadow-[#FF5733]/25"
        >
          <RefreshCw size={14} />
          Try again
        </button>
        <button
          onClick={() => { window.location.href = '/'; }}
          className="px-6 py-3 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#0F0E0C] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          Go home
        </button>
      </div>
      {error && (
        <details className="mt-8 max-w-md text-left">
          <summary className="text-[11px] font-bold uppercase tracking-widest text-[#B5B0A8] cursor-pointer hover:text-[#7A756E] transition-colors">
            Error details
          </summary>
          <pre className="mt-3 p-4 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-2xl text-[10px] text-[#7A756E] overflow-auto leading-relaxed whitespace-pre-wrap">
            {error.message}
          </pre>
        </details>
      )}
    </div>
  );
}
