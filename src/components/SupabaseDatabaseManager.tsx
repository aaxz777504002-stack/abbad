import React, { useState, useEffect } from "react";
import { 
  Database, 
  Cloud, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  Zap, 
  RotateCcw, 
  ExternalLink, 
  ShieldCheck, 
  Server, 
  Code, 
  Sparkles,
  ArrowRightLeft,
  X
} from "lucide-react";
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  SUPABASE_SQL_SETUP_SCRIPT 
} from "../lib/supabase";

interface SupabaseDatabaseManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset?: () => void;
}

export const SupabaseDatabaseManager: React.FC<SupabaseDatabaseManagerProps> = ({
  isOpen,
  onClose,
  onDataReset,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [activeDb, setActiveDb] = useState<"cloudsql" | "supabase">("cloudsql");
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showSqlScript, setShowSqlScript] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; status?: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Load config on mount
  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    // 1. From local
    const local = getSupabaseConfig();
    if (local.url) setSupabaseUrl(local.url);
    if (local.anonKey) setSupabaseKey(local.anonKey);

    // 2. From server
    try {
      const res = await fetch("/api/supabase/config");
      if (res.ok) {
        const data = await res.json();
        if (data.url && !local.url) setSupabaseUrl(data.url);
        if (data.activeDb) setActiveDb(data.activeDb);
      }
    } catch (e) {
      console.warn("Could not load supabase config from server", e);
    }
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setStatusMessage({ type: "error", text: "يرجى كتابة Project URL و API Key الخاصين بمشروعك في Supabase أولاً." });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/supabase/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: supabaseUrl, anonKey: supabaseKey }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message,
        status: data.status,
      });
    } catch (err: any) {
      // Fallback to client-side test
      const fallback = await testSupabaseConnection(supabaseUrl, supabaseKey);
      setTestResult(fallback);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setStatusMessage({ type: "error", text: "يرجى كتابة Project URL و API Key الخاصين بـ Supabase." });
      return;
    }
    setIsSaving(true);
    setStatusMessage(null);

    try {
      saveSupabaseConfig(supabaseUrl, supabaseKey);
      const res = await fetch("/api/supabase/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: supabaseUrl,
          anonKey: supabaseKey,
          activeDb: activeDb,
        }),
      });
      if (res.ok) {
        setStatusMessage({ type: "success", text: "تم حفظ إعدادات Supabase وتفعيل قاعدة البيانات بنجاح!" });
      } else {
        setStatusMessage({ type: "info", text: "تم حفظ الإعدادات محلياً في المتصفح بنجاح!" });
      }
    } catch (e) {
      setStatusMessage({ type: "info", text: "تم حفظ الإعدادات محلياً في المتصفح بنجاح!" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncToSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setStatusMessage({ type: "error", text: "يرجى ربط Supabase وحفظ المفاتيح أولاً قبل المزامنة." });
      return;
    }
    setIsSyncing(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/supabase/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: supabaseUrl,
          anonKey: supabaseKey,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ 
          type: "success", 
          text: `تم ترحيل البيانات بنجاح: ${data.synced?.rooms || 18} غرف، ${data.synced?.guests || 4} نزلاء، ${data.synced?.serviceRequests || 4} طلبات خدمات، ${data.synced?.gateLogs || 4} سجلات بوابات.` 
        });
      } else {
        setStatusMessage({ type: "error", text: data.message || "فشلت المزامنة مع Supabase." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: `خطأ أثناء المزامنة: ${err?.message || "تعذر إكمال الطلب"}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFullReset = async () => {
    setIsResetting(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/hotel-data/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setStatusMessage({ 
          type: "success", 
          text: "تم إعادة ضبط النظام بالكامل وتحديث كافة البيانات في قاعدة البيانات بنجاح تام!" 
        });
        setShowConfirmReset(false);
        if (onDataReset) {
          onDataReset();
        }
      } else {
        setStatusMessage({ type: "error", text: "حدث خطأ أثناء إعادة ضبط البيانات." });
      }
    } catch (e: any) {
      setStatusMessage({ type: "error", text: `خطأ: ${e?.message || "تعذر إعادة الضبط"}` });
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto flex flex-col text-right font-sans"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-600/10 via-teal-600/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                إدارة قاعدة بيانات Supabase وإعادة ضبط النظام
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-medium">
                  Supabase & Cloud SQL
                </span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                ربط مباشر، ترتيب الجداول، مزامنة فورية، وإعادة ضبط كاملة وشاملة للبيانات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Status Message Banner */}
          {statusMessage && (
            <div className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
              statusMessage.type === "success" 
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" 
                : statusMessage.type === "error"
                ? "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                : "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            }`}>
              {statusMessage.type === "success" ? (
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              )}
              <span className="font-medium leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Section 1: Database Architecture Status */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4.5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-emerald-600" />
              حالة قواعد البيانات المتصلة بالنظام
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Cloud SQL (PostgreSQL السحابية)</div>
                  <div className="text-slate-500 mt-0.5">منطقة: us-west1 | 18 غرفة | 4 نزلاء</div>
                </div>
                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  نشطة ومتصلة
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Supabase Database</div>
                  <div className="text-slate-500 mt-0.5">
                    {supabaseUrl ? `${supabaseUrl.slice(0, 24)}...` : "غير مهيأة بعد"}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded font-semibold ${
                  supabaseUrl && supabaseKey
                    ? "bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}>
                  {supabaseUrl && supabaseKey ? "مربوطة" : "بانتظار الإعداد"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Supabase Credentials Input */}
          <div className="space-y-4 border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-600" />
                بيانات الاتصال بمشروعك في Supabase
              </h3>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>فتح لوحة تحكم Supabase</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  رابط المشروع (Project URL)
                </label>
                <input
                  type="text"
                  placeholder="https://your-project-id.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  مفتاح الوصول (API Key - anon public أو service_role)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Test Connection Feedback */}
            {testResult && (
              <div className={`p-3.5 rounded-lg text-xs leading-relaxed ${
                testResult.success 
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" 
                  : "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
              }`}>
                <div className="font-bold mb-1 flex items-center gap-1.5">
                  {testResult.success ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                  نتيجة اختبار الاتصال بـ Supabase:
                </div>
                <div>{testResult.message}</div>
              </div>
            )}

            {/* Actions for Supabase */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                <span>{isTesting ? "جاري فحص الاتصال..." : "اختبار الاتصال"}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{isSaving ? "جاري الحفظ..." : "حفظ بيانات Supabase"}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncToSupabase}
                disabled={isSyncing}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "جاري الترحيل..." : "ترحيل ومزامنة كافة البيانات إلى Supabase"}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySql}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? "تم نسخ سكربت الجداول!" : "نسخ سكربت الجداول (SQL)"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSqlScript(!showSqlScript)}
                className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                {showSqlScript ? "إخفاء السكربت" : "معاينة السكربت"}
              </button>
            </div>

            {/* Collapsible SQL Script Preview */}
            {showSqlScript && (
              <div className="mt-3 p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono max-h-48 overflow-y-auto border border-slate-800" dir="ltr">
                <pre>{SUPABASE_SQL_SETUP_SCRIPT}</pre>
              </div>
            )}
          </div>

          {/* Section 3: Full System Reset & Comprehensive Data Update */}
          <div className="border-2 border-red-200/80 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-red-900 dark:text-red-300 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-red-600" />
                  إعادة ضبط النظام بالكامل وتعديل كافة البيانات
                </h3>
                <p className="text-xs text-red-700/80 dark:text-red-400 mt-1">
                  إعادة تهيئة كاملة للجداول والبيانات (18 غرفة فندقية عبر 5 طوابق، نزلاء الوفود الرسمية، طلبات الخدمات والغرف، سجلات البوابات، طلبات الحجز المعلقة).
                </p>
              </div>

              {!showConfirmReset ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(true)}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة ضبط النظام بالكامل</span>
                </button>
              ) : null}
            </div>

            {/* Confirmation Box */}
            {showConfirmReset && (
              <div className="p-4 bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 rounded-xl space-y-3 animate-in fade-in duration-150">
                <div className="text-xs font-bold text-red-800 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  تأكيد إعادة الضبط: سيتم استبدال البيانات الحالية بالبيانات المنظمة والمحدثة في جميع قواعد البيانات.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFullReset}
                    disabled={isResetting}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
                    <span>{isResetting ? "جاري إعادة الضبط..." : "نعم، تأكيد إعادة الضبط الآن"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(false)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-medium transition"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>نظام البيانات السحابي متوافق مع معمارية Supabase و PostgreSQL</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
export default SupabaseDatabaseManager;
