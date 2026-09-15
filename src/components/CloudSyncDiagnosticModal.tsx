import React, { useState } from "react";
import { 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  X, 
  Globe, 
  Key, 
  RefreshCw, 
  Sliders, 
  Layers, 
  Check, 
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  WifiOff,
  Wifi
} from "lucide-react";
import { 
  AuthErrorDetails, 
  getCurrentDomain, 
  setManualAccessToken, 
  saveCustomFirebaseConfig, 
  resetCustomFirebaseConfig, 
  hasCustomFirebaseConfig,
  googleSignInRedirect
} from "../lib/firebase";

interface CloudSyncDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorDetails?: AuthErrorDetails | null;
  onRetryLogin: () => Promise<void>;
  onManualTokenApplied?: () => void;
}

export const CloudSyncDiagnosticModal: React.FC<CloudSyncDiagnosticModalProps> = ({
  isOpen,
  onClose,
  errorDetails,
  onRetryLogin,
  onManualTokenApplied
}) => {
  const [activeTab, setActiveTab] = useState<"quick_fix" | "manual_token" | "custom_firebase">("quick_fix");
  const [copied, setCopied] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);
  const [customJsonConfig, setCustomJsonConfig] = useState("");
  const [customConfigError, setCustomConfigError] = useState("");

  if (!isOpen) return null;

  const currentDomain = getCurrentDomain() || (typeof window !== "undefined" ? window.location.hostname : "your-app.vercel.app");
  const isVercel = currentDomain.includes("vercel.app");

  const handleCopyDomain = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleApplyManualToken = () => {
    if (!manualToken.trim()) return;
    setManualAccessToken(manualToken.trim());
    if (onManualTokenApplied) onManualTokenApplied();
    onClose();
  };

  const handleSaveCustomFirebase = () => {
    setCustomConfigError("");
    try {
      const parsed = JSON.parse(customJsonConfig);
      if (!parsed.apiKey || !parsed.authDomain || !parsed.projectId) {
        setCustomConfigError("يجب أن يحتوي كائن Firebase على apiKey و authDomain و projectId على الأقل.");
        return;
      }
      saveCustomFirebaseConfig(parsed);
    } catch (e: any) {
      setCustomConfigError("صيغة JSON غير صحيحة. يرجى التأكد من نسخ كود Firebase بشكل سليم.");
    }
  };

  const handleExecuteRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetryLogin();
      onClose();
    } catch (e) {
      console.error("Retry failed:", e);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 text-slate-100">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950/70 to-slate-900 p-5 border-b border-emerald-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <span>حل مشكلة المزامنة السحابية على Vercel و Google</span>
                {isVercel && (
                  <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/30 font-mono">
                    Vercel Detected
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                إرشادات تفعيل نطاق الموقع في Google / Firebase للمزامنة مع جداول Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Domain Banner */}
        <div className="p-4 mx-5 mt-5 bg-slate-950/80 border border-emerald-800/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400 block sm:inline">نطاق موقعك الحالي (Domain): </span>
              <span className="font-mono font-bold text-emerald-300 select-all">{currentDomain}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleCopyDomain(currentDomain)}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "تم النسخ بنجاح!" : "نسخ النطاق"}</span>
            </button>
            {isVercel && (
              <button
                onClick={() => handleCopyDomain("vercel.app")}
                title="نسخ vercel.app ليشمل كل الروابط الفرعية"
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-mono transition cursor-pointer border border-slate-700"
              >
                نسخ vercel.app
              </button>
            )}
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-800 px-5 pt-3 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab("quick_fix")}
            className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === "quick_fix"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>الحل الرسمي (إضافة النطاق في فيربيز)</span>
          </button>
          <button
            onClick={() => setActiveTab("manual_token")}
            className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === "manual_token"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>رمز وصول يدوي (بدون إعدادات)</span>
          </button>
          <button
            onClick={() => setActiveTab("custom_firebase")}
            className={`pb-3 px-3 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === "custom_firebase"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>مشروع Firebase خاص بك</span>
          </button>
        </div>

        {/* Tab 1: Quick Fix (Firebase Authorized Domains & Popup Handling & Network Errors) */}
        {activeTab === "quick_fix" && (
          <div className="p-5 space-y-4">
            {errorDetails?.isNetworkError ? (
              <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-4 text-xs text-rose-100 leading-relaxed space-y-3">
                <div className="flex items-start gap-3">
                  <WifiOff className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-rose-300 block mb-1 text-sm font-black">
                      تعذر الاتصال بالشبكة (Network Request Failed)
                    </strong>
                    <p className="text-slate-300 leading-relaxed">
                      فشل الاتصال بخوادم Google/Firebase المصادقة. قد يرجع ذلك إلى:
                    </p>
                    <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-300">
                      <li>تذبذب مؤقت أو انقطاع في اتصال الإنترنت.</li>
                      <li>تفعيل إضافة مانع الإعلانات (AdBlock / Brave Shields) قد يحجب خوادم المصادقة. عطلها لهذا الموقع.</li>
                      <li>حظر ملفات تعريف الارتباط للطرف الثالث (Third-Party Cookies) الذي قد يعيق النوافذ المنبثقة.</li>
                    </ul>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleExecuteRetry}
                    disabled={isRetrying}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                    <span>إعادة المحاولة الآن 🔄</span>
                  </button>
                  <button
                    onClick={() => {
                      googleSignInRedirect();
                    }}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>تسجيل الدخول المباشر (Redirect) 🚀</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("manual_token")}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>استخدام رمز وصول مباشر</span>
                  </button>
                </div>
              </div>
            ) : errorDetails?.isPopupBlocked ? (
              <div className="bg-sky-500/15 border border-sky-500/30 rounded-2xl p-4 text-xs text-sky-100 leading-relaxed space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-sky-300 block mb-1 text-sm font-black">قام المتصفح بحظر النافذة المنبثقة (Pop-up Blocked)</strong>
                    <p className="text-slate-300">
                      بعض المتصفحات (خصوصاً على الهواتف الذكية أو Safari أو وضع التصفح المتخفي) تحظر النوافذ المنبثقة تلقائياً. 
                      الحل الأسهل هو الضغط على زر <strong>تسجيل الدخول بإعادة التوجيه (Redirect)</strong> أدناه:
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={() => {
                      googleSignInRedirect();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>تسجيل الدخول المباشر فوراً (Redirect) 🚀</span>
                  </button>
                  <button
                    onClick={handleExecuteRetry}
                    disabled={isRetrying}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>إعادة تجربة النافذة (Popup)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block mb-1">سبب المشكلة:</strong>
                  تقوم منصة Google و Firebase بحظر تسجيل الدخول لأي موقع جديد لحمايتك، حتى يتم إدراج رابط الموقع (Domain) ضمن قائمة <strong>النطاقات المصرح بها (Authorized Domains)</strong>.
                </div>
              </div>
            )}

            <div className="space-y-3 text-xs text-slate-300">
              <div className="font-extrabold text-sm text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs">
                  ✓
                </span>
                <span>خطوات الحل البسيطة (تستغرق دقيقة واحدة):</span>
              </div>

              <ol className="space-y-2.5 pr-2 mr-2 border-r border-slate-800 text-slate-300 text-xs">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400">1.</span>
                  <div>
                    افتح لوحة تحكم 
                    <a 
                      href="https://console.firebase.google.com" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-emerald-400 font-bold underline inline-flex items-center gap-1 mx-1 hover:text-emerald-300"
                    >
                      <span>Firebase Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    (سجّل الدخول بنفس حساب قوقل الخاص بك).
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400">2.</span>
                  <div>
                    اختر مشروعك، ثم انتقل من القائمة الجانبية إلى:
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-300 font-mono mx-1">
                      Authentication
                    </span>
                    ثم اختر تبويب
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-300 font-mono mx-1">
                      Settings (الإعدادات)
                    </span>.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400">3.</span>
                  <div>
                    انزل إلى قسم
                    <strong className="text-white mx-1">Authorized domains (النطاقات المصرح بها)</strong>
                    واضغط على زر
                    <span className="bg-emerald-800/70 text-white font-bold px-2 py-0.5 rounded mx-1">
                      Add domain (إضافة نطاق)
                    </span>.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400">4.</span>
                  <div>
                    الصق نطاق Vercel المنسوخ (
                    <code className="font-mono text-emerald-300 bg-slate-950 px-1 py-0.5 rounded">{currentDomain}</code>
                    أو ببساطة <code className="font-mono text-emerald-300 bg-slate-950 px-1 py-0.5 rounded">vercel.app</code>
                    ) ثم اضغط <strong>Save (حفظ)</strong>.
                  </div>
                </li>
              </ol>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={handleExecuteRetry}
                disabled={isRetrying}
                className="w-full sm:flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
                <span>{isRetrying ? "جارٍ تسجيل الدخول..." : "إعادة محاولة تسجيل الدخول بحساب Google الآن ⚡"}</span>
              </button>
              <button
                onClick={() => googleSignInRedirect()}
                title="في حال كان المتصفح يحظر النوافذ المنبثقة"
                className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <span>تسجيل دخول بإعادة التوجيه (Redirect)</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Manual Access Token */}
        {activeTab === "manual_token" && (
          <div className="p-5 space-y-4">
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-2xl p-4 text-xs text-emerald-200/90 leading-relaxed">
              <strong className="text-emerald-300 block mb-1">المزامنة المباشرة بدون الحاجة لتعديل فيربيز:</strong>
              إذا كنت تفضل ربط قوقل شيت فوراً، يمكنك إدخال رمز تصريح وصول (OAuth Access Token) يحتوي على صلاحيات Google Sheets. سيقوم النظام بحفظه محلياً ومزامنة جدولك فوراً.
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                رمز وصول قوقل (Google OAuth Access Token):
              </label>
              <textarea
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="الصق الرمز المبتدئ بـ ya29... هنا"
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 outline-none"
              />
              <p className="text-[11px] text-slate-400">
                💡 يمكنك الحصول على الرمز بسهولة من 
                <a 
                  href="https://developers.google.com/oauthplayground" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-emerald-400 underline font-bold mx-1 inline-flex items-center gap-0.5"
                >
                  OAuth 2.0 Playground
                  <ExternalLink className="w-3 h-3" />
                </a>
                واختيار Google Sheets API v4.
              </p>
            </div>

            <button
              onClick={handleApplyManualToken}
              disabled={!manualToken.trim()}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <CheckCircle className="w-4 h-4" />
              <span>تطبيق الرمز وتفعيل المزامنة السحابية فوراً</span>
            </button>
          </div>
        )}

        {/* Tab 3: Custom Firebase Config */}
        {activeTab === "custom_firebase" && (
          <div className="p-5 space-y-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed">
              إذا كنت تملك مشروع Firebase خاص بك وتريد استخدامه على Vercel بحرية كاملة، يمكنك لصق إعدادات الـ Web App الخاصة بك هنا:
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                كود إعدادات Firebase (JSON Config):
              </label>
              <textarea
                value={customJsonConfig}
                onChange={(e) => {
                  setCustomJsonConfig(e.target.value);
                  setCustomConfigError("");
                }}
                placeholder={'{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-project.firebaseapp.com",\n  "projectId": "my-project",\n  "storageBucket": "my-project.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}'}
                rows={6}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 outline-none"
              />
              {customConfigError && (
                <p className="text-xs text-rose-400 font-bold">{customConfigError}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveCustomFirebase}
                disabled={!customJsonConfig.trim()}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <CheckCircle className="w-4 h-4" />
                <span>حفظ المشروع المخصص والاتصال به</span>
              </button>
              {hasCustomFirebaseConfig() && (
                <button
                  onClick={() => resetCustomFirebaseConfig()}
                  className="px-4 py-3 bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold text-xs rounded-xl border border-rose-800/40 transition cursor-pointer"
                >
                  استعادة الافتراضي
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-950/60 px-5 py-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>بياناتك محفوظة بأمان محلياً حتى في حال انقطاع المزامنة السحابية.</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
