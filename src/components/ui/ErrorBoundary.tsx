import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Bug } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  resetKeys?: any[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && this.props.resetKeys && prevProps.resetKeys) {
      const keysChanged = this.props.resetKeys.some((key, i) => key !== prevProps.resetKeys![i]);
      if (keysChanged) {
        this.handleReset();
      }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleGoHome = () => {
    this.handleReset();
    window.location.hash = '';
    // Dispatch custom event or reload if needed
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isBn = true; // Dual-language support
      return (
        <div className="min-h-[280px] w-full p-6 sm:p-8 rounded-3xl bg-white/95 border border-amber-200/80 shadow-lg flex flex-col items-center justify-center text-center my-4 animate-in fade-in duration-200">
          {/* Visual Badge */}
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-4 shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-[#17383B] mb-1">
            {this.props.fallbackTitle || 'সাময়িক ত্রুটি পরিলক্ষিত হয়েছে / Something Went Wrong'}
          </h3>

          <p className="text-xs sm:text-sm text-[#688285] max-w-md mb-6 leading-relaxed">
            {this.props.fallbackMessage || 
              'এই অংশে ডেটা প্রক্রিয়াকরণে অপ্রত্যাশিত কোনো ত্রুটি হয়েছে। পুরো পৃষ্ঠা বন্ধ হয়নি, আপনি পুনরায় চেষ্টা করতে পারেন অথবা ড্যাশবোর্ডে ফিরতে পারেন।'
            }
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B9FA5] hover:bg-[#078A90] text-white font-bold text-xs shadow-md shadow-[#0B9FA5]/20 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>পুনরায় চেষ্টা করুন / Try Again</span>
            </button>

            <button
              type="button"
              onClick={this.handleGoHome}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F1FAFA] hover:bg-[#DDF4F3] border border-[#D9EAEB] text-[#17383B] font-bold text-xs transition-all cursor-pointer"
            >
              <Home className="w-4 h-4 text-[#0B9FA5]" />
              <span>ড্যাশবোর্ড / Dashboard</span>
            </button>
          </div>

          {/* Collapsible Error Debug Details */}
          {this.state.error && (
            <div className="w-full max-w-xl mt-4 text-left">
              <button
                type="button"
                onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8EA3A5] hover:text-[#17383B] transition-colors mx-auto block"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>{this.state.showDetails ? 'Hide Error Details' : 'View Error Details'}</span>
                {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800 shadow-inner">
                  <p className="font-bold text-rose-400 mb-1">{this.state.error.name}: {this.state.error.message}</p>
                  {this.state.errorInfo && (
                    <pre className="text-slate-400 text-[10px] whitespace-pre-wrap leading-tight">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
