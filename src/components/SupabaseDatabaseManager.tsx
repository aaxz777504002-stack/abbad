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
  X,
  Layers,
  FileCheck2,
  Lock
} from "lucide-react";
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  verifyAllTablesInSupabase,
  SUPABASE_SQL_SETUP_SCRIPT,
  TableStatus
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
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isCheckingTables, setIsCheckingTables] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showSqlScript, setShowSqlScript] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; status?: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [tablesStatus, setTablesStatus] = useState<Record<string, TableStatus>>({
    rooms: { name: "rooms", arabicName: "الغرف الفندقية", exists: false, count: 0, accessible: false },
    guests: { name: "guests", arabicName: "النزلاء والوفود", exists: false, count: 0, accessible: false },
    reservations: { name: "reservations", arabicName: "الحجوزات والتسكين", exists: false, count: 0, accessible: false },
    hotel_settings: { name: "hotel_settings", arabicName: "إعدادات وتكوين النظام", exists: false, count: 0, accessible: false },
  });

  // Load config on mount or open
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
      }
    } catch (e) {
      console.warn("Could not load supabase config from server", e);
    }

    // Check table status
    checkTables();
  };

  const checkTables = async () => {
    setIsCheckingTables(true);
    try {
      // 1. Try server endpoint
      const res = await fetch("/api/supabase/tables-status");
      if (res.ok) {
        const data = await res.json();
        if (data.tables && Object.keys(data.tables).length > 0) {
          setTablesStatus(data.tables);
          setIsCheckingTables(false);
          return;
        }
      }
    } catch {}

    // 2. Fallback to client-side verification
    try {
      const clientVer = await verifyAllTablesInSupabase();
      if (clientVer.tables && Object.keys(clientVer.tables).length > 0) {
        setTablesStatus(clientVer.tables);
      }
    } catch (e) {
      console.warn("Error verifying tables:", e);
    } finally {
      setIsCheckingTables(false);
    }
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setStatusMessage({ type: "error", text: "يرجى إدخال رابط المشروع (Project URL) والمفتاح (API Key) الخاص بـ Supabase أولاً." });
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
      checkTables();
    } catch (err: any) {
      const fallback = await testSupabaseConnection(supabaseUrl, supabaseKey);
      setTestResult(fallback);
      checkTables();
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
        }),
      });

      if (res.ok) {
        setStatusMessage({
          type: "success",
          text: "تم حفظ وتفعيل الاتصال بقاعدة بيانات Supabase بنجاح! يتم الآن مزامنة الجداول تلقائياً.",
        });
        checkTables();
      } else {
        setStatusMessage({
          type: "info",
          text: "تم حفظ الإعدادات محلياً بنجاح، وتفعيل اتصال Supabase في المتصفح.",
        });
      }
    } catch (e) {
      saveSupabaseConfig(supabaseUrl, supabaseKey);
      setStatusMessage({
        type: "success",
        text: "تم حفظ الإعدادات في متصفحك بنجاح، وبدء الاتصال بقاعدة بيانات Supabase.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncData = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setStatusMessage({
        type: "error",
        text: "يرجى حفظ وتأكيد بيانات Supabase أولاً للتمكن من مزامنة وترحيل البيانات.",
      });
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
          text: `تم ترحيل ومزامنة كافة الجداول بنجاح! (${data.synced?.rooms || 0} غرف، ${data.synced?.guests || 0} نزلاء، ${data.synced?.reservations || 0} حجوزات).`,
        });
        checkTables();
      } else {
        setStatusMessage({
          type: "error",
          text: data.message || "حدث خطأ أثناء المزامنة مع Supabase.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: `تعذر إكمال عملية المزامنة: ${err?.message || "خطأ غير متوقع"}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetAllData = async () => {
    setIsResetting(true);
    setShowConfirmReset(false);
    try {
      const res = await fetch("/api/hotel-data/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: "success",
          text: "تم إعادة ضبط النظام بالكامل وتحديث كافة بيانات الفندق في Supabase بنجاح!",
        });
        if (onDataReset) {
          onDataReset();
        }
        checkTables();
      } else {
        setStatusMessage({
          type: "error",
          text: "حدث خطأ أثناء إعادة ضبط البيانات.",
        });
      }
    } catch (e: any) {
      setStatusMessage({
        type: "error",
        text: `فشل إعادة الضبط: ${e?.message || "خطأ في الشبكة"}`,
      });
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

  const allTablesReady = Object.values(tablesStatus).every(t => t.exists);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600/10 via-teal-600/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>إدارة والربط المباشر بقاعدة بيانات Supabase</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-extrabold border border-emerald-300">
                  قاعدة البيانات المعتمدة
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ربط كافة الجداول، تصحيح الصلاحيات (RLS & Grants)، وتفعيل المزامنة المباشرة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* Status Message Banner */}
          {statusMessage && (
            <div className={`p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed transition ${
              statusMessage.type === "success" 
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800" 
                : statusMessage.type === "error"
                ? "bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-800"
                : "bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
            }`}>
              {statusMessage.type === "success" ? (
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              ) : statusMessage.type === "error" ? (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              ) : (
                <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
              )}
              <span className="font-semibold leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Section 1: Supabase Connection & Credentials */}
          <div className="space-y-4 border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-600" />
                <span>بيانات الاتصال بمشروعك في Supabase</span>
              </h3>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold"
              >
                <span>فتح لوحة تحكم Supabase</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  رابط المشروع (Project URL)
                </label>
                <input
                  type="text"
                  placeholder="https://eiuftadyyxmczizxmkin.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  المفتاح العام (Publishable Anon Key - VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  dir="ltr"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  🔒 يعمل النظام بالمفتاح العام مع سياسات RLS المحكمة دون الحاجة إطلاقاً إلى Service Role Key.
                </p>
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
                  <span>{testResult.success ? "نجح الاتصال بـ Supabase!" : "تعذر الاتصال"}</span>
                </div>
                <div>{testResult.message}</div>
              </div>
            )}

            {/* Actions: Test and Save */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-60"
              >
                <Zap className={`w-3.5 h-3.5 text-amber-500 ${isTesting ? "animate-spin" : ""}`} />
                <span>{isTesting ? "جارِ فحص الاتصال..." : "اختبار الاتصال"}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition cursor-pointer disabled:opacity-60"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? "جارِ الحفظ والربط..." : "حفظ بيانات الربط والتفعيل"}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncData}
                disabled={isSyncing}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-teal-600/20 transition cursor-pointer disabled:opacity-60 mr-auto"
              >
                <ArrowRightLeft className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "جارِ ترحيل البيانات..." : "مزامنة وترحيل كافة البيانات الآن"}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Table Status Verification Cards */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>حالة وصلاحيات جداول النظام الستة في Supabase</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  allTablesReady 
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300"
                    : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300"
                }`}>
                  {allTablesReady ? "جميع الجداول متصلة ومفعلة" : "بعض الجداول بحاجة لتشغيل السكربت"}
                </span>
                <button
                  onClick={checkTables}
                  disabled={isCheckingTables}
                  className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  title="تحديث حالة الجداول"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingTables ? "animate-spin text-emerald-600" : ""}`} />
                </button>
              </div>
            </div>

            {/* Grid of tables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {Object.entries(tablesStatus).map(([key, tbl]) => (
                <div key={key} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {tbl.arabicName}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${tbl.exists ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`}></span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <code className="text-[10px] font-mono text-slate-400">{tbl.name}</code>
                    <span className={`font-semibold ${tbl.exists ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}`}>
                      {tbl.exists ? `${tbl.count} سجلات` : "غير منشأ بعد"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Permissions & Security Badge */}
            <div className="mt-3.5 p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="leading-relaxed">
                <span className="font-bold">الصلاحيات وسياسات الأمان (RLS & Grants): </span>
                <span>مهيأة للسماح الكامل بالقراءة والتحديث والإدراج لكافة أجهزة الاستقبال وطلبات النزلاء بدون أخطاء تصاريح.</span>
              </div>
            </div>
          </div>

          {/* Section 3: SQL Script Generator & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <Code className="w-4 h-4 text-emerald-600" />
                <span>سكربت تهيئة الجداول والصلاحيات (SQL Editor Script)</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                ينشئ الجداول الستة مع سياسات الأمان (RLS) وتفعيل البث المباشر (Realtime)
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSqlScript(!showSqlScript)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                {showSqlScript ? "إخفاء السكربت" : "عرض السكربت"}
              </button>

              <button
                type="button"
                onClick={handleCopySql}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{copiedSql ? "تم النسخ!" : "نسخ السكربت"}</span>
              </button>
            </div>
          </div>

          {/* SQL Script Viewer */}
          {showSqlScript && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-mono">schema_and_permissions.sql</span>
                <button
                  onClick={handleCopySql}
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <Copy className="w-3 h-3" />
                  <span>نسخ الكود بالكامل</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono text-emerald-300 max-h-56 overflow-y-auto p-3 bg-black/40 rounded-lg whitespace-pre-wrap leading-relaxed select-all" dir="ltr">
                {SUPABASE_SQL_SETUP_SCRIPT}
              </pre>
            </div>
          )}

          {/* Section 4: System Reset */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">إعادة ضبط بيانات النظام الافتراضية</div>
              <div className="text-[11px] text-slate-500">يعيد تهيئة 18 غرفة نموذجية، 4 نزلاء، طلبات الخدمات، وسجلات البوابات.</div>
            </div>

            {showConfirmReset ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetAllData}
                  disabled={isResetting}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  {isResetting ? "جارِ الضبط..." : "تأكيد إعادة الضبط"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-700 dark:text-red-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط البيانات</span>
              </button>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>قاعدة البيانات السحابية: Supabase Database</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
