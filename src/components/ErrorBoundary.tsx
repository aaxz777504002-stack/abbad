import React, { ErrorInfo, ReactNode } from "react";
import { RefreshCw, Trash2, ShieldAlert } from "lucide-react";
import { safeLocalStorage as localStorage, safeSessionStorage as sessionStorage } from "../lib/safeStorage";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleResetCache = () => {
    try {
      // Clear potentially corrupted local data while preserving safe items
      const keysToClear = [
        "hotel_rooms",
        "hotel_guests",
        "service_requests",
        "user_roles_list",
        "hotel_years_list",
        "hotel_visit_settings"
      ];
      keysToClear.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  private handleFullReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error(e);
    }
    window.location.href = window.location.origin + window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          id="error-boundary-screen" 
          className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-6" 
          dir="rtl"
        >
          <div className="max-w-lg w-full bg-slate-800 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                خدر ليالي الأنس - استعادة النظام
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                حدث خطأ غير متوقع أثناء معالجة البيانات أو تحميل الصفحة. يمكنك إعادة تشغيل النظام فوراً عبر الأزرار أدناه:
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950/90 border border-slate-700/80 rounded-xl p-3.5 text-left font-mono text-[11px] text-rose-300 max-h-48 overflow-y-auto space-y-2 select-text" dir="ltr">
                <div className="font-bold text-rose-400">
                  {this.state.error.name}: {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-slate-400 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                )}
                {this.state.errorInfo?.componentStack && (
                  <div className="pt-2 border-t border-slate-800 text-[10px] text-amber-300/80 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تحميل الصفحة</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>إصلاح وتحديث الذاكرة</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-700/50">
              <button
                type="button"
                onClick={this.handleFullReset}
                className="text-slate-400 hover:text-rose-400 text-xs font-semibold underline transition cursor-pointer"
              >
                إعادة ضبط المصنع الكاملة للمتصفح
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
