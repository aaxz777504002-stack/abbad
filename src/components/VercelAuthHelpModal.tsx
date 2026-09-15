import React, { useState } from "react";
import { X, ExternalLink, Copy, Check, ShieldAlert, Cloud, HelpCircle, Key, RefreshCw, AlertCircle } from "lucide-react";
import { setManualAccessToken } from "../lib/firebase";

interface VercelAuthHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetryLogin: () => void;
  errorDetails?: { code: string; message: string; domain?: string } | null;
  currentProjectId: string;
}

export const VercelAuthHelpModal: React.FC<VercelAuthHelpModalProps> = ({
  isOpen,
  onClose,
  onRetryLogin,
  errorDetails,
  currentProjectId
}) => {
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedProjectId, setCopiedProjectId] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState("");
  const [manualTokenSuccess, setManualTokenSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"instructions" | "manual_token">("instructions");

  if (!isOpen) return null;

  const currentDomain = typeof window !== "undefined" ? window.location.hostname : "";
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${currentProjectId}/authentication/settings`;

  const copyToClipboard = (text: string, type: "domain" | "project") => {
    try {
      navigator.clipboard.writeText(text);
      if (type === "domain") {
        setCopiedDomain(true);
        setTimeout(() => setCopiedDomain(false), 2000);
      } else {
        setCopiedProjectId(true);
        setTimeout(() => setCopiedProjectId(false), 2000);
      }
    } catch (e) {
      console.warn("Clipboard copy failed:", e);
    }
  };

  const handleApplyManualToken = () => {
    if (!manualTokenInput.trim()) return;
    setManualAccessToken(manualTokenInput.trim());
    setManualTokenSuccess(true);
    setTimeout(() => {
      onClose();
      onRetryLogin();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl text-slate-100 shadow-2xl overflow-hidden flex flex-col my-8">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>دليل تشغيل المزامنة السحابية على Vercel و GitHub</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                حل مشكلة "فشل تسجيل الدخول باستخدام حساب قوقل" وإضافة النطاق المصرح به
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("instructions")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "instructions"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>خطوات التصريح في Firebase (الحل الجذري)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manual_token")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "manual_token"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>رمز وصول يدوي (بديل فوري)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm overflow-y-auto max-h-[70vh]">
          
          {errorDetails && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-rose-200 space-y-1">
              <div className="font-bold flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>تفاصيل الخطأ البرمجي المستلم:</span>
              </div>
              <p className="text-[11px] font-mono text-rose-300 mr-6 break-all" dir="ltr">
                {errorDetails.code || "unknown_error"}: {errorDetails.message}
              </p>
            </div>
          )}

          {activeTab === "instructions" ? (
            <>
              {/* Reason Explanation */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-amber-300 text-xs sm:text-sm flex items-center gap-2">
                  <span>💡 ما سبب ظهور هذا الخطأ عند رفع الموقع على Vercel؟</span>
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  لحماية أمان بياناتك، تمنع خدمات Google و Firebase أي نطاق جديد (مثل رابط Vercel) من تسجيل الدخول بحساب قوقل حتى تقوم أنت بإضافة النطاق يدوياً في قائمة 
                  <strong className="text-white mx-1">"النطاقات المصرح بها (Authorized Domains)"</strong> في وحدة تحكم Firebase الخاصة بالمشروع.
                </p>
              </div>

              {/* Current Domain & Project Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Domain Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <span className="text-[11px] text-slate-400 font-medium block">نطاق موقعك على Vercel (المطلوب نسخه):</span>
                  <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2">
                    <span className="font-mono text-xs text-emerald-400 truncate" dir="ltr">{currentDomain}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentDomain, "domain")}
                      className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition shrink-0 cursor-pointer"
                      title="نسخ النطاق"
                    >
                      {copiedDomain ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Project ID Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <span className="text-[11px] text-slate-400 font-medium block">معرف مشروع Firebase:</span>
                  <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2">
                    <span className="font-mono text-xs text-amber-300 truncate" dir="ltr">{currentProjectId}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentProjectId, "project")}
                      className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition shrink-0 cursor-pointer"
                      title="نسخ معرف المشروع"
                    >
                      {copiedProjectId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Button to Open Firebase Console */}
              <div>
                <a
                  href={firebaseSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح صفحة إعدادات النطاقات في Firebase Console ↗</span>
                </a>
              </div>

              {/* 4 Easy Steps */}
              <div className="space-y-3 pt-2">
                <h5 className="font-black text-xs sm:text-sm text-slate-200">الخطوات السريعة لحل المشكلة (تأخذ 30 ثانية فقط):</h5>
                
                <ol className="space-y-2.5 text-xs text-slate-300 list-decimal list-inside pr-1">
                  <li className="leading-relaxed">
                    اضغط الزر الأخضر أعلاه <strong className="text-emerald-400">"فتح صفحة إعدادات النطاقات"</strong> (تأكد من فتحها بنفس حساب Google).
                  </li>
                  <li className="leading-relaxed">
                    من الصفحة التي ستفتح، انزل إلى قسم <strong className="text-white">Authorized domains (النطاقات المصرح بها)</strong>.
                  </li>
                  <li className="leading-relaxed">
                    اضغط على زر <strong className="text-amber-400">"Add domain / إضافة نطاق"</strong> والصق نطاقك: <code className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded font-mono" dir="ltr">{currentDomain}</code>.
                  </li>
                  <li className="leading-relaxed">
                    اضغط <strong className="text-white">Save (حفظ)</strong>، ثم ارجع هنا واضغط زر <strong className="text-emerald-400">"إعادة محاولة المزامنة"</strong> بالأسفل، وسيعمل تسجيل الدخول وحفظ البيانات سحابياً فوراً!
                  </li>
                </ol>
              </div>

              {/* Notice for popup blocker */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
                <span className="text-amber-400 text-base leading-none">⚠️</span>
                <span>
                  ملاحظة هامة: إذا لم تظهر نافذة اختيار حساب قوقل، تأكد من أن المتصفح لم يقم بحظر النوافذ المنبثقة (Popups). اضغط على أيقونة القفل أو شريط العنوان واسمح بالنوافذ المنبثقة لهذا الموقع.
                </span>
              </div>
            </>
          ) : (
            /* Manual Token Tab */
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl space-y-2 text-xs text-slate-300">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>حل بديل: إدخال رمز وصول قوقل شيت (Google Sheets Access Token) يدوي</span>
                </h4>
                <p>
                  إذا كنت ترغب في تشغيل المزامنة فوراً دون انتظار تعديل إعدادات Firebase Console، يمكنك إدخال OAuth Access Token صالح تم إنشاؤه عبر Google OAuth Playground أو عبر تطبيقك، وسيتم ربطه بجدول قوقل شيت مباشرة.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  أدخل رمز الوصول (Bearer Access Token):
                </label>
                <input
                  type="password"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  placeholder="ya29.a0AfH6SM..."
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                  dir="ltr"
                />
              </div>

              {manualTokenSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>تم حفظ رمز الوصول بنجاح! جاري إعادة محاولة المزامنة...</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleApplyManualToken}
                disabled={!manualTokenInput.trim()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                تطبيق رمز الوصول وبدء المزامنة
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer text-center"
          >
            إغلاق
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onRetryLogin();
            }}
            className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة محاولة المزامنة الآن ⚡</span>
          </button>
        </div>

      </div>
    </div>
  );
};
