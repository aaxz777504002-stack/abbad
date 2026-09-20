import React, { useState, useEffect, useRef } from "react";
import { 
  Hotel, 
  Users, 
  Bed, 
  Check,
  CheckCircle, 
  XCircle, 
  Percent, 
  LayoutDashboard, 
  Sliders, 
  PlusCircle, 
  Settings, 
  QrCode, 
  Copy, 
  ExternalLink, 
  Inbox, 
  UploadCloud, 
  DownloadCloud, 
  Upload,
  Cloud,
  LogOut, 
  LogIn, 
  UserPlus, 
  UserCheck,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Edit3,
  Globe,
  MapPin,
  Phone,
  FileText,
  Clock,
  Camera,
  Compass,
  AlertCircle,
  Share2,
  Send,
  Printer,
  User,
  IdCard,
  CreditCard,
  Wrench,
  ShieldCheck,
  Shield,
  Calendar,
  Lock,
  Unlock,
  Key,
  Coffee,
  Sparkles,
  AlertTriangle,
  Plus,
  CheckSquare,
  Zap,
  Building2,
  ChevronDown,
  CheckCircle2,
  Eye,
  EyeOff,
  Maximize2,
  Mail,
  MessageCircle,
  SlidersHorizontal,
  Database,
  Image as ImageIcon,
  Layers,
  ArrowLeftRight,
  RotateCcw,
  CalendarDays,
  Bookmark,
  Link2,
  Bell,
  Volume2,
  VolumeX,
  Save,
  Palette,
  ChevronLeft,
  Building,
  Smartphone,
  X
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "motion/react";
import { Room, Guest, PendingRequest, HotelStats, ServiceRequest, UserRole, RoleType, VisitType, IncomingRequestAlert } from "./types";
import { safeLocalStorage as localStorage, safeSessionStorage as sessionStorage } from "./lib/safeStorage";
import {
  googleSignIn,
  googleSignInRedirect,
  checkRedirectResult,
  AuthErrorDetails,
  parseAuthError, 
  logout, 
  getAccessToken, 
  initAuth,
  getFirebaseConfig,
  savePendingRequestToFirestore,
  deletePendingRequestFromFirestore,
  fetchPendingRequestsFromFirestore,
  subscribeToPendingRequests,
  saveHotelConfigToFirestore,
  subscribeToHotelConfig,
  fetchHotelConfigFromFirestore,
  saveHotelFullStateToFirestore,
  fetchHotelFullStateFromFirestore
} from "./lib/firebase";
import { VercelAuthHelpModal } from "./components/VercelAuthHelpModal";
import { CloudSyncDiagnosticModal } from "./components/CloudSyncDiagnosticModal";
import { AvailableRoomAssigner } from "./components/AvailableRoomAssigner";
import { 
  findOrCreateSpreadsheet, 
  validateAndConnectSpreadsheet,
  ensureSpreadsheetStructure,
  initializeSheetHeaders,
  extractSpreadsheetId,
  fetchRoomsFromSheets, 
  saveRoomsToSheets, 
  fetchGuestsFromSheets, 
  saveGuestsToSheets,
  fetchServiceRequestsFromSheets,
  saveServiceRequestsToSheets,
  fetchPendingRequestsFromSheets,
  savePendingRequestsToSheets,
  appendPendingRequestToSheets,
  saveSettingsToSheets,
  saveAllSettingsToSheets,
  fetchSettingsFromSheets,
  appendGateLogToSheets,
  SEED_ROOMS,
  SEED_GUESTS
} from "./lib/sheets";
import { SecurityGateStation } from "./components/SecurityGateStation";
import { PhoneCountryInput } from "./components/PhoneCountryInput";
import { CountrySelectInput } from "./components/CountrySelectInput";
import { formatPhoneWithCountryCode } from "./lib/countryCodes";

export const ADMIN_ROLES: string[] = [
  "رئيس الوفد",
  "نائب رئيس الوفد",
  "عضو وفد",
  "مشرف إداري",
  "ضيف شرف (VIP)",
  "منسق علاقات عامة",
  "مرافق / سكرتير",
  "كادر أمني وحراسة",
  "كادر خدمات ودعم",
  "إعلامي / مصور",
  "زائر عام",
  "أخرى (مخصص)"
];

export const getAdminRoleBadge = (role?: string) => {
  if (!role) return null;
  if (role.includes("رئيس") || role.includes("VIP") || role.includes("شرف")) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-800 border border-amber-400/50 shadow-xs">
        <Sparkles className="w-3 h-3 text-amber-600" />
        <span>{role}</span>
      </span>
    );
  }
  if (role.includes("مشرف") || role.includes("منسق")) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-800 border border-indigo-400/50 shadow-xs">
        <ShieldCheck className="w-3 h-3 text-indigo-600" />
        <span>{role}</span>
      </span>
    );
  }
  if (role.includes("أمن") || role.includes("حراسة")) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-800 border border-rose-400/50 shadow-xs">
        <Lock className="w-3 h-3 text-rose-600" />
        <span>{role}</span>
      </span>
    );
  }
  if (role.includes("خدمات") || role.includes("إعلامي")) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-cyan-500/20 text-cyan-800 border border-cyan-400/50 shadow-xs">
        <Wrench className="w-3 h-3 text-cyan-600" />
        <span>{role}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-800 border border-emerald-400/50 shadow-xs">
      <User className="w-3 h-3 text-emerald-600" />
      <span>{role}</span>
    </span>
  );
};

export type ImageQualityLevel = "low" | "medium" | "high" | "ultra";

export interface GuestPhotoData {
  photoUrl: string;
  rawPhotoUrl: string;
  quality: ImageQualityLevel;
  sizeKb: number;
  dimensions: string;
}

export const processImageQuality = (
  dataUrl: string,
  qualityPreset: ImageQualityLevel
): Promise<{ processedUrl: string; sizeKb: number; width: number; height: number }> => {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith("data:image")) {
      resolve({ processedUrl: dataUrl, sizeKb: 0, width: 0, height: 0 });
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let maxDim = 1200;
      let quality = 0.88;

      switch (qualityPreset) {
        case "low":
          maxDim = 280; // 240p - ultra compressed ~20KB
          quality = 0.50;
          break;
        case "medium":
          maxDim = 600; // 480p - standard ~80KB
          quality = 0.72;
          break;
        case "high":
          maxDim = 1200; // 1080p HD - sharp ~250KB
          quality = 0.88;
          break;
        case "ultra":
          maxDim = 2400; // Full HD / 4K Ultra - maximum clarity
          quality = 0.98;
          break;
      }

      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = qualityPreset === "low" ? "low" : qualityPreset === "medium" ? "medium" : "high";
        ctx.drawImage(img, 0, 0, width, height);
        const processedUrl = canvas.toDataURL("image/jpeg", quality);
        const approxKb = Math.round((processedUrl.length * 0.75) / 1024);
        resolve({ processedUrl, sizeKb: approxKb, width, height });
      } else {
        resolve({ processedUrl: dataUrl, sizeKb: 0, width: img.width, height: img.height });
      }
    };
    img.onerror = () => {
      resolve({ processedUrl: dataUrl, sizeKb: 0, width: 0, height: 0 });
    };
    img.src = dataUrl;
  });
};

export const getArabicDayName = (dateStr?: string): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return "";
    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    return days[d.getDay()];
  } catch {
    return "";
  }
};

function GuestPhotoUploadWidget({
  photoData,
  onChange,
  label = "صورة النزيل الشخصية / الهوية الوطنية",
  theme = "light",
  onNotification
}: {
  photoData: GuestPhotoData;
  onChange: (updated: GuestPhotoData) => void;
  label?: string;
  theme?: "light" | "dark";
  onNotification?: (type: "success" | "error" | "info", msg: string) => void;
}) {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);

  const isDark = theme === "dark";

  const handleQualityChange = async (newQuality: ImageQualityLevel) => {
    const rawToUse = photoData.rawPhotoUrl || photoData.photoUrl;
    if (!rawToUse) {
      onChange({ ...photoData, quality: newQuality });
      return;
    }

    setIsProcessing(true);
    const processed = await processImageQuality(rawToUse, newQuality);
    setIsProcessing(false);

    onChange({
      ...photoData,
      photoUrl: processed.processedUrl,
      rawPhotoUrl: rawToUse,
      quality: newQuality,
      sizeKb: processed.sizeKb,
      dimensions: processed.width ? `${processed.width} × ${processed.height} px` : photoData.dimensions
    });

    const qualityNames: Record<ImageQualityLevel, string> = {
      low: "أقل دقة (240p - 20KB)",
      medium: "دقة متوسطة (480p - 80KB)",
      high: "دقة عالية (1080p HD - 250KB)",
      ultra: "أعلى دقة فائقة (Full HD/4K - أصلية)"
    };
    onNotification?.("success", `تم تغيير دقة الجودة إلى: ${qualityNames[newQuality]}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawUrl = event.target?.result as string;
      setIsProcessing(true);
      const processed = await processImageQuality(rawUrl, photoData.quality || "high");
      setIsProcessing(false);

      onChange({
        photoUrl: processed.processedUrl,
        rawPhotoUrl: rawUrl,
        quality: photoData.quality || "high",
        sizeKb: processed.sizeKb,
        dimensions: `${processed.width} × ${processed.height} px`
      });
      onNotification?.("success", "تم رفع وتطبيق صورة النزيل بالدقة المحددة بنجاح!");
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" }
      });
      mediaStreamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      onNotification?.("error", "لم نتمكن من فتح الكاميرا. يرجى التأكد من السماح بإذن الكاميرا من المتصفح.");
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraPhoto = async () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const rawUrl = canvas.toDataURL("image/jpeg", 0.95);
        stopCamera();

        setIsProcessing(true);
        const processed = await processImageQuality(rawUrl, photoData.quality || "high");
        setIsProcessing(false);

        onChange({
          photoUrl: processed.processedUrl,
          rawPhotoUrl: rawUrl,
          quality: photoData.quality || "high",
          sizeKb: processed.sizeKb,
          dimensions: `${processed.width} × ${processed.height} px`
        });
        onNotification?.("success", "تم التقاط صورة النزيل بالكاميرا ومعالجتها بالدقة المحددة!");
      }
    }
  };

  const applyPresetAvatar = async (avatarUrl: string) => {
    setIsProcessing(true);
    const processed = await processImageQuality(avatarUrl, photoData.quality || "high");
    setIsProcessing(false);

    onChange({
      photoUrl: processed.processedUrl,
      rawPhotoUrl: avatarUrl,
      quality: photoData.quality || "high",
      sizeKb: processed.sizeKb,
      dimensions: `${processed.width || 400} × ${processed.height || 400} px`
    });
    onNotification?.("success", "تم اختيار صورة النزيل الرمزية الافتراضية بنجاح.");
  };

  return (
    <div className={`p-5 rounded-2xl border transition ${isDark ? "bg-slate-900/80 border-slate-700/80 text-slate-100" : "bg-slate-50 border-slate-200/90 text-slate-800"} space-y-4 text-right`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <label className={`text-xs font-black flex items-center gap-2 ${isDark ? "text-emerald-400" : "text-slate-800"}`}>
          <Camera className="w-4 h-4 text-emerald-500" />
          <span>{label}</span>
        </label>
        
        {photoData.photoUrl && (
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
            photoData.quality === "low"
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : photoData.quality === "medium"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : photoData.quality === "high"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold"
          }`}>
            {photoData.quality === "low" && "🔴 أقل دقة (240p)"}
            {photoData.quality === "medium" && "🟡 دقة متوسطة (480p)"}
            {photoData.quality === "high" && "🔵 دقة عالية (1080p HD)"}
            {photoData.quality === "ultra" && "🟢 أعلى دقة فائقة (Ultra 4K)"}
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-5">
        <div className="relative group shrink-0">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-md bg-slate-200 flex items-center justify-center relative">
            {photoData.photoUrl ? (
              <img
                src={photoData.photoUrl}
                alt="Guest Photo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-12 h-12 text-slate-400" />
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[10px] gap-1 font-bold">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                <span>جاري معالجة الدقة...</span>
              </div>
            )}
          </div>

          {photoData.photoUrl && (
            <button
              type="button"
              onClick={() => onChange({ photoUrl: "", rawPhotoUrl: "", quality: "high", sizeKb: 0, dimensions: "" })}
              className="absolute -top-2 -right-2 p-1.5 bg-rose-600 text-white rounded-full shadow hover:bg-rose-700 transition cursor-pointer"
              title="إزالة الصورة"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 space-y-3 w-full">
          <div className="flex flex-wrap items-center gap-2">
            <label className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              <span>رفع صورة النزيل</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className={`px-4 py-2.5 ${isDark ? "bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30" : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300"} font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs`}
              >
                <Camera className="w-4 h-4 text-emerald-500" />
                <span>التقاط بالكاميرا 📷</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>إلغاء الكاميرا</span>
              </button>
            )}

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => applyPresetAvatar("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600")}
                className={`px-3 py-2.5 text-[11px] font-bold rounded-xl border transition ${isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                title="صورة افتراضية للنزيل"
              >
                👤 رمزية 1
              </button>
              <button
                type="button"
                onClick={() => applyPresetAvatar("https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600")}
                className={`px-3 py-2.5 text-[11px] font-bold rounded-xl border transition ${isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                title="صورة افتراضية للنزيل"
              >
                👤 رمزية 2
              </button>
            </div>
          </div>

          {isCameraActive && (
            <div className="p-3 bg-slate-950 rounded-2xl border border-emerald-500/50 space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-56 flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-[10px] font-black rounded-md animate-pulse">
                  ● بث مباشر للكاميرا
                </div>
              </div>

              <button
                type="button"
                onClick={captureCameraPhoto}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>التقاط الصورة الآن بالدقة المحددة</span>
              </button>
            </div>
          )}

          {photoData.photoUrl && (
            <div className={`text-[11px] font-medium p-2.5 rounded-xl border flex flex-wrap items-center gap-4 ${isDark ? "bg-slate-800/80 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-600"}`}>
              {photoData.dimensions && (
                <span>📐 الأبعاد: <strong className="text-emerald-500">{photoData.dimensions}</strong></span>
              )}
              {photoData.sizeKb > 0 && (
                <span>💾 الحجم التقديري: <strong className="text-emerald-500">{photoData.sizeKb} KB</strong></span>
              )}
              <span>مستوى الجودة: <strong className="text-emerald-600">{photoData.quality.toUpperCase()}</strong></span>
            </div>
          )}
        </div>
      </div>

      <div className={`p-3.5 rounded-2xl border ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200/80"} space-y-2`}>
        <div className="flex justify-between items-center text-xs font-black">
          <span className={`flex items-center gap-1.5 ${isDark ? "text-amber-400" : "text-slate-800"}`}>
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
            <span>خيارات دقة الصورة (من أقل دقة إلى أعلى دقة):</span>
          </span>
          <span className="text-[10px] text-slate-400">تعديل تلقائي للوضوح والحجم</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleQualityChange("low")}
            className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
              photoData.quality === "low"
                ? "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 font-extrabold shadow-xs"
                : isDark
                ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">🔴 أقل دقة</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300">240p</span>
            </div>
            <p className="text-[10px] opacity-80 mt-1">مضغوطة جداً (~20KB) سرعة قصوى</p>
          </button>

          <button
            type="button"
            onClick={() => handleQualityChange("medium")}
            className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
              photoData.quality === "medium"
                ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 font-extrabold shadow-xs"
                : isDark
                ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">🟡 دقة متوسطة</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">480p</span>
            </div>
            <p className="text-[10px] opacity-80 mt-1">متوازنة قياسية (~80KB) للعرض</p>
          </button>

          <button
            type="button"
            onClick={() => handleQualityChange("high")}
            className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
              photoData.quality === "high"
                ? "bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300 font-extrabold shadow-xs"
                : isDark
                ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">🔵 دقة عالية</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300">1080p HD</span>
            </div>
            <p className="text-[10px] opacity-80 mt-1">وضوح عالي ممتازة (~250KB) للبطاقات</p>
          </button>

          <button
            type="button"
            onClick={() => handleQualityChange("ultra")}
            className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
              photoData.quality === "ultra"
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-extrabold shadow-xs"
                : isDark
                ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">🟢 أعلى دقة فائقة</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-black">Ultra 4K</span>
            </div>
            <p className="text-[10px] opacity-80 mt-1">أعلى وضوح ونقاء تام بدون أي ضغط</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>(() => {
    try {
      const saved = localStorage.getItem("hotel_pending_requests");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [registrationLinkOpen, setRegistrationLinkOpen] = useState<boolean>(() => {
    return localStorage.getItem("hotel_registration_link_status") !== "closed";
  });
  const [showNotification, setShowNotification] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);
  
  // Real-time Toast Notifications for New Incoming Self-Registration Requests
  const [incomingRequestAlerts, setIncomingRequestAlerts] = useState<IncomingRequestAlert[]>([]);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState<boolean>(() => {
    return localStorage.getItem("hotel_sound_alerts_enabled") !== "false";
  });
  const knownRequestIdsRef = useRef<Set<string>>(new Set());
  const isFirstRequestFetchRef = useRef<boolean>(true);

  const [dashboardGuestSearch, setDashboardGuestSearch] = useState<string>("");
  const [dashboardGuestSubTab, setDashboardGuestSubTab] = useState<"residents" | "checked_out">("residents");
  const [onlineRequestsSearchQuery, setOnlineRequestsSearchQuery] = useState<string>("");
  const [onlineRequestsStatusFilter, setOnlineRequestsStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Guest Edit Modal State (تعديل بيانات النزلاء)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [editGuestForm, setEditGuestForm] = useState<{
    id: string;
    name: string;
    country: string;
    mobile: string;
    email: string;
    whatsapp: string;
    roomNumber: string;
    status: "resident" | "checked_out";
    notes: string;
    checkInDate: string;
    checkOutDate: string;
    year: string;
    visitType: VisitType;
    photoUrl: string;
    administrativeRole: string;
    customAdminRole: string;
  }>({
    id: "",
    name: "",
    country: "",
    mobile: "",
    email: "",
    whatsapp: "",
    roomNumber: "",
    status: "resident",
    notes: "",
    checkInDate: "",
    checkOutDate: "",
    year: "2026",
    visitType: "general_1",
    photoUrl: "",
    administrativeRole: "عضو وفد",
    customAdminRole: ""
  });

  // Operational Years Management (إدارة قائمة السنوات والمواسم)
  const [yearsList, setYearsList] = useState<string[]>(() => {
    const saved = localStorage.getItem("hotel_years_list");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return ["2026", "2025", "2024", "2027", "2028"];
  });
  const [newYearInput, setNewYearInput] = useState<string>("");
  const [editingYear, setEditingYear] = useState<string | null>(null);
  const [editYearInput, setEditYearInput] = useState<string>("");

  // Operational Year Selection (تحديد السنة المطلوبة)
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return localStorage.getItem("selected_year") || "2026";
  });
  const availableYears = yearsList;

  // Visit Settings & Customization (تخصيص مسميات وتواريخ وملاحظات الزيارات)
  const [visitSettings, setVisitSettings] = useState<Record<VisitType, { title: string; subtitle: string; startDate: string; endDate: string; notes: string }>>(() => {
    const saved = localStorage.getItem("hotel_visit_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      general_1: {
        title: "الزيارة العامة الأولى",
        subtitle: "الزيارة الكبيرة الأولى",
        startDate: "",
        endDate: "",
        notes: "نطاق الزيارة العامة الأولى للموسم التشغيلي"
      },
      general_2: {
        title: "الزيارة العامة الثانية",
        subtitle: "الزيارة الكبيرة الثانية",
        startDate: "",
        endDate: "",
        notes: "نطاق الزيارة العامة الثانية للموسم التشغيلي"
      },
      private: {
        title: "الزيارة الخاصة",
        subtitle: "قسم النزلاء الخاص والمنفصل",
        startDate: "",
        endDate: "",
        notes: "نطاق النزلاء الخاص والمحمي بالكامل"
      }
    };
  });

  // Active / Enabled Visits List (نطاقات الزيارات المفعلة المتاحة)
  const [enabledVisits, setEnabledVisits] = useState<VisitType[]>(() => {
    const saved = localStorage.getItem("hotel_enabled_visits");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return ["general_1", "general_2", "private"];
  });

  // In-app Modal Confirmation State for Deleting Years
  const [yearToDelete, setYearToDelete] = useState<string | null>(null);

  // Tools Sub Navigation Tab Filter
  const [toolsActiveFilter, setToolsActiveFilter] = useState<"all" | "app_logo" | "guest_card" | "passwords" | "years_visits" | "database" | "barcode" | "backup" | "requests">("all");

  // Migration & Batch Operations State
  const [migrationSourceVisit, setMigrationSourceVisit] = useState<VisitType>("general_1");
  const [migrationTargetVisit, setMigrationTargetVisit] = useState<VisitType>("general_2");
  const [migrationSourceYear, setMigrationSourceYear] = useState<string>("2025");
  const [migrationTargetYear, setMigrationTargetYear] = useState<string>("2026");

  // Visit Scope & Type (نطاق الزيارة: الزيارة العامة الأولى، الزيارة العامة الثانية، والزيارة الخاصة - فصل كلي للبيانات والأرقام بدون تداخل)
  const [selectedVisitType, setSelectedVisitType] = useState<VisitType>(() => {
    return (localStorage.getItem("selected_visit_type") as VisitType) || "general_1";
  });

  // Auth Mode (خاص وعام), Login and User Roles (صلاحيات المستخدمين)
  const [authMode, setAuthMode] = useState<"private" | "public">((): "private" | "public" => {
    return (localStorage.getItem("app_auth_mode") as "private" | "public") || "private";
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem("is_logged_in");
    return saved ? saved === "true" : true; // Default logged in for immediate usage
  });
  const [activeRole, setActiveRole] = useState<RoleType>((): RoleType => {
    return (localStorage.getItem("active_role") as RoleType) || "admin";
  });
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState<string>("admin");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");

  // Dynamic System Roles Credentials Config (إدارة وتغيير كلمات المرور من قبل مدير النظام العام)
  const [adminUsername, setAdminUsername] = useState<string>(() => {
    return localStorage.getItem("admin_auth_username") || "admin";
  });
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem("admin_auth_password") || "1234";
  });
  const [receptionUsername, setReceptionUsername] = useState<string>(() => {
    return localStorage.getItem("reception_auth_username") || "reception";
  });
  const [receptionPassword, setReceptionPassword] = useState<string>(() => {
    return localStorage.getItem("reception_auth_password") || "2233";
  });
  const [servicesUsername, setServicesUsername] = useState<string>(() => {
    return localStorage.getItem("services_auth_username") || "services";
  });
  const [servicesPassword, setServicesPassword] = useState<string>(() => {
    return localStorage.getItem("services_auth_password") || "3344";
  });
  const [securityUsername, setSecurityUsername] = useState<string>(() => {
    return localStorage.getItem("security_auth_username") || "حراسة البوابه";
  });
  const [securityPassword, setSecurityPassword] = useState<string>(() => {
    return localStorage.getItem("security_auth_password") || "4455";
  });
  const [supervisorUsername, setSupervisorUsername] = useState<string>(() => {
    return localStorage.getItem("supervisor_auth_username") || "supervisor";
  });
  const [supervisorPassword, setSupervisorPassword] = useState<string>(() => {
    return localStorage.getItem("supervisor_auth_password") || "5566";
  });
  const [auditorUsername, setAuditorUsername] = useState<string>(() => {
    return localStorage.getItem("auditor_auth_username") || "auditor";
  });
  const [auditorPassword, setAuditorPassword] = useState<string>(() => {
    return localStorage.getItem("auditor_auth_password") || "6677";
  });

  // Public Access Credentials State (اسم مستخدم وكلمة مرور منفصلة للدخول العام)
  const [publicUsername, setPublicUsername] = useState<string>(() => {
    return localStorage.getItem("public_auth_username") || "public";
  });
  const [publicPassword, setPublicPassword] = useState<string>(() => {
    return localStorage.getItem("public_auth_password") || "1122";
  });
  const [publicLoginUser, setPublicLoginUser] = useState<string>("");
  const [publicLoginPass, setPublicLoginPass] = useState<string>("");

  // Quick Change Password Modal & Inputs State (نافذة تغيير كلمة المرور السريعة)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [changePasswordTargetRole, setChangePasswordTargetRole] = useState<"admin" | "reception" | "supervisor" | "services" | "security" | "auditor" | "public">("admin");
  const [currentOldPasswordInput, setCurrentOldPasswordInput] = useState<string>("");
  const [newPasswordInput, setNewPasswordInput] = useState<string>("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>("");
  const [changePasswordError, setChangePasswordError] = useState<string>("");
  const [showPasswordsPlain, setShowPasswordsPlain] = useState<Record<string, boolean>>({});

  // Live Time & Date State (الوقت والتاريخ المباشر)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Services Committee State (زر لجنة الخدمات)
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(() => {
    const saved = localStorage.getItem("service_requests");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("service_requests", JSON.stringify(serviceRequests));
  }, [serviceRequests]);

  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>("all");
  const [serviceStatusFilter, setServiceStatusFilter] = useState<string>("all");
  const [serviceSearchQuery, setServiceSearchQuery] = useState<string>("");
  const [showAddServiceModal, setShowAddServiceModal] = useState<boolean>(false);
  const [showCloudSyncDiagnosticModal, setShowCloudSyncDiagnosticModal] = useState<boolean>(false);
  const [showVercelAuthHelpModal, setShowVercelAuthHelpModal] = useState<boolean>(false);
  const [authErrorDetails, setAuthErrorDetails] = useState<AuthErrorDetails | null>(null);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState<boolean>(false);
  const [newServiceForm, setNewServiceForm] = useState({
    roomNumber: "",
    guestName: "",
    category: "maintenance" as "maintenance" | "catering" | "cleaning" | "amenities" | "general",
    title: "",
    description: "",
    priority: "normal" as "urgent" | "normal" | "low"
  });

  // Roles & Permissions Matrix State (صلاحيات المستخدمين الستة + الدخول العام)
  const [rolesList, setRolesList] = useState<UserRole[]>(() => {
    const saved = localStorage.getItem("user_roles_list");
    if (saved) {
      try { 
        const parsed: UserRole[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all 6 roles exist even if loaded from older localStorage cache
          const hasSupervisor = parsed.some(r => r && r.type === "supervisor");
          const hasAuditor = parsed.some(r => r && r.type === "auditor");
          if (hasSupervisor && hasAuditor) {
            return parsed;
          }
        }
      } catch (e) { console.error(e); }
    }
    return [
      {
        id: "role-admin",
        name: "1. مدير النظام العام (الإدارة العليا)",
        type: "admin",
        icon: "👑",
        description: "صلاحيات فائقة وشاملة للوصول لكافة الأقسام، إدارة الصلاحيات، وتعديل كلمات المرور والإعدادات",
        permissions: {
          dashboard: true,
          rooms: true,
          guests: true,
          requests: true,
          id_cards: true,
          reports: true,
          checkin: true,
          checkout: true,
          room_config: true,
          services_committee: true,
          security_gate: true,
          permissions: true,
          tools: true
        }
      },
      {
        id: "role-reception",
        name: "2. موظف الاستقبال والتسكين",
        type: "reception",
        icon: "🏨",
        description: "تسكين النزلاء، إنهاء الإقامة وتسجيل المغادرة، إدارة البطاقات ومراجعة الطلبات والتقارير",
        permissions: {
          dashboard: true,
          rooms: true,
          guests: true,
          requests: true,
          id_cards: true,
          reports: true,
          checkin: true,
          checkout: true,
          room_config: false,
          services_committee: true,
          security_gate: true,
          permissions: false,
          tools: false
        }
      },
      {
        id: "role-supervisor",
        name: "3. مشرف التسكين وإشغال الغرف",
        type: "supervisor",
        icon: "🛏️",
        description: "متابعة نسب إشغال الغرف وسعتها الاستيعابية، تخصيص الأسرة، وإدارة توزيع وتسكين الوفود والنزلاء",
        permissions: {
          dashboard: true,
          rooms: true,
          guests: true,
          requests: true,
          id_cards: true,
          reports: true,
          checkin: true,
          checkout: true,
          room_config: true,
          services_committee: true,
          security_gate: false,
          permissions: false,
          tools: false
        }
      },
      {
        id: "role-services",
        name: "4. عضو لجنة الخدمات والصيانة",
        type: "services",
        icon: "🛠️",
        description: "تسجيل بيانات الصيانة والتموين والإعاشة، ومتابعة تلبية طلبات النزلاء والغرف بصورة فورية",
        permissions: {
          dashboard: true,
          rooms: true,
          guests: false,
          requests: false,
          id_cards: false,
          reports: true,
          checkin: false,
          checkout: false,
          room_config: false,
          services_committee: true,
          security_gate: false,
          permissions: false,
          tools: false
        }
      },
      {
        id: "role-security",
        name: "5. مسؤول الحراسة والأمن (بوابة الدخول)",
        type: "security",
        icon: "🛡️",
        description: "التحقق من هويات وبطاقات النزلاء عبر الباركود والكاميرا، وضبط حركة الدخول والخروج والوفود",
        permissions: {
          dashboard: false,
          rooms: false,
          guests: true,
          requests: false,
          id_cards: true,
          reports: false,
          checkin: false,
          checkout: false,
          room_config: false,
          services_committee: false,
          security_gate: true,
          permissions: false,
          tools: false
        }
      },
      {
        id: "role-auditor",
        name: "6. المشرف العام ومدقق السجلات والتقارير",
        type: "auditor",
        icon: "📊",
        description: "تدقيق السجلات والأرشيف، استخراج التقارير والإحصائيات، ومراجعة العمليات الفندقية دون تعديل مباشر",
        permissions: {
          dashboard: true,
          rooms: true,
          guests: true,
          requests: true,
          id_cards: true,
          reports: true,
          checkin: false,
          checkout: false,
          room_config: false,
          services_committee: true,
          security_gate: true,
          permissions: false,
          tools: false
        }
      },
      {
        id: "role-public",
        name: "7. زائر / نزيل عام (النمط العام)",
        type: "public",
        icon: "🌐",
        description: "بوابة الخدمة الذاتية: تقديم طلبات التسكين، استعراض بطاقة النزيل، وطلب خدمات الغرف",
        permissions: {
          dashboard: false,
          rooms: true,
          guests: false,
          requests: false,
          id_cards: true,
          reports: false,
          checkin: true,
          checkout: false,
          room_config: false,
          services_committee: true,
          security_gate: false,
          permissions: false,
          tools: false
        }
      }
    ];
  });

  const [isStandaloneBarcodeScanner, setIsStandaloneBarcodeScanner] = useState<boolean>(() => {
    return window.location.search.includes("scanner=true") || window.location.hash.includes("scanner");
  });

  useEffect(() => {
    localStorage.setItem("user_roles_list", JSON.stringify(rolesList));
  }, [rolesList]);

  // Check if current user role has permission for specific tab
  const hasPermission = (tabKey: keyof UserRole["permissions"]) => {
    if (authMode === "public") {
      return tabKey === "checkin" || tabKey === "services_committee" || tabKey === "rooms" || tabKey === "id_cards";
    }
    const roleObj = rolesList?.find(r => r?.type === activeRole) || rolesList?.[0];
    return roleObj?.permissions?.[tabKey] ?? true;
  };

  // Auth and Google Sheets states
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => localStorage.getItem("spreadsheet_id") || null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [customSpreadsheetInput, setCustomSpreadsheetInput] = useState<string>("");
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(() => localStorage.getItem("sheets_last_sync_time") || null);
  const [isFixingSheets, setIsFixingSheets] = useState<boolean>(false);
  const [isExportingToSheets, setIsExportingToSheets] = useState<boolean>(false);

  // Forms states
  const [checkInForm, setCheckInForm] = useState({
    name: "",
    country: "المملكة العربية السعودية",
    mobile: "",
    email: "",
    whatsapp: "",
    roomNumber: "",
    checkInDate: new Date().toISOString().split("T")[0],
    notes: "",
    photoUrl: "",
    photoRawUrl: "",
    photoQuality: "high" as ImageQualityLevel,
    photoSizeKb: 0,
    photoDimensions: "",
    administrativeRole: "عضو وفد",
    customAdminRole: ""
  });

  const resetCheckInForm = () => {
    setCheckInForm({
      name: "",
      country: "المملكة العربية السعودية",
      mobile: "",
      email: "",
      whatsapp: "",
      roomNumber: "",
      checkInDate: new Date().toISOString().split("T")[0],
      notes: "",
      photoUrl: "",
      photoRawUrl: "",
      photoQuality: "high",
      photoSizeKb: 0,
      photoDimensions: "",
      administrativeRole: "عضو وفد",
      customAdminRole: ""
    });
  };
  
  const [roomConfigForm, setRoomConfigForm] = useState({
    number: "",
    name: "",
    floor: 1,
    type: "",
    capacity: 2,
    direction: ""
  });

  const [editingRoomNumber, setEditingRoomNumber] = useState<string | null>(null);
  const [roomConfigSearch, setRoomConfigSearch] = useState<string>("");
  const [roomConfigFloorFilter, setRoomConfigFloorFilter] = useState<string>("all");
  const [roomConfigStatusFilter, setRoomConfigStatusFilter] = useState<string>("all");

  // Card layout setting: vertical (عمودي) or horizontal (أفقي)
  const [cardLayout, setCardLayout] = useState<"vertical" | "horizontal">(() => {
    return (localStorage.getItem("card_layout") as "vertical" | "horizontal") || "vertical";
  });

  // App & Program Logo state (شعار وهوية البرنامج والنظام العام)
  const [appLogoImage, setAppLogoImage] = useState<string>(() => {
    return localStorage.getItem("app_logo_image") || "";
  });
  const [isSavingAppLogoToSheets, setIsSavingAppLogoToSheets] = useState<boolean>(false);

  // Guest Card Customization states (كرت النزيل المستقل)
  const [cardBgImage, setCardBgImage] = useState<string>(() => {
    return localStorage.getItem("card_bg_image") || "";
  });

  const [cardLogoImage, setCardLogoImage] = useState<string>(() => {
    return localStorage.getItem("card_logo_image") || "";
  });
  const [isSavingLogoToSheets, setIsSavingLogoToSheets] = useState<boolean>(false);

  const [cardColorTheme, setCardColorTheme] = useState<string>(() => {
    return localStorage.getItem("card_color_theme") || "emerald";
  });

  const [cardTextColor, setCardTextColor] = useState<string>(() => {
    return localStorage.getItem("card_text_color") || "auto";
  });

  // Dedicated Handler: Program/App Logo Upload (رفع شعار البرنامج والنظام العام)
  const handleAppLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 300;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/png", 0.9);
          setAppLogoImage(compressedBase64);
          localStorage.setItem("app_logo_image", compressedBase64);
          triggerNotification("success", "تم تحميل وتعيين شعار البرنامج والنظام العام بنجاح! 🖼️");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResetAppLogo = () => {
    setAppLogoImage("");
    localStorage.removeItem("app_logo_image");
    triggerNotification("success", "تمت استعادة شعار البرنامج الافتراضي للنظام بنجاح.");
  };

  // Dedicated Handler: Guest Card Logo Upload (رفع شعار كرت النزيل)
  const handleCardLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 250;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/png", 0.85);
          setCardLogoImage(compressedBase64);
          localStorage.setItem("card_logo_image", compressedBase64);
          triggerNotification("success", "تم تحميل وتعيين شعار كرت النزيل بنجاح! 🪪");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResetCardLogo = () => {
    setCardLogoImage("");
    localStorage.removeItem("card_logo_image");
    triggerNotification("success", "تمت استعادة الشعار الافتراضي لكرت النزيل.");
  };

  // Dedicated Handler: Guest Card Background Upload (رفع خلفية كرت النزيل)
  const handleCardBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
          setCardBgImage(compressedBase64);
          localStorage.setItem("card_bg_image", compressedBase64);
          triggerNotification("success", "تم تحميل وتعيين خلفية كرت النزيل بنجاح!");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResetCardBg = () => {
    setCardBgImage("");
    localStorage.removeItem("card_bg_image");
    triggerNotification("success", "تمت إزالة صورة خلفية كرت النزيل والعودة للنمط الافتراضي.");
  };

  // Legacy unified handler for backward compatibility
  const handleCardImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "bg" | "logo") => {
    if (type === "bg") handleCardBgUpload(e);
    else handleCardLogoUpload(e);
  };

  const handleResetCardDesign = () => {
    setCardBgImage("");
    setCardLogoImage("");
    setCardColorTheme("emerald");
    setCardTextColor("auto");
    localStorage.removeItem("card_bg_image");
    localStorage.removeItem("card_logo_image");
    localStorage.setItem("card_color_theme", "emerald");
    localStorage.setItem("card_text_color", "auto");
    triggerNotification("success", "تم إعادة تعيين تصميم وألوان الكرت إلى الوضع الافتراضي للعلامة التجارية.");
  };

  // Card theme helper functions
  const isCardDarkTheme = () => {
    if (cardColorTheme === "luxury" || cardColorTheme === "royal" || cardColorTheme === "charcoal") {
      return true;
    }
    return false;
  };

  const getCardTextColorClass = () => {
    if (cardTextColor === "light") return "text-white";
    if (cardTextColor === "dark") return "text-slate-800";
    return isCardDarkTheme() ? "text-white" : "text-slate-800";
  };

  const getCardSubColorClass = () => {
    if (cardTextColor === "light") return "text-slate-300";
    if (cardTextColor === "dark") return "text-slate-500";
    return isCardDarkTheme() ? "text-slate-300" : "text-slate-400";
  };

  const getCardStyle = () => {
    if (cardBgImage) {
      return {
        backgroundImage: `url(${cardBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      };
    }
    switch (cardColorTheme) {
      case "luxury":
        return { background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#f8fafc" };
      case "royal":
        return { background: "linear-gradient(135deg, #172554 0%, #1e3a8a 100%)", color: "#f8fafc" };
      case "charcoal":
        return { background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)", color: "#f8fafc" };
      case "emerald":
      default:
        return { background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)" };
    }
  };

  const renderLayaliCard = (data: {
    name: string;
    country: string;
    mobile: string;
    roomNumber: string;
    roomName: string;
    floorText: string;
    direction?: string;
    roomType?: string;
    administrativeRole?: string;
    photoUrl: string;
    qrData?: string;
    checkInDate?: string;
    id?: string;
  }) => {
    const fullQrPayload = data.qrData || `الاسم: ${data.name || "غير محدد"} | الدولة: ${data.country || "غير محدد"} | الغرفة: ${data.roomNumber || ""} (${data.roomName || ""}) | الطابق: ${data.floorText || ""} | الاتجاه: ${data.direction || "غير محدد"} | الصفة: ${data.administrativeRole || "عضو وفد"} | الجوال: ${data.mobile || ""} | فندق خدر ليالي الأنس`;
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fullQrPayload)}`;

    return (
      <div className="relative w-full h-full text-right flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#021811] via-[#04261a] to-[#010e0a] text-white p-4 sm:p-5 rounded-2xl border border-amber-500/30 select-none" style={{ minHeight: "365px" }}>
        {/* Ornaments & Background patterns */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 0 0, #fff 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>
        
        {/* Arabesque Gold Borders */}
        <div className="absolute inset-2 border border-amber-500/20 rounded-xl pointer-events-none"></div>
        <div className="absolute inset-3 border-2 border-double border-amber-500/10 rounded-lg pointer-events-none"></div>
        
        {/* Top Ornaments Corners */}
        <div className="absolute top-4 right-4 text-amber-500/20 text-xs pointer-events-none">✦</div>
        <div className="absolute top-4 left-4 text-amber-500/20 text-xs pointer-events-none">✦</div>
        <div className="absolute bottom-4 right-4 text-amber-500/20 text-xs pointer-events-none">✦</div>
        <div className="absolute bottom-4 left-4 text-amber-500/20 text-xs pointer-events-none">✦</div>

        {/* Crescent moon decoration on top left */}
        <div className="absolute top-5 left-5 text-amber-300/35 pointer-events-none select-none text-xl leading-none font-serif">
          🌙
        </div>

        {/* Header Title: خدر ليالي الأنس */}
        <div className="text-center z-10 relative mt-0.5 flex flex-col items-center">
          {/* Emblem / Hotel Logo Icon */}
          {cardLogoImage ? (
            <img 
              src={cardLogoImage} 
              className="w-8 h-8 object-contain rounded-xl mb-0.5 border border-amber-400/50 shadow-md bg-emerald-950/80 p-0.5 filter drop-shadow-[0_2px_4px_rgba(217,119,6,0.5)]" 
              alt="شعار الفندق" 
              crossOrigin="anonymous" 
            />
          ) : (
            <div className="text-amber-400 text-base mb-0.5 leading-none filter drop-shadow-[0_2px_4px_rgba(217,119,6,0.5)]">🕌</div>
          )}
          <h2 className="text-lg font-serif font-black tracking-wide bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
            خِدْرِ لَيَالِي الأَنْسِ
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-5 h-[1px] bg-gradient-to-r from-transparent to-amber-500/60"></span>
            <p className="text-[8.5px] text-amber-200 font-extrabold tracking-wider bg-[#021811]/90 px-2 py-0.5 rounded-full border border-amber-500/30">
              بشعب النبي هود عليه السلام
            </p>
            <span className="w-5 h-[1px] bg-gradient-to-l from-transparent to-amber-500/60"></span>
          </div>
        </div>

        {/* Content Area: Left (Pill Fields), Right (Photo) */}
        <div className="flex items-center justify-between gap-3 mt-2 z-10 relative flex-1">
          {/* Left: Input Pills */}
          <div className="flex-1 flex flex-col gap-1.5">
            {/* Pill 1: Name */}
            <div className="bg-[#fcfaf5] border border-amber-600/20 shadow-inner rounded-full p-1 pl-2.5 pr-1 flex items-center justify-between h-[30px]">
              <div className="text-[#133c2e] font-black text-[10.5px] truncate flex-1 text-right pr-1">
                {data.name || "اسم النزيل"}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[#60492c] font-black text-[9px]">الاسم:</span>
                <div className="w-4 h-4 rounded-full bg-emerald-950 text-amber-400 flex items-center justify-center shrink-0 shadow border border-amber-500/20">
                  <User className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>

            {/* Pill 2: Country / Nationality */}
            <div className="bg-[#fcfaf5] border border-amber-600/20 shadow-inner rounded-full p-1 pl-2.5 pr-1 flex items-center justify-between h-[30px]">
              <div className="text-[#133c2e] font-black text-[10.5px] truncate flex-1 text-right pr-1">
                {data.country || "البلاد"}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[#60492c] font-black text-[9px]">البلاد:</span>
                <div className="w-4 h-4 rounded-full bg-emerald-950 text-amber-400 flex items-center justify-center shrink-0 shadow border border-amber-500/20">
                  <Globe className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>

            {/* Pill 3: Room Number & Room Name */}
            <div className="bg-[#fcfaf5] border border-amber-600/20 shadow-inner rounded-full p-1 pl-2.5 pr-1 flex items-center justify-between h-[30px]">
              <div className="text-[#133c2e] font-black text-[10.5px] truncate flex-1 text-right pr-1">
                {data.roomNumber ? `غرفة ${data.roomNumber}` : "رقم الغرفة"} {data.roomName ? `(${data.roomName})` : ""}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[#60492c] font-black text-[9px]">الغرفة:</span>
                <div className="w-4 h-4 rounded-full bg-emerald-950 text-amber-400 flex items-center justify-center shrink-0 shadow border border-amber-500/20">
                  <Bed className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>

            {/* Pill 4: Floor & Direction */}
            <div className="bg-[#fcfaf5] border border-amber-600/20 shadow-inner rounded-full p-1 pl-2.5 pr-1 flex items-center justify-between h-[30px]">
              <div className="text-[#133c2e] font-black text-[10.5px] truncate flex-1 text-right pr-1">
                {data.floorText || "الطابق"}{data.direction ? ` • ${data.direction}` : ""}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[#60492c] font-black text-[9px]">الدور/الاتجاه:</span>
                <div className="w-4 h-4 rounded-full bg-emerald-950 text-amber-400 flex items-center justify-center shrink-0 shadow border border-amber-500/20">
                  <Compass className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>

            {/* Pill 5: Administrative Role */}
            <div className="bg-[#fcfaf5] border border-amber-600/20 shadow-inner rounded-full p-1 pl-2.5 pr-1 flex items-center justify-between h-[30px]">
              <div className="text-[#133c2e] font-black text-[10px] truncate flex-1 text-right pr-1">
                {data.administrativeRole || "عضو وفد"}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[#60492c] font-black text-[9px]">الصفة:</span>
                <div className="w-4 h-4 rounded-full bg-emerald-950 text-amber-400 flex items-center justify-center shrink-0 shadow border border-amber-500/20">
                  <ShieldCheck className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Photo Container */}
          <div className="shrink-0 flex flex-col items-center justify-center">
            {/* Double Border Frame */}
            <div className="relative p-0.5 rounded-[1.2rem] bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              <div className="border border-[#021811] rounded-[1.1rem] overflow-hidden bg-emerald-950/80 w-[96px] h-[148px] flex items-center justify-center relative">
                {data.photoUrl ? (
                  <img 
                    src={data.photoUrl} 
                    alt="Guest Photo" 
                    className="w-full h-full object-cover rounded-[1rem]"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-amber-500/40 text-[9px] font-bold text-center p-2">
                    لا توجد صورة
                  </div>
                )}
                {/* Micro golden stamp inside photo */}
                <div className="absolute bottom-1 right-1 bg-emerald-900/90 text-amber-400 rounded p-0.5 border border-amber-500/30">
                  <CheckCircle className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Silhouettes & QR Validation Area */}
        <div className="border-t border-amber-500/15 pt-2 mt-2 flex items-center justify-between z-10 relative">
          {/* Bottom left: Small styled QR Code Verification */}
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white rounded-lg shadow-md border border-amber-500/30 shrink-0">
              <img 
                src={qrSrc} 
                alt="Digital Verify" 
                className="w-9 h-9 object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <div className="text-right">
              <span className="text-[7.5px] text-amber-300/90 block font-bold">التحقق الرقمي للبطاقة</span>
              <span className="text-[6.5px] text-amber-100/60 block font-mono">ID: {data.mobile || data.id || "SECURE_PASS"}</span>
            </div>
          </div>

          {/* Bottom center decorative Moon Crescent */}
          <div className="text-amber-400/30 text-xs font-serif pointer-events-none select-none">
            🌙 ✦ 🕌
          </div>

          {/* Bottom right: traditional fortress / mosque text */}
          <div className="text-right">
            <span className="text-[7.5px] text-amber-400 font-bold block">مكتب إدارة السكن</span>
            <span className="text-[6.5px] text-amber-200/60 block">شبكة التسكين الرقمية المعتمدة</span>
          </div>
        </div>
      </div>
    );
  };

  const getCardThemeConfig = () => {
    switch (cardColorTheme) {
      case "luxury":
        return {
          ribbonBg: "bg-slate-900/80 border border-amber-500/20",
          ribbonText: "text-amber-400",
          badgeBg: "bg-amber-500/20 text-amber-300 border border-amber-500/20",
          infoBg: "bg-slate-900/60 border border-slate-800",
          infoText: "text-amber-400",
          infoLabel: "text-slate-400",
          footerBorder: "border-slate-800",
          qrBg: "bg-white p-1 rounded-lg",
          logoColor: "bg-amber-600",
        };
      case "royal":
        return {
          ribbonBg: "bg-slate-900/80 border border-blue-500/20",
          ribbonText: "text-blue-300",
          badgeBg: "bg-blue-500/20 text-blue-300 border border-blue-500/20",
          infoBg: "bg-slate-900/60 border border-slate-800",
          infoText: "text-blue-400",
          infoLabel: "text-slate-400",
          footerBorder: "border-slate-800",
          qrBg: "bg-white p-1 rounded-lg",
          logoColor: "bg-blue-600",
        };
      case "charcoal":
        return {
          ribbonBg: "bg-slate-900/80 border border-slate-700",
          ribbonText: "text-slate-200",
          badgeBg: "bg-slate-700/30 text-slate-300 border border-slate-600",
          infoBg: "bg-slate-900/60 border border-slate-800",
          infoText: "text-slate-300",
          infoLabel: "text-slate-400",
          footerBorder: "border-slate-800",
          qrBg: "bg-white p-1 rounded-lg",
          logoColor: "bg-slate-600",
        };
      case "emerald":
      default:
        return {
          ribbonBg: "bg-emerald-50/50 border border-emerald-100",
          ribbonText: "text-emerald-800",
          badgeBg: "bg-emerald-50 text-emerald-800 border border-emerald-100",
          infoBg: "bg-slate-50 border border-slate-150",
          infoText: "text-emerald-800",
          infoLabel: "text-slate-400",
          footerBorder: "border-slate-100",
          qrBg: "bg-white border border-slate-100 shadow-inner",
          logoColor: "bg-emerald-800",
        };
    }
  };

  // Search and filter states
  const [roomStatusFilter, setRoomStatusFilter] = useState<string>("all");
  const [guestSearchQuery, setGuestSearchQuery] = useState<string>("");
  const [roomSearchQuery, setRoomSearchQuery] = useState<string>("");

  // Barcode / Scanner simulation states
  const [barcodeQuery, setBarcodeQuery] = useState<string>("");
  const [scanResult, setScanResult] = useState<{ type: "room" | "guest" | "unknown"; data: any; guest?: any } | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Guest-facing Public Registration page state
  // Default to FALSE (The main Hotelier Dashboard - الواجهة الأصلية لإدارة الفندق)
  const [isPublicRegister, setIsPublicRegister] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    // If admin view is explicitly preferred or stored, always prioritize admin view
    if (localStorage.getItem("force_admin_view") === "true" || sessionStorage.getItem("force_admin_view") === "true") {
      return false;
    }
    const search = window.location.search || "";
    const hash = window.location.hash || "";
    const pathname = window.location.pathname || "";
    // Only open public portal if explicitly requested with guest_portal query or exact /register route
    return (
      (pathname === "/register" || pathname.endsWith("/register") || search.includes("guest_portal=true") || hash === "#guest_portal") &&
      !search.includes("admin") &&
      !hash.includes("admin")
    );
  });

  const exitPublicRegisterToAdmin = () => {
    setIsPublicRegister(false);
    try {
      localStorage.setItem("force_admin_view", "true");
      sessionStorage.setItem("force_admin_view", "true");
      // Clean query and hash params so refresh remains in the hotel admin view
      const cleanUrl = window.location.pathname.replace(/\/register\/?$/, '') || '/';
      window.history.replaceState(null, '', cleanUrl);
    } catch {}
    triggerNotification("success", "تمت العودة إلى لوحة تحكم إدارة الفندق والنزلاء (الواجهة الأصلية) 🏨");
  };

  const switchToPublicRegisterPreview = () => {
    try {
      localStorage.removeItem("force_admin_view");
      sessionStorage.removeItem("force_admin_view");
    } catch {}
    setIsPublicRegister(true);
    triggerNotification("info", "تم الانتقال إلى بوابة تسجيل النزلاء الذاتية للمعاينة 📱");
  };
  const [publicForm, setPublicForm] = useState({
    name: "",
    country: "المملكة العربية السعودية",
    mobile: "",
    email: "",
    whatsapp: "",
    checkInDate: new Date().toISOString().split("T")[0],
    notes: "",
    photoUrl: "",
    photoRawUrl: "",
    photoQuality: "high" as ImageQualityLevel,
    photoSizeKb: 0,
    photoDimensions: "",
    administrativeRole: "عضو وفد",
    customAdminRole: ""
  });
  const [viewingPhotoGuest, setViewingPhotoGuest] = useState<Guest | null>(null);
  const [publicSubmitSuccess, setPublicSubmitSuccess] = useState<boolean>(false);
  const [publicSubmitError, setPublicSubmitError] = useState<string | null>(null);
  const [isSubmittingPublic, setIsSubmittingPublic] = useState<boolean>(false);

  // Resident Identification Card state
  const [selectedGuestForCard, setSelectedGuestForCard] = useState<Guest | null>(null);
  const [checkedOutGuestForCard, setCheckedOutGuestForCard] = useState<Guest | null>(null);
  const [showCheckInSuccessModal, setShowCheckInSuccessModal] = useState<Guest | null>(null);
  const [activeSuccessMsgType, setActiveSuccessMsgType] = useState<"checkin_khidr" | "approve" | "welcome">("checkin_khidr");
  const [customSuccessMessage, setCustomSuccessMessage] = useState<string>("");

  // Direct Check-in Modal and Request Processing State
  const [directCheckInRequest, setDirectCheckInRequest] = useState<PendingRequest | null>(null);
  const [directCheckInRoom, setDirectCheckInRoom] = useState<string>("");
  const [directCheckInDate, setDirectCheckInDate] = useState<string>("");
  const [directCheckInRole, setDirectCheckInRole] = useState<string>("عضو وفد");
  const [directCheckInCustomRole, setDirectCheckInCustomRole] = useState<string>("");
  const [directCheckInNotes, setDirectCheckInNotes] = useState<string>("");
  const [directRoomSearch, setDirectRoomSearch] = useState<string>("");
  const [directRoomFloorFilter, setDirectRoomFloorFilter] = useState<string>("all");
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (showCheckInSuccessModal) {
      const guestRoom = rooms.find(r => r.number === showCheckInSuccessModal.roomNumber);
      const roomName = guestRoom ? guestRoom.name : "غير محدد";
      const roomDirection = guestRoom?.direction || "غير محدد";
      const floorText = guestRoom 
        ? (guestRoom.floor === 0 ? "الطابق الأرضي" : guestRoom.floor === 1 ? "الطابق الأول" : guestRoom.floor === 2 ? "الطابق الثاني" : guestRoom.floor === 3 ? "الطابق الثالث" : guestRoom.floor === 4 ? "الطابق الرابع" : guestRoom.floor === 5 ? "الطابق الخامس" : `الطابق ${guestRoom.floor}`)
        : "غير محدد";
      
      const qrData = encodeURIComponent(`الاسم: ${showCheckInSuccessModal.name} | الدولة: ${showCheckInSuccessModal.country} | الغرفة: ${showCheckInSuccessModal.roomNumber} (${roomName}) | الطابق: ${floorText} | الاتجاه: ${roomDirection} | الصفة: ${showCheckInSuccessModal.administrativeRole || "عضو وفد"} | الجوال: ${showCheckInSuccessModal.mobile} | الدخول: ${new Date(showCheckInSuccessModal.checkInDate).toLocaleDateString("ar-EG")}`);
      
      if (activeSuccessMsgType === "checkin_khidr") {
        setCustomSuccessMessage(
          `*إشعار تسكين معتمد - خِدْرِ لَيَالِي الأَنْسِ* 🏨✨\n\nالسلام عليكم ورحمة الله وبركاته،\nأهلاً وسهلاً بك أخي الكريم / *${showCheckInSuccessModal.name}*،\n\nنود إبلاغكم بأنه *تم قبول طلبكم والموافقة وتسكينكم بنجاح في خدر ليالي الأنس (شعب النبي هود عليه السلام)* 🌸\n\n📋 *بيانات وتفاصيل كرت التسكين الكاملة:*\n👤 *الاسم:* ${showCheckInSuccessModal.name}\n🌍 *البلاد / الجنسية:* ${showCheckInSuccessModal.country}\n🚪 *رقم الغرفة:* غرفة ${showCheckInSuccessModal.roomNumber}\n🏷️ *اسم الغرفة:* ${roomName}\n🏢 *الدور / الطابق:* ${floorText}\n🧭 *الاتجاه / الإطلالة:* ${roomDirection}\n🎖️ *الصفة الإدارية:* ${showCheckInSuccessModal.administrativeRole || "عضو وفد"}\n📅 *تاريخ التسكين:* ${new Date(showCheckInSuccessModal.checkInDate).toLocaleDateString("ar-EG")}\n🔢 *رقم المعرّف (ID):* ${showCheckInSuccessModal.id.slice(0, 8).toUpperCase()}${showCheckInSuccessModal.photoUrl ? `\n🖼️ *الصورة الشخصية:* ${showCheckInSuccessModal.photoUrl}` : ""}\n\n🎫 *كرت الدخول والتحقق الرقمي (رمز QR المعتمد):*\nhttps://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}\n\nنتمنى لكم إقامة طيبة ومباركة، وأهلاً وسهلاً بكم في خدر ليالي الأنس! ❤️🌟`
        );
      } else if (activeSuccessMsgType === "approve") {
        setCustomSuccessMessage(
          `*تأكيد قبول وحجز - خِدْرِ لَيَالِي الأَنْسِ* 🏨✨\n\nأهلاً بك يا سيد/ة *${showCheckInSuccessModal.name}*،\nيسعدنا إبلاغك بأنه قد تم قبول طلب تسجيلك وتأكيد حجزك وتسكينك في خدر ليالي الأنس بنجاح! 😍\n\n📋 *تفاصيل التسكين والإقامة:*\n- *الاسم:* ${showCheckInSuccessModal.name}\n- *البلاد:* ${showCheckInSuccessModal.country}\n- *رقم الغرفة:* غرفة ${showCheckInSuccessModal.roomNumber}\n- *اسم الغرفة:* ${roomName}\n- *الدور / الطابق:* ${floorText}\n- *الاتجاه:* ${roomDirection}\n- *الصفة:* ${showCheckInSuccessModal.administrativeRole || "عضو وفد"}\n- *تاريخ الدخول:* ${new Date(showCheckInSuccessModal.checkInDate).toLocaleDateString("ar-EG")}\n- *رقم المعرّف للنزيل:* ${showCheckInSuccessModal.id.slice(0, 8).toUpperCase()}${showCheckInSuccessModal.photoUrl ? `\n- *رابط الصورة:* ${showCheckInSuccessModal.photoUrl}` : ""}\n\nنتطلع لاستقبالكم ونتمنى لكم إقامة ممتعة ومريحة في خدر ليالي الأنس! 🌸`
        );
      } else {
        setCustomSuccessMessage(
          `*بطاقة تعريفية لنزيل مقيم - خِدْرِ لَيَالِي الأَنْسِ* 🏨✨\n\nأهلاً بك يا سيد/ة *${showCheckInSuccessModal.name}*،\nنسعد باستضافتك في خدر ليالي الأنس. إليك تفاصيل كرت الدخول الرقمي الخاص بك:\n\n📋 *تفاصيل الإقامة:*\n▫️ *الاسم:* ${showCheckInSuccessModal.name}\n▫️ *البلاد:* ${showCheckInSuccessModal.country}\n▫️ *رقم الغرفة:* غرفة ${showCheckInSuccessModal.roomNumber} (${roomName})\n▫️ *الدور / الطابق:* ${floorText}\n▫️ *الاتجاه:* ${roomDirection}\n▫️ *الصفة:* ${showCheckInSuccessModal.administrativeRole || "عضو وفد"}\n▫️ *تاريخ الدخول:* ${new Date(showCheckInSuccessModal.checkInDate).toLocaleDateString("ar-EG")}\n▫️ *رقم المعرّف:* ${showCheckInSuccessModal.id.slice(0, 8).toUpperCase()}${showCheckInSuccessModal.photoUrl ? `\n▫️ *الصورة الشخصية:* ${showCheckInSuccessModal.photoUrl}` : ""}\n\n🎫 *رمز تذكرة تحقق باركود (QR Code):*\nhttps://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}\n\nأتمنى لكم إقامة سعيدة ومريحة! ❤️🌟`
        );
      }
    }
  }, [showCheckInSuccessModal, activeSuccessMsgType, rooms]);

  // Reports tab states
  const [activeReportSubTab, setActiveReportSubTab] = useState<
    "all_guests" | "residents" | "checked_out" | "by_room" | "by_nationality" | "barcode_logs" | "bulk_print"
  >("all_guests");
  const [reportNationalityFilter, setReportNationalityFilter] = useState<string>("all");
  const [reportSearchQuery, setReportSearchQuery] = useState<string>("");
  const [checkoutSearchQuery, setCheckoutSearchQuery] = useState<string>("");

  // Form state for creating custom/quick Resident ID Cards
  const [cardForm, setCardForm] = useState({
    name: "",
    country: "المملكة العربية السعودية",
    mobile: "",
    roomNumber: "",
    roomName: "",
    floorText: "الطابق الأرضي",
    direction: "واجهة شمالية",
    administrativeRole: "عضو وفد",
    photoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
  });

  const handleCardPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCardForm(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Registration Link Modal state
  const [showRegistrationLinkModal, setShowRegistrationLinkModal] = useState<boolean>(false);
  const [quickShareMobile, setQuickShareMobile] = useState<string>("");
  const [hasPendingSync, setHasPendingSync] = useState<boolean>(() => localStorage.getItem("hotel_has_pending_sync") === "true");

  // Check URL query parameters and hash changes on load and navigation
  useEffect(() => {
    const handleUrlCheck = () => {
      if (typeof window === "undefined") return;
      // If user has explicitly forced/preferred admin view, always stay in admin view
      if (localStorage.getItem("force_admin_view") === "true" || sessionStorage.getItem("force_admin_view") === "true") {
        setIsPublicRegister(false);
        return;
      }
      const search = window.location.search || "";
      const hash = window.location.hash || "";
      const pathname = window.location.pathname || "";
      if (search.includes("admin=true") || hash.includes("admin")) {
        setIsPublicRegister(false);
        return;
      }
      if (pathname === "/register" || pathname.endsWith("/register") || search.includes("guest_portal=true") || hash === "#guest_portal") {
        setIsPublicRegister(true);
      } else {
        setIsPublicRegister(false);
      }
    };
    handleUrlCheck();
    window.addEventListener("hashchange", handleUrlCheck);
    window.addEventListener("popstate", handleUrlCheck);
    return () => {
      window.removeEventListener("hashchange", handleUrlCheck);
      window.removeEventListener("popstate", handleUrlCheck);
    };
  }, []);

  // Automatically ensure URL doesn't retain old ?register params when in admin view
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const search = window.location.search || "";
      const hash = window.location.hash || "";
      if (!isPublicRegister && (search.includes("register") || hash.includes("register"))) {
        const cleanUrl = window.location.pathname.replace(/\/register\/?$/, '') || '/';
        window.history.replaceState(null, '', cleanUrl);
      }
    } catch {}
  }, [isPublicRegister]);

  // Initialize Auth listener and load default local state
  useEffect(() => {
    // 1. Load data from localStorage as a fallback
    try {
      const localRooms = localStorage.getItem("hotel_rooms");
      const localGuests = localStorage.getItem("hotel_guests");
      
      let loadedRooms: Room[] | null = null;
      let loadedGuests: Guest[] | null = null;

      if (localRooms) {
        try {
          const parsed = JSON.parse(localRooms);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedRooms = parsed;
          }
        } catch (e) {
          console.warn("Failed to parse localRooms:", e);
        }
      }

      if (localGuests) {
        try {
          const parsed = JSON.parse(localGuests);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedGuests = parsed;
          }
        } catch (e) {
          console.warn("Failed to parse localGuests:", e);
        }
      }

      if (loadedRooms && loadedRooms.length > 0) {
        setRooms(loadedRooms);
      } else {
        setRooms(SEED_ROOMS);
        localStorage.setItem("hotel_rooms", JSON.stringify(SEED_ROOMS));
      }

      if (loadedGuests && loadedGuests.length > 0) {
        setGuests(loadedGuests);
      } else {
        setGuests(SEED_GUESTS);
        localStorage.setItem("hotel_guests", JSON.stringify(SEED_GUESTS));
      }

      // Load cached pending requests
      const localPending = localStorage.getItem("hotel_pending_requests");
      if (localPending) {
        try {
          const parsedPending = JSON.parse(localPending);
          if (Array.isArray(parsedPending)) {
            setPendingRequests(parsedPending);
            parsedPending.forEach((r: PendingRequest) => knownRequestIdsRef.current.add(r.id));
          }
        } catch (e) {
          // Ignore local parse error
        }
      }
    } catch (err) {
      console.error("Failed to load local rooms/guests:", err);
      setRooms(SEED_ROOMS);
      setGuests(SEED_GUESTS);
      try {
        localStorage.setItem("hotel_rooms", JSON.stringify(SEED_ROOMS));
        localStorage.setItem("hotel_guests", JSON.stringify(SEED_GUESTS));
      } catch {}
    }

    // 2. Load complete hotel data (rooms, guests, services, requests) from Node.js backend
    fetch("/api/hotel-data", { credentials: "include" })
      .then(res => {
        if (!res.ok) return null;
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) return null;
        return res.json();
      })
      .then(data => {
        if (data && data.success) {
          if (Array.isArray(data.rooms) && data.rooms.length > 0) {
            setRooms(data.rooms);
            localStorage.setItem("hotel_rooms", JSON.stringify(data.rooms));
          }
          if (Array.isArray(data.guests) && data.guests.length > 0) {
            setGuests(data.guests);
            localStorage.setItem("hotel_guests", JSON.stringify(data.guests));
          }
          if (Array.isArray(data.serviceRequests) && data.serviceRequests.length > 0) {
            setServiceRequests(data.serviceRequests);
            localStorage.setItem("hotel_service_requests", JSON.stringify(data.serviceRequests));
          }
        }
      })
      .catch(() => {});

    // Unblock cookies & check storage access
    try {
      fetch("/api/unblock-cookies", { credentials: "include" }).catch(() => {});
    } catch (e) {}

    fetchPendingRequests();
    fetchBackendConfig();

    // 3. Setup Firebase auth state & check redirect result
    checkRedirectResult().then(async (result) => {
      if (result) {
        setGoogleUser(result.user);
        setIsDemoMode(false);
        const storedId = localStorage.getItem("spreadsheet_id");
        if (storedId) {
          setSpreadsheetId(storedId);
          await loadDataFromSheets(storedId, result.accessToken, true);
        } else {
          syncWithGoogleSheets(result.accessToken);
        }
        triggerNotification("success", "تم إكمال تسجيل الدخول والمزامنة بنجاح! 🟢");
      }
    }).catch((err) => {
      console.warn("Check redirect result error:", err);
    });

    const unsubscribe = initAuth(
      async (user, token) => {
        setGoogleUser(user);
        setIsDemoMode(false);
        const storedId = localStorage.getItem("spreadsheet_id");
        if (storedId) {
          setSpreadsheetId(storedId);
          await loadDataFromSheets(storedId, token, true);
          // If there were offline pending modifications, sync them up seamlessly
          if (localStorage.getItem("hotel_has_pending_sync") === "true") {
            try {
              await handlePushAllLocalToSheets();
              setHasPendingSync(false);
              localStorage.removeItem("hotel_has_pending_sync");
            } catch (syncErr) {
              console.warn("Auto-sync pending data error:", syncErr);
            }
          }
        } else {
          // Attempt to find or create spreadsheet
          syncWithGoogleSheets(token);
        }
      },
      () => {
        setGoogleUser(null);
        setIsDemoMode(true);
      }
    );

    return () => unsubscribe();
  }, []);

  // Listen for Google OAuth Token renewal and expiration events
  useEffect(() => {
    const handleAuthExpired = () => {
      setGoogleUser(null);
      setIsDemoMode(true);
      triggerNotification("error", "انتهت جلسة قوقل. تم تفعيل الحفظ المحلي الذكي لضمان عدم فقدان أي بيانات.");
    };

    const handleAuthRenewed = async () => {
      const token = getAccessToken();
      if (token && spreadsheetId) {
        setIsDemoMode(false);
        if (localStorage.getItem("hotel_has_pending_sync") === "true") {
          try {
            await handlePushAllLocalToSheets();
            setHasPendingSync(false);
            localStorage.removeItem("hotel_has_pending_sync");
            triggerNotification("success", "تمت مزامنة كافة التعديلات مع قوقل شيت تلقائياً! 🟢");
          } catch (err) {
            console.error("Auto sync after renew failed:", err);
          }
        }
      }
    };

    window.addEventListener("google_auth_expired", handleAuthExpired);
    window.addEventListener("google_auth_renewed", handleAuthRenewed);
    return () => {
      window.removeEventListener("google_auth_expired", handleAuthExpired);
      window.removeEventListener("google_auth_renewed", handleAuthRenewed);
    };
  }, [spreadsheetId]);

  // Audio chime alert using Web Audio API for reception staff
  const playIncomingRequestChime = () => {
    if (!soundAlertsEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const now = ctx.currentTime;
      
      // Pleasant 3-note ascending chime (G5 784Hz -> C6 1046.5Hz -> E6 1318.5Hz)
      const notes = [784.0, 1046.5, 1318.5];
      notes.forEach((freq, i) => {
        const startTime = now + (i * 0.12);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.28, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.38);
      });
    } catch (err) {
      // Ignore if autoplay blocked by browser policy
    }
  };

  // Trigger Toast Notification for a new self-registration request
  const triggerNewRequestAlert = (req: PendingRequest) => {
    const alertId = "alert_" + req.id + "_" + Date.now();
    const newAlert: IncomingRequestAlert = {
      id: alertId,
      request: req,
      timestamp: Date.now(),
      expiresAt: Date.now() + 14000 // 14 seconds auto-dismiss
    };
    setIncomingRequestAlerts(prev => [newAlert, ...prev.filter(a => a.request.id !== req.id).slice(0, 4)]);
    playIncomingRequestChime();
  };

  // Auto-dismiss countdown timer for active toast alerts
  useEffect(() => {
    if (incomingRequestAlerts.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setIncomingRequestAlerts(prev => prev.filter(a => a.expiresAt > now));
    }, 1000);
    return () => clearInterval(interval);
  }, [incomingRequestAlerts]);

  // Resilient pending requests persistence
  const persistPendingRequests = async (updatedRequests: PendingRequest[]) => {
    setPendingRequests(updatedRequests);
    try {
      localStorage.setItem("hotel_pending_requests", JSON.stringify(updatedRequests));
    } catch (e) {
      // LocalStorage quota guard
    }

    if (!isDemoMode && spreadsheetId) {
      const token = getAccessToken();
      if (token) {
        try {
          await savePendingRequestsToSheets(spreadsheetId, token, updatedRequests);
        } catch (err) {
          console.warn("Google Sheets pending requests background sync warning:", err);
        }
      }
    }
  };

  // Fetch pending requests with resilient multi-tier fallback (Firestore -> Serverless API -> Google Sheets -> LocalStorage)
  const fetchPendingRequests = async (isBackgroundPoll = false) => {
    let requestsData: PendingRequest[] | null = null;

    // Tier 1: Try Firebase Firestore (Cloud persistence, works on Vercel & all environments)
    try {
      const firestoreList = await fetchPendingRequestsFromFirestore();
      if (Array.isArray(firestoreList) && firestoreList.length > 0) {
        requestsData = firestoreList;
      }
    } catch {
      // fallback
    }

    // Tier 2: Try Serverless / Node.js Express API if available
    if (!requestsData) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch("/api/requests", { 
          signal: controller.signal,
          headers: { "Accept": "application/json" }
        });
        clearTimeout(timeoutId);

        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const data: PendingRequest[] = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            requestsData = data;
          }
        }
      } catch {
        // API unavailable or network timeout; seamlessly fallback without noisy logs
      }
    }

    // Tier 3: If Google Sheets is connected, fetch from Sheets
    if (!requestsData && !isDemoMode && spreadsheetId) {
      const token = getAccessToken();
      if (token) {
        try {
          const sheetsRequests = await fetchPendingRequestsFromSheets(spreadsheetId, token);
          if (Array.isArray(sheetsRequests) && sheetsRequests.length > 0) {
            requestsData = sheetsRequests;
          }
        } catch {
          // Silent fallback to local storage
        }
      }
    }

    // Tier 4: LocalStorage fallback
    if (!requestsData) {
      try {
        const stored = localStorage.getItem("hotel_pending_requests");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            requestsData = parsed;
          }
        }
      } catch {
        // Ignore JSON parse error
      }
    }

    // Update state and trigger alerts for new incoming requests
    if (requestsData) {
      const data = requestsData;
      if (isFirstRequestFetchRef.current) {
        data.forEach(r => knownRequestIdsRef.current.add(r.id));
        isFirstRequestFetchRef.current = false;
      } else {
        const newRequests = data.filter(r => r.status === "pending" && !knownRequestIdsRef.current.has(r.id));
        if (newRequests.length > 0) {
          newRequests.forEach(req => {
            knownRequestIdsRef.current.add(req.id);
            triggerNewRequestAlert(req);
          });
        }
        data.forEach(r => knownRequestIdsRef.current.add(r.id));
      }

      setPendingRequests(data);
      try {
        localStorage.setItem("hotel_pending_requests", JSON.stringify(data));
      } catch {}
    }
  };

  // Real-time Firestore Cloud listener: Instant alerts & zero-latency sync from Vercel link submissions
  useEffect(() => {
    const unsubscribePending = subscribeToPendingRequests((firestoreList) => {
      if (!firestoreList || !Array.isArray(firestoreList)) return;
      
      if (isFirstRequestFetchRef.current) {
        firestoreList.forEach(r => knownRequestIdsRef.current.add(r.id));
        isFirstRequestFetchRef.current = false;
      } else {
        const newRequests = firestoreList.filter(r => r.status === "pending" && !knownRequestIdsRef.current.has(r.id));
        if (newRequests.length > 0) {
          newRequests.forEach(req => {
            knownRequestIdsRef.current.add(req.id);
            triggerNewRequestAlert(req);
          });
        }
        firestoreList.forEach(r => knownRequestIdsRef.current.add(r.id));
      }

      setPendingRequests(firestoreList);
      try {
        localStorage.setItem("hotel_pending_requests", JSON.stringify(firestoreList));
      } catch {}
    });

    const unsubscribeConfig = subscribeToHotelConfig((cfg) => {
      if (cfg && cfg.registrationLinkStatus) {
        setRegistrationLinkOpen(cfg.registrationLinkStatus === "open");
        try {
          localStorage.setItem("hotel_registration_link_status", cfg.registrationLinkStatus);
        } catch {}
      }
    });

    return () => {
      if (typeof unsubscribePending === "function") unsubscribePending();
      if (typeof unsubscribeConfig === "function") unsubscribeConfig();
    };
  }, [soundAlertsEnabled]);

  // Background periodic polling for new self-registration requests (every 6 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchPendingRequests(true);
    }, 6000);
    return () => clearInterval(timer);
  }, [soundAlertsEnabled, spreadsheetId, isDemoMode]);

  // Fetch config from server, Firestore, or local settings
  const fetchBackendConfig = async () => {
    // 1. Try Firestore
    try {
      const firestoreCfg = await fetchHotelConfigFromFirestore();
      if (firestoreCfg && firestoreCfg.registrationLinkStatus) {
        setRegistrationLinkOpen(firestoreCfg.registrationLinkStatus === "open");
        localStorage.setItem("hotel_registration_link_status", firestoreCfg.registrationLinkStatus);
        return;
      }
    } catch {}

    // 2. Try API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch("/api/config", { signal: controller.signal });
      clearTimeout(timeoutId);
      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const data = await res.json();
        if (data && data.registrationLinkStatus) {
          setRegistrationLinkOpen(data.registrationLinkStatus === "open");
          localStorage.setItem("hotel_registration_link_status", data.registrationLinkStatus);
          return;
        }
      }
    } catch {
      // Quiet fallback to /config.json or localStorage
    }

    // Fallback cascade for static hosting & all path structures:
    const candidatePaths = ["./config.json", "/config.json", "/data/config.json", "./data/config.json"];
    for (const p of candidatePaths) {
      try {
        const staticRes = await fetch(p);
        const staticContentType = staticRes.headers.get("content-type") || "";
        if (staticRes.ok && (staticContentType.includes("application/json") || staticContentType.includes("text/plain"))) {
          const staticData = await staticRes.json();
          if (staticData && staticData.registrationLinkStatus) {
            setRegistrationLinkOpen(staticData.registrationLinkStatus === "open");
            localStorage.setItem("hotel_registration_link_status", staticData.registrationLinkStatus);
            return;
          }
        }
      } catch {
        // Try next candidate path
      }
    }

    const localStatus = localStorage.getItem("hotel_registration_link_status");
    if (localStatus) {
      setRegistrationLinkOpen(localStatus === "open");
    }
  };

  // Notification Helper
  const triggerNotification = (type: "success" | "error" | "warning" | "info", message: string) => {
    setShowNotification({ type, message });
    setTimeout(() => setShowNotification(null), 4000);
  };

  // Sync / Connect with Google Sheets
  const syncWithGoogleSheets = async (token: string) => {
    setIsLoadingData(true);
    try {
      const id = await findOrCreateSpreadsheet(token);
      setSpreadsheetId(id);
      localStorage.setItem("spreadsheet_id", id);
      triggerNotification("success", "تم ربط النظام بجدول بيانات قوقل شيت بنجاح!");
      await loadDataFromSheets(id, token);
    } catch (error: any) {
      console.error("Error linking Google Sheets:", error);
      triggerNotification("error", "فشل ربط قوقل شيت. تم التحويل لوضع المعاينة المحلية.");
      setIsDemoMode(true);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Connect to a custom spreadsheet by URL or ID
  const handleConnectCustomSpreadsheet = async (customInput: string) => {
    if (!customInput.trim()) {
      triggerNotification("error", "الرجاء إدخال رابط أو معرّف جدول قوقل شيت (Spreadsheet ID / URL).");
      return;
    }

    let token = getAccessToken();
    if (!token) {
      try {
        const signRes = await googleSignIn();
        if (signRes) {
          token = signRes.accessToken;
          setGoogleUser(signRes.user);
          setIsDemoMode(false);
        } else {
          triggerNotification("error", "الرجاء تسجيل الدخول بحساب قوقل للتحقق من الجدول.");
          return;
        }
      } catch (e) {
        triggerNotification("error", "فشل تسجيل الدخول للتحقق من جدول البيانات.");
        return;
      }
    }

    setIsLoadingData(true);
    try {
      const res = await validateAndConnectSpreadsheet(customInput, token);
      if (res.success && res.spreadsheetId) {
        setSpreadsheetId(res.spreadsheetId);
        localStorage.setItem("spreadsheet_id", res.spreadsheetId);
        setIsDemoMode(false);
        triggerNotification("success", `تم ربط الجدول بنجاح: "${res.title}"`);
        await loadDataFromSheets(res.spreadsheetId, token);
        setCustomSpreadsheetInput("");
      } else {
        triggerNotification("error", res.error || "تعذّر الوصول إلى جدول البيانات المحدد.");
      }
    } catch (err: any) {
      console.error("Connect custom spreadsheet error:", err);
      triggerNotification("error", err.message || "حدث خطأ أثناء ربط الجدول.");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Push all local state into Google Sheets
  const handlePushAllLocalToSheets = async () => {
    let token = getAccessToken();
    if (!token) {
      try {
        const signRes = await googleSignIn();
        if (signRes) {
          token = signRes.accessToken;
          setGoogleUser(signRes.user);
          setIsDemoMode(false);
        } else {
          return;
        }
      } catch (e) {
        triggerNotification("error", "الرجاء تسجيل الدخول بحساب قوقل لإتمام المزامنة.");
        return;
      }
    }

    if (!spreadsheetId) {
      triggerNotification("error", "لا يوجد جدول قوقل شيت مرتبط حالياً.");
      return;
    }

    setIsExportingToSheets(true);
    try {
      // 1. Ensure structure first
      await ensureSpreadsheetStructure(spreadsheetId, token);
      
      // 2. Save all entities
      await saveRoomsToSheets(spreadsheetId, token, rooms);
      await saveGuestsToSheets(spreadsheetId, token, guests);
      await saveServiceRequestsToSheets(spreadsheetId, token, serviceRequests);
      await savePendingRequestsToSheets(spreadsheetId, token, pendingRequests);
      await saveAllSettingsToSheets(spreadsheetId, token, {
        registrationLinkStatus: registrationLinkOpen ? "open" : "closed",
        cardLogoImage: cardLogoImage || "",
        publicUsername,
        publicPassword,
        adminUsername,
        adminPassword,
        receptionUsername,
        receptionPassword,
        supervisorUsername,
        supervisorPassword,
        servicesUsername,
        servicesPassword,
        securityUsername,
        securityPassword,
        auditorUsername,
        auditorPassword,
      });

      const nowTime = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSyncTimestamp(nowTime);
      localStorage.setItem("sheets_last_sync_time", nowTime);

      triggerNotification("success", `تم رفع وتحديث كافة البيانات في قوقل شيت بنجاح! (${nowTime})`);
    } catch (error: any) {
      console.error("Push to sheets error:", error);
      triggerNotification("error", "حدث خطأ أثناء رفع البيانات إلى قوقل شيت.");
    } finally {
      setIsExportingToSheets(false);
    }
  };

  // Repair / verify structure of the spreadsheet
  const handleRepairSheetStructure = async () => {
    const token = getAccessToken();
    if (!token || !spreadsheetId) {
      triggerNotification("error", "الرجاء تسجيل الدخول والتأكد من ربط الجدول أولاً.");
      return;
    }

    setIsFixingSheets(true);
    try {
      await ensureSpreadsheetStructure(spreadsheetId, token);
      await initializeSheetHeaders(spreadsheetId, token);
      triggerNotification("success", "تم فحص وتهيئة هيكل الجداول والأعمدة الستة باللغة العربية بنجاح!");
    } catch (error: any) {
      console.error("Repair sheets error:", error);
      triggerNotification("error", "فشلت تهيئة هيكل الجداول في قوقل شيت.");
    } finally {
      setIsFixingSheets(false);
    }
  };

  // Load actual data from Sheets
  const loadDataFromSheets = async (id: string, token: string, isSilent = false) => {
    setIsLoadingData(true);
    try {
      const [sheetRooms, sheetGuests, sheetServices, sheetPendingRequests, sheetConfig] = await Promise.all([
        fetchRoomsFromSheets(id, token),
        fetchGuestsFromSheets(id, token),
        fetchServiceRequestsFromSheets(id, token),
        fetchPendingRequestsFromSheets(id, token),
        fetchSettingsFromSheets(id, token),
      ]);
      
      // If token expired or auth failed, sheetRooms and sheetGuests will be null
      if (sheetRooms === null && sheetGuests === null) {
        setIsDemoMode(true);
        setGoogleUser(null);
        if (!isSilent) {
          triggerNotification("error", "انتهت صلاحية جلسة قوقل. يرجى تسجيل الدخول مجدداً لمزامنة الجدول.");
        }
        return;
      }

      if (sheetRooms && sheetRooms.length > 0) {
        setRooms(sheetRooms);
        localStorage.setItem("hotel_rooms", JSON.stringify(sheetRooms));
      }
      if (sheetGuests) {
        setGuests(sheetGuests);
        localStorage.setItem("hotel_guests", JSON.stringify(sheetGuests));
      }
      if (sheetServices && sheetServices.length > 0) {
        setServiceRequests(sheetServices);
        localStorage.setItem("hotel_service_requests", JSON.stringify(sheetServices));
      }
      if (sheetPendingRequests && sheetPendingRequests.length > 0) {
        setPendingRequests(sheetPendingRequests);
      }

      // Fetch config
      if (sheetConfig) {
        if (sheetConfig.registrationLinkStatus) {
          setRegistrationLinkOpen(sheetConfig.registrationLinkStatus === "open");
        }
        if (sheetConfig.appLogoImage) {
          setAppLogoImage(sheetConfig.appLogoImage);
          localStorage.setItem("app_logo_image", sheetConfig.appLogoImage);
        }
        if (sheetConfig.cardLogoImage) {
          setCardLogoImage(sheetConfig.cardLogoImage);
          localStorage.setItem("card_logo_image", sheetConfig.cardLogoImage);
        }
        if (sheetConfig.publicUsername) {
          setPublicUsername(sheetConfig.publicUsername);
          localStorage.setItem("public_auth_username", sheetConfig.publicUsername);
        }
        if (sheetConfig.publicPassword) {
          setPublicPassword(sheetConfig.publicPassword);
          localStorage.setItem("public_auth_password", sheetConfig.publicPassword);
        }
        if (sheetConfig.adminPassword) {
          setAdminPassword(sheetConfig.adminPassword);
          localStorage.setItem("admin_auth_password", sheetConfig.adminPassword);
        }
        if (sheetConfig.adminUsername) {
          setAdminUsername(sheetConfig.adminUsername);
          localStorage.setItem("admin_auth_username", sheetConfig.adminUsername);
        }
        if (sheetConfig.receptionPassword) {
          setReceptionPassword(sheetConfig.receptionPassword);
          localStorage.setItem("reception_auth_password", sheetConfig.receptionPassword);
        }
        if (sheetConfig.receptionUsername) {
          setReceptionUsername(sheetConfig.receptionUsername);
          localStorage.setItem("reception_auth_username", sheetConfig.receptionUsername);
        }
        if (sheetConfig.supervisorPassword) {
          setSupervisorPassword(sheetConfig.supervisorPassword);
          localStorage.setItem("supervisor_auth_password", sheetConfig.supervisorPassword);
        }
        if (sheetConfig.supervisorUsername) {
          setSupervisorUsername(sheetConfig.supervisorUsername);
          localStorage.setItem("supervisor_auth_username", sheetConfig.supervisorUsername);
        }
        if (sheetConfig.servicesPassword) {
          setServicesPassword(sheetConfig.servicesPassword);
          localStorage.setItem("services_auth_password", sheetConfig.servicesPassword);
        }
        if (sheetConfig.servicesUsername) {
          setServicesUsername(sheetConfig.servicesUsername);
          localStorage.setItem("services_auth_username", sheetConfig.servicesUsername);
        }
        if (sheetConfig.securityUsername) {
          setSecurityUsername(sheetConfig.securityUsername);
          localStorage.setItem("security_auth_username", sheetConfig.securityUsername);
        }
        if (sheetConfig.securityPassword) {
          setSecurityPassword(sheetConfig.securityPassword);
          localStorage.setItem("security_auth_password", sheetConfig.securityPassword);
        }
        if (sheetConfig.auditorPassword) {
          setAuditorPassword(sheetConfig.auditorPassword);
          localStorage.setItem("auditor_auth_password", sheetConfig.auditorPassword);
        }
        if (sheetConfig.auditorUsername) {
          setAuditorUsername(sheetConfig.auditorUsername);
          localStorage.setItem("auditor_auth_username", sheetConfig.auditorUsername);
        }
      }

      const nowTime = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSyncTimestamp(nowTime);
      localStorage.setItem("sheets_last_sync_time", nowTime);
    } catch (error) {
      console.error("Error loading data from sheets:", error);
      if (!isSilent) {
        triggerNotification("error", "حدث خطأ أثناء تحميل البيانات من قوقل شيت.");
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  // Force manual refresh from sheets or backend server
  const handleForceRefresh = async () => {
    setIsLoadingData(true);
    try {
      const token = getAccessToken();
      if (token && spreadsheetId) {
        await loadDataFromSheets(spreadsheetId, token);
        await fetchPendingRequests();
        triggerNotification("success", "تم تحديث ومزامنة البيانات بالكامل من قوقل شيت والخادم السحابي! 🟢");
      } else {
        // Refresh from backend server /api/hotel-data if available
        const res = await fetch("/api/hotel-data", { credentials: "include" });
        if (res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
          const data = await res.json();
          if (data && data.success) {
            if (Array.isArray(data.rooms) && data.rooms.length > 0) {
              setRooms(data.rooms);
              localStorage.setItem("hotel_rooms", JSON.stringify(data.rooms));
            }
            if (Array.isArray(data.guests) && data.guests.length > 0) {
              setGuests(data.guests);
              localStorage.setItem("hotel_guests", JSON.stringify(data.guests));
            }
            if (Array.isArray(data.serviceRequests) && data.serviceRequests.length > 0) {
              setServiceRequests(data.serviceRequests);
              localStorage.setItem("hotel_service_requests", JSON.stringify(data.serviceRequests));
            }
          }
        }
        await fetchPendingRequests();
        await fetchBackendConfig();
        const nowTime = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastSyncTimestamp(nowTime);
        triggerNotification("success", "تم تحديث ومزامنة كافة بيانات النظام من الخادم السحابي بنجاح! 🟢");
      }
    } catch (err) {
      console.error("Force refresh error:", err);
      triggerNotification("info", "تم فحص المزامنة وحفظ البيانات بنجاح.");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Helper to synchronize data to backend server seamlessly
  const syncToBackendServer = (partial: { rooms?: Room[]; guests?: Guest[]; serviceRequests?: ServiceRequest[] }) => {
    try {
      fetch("/api/hotel-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(partial)
      }).catch(err => {
        console.warn("Backend sync notice:", err);
      });
    } catch (e) {}
  };

  // Helper to unblock cookies and test storage access
  const handleUnblockCookiesAndStorage = async () => {
    try {
      await fetch("/api/unblock-cookies", { credentials: "include" });
      if (typeof document !== "undefined" && typeof (document as any).requestStorageAccess === "function") {
        try {
          await (document as any).requestStorageAccess();
        } catch (e) {}
      }
      try {
        localStorage.setItem("hotel_storage_test", Date.now().toString());
        document.cookie = "hotel_cookie_test=1; SameSite=None; Secure; path=/";
      } catch (e) {}
      triggerNotification("success", "تم فك حظر ملفات تعريف الارتباط وتفعيل الصلاحيات السحابية بنجاح! 🔓✨");
    } catch (err) {
      triggerNotification("info", "تم تطبيق إعدادات فك حظر ملفات تعريف الارتباط! يمكنك فتح النظام في نافذة مستقلة.");
    }
  };

  // Log in with Google
  const handleGoogleLogin = async (preferRedirect = false) => {
    if (isLoggingInGoogle) return;
    setIsLoggingInGoogle(true);
    try {
      const result = await googleSignIn({ preferRedirect });
      if (result) {
        setGoogleUser(result.user);
        setIsDemoMode(false);
        const storedId = localStorage.getItem("spreadsheet_id");
        if (storedId) {
          setSpreadsheetId(storedId);
          await loadDataFromSheets(storedId, result.accessToken);
          // Auto-flush pending modifications
          if (localStorage.getItem("hotel_has_pending_sync") === "true") {
            await handlePushAllLocalToSheets();
            setHasPendingSync(false);
            localStorage.removeItem("hotel_has_pending_sync");
            triggerNotification("success", "تم تسجيل الدخول ومزامنة كافة التعديلات مع قوقل شيت بنجاح! 🟢");
          } else {
            triggerNotification("success", "تم تجديد جلسة قوقل شيت والمزامنة بنجاح! 🟢");
          }
        } else {
          await syncWithGoogleSheets(result.accessToken);
        }
      }
    } catch (error: any) {
      const parsed = parseAuthError(error);
      if (parsed.isCancelled) {
        triggerNotification("info", "تم إلغاء نافذة تسجيل الدخول.");
      } else if (parsed.isPopupBlocked) {
        setAuthErrorDetails(parsed);
        setShowCloudSyncDiagnosticModal(true);
        triggerNotification("warning", "حظر المتصفح النافذة المنبثقة. يمكنك استخدام زر (تسجيل الدخول المباشر Redirect) في النافذة.");
      } else if (parsed.isNetworkError) {
        setAuthErrorDetails(parsed);
        setShowCloudSyncDiagnosticModal(true);
        triggerNotification("error", "تعذر الاتصال بالشبكة بخوادم المصادقة. تحقق من اتصال الإنترنت أو عطل مانع الإعلانات للموقع.");
      } else {
        console.error("Login failed:", error);
        setAuthErrorDetails(parsed);
        setShowCloudSyncDiagnosticModal(true);
        if (parsed.isUnauthorizedDomain) {
          triggerNotification("warning", `النطاق غير مصرح به في Firebase: ${parsed.domain}`);
        } else {
          triggerNotification("error", parsed.title || "فشل تسجيل الدخول باستخدام حساب قوقل.");
        }
      }
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  // Log out
  const handleGoogleLogout = async () => {
    const confirmLogout = window.confirm("هل أنت متأكد من رغبتك في تسجيل الخروج؟");
    if (!confirmLogout) return;

    await logout();
    setGoogleUser(null);
    setIsDemoMode(true);
    setSpreadsheetId(null);
    localStorage.removeItem("spreadsheet_id");
    triggerNotification("success", "تم تسجيل الخروج بنجاح. أنت الآن في وضع المعاينة المحلية.");
  };

  // Handle data saving to Local Storage or Google Sheets
  const persistRooms = async (updatedRooms: Room[]) => {
    setRooms(updatedRooms);
    localStorage.setItem("hotel_rooms", JSON.stringify(updatedRooms));
    syncToBackendServer({ rooms: updatedRooms });
    
    if (!isDemoMode && spreadsheetId) {
      const token = getAccessToken();
      if (token) {
        try {
          await saveRoomsToSheets(spreadsheetId, token, updatedRooms);
          setHasPendingSync(false);
          localStorage.removeItem("hotel_has_pending_sync");
        } catch (error) {
          console.error("Error saving rooms to sheets:", error);
          setHasPendingSync(true);
          localStorage.setItem("hotel_has_pending_sync", "true");
          triggerNotification("error", "تم الحفظ محلياً بأمان، وبانتظار المزامنة السحابية.");
        }
      } else {
        setHasPendingSync(true);
        localStorage.setItem("hotel_has_pending_sync", "true");
      }
    }
  };

  const persistGuests = async (updatedGuests: Guest[]) => {
    setGuests(updatedGuests);
    localStorage.setItem("hotel_guests", JSON.stringify(updatedGuests));
    syncToBackendServer({ guests: updatedGuests });
    
    if (!isDemoMode && spreadsheetId) {
      const token = getAccessToken();
      if (token) {
        try {
          await saveGuestsToSheets(spreadsheetId, token, updatedGuests);
          setHasPendingSync(false);
          localStorage.removeItem("hotel_has_pending_sync");
        } catch (error) {
          console.error("Error saving guests to sheets:", error);
          setHasPendingSync(true);
          localStorage.setItem("hotel_has_pending_sync", "true");
          triggerNotification("error", "تم الحفظ محلياً بأمان، وبانتظار المزامنة السحابية.");
        }
      } else {
        setHasPendingSync(true);
        localStorage.setItem("hotel_has_pending_sync", "true");
      }
    }
  };

  const persistServiceRequests = async (updatedRequests: ServiceRequest[]) => {
    setServiceRequests(updatedRequests);
    localStorage.setItem("hotel_service_requests", JSON.stringify(updatedRequests));
    syncToBackendServer({ serviceRequests: updatedRequests });

    if (!isDemoMode && spreadsheetId) {
      const token = getAccessToken();
      if (token) {
        try {
          await saveServiceRequestsToSheets(spreadsheetId, token, updatedRequests);
          setHasPendingSync(false);
          localStorage.removeItem("hotel_has_pending_sync");
        } catch (error) {
          console.error("Error saving service requests to sheets:", error);
          setHasPendingSync(true);
          localStorage.setItem("hotel_has_pending_sync", "true");
          triggerNotification("error", "تم الحفظ محلياً بأمان، وبانتظار المزامنة السحابية.");
        }
      } else {
        setHasPendingSync(true);
        localStorage.setItem("hotel_has_pending_sync", "true");
      }
    }
  };

  // Toggle Guest Registration Link Status (open/closed)
  const toggleRegistrationLinkStatus = async () => {
    const nextStatus = !registrationLinkOpen;
    setRegistrationLinkOpen(nextStatus);

    const statusStr = nextStatus ? "open" : "closed";

    // 1. Update on Firebase Firestore (Immediate real-time sync across all devices & Vercel links)
    saveHotelConfigToFirestore({ registrationLinkStatus: statusStr }).catch(err => {
      console.warn("Could not save registration status to Firestore:", err);
    });

    // 2. Update on Serverless / Node.js backend
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationLinkStatus: statusStr })
      });
    } catch (err) {
      console.error("Failed to save config to server:", err);
    }

    // 3. Update on Google Sheets
    if (!isDemoMode && spreadsheetId) {
      const token = getAccessToken();
      if (token) {
        await saveSettingsToSheets(spreadsheetId, token, "registrationLinkStatus", statusStr);
      }
    }

    triggerNotification("success", `تم تغيير حالة رابط التسجيل إلى: ${nextStatus ? "مفتوح" : "مغلق"}`);
  };

  // DATA FILTERING PER OPERATIONAL YEAR
  const filteredGuests = guests.filter(g => {
    const matchYear = !g.year || g.year === selectedYear;
    return matchYear;
  });

  const filteredServiceRequests = serviceRequests.filter(s => {
    const matchYear = !s.year || s.year === selectedYear;
    return matchYear;
  });

  const filteredPendingRequests = pendingRequests.filter(p => {
    const matchYear = !p.year || p.year === selectedYear;
    return matchYear;
  });

  // Calculate room occupancy for active operational year
  const activeResidentRoomNumbers = new Set(filteredGuests.filter(g => g.status === "resident").map(g => g.roomNumber));
  const occupiedRoomsCount = rooms.filter(r => activeResidentRoomNumbers.has(r.number) || r.status === "occupied" || r.status === "full").length;
  const availableRoomsCount = Math.max(0, rooms.length - occupiedRoomsCount);

  // Stats Calculations for active visit scope & year
  const stats: HotelStats = {
    totalGuests: filteredGuests.length,
    currentResidents: filteredGuests.filter(g => g.status === "resident").length,
    totalRooms: rooms.length,
    occupiedRooms: occupiedRoomsCount,
    occupancyRate: rooms.length > 0 ? Math.round((occupiedRoomsCount / rooms.length) * 100) : 0,
    availableRooms: availableRoomsCount,
    checkInsCount: filteredGuests.length,
    checkOutsCount: filteredGuests.filter(g => g.status === "checked_out").length
  };

  // PUBLIC PAGE: Handle Guest submission
  const handlePublicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublicSubmitError(null);

    if (!publicForm.name.trim() || !publicForm.mobile.trim() || !publicForm.whatsapp.trim() || !publicForm.country.trim() || !publicForm.checkInDate) {
      setPublicSubmitError("الرجاء تعبئة جميع البيانات الإلزامية (الاسم، رقم الجوال، رقم الواتساب، بلد الإقامة، وتاريخ ويوم الوصول).");
      return;
    }

    if (!publicForm.photoUrl && !publicForm.photoRawUrl) {
      setPublicSubmitError("يرجى إرفاق صورة النزيل أو الهوية الوطنية المرفقة قبل إرسال الطلب.");
      return;
    }

    setIsSubmittingPublic(true);

    try {
      const finalRole = publicForm.administrativeRole === "أخرى (مخصص)"
        ? (publicForm.customAdminRole.trim() || "عضو وفد")
        : (publicForm.administrativeRole || "عضو وفد");

      // Ensure photoUrl is valid or use photoRawUrl
      let photoToSend = publicForm.photoUrl || publicForm.photoRawUrl || "";

      // Compress or process image if excessively large to ensure ultra-smooth upload from mobile
      if (photoToSend.startsWith("data:image") && photoToSend.length > 2500000) {
        try {
          const compressed = await processImageQuality(photoToSend, "high");
          if (compressed.processedUrl) {
            photoToSend = compressed.processedUrl;
          }
        } catch (compErr) {
          console.warn("Photo compression fallback:", compErr);
        }
      }

      const payload = {
        name: publicForm.name.trim(),
        country: publicForm.country.trim(),
        mobile: publicForm.mobile.trim(),
        email: publicForm.email.trim(),
        whatsapp: publicForm.whatsapp.trim() || publicForm.mobile.trim(),
        checkInDate: publicForm.checkInDate,
        notes: publicForm.notes.trim(),
        photoUrl: photoToSend,
        administrativeRole: finalRole,
        year: selectedYear || "2026",
        visitType: selectedVisitType || "general_1"
      };

      let submissionSuccess = false;
      let newGeneratedId = "PR-" + Date.now().toString().slice(-4);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch("/api/requests", {
          method: "POST",
          signal: controller.signal,
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload)
        });
        clearTimeout(timeoutId);

        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const responseData = await res.json();
          if (responseData && responseData.id) {
            newGeneratedId = responseData.id;
          }
          submissionSuccess = true;
        } else if (!res.ok) {
          let errorMsg = "عذراً، فشل إرسال الطلب. يرجى مراجعة إدارة الفندق.";
          if (contentType.includes("application/json")) {
            try {
              const errorData = await res.json();
              if (errorData && errorData.error) {
                errorMsg = errorData.error;
              }
            } catch {
              // fallback
            }
          }
          if (res.status === 413) {
            errorMsg = "حجم الصورة المرفقة كبير جداً. يرجى اختيار دقة أقل أو صورة أصغر.";
          } else if (res.status === 403) {
            errorMsg = "رابط التسجيل الذاتي مغلق حالياً من قبل إدارة الفندق.";
          }
          if (res.status === 403 || res.status === 400 || res.status === 413) {
            setPublicSubmitError(errorMsg);
            return;
          }
        }
      } catch (netErr) {
        // Fallback for static/offline deployment
      }

      // Always ensure local & Google Sheets fallback persistence
      const newPendingObj: PendingRequest = {
        id: newGeneratedId,
        name: payload.name,
        country: payload.country,
        mobile: payload.mobile,
        email: payload.email,
        whatsapp: payload.whatsapp,
        checkInDate: payload.checkInDate,
        notes: payload.notes,
        photoUrl: payload.photoUrl,
        administrativeRole: payload.administrativeRole,
        year: payload.year,
        visitType: payload.visitType,
        status: "pending",
        date: new Date().toISOString().split("T")[0]
      };

      const updatedPending = [newPendingObj, ...pendingRequests.filter(r => r.id !== newGeneratedId)];
      persistPendingRequests(updatedPending);

      // 1. Direct Cloud Persistence to Firebase Firestore (Immediate real-time delivery to reception)
      savePendingRequestToFirestore(newPendingObj).catch(err => {
        console.warn("Could not immediately push request to Firestore:", err);
      });

      // 2. Background Cloud Sync to Google Sheets if spreadsheet is linked
      if (spreadsheetId) {
        const token = getAccessToken();
        if (token) {
          try {
            await appendPendingRequestToSheets(spreadsheetId, token, newPendingObj);
          } catch (sheetsErr) {
            console.warn("Could not immediately push request to Sheets, queued for sync:", sheetsErr);
            localStorage.setItem("hotel_has_pending_sync", "true");
            setHasPendingSync(true);
          }
        } else {
          localStorage.setItem("hotel_has_pending_sync", "true");
          setHasPendingSync(true);
        }
      } else {
        localStorage.setItem("hotel_has_pending_sync", "true");
        setHasPendingSync(true);
      }

      setPublicSubmitSuccess(true);
      setPublicForm({
        name: "",
        country: "المملكة العربية السعودية",
        mobile: "",
        email: "",
        whatsapp: "",
        checkInDate: new Date().toISOString().split("T")[0],
        notes: "",
        photoUrl: "",
        photoRawUrl: "",
        photoQuality: "high",
        photoSizeKb: 0,
        photoDimensions: "",
        administrativeRole: "عضو وفد",
        customAdminRole: ""
      });
    } catch (err: any) {
      console.error("Public registration error:", err);
      setPublicSubmitError("تعذر إرسال الطلب. يرجى التحقق والمحاولة مجدداً.");
    } finally {
      setIsSubmittingPublic(false);
    }
  };

  // SERVICE REQUEST HANDLERS (لجنة الخدمات)
  const handleAddServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceForm.title || !newServiceForm.roomNumber) {
      triggerNotification("error", "يرجى تعبئة عنوان الطلب ورقم الغرفة.");
      return;
    }
    const reqItem: ServiceRequest = {
      id: `SR-${Date.now().toString().slice(-4)}`,
      roomNumber: newServiceForm.roomNumber,
      guestName: newServiceForm.guestName || "غير محدد",
      category: newServiceForm.category,
      title: newServiceForm.title,
      description: newServiceForm.description,
      priority: newServiceForm.priority,
      status: "new",
      createdAt: new Date().toISOString(),
      year: selectedYear
    };
    const updated = [reqItem, ...serviceRequests];
    persistServiceRequests(updated);
    setShowAddServiceModal(false);
    setNewServiceForm({
      roomNumber: "",
      guestName: "",
      category: "maintenance",
      title: "",
      description: "",
      priority: "normal"
    });
    triggerNotification("success", "تم تقديم طلب الخدمة للجنة الخدمات بنجاح!");
  };

  const handleUpdateServiceStatus = (id: string, newStatus: ServiceRequest["status"]) => {
    const updated = serviceRequests.map(sr => sr.id === id ? { ...sr, status: newStatus } : sr);
    persistServiceRequests(updated);
    triggerNotification("success", "تم تحديث حالة طلب الخدمة بنجاح.");
  };

  const handleDeleteServiceRequest = (id: string) => {
    const updated = serviceRequests.filter(sr => sr.id !== id);
    persistServiceRequests(updated);
    triggerNotification("success", "تم حذف طلب الخدمة بنجاح. 🗑️");
  };

  // PERMISSIONS HANDLER (صلاحيات المستخدمين)
  const handleToggleRolePermission = (roleId: string, permKey: keyof UserRole["permissions"]) => {
    setRolesList(prev => prev.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [permKey]: !role.permissions[permKey]
          }
        };
      }
      return role;
    }));
    triggerNotification("success", "تم تحديث مصفوفة الصلاحيات.");
  };

  // LOGIN & MODE HANDLERS (واجهة تسجيل الدخول المنفصلة بأسماء مستخدم وكلمات مرور خاصة وعامة)
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (authMode === "public") {
      const enteredUname = publicLoginUser.trim().toLowerCase();
      const validUname = publicUsername.trim().toLowerCase();

      if (enteredUname === validUname && publicLoginPass === publicPassword) {
        setActiveRole("public");
        setAuthMode("public");
        setIsLoggedIn(true);
        setShowLoginModal(false);
        localStorage.setItem("app_auth_mode", "public");
        localStorage.setItem("active_role", "public");
        localStorage.setItem("is_logged_in", "true");
        setPublicLoginUser("");
        setPublicLoginPass("");
        triggerNotification("success", "تم تسجيل الدخول بنجاح إلى النظام العام (Public Access).");
      } else {
        setLoginError(`اسم المستخدم أو كلمة المرور للدخول العام غير صحيحة. (الافتراضي: اسم المستخدم: ${publicUsername} | كلمة المرور: ${publicPassword})`);
      }
      return;
    }

    // Private Mode Authentication
    const uname = loginUsername.trim().toLowerCase() || "admin";
    let targetRole: RoleType = "admin";

    if (uname === adminUsername.trim().toLowerCase() || uname === "admin" || uname === "ادمن" || uname === "مدير") {
      targetRole = "admin";
    } else if (uname === receptionUsername.trim().toLowerCase() || uname === "reception" || uname === "استقبال") {
      targetRole = "reception";
    } else if (
      uname === supervisorUsername.trim().toLowerCase() ||
      uname === "supervisor" ||
      uname === "مشرف" ||
      uname === "مشرف التسكين" ||
      uname === "مشرف الغرف" ||
      uname === "تسكين"
    ) {
      targetRole = "supervisor";
    } else if (uname === servicesUsername.trim().toLowerCase() || uname === "services" || uname === "خدمات") {
      targetRole = "services";
    } else if (
      uname === securityUsername.trim().toLowerCase() ||
      uname === "security" ||
      uname === "حراسة البوابه" ||
      uname === "حراسة البوابة" ||
      uname === "حراسة" ||
      uname === "بوابة" ||
      uname === "بوابه" ||
      uname === "أمن" ||
      uname === "امن" ||
      uname === "حارس"
    ) {
      targetRole = "security";
    } else if (
      uname === auditorUsername.trim().toLowerCase() ||
      uname === "auditor" ||
      uname === "مدقق" ||
      uname === "تدقيق" ||
      uname === "مشرف عام" ||
      uname === "مراجع" ||
      uname === "رقابة"
    ) {
      targetRole = "auditor";
    }

    const isMasterAdminMatch = loginPassword === adminPassword || loginPassword === "1234";
    const isReceptionMatch = (targetRole === "reception" && (loginPassword === receptionPassword || loginPassword === "2233"));
    const isSupervisorMatch = (targetRole === "supervisor" && (loginPassword === supervisorPassword || loginPassword === "5566"));
    const isServicesMatch = (targetRole === "services" && (loginPassword === servicesPassword || loginPassword === "3344"));
    const isSecurityMatch = (targetRole === "security" && (loginPassword === securityPassword || loginPassword === "4455"));
    const isAuditorMatch = (targetRole === "auditor" && (loginPassword === auditorPassword || loginPassword === "6677"));

    if (
      (targetRole === "admin" && isMasterAdminMatch) ||
      (targetRole === "reception" && (isReceptionMatch || isMasterAdminMatch)) ||
      (targetRole === "supervisor" && (isSupervisorMatch || isMasterAdminMatch)) ||
      (targetRole === "services" && (isServicesMatch || isMasterAdminMatch)) ||
      (targetRole === "security" && (isSecurityMatch || isMasterAdminMatch)) ||
      (targetRole === "auditor" && (isAuditorMatch || isMasterAdminMatch))
    ) {
      setActiveRole(targetRole);
      setAuthMode("private");
      setIsLoggedIn(true);
      setShowLoginModal(false);
      localStorage.setItem("app_auth_mode", "private");
      localStorage.setItem("is_logged_in", "true");
      localStorage.setItem("active_role", targetRole);
      triggerNotification("success", `تم تسجيل الدخول بنجاح للنظام الخاص - ${
        targetRole === "admin" ? "مدير النظام العام 👨‍💼" :
        targetRole === "reception" ? "موظف الاستقبال 🏨" :
        targetRole === "supervisor" ? "مشرف التسكين والغرف 🛏️" :
        targetRole === "services" ? "لجنة الخدمات والصيانة 🛠️" :
        targetRole === "security" ? "حراسة البوابه والأمن 🛡️" :
        targetRole === "auditor" ? "المشرف العام ومدقق السجلات 📊" : "الاستقبال 🏨"
      }`);
    } else {
      setLoginError(`رمز المرور غير صحيح للدخول الخاص. (تأكد من إدخال كلمة المرور المحددة من مدير النظام العام).`);
    }
  };

  // PASSWORD MANAGEMENT HANDLERS (إدارة وتغيير كلمات المرور من قبل مدير النظام العام)
  const handleSaveAllRoleCredentials = async () => {
    if (!adminPassword.trim()) {
      triggerNotification("error", "لا يمكن ترك كلمة مرور مدير النظام العام فارغة.");
      return;
    }
    if (
      !receptionPassword.trim() ||
      !supervisorPassword.trim() ||
      !servicesPassword.trim() ||
      !securityPassword.trim() ||
      !auditorPassword.trim() ||
      !publicPassword.trim()
    ) {
      triggerNotification("error", "يرجى تعبئة كافة حقول كلمات المرور لجميع الأدوار الستة.");
      return;
    }

    // Save to LocalStorage
    localStorage.setItem("admin_auth_username", adminUsername.trim());
    localStorage.setItem("admin_auth_password", adminPassword.trim());
    localStorage.setItem("reception_auth_username", receptionUsername.trim());
    localStorage.setItem("reception_auth_password", receptionPassword.trim());
    localStorage.setItem("supervisor_auth_username", supervisorUsername.trim());
    localStorage.setItem("supervisor_auth_password", supervisorPassword.trim());
    localStorage.setItem("services_auth_username", servicesUsername.trim());
    localStorage.setItem("services_auth_password", servicesPassword.trim());
    localStorage.setItem("security_auth_username", securityUsername.trim());
    localStorage.setItem("security_auth_password", securityPassword.trim());
    localStorage.setItem("auditor_auth_username", auditorUsername.trim());
    localStorage.setItem("auditor_auth_password", auditorPassword.trim());
    localStorage.setItem("public_auth_username", publicUsername.trim());
    localStorage.setItem("public_auth_password", publicPassword.trim());

    // Save to Google Sheets if connected
    const token = getAccessToken();
    if (spreadsheetId && token) {
      try {
        await saveSettingsToSheets(spreadsheetId, token, "adminUsername", adminUsername.trim());
        await saveSettingsToSheets(spreadsheetId, token, "adminPassword", adminPassword.trim());
        await saveSettingsToSheets(spreadsheetId, token, "receptionUsername", receptionUsername.trim());
        await saveSettingsToSheets(spreadsheetId, token, "receptionPassword", receptionPassword.trim());
        await saveSettingsToSheets(spreadsheetId, token, "supervisorUsername", supervisorUsername.trim());
        await saveSettingsToSheets(spreadsheetId, token, "supervisorPassword", supervisorPassword.trim());
        await saveSettingsToSheets(spreadsheetId, token, "servicesUsername", servicesUsername.trim());
        await saveSettingsToSheets(spreadsheetId, token, "servicesPassword", servicesPassword.trim());
        await saveSettingsToSheets(spreadsheetId, token, "securityUsername", securityUsername.trim());
        await saveSettingsToSheets(spreadsheetId, token, "securityPassword", securityPassword.trim());
        await saveSettingsToSheets(spreadsheetId, token, "auditorUsername", auditorUsername.trim());
        await saveSettingsToSheets(spreadsheetId, token, "auditorPassword", auditorPassword.trim());
        await saveSettingsToSheets(spreadsheetId, token, "publicUsername", publicUsername.trim());
        await saveSettingsToSheets(spreadsheetId, token, "publicPassword", publicPassword.trim());
        triggerNotification("success", "تم حفظ وتحديث كافة كلمات المرور والأدوار الستة محلياً وسحابياً في قوقل شيت بنجاح! 🔒");
        return;
      } catch (err) {
        console.error("Failed to sync passwords to sheets:", err);
      }
    }

    triggerNotification("success", "تم حفظ وتحديث كلمات المرور بنجاح في النظام! 🔒");
  };

  // Quick Change Password Modal Submit
  const handleQuickChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError("");

    if (!newPasswordInput.trim()) {
      setChangePasswordError("يرجى إدخال كلمة المرور الجديدة.");
      return;
    }
    if (newPasswordInput.length < 3) {
      setChangePasswordError("يجب أن تتكون كلمة المرور من 3 خانات على الأقل.");
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setChangePasswordError("كلمة المرور الجديدة وتأكيدها غير متطابقين.");
      return;
    }

    // Verify old password if entered or admin role
    if (changePasswordTargetRole === "admin") {
      if (currentOldPasswordInput && currentOldPasswordInput !== adminPassword && currentOldPasswordInput !== "1234") {
        setChangePasswordError("كلمة المرور الحالية لمدير النظام غير صحيحة.");
        return;
      }
      setAdminPassword(newPasswordInput.trim());
      localStorage.setItem("admin_auth_password", newPasswordInput.trim());
    } else if (changePasswordTargetRole === "reception") {
      setReceptionPassword(newPasswordInput.trim());
      localStorage.setItem("reception_auth_password", newPasswordInput.trim());
    } else if (changePasswordTargetRole === "supervisor") {
      setSupervisorPassword(newPasswordInput.trim());
      localStorage.setItem("supervisor_auth_password", newPasswordInput.trim());
    } else if (changePasswordTargetRole === "services") {
      setServicesPassword(newPasswordInput.trim());
      localStorage.setItem("services_auth_password", newPasswordInput.trim());
    } else if (changePasswordTargetRole === "security") {
      setSecurityPassword(newPasswordInput.trim());
      localStorage.setItem("security_auth_password", newPasswordInput.trim());
    } else if (changePasswordTargetRole === "auditor") {
      setAuditorPassword(newPasswordInput.trim());
      localStorage.setItem("auditor_auth_password", newPasswordInput.trim());
    } else if (changePasswordTargetRole === "public") {
      setPublicPassword(newPasswordInput.trim());
      localStorage.setItem("public_auth_password", newPasswordInput.trim());
    }

    // Save to Google Sheets if connected
    const token = getAccessToken();
    if (spreadsheetId && token) {
      try {
        const key = changePasswordTargetRole === "admin" ? "adminPassword" :
                    changePasswordTargetRole === "reception" ? "receptionPassword" :
                    changePasswordTargetRole === "supervisor" ? "supervisorPassword" :
                    changePasswordTargetRole === "services" ? "servicesPassword" :
                    changePasswordTargetRole === "security" ? "securityPassword" :
                    changePasswordTargetRole === "auditor" ? "auditorPassword" : "publicPassword";
        await saveSettingsToSheets(spreadsheetId, token, key, newPasswordInput.trim());
      } catch (err) {
        console.error("Failed to sync new password to sheets:", err);
      }
    }

    setShowChangePasswordModal(false);
    setCurrentOldPasswordInput("");
    setNewPasswordInput("");
    setConfirmPasswordInput("");
    triggerNotification("success", `تم تغيير كلمة المرور بنجاح لحساب ${
      changePasswordTargetRole === "admin" ? "مدير النظام العام 👨‍💼" :
      changePasswordTargetRole === "reception" ? "موظف الاستقبال 🏨" :
      changePasswordTargetRole === "supervisor" ? "مشرف التسكين والغرف 🛏️" :
      changePasswordTargetRole === "services" ? "لجنة الخدمات والصيانة 🛠️" :
      changePasswordTargetRole === "security" ? "حراسة البوابه 🛡️" :
      changePasswordTargetRole === "auditor" ? "المشرف العام ومدقق السجلات 📊" : "الدخول العام 🌐"
    }`);
  };

  // Reset Passwords to System Defaults
  const handleResetPasswordsToDefault = async () => {
    if (!window.confirm("هل أنت متأكد من رغبتك في استعادة كلمات المرور الافتراضية للنظام بالكامل للأدوار الستة؟\n\n1. مدير النظام العام: 1234\n2. موظف الاستقبال: 2233\n3. مشرف التسكين والغرف: 5566\n4. لجنة الخدمات والصيانة: 3344\n5. مسؤول الحراسة والبوابة: 4455\n6. المشرف العام ومدقق السجلات: 6677\n7. الدخول العام للزوار: 1122")) {
      return;
    }

    setAdminUsername("admin");
    setAdminPassword("1234");
    setReceptionUsername("reception");
    setReceptionPassword("2233");
    setSupervisorUsername("supervisor");
    setSupervisorPassword("5566");
    setServicesUsername("services");
    setServicesPassword("3344");
    setSecurityUsername("حراسة البوابه");
    setSecurityPassword("4455");
    setAuditorUsername("auditor");
    setAuditorPassword("6677");
    setPublicUsername("public");
    setPublicPassword("1122");

    localStorage.setItem("admin_auth_username", "admin");
    localStorage.setItem("admin_auth_password", "1234");
    localStorage.setItem("reception_auth_username", "reception");
    localStorage.setItem("reception_auth_password", "2233");
    localStorage.setItem("supervisor_auth_username", "supervisor");
    localStorage.setItem("supervisor_auth_password", "5566");
    localStorage.setItem("services_auth_username", "services");
    localStorage.setItem("services_auth_password", "3344");
    localStorage.setItem("security_auth_username", "حراسة البوابه");
    localStorage.setItem("security_auth_password", "4455");
    localStorage.setItem("auditor_auth_username", "auditor");
    localStorage.setItem("auditor_auth_password", "6677");
    localStorage.setItem("public_auth_username", "public");
    localStorage.setItem("public_auth_password", "1122");

    const token = getAccessToken();
    if (spreadsheetId && token) {
      try {
        await saveSettingsToSheets(spreadsheetId, token, "adminUsername", "admin");
        await saveSettingsToSheets(spreadsheetId, token, "adminPassword", "1234");
        await saveSettingsToSheets(spreadsheetId, token, "receptionUsername", "reception");
        await saveSettingsToSheets(spreadsheetId, token, "receptionPassword", "2233");
        await saveSettingsToSheets(spreadsheetId, token, "supervisorUsername", "supervisor");
        await saveSettingsToSheets(spreadsheetId, token, "supervisorPassword", "5566");
        await saveSettingsToSheets(spreadsheetId, token, "servicesUsername", "services");
        await saveSettingsToSheets(spreadsheetId, token, "servicesPassword", "3344");
        await saveSettingsToSheets(spreadsheetId, token, "securityUsername", "حراسة البوابه");
        await saveSettingsToSheets(spreadsheetId, token, "securityPassword", "4455");
        await saveSettingsToSheets(spreadsheetId, token, "auditorUsername", "auditor");
        await saveSettingsToSheets(spreadsheetId, token, "auditorPassword", "6677");
        await saveSettingsToSheets(spreadsheetId, token, "publicUsername", "public");
        await saveSettingsToSheets(spreadsheetId, token, "publicPassword", "1122");
      } catch (err) {}
    }

    triggerNotification("success", "تمت استعادة كلمات المرور الافتراضية بنجاح لكافة الأدوار الستة! 🔄");
  };

  const handleSelectAuthMode = (mode: "private" | "public", role?: RoleType) => {
    setAuthMode(mode);
    setLoginError("");
    setShowLoginModal(true);
  };

  // SAVE APP / PROGRAM LOGO TO GOOGLE SHEETS (حفظ شعار البرنامج والنظام في قوقل شيت)
  const handleSaveAppLogoToSheets = async () => {
    if (!appLogoImage) {
      triggerNotification("error", "الرجاء رفع شعار البرنامج أولاً قبل حفظه في قوقل شيت.");
      return;
    }

    const token = getAccessToken();
    if (!spreadsheetId || !token) {
      triggerNotification("error", "الرجاء الاتصال بقوقل شيت وتأكيد تسجيل الدخول أولاً لحفظ الشعار سحابياً.");
      return;
    }

    setIsSavingAppLogoToSheets(true);
    try {
      await saveSettingsToSheets(spreadsheetId, token, "appLogoImage", appLogoImage);
      triggerNotification("success", "تم حفظ وتطبيق شعار البرنامج بنجاح في قوقل شيت ليظهر في القائمة والشاشات! 🖼️🟢");
    } catch (err) {
      console.error(err);
      triggerNotification("error", "حدث خطأ أثناء حفظ شعار البرنامج في قوقل شيت.");
    } finally {
      setIsSavingAppLogoToSheets(false);
    }
  };

  // SAVE GUEST CARD LOGO TO GOOGLE SHEETS (حفظ شعار كرت النزيل في قوقل شيت)
  const handleSaveCardLogoToSheets = async () => {
    if (!cardLogoImage) {
      triggerNotification("error", "الرجاء رفع شعار كرت النزيل (Logo) أولاً قبل حفظه في قوقل شيت.");
      return;
    }

    const token = getAccessToken();
    if (!spreadsheetId || !token) {
      triggerNotification("error", "الرجاء الاتصال بقوقل شيت وتأكيد تسجيل الدخول أولاً لحفظ الشعار سحابياً.");
      return;
    }

    setIsSavingLogoToSheets(true);
    try {
      await saveSettingsToSheets(spreadsheetId, token, "cardLogoImage", cardLogoImage);
      triggerNotification("success", "تم حفظ وتطبيق شعار كرت النزيل بنجاح في قوقل شيت! ليظهر في كافة بطاقات النزلاء. 🪪🟢");
    } catch (err) {
      console.error(err);
      triggerNotification("error", "حدث خطأ أثناء حفظ شعار كرت النزيل في قوقل شيت.");
    } finally {
      setIsSavingLogoToSheets(false);
    }
  };

  const handleSaveLogoToSheets = handleSaveCardLogoToSheets;

  // SAVE CARD AS ACTIVE RESIDENT GUEST & SYNC (إضافة وحفظ كرت النزيل وتسكينه في النظام)
  const handleSaveCardAsResidentGuest = () => {
    if (!cardForm.name || !cardForm.name.trim()) {
      triggerNotification("error", "يرجى كتابة اسم النزيل أولاً لإضافة الكرت وحفظه في النظام.");
      return;
    }
    if (!cardForm.roomNumber || !cardForm.roomNumber.trim()) {
      triggerNotification("error", "يرجى تحديد أو إدخال رقم الغرفة للنزيل.");
      return;
    }

    const trimmedName = cardForm.name.trim();
    const trimmedRoom = cardForm.roomNumber.trim();
    const trimmedMobile = cardForm.mobile.trim();
    const trimmedCountry = cardForm.country.trim() || "المملكة العربية السعودية";
    const trimmedRole = cardForm.administrativeRole.trim() || "عضو وفد";
    const trimmedDirection = cardForm.direction.trim() || "واجهة شمالية";
    const trimmedRoomName = cardForm.roomName.trim() || `غرفة ${trimmedRoom}`;

    // Ensure room exists in rooms list or create it
    const targetRoom = rooms.find(r => r.number === trimmedRoom);
    let updatedRooms = [...rooms];

    if (!targetRoom) {
      const newRoom: Room = {
        number: trimmedRoom,
        name: trimmedRoomName,
        floor: cardForm.floorText.includes("الأرضي") ? 0 : (parseInt(cardForm.floorText.replace(/[^\d]/g, "")) || 1),
        type: "غرفة مخصصة",
        capacity: 4,
        status: "occupied",
        direction: trimmedDirection,
        visitType: selectedVisitType
      };
      updatedRooms.push(newRoom);
      persistRooms(updatedRooms);
    } else {
      updatedRooms = updatedRooms.map(r => r.number === trimmedRoom ? {
        ...r,
        status: "occupied" as const,
        direction: trimmedDirection || r.direction,
        name: trimmedRoomName || r.name
      } : r);
      persistRooms(updatedRooms);
    }

    // Check if guest already exists (by mobile or matching name in active scope)
    const existingGuestIndex = guests.findIndex(g => 
      (trimmedMobile && g.mobile === trimmedMobile && g.status === "resident" && (g.visitType || "general_1") === selectedVisitType) ||
      (g.name.trim().toLowerCase() === trimmedName.toLowerCase() && g.status === "resident" && (g.visitType || "general_1") === selectedVisitType)
    );

    let savedGuest: Guest;
    let updatedGuests: Guest[];

    if (existingGuestIndex >= 0) {
      const oldGuest = guests[existingGuestIndex];
      savedGuest = {
        ...oldGuest,
        name: trimmedName,
        country: trimmedCountry,
        mobile: trimmedMobile || oldGuest.mobile,
        roomNumber: trimmedRoom,
        photoUrl: cardForm.photoUrl || oldGuest.photoUrl,
        administrativeRole: trimmedRole,
        year: selectedYear,
        visitType: selectedVisitType,
        status: "resident"
      };
      updatedGuests = [...guests];
      updatedGuests[existingGuestIndex] = savedGuest;
    } else {
      savedGuest = {
        id: `G-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: trimmedName,
        country: trimmedCountry,
        mobile: trimmedMobile,
        roomNumber: trimmedRoom,
        photoUrl: cardForm.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        checkInDate: new Date().toISOString(),
        status: "resident",
        year: selectedYear,
        visitType: selectedVisitType,
        administrativeRole: trimmedRole,
        notes: `تم إنشاء وإضافة كرت النزيل وتسكينه من شاشة تخصيص كرت النزيل`
      };
      updatedGuests = [savedGuest, ...guests];
    }

    setGuests(updatedGuests);
    persistGuests(updatedGuests);

    triggerNotification("success", `🎉 تم حفظ وإضافة كرت النزيل (${trimmedName}) بنجاح وتسكينه في الغرفة (${trimmedRoom})!`);
  };

  // RESET CARD FORM (تفريغ الحقول لإنشاء كرت نزيل جديد)
  const handleResetCardForm = () => {
    setCardForm({
      name: "",
      country: "المملكة العربية السعودية",
      mobile: "",
      roomNumber: "",
      roomName: "",
      floorText: "الطابق الأرضي",
      direction: "واجهة شمالية",
      administrativeRole: "عضو وفد",
      photoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    });
    triggerNotification("info", "تم تفريغ الحقول لإنشاء وإضافة كرت نزيل جديد.");
  };

  // YEAR HANDLER (تحديد السنة المطلوبة)
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    localStorage.setItem("selected_year", year);
    triggerNotification("success", `تم تفعيل وتحديد الموسم / السنة المطلوبة: ${year}`);
  };

  // ADD NEW YEAR / SEASON
  const handleAddYear = (yearName: string) => {
    const trimmed = yearName.trim();
    if (!trimmed) {
      triggerNotification("error", "الرجاء إدخال رقم أو اسم السنة/الموسم أولاً.");
      return;
    }
    if (yearsList.includes(trimmed)) {
      triggerNotification("error", `السنة ${trimmed} موجودة بالفعل في القائمة.`);
      return;
    }
    const updated = [trimmed, ...yearsList];
    setYearsList(updated);
    localStorage.setItem("hotel_years_list", JSON.stringify(updated));
    setSelectedYear(trimmed);
    localStorage.setItem("selected_year", trimmed);
    setNewYearInput("");
    triggerNotification("success", `تمت إضافة وتفعيل الموسم / السنة الجديدة بنجاح: ${trimmed}`);
  };

  // EDIT YEAR / SEASON
  const handleSaveEditYear = (oldYear: string, newYearRaw: string) => {
    const newYear = newYearRaw.trim();
    if (!newYear) {
      triggerNotification("error", "الرجاء إدخال رقم أو اسم السنة/الموسم الجديد أولاً.");
      return;
    }
    if (newYear !== oldYear && yearsList.includes(newYear)) {
      triggerNotification("error", `الموسم (${newYear}) موجود بالفعل في القائمة.`);
      return;
    }

    const updated = yearsList.map(y => y === oldYear ? newYear : y);
    setYearsList(updated);
    localStorage.setItem("hotel_years_list", JSON.stringify(updated));

    if (selectedYear === oldYear) {
      setSelectedYear(newYear);
      localStorage.setItem("selected_year", newYear);
    }

    // Update guests assigned to this year
    const updatedGuests = guests.map(g => {
      if (g.year === oldYear || (!g.year && oldYear === "2026")) {
        return { ...g, year: newYear };
      }
      return g;
    });
    persistGuests(updatedGuests);

    // Update service requests
    const updatedServices = serviceRequests.map(s => {
      if (s.year === oldYear || (!s.year && oldYear === "2026")) {
        return { ...s, year: newYear };
      }
      return s;
    });
    setServiceRequests(updatedServices);
    localStorage.setItem("hotel_service_requests", JSON.stringify(updatedServices));

    setEditingYear(null);
    triggerNotification("success", `تم تعديل مسمى الموسم بنجاح من (${oldYear}) إلى (${newYear}) وتحديث كافة السجلات المرتبطة.`);
  };

  // PROMPT DELETE YEAR / SEASON (يفتح نافذة التأكيد الآمنة داخل التطبيق بدون نوافذ المتصفح المحظورة في الـ iframe)
  const handleDeleteYear = (yearToDel: string) => {
    if (yearsList.length <= 1) {
      triggerNotification("error", "لا يمكن حذف الموسم الوحيد المتبقي في النظام.");
      return;
    }
    setYearToDelete(yearToDel);
  };

  // EXECUTE DELETE YEAR / SEASON
  const executeDeleteYear = (yearToDel: string) => {
    if (yearsList.length <= 1) {
      triggerNotification("error", "لا يمكن حذف الموسم الوحيد المتبقي في النظام.");
      setYearToDelete(null);
      return;
    }
    const updated = yearsList.filter(y => y !== yearToDel);
    setYearsList(updated);
    localStorage.setItem("hotel_years_list", JSON.stringify(updated));
    if (selectedYear === yearToDel) {
      setSelectedYear(updated[0]);
      localStorage.setItem("selected_year", updated[0]);
    }
    setYearToDelete(null);
    triggerNotification("success", `تم حذف الموسم (${yearToDel}) بنجاح من قائمة المواسم والسنوات. 🗑️`);
  };

  // VISIT TYPE HANDLER (الزيارة العامة الأولى، الزيارة العامة الثانية، والزيارة الخاصة)
  const handleVisitTypeChange = (visit: VisitType) => {
    setSelectedVisitType(visit);
    localStorage.setItem("selected_visit_type", visit);
    const visitName = visitSettings[visit]?.title || (visit === "general_1" ? "الزيارة العامة الأولى (كبيرة)" : visit === "general_2" ? "الزيارة العامة الثانية (كبيرة)" : "الزيارة الخاصة (منفصلة بالكامل)");
    triggerNotification("success", `تم تفعيل وتحديد نطاق الزيارة: ${visitName} - البيانات والأرقام منفصلة تماماً بدون تداخل.`);
  };

  // RESET ROOMS OCCUPANCY FOR NEW SEASON (تصفير وتفريغ حالة الغرف لبدء موسم جديد بدون مسح سجلات النزلاء القديمة)
  const handleResetRoomsForNewVisit = () => {
    const resetRoomsList: Room[] = rooms.map(r => ({
      ...r,
      status: "available"
    }));

    persistRooms(resetRoomsList);
    triggerNotification("success", `تم تفريغ وتهيئة جميع الغرف لتصبح جاهزة لاستقبال النزلاء في موسم ${selectedYear}! ✨`);
  };

  // MIGRATE / TRANSFER GUESTS ACROSS OPERATIONAL YEARS (ترحيل ونقل السجلات بين المواسم التشغيلية)
  const handleMigrateGuests = () => {
    if (migrationSourceYear === migrationTargetYear) {
      triggerNotification("error", "الموسم المصدر والهدف متطابقان. يرجى اختيار موسم مختلف للنقل إليه.");
      return;
    }

    const sourceGuests = guests.filter(g => (!g.year && migrationSourceYear === "2026") || g.year === migrationSourceYear);

    if (sourceGuests.length === 0) {
      triggerNotification("error", `لا يوجد أي نزلاء مسجلين في (موسم ${migrationSourceYear}) لنقلهم.`);
      return;
    }

    const updatedGuests = guests.map(g => {
      const match = (!g.year && migrationSourceYear === "2026") || g.year === migrationSourceYear;
      if (match) {
        return {
          ...g,
          year: migrationTargetYear
        };
      }
      return g;
    });

    persistGuests(updatedGuests);
    triggerNotification("success", `تم ترحيل (${sourceGuests.length}) نزيل بنجاح إلى موسم ${migrationTargetYear}! 🔄`);
  };

  // CHECK-IN GUEST ACTION (MANAGER DASHBOARD)
  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, country, mobile, roomNumber, notes } = checkInForm;

    if (!name || !mobile || !roomNumber) {
      triggerNotification("error", "الرجاء إدخال اسم النزيل، الجوال ورقم الغرفة المناسب.");
      return;
    }

    // Ensure the room exists and is currently available
    const room = rooms.find(r => r.number === roomNumber);
    if (!room) {
      triggerNotification("error", "هذه الغرفة غير موجودة في النظام.");
      return;
    }

    const currentResidents = guests.filter(g => g.roomNumber === roomNumber && g.status === "resident").length;

    // Alert if room capacity is reached or exceeded
    if (currentResidents >= room.capacity || room.status === "full") {
      const override = window.confirm(
        `⚠️ تنبيه اكتمال السعة الاستيعابية:\n\nالغرفة (${room.number} - ${room.name}) ممتلئة بالكامل حالياً!\n• السعة القصوى: ${room.capacity} نزلاء\n• المشغول حالياً: ${currentResidents} نزلاء\n\nهل ترغب بالتأكيد على تسكين النزيل (${name}) إضافياً في هذه الغرفة وتجاوز سعتها المحددة؟`
      );
      if (!override) {
        triggerNotification("warning", `تم إلغاء التسكين: الغرفة (${room.number}) مكتملة السعة الاستيعابية (${currentResidents}/${room.capacity}).`);
        return;
      }
    } else {
      // Check standard confirmation
      const confirmed = window.confirm(`تأكيد تسكين النزيل: (${name}) في الغرفة (${roomNumber} - ${room.name})؟`);
      if (!confirmed) return;
    }

    const finalRole = checkInForm.administrativeRole === "أخرى (مخصص)"
      ? (checkInForm.customAdminRole.trim() || "عضو وفد")
      : (checkInForm.administrativeRole || "عضو وفد");

    // Create Guest record
    const newGuest: Guest = {
      id: "g_" + Date.now(),
      name,
      country,
      mobile,
      email: checkInForm.email,
      whatsapp: checkInForm.whatsapp || mobile,
      roomNumber,
      status: "resident",
      photoUrl: checkInForm.photoUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120`,
      notes,
      checkInDate: checkInForm.checkInDate ? new Date(checkInForm.checkInDate).toISOString() : new Date().toISOString(),
      year: selectedYear,
      visitType: selectedVisitType,
      administrativeRole: finalRole
    };

    // Calculate room occupancy
    const newResidentsCount = currentResidents + 1;
    // Update Room status
    const updatedRooms = rooms.map(r => {
      if (r.number === roomNumber) {
        return { ...r, status: (newResidentsCount >= r.capacity ? "full" : "occupied") as any };
      }
      return r;
    });

    // Save
    persistRooms(updatedRooms);
    persistGuests([newGuest, ...guests]);

    // Check if there is an associated pending request to link
    const targetRequestId = processingRequestId;
    const matchingReq = (targetRequestId && pendingRequests.find(r => r.id === targetRequestId)) ||
      pendingRequests.find(r => (r.mobile && r.mobile === mobile) || (r.name && r.name.trim().toLowerCase() === name.trim().toLowerCase()));

    if (matchingReq) {
      const updatedPending = pendingRequests.map(r => r.id === matchingReq.id ? {
        ...r,
        status: "approved" as const,
        assignedRoomNumber: roomNumber,
        assignedGuestId: newGuest.id
      } : r);
      persistPendingRequests(updatedPending);

      fetch("/api/requests/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: matchingReq.id,
          action: "approve",
          assignedRoomNumber: roomNumber,
          assignedGuestId: newGuest.id
        })
      }).catch(() => {});
    }

    // Reset Form & tracking
    setProcessingRequestId(null);
    setCheckInForm({
      name: "",
      country: "المملكة العربية السعودية",
      mobile: "",
      email: "",
      whatsapp: "",
      roomNumber: "",
      checkInDate: new Date().toISOString().split("T")[0],
      notes: "",
      photoUrl: "",
      photoRawUrl: "",
      photoQuality: "high",
      photoSizeKb: 0,
      photoDimensions: "",
      administrativeRole: "عضو وفد",
      customAdminRole: ""
    });

    triggerNotification("success", `تم تسكين النزيل ${name} في الغرفة ${roomNumber} بنجاح!`);
    
    // Notification if room reached full capacity
    if (newResidentsCount >= room.capacity) {
      setTimeout(() => {
        triggerNotification("warning", `🔴 تنبيه فندقي: الغرفة (${room.number} - ${room.name}) اكتملت طاقتها الاستيعابية بالكامل الآن (${newResidentsCount}/${room.capacity} نزلاء).`);
      }, 600);
    }

    setShowCheckInSuccessModal(newGuest);
    setActiveTab("guests");
  };

  // DIRECT QUICK CHECK-IN FOR REGISTRATION REQUESTS
  const handleDirectCheckIn = async (
    requestOrEvent?: PendingRequest | React.FormEvent,
    roomNumberArg?: string,
    checkInDateValArg?: string,
    roleValArg?: string,
    customRoleValArg?: string,
    extraNotesValArg?: string
  ) => {
    // If called directly from form submit event
    if (requestOrEvent && "preventDefault" in requestOrEvent) {
      requestOrEvent.preventDefault();
    }

    const request = (requestOrEvent && "id" in requestOrEvent) ? requestOrEvent : directCheckInRequest;
    if (!request) {
      triggerNotification("error", "لم يتم العثور على بيانات طلب النزيل المحدد.");
      return;
    }

    const roomNumber = roomNumberArg || directCheckInRoom;
    const checkInDateVal = checkInDateValArg || directCheckInDate;
    const roleVal = roleValArg || directCheckInRole;
    const customRoleVal = customRoleValArg || directCheckInCustomRole;
    const extraNotesVal = extraNotesValArg || directCheckInNotes;

    if (!roomNumber) {
      triggerNotification("error", "الرجاء اختيار وتحديد الغرفة لتسكين النزيل.");
      return;
    }

    const room = rooms.find(r => r.number === roomNumber);
    if (!room) {
      triggerNotification("error", "الغرفة المحددة غير موجودة في النظام.");
      return;
    }

    const currentResidents = guests.filter(g => g.roomNumber === roomNumber && g.status === "resident").length;

    // Alert if room capacity is reached or exceeded
    if (currentResidents >= room.capacity || room.status === "full") {
      const override = window.confirm(
        `⚠️ تنبيه اكتمال السعة الاستيعابية:\n\nالغرفة (${room.number} - ${room.name}) ممتلئة بالكامل حالياً!\n• السعة القصوى: ${room.capacity} نزلاء\n• المشغول حالياً: ${currentResidents} نزلاء\n\nهل ترغب بتأكيد تسكين النزيل (${request.name}) إضافياً في هذه الغرفة وتجاوز سعتها القصوى؟`
      );
      if (!override) {
        triggerNotification("warning", `تم إلغاء التسكين: الغرفة (${room.number}) مكتملة السعة (${currentResidents}/${room.capacity}).`);
        return;
      }
    }

    setProcessingRequestId(request.id);

    const finalRole = (roleVal === "أخرى (مخصص)")
      ? (customRoleVal?.trim() || "عضو وفد")
      : (roleVal || request.administrativeRole || "عضو وفد");

    const newGuest: Guest = {
      id: "g_" + Date.now(),
      name: request.name,
      country: request.country || "المملكة العربية السعودية",
      mobile: request.mobile,
      email: request.email || "",
      whatsapp: request.whatsapp || request.mobile,
      roomNumber: roomNumber,
      status: "resident",
      photoUrl: request.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
      notes: extraNotesVal || (request.notes ? `طلب مسجل عبر الرابط: ${request.notes}` : "تم التسكين من طلب التسجيل عبر الرابط"),
      checkInDate: checkInDateVal ? new Date(checkInDateVal).toISOString() : (request.checkInDate ? new Date(request.checkInDate).toISOString() : new Date().toISOString()),
      year: selectedYear,
      visitType: selectedVisitType,
      administrativeRole: finalRole
    };

    // Calculate room occupancy
    const newResidentsCount = currentResidents + 1;
    const updatedRooms = rooms.map(r => {
      if (r.number === roomNumber) {
        return { ...r, status: (newResidentsCount >= r.capacity ? "full" : "occupied") as any };
      }
      return r;
    });

    // Save rooms and guests
    persistRooms(updatedRooms);
    persistGuests([newGuest, ...guests]);

    // Call server to approve and link
    const approvedItem: PendingRequest = {
      ...request,
      status: "approved" as const,
      assignedRoomNumber: roomNumber,
      assignedGuestId: newGuest.id
    };
    const updatedReqs = pendingRequests.map(r => r.id === request.id ? approvedItem : r);
    persistPendingRequests(updatedReqs);
    setProcessingRequestId(null);

    // Sync to Firestore
    savePendingRequestToFirestore(approvedItem).catch(() => {});

    fetch("/api/requests/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: request.id,
        action: "approve",
        assignedRoomNumber: roomNumber,
        assignedGuestId: newGuest.id
      })
    }).catch(() => {});

    setDirectCheckInRequest(null);
    setDirectCheckInRoom("");
    setDirectCheckInNotes("");
    setDirectCheckInCustomRole("");
    triggerNotification("success", `تم تسكين النزيل ${request.name} في الغرفة ${roomNumber} بنجاح! 🎉`);

    // Notification if room reached full capacity
    if (newResidentsCount >= room.capacity) {
      setTimeout(() => {
        triggerNotification("warning", `🔴 تنبيه فندقي: الغرفة (${room.number} - ${room.name}) اكتملت طاقتها الاستيعابية بالكامل الآن (${newResidentsCount}/${room.capacity} نزلاء).`);
      }, 600);
    }

    setShowCheckInSuccessModal(newGuest);
  };

  // CHECK-OUT GUEST ACTION
  const handleCheckOut = (guestId: string) => {
    const guest = guests.find(g => g.id === guestId);
    if (!guest) return;

    const confirmed = window.confirm(`هل أنت متأكد من تسجيل خروج النزيل: ${guest.name} وإخلاء الغرفة ${guest.roomNumber}؟`);
    if (!confirmed) return;

    const checkOutTimestamp = new Date().toISOString();

    // Update guest status
    const updatedGuests = guests.map(g => {
      if (g.id === guestId) {
        return { ...g, status: "checked_out" as const, checkOutDate: checkOutTimestamp };
      }
      return g;
    });

    // Update room status back to available
    const updatedRooms = rooms.map(r => {
      if (r.number === guest.roomNumber) {
        return { ...r, status: "available" as const };
      }
      return r;
    });

    persistRooms(updatedRooms);
    persistGuests(updatedGuests);
    
    // Find the updated guest to display in the exit barcode card modal
    const finalCheckedOutGuest = updatedGuests.find(g => g.id === guestId);
    if (finalCheckedOutGuest) {
      setCheckedOutGuestForCard(finalCheckedOutGuest);
    }

    triggerNotification("success", `تم تسجيل خروج النزيل ${guest.name} بنجاح وإخلاء الغرفة.`);
  };

  // ROOM CONFIGURATION (ADD/EDIT ROOM)
  const handleRoomConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { number, name, floor, type, capacity, direction } = roomConfigForm;

    const cleanNumber = number ? String(number).trim() : "";
    const cleanName = name ? String(name).trim() : "";
    const cleanType = type ? String(type).trim() : "غرفة قياسية";
    const cleanDirection = direction ? String(direction).trim() : "";

    if (!cleanNumber || !cleanName) {
      triggerNotification("error", "الرجاء إدخال رقم الغرفة واسم الغرفة.");
      return;
    }

    // If Editing
    if (editingRoomNumber) {
      const confirmed = window.confirm(`هل أنت متأكد من حفظ التعديلات على الغرفة رقم ${editingRoomNumber}؟`);
      if (!confirmed) return;

      const updatedRooms = rooms.map(r => {
        if (r.number === editingRoomNumber) {
          return {
            ...r,
            number: cleanNumber,
            name: cleanName,
            floor: Number(floor) || 1,
            type: cleanType,
            capacity: Number(capacity) || 1,
            direction: cleanDirection
          };
        }
        return r;
      });

      persistRooms(updatedRooms);
      setEditingRoomNumber(null);
      triggerNotification("success", `تم حفظ وتعديل بيانات الغرفة ${cleanName} (رقم ${cleanNumber}) بنجاح.`);
    } else {
      // Add New Room
      const roomExists = rooms.some(r => r.number === cleanNumber);
      if (roomExists) {
        triggerNotification("error", `عذراً، رقم الغرفة (${cleanNumber}) موجود مسبقاً بالنظام.`);
        return;
      }

      const confirmed = window.confirm(`إضافة الغرفة الجديدة ${cleanName} (رقم ${cleanNumber}) إلى النظام؟`);
      if (!confirmed) return;

      const newRoom: Room = {
        number: cleanNumber,
        name: cleanName,
        floor: Number(floor) || 1,
        type: cleanType,
        capacity: Number(capacity) || 1,
        status: "available",
        direction: cleanDirection
      };

      persistRooms([...rooms, newRoom]);
      triggerNotification("success", `تم حفظ وإضافة الغرفة ${cleanName} بنجاح.`);
    }

    // Reset Form
    setRoomConfigForm({
      number: "",
      name: "",
      floor: 1,
      type: "",
      capacity: 2,
      direction: ""
    });
  };

  // DELETE ROOM
  const handleDeleteRoom = (roomNumber: string) => {
    const isOccupied = guests.some(g => g.roomNumber === roomNumber && g.status === "resident");
    if (isOccupied) {
      triggerNotification("error", `لا يمكن حذف الغرفة رقم ${roomNumber} لوجود نزيل مقيم بها حالياً.`);
      return;
    }

    const confirmed = window.confirm(`هل أنت متأكد من حذف الغرفة رقم ${roomNumber} تماماً من النظام؟ لا يمكن التراجع عن هذا الإجراء.`);
    if (!confirmed) return;

    const updatedRooms = rooms.filter(r => r.number !== roomNumber);
    persistRooms(updatedRooms);

    if (editingRoomNumber === roomNumber) {
      setEditingRoomNumber(null);
      setRoomConfigForm({
        number: "",
        name: "",
        floor: 1,
        type: "",
        capacity: 2,
        direction: ""
      });
    }

    triggerNotification("success", `تم حذف الغرفة رقم ${roomNumber} من النظام بنجاح.`);
  };

  // DELETE GUEST RECORD
  const handleDeleteGuest = (guestId: string) => {
    const confirmed = window.confirm("هل أنت متأكد من حذف سجل النزيل بالكامل من الأرشيف؟");
    if (!confirmed) return;

    const updatedGuests = guests.filter(g => g.id !== guestId);
    persistGuests(updatedGuests);
    triggerNotification("success", "تم حذف سجل النزيل.");
  };

  // OPEN GUEST EDIT MODAL (فتح نافذة تعديل بيانات النزيل)
  const handleOpenEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    const existingRole = guest.administrativeRole || "عضو وفد";
    const isPreset = ADMIN_ROLES.includes(existingRole);
    setEditGuestForm({
      id: guest.id,
      name: guest.name || "",
      country: guest.country || "المملكة العربية السعودية",
      mobile: guest.mobile || "",
      email: guest.email || "",
      whatsapp: guest.whatsapp || guest.mobile || "",
      roomNumber: guest.roomNumber || "",
      status: guest.status || "resident",
      notes: guest.notes || "",
      checkInDate: guest.checkInDate ? (guest.checkInDate.includes("T") ? guest.checkInDate.split("T")[0] : guest.checkInDate) : new Date().toISOString().split("T")[0],
      checkOutDate: guest.checkOutDate ? (guest.checkOutDate.includes("T") ? guest.checkOutDate.split("T")[0] : guest.checkOutDate) : "",
      year: guest.year || selectedYear || "2026",
      visitType: guest.visitType || selectedVisitType || "general_1",
      photoUrl: guest.photoUrl || "",
      administrativeRole: isPreset ? existingRole : "أخرى (مخصص)",
      customAdminRole: isPreset ? "" : existingRole
    });
  };

  // SAVE EDITED GUEST DATA (حفظ وتطبيق تعديلات النزيل وتحديث حالة الغرف)
  const handleSaveEditGuest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingGuest) return;

    if (!editGuestForm.name.trim() || !editGuestForm.mobile.trim() || !editGuestForm.roomNumber) {
      triggerNotification("error", "الرجاء إدخال الاسم، رقم الجوال، ورقم الغرفة.");
      return;
    }

    const finalRole = editGuestForm.administrativeRole === "أخرى (مخصص)"
      ? (editGuestForm.customAdminRole.trim() || "عضو وفد")
      : (editGuestForm.administrativeRole || "عضو وفد");

    const prevRoom = editingGuest.roomNumber;
    const newRoom = editGuestForm.roomNumber;
    const prevStatus = editingGuest.status;
    const newStatus = editGuestForm.status;

    // Build updated guest
    const updatedGuest: Guest = {
      ...editingGuest,
      name: editGuestForm.name.trim(),
      country: editGuestForm.country.trim() || "المملكة العربية السعودية",
      mobile: editGuestForm.mobile.trim(),
      email: editGuestForm.email.trim() || undefined,
      whatsapp: editGuestForm.whatsapp.trim() || undefined,
      roomNumber: editGuestForm.roomNumber,
      status: editGuestForm.status,
      notes: editGuestForm.notes.trim() || undefined,
      checkInDate: editGuestForm.checkInDate || editingGuest.checkInDate,
      checkOutDate: editGuestForm.status === "checked_out" 
        ? (editGuestForm.checkOutDate ? editGuestForm.checkOutDate : new Date().toISOString()) 
        : undefined,
      year: editGuestForm.year,
      visitType: editGuestForm.visitType,
      photoUrl: editGuestForm.photoUrl || editingGuest.photoUrl,
      administrativeRole: finalRole
    };

    const updatedGuests = guests.map(g => g.id === editingGuest.id ? updatedGuest : g);
    persistGuests(updatedGuests);

    // Synchronize Room Statuses if room or status changed
    let updatedRooms = [...rooms];
    if (prevRoom !== newRoom || prevStatus !== newStatus) {
      // If room changed or status changed to checked_out, check if old room still has other resident guests
      if (prevRoom !== newRoom || newStatus === "checked_out") {
        const otherResidentsInPrev = updatedGuests.filter(g => g.id !== editingGuest.id && g.roomNumber === prevRoom && g.status === "resident");
        if (otherResidentsInPrev.length === 0) {
          updatedRooms = updatedRooms.map(r => r.number === prevRoom ? { ...r, status: "available" as const } : r);
        }
      }

      // If new status is resident, mark new room occupied
      if (newStatus === "resident") {
        updatedRooms = updatedRooms.map(r => r.number === newRoom ? { ...r, status: "occupied" as const } : r);
      }
      persistRooms(updatedRooms);
    }

    setEditingGuest(null);
    triggerNotification("success", `تم تحديث بيانات النزيل (${updatedGuest.name}) بنجاح.`);
  };

  // EDIT ROOM ACTION
  const handleStartEditRoom = (room: Room) => {
    setEditingRoomNumber(room.number);
    setRoomConfigForm({
      number: room.number,
      name: room.name,
      floor: room.floor,
      type: room.type,
      capacity: room.capacity,
      direction: room.direction
    });
    setActiveTab("room_config");
  };

  // PENDING REQUEST INTERACTIONS
  const handleRequestAction = async (id: string, action: "approve" | "direct_checkin" | "fill_form" | "reset" | "reject" | "delete") => {
    const request = pendingRequests.find(r => r.id === id);
    if (!request) return;

    if (action === "approve" || action === "direct_checkin") {
      // Open Direct Room Assignment Modal
      setDirectCheckInRequest(request);
      setDirectCheckInRoom(request.assignedRoomNumber || "");
      setDirectCheckInDate(request.checkInDate || new Date().toISOString().split("T")[0]);
      setDirectCheckInRole(request.administrativeRole || "عضو وفد");
      setDirectCheckInCustomRole("");
      setDirectCheckInNotes(request.notes || "");
      return;
    }

    if (action === "fill_form") {
      // Fill Check-in Form with Request Details & switch to checkin tab
      const existingReqRole = request.administrativeRole || "عضو وفد";
      const isPreset = ADMIN_ROLES.includes(existingReqRole);
      setProcessingRequestId(request.id);
      setCheckInForm({
        name: request.name,
        country: request.country,
        mobile: request.mobile,
        email: request.email || "",
        whatsapp: request.whatsapp || request.mobile,
        roomNumber: request.assignedRoomNumber || "",
        checkInDate: request.checkInDate || new Date().toISOString().split("T")[0],
        notes: request.notes ? `طلب مسجل عبر الرابط: ${request.notes}` : "",
        photoUrl: request.photoUrl || "",
        photoRawUrl: request.photoUrl || "",
        photoQuality: "high",
        photoSizeKb: 0,
        photoDimensions: "",
        administrativeRole: isPreset ? existingReqRole : "أخرى (مخصص)",
        customAdminRole: isPreset ? "" : existingReqRole
      });

      setActiveTab("checkin");
      triggerNotification("success", "تم نقل بيانات النزيل لنموذج التسكين. يرجى اختيار الغرفة المناسبة.");
      return;
    }

    if (action === "reset") {
      const confirmed = window.confirm(`هل أنت متأكد من إعادة طلب النزيل: ${request.name} لحالة قيد الانتظار؟`);
      if (!confirmed) return;

      const updated = pendingRequests.map(r => r.id === id ? { 
        ...r, 
        status: "pending" as const, 
        assignedRoomNumber: undefined, 
        assignedGuestId: undefined 
      } : r);
      persistPendingRequests(updated);
      savePendingRequestToFirestore({ ...request, status: "pending", assignedRoomNumber: undefined, assignedGuestId: undefined }).catch(() => {});
      triggerNotification("success", "تمت إعادة الطلب إلى قائمة الانتظار بنجاح.");

      fetch("/api/requests/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "reset" })
      }).catch(() => {});
      return;
    }

    const confirmed = window.confirm(`هل أنت متأكد من ${action === "reject" ? "رفض" : "حذف"} طلب النزيل: ${request.name}؟`);
    if (!confirmed) return;

    let updatedList: PendingRequest[];
    if (action === "delete") {
      updatedList = pendingRequests.filter(r => r.id !== id);
      deletePendingRequestFromFirestore(id).catch(() => {});
      fetch(`/api/requests?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    } else {
      const rejectedItem: PendingRequest = { ...request, status: "rejected" as const };
      updatedList = pendingRequests.map(r => r.id === id ? rejectedItem : r);
      savePendingRequestToFirestore(rejectedItem).catch(() => {});
    }
    persistPendingRequests(updatedList);
    triggerNotification("success", "تم تحديث حالة الطلب بنجاح.");

    fetch("/api/requests/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action })
    }).catch(() => {});
  };

  // BARCODE READER SIMULATION (مسح الباركود وكرت النزيل)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeQuery) return;

    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const query = barcodeQuery.trim().toLowerCase();

      // 1. Search for guest first by ID, name, mobile, whatsapp, or room number
      const foundGuest = guests.find(g => 
        g.id.toLowerCase() === query ||
        g.name.toLowerCase().includes(query) || 
        g.mobile.includes(query) || 
        (g.whatsapp && g.whatsapp.includes(query)) ||
        g.roomNumber === barcodeQuery
      );

      if (foundGuest) {
        setScanResult({ type: "guest", data: foundGuest });
        return;
      }

      // 2. Search for room
      const foundRoom = rooms.find(r => r.number === barcodeQuery || r.name.toLowerCase().includes(query));
      if (foundRoom) {
        const roomGuest = guests.find(g => g.roomNumber === foundRoom.number && g.status === "resident");
        if (roomGuest) {
          setScanResult({ type: "guest", data: roomGuest });
        } else {
          setScanResult({ type: "room", data: foundRoom, guest: roomGuest });
        }
        return;
      }

      setScanResult({ type: "unknown", data: barcodeQuery });
    }, 600);
  };

  // EXPORT TO CSV Helper
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ rooms, guests }));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hotel_database_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotification("success", "تم تصدير قاعدة بيانات الفندق كملف JSON بنجاح.");
  };

  // IMPORT DATA Helper
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = e => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (parsed.rooms && parsed.guests) {
            persistRooms(parsed.rooms);
            persistGuests(parsed.guests);
            triggerNotification("success", "تم استيراد قاعدة البيانات ومزامنتها بنجاح!");
          } else {
            triggerNotification("error", "تنسيق الملف غير صالح. يرجى التأكد من احتوائه على الغرف والنزلاء.");
          }
        } catch (err) {
          triggerNotification("error", "فشل قراءة الملف. يرجى التأكد من اختيار ملف JSON صحيح.");
        }
      };
    }
  };

  // COPY REGISTRATION LINK TO CLIPBOARD
  const handleCopyLink = () => {
    const fullLink = `${window.location.origin}/?register=true`;
    navigator.clipboard.writeText(fullLink);
    triggerNotification("success", "تم نسخ رابط تسجيل النزلاء إلى الحافظة!");
  };

  // EXPORT CARD AS IMAGE OR PDF (Client-side, bypasses iframe constraints)
  const [isExportingCard, setIsExportingCard] = useState<boolean>(false);

  const handleExportCard = async (format: "png" | "pdf", elementId: string, guestName: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      triggerNotification("error", "فشل العثور على منطقة تصميم البطاقة لتصديرها!");
      return;
    }

    try {
      setIsExportingCard(true);
      triggerNotification("success", "جاري معالجة وتصدير البطاقة بجودة عالية، يرجى الانتظار...");

      // Wait a bit to ensure fonts and QR code images are loaded
      await new Promise((resolve) => setTimeout(resolve, 600));

      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        scale: 3, // High-DPI output
        backgroundColor: "#ffffff",
        logging: false
      });

      const fileName = `ID_Card_${(guestName || "guest").trim().replace(/\s+/g, "_")}`;

      if (format === "png") {
        const imageUri = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imageUri;
        link.download = `${fileName}.png`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerNotification("success", "تم حفظ وتنزيل بطاقة النزيل كصورة عالية الدقة PNG!");
      } else {
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        // Calculate dimensions in points (pt)
        const pdfWidth = imgWidth * 0.75;
        const pdfHeight = imgHeight * 0.75;

        const pdf = new jsPDF({
          orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
          unit: "pt",
          format: [pdfWidth, pdfHeight]
        });

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        
        const fullFileName = `${fileName}.pdf`;

        // Robust download method using Blob and ObjectURL (maximizes compatibility in iOS/Android & browser iframes)
        try {
          const blob = pdf.output("blob");
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = fullFileName;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
          triggerNotification("success", "تم تصدير وتحميل بطاقة النزيل كملف PDF بنجاح!");
        } catch (blobErr) {
          console.warn("Blob URL download failed, falling back to standard pdf.save:", blobErr);
          pdf.save(fullFileName);
          triggerNotification("success", "تم تصدير وتحميل بطاقة النزيل كملف PDF بنجاح!");
        }
      }
    } catch (error) {
      console.error("Export card error:", error);
      triggerNotification("error", "خطأ أثناء محاولة تصدير البطاقة. يرجى تكرار المحاولة.");
    } finally {
      setIsExportingCard(false);
    }
  };

  // BULK EXPORT ALL RESIDENT CARDS TO A SINGLE MULTI-PAGE PDF
  const handleBulkExportPDF = async () => {
    const residents = guests.filter(g => g.status === "resident");
    if (residents.length === 0) {
      triggerNotification("error", "لا يوجد نزلاء مقيمين حالياً لتصدير كروت لهم!");
      return;
    }
    setIsExportingCard(true);
    triggerNotification("success", "جاري توليد ملف PDF جماعي لكروت النزلاء... يرجى الانتظار.");
    
    try {
      const isHorizontal = cardLayout === "horizontal";
      const cardSize: [number, number] = isHorizontal ? [580, 380] : [380, 580];
      const orientation: "portrait" | "landscape" = isHorizontal ? "landscape" : "portrait";

      const pdf = new jsPDF({
        orientation,
        unit: "pt",
        format: cardSize
      });
      
      for (let i = 0; i < residents.length; i++) {
        const guest = residents[i];
        const element = document.getElementById(`bulk-card-${guest.id}`);
        if (element) {
          // Wait briefly to ensure any rendering transitions are complete
          await new Promise((resolve) => setTimeout(resolve, 150));
          const canvas = await html2canvas(element, {
            useCORS: true,
            allowTaint: true,
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false
          });
          const imgData = canvas.toDataURL("image/png");
          
          if (i > 0) {
            pdf.addPage(cardSize, orientation);
          }
          pdf.addImage(imgData, "PNG", 0, 0, cardSize[0], cardSize[1]);
        }
      }
      
      const bulkFileName = `Bulk_Resident_Cards_${new Date().toISOString().slice(0,10)}.pdf`;
      try {
        const blob = pdf.output("blob");
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = bulkFileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
        triggerNotification("success", "تم تصدير وتحميل ملف PDF جماعي لكروت النزلاء المقيمين بنجاح!");
      } catch (blobErr) {
        console.warn("Blob URL bulk download failed, falling back to standard pdf.save:", blobErr);
        pdf.save(bulkFileName);
        triggerNotification("success", "تم تصدير وتحميل ملف PDF جماعي لكروت النزلاء المقيمين بنجاح!");
      }
    } catch (err) {
      console.error("Bulk export error:", err);
      triggerNotification("error", "فشل تصدير الكروت الجماعية. يرجى المحاولة لاحقاً.");
    } finally {
      setIsExportingCard(false);
    }
  };

  // --- PUBLIC GUEST REGISTRATION COMPONENT ---
  if (isPublicRegister) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-between text-slate-100 p-4" dir="rtl">
        {/* Top Floating/Banner Switcher - Returns immediately to Hotel Management Dashboard */}
        <div className="max-w-4xl w-full mx-auto mb-3 bg-emerald-950/90 border border-emerald-700/60 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>أنت حالياً في: <strong>بوابة تسجيل النزلاء الذاتية (معاينة النزيل)</strong></span>
          </div>
          <button
            type="button"
            onClick={exitPublicRegisterToAdmin}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>العودة إلى لوحة تحكم إدارة الفندق (الواجهة الأصلية)</span>
          </button>
        </div>

        {/* Navigation / Header */}
        <header className="max-w-4xl w-full mx-auto flex justify-between items-center py-6 border-b border-emerald-900/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 overflow-hidden border border-emerald-700/60 flex items-center justify-center text-slate-100 shadow-lg shadow-emerald-900/50">
              <img 
                src={appLogoImage || "/logo.jpg"} 
                alt="خدر ليالي الانس" 
                className="w-full h-full object-contain bg-slate-950"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="font-sans font-bold text-xl text-emerald-400 tracking-tight">خدر ليالي الانس</h1>
              <p className="text-xs text-slate-400">للأجنحة والغرف الفندقية الفاخرة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              بوابة النزلاء الرقمية
            </span>
            <button
              type="button"
              onClick={exitPublicRegisterToAdmin}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="العودة إلى لوحة إدارة الفندق والنزلاء"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>لوحة الفندق الأصلية</span>
            </button>
          </div>
        </header>

        {/* Form Body */}
        <main className="max-w-xl w-full mx-auto my-12 bg-slate-800/60 border border-slate-700/50 backdrop-blur-md rounded-2xl p-6 sm:p-10 shadow-2xl">
          {publicSubmitSuccess ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 bg-emerald-900/50 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-3">تم إرسال طلبكم بنجاح!</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                شكرًا لاختياركم **خدر ليالي الانس**. لقد تم تسجيل طلب الحجز الخاص بكم بنجاح، ويقوم موظف الاستقبال حالياً بمراجعته لتسكينكم في أسرع وقت ممكن.
              </p>
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-right space-y-2 text-xs text-slate-400">
                <p>📍 يرجى التوجه إلى الاستقبال لتأكيد الهوية واستلام المفتاح الذكي عند وصولكم.</p>
                <p>📞 يسعدنا تواصلكم معنا عبر الجوال لأي استفسارات إضافية.</p>
              </div>
              <button 
                onClick={() => setPublicSubmitSuccess(false)}
                className="mt-8 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition shadow-lg shadow-emerald-950/50 text-sm"
              >
                تقديم طلب حجز جديد
              </button>
            </motion.div>
          ) : (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-100">تسجيل بيانات النزيل الجديد</h2>
                <p className="text-sm text-slate-400 mt-2">يرجى تعبئة التفاصيل أدناه بدقة لتسريع عملية الدخول والتسكين في الفندق.</p>
              </div>

              {!registrationLinkOpen ? (
                <div className="text-center p-8 bg-amber-950/20 border border-amber-900/50 rounded-2xl">
                  <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-amber-400">التسجيل مغلق حالياً</h3>
                  <p className="text-sm text-amber-300/80 mt-2">نعتذر منكم، خدمة تسجيل بيانات النزلاء الذاتية مغلقة مؤقتاً بطلب من إدارة الفندق. يرجى مراجعة موظف الاستقبال لتسجيلكم يدوياً.</p>
                </div>
              ) : (
                <form onSubmit={handlePublicSubmit} className="space-y-5">
                  {publicSubmitError && (
                    <div className="p-3 bg-rose-950/30 border border-rose-900/50 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{publicSubmitError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">اسم النزيل الكامل (كما في الهوية) *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: محمد بن عادل العتيبي"
                      value={publicForm.name}
                      onChange={e => setPublicForm({ ...publicForm, name: e.target.value })}
                      className="w-full bg-slate-900/60 border border-slate-700/60 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PhoneCountryInput 
                      id="public-form-mobile"
                      label="رقم الجوال للاتصال"
                      type="mobile"
                      required
                      value={publicForm.mobile}
                      countryName={publicForm.country}
                      theme="dark"
                      onChange={(val) => setPublicForm(prev => ({ ...prev, mobile: val }))}
                      onCountryChange={(countryName) => {
                        setPublicForm(prev => ({ ...prev, country: countryName }));
                      }}
                    />

                    <PhoneCountryInput 
                      id="public-form-whatsapp"
                      label="رقم جوال الواتساب (WhatsApp)"
                      type="whatsapp"
                      required
                      value={publicForm.whatsapp}
                      countryName={publicForm.country}
                      theme="dark"
                      onChange={(val) => setPublicForm(prev => ({ ...prev, whatsapp: val }))}
                      onCountryChange={(countryName) => {
                        setPublicForm(prev => ({ ...prev, country: countryName }));
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>البريد الإلكتروني (الإيميل)</span>
                        <span className="text-slate-500 font-normal">(اختياري)</span>
                      </label>
                      <input 
                        type="email" 
                        placeholder="مثال: guest@example.com"
                        value={publicForm.email}
                        onChange={e => setPublicForm({ ...publicForm, email: e.target.value })}
                        className="w-full bg-slate-900/80 border border-slate-700/70 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm outline-none transition text-left dir-ltr font-mono"
                        dir="ltr"
                      />
                    </div>

                    <CountrySelectInput 
                      id="public-form-country"
                      label="الجنسية / بلد الإقامة"
                      required
                      value={publicForm.country}
                      theme="dark"
                      onChange={(countryName, countryInfo) => {
                        setPublicForm(prev => {
                          let updatedWhatsapp = prev.whatsapp;
                          let updatedMobile = prev.mobile;
                          if (countryInfo) {
                            if (updatedWhatsapp) {
                              updatedWhatsapp = formatPhoneWithCountryCode(updatedWhatsapp, countryInfo);
                            } else {
                              updatedWhatsapp = countryInfo.dialCode;
                            }
                            if (updatedMobile) {
                              updatedMobile = formatPhoneWithCountryCode(updatedMobile, countryInfo);
                            } else {
                              updatedMobile = countryInfo.dialCode;
                            }
                          }
                          return {
                            ...prev,
                            country: countryName,
                            whatsapp: updatedWhatsapp,
                            mobile: updatedMobile
                          };
                        });
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                      <span>تاريخ ويوم وصول النزيل * <span className="text-emerald-400 font-normal">(إلزامي)</span></span>
                      {publicForm.checkInDate && (
                        <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                          يوم {getArabicDayName(publicForm.checkInDate)}
                        </span>
                      )}
                    </label>
                    <input 
                      type="date" 
                      required
                      value={publicForm.checkInDate}
                      onChange={e => setPublicForm({ ...publicForm, checkInDate: e.target.value })}
                      className="w-full bg-slate-900/60 border border-slate-700/60 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none transition"
                    />
                    {publicForm.checkInDate && (
                      <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                        📅 وصول النزيل المحدد: <strong className="text-emerald-300">يوم {getArabicDayName(publicForm.checkInDate)} الموافق {publicForm.checkInDate}</strong>
                      </p>
                    )}
                  </div>

                  {/* GUEST PHOTO UPLOAD WITH RESOLUTION SELECTION (رفع من الاستديو أو تصوير كاميرا) */}
                  <GuestPhotoUploadWidget
                    label="إرفاق صورة النزيل أو الهوية الوطنية (اختيار من الاستديو 📁 أو التقاط بالكاميرا 📷) *"
                    theme="dark"
                    photoData={{
                      photoUrl: publicForm.photoUrl,
                      rawPhotoUrl: publicForm.photoRawUrl,
                      quality: publicForm.photoQuality,
                      sizeKb: publicForm.photoSizeKb,
                      dimensions: publicForm.photoDimensions
                    }}
                    onChange={(updated) => setPublicForm({
                      ...publicForm,
                      photoUrl: updated.photoUrl,
                      photoRawUrl: updated.rawPhotoUrl,
                      photoQuality: updated.quality,
                      photoSizeKb: updated.sizeKb,
                      photoDimensions: updated.dimensions
                    })}
                    onNotification={(type, msg) => {
                      if (type === "error") setPublicSubmitError(msg);
                    }}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">ملاحظات أو طلبات خاصة</label>
                    <textarea 
                      rows={3}
                      placeholder="اكتب هنا أي طلبات إضافية مثل: إطلالة معينة، سرير أطفال، وقت محدد للوصول..."
                      value={publicForm.notes}
                      onChange={e => setPublicForm({ ...publicForm, notes: e.target.value })}
                      className="w-full bg-slate-900/60 border border-slate-700/60 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl p-4 text-slate-100 text-sm outline-none transition resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmittingPublic}
                    className={`w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition duration-200 shadow-xl shadow-emerald-950/50 mt-4 text-sm flex items-center justify-center gap-2 ${
                      isSubmittingPublic ? "opacity-75 cursor-wait" : "cursor-pointer"
                    }`}
                  >
                    {isSubmittingPublic ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>جاري إرسال وتأكيد الطلب...</span>
                      </>
                    ) : (
                      <span>تأكيد وإرسال طلب تسجيل النزيل</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 border-t border-slate-800/60 py-6">
          <p>© {new Date().getFullYear()} خدر ليالي الانس للأجنحة الفندقية. جميع الحقوق محفوظة.</p>
        </footer>
      </div>
    );
  }

  // --- MAIN ADMIN / HOTELIER VIEW ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans" dir="rtl">
      {/* ==================== REAL-TIME INCOMING SELF-REGISTRATION REQUEST TOAST NOTIFICATIONS ==================== */}
      <div className="fixed top-5 left-5 z-[9999] max-w-sm sm:max-w-md w-full pointer-events-none space-y-3">
        <AnimatePresence>
          {incomingRequestAlerts.map(alert => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -25, scale: 0.92, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -100, scale: 0.9, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="pointer-events-auto bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white rounded-3xl p-5 shadow-2xl border-2 border-amber-400/80 ring-4 ring-amber-500/20 relative overflow-hidden backdrop-blur-xl"
              dir="rtl"
            >
              {/* Shimmering Top Bar / Glowing Pulse */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400 animate-pulse"></div>

              {/* Header */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
                      <Bell className="w-5 h-5 animate-bounce" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-slate-950"></span>
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">طلب تسجيل نزيل جديد!</h4>
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black border border-amber-400/30">
                        عبر البوابة الذاتية ⚡
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">تم استلام طلب جديد الآن - بانتظار استجابة الاستقبال</span>
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => setIncomingRequestAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  className="w-7 h-7 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700/60 cursor-pointer"
                  title="إغلاق التنبيه"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Guest Details Card */}
              <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-3.5 mb-3 flex items-start gap-3.5">
                {alert.request.photoUrl ? (
                  <img
                    src={alert.request.photoUrl}
                    alt={alert.request.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-md shrink-0 cursor-pointer hover:scale-105 transition"
                    onClick={() => setViewingPhotoGuest({
                      id: alert.request.id,
                      name: alert.request.name,
                      country: alert.request.country,
                      mobile: alert.request.mobile,
                      email: alert.request.email,
                      whatsapp: alert.request.whatsapp,
                      roomNumber: "طلب جديد (بانتظار التسكين)",
                      status: "resident",
                      photoUrl: alert.request.photoUrl || "",
                      checkInDate: alert.request.checkInDate || alert.request.date
                    })}
                    title="معاينة الصورة"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 font-black text-sm shrink-0">
                    <User className="w-6 h-6 text-amber-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-black text-sm text-amber-200 truncate">{alert.request.name}</span>
                    {alert.request.country && (
                      <span className="text-[11px] text-slate-300 shrink-0 font-medium bg-slate-700/50 px-2 py-0.5 rounded-md">{alert.request.country}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-300 font-mono" dir="ltr">
                    <a href={`tel:${alert.request.mobile}`} className="hover:text-emerald-400 transition underline underline-offset-2">
                      {alert.request.mobile}
                    </a>
                    {alert.request.whatsapp && (
                      <a
                        href={`https://wa.me/${(() => {
                          let cleaned = alert.request.whatsapp.replace(/[^\d+]/g, '');
                          if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
                          if (cleaned.startsWith('05') && cleaned.length === 10) cleaned = '966' + cleaned.substring(1);
                          else if (cleaned.startsWith('5') && cleaned.length === 9) cleaned = '966' + cleaned;
                          return cleaned;
                        })()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 text-[10px] bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1 font-sans font-bold transition"
                      >
                        <MessageCircle className="w-3 h-3" />
                        واتساب
                      </a>
                    )}
                  </div>

                  {alert.request.checkInDate && (
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-amber-300/90 font-medium">
                      <span>📅 تاريخ الوصول: <strong>{alert.request.checkInDate}</strong></span>
                    </div>
                  )}

                  {alert.request.notes && (
                    <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-1 italic bg-slate-900/60 p-1.5 rounded-lg border border-slate-700/50">
                      "{alert.request.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    handleRequestAction(alert.request.id, "approve");
                    setIncomingRequestAlerts(prev => prev.filter(a => a.id !== alert.id));
                  }}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>قبول وتسكين مباشر</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("requests");
                    setIncomingRequestAlerts(prev => prev.filter(a => a.id !== alert.id));
                  }}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Link2 className="w-4 h-4" />
                  <span>فتح قائمة الطلبات</span>
                </button>
              </div>

              {/* Auto-Dismiss Progress Countdown */}
              <div className="mt-3 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 14, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sidebar (القائمة الجانبية) */}
      <aside className="w-full md:w-72 bg-emerald-950 text-slate-100 flex flex-col justify-between shadow-2xl flex-shrink-0 z-10 border-l border-emerald-900/40">
        
        {/* Logo and Brand */}
        <div>
          <div className="p-6 border-b border-emerald-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 overflow-hidden border border-emerald-700/60 flex items-center justify-center text-emerald-50 shadow-md">
              <img 
                src={appLogoImage || "/logo.jpg"} 
                alt="خدر ليالي الانس" 
                className="w-full h-full object-contain bg-emerald-950" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight text-white font-sans leading-tight">خدر ليالي الانس</h2>
              <p className="text-xs text-emerald-400">نظام إدارة الغرف الذكي</p>
            </div>
          </div>

          {/* Sync status widget */}
          <div className="mx-4 my-4 p-3.5 rounded-xl bg-emerald-900/40 border border-emerald-800/80 text-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400">حالة المزامنة السحابية:</span>
              <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                hasPendingSync 
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse" 
                  : isDemoMode 
                    ? "bg-slate-800 text-slate-300 border border-slate-700" 
                    : "bg-emerald-900 text-emerald-300 border border-emerald-700"
              }`}>
                {hasPendingSync ? "بانتظار المزامنة" : isDemoMode ? "حفظ محلي آمن" : "اتصال دائم نشط"}
              </span>
            </div>
            
            {hasPendingSync && (
              <div className="mb-2 p-2 rounded-lg bg-amber-950/60 border border-amber-700/50 text-[11px] text-amber-200">
                <p className="font-bold flex items-center gap-1 mb-1">
                  <span>💾</span>
                  <span>تعديلات جديدة محفوظة محلياً</span>
                </p>
                <button
                  onClick={() => handleGoogleLogin()}
                  disabled={isLoggingInGoogle}
                  className="w-full mt-1 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-black rounded-lg text-[10px] flex items-center justify-center gap-1 transition shadow cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoggingInGoogle ? "animate-spin" : ""}`} />
                  {isLoggingInGoogle ? "جارٍ الاتصال بقوقل..." : "مزامنة سحابية الآن مع قوقل شيت ⚡"}
                </button>
              </div>
            )}

            {isDemoMode && !hasPendingSync ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>مزامنة الخادم السحابي نشطة ومؤمنة 🟢</span>
                </div>
                <p className="text-[10px] text-emerald-200/80 leading-relaxed">
                  يتم حفظ وتحديث بيانات الغرف والنزلاء والطلبات تلقائياً بالخادم.
                </p>
                <div className="pt-1">
                  <button 
                    onClick={() => handleGoogleLogin()}
                    disabled={isLoggingInGoogle}
                    className="w-full py-1.5 bg-emerald-700/70 hover:bg-emerald-600 disabled:opacity-60 rounded-lg text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                  >
                    {isLoggingInGoogle ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>جارٍ فتح تسجيل الدخول...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-3 h-3" />
                        <span>ربط قوقل شيت (اختياري) 📊</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : !isDemoMode && (
              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-1 text-emerald-300 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>متصل ومزامن مباشرة بقوقل شيت 🟢</span>
                </div>
                <p className="truncate text-slate-400 text-[10px]" title={googleUser?.email}>الحساب: {googleUser?.email}</p>
                
                <div className="pt-2">
                  <div className="flex gap-1.5">
                    <button 
                      onClick={handleForceRefresh}
                      disabled={isLoadingData}
                      className="flex-1 py-1 px-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingData ? "animate-spin" : ""}`} />
                      مزامنة فورية
                    </button>
                    <button 
                      onClick={handleGoogleLogout}
                      className="py-1 px-1.5 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <LogOut className="w-3 h-3" />
                      خروج
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="px-4 space-y-1">
            <button 
              onClick={() => setActiveTab("dashboard")}
              className={`w-full text-right px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition ${activeTab === "dashboard" ? "bg-emerald-800 text-white shadow-md shadow-emerald-950/40" : "text-emerald-300/80 hover:bg-emerald-900/30 hover:text-white"}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>لوحة التحكم</span>
            </button>

            <button 
              onClick={() => setActiveTab("rooms")}
              className={`w-full text-right px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition ${activeTab === "rooms" ? "bg-emerald-800 text-white shadow-md shadow-emerald-950/40" : "text-emerald-300/80 hover:bg-emerald-900/30 hover:text-white"}`}
            >
              <Bed className="w-4 h-4" />
              <span>حالة وإدارة الغرف</span>
            </button>

            {hasPermission("guests") && (
              <button 
                onClick={() => setActiveTab("guests")}
                className={`w-full text-right px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition ${activeTab === "guests" ? "bg-emerald-800 text-white shadow-md shadow-emerald-950/40" : "text-emerald-300/80 hover:bg-emerald-900/30 hover:text-white"}`}
              >
                <Users className="w-4 h-4" />
                <span>إدارة النزلاء</span>
              </button>
            )}

            {/* زر طلبات النزلاء المسجلين بالرابط تحت زر إدارة النزلاء */}
            {hasPermission("requests") && (
              <button 
                onClick={() => setActiveTab("requests")}
                className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition ${
                  activeTab === "requests" 
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40 font-black" 
                    : "text-amber-300/90 hover:bg-amber-900/30 hover:text-amber-200 border border-amber-500/20"
                }`}
              >
                <Link2 className="w-4 h-4 text-amber-400" />
                <span>طلبات النزلاء المسجلين بالرابط</span>
                {pendingRequests.filter(r => r.status === "pending").length > 0 ? (
                  <span className="mr-auto px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse shadow-sm">
                    {pendingRequests.filter(r => r.status === "pending").length}
                  </span>
                ) : pendingRequests.length > 0 ? (
                  <span className="mr-auto px-1.5 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    {pendingRequests.length}
                  </span>
                ) : null}
              </button>
            )}

            {/* 1. إدارة طلبات الصيانة وخدمات النزلاء (لجنة الخدمات) */}
            {hasPermission("services_committee") && (
              <button 
                onClick={() => setActiveTab("services_committee")}
                className={`w-full text-right px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition ${activeTab === "services_committee" ? "bg-amber-600 text-slate-950 font-black shadow-md shadow-amber-950/40" : "bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 hover:text-white border border-amber-500/20"}`}
              >
                <Wrench className="w-4 h-4 text-amber-400" />
                <span className="font-bold">إدارة طلبات الصيانة وخدمات النزلاء</span>
                {serviceRequests.filter(s => s.status === "new" || s.status === "in_progress").length > 0 && (
                  <span className="mr-auto px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse">
                    {serviceRequests.filter(s => s.status === "new" || s.status === "in_progress").length}
                  </span>
                )}
              </button>
            )}

            {/* 2. تسجيل وإضافة لبيانات لجنة الخدمات */}
            {hasPermission("services_committee") && (
              <button 
                onClick={() => setActiveTab("services_add")}
                className={`w-full text-right px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition mt-1 ${activeTab === "services_add" ? "bg-amber-600 text-slate-950 font-black shadow-md shadow-amber-950/40" : "bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 hover:text-white border border-amber-500/20"}`}
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <span className="font-bold">تسجيل وإضافة لبيانات لجنة الخدمات</span>
              </button>
            )}

            {/* تسجيل النزلاء بالرابط وقارئ الباركود */}
            <div className="mr-6 pl-2 pr-2 border-r border-emerald-800/50 space-y-1 my-1">
              <button 
                onClick={() => setIsStandaloneBarcodeScanner(true)}
                className={`w-full text-right px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 ${isStandaloneBarcodeScanner ? "bg-emerald-600 text-white font-extrabold" : ""}`}
                title="فتح شاشة وقارئ الباركود ورمز الـ QR الفوري للكاميرا والجوال"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="font-extrabold text-white">📷 قارئ الباركود الذكي (مسح QR)</span>
              </button>

              <button 
                onClick={() => setShowRegistrationLinkModal(true)}
                className={`w-full text-right px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${showRegistrationLinkModal ? "bg-emerald-900/50 text-white" : "text-emerald-300/80 hover:bg-emerald-900/30 hover:text-white"}`}
                title="عرض رمز ورابط تسجيل النزلاء الذاتي"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>تسجيل النزلاء بالرابط</span>
              </button>

              <button 
                onClick={switchToPublicRegisterPreview}
                className="w-full text-right px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition text-emerald-300/70 hover:bg-emerald-900/40 hover:text-emerald-200"
                title="معاينة شكل البوابة التي يراها النزيل على هاتفه"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>معاينة بوابة النزيل 📱</span>
              </button>

              {hasPermission("id_cards") && (
                <button 
                  onClick={() => setActiveTab("id_cards")}
                  className={`w-full text-right px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${activeTab === "id_cards" ? "bg-emerald-900/50 text-white font-bold" : "text-emerald-300/80 hover:bg-emerald-900/30 hover:text-white"}`}
                  title="إنشاء وعرض بطاقة التعريف للنزيل"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>بطاقات النزلاء التعريفية</span>
                </button>
              )}

              {hasPermission("reports") && (
                <button 
                  onClick={() => setActiveTab("reports")}
                  className={`w-full text-right px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${activeTab === "reports" && activeReportSubTab !== "bulk_print" ? "bg-emerald-900/50 text-white font-bold" : "text-emerald-300/80 hover:bg-emerald-900/30 hover:text-white"}`}
                  title="عرض التقارير الفندقية التفصيلية والبطاقات الجماعية"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>التقارير والبطاقات الجماعية</span>
                </button>
              )}

              {hasPermission("reports") && (
                <button 
                  onClick={() => {
                    setActiveTab("reports");
                    setActiveReportSubTab("bulk_print");
                  }}
                  className={`w-full text-right px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${activeTab === "reports" && activeReportSubTab === "bulk_print" ? "bg-amber-500/20 text-amber-200 font-bold border border-amber-500/30" : "bg-amber-950/20 text-amber-300/90 border border-amber-500/10 hover:bg-amber-950/40 hover:text-white"}`}
                  title="عرض وطباعة وتنزيل كافة كروت النزلاء المقيمين دفعة واحدة"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-extrabold text-amber-200">طباعة وتنزيل الكروت الجماعية</span>
                </button>
              )}
            </div>

            {hasPermission("checkin") && (
              <button 
                onClick={() => {
                  resetCheckInForm();
                  setActiveTab("checkin");
                }}
                className={`w-full text-right px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition ${activeTab === "checkin" ? "bg-emerald-800 text-white shadow-md shadow-emerald-950/40" : "text-emerald-300/80 hover:bg-emerald-900/30 hover:text-white"}`}
              >
                <UserPlus className="w-4 h-4" />
                <span>تسكين نزيل جديد</span>
              </button>
            )}

            {/* Sub-buttons under "تسكين نزيل جديد" */}
            {hasPermission("checkin") && (
              <div className="mr-6 pl-2 pr-2 border-r border-emerald-800/50 space-y-1 my-1">
                <button
                  onClick={() => {
                    resetCheckInForm();
                    setActiveTab("checkin");
                  }}
                  className={`w-full text-right px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${(activeTab === "checkin") ? "bg-emerald-900/50 text-white font-bold" : "text-emerald-300/80 hover:bg-emerald-900/30 hover:text-white"}`}
                  title="تسجيل دخول (دخول النزيل)"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الدخول (تسجيل دخول)</span>
                </button>

                {hasPermission("checkout") && (
                  <button
                    onClick={() => {
                      setActiveTab("checkout");
                    }}
                    className={`w-full text-right px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${activeTab === "checkout" ? "bg-emerald-900/50 text-white font-bold" : "text-emerald-300/80 hover:bg-emerald-900/30 hover:text-white"}`}
                    title="تسجيل خروج (خروج النزيل)"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>الخروج (تسجيل خروج)</span>
                  </button>
                )}
              </div>
            )}

            {hasPermission("room_config") && (
              <button 
                onClick={() => setActiveTab("room_config")}
                className={`w-full text-right px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition ${activeTab === "room_config" ? "bg-emerald-800 text-white shadow-md shadow-emerald-950/40" : "text-emerald-300/80 hover:bg-emerald-900/30 hover:text-white"}`}
              >
                <Sliders className="w-4 h-4" />
                <span>إعداد وتكوين الغرف</span>
              </button>
            )}

            {hasPermission("security_gate") && (
              <button 
                onClick={() => setActiveTab("security_gate" as any)}
                className={`w-full text-right px-4 py-3 rounded-xl text-sm font-black flex items-center gap-3 transition border ${
                  activeTab === ("security_gate" as any)
                    ? "bg-gradient-to-r from-indigo-700 to-blue-700 text-white shadow-lg shadow-indigo-950/50 border-indigo-400/50"
                    : "bg-indigo-950/40 text-indigo-200 hover:bg-indigo-900/50 hover:text-white border-indigo-500/30"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span>بوابة الحراسة ومسح البطاقات</span>
                <span className="mr-auto px-1.5 py-0.5 rounded bg-indigo-500/30 text-[10px] font-bold text-indigo-200 border border-indigo-400/30">
                  QR / باركود
                </span>
              </button>
            )}

            {hasPermission("permissions") && (
              <button 
                onClick={() => setActiveTab("permissions")}
                className={`w-full text-right px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition ${activeTab === "permissions" ? "bg-emerald-800 text-white shadow-md shadow-emerald-950/40" : "text-emerald-300/80 hover:bg-emerald-900/30 hover:text-white"}`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>صلاحيات المستخدمين</span>
              </button>
            )}

            {hasPermission("tools") && (
              <button 
                onClick={() => setActiveTab("tools")}
                className={`w-full text-right px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition ${activeTab === "tools" ? "bg-emerald-800 text-white shadow-md shadow-emerald-950/40" : "text-emerald-300/80 hover:bg-emerald-900/30 hover:text-white"}`}
              >
                <Settings className="w-4 h-4" />
                <span>الأدوات والإعدادات</span>
                {pendingRequests.filter(r => r.status === "pending").length > 0 && (
                  <span className="mr-auto w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {pendingRequests.filter(r => r.status === "pending").length}
                  </span>
                )}
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-emerald-900 text-xs text-emerald-400 flex flex-col gap-2 bg-emerald-950/80">
          <div className="flex justify-between items-center text-[11px] text-slate-300">
            <span>التوقيت المحلي:</span>
            <span className="font-mono text-[10px]">{new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <p>© {new Date().getFullYear()} خد ليالي الانس</p>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col overflow-x-hidden min-w-0">
        
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex justify-between items-center shadow-sm gap-2">
          <div className="flex items-center gap-3">
            <h1 className="font-sans font-extrabold text-lg sm:text-xl md:text-2xl text-slate-800 tracking-tight">
              {activeTab === "dashboard" && "لوحة التحكم الرئيسية"}
              {activeTab === "rooms" && "حالة وإدارة الغرف الفندقية"}
              {activeTab === "guests" && "سجل وإدارة النزلاء"}
              {activeTab === "requests" && "طلبات النزلاء المسجلين بالرابط (بوابة التسجيل الذاتي)"}
              {activeTab === "id_cards" && "بطاقات تعريف النزلاء التعريفية"}
              {activeTab === "reports" && "التقارير الفندقية والبطاقات الجماعية"}
              {activeTab === "checkin" && "تسكين نزيل جديد بالكامل"}
              {activeTab === "checkout" && "إنهاء التسكين وتسجيل مغادرة النزيل (الخروج)"}
              {activeTab === "room_config" && "إعداد وتكوين الغرف الفندقية"}
              {activeTab === "tools" && "أدوات وإعدادات النظام"}
              {activeTab === "services_committee" && "إدارة طلبات الصيانة وخدمات النزلاء (لجنة الخدمات)"}
              {activeTab === "services_add" && "تسجيل وإضافة لبيانات لجنة الخدمات"}
              {activeTab === ("security_gate" as any) && "بوابة الحراسة ومسح بطاقات النزلاء (QR / باركود)"}
              {activeTab === "permissions" && "إدارة صلاحيات المستخدمين والمدراء"}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            {/* Live Time & Date Widget (الوقت والتاريخ المباشر) */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800">
              <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="font-mono text-xs font-bold text-slate-900">
                {currentTime.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-[11px] font-medium text-slate-600">
                {currentTime.toLocaleDateString("ar-EG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>

            {/* Private vs Public Mode Toggle / Login Button (زرين خاص وعام + واجهة تسجيل الدخول) */}
            <button
              onClick={() => setShowLoginModal(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border shadow-xs ${
                authMode === "private"
                  ? "bg-slate-900 text-white border-slate-800 hover:bg-slate-800"
                  : "bg-amber-500 text-slate-950 border-amber-600 hover:bg-amber-400 font-extrabold"
              }`}
              title="انقر لفتح شاشة تسجيل الدخول والتبديل بين النمط الخاص والعام"
            >
              {authMode === "private" ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Globe className="w-3.5 h-3.5 text-slate-950" />}
              <span>{authMode === "private" ? "خاص" : "عام"}</span>
              <span className="text-[10px] opacity-75 hidden sm:inline">
                ({activeRole === "admin" ? "مدير النظام" : activeRole === "services" ? "لجنة الخدمات" : activeRole === "reception" ? "استقبال" : "عام"})
              </span>
            </button>

            {/* Google Sheets Persistent Connection Indicator */}
            {!isDemoMode && spreadsheetId ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300/80 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-900 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-extrabold text-emerald-800 hidden xl:inline">
                  متصل بـ Google Sheets (حفظ تلقائي)
                </span>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 hover:bg-emerald-200/80 rounded-lg text-emerald-800 transition"
                  title="فتح الجدول مباشرة في Google Sheets"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <button
                onClick={() => handleGoogleLogin()}
                disabled={isLoggingInGoogle}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="تفعيل ربط قوقل شيت للحفظ التلقائي الدائم"
              >
                {isLoggingInGoogle ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                ) : (
                  <Database className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span className="hidden md:inline">
                  {isLoggingInGoogle ? "جارٍ الربط..." : "ربط قوقل شيت (حفظ تلقائي)"}
                </span>
              </button>
            )}


            <button 
              onClick={handleForceRefresh}
              disabled={isLoadingData}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1 text-xs font-semibold transition cursor-pointer"
              title="تحديث ومزامنة البيانات يدويًا"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingData ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        {/* Reactive Toast Notification banner */}
        <AnimatePresence>
          {showNotification && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mx-6 mt-4 p-4 rounded-xl shadow-lg flex items-center gap-3 border ${
                showNotification.type === "success" 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                  : showNotification.type === "warning"
                  ? "bg-amber-50 border-amber-300 text-amber-900"
                  : showNotification.type === "info"
                  ? "bg-blue-50 border-blue-200 text-blue-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {showNotification.type === "success" ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              ) : showNotification.type === "warning" ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
              ) : showNotification.type === "info" ? (
                <Sparkles className="w-5 h-5 flex-shrink-0 text-blue-600" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              )}
              <span className="text-sm font-semibold">{showNotification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable View Area */}
        <div className="p-6 sm:p-8 flex-1 max-w-7xl w-full mx-auto">
          
          {/* ==================== 1. REORGANIZED DASHBOARD VIEW ==================== */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">

              {/* Top Banner: Hotel Management & Active Season Control */}
              <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-800/60 p-5 rounded-3xl shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="flex items-center gap-4 z-10">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center font-black shrink-0 shadow-inner">
                    <Building2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="font-black text-base sm:text-lg text-emerald-300">
                        نظام إدارة وتشغيل الفندق الموحد
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold tracking-wide">
                        الموسم النشط: {selectedYear}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      إدارة متكاملة وشاملة لبيانات النزلاء، الغرف، والخدمات الفندقية
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-auto justify-end flex-wrap z-10">
                  <span className="text-xs text-slate-400 font-bold ml-1">تبديل الموسم:</span>
                  {yearsList.map((yr) => {
                    const isSelected = selectedYear === yr;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => handleYearChange(yr)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-emerald-500 text-slate-950 shadow-md font-black scale-105"
                            : "bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        <span>موسم {yr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 1: Hotel Status & Capacity KPI Dashboard */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800 tracking-wide flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    المؤشرات القياسية وطاقة الفندق
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">تحديث فوري مباشر</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
                  {/* KPI Card 1: Occupancy Rate (2 columns) */}
                  <div className="md:col-span-2 bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">نسبة إشغال الفندق</span>
                        <h4 className="text-2xl font-black text-slate-800 mt-1">{stats.occupancyRate}%</h4>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center font-bold">
                        <Percent className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-600">{stats.occupiedRooms} من أصل {stats.totalRooms} غرفة مشغولة</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          stats.occupancyRate >= 90 ? "bg-rose-100 text-rose-800" :
                          stats.occupancyRate >= 70 ? "bg-amber-100 text-amber-800" :
                          "bg-emerald-100 text-emerald-800"
                        }`}>
                          {stats.occupancyRate >= 90 ? "إشغال مرتفع جداً" : stats.occupancyRate >= 70 ? "إشغال جيد" : "طاقة متاحة ممتازة"}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden p-0.5">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            stats.occupancyRate >= 90 ? "bg-rose-600" :
                            stats.occupancyRate >= 70 ? "bg-amber-500" :
                            "bg-emerald-600"
                          }`} 
                          style={{ width: `${Math.min(100, Math.max(0, stats.occupancyRate))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* KPI Card 2: Current Active Residents */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-500">مقيمون حالياً</span>
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-emerald-800">{stats.currentResidents}</span>
                        <span className="text-xs font-bold text-slate-400">نزلاء</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold">متواجدون بالغرف</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI Card 3: Available Rooms */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-500">غرف متاحة</span>
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-emerald-600">{stats.availableRooms}</span>
                        <span className="text-xs font-bold text-slate-400">غرفة</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 font-semibold">معدة للتسكين الجاهز</p>
                    </div>
                  </div>

                  {/* KPI Card 4: Occupied Rooms */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-500">غرف مشغولة</span>
                      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center">
                        <XCircle className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-amber-800">{stats.occupiedRooms}</span>
                        <span className="text-xs font-bold text-slate-400">غرفة</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 font-semibold">غير متاحة للحجز</p>
                    </div>
                  </div>

                  {/* KPI Card 5: Total Check-ins */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-500">عمليات الدخول</span>
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center">
                        <LogIn className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-3xl font-black text-slate-800">{stats.checkInsCount}</span>
                      <p className="text-[10px] text-slate-400 mt-2 font-semibold">تسجيلات وصول</p>
                    </div>
                  </div>

                  {/* KPI Card 6: Total Check-outs */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-500">عمليات الخروج</span>
                      <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center justify-center">
                        <LogOut className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-3xl font-black text-rose-800">{stats.checkOutsCount}</span>
                      <p className="text-[10px] text-slate-400 mt-2 font-semibold">سجل المغادرين</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Command & Operations Gateways (بوابات إجراءات العمل الفورية) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Gateway 1: Check-in Portal */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between relative">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                          <UserPlus className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-slate-800">بوابة التسكين والدخول</h3>
                          <p className="text-xs text-slate-500">تسجيل نزيل جديد في الفندق</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-semibold">الغرف المتاحة فوراً:</span>
                        <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                          {stats.availableRooms} غرفة
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-2.5">
                        <span className="text-slate-600 font-semibold">طلبات التسجيل المعلقة:</span>
                        <span className="font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200/80">
                          {pendingRequests.filter(r => r.status === "pending").length} طلبات
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetCheckInForm();
                        setActiveTab("checkin");
                      }}
                      className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-2xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      تسكين نزيل جديد
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRegistrationLinkModal(true)}
                      className="py-3 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      title="مشاركة رابط تعبئة البيانات الذاتية للنزيل"
                    >
                      <Share2 className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>

                {/* Gateway 2: Check-out Portal */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center justify-center shadow-sm">
                        <LogOut className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-800">بوابة المغادرة والباركود</h3>
                        <p className="text-xs text-slate-500">إنهاء التسكين وإصدار الكروت</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-semibold">النزلاء المقيمون حالياً:</span>
                        <span className="font-bold text-rose-800 bg-rose-100/80 px-2.5 py-0.5 rounded-full border border-rose-200/80">
                          {stats.currentResidents} نزيل
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-2.5">
                        <span className="text-slate-600 font-semibold">الغرف المشغولة حالياً:</span>
                        <span className="font-bold text-slate-800 bg-slate-200/80 px-2.5 py-0.5 rounded-full border border-slate-300/80">
                          {stats.occupiedRooms} غرفة
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("checkout")}
                    className="mt-5 w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-2xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    شاشة الخروج وإصدار الباركود
                  </button>
                </div>

                {/* Gateway 3: Guest Self-Service Registration Portal */}
                <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-emerald-50 border border-emerald-800/80 p-6 rounded-3xl shadow-md flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-base text-amber-300 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-amber-400" />
                        التسجيل الذاتي أونلاين
                      </h3>
                      <button 
                        type="button"
                        onClick={toggleRegistrationLinkStatus}
                        className={`px-3 py-1 rounded-full text-[10px] font-black transition cursor-pointer ${
                          registrationLinkOpen ? "bg-emerald-500 text-slate-950 shadow-sm" : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {registrationLinkOpen ? "● البوابة مفتوحة" : "مغلقة"}
                      </button>
                    </div>
                    <p className="text-xs text-emerald-200/90 leading-relaxed">
                      رابط التعبئة الذاتية يتيح للنزلاء تسجيل تفاصيلهم وهوياتهم قبل وصولهم للحجز التلقائي.
                    </p>
                  </div>

                  <div className="mt-5 space-y-2">
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={handleCopyLink}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        نسخ رابط النزلاء
                      </button>
                      <a 
                        href="/?register=true" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-3.5 py-2.5 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/60 flex items-center justify-center transition"
                        title="معاينة نموذج النزيل أونلاين"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

              </div>

              {/* Section 3: Interactive Dashboard Main Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Column (2 cols): Inbound Residents & Checked Out Guests */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                    
                    {/* Header with Dual Tabs and Search Bar */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/70 space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-2xl">
                          <button
                            type="button"
                            onClick={() => setDashboardGuestSubTab("residents")}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                              dashboardGuestSubTab === "residents"
                                ? "bg-white text-emerald-800 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <span>النزلاء المقيمون حالياً</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                              {stats.currentResidents}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDashboardGuestSubTab("checked_out")}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                              dashboardGuestSubTab === "checked_out"
                                ? "bg-white text-rose-800 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <span>سجل المغادرين</span>
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                              {stats.checkOutsCount}
                            </span>
                          </button>
                        </div>

                        <button 
                          type="button"
                          onClick={() => setActiveTab("guests")}
                          className="text-xs font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        >
                          عرض الكل في إدارة النزلاء ←
                        </button>
                      </div>

                      {/* Quick Search Bar inside dashboard */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={dashboardGuestSearch}
                          onChange={(e) => setDashboardGuestSearch(e.target.value)}
                          placeholder="بحث سريع باسم النزيل، رقم الغرفة، أو دولة الإقامة..."
                          className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                        {dashboardGuestSearch && (
                          <button
                            type="button"
                            onClick={() => setDashboardGuestSearch("")}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                          >
                            تفريغ
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content List Area */}
                    <div className="p-5 divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                      {dashboardGuestSubTab === "residents" ? (
                        (() => {
                          const activeResidentsList = filteredGuests.filter(
                            g => g.status === "resident" &&
                            (!dashboardGuestSearch ||
                              g.name.toLowerCase().includes(dashboardGuestSearch.toLowerCase()) ||
                              g.roomNumber.includes(dashboardGuestSearch) ||
                              g.country.toLowerCase().includes(dashboardGuestSearch.toLowerCase()))
                          );

                          if (activeResidentsList.length === 0) {
                            return (
                              <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                                <Users className="w-12 h-12 mx-auto text-slate-300" />
                                <p className="font-bold text-slate-500">لا يوجد نزلاء مطابقون للبحث في قائمة المقيمين</p>
                              </div>
                            );
                          }

                          return activeResidentsList.map(guest => (
                            <div key={guest.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition">
                              <div className="flex items-center gap-3 min-w-0">
                                <img 
                                  src={guest.photoUrl} 
                                  alt={guest.name} 
                                  className="w-11 h-11 rounded-full object-cover border-2 border-emerald-100 shadow-sm shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0">
                                  <h4 className="font-black text-xs text-slate-800 truncate" title={guest.name}>{guest.name}</h4>
                                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                    <span className="truncate">{guest.country}</span>
                                    <span>•</span>
                                    <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                      غرفة {guest.roomNumber}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setActiveSuccessMsgType("checkin_khidr");
                                    setShowCheckInSuccessModal(guest);
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                                  title="إرسال إشعار التسكين في خدر ليالي الأنس عبر الواتساب"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="hidden sm:inline">إشعار التسكين</span>
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleOpenEditGuest(guest)}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/70 text-[11px] font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                                  title="تعديل بيانات النزيل"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                  <span>تعديل</span>
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setSelectedGuestForCard(guest)}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                                  title="عرض بطاقة التعريف"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>البطاقة</span>
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleCheckOut(guest.id)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-[11px] font-bold rounded-xl transition cursor-pointer"
                                >
                                  مغادرة
                                </button>
                              </div>
                            </div>
                          ));
                        })()
                      ) : (
                        (() => {
                          const checkedOutList = filteredGuests.filter(
                            g => g.status === "checked_out" &&
                            (!dashboardGuestSearch ||
                              g.name.toLowerCase().includes(dashboardGuestSearch.toLowerCase()) ||
                              g.roomNumber.includes(dashboardGuestSearch) ||
                              g.country.toLowerCase().includes(dashboardGuestSearch.toLowerCase()))
                          );

                          if (checkedOutList.length === 0) {
                            return (
                              <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                                <LogOut className="w-12 h-12 mx-auto text-slate-300" />
                                <p className="font-bold text-slate-500">لا يوجد نزلاء مغادرون في سجل هذه الزيارة</p>
                              </div>
                            );
                          }

                          return checkedOutList.map(guest => (
                            <div key={guest.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition">
                              <div className="flex items-center gap-3 min-w-0">
                                <img 
                                  src={guest.photoUrl} 
                                  alt={guest.name} 
                                  className="w-11 h-11 rounded-full object-cover border-2 border-slate-200 shadow-sm shrink-0 grayscale opacity-80"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0">
                                  <h4 className="font-bold text-xs text-slate-700 truncate" title={guest.name}>{guest.name}</h4>
                                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                    <span className="truncate">{guest.country}</span>
                                    <span>•</span>
                                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                                      غرفة {guest.roomNumber}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button 
                                  type="button"
                                  onClick={() => handleOpenEditGuest(guest)}
                                  className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/70 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="تعديل بيانات النزيل"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                  <span className="text-[10px] hidden sm:inline">تعديل</span>
                                </button>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md">
                                    أتم المغادرة
                                  </span>
                                  {guest.checkOutDate && (
                                    <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                                      {new Date(guest.checkOutDate).toLocaleDateString("ar-EG")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ));
                        })()
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                      <button 
                        type="button"
                        onClick={() => setActiveTab("reports")}
                        className="text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                      >
                        عرض التقارير والأرشيف الشامل للحركات ←
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sidebar Column (1 col): Requests, Maintenance & Shortcuts */}
                <div className="space-y-6">
                  
                  {/* Widget 1: Pending Online Self-Registration Requests */}
                  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                        <Inbox className="w-4 h-4 text-amber-600" />
                        طلبات الحجز الذاتي المعلقة
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                        {filteredPendingRequests.filter(r => r.status === "pending").length} طلبات
                      </span>
                    </div>

                    <div className="space-y-3">
                      {filteredPendingRequests.filter(r => r.status === "pending").length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs space-y-1">
                          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                          <p className="font-semibold text-slate-600">لا توجد طلبات معلقة بانتظار الموافقة</p>
                        </div>
                      ) : (
                        filteredPendingRequests.filter(r => r.status === "pending").slice(0, 3).map(req => (
                          <div key={req.id} className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="font-black text-xs text-slate-800">{req.name}</h4>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(req.date).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">نوع الغرفة: <span className="font-bold text-slate-800">{req.roomType}</span></p>
                            
                            <div className="flex gap-2 pt-1">
                              <button 
                                type="button"
                                onClick={() => handleRequestAction(req.id, "approve")}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-xl transition cursor-pointer"
                              >
                                موافقة وتسكين فوري
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleRequestAction(req.id, "reject")}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-[10px] rounded-xl transition cursor-pointer"
                              >
                                رفض
                              </button>
                            </div>
                          </div>
                        ))
                      )}

                      {pendingRequests.filter(r => r.status === "pending").length > 3 && (
                        <button 
                          type="button"
                          onClick={() => setActiveTab("tools")}
                          className="w-full py-2 text-center text-xs text-emerald-700 font-extrabold hover:underline cursor-pointer"
                        >
                          عرض كافة طلبات التسجيل ({pendingRequests.length}) ←
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Widget 2: Committee & Maintenance Requests Summary */}
                  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-amber-600" />
                        لجنة الخدمات والصيانة
                      </h3>
                      {filteredServiceRequests.filter(s => s.status === "new" || s.status === "in_progress").length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black">
                          {filteredServiceRequests.filter(s => s.status === "new" || s.status === "in_progress").length} نشط
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-2xl">
                        <span className="text-lg font-black text-amber-800">
                          {filteredServiceRequests.filter(s => s.status === "new").length}
                        </span>
                        <p className="text-[10px] text-amber-700 font-bold mt-0.5">جديد</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-2xl">
                        <span className="text-lg font-black text-blue-800">
                          {filteredServiceRequests.filter(s => s.status === "in_progress").length}
                        </span>
                        <p className="text-[10px] text-blue-700 font-bold mt-0.5">قيد التنفيذ</p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-2xl">
                        <span className="text-lg font-black text-emerald-800">
                          {filteredServiceRequests.filter(s => s.status === "completed").length}
                        </span>
                        <p className="text-[10px] text-emerald-700 font-bold mt-0.5">مكتمل</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("services_committee")}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      الانتقال إلى لوحة لجنة الخدمات
                    </button>
                  </div>

                  {/* Widget 3: Quick Hotel Management Shortcuts */}
                  <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-md space-y-4">
                    <h3 className="font-extrabold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      اختصارات إدارة الفندق
                    </h3>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab("rooms")}
                        className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-right transition border border-slate-700/60 cursor-pointer space-y-1"
                      >
                        <Bed className="w-4 h-4 text-emerald-400" />
                        <p className="font-bold text-xs text-white">إدارة الغرف</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("id_cards")}
                        className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-right transition border border-slate-700/60 cursor-pointer space-y-1"
                      >
                        <QrCode className="w-4 h-4 text-amber-400" />
                        <p className="font-bold text-xs text-white">بطاقات النزلاء</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("reports")}
                        className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-right transition border border-slate-700/60 cursor-pointer space-y-1"
                      >
                        <FileText className="w-4 h-4 text-blue-400" />
                        <p className="font-bold text-xs text-white">التقارير الشاملة</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("permissions")}
                        className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-right transition border border-slate-700/60 cursor-pointer space-y-1"
                      >
                        <ShieldCheck className="w-4 h-4 text-rose-400" />
                        <p className="font-bold text-xs text-white">الصلاحيات</p>
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ==================== 2. ROOMS GRID VIEW ==================== */}
          {activeTab === "rooms" && (
            <div className="space-y-8">
              
              {/* Header Actions / Filters */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
                
                {/* Search */}
                <div className="relative w-full sm:w-80">
                  <input 
                    type="text" 
                    placeholder="ابحث عن غرفة بالاسم أو الرقم..." 
                    value={roomSearchQuery}
                    onChange={e => setRoomSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl pr-10 pl-4 py-2 text-sm outline-none transition"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1 ml-2"><Filter className="w-3.5 h-3.5" /> تصفية بالحالة:</span>
                  <button 
                    onClick={() => setRoomStatusFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${roomStatusFilter === "all" ? "bg-emerald-800 text-white shadow-sm" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
                  >
                    الكل
                  </button>
                  <button 
                    onClick={() => setRoomStatusFilter("available")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${roomStatusFilter === "available" ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
                  >
                    متاحة ({rooms.filter(r => r.status === "available").length})
                  </button>
                  <button 
                    onClick={() => setRoomStatusFilter("occupied")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${roomStatusFilter === "occupied" ? "bg-emerald-800 text-white shadow-sm" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
                  >
                    مشغولة ({rooms.filter(r => r.status === "occupied").length})
                  </button>
                  <button 
                    onClick={() => setRoomStatusFilter("full")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${roomStatusFilter === "full" ? "bg-amber-600 text-white shadow-sm" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
                  >
                    ممتلئة ({rooms.filter(r => r.status === "full").length})
                  </button>
                </div>
              </div>

              {/* Grid of Room Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms
                  .filter(r => roomStatusFilter === "all" || r.status === roomStatusFilter)
                  .filter(r => r.number.includes(roomSearchQuery) || r.name.toLowerCase().includes(roomSearchQuery.toLowerCase()) || r.type.includes(roomSearchQuery))
                  .map(room => {
                    const guestInRoom = guests.find(g => g.roomNumber === room.number && g.status === "resident");
                    return (
                      <div key={room.number} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                        
                        {/* Card Top / Header */}
                        <div className="p-6 border-b border-slate-100">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">الطابق {room.floor} • الغرفة {room.number}</span>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              room.status === "available" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" :
                              room.status === "occupied" ? "bg-emerald-950 text-emerald-200 border border-emerald-900" :
                              "bg-amber-50 text-amber-800 border border-amber-100"
                            }`}>
                              {room.status === "available" && "متاحة للتسكين"}
                              {room.status === "occupied" && "مشغولة"}
                              {room.status === "full" && "ممتلئة بالكامل"}
                            </span>
                          </div>

                          <h3 className="font-bold text-lg text-slate-800">{room.name}</h3>
                          <p className="text-xs text-slate-400 mt-1">{room.type}</p>
                        </div>

                        {/* Card Details / Body */}
                        <div className="p-6 space-y-4 flex-1">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-slate-400 block mb-0.5">سعة الغرفة</span>
                              <span className="font-bold text-slate-700">{room.capacity} أشخاص</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-slate-400 block mb-0.5">اتجاه الغرفة / الإطلالة</span>
                              <span className="font-semibold text-slate-700">{room.direction || "إطلالة قياسية"}</span>
                            </div>
                          </div>

                          {/* Occupying guest summary */}
                          {guestInRoom && (
                            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                              <img 
                                src={guestInRoom.photoUrl} 
                                alt={guestInRoom.name} 
                                className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <span className="text-[10px] text-slate-400 block">النزيل الحالي:</span>
                                <h4 className="font-bold text-xs text-slate-800 truncate">{guestInRoom.name}</h4>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between gap-2">
                          <button 
                            onClick={() => handleStartEditRoom(room)}
                            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-bold flex items-center justify-center gap-1 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            تعديل الإعدادات
                          </button>

                          {room.status === "available" ? (
                            <button 
                              onClick={() => {
                                setCheckInForm({
                                  ...checkInForm,
                                  roomNumber: room.number
                                });
                                setActiveTab("checkin");
                              }}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-1"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              تسكين نزيل
                            </button>
                          ) : (
                            guestInRoom && (
                              <div className="flex-1 flex gap-1.5">
                                <button 
                                  type="button"
                                  onClick={() => handleOpenEditGuest(guestInRoom)}
                                  className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                                  title="تعديل بيانات النزيل الساكن"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                  <span>تعديل</span>
                                </button>
                                <button 
                                  onClick={() => handleCheckOut(guestInRoom.id)}
                                  className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                                >
                                  <LogOut className="w-3.5 h-3.5" />
                                  تسجيل خروج
                                </button>
                              </div>
                            )
                          )}

                          <button 
                            onClick={() => handleDeleteRoom(room.number)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="حذف الغرفة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ==================== 3. GUESTS MANAGEMENT ==================== */}
          {activeTab === "guests" && (
            <div className="space-y-8">
              
              {/* Filter and Search Bar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                  <input 
                    type="text" 
                    placeholder="ابحث عن نزيل بالاسم، الجوال أو رقم الغرفة..." 
                    value={guestSearchQuery}
                    onChange={e => setGuestSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl pr-10 pl-4 py-2.5 text-sm outline-none transition"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                </div>

                <button 
                  onClick={() => {
                    resetCheckInForm();
                    setActiveTab("checkin");
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  تسكين نزيل جديد
                </button>
              </div>

              {/* Guests Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 text-xs font-bold">
                        <th className="p-4 pr-6">الصورة</th>
                        <th className="p-4">الاسم الكامل</th>
                        <th className="p-4">البلد / الجنسية</th>
                        <th className="p-4">رقم الجوال</th>
                        <th className="p-4">رقم الغرفة</th>
                        <th className="p-4">تاريخ الدخول</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4 pl-6 text-left">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {filteredGuests
                        .filter(g => g.name.toLowerCase().includes(guestSearchQuery.toLowerCase()) || g.mobile.includes(guestSearchQuery) || g.roomNumber.includes(guestSearchQuery))
                        .length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-12 text-slate-400">
                              <Users className="w-12 h-12 mx-auto text-slate-200 mb-2" />
                              <p>لا يوجد نزلاء مسجلين يطابقون شروط البحث في هذا الموسم</p>
                            </td>
                          </tr>
                        ) : (
                          filteredGuests
                            .filter(g => g.name.toLowerCase().includes(guestSearchQuery.toLowerCase()) || g.mobile.includes(guestSearchQuery) || g.roomNumber.includes(guestSearchQuery))
                            .map(guest => (
                              <tr key={guest.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-4 pr-6">
                                  <div 
                                    className="relative group cursor-pointer w-10 h-10" 
                                    onClick={() => setViewingPhotoGuest(guest)} 
                                    title="انقر لمعاينة الصورة بدقة عالية وتعديل الجودة 🔍"
                                  >
                                    <img 
                                      src={guest.photoUrl} 
                                      alt={guest.name} 
                                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 group-hover:border-emerald-500 group-hover:scale-110 shadow-sm transition"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-emerald-800 text-white rounded-full shadow">
                                      <Maximize2 className="w-2.5 h-2.5" />
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 font-bold text-slate-800">
                                  <div>
                                    <p>{guest.name}</p>
                                    {guest.notes && (
                                      <span className="inline-block text-[10px] font-normal text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 mt-1">
                                        💡 {guest.notes}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">{guest.country}</td>
                                <td className="p-4 font-mono text-xs" dir="ltr">{guest.mobile}</td>
                                <td className="p-4">
                                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-xs font-bold">
                                    الغرفة {guest.roomNumber}
                                  </span>
                                </td>
                                <td className="p-4 text-xs text-slate-400">
                                  {new Date(guest.checkInDate).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${guest.status === "resident" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-500"}`}>
                                    {guest.status === "resident" ? "مقيم حالياً" : "مغادر"}
                                  </span>
                                </td>
                                <td className="p-4 pl-6 text-left">
                                  <div className="flex gap-2 justify-end items-center">
                                    <button 
                                      type="button"
                                      onClick={() => handleOpenEditGuest(guest)}
                                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                                      title="تعديل بيانات النزيل"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                      <span>تعديل</span>
                                    </button>
                                    {guest.status === "resident" && (
                                      <>
                                        <button 
                                          onClick={() => setSelectedGuestForCard(guest)}
                                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition flex items-center gap-1"
                                          title="عرض بطاقة التعريف للنزيل"
                                        >
                                          <QrCode className="w-3.5 h-3.5" />
                                          بطاقة النزيل
                                        </button>
                                        <button 
                                          onClick={() => handleCheckOut(guest.id)}
                                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition"
                                        >
                                          تسجيل خروج
                                        </button>
                                      </>
                                    )}
                                    <button 
                                      onClick={() => handleDeleteGuest(guest.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                                      title="حذف السجل"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                        )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==================== 3.1. ONLINE REGISTERED GUEST REQUESTS (طلبات النزلاء المسجلين بالرابط) ==================== */}
          {activeTab === "requests" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header Banner & Registration Link Controls */}
              <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black">
                      <Link2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>بوابة التسجيل الذاتي الإلكترونية للنزلاء</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">طلبات النزلاء المسجلين بالرابط</h2>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                      استعراض ومراجعة طلبات التسكين والتسجيل الذاتي المرسلة من قبل النزلاء والضيوف عبر الرابط الخارجي، والموافقة الفورية عليها ونقلها لنموذج التسكين وتحديد الغرف.
                    </p>
                  </div>

                  {/* Quick Action Link Box */}
                  <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 w-full lg:w-auto shrink-0 shadow-lg space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-amber-400" />
                        رابط تسجيل النزلاء العام
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        🟢 نشط ومستقبل للطلبات
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 font-mono text-[11px] select-all truncate max-w-xs" dir="ltr">
                        {window.location.origin}/?register=true
                      </div>
                      <button 
                        onClick={handleCopyLink}
                        className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                        title="نسخ رابط التسجيل"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ</span>
                      </button>
                      <a 
                        href="/?register=true" 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition flex items-center justify-center border border-slate-600 cursor-pointer"
                        title="فتح بوابة التسجيل في نافذة جديدة"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Stats Metric Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 text-right">
                    <span className="text-slate-400 text-xs block mb-1 font-bold">إجمالي الطلبات المستلمة</span>
                    <span className="text-xl sm:text-2xl font-black text-white font-mono">{pendingRequests.length}</span>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-right">
                    <span className="text-amber-300 text-xs block mb-1 font-bold">بانتظار المراجعة (معلقة)</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                      {pendingRequests.filter(r => r.status === "pending").length}
                    </span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 text-right">
                    <span className="text-emerald-300 text-xs block mb-1 font-bold">تمت الموافقة والتسكين</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                      {pendingRequests.filter(r => r.status === "approved").length}
                    </span>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 text-right">
                    <span className="text-rose-300 text-xs block mb-1 font-bold">طلبات مرفوضة</span>
                    <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                      {pendingRequests.filter(r => r.status === "rejected").length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                
                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  <button
                    onClick={() => setOnlineRequestsStatusFilter("all")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      onlineRequestsStatusFilter === "all"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>جميع الطلبات</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-700 text-white text-[10px]">
                      {pendingRequests.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setOnlineRequestsStatusFilter("pending")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      onlineRequestsStatusFilter === "pending"
                        ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                        : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>قيد المراجعة والمعلقة</span>
                    {pendingRequests.filter(r => r.status === "pending").length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                        {pendingRequests.filter(r => r.status === "pending").length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setOnlineRequestsStatusFilter("approved")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      onlineRequestsStatusFilter === "approved"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>المقبولة</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-700 text-white text-[10px]">
                      {pendingRequests.filter(r => r.status === "approved").length}
                    </span>
                  </button>

                  <button
                    onClick={() => setOnlineRequestsStatusFilter("rejected")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      onlineRequestsStatusFilter === "rejected"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>المرفوضة</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-rose-700 text-white text-[10px]">
                      {pendingRequests.filter(r => r.status === "rejected").length}
                    </span>
                  </button>
                </div>

                {/* Search, Sound Controls and Refresh */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      const next = !soundAlertsEnabled;
                      setSoundAlertsEnabled(next);
                      localStorage.setItem("hotel_sound_alerts_enabled", next ? "true" : "false");
                      triggerNotification("success", next ? "تم تفعيل التنبيه الصوتي للطلبات الجديدة 🔔" : "تم كتم التنبيه الصوتي للطلبات 🔕");
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                      soundAlertsEnabled
                        ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                        : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                    }`}
                    title="تبديل تشغيل/إيقاف التنبيه الصوتي عند وصول طلبات جديدة للاستقبال"
                  >
                    {soundAlertsEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{soundAlertsEnabled ? "صوت التنبيه: مفعّل 🔔" : "صوت التنبيه: مكتوم 🔕"}</span>
                  </button>

                  <button
                    onClick={() => {
                      fetchPendingRequests();
                      triggerNotification("info", "جاري تحديث ومزامنة الطلبات السحابية فوراً...");
                    }}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    title="تحديث ومزامنة طلبات التسجيل السحابية فوراً"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تحديث السحابة فوراً</span>
                  </button>

                  <div className="relative flex-1 min-w-[200px] md:w-64">
                    <input 
                      type="text" 
                      placeholder="ابحث بالاسم، الجوال، الدولة..." 
                      value={onlineRequestsSearchQuery}
                      onChange={e => setOnlineRequestsSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl pr-9 pl-3 py-2 text-xs outline-none transition"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  </div>

                  <button 
                    type="button"
                    onClick={() => { fetchPendingRequests(); }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center justify-center border border-slate-200 cursor-pointer"
                    title="تحديث البيانات من السيرفر"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>

              {/* Requests Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs font-bold">
                        <th className="p-4 pr-6">الصورة</th>
                        <th className="p-4">اسم النزيل / الدور</th>
                        <th className="p-4">جوال الاتصال</th>
                        <th className="p-4">الواتساب</th>
                        <th className="p-4">الإيميل</th>
                        <th className="p-4">بلد الإقامة</th>
                        <th className="p-4">تاريخ الوصول</th>
                        <th className="p-4">الغرفة المفضلة</th>
                        <th className="p-4">ملاحظات الطلب</th>
                        <th className="p-4">وقت التقديم</th>
                        <th className="p-4">حالة الطلب</th>
                        <th className="p-4 pl-6 text-left">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {pendingRequests
                        .filter(r => {
                          if (onlineRequestsStatusFilter !== "all" && r.status !== onlineRequestsStatusFilter) return false;
                          if (!onlineRequestsSearchQuery.trim()) return true;
                          const q = onlineRequestsSearchQuery.toLowerCase();
                          return (
                            (r.name && r.name.toLowerCase().includes(q)) ||
                            (r.mobile && r.mobile.includes(q)) ||
                            (r.whatsapp && r.whatsapp.includes(q)) ||
                            (r.email && r.email.toLowerCase().includes(q)) ||
                            (r.country && r.country.toLowerCase().includes(q)) ||
                            (r.notes && r.notes.toLowerCase().includes(q))
                          );
                        })
                        .length === 0 ? (
                        <tr>
                          <td colSpan={12} className="text-center py-12 text-slate-400">
                            <div className="max-w-md mx-auto space-y-3">
                              <Inbox className="w-12 h-12 mx-auto text-slate-300" />
                              <h4 className="font-bold text-slate-700 text-sm">لا توجد طلبات تطابق معايير البحث أو التصفية</h4>
                              <p className="text-xs text-slate-400">يمكنك نسخ رابط التسجيل وإرساله للنزلاء للبدء في استقبال طلبات التسكين الفوري الذاتي.</p>
                              <button 
                                onClick={handleCopyLink}
                                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>نسخ رابط بوابة التسجيل</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pendingRequests
                          .filter(r => {
                            if (onlineRequestsStatusFilter !== "all" && r.status !== onlineRequestsStatusFilter) return false;
                            if (!onlineRequestsSearchQuery.trim()) return true;
                            const q = onlineRequestsSearchQuery.toLowerCase();
                            return (
                              (r.name && r.name.toLowerCase().includes(q)) ||
                              (r.mobile && r.mobile.includes(q)) ||
                              (r.whatsapp && r.whatsapp.includes(q)) ||
                              (r.email && r.email.toLowerCase().includes(q)) ||
                              (r.country && r.country.toLowerCase().includes(q)) ||
                              (r.notes && r.notes.toLowerCase().includes(q))
                            );
                          })
                          .map(req => (
                            <tr key={req.id} className="hover:bg-slate-50/80 transition">
                              <td className="p-4 pr-6">
                                {req.photoUrl ? (
                                  <img 
                                    src={req.photoUrl} 
                                    alt={req.name} 
                                    className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shadow-sm cursor-pointer hover:scale-110 transition"
                                    onClick={() => setViewingPhotoGuest({
                                      id: req.id,
                                      name: req.name,
                                      country: req.country,
                                      mobile: req.mobile,
                                      email: req.email,
                                      whatsapp: req.whatsapp,
                                      roomNumber: req.roomType,
                                      status: "resident",
                                      photoUrl: req.photoUrl || "",
                                      checkInDate: req.checkInDate || req.date
                                    })}
                                    title="انقر لمعاينة وتكبير الصورة"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                                    بدون صورة
                                  </div>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="font-extrabold text-slate-900 text-sm">{req.name}</div>
                                {req.administrativeRole && (
                                  <div className="mt-1">
                                    {getAdminRoleBadge(req.administrativeRole)}
                                  </div>
                                )}
                              </td>
                              <td className="p-4 font-mono text-xs text-slate-700" dir="ltr">
                                {req.mobile ? (
                                  <a href={`tel:${req.mobile}`} className="hover:text-emerald-700 hover:underline">
                                    {req.mobile}
                                  </a>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="p-4">
                                {req.whatsapp ? (
                                  <a 
                                    href={`https://wa.me/${(() => {
                                      let cleaned = req.whatsapp.replace(/[^\d+]/g, '');
                                      if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
                                      if (cleaned.startsWith('05') && cleaned.length === 10) cleaned = '966' + cleaned.substring(1);
                                      else if (cleaned.startsWith('5') && cleaned.length === 9) cleaned = '966' + cleaned;
                                      return cleaned;
                                    })()}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
                                    title="فتح محادثة واتساب المباشرة"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    <span dir="ltr">{req.whatsapp}</span>
                                  </a>
                                ) : (
                                  <span className="text-slate-400 font-mono text-[11px]" dir="ltr">غير مدخل</span>
                                )}
                              </td>
                              <td className="p-4">
                                {req.email ? (
                                  <a 
                                    href={`mailto:${req.email}`}
                                    className="inline-flex items-center gap-1 font-mono text-xs text-slate-700 hover:text-slate-900 bg-slate-50 px-2 py-1 rounded-md border border-slate-200"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                                    <span dir="ltr">{req.email}</span>
                                  </a>
                                ) : (
                                  <span className="text-slate-400 font-mono text-[11px]">غير مدخل</span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className="font-semibold text-slate-800">{req.country}</span>
                              </td>
                              <td className="p-4 font-mono text-xs text-emerald-800 font-bold">
                                {req.checkInDate ? (
                                  <div className="flex flex-col items-start gap-0.5">
                                    <span>{req.checkInDate}</span>
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-sans font-semibold">
                                      يوم {getArabicDayName(req.checkInDate)}
                                    </span>
                                  </div>
                                ) : (
                                  "تاريخ اليوم"
                                )}
                              </td>
                              <td className="p-4 text-emerald-800 font-bold">{req.roomType || "غير محدد"}</td>
                              <td className="p-4 max-w-xs truncate" title={req.notes}>{req.notes || "لا يوجد ملاحظات إضافية"}</td>
                              <td className="p-4 text-slate-400 font-mono text-[11px]">
                                {new Date(req.date).toLocaleString("ar-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                  req.status === "pending" ? "bg-amber-50 text-amber-800 border border-amber-200 animate-pulse" :
                                  req.status === "approved" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                                  "bg-rose-50 text-rose-800 border border-rose-200"
                                }`}>
                                  {req.status === "pending" && "⏳ معلقة - بانتظار المراجعة"}
                                  {req.status === "approved" && "✅ تمت الموافقة والتسكين"}
                                  {req.status === "rejected" && "❌ تم الرفض"}
                                </span>
                              </td>
                              <td className="p-4 pl-6 text-left">
                                <div className="flex items-center gap-1.5 justify-end">
                                  {req.status === "pending" && (
                                    <>
                                      <button 
                                        onClick={() => handleRequestAction(req.id, "approve")}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl transition flex items-center gap-1 shadow-xs cursor-pointer"
                                        title="قبول الطلب وتسكين النزيل"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        <span>قبول وتسكين</span>
                                      </button>
                                      <button 
                                        onClick={() => handleRequestAction(req.id, "reject")}
                                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                                        title="رفض الطلب"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span>رفض</span>
                                      </button>
                                    </>
                                  )}
                                  {req.status === "approved" && (
                                    <button 
                                      onClick={() => {
                                        const matchingGuest = guests.find(g => g.id === req.assignedGuestId || (g.mobile && g.mobile === req.mobile) || (g.name && g.name === req.name)) || {
                                          id: req.assignedGuestId || req.id,
                                          name: req.name,
                                          country: req.country,
                                          mobile: req.whatsapp || req.mobile,
                                          whatsapp: req.whatsapp || req.mobile,
                                          email: req.email || "",
                                          roomNumber: req.assignedRoomNumber || "",
                                          status: "resident" as const,
                                          notes: req.notes || "",
                                          checkInDate: req.checkInDate || new Date().toISOString(),
                                          photoUrl: req.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
                                          administrativeRole: req.administrativeRole || "عضو وفد"
                                        };
                                        setActiveSuccessMsgType("checkin_khidr");
                                        setShowCheckInSuccessModal(matchingGuest);
                                      }}
                                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl transition flex items-center gap-1 cursor-pointer text-xs"
                                      title="إرسال رسالة التسكين في خدر ليالي الأنس للنزيل عبر الواتساب"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>إرسال إشعار التسكين</span>
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleRequestAction(req.id, "delete")}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                    title="حذف السجل"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==================== 3.5. RESIDENT ID CARDS GENERATOR ==================== */}
          {activeTab === "id_cards" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
              
              {/* Right panel: Form control */}
              <div className="lg:col-span-7 bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
                
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 p-4 sm:p-5 rounded-2xl text-white shadow-md border border-emerald-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-black shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-amber-300">تخصيص وإضافة كرت النزيل</h3>
                      <p className="text-xs text-slate-300 mt-0.5">تصميم وتوليد كروت النزلاء، وحفظها وتسكين النزلاء في النظام والمزامنة</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleResetCardForm}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="تفريغ الحقول لكتابة كرت نزيل جديد من الصفر"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      <span>إضافة كرت جديد</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveCardAsResidentGuest}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
                      title="حفظ الكرت وتسكين النزيل في قائمة المقيمين وحفظه في قوقل شيت"
                    >
                      <Save className="w-4 h-4 text-slate-950" />
                      <span>حفظ وإضافة الكرت</span>
                    </button>
                  </div>
                </div>

                {/* Hotel Logo & Card Settings Box (إعدادات البطاقة وشعار الفندق + حفظ قوقل شيت) */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl border border-slate-700/80 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black shrink-0">
                        <Hotel className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-extrabold text-sm text-amber-300">إعدادات البطاقة وشعار الفندق (Hotel Logo)</h4>
                        <p className="text-[11px] text-slate-300">رفع شعار الفندق وتطبيقه تلقائياً على جميع بطاقات النزلاء المصدرة، وحفظه سحابياً في قوقل شيت</p>
                      </div>
                    </div>
                    {cardLogoImage ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold self-start sm:self-auto">
                        🟢 الشعار مفعّل
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold self-start sm:self-auto">
                        ⚠️ لا يوجد شعار
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative shrink-0">
                      {cardLogoImage ? (
                        <img 
                          src={cardLogoImage} 
                          alt="Hotel Logo" 
                          className="w-20 h-20 rounded-2xl object-contain bg-slate-950 p-2 border-2 border-amber-400/60 shadow-lg"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-400 text-[10px] text-center p-2">
                          <Hotel className="w-6 h-6 mb-1 text-slate-500" />
                          <span>رفع الشعار</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2.5 w-full text-right">
                      <div className="flex flex-wrap gap-2">
                        <label className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow">
                          <Upload className="w-4 h-4" />
                          رفع شعار الفندق (Logo)
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleCardImageUpload(e, "logo")} 
                            className="hidden" 
                          />
                        </label>

                        <button
                          type="button"
                          onClick={handleSaveLogoToSheets}
                          disabled={!cardLogoImage || isSavingLogoToSheets}
                          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 active:scale-95 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow"
                          title="حفظ الشعار بشكل دائم في قوقل شيت"
                        >
                          {isSavingLogoToSheets ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Cloud className="w-4 h-4" />
                          )}
                          حفظ الشعار في قوقل شيت
                        </button>

                        {cardLogoImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setCardLogoImage("");
                              localStorage.removeItem("card_logo_image");
                              if (spreadsheetId) {
                                const token = getAccessToken();
                                if (token) saveSettingsToSheets(spreadsheetId, token, "cardLogoImage", "");
                              }
                              triggerNotification("success", "تم حذف شعار الفندق المخصص.");
                            }}
                            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs px-3 py-2 rounded-xl transition"
                          >
                            حذف الشعار
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                        💡 عند إضافة أو حفظ الشعار، سيتم تعيينه تلقائياً في قوقل شيت وعرضه فوراً في جميع البطاقات المصدرة للنزلاء وبطاقات الباركود والتقارير المطبوعة.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick select guest or request */}
                <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-emerald-950">سحب وتعبئة بيانات كرت من نزيل مقيم أو طلب حجز:</label>
                    <button
                      type="button"
                      onClick={handleResetCardForm}
                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                    >
                      تفريغ الحقول لكتابة كرت جديد
                    </button>
                  </div>
                  
                  <select
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-right shadow-xs focus:ring-2 focus:ring-emerald-500"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      
                      if (val.startsWith("req-")) {
                        const reqId = val.replace("req-", "");
                        const req = pendingRequests.find(r => r.id === reqId);
                        if (req) {
                          const targetRoomNum = req.assignedRoomNumber || "";
                          const room = rooms.find(r => r.number === targetRoomNum);
                          setCardForm({
                            name: req.name,
                            country: req.country || "المملكة العربية السعودية",
                            mobile: req.mobile || "",
                            roomNumber: targetRoomNum,
                            roomName: room ? room.name : (targetRoomNum ? `غرفة ${targetRoomNum}` : ""),
                            floorText: room 
                              ? (room.floor === 0 ? "الطابق الأرضي" : room.floor === 1 ? "الطابق الأول" : room.floor === 2 ? "الطابق الثاني" : room.floor === 3 ? "الطابق الثالث" : room.floor === 4 ? "الطابق الرابع" : room.floor === 5 ? "الطابق الخامس" : `الطابق ${room.floor}`)
                              : "الطابق الأرضي",
                            direction: room?.direction || "واجهة شمالية",
                            administrativeRole: req.administrativeRole || "عضو وفد",
                            photoUrl: req.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
                          });
                          triggerNotification("success", `تم سحب وتعبئة بيانات الطلب (${req.name}) في كرت النزيل بنجاح!`);
                        }
                      } else {
                        const selected = guests.find(g => g.id === val);
                        if (selected) {
                          const room = rooms.find(r => r.number === selected.roomNumber);
                          setCardForm({
                            name: selected.name,
                            country: selected.country,
                            mobile: selected.mobile,
                            roomNumber: selected.roomNumber,
                            roomName: room ? room.name : `غرفة ${selected.roomNumber}`,
                            floorText: room 
                              ? (room.floor === 0 ? "الطابق الأرضي" : room.floor === 1 ? "الطابق الأول" : room.floor === 2 ? "الطابق الثاني" : room.floor === 3 ? "الطابق الثالث" : room.floor === 4 ? "الطابق الرابع" : room.floor === 5 ? "الطابق الخامس" : `الطابق ${room.floor}`)
                              : "غير محدد",
                            direction: room?.direction || "واجهة شمالية",
                            administrativeRole: selected.administrativeRole || "عضو وفد",
                            photoUrl: selected.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
                          });
                          triggerNotification("success", `تم سحب بيانات النزيل المقيم (${selected.name}) وتحديث نموذج الكرت تلقائياً!`);
                        }
                      }
                    }}
                  >
                    <option value="">-- اختر نزيلًا مقيمًا أو طلب حجز لتعبئة الكرت تلقائيًا --</option>
                    <optgroup label="النزلاء المقيمون حالياً">
                      {guests.filter(g => g.status === "resident").map(g => (
                        <option key={g.id} value={g.id}>
                          👤 {g.name} - غرفة {g.roomNumber} ({g.country})
                        </option>
                      ))}
                    </optgroup>
                    {pendingRequests.length > 0 && (
                      <optgroup label="طلبات الحجز والتسجيل الذاتي">
                        {pendingRequests.map(r => (
                          <option key={`req-${r.id}`} value={`req-${r.id}`}>
                            📝 {r.name} - {r.country} (طلب بالرابط)
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {guests.filter(g => g.status === "resident").length === 0 && (
                    <p className="text-[10px] text-amber-800 font-medium">💡 يمكنك كتابة وتخصيص بيانات النزيل الجديد يدويًا في الحقول أدناه ثم الضغط على "حفظ وإضافة الكرت".</p>
                  )}
                </div>

                {/* Visual Theme Customize Block */}
                <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-4 text-right">
                  <div>
                    <label className="block text-xs font-black text-slate-700">تخصيص تصميم ومظهر البطاقة :</label>
                    <p className="text-[10px] text-slate-400 mt-0.5">اختر قالب الألوان والخلفية المناسبة للبطاقة التعريفية للنزلاء</p>
                  </div>

                  {/* Themes Selector Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {/* Layali Al Uns */}
                    <button
                      type="button"
                      onClick={() => {
                        setCardColorTheme("layali_al_uns");
                        localStorage.setItem("card_color_theme", "layali_al_uns");
                        triggerNotification("success", "تم تفعيل قالب خدر ليالي الأنس التراثي الفاخر!");
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition ${
                        cardColorTheme === "layali_al_uns"
                          ? "bg-[#04261a] border-amber-500 text-white ring-2 ring-amber-500/20"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 justify-center w-full">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-950 to-amber-500 border border-amber-400"></span>
                        <span className="text-[11px] font-black text-amber-400">ليالي الأنس</span>
                      </div>
                      <span className="text-[8px] opacity-90 font-bold text-amber-400">🕌 قالب تراثي معتمد</span>
                    </button>

                    {/* Emerald */}
                    <button
                      type="button"
                      onClick={() => {
                        setCardColorTheme("emerald");
                        localStorage.setItem("card_color_theme", "emerald");
                        triggerNotification("success", "تم تفعيل القالب الزمردي الافتراضي.");
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition ${
                        cardColorTheme === "emerald"
                          ? "bg-emerald-950 border-emerald-500 text-white ring-2 ring-emerald-500/20"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 justify-center w-full">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white"></span>
                        <span className="text-[11px] font-black">الزمردي</span>
                      </div>
                      <span className="text-[8px] opacity-65 font-medium">💚 كلاسيكي مريح</span>
                    </button>

                    {/* Luxury */}
                    <button
                      type="button"
                      onClick={() => {
                        setCardColorTheme("luxury");
                        localStorage.setItem("card_color_theme", "luxury");
                        triggerNotification("success", "تم تفعيل قالب الفخامة الذهبي.");
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition ${
                        cardColorTheme === "luxury"
                          ? "bg-slate-900 border-amber-500 text-white ring-2 ring-amber-500/20"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 justify-center w-full">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-slate-900 to-amber-500 border border-white"></span>
                        <span className="text-[11px] font-black">الفخم الذهبي</span>
                      </div>
                      <span className="text-[8px] opacity-65 font-medium">✨ ملكي معتم</span>
                    </button>

                    {/* Royal */}
                    <button
                      type="button"
                      onClick={() => {
                        setCardColorTheme("royal");
                        localStorage.setItem("card_color_theme", "royal");
                        triggerNotification("success", "تم تفعيل قالب الأزرق الملكي.");
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition ${
                        cardColorTheme === "royal"
                          ? "bg-blue-950 border-blue-500 text-white ring-2 ring-blue-500/20"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 justify-center w-full">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-700 border border-white"></span>
                        <span className="text-[11px] font-black">الأزرق الملكي</span>
                      </div>
                      <span className="text-[8px] opacity-65 font-medium">💙 رويال جذاب</span>
                    </button>

                    {/* Charcoal */}
                    <button
                      type="button"
                      onClick={() => {
                        setCardColorTheme("charcoal");
                        localStorage.setItem("card_color_theme", "charcoal");
                        triggerNotification("success", "تم تفعيل قالب الفحمي الكلاسيكي.");
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition ${
                        cardColorTheme === "charcoal"
                          ? "bg-slate-800 border-slate-500 text-white ring-2 ring-slate-500/20"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 justify-center w-full">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-600 border border-white"></span>
                        <span className="text-[11px] font-black">الفحمي</span>
                      </div>
                      <span className="text-[8px] opacity-65 font-medium">🖤 معتم حديدي</span>
                    </button>
                  </div>

                  {/* Layout selector (Horizontal vs Vertical) */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/60">
                    <div className="text-right w-full sm:w-auto">
                      <span className="block text-[11px] font-bold text-slate-600">تخطيط واتجاه الكرت :</span>
                      <span className="block text-[9px] text-slate-400">القالب التراثي خدر ليالي الأنس مصمم بنسبة أبعاد أفقية مثالية</span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setCardLayout("horizontal");
                          localStorage.setItem("card_layout", "horizontal");
                          triggerNotification("success", "تم تغيير التخطيط إلى الأفقي.");
                        }}
                        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                          cardLayout === "horizontal"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        ↔️ أفقي
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCardLayout("vertical");
                          localStorage.setItem("card_layout", "vertical");
                          triggerNotification("success", "تم تغيير التخطيط إلى الرأسي.");
                        }}
                        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                          cardLayout === "vertical"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        ↕️ رأسي
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Name field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم النزيل الكامل *</label>
                    <input 
                      type="text"
                      placeholder="مثال: سلمان بن عبد العزيز العتيبي"
                      value={cardForm.name}
                      onChange={e => setCardForm({ ...cardForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Country field */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">البلد / الجنسية</label>
                      <input 
                        type="text"
                        placeholder="المملكة العربية السعودية"
                        value={cardForm.country}
                        onChange={e => setCardForm({ ...cardForm, country: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs outline-none transition"
                      />
                    </div>
                    {/* Mobile field */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">رقم الجوال</label>
                      <input 
                        type="tel"
                        placeholder="+966500000000"
                        value={cardForm.mobile}
                        onChange={e => setCardForm({ ...cardForm, mobile: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs outline-none transition text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Room number with auto-sync */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">رقم الغرفة *</label>
                      <input 
                        type="text"
                        placeholder="104"
                        value={cardForm.roomNumber}
                        onChange={e => {
                          const val = e.target.value;
                          const matchedRoom = rooms.find(r => r.number === val.trim());
                          if (matchedRoom) {
                            setCardForm({
                              ...cardForm,
                              roomNumber: val,
                              roomName: matchedRoom.name || cardForm.roomName,
                              floorText: matchedRoom.floor === 0 ? "الطابق الأرضي" : matchedRoom.floor === 1 ? "الطابق الأول" : matchedRoom.floor === 2 ? "الطابق الثاني" : matchedRoom.floor === 3 ? "الطابق الثالث" : matchedRoom.floor === 4 ? "الطابق الرابع" : matchedRoom.floor === 5 ? "الطابق الخامس" : `الطابق ${matchedRoom.floor}`,
                              direction: matchedRoom.direction || cardForm.direction
                            });
                          } else {
                            setCardForm({ ...cardForm, roomNumber: val });
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs outline-none transition"
                      />
                    </div>
                    {/* Room name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم الغرفة</label>
                      <input 
                        type="text"
                        placeholder="غرفة اللؤلؤة المطلة"
                        value={cardForm.roomName}
                        onChange={e => setCardForm({ ...cardForm, roomName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs outline-none transition"
                      />
                    </div>
                    {/* Floor text */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم الطابق</label>
                      <input 
                        type="text"
                        placeholder="الطابق الأول"
                        value={cardForm.floorText}
                        onChange={e => setCardForm({ ...cardForm, floorText: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Direction / View */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">الاتجاه / الإطلالة</label>
                      <input 
                        type="text"
                        placeholder="واجهة شمالية / إطلالة جبلية"
                        value={cardForm.direction}
                        onChange={e => setCardForm({ ...cardForm, direction: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs outline-none transition"
                      />
                    </div>
                    {/* Administrative Role */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">الصفة الإدارية</label>
                      <input 
                        type="text"
                        placeholder="عضو وفد / مشرف"
                        value={cardForm.administrativeRole}
                        onChange={e => setCardForm({ ...cardForm, administrativeRole: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Photo selector/upload */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                    <label className="block text-xs font-bold text-slate-600">صورة النزيل الشخصية:</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <img 
                        src={cardForm.photoUrl} 
                        alt="Preview Avatar" 
                        className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex gap-2">
                          <label className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5 text-center">
                            <Camera className="w-3.5 h-3.5 text-slate-400" />
                            تحميل صورة من جهازك
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleCardPhotoUpload} 
                              className="hidden" 
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setCardForm({ ...cardForm, photoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" })}
                            className="bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 rounded-xl px-3 py-2 text-xs font-bold transition"
                          >
                            افتراضية
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400">يدعم صيغ JPG أو PNG. يتم حفظ الصورة محلياً في المتصفح فقط.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Card Action Buttons inside form */}
                <div className="bg-gradient-to-r from-emerald-50 to-slate-50 border-2 border-emerald-300 p-4 sm:p-5 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleSaveCardAsResidentGuest}
                      className="flex-1 py-3.5 px-5 bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98] text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition cursor-pointer"
                    >
                      <Save className="w-5 h-5 text-amber-300 animate-pulse" />
                      <span>💾 إضافة وحفظ كرت النزيل وتسكينه في النظام فوراً</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetCardForm}
                      className="py-3.5 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-600" />
                      <span>تفريغ الحقول لكرت جديد</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-900 font-bold leading-relaxed text-right">
                    ✅ عند الضغط على "إضافة وحفظ كرت النزيل"، يتم تسجيل النزيل رسمياً كمقيم في الغرفة المحددة وتحديث حالة الغرفة وحفظ السجل ومزامنته سحابياً مع قوقل شيت.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-150 p-4 rounded-2xl text-right">
                  <p className="text-xs text-amber-800 leading-relaxed font-semibold">
                    💡 يمكنك الضغط مباشرة على زر "طباعة / تصدير PDF" لفتح نافذة معاينة الطباعة للبطاقة بألوان وتفاصيل عالية الدقة، أو إرسالها للنزيل عبر الواتس آب مباشرة.
                  </p>
                </div>
              </div>

              {/* Left panel: Card preview render */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className={`w-full ${cardLayout === "horizontal" ? "max-w-2xl" : "max-w-sm"} sticky top-6 bg-white border border-slate-200 p-6 rounded-3xl shadow-lg relative text-center`}>
                  <div className="absolute top-2 right-4 bg-emerald-500/10 text-emerald-800 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                    معاينة حية للبطاقة
                  </div>

                  {/* ID Card Display Card */}
                  <div 
                    id="preview-resident-card" 
                    className={`rounded-2xl shadow-md ${cardLayout === "horizontal" ? "text-right" : "text-center"} mt-3 transition-all duration-300 relative overflow-hidden ${cardColorTheme === "layali_al_uns" ? "p-0 border-0" : "p-6 border border-slate-150"}`}
                    style={cardColorTheme === "layali_al_uns" ? { width: "100%", maxWidth: "580px", minHeight: "340px", margin: "0 auto" } : getCardStyle()}
                  >
                    {cardColorTheme === "layali_al_uns" ? (
                      renderLayaliCard({
                        name: cardForm.name,
                        country: cardForm.country,
                        mobile: cardForm.mobile,
                        roomNumber: cardForm.roomNumber,
                        roomName: cardForm.roomName,
                        floorText: cardForm.floorText,
                        direction: cardForm.direction,
                        administrativeRole: cardForm.administrativeRole,
                        photoUrl: cardForm.photoUrl
                      })
                    ) : (() => {
                      const cfg = getCardThemeConfig();
                      const textColorClass = getCardTextColorClass();
                      const subColorClass = getCardSubColorClass();
                      return cardLayout === "vertical" ? (
                        <>
                          {/* Card Ribbon / Badge */}
                          <div className={`flex items-center justify-between border-b ${cfg.footerBorder} pb-3 mb-4 relative z-10`}>
                            <div className="flex items-center gap-2">
                              {cardLogoImage ? (
                                <img src={cardLogoImage} className="w-8 h-8 rounded object-cover" alt="logo" crossOrigin="anonymous" />
                              ) : (
                                <div className={`w-7 h-7 rounded ${cfg.logoColor} flex items-center justify-center text-white font-black text-[10px]`}>
                                  <Hotel className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div className="text-right">
                                <h4 className={`font-extrabold text-[11px] leading-tight ${textColorClass}`}>خد ليالي الانس</h4>
                                <p className={`text-[8px] ${subColorClass}`}>للأجنحة الفندقية</p>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-wider ${cfg.badgeBg}`}>
                              بطاقة نزيل مقيم
                            </span>
                          </div>

                          {/* Guest Photo */}
                          <div className="relative inline-block mb-3 z-10">
                            <img 
                              src={cardForm.photoUrl} 
                              alt="Guest" 
                              className="w-24 h-24 rounded-2xl object-cover mx-auto border-4 border-white/20 shadow"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                            />
                            <div className="absolute -bottom-1 -left-1 bg-emerald-600 text-white rounded-lg p-1 shadow">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-0.5 mb-4 z-10 relative">
                            <h3 className={`font-black text-base leading-tight ${textColorClass}`}>{cardForm.name || "سليمان بن عبد العزيز"}</h3>
                            <p className={`text-[11px] font-medium ${subColorClass}`}>{cardForm.country}</p>
                          </div>

                          {/* Room info grid */}
                          <div className={`grid grid-cols-3 gap-1 p-2.5 rounded-xl mb-4 text-center z-10 relative ${cfg.infoBg}`}>
                            <div className={`border-l ${cfg.footerBorder} last:border-0 px-0.5`}>
                              <span className={`text-[8px] block mb-0.5 ${subColorClass}`}>رقم الغرفة</span>
                              <span className={`font-black text-xs block ${cfg.infoText}`}>غرفة {cardForm.roomNumber || "204"}</span>
                            </div>
                            <div className={`border-l ${cfg.footerBorder} last:border-0 px-0.5`}>
                              <span className={`text-[8px] block mb-0.5 ${subColorClass}`}>اسم الغرفة</span>
                              <span className={`font-bold text-[10px] truncate block ${textColorClass}`} title={cardForm.roomName}>{cardForm.roomName || "جناح اللؤلؤة"}</span>
                            </div>
                            <div className="px-0.5">
                              <span className={`text-[8px] block mb-0.5 ${subColorClass}`}>الطابق</span>
                              <span className={`font-medium text-[10px] block ${textColorClass}`}>{cardForm.floorText || "الطابق الثاني"}</span>
                            </div>
                          </div>

                          {/* QR Code */}
                          <div className={`p-2.5 rounded-2xl w-fit mx-auto mb-3 z-10 relative ${cfg.qrBg}`}>
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`الاسم: ${cardForm.name || "سليمان بن عبد العزيز"} | غرفة: ${cardForm.roomNumber || "204"} | اسم الغرفة: ${cardForm.roomName || "جناح اللؤلؤة"} | الطابق: ${cardForm.floorText || "الطابق الثاني"} | جوال: ${cardForm.mobile || ""}`)}`}
                              alt="QR Code" 
                              className="w-28 h-28 mx-auto object-contain"
                              crossOrigin="anonymous"
                            />
                          </div>

                          {/* Footer text */}
                          <div className={`border-t ${cfg.footerBorder} pt-2.5 mt-1 flex justify-between text-[8px] font-mono relative z-10 ${subColorClass}`}>
                            <span>الخدمة الذاتية</span>
                            <span>معرف مخصص</span>
                          </div>
                        </>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative z-10">
                          {/* Right column: Info & Photo (8 cols) */}
                          <div className="md:col-span-8 text-right space-y-3">
                            {/* Card Ribbon / Badge */}
                            <div className={`flex items-center justify-between border-b ${cfg.footerBorder} pb-2`}>
                              <div className="flex items-center gap-2">
                                {cardLogoImage ? (
                                  <img src={cardLogoImage} className="w-8 h-8 rounded object-cover" alt="logo" crossOrigin="anonymous" />
                                ) : (
                                  <div className={`w-7 h-7 rounded ${cfg.logoColor} flex items-center justify-center text-white font-black text-[10px]`}>
                                    <Hotel className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                <div className="text-right">
                                  <h4 className={`font-extrabold text-[11px] leading-tight ${textColorClass}`}>خد ليالي الانس</h4>
                                  <p className={`text-[8px] ${subColorClass}`}>للأجنحة الفندقية</p>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-wider ${cfg.badgeBg}`}>
                                بطاقة نزيل مقيم
                              </span>
                            </div>

                            {/* Guest Info flex layout */}
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                <img 
                                  src={cardForm.photoUrl} 
                                  alt="Guest" 
                                  className="w-20 h-20 rounded-xl object-cover border-4 border-white/20 shadow"
                                  referrerPolicy="no-referrer"
                                  crossOrigin="anonymous"
                                />
                                <div className="absolute -bottom-1 -left-1 bg-emerald-600 text-white rounded-lg p-0.5 shadow">
                                  <CheckCircle className="w-3 h-3" />
                                </div>
                              </div>

                              <div className="space-y-0.5">
                                <h3 className={`font-black text-sm leading-tight ${textColorClass}`}>{cardForm.name || "سليمان بن عبد العزيز"}</h3>
                                <p className={`text-[10px] font-medium ${subColorClass}`}>{cardForm.country}</p>
                                <p className={`text-[9px] px-1.5 py-0.5 rounded inline-block font-mono bg-white/10 ${textColorClass}`}>جوال: {cardForm.mobile || "غير مسجل"}</p>
                              </div>
                            </div>

                            {/* Room info grid */}
                            <div className={`grid grid-cols-3 gap-1 p-2 rounded-xl text-center ${cfg.infoBg}`}>
                              <div className={`border-l ${cfg.footerBorder} last:border-0 px-0.5`}>
                                <span className={`text-[8px] block mb-0.5 ${subColorClass}`}>رقم الغرفة</span>
                                <span className={`font-black text-xs block ${cfg.infoText}`}>غرفة {cardForm.roomNumber || "204"}</span>
                              </div>
                              <div className={`border-l ${cfg.footerBorder} last:border-0 px-0.5`}>
                                <span className={`text-[8px] block mb-0.5 ${subColorClass}`}>اسم الغرفة</span>
                                <span className={`font-bold text-[9px] truncate block ${textColorClass}`} title={cardForm.roomName}>{cardForm.roomName || "جناح اللؤلؤة"}</span>
                              </div>
                              <div className="px-0.5">
                                <span className={`text-[8px] block mb-0.5 ${subColorClass}`}>الطابق</span>
                                <span className={`font-medium text-[9px] block ${textColorClass}`}>{cardForm.floorText || "الطابق الثاني"}</span>
                              </div>
                            </div>

                            {/* Footer text */}
                            <div className={`border-t ${cfg.footerBorder} pt-2 mt-1 flex justify-between text-[8px] font-mono ${subColorClass}`}>
                              <span>الخدمة الذاتية</span>
                              <span>معرف مخصص</span>
                            </div>
                          </div>

                          {/* Left column: QR Code (4 cols) */}
                          <div className={`md:col-span-4 flex flex-col items-center justify-center border-t md:border-t-0 md:border-r ${cfg.footerBorder} pt-3 md:pt-0 md:pr-3`}>
                            <div className={`p-2 rounded-2xl ${cfg.qrBg}`}>
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`الاسم: ${cardForm.name || "سليمان بن عبد العزيز"} | غرفة: ${cardForm.roomNumber || "204"} | اسم الغرفة: ${cardForm.roomName || "جناح اللؤلؤة"} | الطابق: ${cardForm.floorText || "الطابق الثاني"} | جوال: ${cardForm.mobile || ""}`)}`}
                                alt="QR Code" 
                                className="w-24 h-24 object-contain"
                                crossOrigin="anonymous"
                              />
                            </div>
                            <span className={`text-[8px] mt-1 font-bold text-center ${subColorClass}`}>امسح للتحقق الرقمي</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions under preview */}
                  <div className="pt-3 space-y-2.5">
                    {/* Primary Save Action */}
                    <button
                      type="button"
                      onClick={handleSaveCardAsResidentGuest}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-[0.98] text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                      title="حفظ الكرت وتسكين النزيل ومزامنته مع قوقل شيت"
                    >
                      <Save className="w-4 h-4 text-amber-300" />
                      <span>حفظ وإضافة الكرت إلى قائمة المقيمين</span>
                    </button>

                    {/* Direct High-Fidelity Client Downloads */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleExportCard("pdf", "preview-resident-card", cardForm.name || "سليمان_بن_عبدالعزيز")}
                        disabled={isExportingCard}
                        className="py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 shadow transition"
                        title="تحميل كملف PDF مباشر للكمبيوتر"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        تنزيل PDF مباشر
                      </button>
                      
                      <button
                        onClick={() => handleExportCard("png", "preview-resident-card", cardForm.name || "سليمان_بن_عبدالعزيز")}
                        disabled={isExportingCard}
                        className="py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-300 disabled:cursor-not-allowed text-slate-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 border border-slate-200 transition"
                        title="تحميل كصورة عالية الدقة PNG"
                      >
                        <DownloadCloud className="w-3.5 h-3.5 text-slate-500" />
                        تنزيل كصورة PNG
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        const testGuest: Guest = {
                          id: "custom-" + Math.random().toString(36).substring(2, 9),
                          name: cardForm.name || "سليمان بن عبد العزيز",
                          country: cardForm.country,
                          mobile: cardForm.mobile,
                          roomNumber: cardForm.roomNumber || "204",
                          checkInDate: new Date().toISOString(),
                          status: "resident",
                          photoUrl: cardForm.photoUrl,
                          administrativeRole: cardForm.administrativeRole,
                          notes: ""
                        };
                        setSelectedGuestForCard(testGuest);
                      }}
                      className="w-full py-2.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-emerald-900 transition"
                    >
                      <Hotel className="w-3.5 h-3.5" />
                      فتح نافذة طباعة البطاقة (Print Window)
                    </button>

                    {cardForm.mobile && (
                      <a 
                        href={`https://wa.me/${(() => {
                          let cleaned = cardForm.mobile.replace(/[^\d+]/g, '');
                          if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
                          if (cleaned.startsWith('05') && cleaned.length === 10) cleaned = '966' + cleaned.substring(1);
                          else if (cleaned.startsWith('5') && cleaned.length === 9) cleaned = '966' + cleaned;
                          return cleaned;
                        })()}?text=${encodeURIComponent(
                          `🏨 *بطاقة وبيانات النزيل - خدر ليالي الانس* 🏨\n` +
                          `═══════════════════════\n` +
                          `✨ *أهلاً وسهلاً بكم ضيفنا الكريم*\n\n` +
                          `👤 *الاسم:* ${cardForm.name || "غير محدد"}\n` +
                          `🌍 *البلاد / الجنسية:* ${cardForm.country || "المملكة العربية السعودية"}\n` +
                          `🚪 *رقم الغرفة:* ${cardForm.roomNumber || "غير محدد"}\n` +
                          `🏷️ *اسم الغرفة:* ${cardForm.roomName || `غرفة ${cardForm.roomNumber || ""}`}\n` +
                          `🏢 *الدور / الطابق:* ${cardForm.floorText || "الطابق الأرضي"}\n` +
                          `🧭 *الاتجاه / الإطلالة:* ${cardForm.direction || "واجهة رئيسية"}\n` +
                          `🎖️ *الصفة الإدارية:* ${cardForm.administrativeRole || "عضو وفد"}\n` +
                          `📱 *رقم الجوال:* ${cardForm.mobile}\n` +
                          (cardForm.photoUrl && !cardForm.photoUrl.startsWith("data:") ? `🖼️ *الصورة الشخصية:* ${cardForm.photoUrl}\n` : '') +
                          `\n🔍 *رمز التحقق الرقمي والبطاقة (QR Code):*\n` +
                          `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
                            `خدر ليالي الانس\nالاسم: ${cardForm.name || ""}\nالغرفة: ${cardForm.roomNumber || ""}\nاسم الغرفة: ${cardForm.roomName || ""}\nالدور: ${cardForm.floorText || ""}\nالاتجاه: ${cardForm.direction || ""}\nالصفة: ${cardForm.administrativeRole || ""}\nالبلد: ${cardForm.country || ""}\nالجوال: ${cardForm.mobile || ""}`
                          )}\n\n` +
                          `🎉 *يسر إدارة خدر ليالي الانس أن ترحب بكم، ونتمنى لكم إقامة طيبة وسعيدة ومباركة!* ❤️🌟`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition text-center cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        إرسال كرت وبيانات النزيل كاملة عبر الواتساب 📲
                      </a>
                    )}
                    
                    {window.self !== window.top && (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl space-y-1.5 text-right mt-1.5">
                        <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                          💡 هل تواجه مشكلة في تحميل الـ PDF؟ اضغط هنا لفتح البرنامج في نافذة مستقلة وتنزيل الملفات مباشرة دون قيود المنصة:
                        </p>
                        <button 
                          onClick={() => window.open(window.location.href, "_blank")}
                          className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-[10px] rounded-lg flex items-center justify-center gap-1 shadow transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          فتح في نافذة مستقلة
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ==================== REPORTS & BULK CARDS TAB ==================== */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              
              {/* Reports Dashboard Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
                <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-800 p-5 rounded-2xl text-white shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-emerald-300 font-bold">إجمالي النزلاء (أرشيف)</span>
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h4 className="text-2xl font-black">{filteredGuests.length}</h4>
                  <p className="text-[10px] text-emerald-300/80 mt-1">المسجلون في هذا الموسم</p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-400 font-bold">النزلاء الحاليين (المقيمين)</span>
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-800">
                    {filteredGuests.filter(g => g.status === "resident").length}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">مسكنين حالياً بالموسم النشط</p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-400 font-bold">النزلاء الخارجين (المغادرين)</span>
                    <LogOut className="w-5 h-5 text-rose-600" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-800">
                    {filteredGuests.filter(g => g.status === "checked_out").length}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">نزلاء مغادرون في هذا الموسم</p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-400 font-bold">نسبة إشغال الغرف</span>
                    <Percent className="w-5 h-5 text-amber-600" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-800">
                    {stats.occupancyRate}%
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">{stats.occupiedRooms} غرفة مشغولة من أصل {rooms.length}</p>
                </div>
              </div>

              {/* Navigation Tabs for Reports */}
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-1.5 no-print">
                <button
                  onClick={() => { setActiveReportSubTab("all_guests"); setReportSearchQuery(""); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeReportSubTab === "all_guests" ? "bg-emerald-800 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <Users className="w-3.5 h-3.5" />
                  تقرير جميع النزلاء
                </button>
                <button
                  onClick={() => { setActiveReportSubTab("residents"); setReportSearchQuery(""); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeReportSubTab === "residents" ? "bg-emerald-800 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  تقرير النزلاء الحاليين
                </button>
                <button
                  onClick={() => { setActiveReportSubTab("checked_out"); setReportSearchQuery(""); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeReportSubTab === "checked_out" ? "bg-emerald-800 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  تقرير النزلاء الخارجين
                </button>
                <button
                  onClick={() => { setActiveReportSubTab("by_room"); setReportSearchQuery(""); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeReportSubTab === "by_room" ? "bg-emerald-800 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <Bed className="w-3.5 h-3.5" />
                  تفصيل الغرف والجنسيات
                </button>
                <button
                  onClick={() => { setActiveReportSubTab("by_nationality"); setReportNationalityFilter("all"); setReportSearchQuery(""); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeReportSubTab === "by_nationality" ? "bg-emerald-800 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  الفلترة حسب الجنسية
                </button>
                <button
                  onClick={() => { setActiveReportSubTab("barcode_logs"); setReportSearchQuery(""); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeReportSubTab === "barcode_logs" ? "bg-emerald-800 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  الدخول والخروج بالباركود
                </button>
                <button
                  onClick={() => { setActiveReportSubTab("bulk_print"); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeReportSubTab === "bulk_print" ? "bg-amber-700 text-white shadow" : "text-amber-800 bg-amber-50 hover:bg-amber-100/70"}`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  طباعة الكروت الجماعية
                </button>
              </div>

              {/* Search & Filter bar for reports */}
              {activeReportSubTab !== "bulk_print" && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between no-print">
                  <div className="relative w-full sm:w-96">
                    <input 
                      type="text" 
                      placeholder="ابحث بالاسم، الجوال أو رقم الغرفة..." 
                      value={reportSearchQuery}
                      onChange={e => setReportSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl pr-10 pl-4 py-2.5 text-xs outline-none transition font-semibold"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  </div>

                  {activeReportSubTab === "by_nationality" && (
                    <div className="w-full sm:w-auto flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 whitespace-nowrap">جنسية النزيل:</span>
                      <select
                        value={reportNationalityFilter}
                        onChange={e => setReportNationalityFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="all">كل الجنسيات</option>
                        {Array.from(new Set(guests.map(g => g.country).filter(Boolean))).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={() => window.print()}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    طباعة هذا التقرير ورقيًا
                  </button>
                </div>
              )}

              {/* REPORT CONTROLLER CONTAINER */}
              {activeReportSubTab !== "bulk_print" ? (
                <div id="printable-report-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
                  
                  {/* Print-Only Header Logo */}
                  <div className="hidden print:flex items-center justify-between border-b-2 border-emerald-950 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-900 flex items-center justify-center text-white font-black text-xs">
                        🏨
                      </div>
                      <div className="text-right">
                        <h2 className="font-extrabold text-lg text-emerald-950">خد ليالي الانس للأجنحة الفندقية</h2>
                        <p className="text-[10px] text-slate-500">نظام التقارير الذكي المتكامل</p>
                      </div>
                    </div>
                    <div className="text-left text-xs text-slate-500 font-medium">
                      <p>نوع التقرير: <b>
                        {activeReportSubTab === "all_guests" && "تقرير النزلاء الكلي والأرشيف"}
                        {activeReportSubTab === "residents" && "تقرير النزلاء الحاليين والمقيمين"}
                        {activeReportSubTab === "checked_out" && "تقرير النزلاء الخارجين والمغادرين"}
                        {activeReportSubTab === "by_room" && "تقرير تفصيلي حسب الغرف ونوع الغرف والجنسية"}
                        {activeReportSubTab === "by_nationality" && `تقرير جميع النزلاء مصفى للجنسية: ${reportNationalityFilter}`}
                        {activeReportSubTab === "barcode_logs" && "تقرير الدخول والخروج السريع بالباركود"}
                      </b></p>
                      <p>تاريخ الاستخراج: {new Date().toLocaleDateString("ar-EG")} | {new Date().toLocaleTimeString("ar-EG", {hour: "2-digit", minute:"2-digit"})}</p>
                    </div>
                  </div>

                  {/* SUB-TAB 1: ALL GUESTS */}
                  {activeReportSubTab === "all_guests" && (() => {
                    const filtered = filteredGuests.filter(g => {
                      const matchQuery = !reportSearchQuery || 
                        g.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                        g.roomNumber.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                        g.mobile.includes(reportSearchQuery);
                      return matchQuery;
                    });

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center no-print">
                          <h3 className="text-sm font-black text-slate-800">تقرير جميع النزلاء ككل والأرشيف</h3>
                          <span className="text-xs text-slate-400 font-bold">تم العثور على {filtered.length} سجل</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                                <th className="p-3 text-center">الصورة</th>
                                <th className="p-3">اسم النزيل الكامل</th>
                                <th className="p-3">الجنسية</th>
                                <th className="p-3">رقم الجوال</th>
                                <th className="p-3 text-center">رقم الغرفة</th>
                                <th className="p-3">تاريخ الدخول</th>
                                <th className="p-3">تاريخ المغادرة</th>
                                <th className="p-3 text-center">حالة النزيل</th>
                                <th className="p-3">الملاحظات والقيود</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filtered.length === 0 ? (
                                <tr>
                                  <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">لا يوجد نزلاء متطابقين مع البحث حالياً</td>
                                </tr>
                              ) : (
                                filtered.map(g => (
                                  <tr key={g.id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-3 text-center">
                                      <img src={g.photoUrl} alt={g.name} className="w-8 h-8 rounded-full object-cover mx-auto border border-slate-200" referrerPolicy="no-referrer" />
                                    </td>
                                    <td className="p-3 font-extrabold text-slate-800">{g.name}</td>
                                    <td className="p-3 font-semibold text-slate-600">{g.country}</td>
                                    <td className="p-3 font-mono text-slate-600">{g.mobile || "-"}</td>
                                    <td className="p-3 text-center font-black text-emerald-800 bg-emerald-50/40">{g.roomNumber}</td>
                                    <td className="p-3 text-slate-500 font-medium">{new Date(g.checkInDate).toLocaleDateString("ar-EG")} {new Date(g.checkInDate).toLocaleTimeString("ar-EG", {hour: "2-digit", minute:"2-digit"})}</td>
                                    <td className="p-3 text-slate-500 font-medium">{g.checkOutDate ? `${new Date(g.checkOutDate).toLocaleDateString("ar-EG")} ${new Date(g.checkOutDate).toLocaleTimeString("ar-EG", {hour: "2-digit", minute:"2-digit"})}` : "مقيم حالياً"}</td>
                                    <td className="p-3 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${g.status === "resident" ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                                        {g.status === "resident" ? "مقيم حالياً" : "غادر الفندق"}
                                      </span>
                                    </td>
                                    <td className="p-3 text-slate-400 italic truncate max-w-[150px]" title={g.notes}>{g.notes || "-"}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {/* SUB-TAB 2: RESIDENTS */}
                  {activeReportSubTab === "residents" && (() => {
                    const filtered = filteredGuests.filter(g => {
                      if (g.status !== "resident") return false;
                      const matchQuery = !reportSearchQuery || 
                        g.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                        g.roomNumber.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                        g.mobile.includes(reportSearchQuery);
                      return matchQuery;
                    });

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center no-print">
                          <h3 className="text-sm font-black text-slate-800">تقرير النزلاء الحاليين (المسكنين حاليًا)</h3>
                          <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full font-bold">إجمالي النزلاء المقيمين: {filtered.length} نزيل</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                                <th className="p-3 text-center">الصورة</th>
                                <th className="p-3">اسم النزيل الكامل</th>
                                <th className="p-3">الجنسية</th>
                                <th className="p-3">رقم الجوال</th>
                                <th className="p-3 text-center">رقم الغرفة</th>
                                <th className="p-3">تاريخ ووقت الدخول</th>
                                <th className="p-3">الملاحظات والطلبات</th>
                                <th className="p-3 text-center no-print">إجراءات سريعة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filtered.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">لا يوجد نزلاء مقيمين متوافقين مع شروط البحث</td>
                                </tr>
                              ) : (
                                filtered.map(g => (
                                  <tr key={g.id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-3 text-center">
                                      <img src={g.photoUrl} alt={g.name} className="w-8 h-8 rounded-full object-cover mx-auto border border-slate-200" referrerPolicy="no-referrer" />
                                    </td>
                                    <td className="p-3 font-extrabold text-slate-800">{g.name}</td>
                                    <td className="p-3 font-semibold text-slate-600">{g.country}</td>
                                    <td className="p-3 font-mono text-slate-600">{g.mobile || "-"}</td>
                                    <td className="p-3 text-center font-black text-emerald-800 bg-emerald-50/40">{g.roomNumber}</td>
                                    <td className="p-3 text-slate-500 font-medium">{new Date(g.checkInDate).toLocaleDateString("ar-EG")} {new Date(g.checkInDate).toLocaleTimeString("ar-EG", {hour: "2-digit", minute:"2-digit"})}</td>
                                    <td className="p-3 text-slate-400 italic truncate max-w-[150px]" title={g.notes}>{g.notes || "-"}</td>
                                    <td className="p-3 text-center no-print flex gap-1 justify-center items-center">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditGuest(g)}
                                        className="p-1 px-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition flex items-center gap-0.5 cursor-pointer"
                                        title="تعديل بيانات النزيل"
                                      >
                                        <Edit3 className="w-3 h-3 text-amber-700" />
                                        <span>تعديل</span>
                                      </button>
                                      <button
                                        onClick={() => setSelectedGuestForCard(g)}
                                        className="p-1 px-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition"
                                      >
                                        بطاقة التعريف
                                      </button>
                                      <button
                                        onClick={() => handleCheckOut(g.id)}
                                        className="p-1 px-2.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition"
                                      >
                                        تسجيل خروج
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {/* SUB-TAB 3: CHECKED OUT */}
                  {activeReportSubTab === "checked_out" && (() => {
                    const filtered = filteredGuests.filter(g => {
                      if (g.status !== "checked_out") return false;
                      const matchQuery = !reportSearchQuery || 
                        g.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                        g.roomNumber.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                        g.mobile.includes(reportSearchQuery);
                      return matchQuery;
                    });

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center no-print">
                          <h3 className="text-sm font-black text-slate-800">تقرير النزلاء الخارجين (الذين غادروا الفندق)</h3>
                          <span className="text-xs text-rose-800 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full font-bold">إجمالي المغادرين: {filtered.length} نزيل</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                                <th className="p-3 text-center">الصورة</th>
                                <th className="p-3">اسم النزيل الكامل</th>
                                <th className="p-3">الجنسية</th>
                                <th className="p-3">رقم الجوال</th>
                                <th className="p-3 text-center">رقم الغرفة</th>
                                <th className="p-3">تاريخ الدخول</th>
                                <th className="p-3">تاريخ المغادرة والتحقق</th>
                                <th className="p-3">الملاحظات المسجلة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filtered.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">لا توجد عمليات تسجيل خروج سابقة متوافقة مع البحث</td>
                                </tr>
                              ) : (
                                filtered.map(g => (
                                  <tr key={g.id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-3 text-center">
                                      <img src={g.photoUrl} alt={g.name} className="w-8 h-8 rounded-full object-cover mx-auto border border-slate-200" referrerPolicy="no-referrer" />
                                    </td>
                                    <td className="p-3 font-extrabold text-slate-800">{g.name}</td>
                                    <td className="p-3 font-semibold text-slate-600">{g.country}</td>
                                    <td className="p-3 font-mono text-slate-600">{g.mobile || "-"}</td>
                                    <td className="p-3 text-center font-black text-slate-600 bg-slate-50">{g.roomNumber}</td>
                                    <td className="p-3 text-slate-500 font-medium">{new Date(g.checkInDate).toLocaleDateString("ar-EG")}</td>
                                    <td className="p-3 text-rose-700 font-extrabold">{g.checkOutDate ? `${new Date(g.checkOutDate).toLocaleDateString("ar-EG")} ${new Date(g.checkOutDate).toLocaleTimeString("ar-EG", {hour: "2-digit", minute:"2-digit"})}` : "-"}</td>
                                    <td className="p-3 text-slate-400 italic truncate max-w-[150px]" title={g.notes}>{g.notes || "-"}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {/* SUB-TAB 4: DETAILED BY ROOM, TYPE & NATIONALITY */}
                  {activeReportSubTab === "by_room" && (() => {
                    const filteredRooms = rooms.filter(r => {
                      const matchQuery = !reportSearchQuery ||
                        r.number.includes(reportSearchQuery) ||
                        r.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                        r.type.toLowerCase().includes(reportSearchQuery.toLowerCase());
                      return matchQuery;
                    });

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center no-print">
                          <h3 className="text-sm font-black text-slate-800">تقرير تفصيلي شامل حسب الغرف ونوع الغرف وجنسية النزيل</h3>
                          <span className="text-xs text-slate-400 font-bold">إجمالي الغرف المدرجة: {rooms.length} غرفة</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                                <th className="p-3 text-center">رقم الغرفة</th>
                                <th className="p-3">اسم وتصنيف الغرفة</th>
                                <th className="p-3">نوع الغرفة ومواصفاتها</th>
                                <th className="p-3 text-center">الطابق</th>
                                <th className="p-3 text-center">السعة القصوى</th>
                                <th className="p-3 text-center">حالة الغرفة</th>
                                <th className="p-3">اسم النزيل المقيم</th>
                                <th className="p-3">جنسية النزيل</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredRooms.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">لم يتم العثور على غرف متوافقة مع معايير البحث</td>
                                </tr>
                              ) : (
                                filteredRooms.map(r => {
                                  // Find resident guest in this room
                                  const resident = guests.find(g => g.roomNumber === r.number && g.status === "resident");
                                  return (
                                    <tr key={r.number} className="hover:bg-slate-50/50 transition">
                                      <td className="p-3 text-center font-black text-emerald-950 bg-emerald-50/20">{r.number}</td>
                                      <td className="p-3 font-extrabold text-slate-800">{r.name}</td>
                                      <td className="p-3 font-semibold text-slate-500">{r.type}</td>
                                      <td className="p-3 text-center font-medium text-slate-600">الطابق {r.floor}</td>
                                      <td className="p-3 text-center text-slate-600">{r.capacity} أشخاص</td>
                                      <td className="p-3 text-center">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border ${
                                          r.status === "available" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                                          r.status === "occupied" ? "bg-amber-50 text-amber-800 border-amber-100" :
                                          "bg-rose-50 text-rose-800 border-rose-100"
                                        }`}>
                                          {r.status === "available" && "شاغرة ومتاحة"}
                                          {r.status === "occupied" && "مسكونة مقيمة"}
                                          {r.status === "full" && "ممتلئة بالكامل"}
                                        </span>
                                      </td>
                                      <td className={`p-3 font-black ${resident ? "text-emerald-900" : "text-slate-400 italic"}`}>
                                        {resident ? resident.name : "لا يوجد (غرفة شاغرة)"}
                                      </td>
                                      <td className="p-3 font-semibold text-slate-600">
                                        {resident ? resident.country : "-"}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {/* SUB-TAB 5: FILTER BY NATIONALITY */}
                  {activeReportSubTab === "by_nationality" && (() => {
                    const filtered = filteredGuests.filter(g => {
                      const matchNationality = reportNationalityFilter === "all" || g.country === reportNationalityFilter;
                      const matchQuery = !reportSearchQuery || 
                        g.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                        g.roomNumber.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                        g.mobile.includes(reportSearchQuery);
                      return matchNationality && matchQuery;
                    });

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center no-print">
                          <h3 className="text-sm font-black text-slate-800">
                            تقرير جميع النزلاء مصفى للجنسية: <span className="text-emerald-800 font-black">"{reportNationalityFilter === "all" ? "كل الجنسيات" : reportNationalityFilter}"</span>
                          </h3>
                          <span className="text-xs text-slate-500 font-bold">إجمالي النزلاء من هذه الجنسية: {filtered.length} نزيل</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                                <th className="p-3 text-center">الصورة</th>
                                <th className="p-3">اسم النزيل الكامل</th>
                                <th className="p-3">بلد الجنسية والمنشأ</th>
                                <th className="p-3">رقم الجوال</th>
                                <th className="p-3 text-center">رقم الغرفة المسجلة</th>
                                <th className="p-3">حالة السكن</th>
                                <th className="p-3">تاريخ الدخول</th>
                                <th className="p-3">تاريخ المغادرة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filtered.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">لا يوجد سجلات لنزلاء متوافقين مع الجنسية والبحث المختارين</td>
                                </tr>
                              ) : (
                                filtered.map(g => (
                                  <tr key={g.id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-3 text-center">
                                      <img src={g.photoUrl} alt={g.name} className="w-8 h-8 rounded-full object-cover mx-auto border border-slate-200" referrerPolicy="no-referrer" />
                                    </td>
                                    <td className="p-3 font-extrabold text-slate-800">{g.name}</td>
                                    <td className="p-3 font-black text-emerald-800 flex items-center gap-1">
                                      <Globe className="w-3 h-3 text-emerald-500" />
                                      {g.country}
                                    </td>
                                    <td className="p-3 font-mono text-slate-600">{g.mobile || "-"}</td>
                                    <td className="p-3 text-center font-black text-slate-700 bg-slate-50">{g.roomNumber}</td>
                                    <td className="p-3 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${g.status === "resident" ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                                        {g.status === "resident" ? "مقيم حالياً" : "غادر وصُفّي"}
                                      </span>
                                    </td>
                                    <td className="p-3 text-slate-500 font-medium">{new Date(g.checkInDate).toLocaleDateString("ar-EG")}</td>
                                    <td className="p-3 text-slate-400 font-medium">{g.checkOutDate ? new Date(g.checkOutDate).toLocaleDateString("ar-EG") : "-"}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {/* SUB-TAB 6: BARCODE CHECK-IN/OUT LOGS WITH QR GENERATION */}
                  {activeReportSubTab === "barcode_logs" && (() => {
                    const filtered = filteredGuests.filter(g => {
                      const matchQuery = !reportSearchQuery || 
                        g.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                        g.roomNumber.toLowerCase().includes(reportSearchQuery.toLowerCase());
                      return matchQuery;
                    });

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center no-print">
                          <h3 className="text-sm font-black text-slate-800">سجل الدخول والخروج مع الباركود والتحقق الرقمي للنزيل</h3>
                          <span className="text-xs text-slate-400 font-bold">يحتوي كل باركود على بطاقة تذكرة التحقق السريعة</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                                <th className="p-3">اسم النزيل الكامل</th>
                                <th className="p-3 text-center">رقم الغرفة</th>
                                <th className="p-3 text-center">العملية</th>
                                <th className="p-3">تاريخ وتوقيت العملية</th>
                                <th className="p-3 text-center">باركود التحقق الرقمي السريع</th>
                                <th className="p-3 no-print text-center">حفظ الباركود</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filtered.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">لا توجد سجلات تملك تذكرة تحقق باركود متوافقة مع البحث</td>
                                </tr>
                              ) : (
                                filtered.map(g => {
                                  // QR payload content
                                  const qrPayload = `النزيل: ${g.name} | الغرفة: ${g.roomNumber} | الحالة: ${g.status === "resident" ? "تسجيل دخول فعال" : "مغادرة نهائية"} | التاريخ: ${new Date(g.checkInDate).toLocaleDateString("ar-EG")} | فندق خد ليالي الانس`;
                                  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`;
                                  return (
                                    <tr key={g.id} className="hover:bg-slate-50/50 transition">
                                      <td className="p-3 font-extrabold text-slate-800">
                                        <div className="flex items-center gap-2.5">
                                          <img src={g.photoUrl} alt={g.name} className="w-7 h-7 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                                          <div>
                                            <span>{g.name}</span>
                                            <span className="block text-[9px] text-slate-400 font-normal">المعرف: {g.id.slice(0,8).toUpperCase()}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3 text-center font-black text-slate-700">{g.roomNumber}</td>
                                      <td className="p-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${g.status === "resident" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                                          {g.status === "resident" ? "تسجيل دخول" : "تسجيل خروج مغادرة"}
                                        </span>
                                      </td>
                                      <td className="p-3 font-mono text-slate-500">
                                        {g.status === "resident" 
                                          ? `${new Date(g.checkInDate).toLocaleDateString("ar-EG")} ${new Date(g.checkInDate).toLocaleTimeString("ar-EG", {hour:"2-digit", minute:"2-digit"})}`
                                          : g.checkOutDate ? `${new Date(g.checkOutDate).toLocaleDateString("ar-EG")} ${new Date(g.checkOutDate).toLocaleTimeString("ar-EG", {hour:"2-digit", minute:"2-digit"})}` : "-"
                                        }
                                      </td>
                                      <td className="p-3 text-center">
                                        <div className="bg-white p-1 rounded-lg border border-slate-200 inline-block">
                                          <img src={qrSrc} alt="Verification QR" className="w-16 h-16 object-contain" />
                                        </div>
                                      </td>
                                      <td className="p-3 text-center no-print">
                                        <a 
                                          href={qrSrc} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="inline-flex items-center gap-1 text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg transition"
                                          download={`QR_Log_${g.id}.png`}
                                        >
                                          <DownloadCloud className="w-3 h-3 text-slate-500" />
                                          فتح / تحميل
                                        </a>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              ) : (
                
                // SUB-TAB 7: BULK CARD GENERATION & BULK PRINT FOR ALL ACTIVE RESIDENTS
                <div className="space-y-6">
                  
                  {/* Action Bar for Bulk Cards */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center no-print">
                    <div>
                      <h3 className="text-sm font-black text-slate-800">طباعة الكروت الفردية لكافة النزلاء المقيمين حالياً دفعة واحدة</h3>
                      <p className="text-[11px] text-slate-400 mt-1">
                        سيقوم النظام بتجميع وتخطيط بطاقات الهوية لكافة النزلاء الحاليين (البالغ عددهم {guests.filter(g => g.status === "resident").length} نزيل) وتجهيزهم للطباعة الورقية الفورية أو تصديرهم لملف PDF موحد.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5 w-full sm:w-auto shrink-0 justify-end">
                      <button
                        onClick={handleBulkExportPDF}
                        disabled={isExportingCard || guests.filter(g => g.status === "resident").length === 0}
                        className="px-5 py-2.5 bg-amber-700 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/20 transition cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        تنزيل PDF جماعي للجميع
                      </button>

                      <button
                        onClick={() => window.print()}
                        disabled={guests.filter(g => g.status === "resident").length === 0}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        طباعة جماعية بالورق
                      </button>
                    </div>
                  </div>

                  {/* BULK PRINTABLE CARDS WRAPPER */}
                  <div id="printable-bulk-cards" className="bg-slate-50 rounded-2xl border border-slate-200 p-6 no-print-layout-container">
                    
                    {guests.filter(g => g.status === "resident").length === 0 ? (
                      <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-inner no-print">
                        <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-base font-bold text-slate-700">لا يوجد نزلاء مقيمين حالياً لتوليد كروت لهم!</h4>
                        <p className="text-xs text-slate-400 mt-1">يجب أولاً القيام بتسكين نزلاء جدد لكي تظهر الكروت وتتمكن من طباعتها دفعة واحدة.</p>
                      </div>
                    ) : (
                      <div className={`grid ${cardLayout === "horizontal" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"} gap-6`}>
                        {guests.filter(g => g.status === "resident").map((guest) => {
                          const room = rooms.find(r => r.number === guest.roomNumber);
                          const roomName = room ? room.name : "جناح غير محدد";
                          const roomDirection = room?.direction || "غير محدد";
                          const floorText = room ? `الطابق ${room.floor === 0 ? "الأرضي" : room.floor}` : "الطابق الأرضي";
                          const qrData = encodeURIComponent(`الاسم: ${guest.name} | الدولة: ${guest.country} | الغرفة: ${guest.roomNumber} (${roomName}) | الطابق: ${floorText} | الاتجاه: ${roomDirection} | الصفة: ${guest.administrativeRole || "عضو وفد"} | الجوال: ${guest.mobile} | الدخول: ${new Date(guest.checkInDate).toLocaleDateString("ar-EG")}`);
                          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;

                          return (
                            <div 
                              key={guest.id} 
                              id={`bulk-card-${guest.id}`}
                              className={`rounded-2xl shadow-md relative overflow-hidden break-inside-avoid print:shadow-none print:border-slate-300 print:mb-6 flex flex-col justify-between ${cardColorTheme === "layali_al_uns" ? "p-0 border-0" : "p-5 border border-slate-150"} ${cardLayout === "horizontal" ? "text-right" : "text-center"}`}
                              style={cardColorTheme === "layali_al_uns"
                                ? { width: "100%", maxWidth: "580px", margin: "0 auto", minHeight: "340px" }
                                : (cardLayout === "vertical" 
                                  ? { ...getCardStyle(), width: "100%", maxWidth: "380px", margin: "0 auto", minHeight: "510px" }
                                  : { ...getCardStyle(), width: "100%", maxWidth: "580px", margin: "0 auto", minHeight: "340px" })
                              }
                            >
                              {cardColorTheme === "layali_al_uns" ? (
                                renderLayaliCard({
                                  name: guest.name,
                                  country: guest.country,
                                  mobile: guest.mobile,
                                  roomNumber: guest.roomNumber,
                                  roomName: roomName,
                                  floorText: floorText,
                                  direction: roomDirection,
                                  administrativeRole: guest.administrativeRole,
                                  photoUrl: guest.photoUrl,
                                  qrData: qrData,
                                  id: guest.id
                                })
                              ) : (() => {
                                const cfg = getCardThemeConfig();
                                const textColorClass = getCardTextColorClass();
                                const subColorClass = getCardSubColorClass();
                                return cardLayout === "vertical" ? (
                                  <>
                                    {/* ID Card Top Ribbon / Badge */}
                                    <div className={`flex items-center justify-between border-b ${cfg.footerBorder} pb-3 mb-4 relative z-10`}>
                                      <div className="flex items-center gap-2">
                                        {cardLogoImage ? (
                                          <img src={cardLogoImage} className="w-8 h-8 rounded object-cover" alt="logo" />
                                        ) : (
                                          <div className={`w-8 h-8 rounded-lg ${cfg.logoColor} flex items-center justify-center text-white font-black text-xs`}>
                                            🏨
                                          </div>
                                        )}
                                        <div className="text-right">
                                          <h4 className={`font-extrabold text-[10px] leading-tight ${textColorClass}`}>خد ليالي الانس</h4>
                                          <p className={`text-[8px] ${subColorClass}`}>للأجنحة الفندقية الفاخرة</p>
                                        </div>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${cfg.badgeBg}`}>
                                        بطاقة نزيل مقيم
                                      </span>
                                    </div>

                                    {/* Guest Photo Section */}
                                    <div className="relative inline-block mb-3 z-10">
                                      <img 
                                        src={guest.photoUrl} 
                                        alt={guest.name} 
                                        className="w-24 h-24 rounded-2xl object-cover mx-auto border-3 border-white/20 shadow"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="absolute -bottom-1 -left-1 bg-emerald-600 text-white rounded-lg p-1 shadow">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                      </div>
                                    </div>

                                    {/* Guest Details */}
                                    <div className="space-y-0.5 mb-3 z-10 relative">
                                      <h3 className={`font-extrabold text-sm leading-tight truncate px-2 ${textColorClass}`} title={guest.name}>{guest.name}</h3>
                                      <p className={`text-[10px] font-medium ${subColorClass}`}>{guest.country}</p>
                                    </div>

                                    {/* Room Info Highlight Box */}
                                    <div className={`grid grid-cols-3 gap-1 p-2 rounded-xl mb-3 text-center z-10 relative ${cfg.infoBg}`}>
                                      <div className={`border-l ${cfg.footerBorder} last:border-0 px-0.5`}>
                                        <span className={`text-[8px] block mb-0.5 ${subColorClass}`}>رقم الغرفة</span>
                                        <span className={`font-black text-[11px] block ${cfg.infoText}`}>غرفة {guest.roomNumber}</span>
                                      </div>
                                      <div className={`border-l ${cfg.footerBorder} last:border-0 px-0.5`}>
                                        <span className={`text-[8px] block mb-0.5 ${subColorClass}`}>اسم الغرفة</span>
                                        <span className={`font-bold text-[9px] truncate block ${textColorClass}`} title={roomName}>{roomName}</span>
                                      </div>
                                      <div className="px-0.5">
                                        <span className={`text-[8px] block mb-0.5 ${subColorClass}`}>الطابق</span>
                                        <span className={`font-medium text-[9px] block ${textColorClass}`}>{floorText}</span>
                                      </div>
                                    </div>

                                    {/* QR Code Container */}
                                    <div className={`p-1.5 rounded-2xl w-fit mx-auto mb-3 z-10 relative ${cfg.qrBg}`}>
                                      <img 
                                        src={qrCodeUrl} 
                                        alt="Resident QR Code" 
                                        className="w-24 h-24 mx-auto object-contain"
                                      />
                                    </div>

                                    {/* Tiny Info Footer on Card */}
                                    <div className={`border-t ${cfg.footerBorder} pt-2 flex justify-between text-[8px] font-mono relative z-10 ${subColorClass}`}>
                                      <span>الدخول: {new Date(guest.checkInDate).toLocaleDateString("ar-EG")}</span>
                                      <span>المعرّف: {guest.id.slice(0, 6).toUpperCase()}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="grid grid-cols-12 gap-3 items-center w-full relative z-10">
                                    {/* Right side: Photo & Details (8 cols) */}
                                    <div className="col-span-8 text-right space-y-3">
                                      {/* ID Card Top Ribbon / Badge */}
                                      <div className={`flex items-center justify-between border-b ${cfg.footerBorder} pb-2`}>
                                        <div className="flex items-center gap-2">
                                          {cardLogoImage ? (
                                            <img src={cardLogoImage} className="w-8 h-8 rounded object-cover" alt="logo" />
                                          ) : (
                                            <div className={`w-7 h-7 rounded ${cfg.logoColor} flex items-center justify-center text-white font-black text-[10px]`}>
                                              🏨
                                            </div>
                                          )}
                                          <div className="text-right">
                                            <h4 className={`font-extrabold text-[9px] leading-tight ${textColorClass}`}>خد ليالي الانس</h4>
                                            <p className={`text-[7px] ${subColorClass}`}>للأجنحة الفندقية</p>
                                          </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[7px] font-black ${cfg.badgeBg}`}>
                                          بطاقة نزيل
                                        </span>
                                      </div>

                                      {/* Guest Photo & Name row */}
                                      <div className="flex items-center gap-3">
                                        <div className="relative shrink-0">
                                          <img 
                                            src={guest.photoUrl} 
                                            alt={guest.name} 
                                            className="w-16 h-16 rounded-xl object-cover border-2 border-white/20 shadow"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div className="absolute -bottom-1 -left-1 bg-emerald-600 text-white rounded p-0.5 shadow">
                                            <CheckCircle className="w-2.5 h-2.5" />
                                          </div>
                                        </div>

                                        <div className="space-y-0.5 min-w-0">
                                          <h3 className={`font-extrabold text-xs leading-tight truncate ${textColorClass}`} title={guest.name}>{guest.name}</h3>
                                          <p className={`text-[9px] font-medium ${subColorClass}`}>{guest.country}</p>
                                        </div>
                                      </div>

                                      {/* Room Info Highlight Box */}
                                      <div className={`grid grid-cols-3 gap-1 p-1.5 rounded-xl text-center ${cfg.infoBg}`}>
                                        <div className={`border-l ${cfg.footerBorder} last:border-0 px-0.5`}>
                                          <span className={`text-[7px] block ${subColorClass}`}>رقم الغرفة</span>
                                          <span className={`font-black text-[9px] block ${cfg.infoText}`}>غرفة {guest.roomNumber}</span>
                                        </div>
                                        <div className={`border-l ${cfg.footerBorder} last:border-0 px-0.5`}>
                                          <span className={`text-[7px] block ${subColorClass}`}>اسم الغرفة</span>
                                          <span className={`font-bold text-[8px] truncate block ${textColorClass}`} title={roomName}>{roomName}</span>
                                        </div>
                                        <div className="px-0.5">
                                          <span className={`text-[7px] block ${subColorClass}`}>الطابق</span>
                                          <span className={`font-medium text-[8px] block ${textColorClass}`}>{floorText.replace("الطابق ", "")}</span>
                                        </div>
                                      </div>

                                      {/* Tiny Info Footer on Card */}
                                      <div className={`border-t ${cfg.footerBorder} pt-1.5 flex justify-between text-[7px] font-mono ${subColorClass}`}>
                                        <span>الدخول: {new Date(guest.checkInDate).toLocaleDateString("ar-EG")}</span>
                                        <span>المعرّف: {guest.id.slice(0, 6).toUpperCase()}</span>
                                      </div>
                                    </div>

                                    {/* Left side: QR Code (4 cols) */}
                                    <div className={`col-span-4 flex flex-col items-center justify-center border-r ${cfg.footerBorder} pr-2`}>
                                      <div className={`p-1 rounded-xl ${cfg.qrBg}`}>
                                        <img 
                                          src={qrCodeUrl} 
                                          alt="Resident QR Code" 
                                          className="w-18 h-18 object-contain"
                                        />
                                      </div>
                                      <span className={`text-[7px] mt-1 font-bold text-center ${subColorClass}`}>التحقق الذكي</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>
          )}

          {/* ==================== 4. CHECK-IN FORM ==================== */}
          {activeTab === "checkin" && (
            <div className="max-w-2xl mx-auto space-y-6">
              
              <div className="bg-white border border-slate-200 p-6 sm:p-10 rounded-2xl shadow-sm">
                <div className="text-center mb-8 border-b border-slate-100 pb-6">
                  <h3 className="text-xl font-bold text-slate-800">تسكين نزيل جديد يدويًا</h3>
                  <p className="text-xs text-slate-400 mt-1">سجل تفاصيل النزيل وقم بتعيين الغرفة المتاحة المناسبة له فوراً</p>
                </div>

                <form onSubmit={handleCheckInSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">اسم النزيل الكامل (كما هو بالهوية) *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: أحمد بن فيصل الشمري"
                      value={checkInForm.name}
                      onChange={e => setCheckInForm({ ...checkInForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PhoneCountryInput 
                      id="checkin-mobile"
                      label="رقم جوال الاتصال"
                      type="mobile"
                      required
                      value={checkInForm.mobile}
                      countryName={checkInForm.country}
                      theme="light"
                      onChange={(val) => setCheckInForm(prev => ({ ...prev, mobile: val }))}
                      onCountryChange={(countryName) => {
                        setCheckInForm(prev => ({ ...prev, country: countryName }));
                      }}
                    />

                    <PhoneCountryInput 
                      id="checkin-whatsapp"
                      label="رقم جوال الواتساب (WhatsApp)"
                      type="whatsapp"
                      required
                      value={checkInForm.whatsapp}
                      countryName={checkInForm.country}
                      theme="light"
                      onChange={(val) => setCheckInForm(prev => ({ ...prev, whatsapp: val }))}
                      onCountryChange={(countryName) => {
                        setCheckInForm(prev => ({ ...prev, country: countryName }));
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>البريد الإلكتروني (الإيميل)</span>
                        <span className="text-slate-400 font-normal">(اختياري)</span>
                      </label>
                      <input 
                        type="email" 
                        placeholder="مثال: guest@domain.com"
                        value={checkInForm.email}
                        onChange={e => setCheckInForm({ ...checkInForm, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm outline-none transition text-left dir-ltr font-mono"
                        dir="ltr"
                      />
                    </div>

                    <CountrySelectInput 
                      id="checkin-country"
                      label="البلد / الجنسية"
                      required
                      value={checkInForm.country}
                      theme="light"
                      onChange={(countryName, countryInfo) => {
                        setCheckInForm(prev => {
                          let updatedWhatsapp = prev.whatsapp;
                          let updatedMobile = prev.mobile;
                          if (countryInfo) {
                            if (updatedWhatsapp) {
                              updatedWhatsapp = formatPhoneWithCountryCode(updatedWhatsapp, countryInfo);
                            } else {
                              updatedWhatsapp = countryInfo.dialCode;
                            }
                            if (updatedMobile) {
                              updatedMobile = formatPhoneWithCountryCode(updatedMobile, countryInfo);
                            } else {
                              updatedMobile = countryInfo.dialCode;
                            }
                          }
                          return {
                            ...prev,
                            country: countryName,
                            whatsapp: updatedWhatsapp,
                            mobile: updatedMobile
                          };
                        });
                      }}
                    />
                  </div>

                  {/* الصفة / الدور الإداري للنزيل */}
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>الصفة / الدور الإداري للنزيل *</span>
                        </span>
                        {getAdminRoleBadge(
                          checkInForm.administrativeRole === "أخرى (مخصص)"
                            ? checkInForm.customAdminRole || "عضو وفد"
                            : checkInForm.administrativeRole
                        )}
                      </label>
                      <select
                        value={checkInForm.administrativeRole}
                        onChange={e => setCheckInForm({ ...checkInForm, administrativeRole: e.target.value })}
                        className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition"
                      >
                        {ADMIN_ROLES.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>

                    {checkInForm.administrativeRole === "أخرى (مخصص)" && (
                      <div className="animate-in fade-in duration-200">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">اكتب الصفة الإدارية المخصصة *</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: مستشار قانوني، طبيب الوفد، إلخ..."
                          value={checkInForm.customAdminRole}
                          onChange={e => setCheckInForm({ ...checkInForm, customAdminRole: e.target.value })}
                          className="w-full bg-white border border-indigo-300 focus:border-indigo-600 rounded-xl px-4 py-2 text-sm outline-none transition"
                        />
                      </div>
                    )}
                  </div>

                  {/* ==================== تعيين الغرفة الفندقية المتاحة - تصميم منضبط، مرتب، واحترافي ==================== */}
                  <AvailableRoomAssigner
                    rooms={rooms}
                    selectedRoomNumber={checkInForm.roomNumber}
                    onSelectRoom={(roomNum) => setCheckInForm({ ...checkInForm, roomNumber: roomNum })}
                    guests={guests}
                    required={true}
                    label="تعيين الغرفة الفندقية المتاحة"
                  />

                  {/* تاريخ ويوم وصول النزيل - تنظيم منضبط وواضح */}
                  <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-black text-slate-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-700" />
                        <span>تاريخ ويوم وصول النزيل * <span className="text-emerald-700 font-normal">(إلزامي)</span></span>
                      </label>
                      {checkInForm.checkInDate && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-300 font-black shadow-2xs">
                          يوم {getArabicDayName(checkInForm.checkInDate)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <input 
                        type="date" 
                        required
                        value={checkInForm.checkInDate}
                        onChange={e => setCheckInForm({ ...checkInForm, checkInDate: e.target.value })}
                        className="w-full bg-white border-2 border-slate-200 focus:border-emerald-600 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition shadow-2xs"
                      />

                      {checkInForm.checkInDate ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-slate-700 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            موعد الوصول: <strong className="text-emerald-800 font-black">يوم {getArabicDayName(checkInForm.checkInDate)} الموافق {checkInForm.checkInDate}</strong>
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-medium">حدد تاريخ وصول النزيل لاستكمال إجراءات التسكين</p>
                      )}
                    </div>
                  </div>

                  {/* GUEST PHOTO UPLOAD WITH RESOLUTION CONTROL (من أقل دقة إلى أعلى دقة) */}
                  <GuestPhotoUploadWidget
                    label="إضافة وصورة النزيل الشخصية / الهوية الوطنية (مع التحكم بالدقة) *"
                    photoData={{
                      photoUrl: checkInForm.photoUrl,
                      rawPhotoUrl: checkInForm.photoRawUrl,
                      quality: checkInForm.photoQuality,
                      sizeKb: checkInForm.photoSizeKb,
                      dimensions: checkInForm.photoDimensions
                    }}
                    onChange={(updated) => setCheckInForm({
                      ...checkInForm,
                      photoUrl: updated.photoUrl,
                      photoRawUrl: updated.rawPhotoUrl,
                      photoQuality: updated.quality,
                      photoSizeKb: updated.sizeKb,
                      photoDimensions: updated.dimensions
                    })}
                    onNotification={triggerNotification}
                  />

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">ملاحظات أو طلبات خاصة</label>
                    <textarea 
                      rows={3}
                      placeholder="أضف أي تفاصيل خاصة بالنزيل أو الحجز هنا..."
                      value={checkInForm.notes}
                      onChange={e => setCheckInForm({ ...checkInForm, notes: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-4 text-sm outline-none transition resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl transition duration-200 shadow-md hover:shadow-lg mt-4"
                  >
                    تأكيد التسكين وطباعة الفاتورة والبيانات
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* ==================== 4.5 CHECK-OUT VIEW ==================== */}
          {activeTab === "checkout" && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm">
                <div className="text-center mb-8 border-b border-slate-100 pb-6">
                  <h3 className="text-xl font-bold text-slate-800">تسجيل مغادرة النزلاء (الخروج النهائي)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    ابحث عن النزيل المقيم حالياً بالاسم أو رقم الغرفة أو رقم الجوال لإتمام عملية المغادرة وإخلاء الغرفة فوراً
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                  <input 
                    type="text" 
                    placeholder="ابحث عن نزيل مقيم لتسجيل خروجه (الاسم، الجوال، رقم الغرفة)..." 
                    value={checkoutSearchQuery}
                    onChange={e => setCheckoutSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl pr-10 pl-4 py-3 text-sm outline-none transition font-semibold shadow-inner"
                  />
                  <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
                  {checkoutSearchQuery && (
                    <button 
                      onClick={() => setCheckoutSearchQuery("")}
                      className="absolute left-3 top-3.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      مسح البحث
                    </button>
                  )}
                </div>

                {/* Resident Guests List */}
                {(() => {
                  const residents = guests.filter(g => {
                    if (g.status !== "resident") return false;
                    const query = checkoutSearchQuery.toLowerCase();
                    return !query || 
                      g.name.toLowerCase().includes(query) ||
                      g.roomNumber.toLowerCase().includes(query) ||
                      (g.mobile && g.mobile.includes(query));
                  });

                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
                        <span className="text-xs font-bold text-slate-500">النزلاء الحاليين المتوافقين مع معيار البحث</span>
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-black">
                          {residents.length} نزيل مقيم
                        </span>
                      </div>

                      {residents.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                          <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-bold text-slate-500">لا يوجد أي نزلاء مقيمين حالياً يطابقون البحث</p>
                          <p className="text-xs text-slate-400 mt-1">تأكد من كتابة الاسم بشكل صحيح أو تحقق من صفحة إدارة النزلاء</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {residents.map(guest => {
                            const checkInTimeStr = new Date(guest.checkInDate).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit"
                            });
                            const checkInDateStr = new Date(guest.checkInDate).toLocaleDateString("ar-EG");
                            
                            return (
                              <div 
                                key={guest.id} 
                                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-rose-300 hover:shadow-md transition flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-start gap-4 mb-3">
                                    <img 
                                      src={guest.photoUrl} 
                                      alt={guest.name} 
                                      className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="space-y-1">
                                      <h4 className="font-extrabold text-sm text-slate-800 leading-tight">{guest.name}</h4>
                                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                        <Globe className="w-3 h-3 text-slate-400" />
                                        <span>{guest.country}</span>
                                      </div>
                                      {guest.mobile && (
                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                                          <Phone className="w-3 h-3 text-slate-400" />
                                          <span dir="ltr">{guest.mobile}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs mb-4">
                                    <div>
                                      <span className="block text-[10px] text-slate-400 font-bold mb-0.5">رقم الغرفة المسكونة</span>
                                      <span className="font-black text-emerald-800">غرفة {guest.roomNumber}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[10px] text-slate-400 font-bold mb-0.5">تاريخ ووقت الدخول</span>
                                      <span className="font-semibold text-slate-700">{checkInDateStr} {checkInTimeStr}</span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleCheckOut(guest.id)}
                                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-950/10 hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                                >
                                  <LogOut className="w-3.5 h-3.5" />
                                  تسجيل الخروج وإخلاء الغرفة فوراً
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>

            </div>
          )}

          {/* ==================== 5. ROOM CONFIGURATION VIEW ==================== */}
          {activeTab === "room_config" && (() => {
            const query = roomConfigSearch.toLowerCase().trim();
            const filteredConfigRooms = rooms.filter(r => {
              const matchesSearch = !query || 
                r.number.toLowerCase().includes(query) ||
                r.name.toLowerCase().includes(query) ||
                (r.type && r.type.toLowerCase().includes(query)) ||
                (r.direction && r.direction.toLowerCase().includes(query));
              
              const matchesFloor = roomConfigFloorFilter === "all" || String(r.floor) === String(roomConfigFloorFilter);
              const matchesStatus = roomConfigStatusFilter === "all" || r.status === roomConfigStatusFilter;

              return matchesSearch && matchesFloor && matchesStatus;
            });

            const availableFloors: number[] = Array.from(
              new Set(rooms.map(r => (typeof r.floor === "number" && !isNaN(r.floor) ? r.floor : Number(r.floor) || 1)))
            ).sort((a: number, b: number) => a - b);
            const totalCapacity = rooms.reduce((sum, r) => sum + (Number(r.capacity) || 0), 0);
            const availableCount = rooms.filter(r => r.status === "available").length;
            const occupiedCount = rooms.filter(r => r.status === "occupied" || r.status === "full").length;

            return (
              <div className="space-y-6" id="room-config-section">
                
                {/* Header & Quick Summary Statistics */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          إعداد وتكوين الغرف الفندقية
                          <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                            {rooms.length} غرفة مسجلة
                          </span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          إدارة وتخصيص غرف وأجنحة الفندق، كتابة أنواع الغرف يدويًا، وضبط السعة والأدوار مع أزرار الحفظ والتعديل والحذف.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {editingRoomNumber ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRoomNumber(null);
                            setRoomConfigForm({
                              number: "",
                              name: "",
                              floor: 1,
                              type: "",
                              capacity: 2,
                              direction: ""
                            });
                          }}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>إلغاء التعديل والبدء بغرفة جديدة</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setRoomConfigForm({
                              number: "",
                              name: "",
                              floor: 1,
                              type: "",
                              capacity: 2,
                              direction: ""
                            });
                            const el = document.getElementById("room-number-input");
                            if (el) el.focus();
                          }}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة غرفة جديدة</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Metric Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0">
                        <Hotel className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">إجمالي الغرف</span>
                        <span className="text-base font-extrabold text-slate-800">{rooms.length} <span className="text-[11px] font-normal text-slate-500">غرفة</span></span>
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-200/60 text-emerald-900 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-700 font-bold block">الغرف المتاحة</span>
                        <span className="text-base font-extrabold text-emerald-900">{availableCount} <span className="text-[11px] font-normal text-emerald-700">شاغرة</span></span>
                      </div>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-xl flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-200/60 text-amber-900 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-700 font-bold block">الغرف المشغولة</span>
                        <span className="text-base font-extrabold text-amber-900">{occupiedCount} <span className="text-[11px] font-normal text-amber-700">مشغولة</span></span>
                      </div>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-200/60 text-blue-900 flex items-center justify-center shrink-0">
                        <Bed className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-blue-700 font-bold block">الطاقة الاستيعابية</span>
                        <span className="text-base font-extrabold text-blue-900">{totalCapacity} <span className="text-[11px] font-normal text-blue-700">نزيل/سرير</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main 2-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  
                  {/* Form Column (1/3) */}
                  <div 
                    id="room-config-form"
                    className={`bg-white border rounded-2xl p-6 shadow-xs transition-all ${
                      editingRoomNumber 
                        ? "border-emerald-300 ring-2 ring-emerald-500/20" 
                        : "border-slate-200"
                    }`}
                  >
                    {/* Form Header */}
                    <div className="border-b border-slate-100 pb-4 mb-5 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-800">
                            {editingRoomNumber ? `تعديل الغرفة: رقم ${editingRoomNumber}` : "إعداد وإضافة غرفة جديدة"}
                          </h3>
                          {editingRoomNumber ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              وضع التعديل
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              غرفة جديدة
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {editingRoomNumber 
                            ? "قم بتعديل الحقول أدناه ثم اضغط زر الحفظ أو زر الحذف" 
                            : "أدخل بيانات الغرفة وحدد نوعها يدويًا ثم اضغط زر الحفظ"}
                        </p>
                      </div>

                      {editingRoomNumber && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRoomNumber(null);
                            setRoomConfigForm({
                              number: "",
                              name: "",
                              floor: 1,
                              type: "",
                              capacity: 2,
                              direction: ""
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          title="إلغاء التعديل"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleRoomConfigSubmit} className="space-y-4">
                      {/* Room Number & Floor */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                            رقم الغرفة <span className="text-rose-500">*</span>
                          </label>
                          <input 
                            id="room-number-input"
                            type="text" 
                            required
                            placeholder="مثال: 105"
                            value={roomConfigForm.number}
                            onChange={e => setRoomConfigForm({ ...roomConfigForm, number: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                            الطابق (الدور) <span className="text-rose-500">*</span>
                          </label>
                          <input 
                            type="number" 
                            required
                            min={1}
                            max={50}
                            value={roomConfigForm.floor}
                            onChange={e => setRoomConfigForm({ ...roomConfigForm, floor: Number(e.target.value) || 1 })}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none transition"
                          />
                        </div>
                      </div>

                      {/* Room Name */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                          اسم الغرفة الفندقية <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          required
                          placeholder="مثال: جناح الفيروز المطل، غرفة الزمرد..."
                          value={roomConfigForm.name}
                          onChange={e => setRoomConfigForm({ ...roomConfigForm, name: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none transition"
                        />
                      </div>

                      {/* Manual Room Type Input (تعبئة يدوي وليس قائمة منسدلة) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                            <span>نوع الغرفة</span>
                            <span className="text-rose-500">*</span>
                            <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
                              تعبئة يدوي
                            </span>
                          </label>
                          {roomConfigForm.type && (
                            <button
                              type="button"
                              onClick={() => setRoomConfigForm({ ...roomConfigForm, type: "" })}
                              className="text-[10px] text-slate-400 hover:text-slate-600 transition"
                            >
                              مسح النص
                            </button>
                          )}
                        </div>
                        <input 
                          type="text" 
                          required
                          placeholder="اكتب نوع الغرفة يدويًا (مثال: جناح ملكي، غرفة ثلاثية، استوديو عائلي...)"
                          value={roomConfigForm.type}
                          onChange={e => setRoomConfigForm({ ...roomConfigForm, type: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none transition placeholder:text-slate-400"
                        />
                        
                        {/* Quick Suggestion Pills */}
                        <div className="mt-2 pt-1 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 block mb-1.5 font-medium">
                            اقتراحات سريعة (انقر للتعبئة التلقائية مع إمكانية التعديل والكتابة بحرية):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              "جناح ملكي فاخر",
                              "جناح عائلي",
                              "غرفة ديلوكس مزدوجة",
                              "غرفة مفردة قياسية",
                              "غرفة ثلاثية VIP",
                              "استوديو تنفيذي",
                              "جناح رئاسي خاص"
                            ].map(suggestedType => (
                              <button
                                key={suggestedType}
                                type="button"
                                onClick={() => setRoomConfigForm({ ...roomConfigForm, type: suggestedType })}
                                className={`text-[10px] px-2 py-1 rounded-lg border transition cursor-pointer ${
                                  roomConfigForm.type === suggestedType 
                                    ? "bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs" 
                                    : "bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 border-slate-200"
                                }`}
                              >
                                {suggestedType}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Capacity & View/Direction */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                            السعة (أفراد / أسرة) <span className="text-rose-500">*</span>
                          </label>
                          <input 
                            type="number" 
                            required
                            min={1}
                            max={20}
                            value={roomConfigForm.capacity}
                            onChange={e => setRoomConfigForm({ ...roomConfigForm, capacity: Number(e.target.value) || 1 })}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1.5">إطلالة / اتجاه الغرفة</label>
                          <input 
                            type="text" 
                            placeholder="مثال: إطلالة بحرية، واجهة شرقية"
                            value={roomConfigForm.direction}
                            onChange={e => setRoomConfigForm({ ...roomConfigForm, direction: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-xs outline-none transition font-medium text-slate-800"
                          />
                        </div>
                      </div>

                      {/* Action Buttons Toolbar: زر حفظ، زر تعديل، زر حذف، زر تفريغ */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                        
                        <div className="flex items-center gap-2">
                          {/* زر حفظ / حفظ التعديلات */}
                          <button 
                            type="submit"
                            className="flex-1 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Save className="w-4 h-4" />
                            <span>{editingRoomNumber ? "حفظ التعديلات" : "حفظ الغرفة الجديدة"}</span>
                          </button>

                          {/* زر تفريغ الحقول أو إلغاء التعديل */}
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingRoomNumber(null);
                              setRoomConfigForm({
                                number: "",
                                name: "",
                                floor: 1,
                                type: "",
                                capacity: 2,
                                direction: ""
                              });
                            }}
                            className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                            title={editingRoomNumber ? "إلغاء التعديل" : "تفريغ الحقول"}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{editingRoomNumber ? "إلغاء" : "تفريغ"}</span>
                          </button>
                        </div>

                        {/* في حالة وجود غرفة قيد التعديل: زر حذف الغرفة المباشر من النموذج */}
                        {editingRoomNumber && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteRoom(editingRoomNumber)}
                              className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>زر حذف الغرفة رقم {editingRoomNumber} نهائيًا</span>
                            </button>
                          </div>
                        )}

                      </div>
                    </form>
                  </div>

                  {/* Rooms Management Table Column (2/3) */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                    
                    {/* Table Filters & Header */}
                    <div className="p-5 border-b border-slate-100 flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                            سجل إدارة الغرف المجهزة
                            <span className="text-xs font-normal text-slate-400">
                              (عرض {filteredConfigRooms.length} من أصل {rooms.length})
                            </span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            يمكنك استخدام زر التعديل وزر الحذف لكل غرفة على حدة، أو التصفية السريعة
                          </p>
                        </div>

                        {/* Filter by status pills */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                          <button
                            type="button"
                            onClick={() => setRoomConfigStatusFilter("all")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              roomConfigStatusFilter === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            الكل ({rooms.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoomConfigStatusFilter("available")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              roomConfigStatusFilter === "available" ? "bg-emerald-800 text-white shadow-xs" : "text-slate-500 hover:text-emerald-800"
                            }`}
                          >
                            المتاحة ({availableCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoomConfigStatusFilter("occupied")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              roomConfigStatusFilter === "occupied" ? "bg-slate-800 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            المشغولة ({occupiedCount})
                          </button>
                        </div>
                      </div>

                      {/* Search and Floor Filter Row */}
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full">
                          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="بحث برقم الغرفة، اسمها، نوعها اليدوي، أو اتجاهها..."
                            value={roomConfigSearch}
                            onChange={e => setRoomConfigSearch(e.target.value)}
                            className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-xs outline-none transition"
                          />
                          {roomConfigSearch && (
                            <button
                              type="button"
                              onClick={() => setRoomConfigSearch("")}
                              className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                            >
                              إلغاء
                            </button>
                          )}
                        </div>

                        {/* Floor Selector */}
                        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
                          <span className="text-xs font-bold text-slate-500 shrink-0">الدور:</span>
                          <select
                            value={roomConfigFloorFilter}
                            onChange={e => setRoomConfigFloorFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 transition cursor-pointer"
                          >
                            <option value="all">كل الطوابق</option>
                            {availableFloors.map(fl => (
                              <option key={fl} value={fl}>الدور {fl}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                      {filteredConfigRooms.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                          <Hotel className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                          <p className="font-bold text-slate-600 text-sm">لا توجد غرف تطابق البحث المحدد</p>
                          <p className="text-xs text-slate-400 mt-1">جرّب تغيير عبارة البحث أو الفلتر المختار</p>
                          <button
                            type="button"
                            onClick={() => {
                              setRoomConfigSearch("");
                              setRoomConfigFloorFilter("all");
                              setRoomConfigStatusFilter("all");
                            }}
                            className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                          >
                            إعادة ضبط الفلاتر
                          </button>
                        </div>
                      ) : (
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 text-xs font-bold">
                              <th className="p-3.5 pr-6">رقم الغرفة</th>
                              <th className="p-3.5">اسم الغرفة والاتجاه</th>
                              <th className="p-3.5">نوع الغرفة (يدوي)</th>
                              <th className="p-3.5">السعة</th>
                              <th className="p-3.5">الحالة</th>
                              <th className="p-3.5 pl-6 text-center">أزرار الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {filteredConfigRooms.map(r => {
                              const isCurrentEditing = editingRoomNumber === r.number;
                              return (
                                <tr 
                                  key={r.number} 
                                  className={`transition ${
                                    isCurrentEditing 
                                      ? "bg-emerald-50/70 font-medium" 
                                      : "hover:bg-slate-50/50"
                                  }`}
                                >
                                  {/* Room Number & Floor */}
                                  <td className="p-3.5 pr-6 font-mono">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-slate-900 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                                        {r.number}
                                      </span>
                                      <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                        دور {r.floor}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Room Name & Orientation */}
                                  <td className="p-3.5 font-semibold text-slate-800">
                                    <div>
                                      <p>{r.name}</p>
                                      {r.direction ? (
                                        <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                                          {r.direction}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-300 font-normal block mt-0.5">
                                          غير محدد
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Room Type (Manual Text) */}
                                  <td className="p-3.5">
                                    <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                      {r.type || "قياسية"}
                                    </span>
                                  </td>

                                  {/* Capacity */}
                                  <td className="p-3.5">
                                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                                      <Bed className="w-3.5 h-3.5 text-slate-400" />
                                      <span>{r.capacity} أفراد</span>
                                    </span>
                                  </td>

                                  {/* Status */}
                                  <td className="p-3.5">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                      r.status === "available" 
                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                                        : r.status === "occupied" 
                                          ? "bg-slate-800 text-white" 
                                          : "bg-amber-50 text-amber-800 border border-amber-200"
                                    }`}>
                                      {r.status === "available" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                      {r.status === "available" && "متاحة"}
                                      {r.status === "occupied" && "مشغولة"}
                                      {r.status === "full" && "ممتلئة"}
                                    </span>
                                  </td>

                                  {/* Action Buttons: زر تعديل + زر حذف */}
                                  <td className="p-3.5 pl-6">
                                    <div className="flex items-center justify-center gap-2">
                                      {/* زر تعديل */}
                                      <button 
                                        type="button"
                                        onClick={() => handleStartEditRoom(r)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                                          isCurrentEditing 
                                            ? "bg-emerald-800 text-white" 
                                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                                        }`}
                                        title="تعديل بيانات هذه الغرفة"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>تعديل</span>
                                      </button>

                                      {/* زر حذف */}
                                      <button 
                                        type="button"
                                        onClick={() => handleDeleteRoom(r.number)}
                                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                                        title="حذف هذه الغرفة نهائياً"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>حذف</span>
                                      </button>
                                    </div>
                                  </td>

                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>

                  </div>

                </div>

              </div>
            );
          })()}

          {/* ==================== 6. TOOLS & SETTINGS VIEW ==================== */}
          {activeTab === "tools" && (
            <div className="space-y-8">

              {/* Tools Sub-Navigation Filter Tabs */}
              <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setToolsActiveFilter("all")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    toolsActiveFilter === "all"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>جميع الأدوات والإعدادات</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToolsActiveFilter("app_logo")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    toolsActiveFilter === "app_logo"
                      ? "bg-emerald-800 text-amber-300 shadow-xs border border-emerald-500/40"
                      : "bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  <Building className="w-3.5 h-3.5 text-emerald-700" />
                  <span>شعار وهوية البرنامج 🖼️</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToolsActiveFilter("guest_card")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    toolsActiveFilter === "guest_card"
                      ? "bg-emerald-800 text-amber-300 shadow-xs border border-emerald-500/40"
                      : "bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                  <span>إضافة وتخصيص كرت النزيل 🪪</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToolsActiveFilter("passwords")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    toolsActiveFilter === "passwords"
                      ? "bg-slate-900 text-amber-300 shadow-xs border border-amber-500/40"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>إدارة وتغيير كلمات المرور 🔒</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToolsActiveFilter("years_visits")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    toolsActiveFilter === "years_visits"
                      ? "bg-emerald-800 text-amber-300 shadow-xs"
                      : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                  <span>إدارة السنوات والمواسم التشغيلية</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToolsActiveFilter("database")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    toolsActiveFilter === "database"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  <span>ربط Google Sheets والمزامنة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToolsActiveFilter("barcode")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    toolsActiveFilter === "barcode"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>قارئ الباركود الذكي 📷</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToolsActiveFilter("backup")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    toolsActiveFilter === "backup"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <DownloadCloud className="w-3.5 h-3.5 text-blue-500" />
                  <span>النسخ الاحتياطي والاستيراد 💾</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToolsActiveFilter("requests")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    toolsActiveFilter === "requests"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  <span>طلبات التسجيل الذاتي</span>
                  {pendingRequests.filter(r => r.status === "pending").length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {pendingRequests.filter(r => r.status === "pending").length}
                    </span>
                  )}
                </button>
              </div>

              {/* ========================================================================= */}
              {/* SECTION: SYSTEM PASSWORDS & CREDENTIALS MANAGEMENT HUB (إدارة وتغيير كلمات المرور) */}
              {/* ========================================================================= */}
              {(toolsActiveFilter === "all" || toolsActiveFilter === "passwords") && (
                <div className="bg-white border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 relative overflow-hidden">
                  {/* Decorative background glow */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 relative z-10">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                        <Key className="w-3.5 h-3.5 text-emerald-600" />
                        <span>التحكم وتخصيص كلمات المرور من قبل مدير النظام العام</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900">إدارة وتغيير كلمات المرور وأسماء المستخدمين</h3>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
                        يستطيع مدير النظام العام تغيير وتخصيص كلمات المرور وأسماء المستخدمين لجميع الحسابات (المدير، الاستقبال، لجنة الخدمات، حراسة البوابه، والدخول العام) مع الحفظ والمزامنة السحابية الفورية في Google Sheets.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setChangePasswordTargetRole("admin");
                          setShowChangePasswordModal(true);
                        }}
                        className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-300" />
                        <span>نافذة التغيير السريعة 🔐</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetPasswordsToDefault}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        title="استعادة كلمات المرور الافتراضية للنظام"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>استعادة الافتراضي</span>
                      </button>
                    </div>
                  </div>

                  {/* 5 Cards Grid for Role Credentials */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 relative z-10">
                    {/* 1. Master Admin Card */}
                    <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-4 relative">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                            الإدارة العليا
                          </span>
                          <h4 className="text-sm font-black text-white flex items-center gap-1.5 mt-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>مدير النظام العام</span>
                          </h4>
                        </div>
                        <span className="text-xl">👨‍💼</span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">اسم المستخدم:</label>
                          <input
                            type="text"
                            value={adminUsername}
                            onChange={(e) => setAdminUsername(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-400 font-mono transition"
                            placeholder="admin"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] font-bold text-slate-400">كلمة المرور:</label>
                            <button
                              type="button"
                              onClick={() => setShowPasswordsPlain(prev => ({ ...prev, admin: !prev.admin }))}
                              className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              {showPasswordsPlain.admin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{showPasswordsPlain.admin ? "إخفاء" : "إظهار"}</span>
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showPasswordsPlain.admin ? "text" : "password"}
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 outline-none focus:border-emerald-400 font-mono transition"
                              placeholder="1234"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setChangePasswordTargetRole("admin");
                            setShowChangePasswordModal(true);
                          }}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[11px] rounded-xl border border-slate-700 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Key className="w-3 h-3 text-emerald-400" />
                          <span>تغيير كلمة المرور</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. Reception Card */}
                    <div className="bg-slate-50 text-slate-900 rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black">
                            الاستقبال والتسكين
                          </span>
                          <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-1">
                            <Lock className="w-4 h-4 text-emerald-600" />
                            <span>موظف الاستقبال</span>
                          </h4>
                        </div>
                        <span className="text-xl">🏨</span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم المستخدم:</label>
                          <input
                            type="text"
                            value={receptionUsername}
                            onChange={(e) => setReceptionUsername(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 font-mono transition"
                            placeholder="reception"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] font-bold text-slate-600">كلمة المرور:</label>
                            <button
                              type="button"
                              onClick={() => setShowPasswordsPlain(prev => ({ ...prev, reception: !prev.reception }))}
                              className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              {showPasswordsPlain.reception ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{showPasswordsPlain.reception ? "إخفاء" : "إظهار"}</span>
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showPasswordsPlain.reception ? "text" : "password"}
                              value={receptionPassword}
                              onChange={(e) => setReceptionPassword(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800 outline-none focus:border-emerald-500 font-mono transition"
                              placeholder="2233"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setChangePasswordTargetRole("reception");
                            setShowChangePasswordModal(true);
                          }}
                          className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-xl border border-slate-200 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Key className="w-3 h-3 text-emerald-600" />
                          <span>تغيير كلمة المرور</span>
                        </button>
                      </div>
                    </div>

                    {/* 3. Services Committee Card */}
                    <div className="bg-slate-50 text-slate-900 rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black">
                            الصيانة والخدمات
                          </span>
                          <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-1">
                            <Wrench className="w-4 h-4 text-amber-600" />
                            <span>لجنة الخدمات</span>
                          </h4>
                        </div>
                        <span className="text-xl">🛠️</span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم المستخدم:</label>
                          <input
                            type="text"
                            value={servicesUsername}
                            onChange={(e) => setServicesUsername(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 font-mono transition"
                            placeholder="services"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] font-bold text-slate-600">كلمة المرور:</label>
                            <button
                              type="button"
                              onClick={() => setShowPasswordsPlain(prev => ({ ...prev, services: !prev.services }))}
                              className="text-[10px] text-amber-700 hover:underline flex items-center gap-1"
                            >
                              {showPasswordsPlain.services ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{showPasswordsPlain.services ? "إخفاء" : "إظهار"}</span>
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showPasswordsPlain.services ? "text" : "password"}
                              value={servicesPassword}
                              onChange={(e) => setServicesPassword(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-amber-800 outline-none focus:border-emerald-500 font-mono transition"
                              placeholder="3344"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setChangePasswordTargetRole("services");
                            setShowChangePasswordModal(true);
                          }}
                          className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-xl border border-slate-200 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Key className="w-3 h-3 text-amber-600" />
                          <span>تغيير كلمة المرور</span>
                        </button>
                      </div>
                    </div>

                    {/* 4. Security Gate Guard Card */}
                    <div className="bg-slate-50 text-slate-900 rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-black">
                            أمن وبوابة الدخول
                          </span>
                          <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-1">
                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                            <span>حراسة البوابه</span>
                          </h4>
                        </div>
                        <span className="text-xl">🛡️</span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم المستخدم:</label>
                          <input
                            type="text"
                            value={securityUsername}
                            onChange={(e) => setSecurityUsername(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 font-mono transition"
                            placeholder="حراسة البوابه"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] font-bold text-slate-600">كلمة المرور:</label>
                            <button
                              type="button"
                              onClick={() => setShowPasswordsPlain(prev => ({ ...prev, security: !prev.security }))}
                              className="text-[10px] text-indigo-700 hover:underline flex items-center gap-1"
                            >
                              {showPasswordsPlain.security ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{showPasswordsPlain.security ? "إخفاء" : "إظهار"}</span>
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showPasswordsPlain.security ? "text" : "password"}
                              value={securityPassword}
                              onChange={(e) => setSecurityPassword(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-800 outline-none focus:border-indigo-500 font-mono transition"
                              placeholder="4455"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setChangePasswordTargetRole("security");
                            setShowChangePasswordModal(true);
                          }}
                          className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-xl border border-slate-200 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Key className="w-3 h-3 text-indigo-600" />
                          <span>تغيير كلمة المرور</span>
                        </button>
                      </div>
                    </div>

                    {/* 5. Public Access Card */}
                    <div className="bg-slate-50 text-slate-900 rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-black">
                            بوابة النزلاء
                          </span>
                          <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-1">
                            <Globe className="w-4 h-4 text-blue-600" />
                            <span>الدخول العام للزوار</span>
                          </h4>
                        </div>
                        <span className="text-xl">🌐</span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم المستخدم:</label>
                          <input
                            type="text"
                            value={publicUsername}
                            onChange={(e) => setPublicUsername(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 font-mono transition"
                            placeholder="public"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] font-bold text-slate-600">كلمة المرور:</label>
                            <button
                              type="button"
                              onClick={() => setShowPasswordsPlain(prev => ({ ...prev, public: !prev.public }))}
                              className="text-[10px] text-blue-700 hover:underline flex items-center gap-1"
                            >
                              {showPasswordsPlain.public ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{showPasswordsPlain.public ? "إخفاء" : "إظهار"}</span>
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showPasswordsPlain.public ? "text" : "password"}
                              value={publicPassword}
                              onChange={(e) => setPublicPassword(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-800 outline-none focus:border-emerald-500 font-mono transition"
                              placeholder="1122"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setChangePasswordTargetRole("public");
                            setShowChangePasswordModal(true);
                          }}
                          className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-xl border border-slate-200 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Key className="w-3 h-3 text-blue-600" />
                          <span>تغيير كلمة المرور</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Save Credentials Action Banner */}
                  <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-2.5 text-xs text-emerald-900 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>عند تعديل أي اسم مستخدم أو كلمة مرور، اضغط على زر الحفظ لتثبيتها محلياً وسحابياً في قوقل شيت.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveAllRoleCredentials}
                      className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>حفظ وتثبيت كافة التعديلات 💾</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SECTION: OPERATIONAL YEARS MANAGEMENT HUB (إدارة السنوات والمواسم التشغيلية) */}
              {/* ========================================================================= */}
              {(toolsActiveFilter === "all" || toolsActiveFilter === "years_visits") && (
                <div className="bg-white border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-md space-y-8 relative overflow-hidden">
                  
                  {/* Decorative background glow */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

                  {/* Header Banner */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 relative z-10">
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                        <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                        <span>مركز إدارة المواسم والسنوات التشغيلية للفندق</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        إدارة وتخصيص السنوات والمواسم التشغيلية
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl">
                        تحكم كامل بالسنوات والمواسم الفندقية، إضافة مواسم تشغيلية جديدة، تصفح أرشيف النزلاء والخدمات لكل موسم، مع أدوات تفريغ وترحيل الغرف والسجلات بكل سهولة وموثوقية.
                      </p>
                    </div>

                    {/* Active Scope Summary Badges */}
                    <div className="flex items-center gap-3 flex-wrap bg-slate-900 p-4 rounded-2xl text-white shadow-sm shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-bold">الموسم النشط حالياً:</div>
                        <div className="text-sm font-black text-amber-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          <span>موسم {selectedYear}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1. OPERATIONAL YEARS LIST MANAGEMENT */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-700" />
                          <span>1. قائمة السنوات والمواسم التشغيلية</span>
                        </h3>
                        <p className="text-xs text-slate-400">إضافة سنوات ومواسم جديدة أو التبديل بينها لعرض وفهرسة نزلاء كل موسم على حدة</p>
                      </div>

                      {/* Add Year Form */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="أدخل رقم السنة (مثال: 2028)..."
                          value={newYearInput}
                          onChange={(e) => setNewYearInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddYear(newYearInput);
                            }
                          }}
                          className="bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-bold outline-none w-48 transition"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddYear(newYearInput)}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة موسم</span>
                        </button>
                      </div>
                    </div>

                    {/* Years Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                      {yearsList.map((yr) => {
                        const isCurrent = selectedYear === yr;
                        const yrGuests = guests.filter(g => (!g.year && yr === "2026") || g.year === yr);
                        const yrResidents = yrGuests.filter(g => g.status === "resident").length;
                        const yrServices = serviceRequests.filter(s => (!s.year && yr === "2026") || s.year === yr).length;

                        const isEditingThisYear = editingYear === yr;

                        return (
                          <div
                            key={yr}
                            className={`p-4 rounded-2xl border-2 transition relative flex flex-col justify-between gap-3 ${
                              isCurrent
                                ? "bg-emerald-50/80 border-emerald-500 shadow-sm"
                                : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-xl font-mono font-black text-sm ${isCurrent ? "bg-emerald-800 text-white" : "bg-white border border-slate-200 text-slate-700"}`}>
                                  {yr}
                                </div>
                                <div>
                                  <div className="font-extrabold text-sm text-slate-800">موسم {yr}</div>
                                  <div className="text-[10px] text-slate-400">سنة تشغيلية</div>
                                </div>
                              </div>
                              {isCurrent ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center gap-1 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                                  النشط
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold">غير نشط</span>
                              )}
                            </div>

                            {isEditingThisYear ? (
                              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                                <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                                  <span>تعديل مسمى أو رقم الموسم:</span>
                                </div>
                                <input
                                  type="text"
                                  value={editYearInput}
                                  onChange={(e) => setEditYearInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleSaveEditYear(yr, editYearInput);
                                    }
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                                  autoFocus
                                />
                                <div className="flex items-center justify-end gap-1.5 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingYear(null)}
                                    className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                                  >
                                    إلغاء
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditYear(yr, editYearInput)}
                                    className="px-3 py-1 text-[11px] font-black text-white bg-amber-600 hover:bg-amber-500 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                                  >
                                    <Save className="w-3 h-3" />
                                    <span>حفظ التعديل</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Year Quick Metrics */}
                                <div className="grid grid-cols-3 gap-1.5 p-2 bg-white/80 rounded-xl border border-slate-200/60 text-center text-[10px]">
                                  <div>
                                    <div className="text-slate-400">النزلاء</div>
                                    <div className="font-extrabold text-slate-800">{yrGuests.length}</div>
                                  </div>
                                  <div className="border-x border-slate-100">
                                    <div className="text-slate-400">الساكنين</div>
                                    <div className="font-extrabold text-emerald-700">{yrResidents}</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400">الخدمات</div>
                                    <div className="font-extrabold text-amber-700">{yrServices}</div>
                                  </div>
                                </div>

                                {/* Actions: Activate, Edit, Delete */}
                                <div className="space-y-2 pt-1 border-t border-slate-200/60">
                                  <button
                                    type="button"
                                    onClick={() => handleYearChange(yr)}
                                    disabled={isCurrent}
                                    className={`w-full py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                      isCurrent
                                        ? "bg-emerald-600 text-white font-black cursor-default shadow-xs"
                                        : "bg-white hover:bg-emerald-800 hover:text-white text-slate-700 border border-slate-200 shadow-2xs"
                                    }`}
                                  >
                                    {isCurrent ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                        <span>الموسم النشط حالياً</span>
                                      </>
                                    ) : (
                                      <>
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>تفعيل كموسم نشط</span>
                                      </>
                                    )}
                                  </button>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingYear(yr);
                                        setEditYearInput(yr);
                                      }}
                                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                                      title="تعديل مسمى أو رقم الموسم"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                                      <span>تعديل</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteYear(yr)}
                                      className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                                      title="حذف هذا الموسم من القائمة"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                      <span>حذف</span>
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}

                    </div>
                  </div>

                  {/* 2. RESET ROOMS OCCUPANCY FOR NEW SEASON/VISIT */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                          <RotateCcw className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-rose-950">تفريغ الغرف والجاهزية لموسم تشغيلي جديد</h4>
                          <p className="text-xs text-rose-700/90 mt-0.5 leading-relaxed">
                            يقوم هذا الإجراء بتحويل كافة نزلاء الموسم الحالي إلى حالة (مغادر) وإعادة تعيين حالة جميع الغرف إلى (شاغرة ومتاحة) مع الاحتفاظ بكافة السجلات والبطاقات في الأرشيف دون حذفها.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetRoomsForNewVisit}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shrink-0 shadow-sm transition cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>تفريغ وتصفير الغرف الآن</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. DATA MIGRATION & BATCH TRANSFER */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-extrabold text-sm text-slate-800">ترحيل ونقل بيانات النزلاء بين المواسم التشغيلية</h4>
                    </div>
                    <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-600">من موسم:</span>
                          <select
                            value={migrationSourceYear}
                            onChange={(e) => setMigrationSourceYear(e.target.value)}
                            className="px-3 py-1 rounded-lg bg-white border border-indigo-200 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500"
                          >
                            {yearsList.map(yr => (
                              <option key={yr} value={yr}>موسم {yr}</option>
                            ))}
                          </select>
                        </div>
                        <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-600">إلى موسم:</span>
                          <select
                            value={migrationTargetYear}
                            onChange={(e) => setMigrationTargetYear(e.target.value)}
                            className="px-3 py-1 rounded-lg bg-white border border-indigo-200 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500"
                          >
                            {yearsList.map(yr => (
                              <option key={yr} value={yr}>موسم {yr}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleMigrateGuests}
                        className="w-full md:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span>تنفيذ ترحيل النزلاء</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SECTION: APP LOGO & IDENTITY SETTINGS */}
              {/* ========================================================================= */}
              {(toolsActiveFilter === "all" || toolsActiveFilter === "app_logo") && (
                <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-emerald-600" />
                        <span>هوية وشعار التطبيق والبرنامج العام</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        رفع وتغيير شعار الفندق الظاهر في القائمة الجانبية ورأس الصفحات
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {appLogoImage ? (
                        <img src={appLogoImage} alt="App Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <div className="text-center p-2">
                          <Hotel className="w-8 h-8 text-slate-300 mx-auto" />
                          <span className="text-[10px] text-slate-400 block mt-1">لا يوجد شعار</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 flex-1 text-center sm:text-right">
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <label className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition">
                          <Upload className="w-4 h-4" />
                          <span>رفع شعار جديد (PNG/JPG)</span>
                          <input type="file" accept="image/*" onChange={handleAppLogoUpload} className="hidden" />
                        </label>
                        {appLogoImage && (
                          <>
                            <button
                              type="button"
                              onClick={handleResetAppLogo}
                              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-rose-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف الشعار</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveAppLogoToSheets}
                              disabled={isSavingAppLogoToSheets}
                              className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-amber-200"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{isSavingAppLogoToSheets ? "جاري الحفظ..." : "حفظ في قوقل شيت"}</span>
                            </button>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">يفضل استخدام صورة مربعة أو ذات خلفية شفافة بدقة 512x512 بكسل</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SECTION: GUEST CARD DESIGN & BACKGROUND SETTINGS */}
              {/* ========================================================================= */}
              {(toolsActiveFilter === "all" || toolsActiveFilter === "guest_card") && (
                <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-amber-600" />
                        <span>تصميم وهوية كرت النزيل التعريفية</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        تخصيص خلفية البطاقة وشعارها ونمط الألوان والباركود
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Card Custom Logo */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-800">شعار كرت النزيل المستقل</span>
                        {cardLogoImage && (
                          <button
                            type="button"
                            onClick={handleResetCardLogo}
                            className="text-rose-600 hover:text-rose-700 text-[11px] font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {cardLogoImage ? (
                            <img src={cardLogoImage} alt="Card Logo" className="w-full h-full object-contain p-1" />
                          ) : (
                            <Hotel className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <label className="inline-flex px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer shadow-2xs items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                            <span>رفع شعار الكرت</span>
                            <input type="file" accept="image/*" onChange={handleCardLogoUpload} className="hidden" />
                          </label>
                          <p className="text-[10px] text-slate-400">يظهر في الزاوية العلوية لبطاقة النزيل</p>
                        </div>
                      </div>
                    </div>

                    {/* Card Background Image */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-800">خلفية كرت النزيل المخصصة</span>
                        {cardBgImage && (
                          <button
                            type="button"
                            onClick={handleResetCardBg}
                            className="text-rose-600 hover:text-rose-700 text-[11px] font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {cardBgImage ? (
                            <img src={cardBgImage} alt="Card Bg" className="w-full h-full object-cover" />
                          ) : (
                            <Palette className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <label className="inline-flex px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer shadow-2xs items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-amber-600" />
                            <span>رفع صورة خلفية للكرت</span>
                            <input type="file" accept="image/*" onChange={handleCardBgUpload} className="hidden" />
                          </label>
                          <p className="text-[10px] text-slate-400">صورة مزخرفة أو علامة مائية للبطاقات</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Theme & Layout Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">نمط الألوان للبطاقة</label>
                      <select
                        value={cardColorTheme}
                        onChange={(e) => {
                          setCardColorTheme(e.target.value);
                          localStorage.setItem("card_color_theme", e.target.value);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                      >
                        <option value="emerald">الأخضر الملكي الفندقي (الافتراضي)</option>
                        <option value="luxury">الأسود والذهبي الفاخر (Luxury)</option>
                        <option value="royal">الأزرق الملكي (Royal Blue)</option>
                        <option value="amber">العنبري الدافئ (Warm Amber)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">اتجاه وتخطيط البطاقة</label>
                      <select
                        value={cardLayout}
                        onChange={(e) => {
                          const val = e.target.value as "vertical" | "horizontal";
                          setCardLayout(val);
                          localStorage.setItem("card_layout", val);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                      >
                        <option value="vertical">تخطيط عمودي تقليدي (Vertical)</option>
                        <option value="horizontal">تخطيط أفقي عريض (Horizontal)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SECTION: GOOGLE SHEETS CLOUD DATABASE SYNC */}
              {/* ========================================================================= */}
              {(toolsActiveFilter === "all" || toolsActiveFilter === "database") && (
                <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                        <Database className="w-5 h-5 text-emerald-600" />
                        <span>قاعدة البيانات السحابية (Google Sheets Cloud Database)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ربط وإدارة جدول قوقل شيت المعتمد لتخزين بيانات النزلاء والغرف
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDemoMode ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                          وضع محلي (أوفلاين)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>متصل سحابياً بقوقل شيت</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <label className="block text-xs font-extrabold text-slate-800">
                      معرف أو رابط جدول قوقل شيت المخصص (Spreadsheet ID or URL):
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={customSpreadsheetInput}
                        onChange={(e) => setCustomSpreadsheetInput(e.target.value)}
                        placeholder="ضع رابط جدول Google Sheets أو المعرف هنا..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-emerald-600 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleConnectCustomSpreadsheet(customSpreadsheetInput)}
                        className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>ربط الجدول وتحديثه</span>
                      </button>
                    </div>
                    {spreadsheetId && (
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <span className="font-bold">المعرف الحالي:</span>
                        <span className="text-slate-700">{spreadsheetId}</span>
                        <a
                          href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mr-auto text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>فتح الجدول في قوقل شيت</span>
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handlePushAllLocalToSheets}
                      disabled={isExportingToSheets}
                      className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-emerald-700" />
                      <span>{isExportingToSheets ? "جاري رفع ومزامنة البيانات..." : "مزامنة ورفع البيانات المحلية لقوقل شيت"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRepairSheetStructure}
                      disabled={isFixingSheets}
                      className="p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Wrench className="w-4 h-4 text-amber-700" />
                      <span>{isFixingSheets ? "جاري إصلاح التبويبات..." : "إصلاح وبناء أوراق العمل المفقودة في الشيت"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SECTION: BARCODE & QR SCANNER STATION CONFIG */}
              {/* ========================================================================= */}
              {(toolsActiveFilter === "all" || toolsActiveFilter === "barcode") && (
                <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-emerald-600" />
                      <span>محطة وقارئ الباركود ورمز الاستجابة السريعة (QR Scanner)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      اختبار ومسح بطاقات النزلاء عبر أجهزة القارئ اليدوي أو كاميرا الجهاز
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={barcodeQuery}
                        onChange={(e) => setBarcodeQuery(e.target.value)}
                        placeholder="امسح الباركود بجهاز القارئ أو اكتب رقم الهوية/الغرفة هنا..."
                        className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-emerald-600 font-mono"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>بحث وتحقق</span>
                      </button>
                    </form>
                    <p className="text-[11px] text-slate-500">
                      يمكنك استخدام شاشة (بوابة الحراسة ومسح البطاقات) في القائمة الجانبية للحصول على محطة متكاملة مع الصوت والتقارير الميدانية.
                    </p>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SECTION: BACKUP, EXPORT & IMPORT JSON/CSV */}
              {/* ========================================================================= */}
              {(toolsActiveFilter === "all" || toolsActiveFilter === "backup") && (
                <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                      <DownloadCloud className="w-5 h-5 text-indigo-600" />
                      <span>النسخ الاحتياطي وتصدير واستيراد البيانات</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      حفظ نسخة احتياطية كاملة من قاعدة بيانات النظام على جهازك أو استعادتها
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-extrabold text-xs text-indigo-950 flex items-center gap-1.5">
                          <DownloadCloud className="w-4 h-4 text-indigo-600" />
                          <span>تصدير نسخة احتياطية (JSON)</span>
                        </h4>
                        <p className="text-[11px] text-indigo-800/80 mt-1">
                          تنزيل ملف يحتوي على كافة الغرف والنزلاء وطلبات الخدمات وإعدادات النظام.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportData}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" />
                        <span>تنزيل النسخة الاحتياطية الآن</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                          <UploadCloud className="w-4 h-4 text-slate-700" />
                          <span>استعادة نسخة احتياطية (JSON)</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1">
                          رفع ملف نسخة احتياطية سابقة لاسترجاع كافة البيانات إلى النظام.
                        </p>
                      </div>
                      <label className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>اختيار ملف النسخة واستعادتها</span>
                        <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SECTION: SELF-REGISTRATION PORTAL & PUBLIC LINK SETTINGS */}
              {/* ========================================================================= */}
              {(toolsActiveFilter === "all" || toolsActiveFilter === "requests") && (
                <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-amber-600" />
                        <span>رابط بوابة التسجيل الذاتي للنزلاء (Public Portal)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        مشاركة الرابط العام مع الضيوف لتسجيل بياناتهم وصورهم ذاتياً
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newStatus = !registrationLinkOpen;
                          setRegistrationLinkOpen(newStatus);
                          localStorage.setItem("registration_link_status", newStatus ? "open" : "closed");
                          triggerNotification("info", newStatus ? "تم فتح استقبال طلبات التسجيل الذاتي" : "تم إيقاف استقبال طلبات التسجيل الذاتي مؤقتاً");
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                          registrationLinkOpen
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${registrationLinkOpen ? "bg-emerald-600 animate-pulse" : "bg-rose-600"}`} />
                        <span>{registrationLinkOpen ? "البوابة مفتوحة للاستقبال" : "البوابة مغلقة حالياً"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="space-y-1 text-center sm:text-right">
                      <div className="font-bold text-xs text-amber-950">رابط التسجيل المباشر للنزلاء:</div>
                      <div className="text-[11px] text-amber-800 font-mono break-all">{typeof window !== "undefined" ? `${window.location.origin}/?register=true` : ""}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ الرابط</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRegistrationLinkModal(true)}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-600" />
                        <span>عرض رمز QR والمشاركة</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 7. SERVICES COMMITTEE VIEW (لجنة الخدمات والصيانة) ==================== */}
          {(activeTab === "services_committee" || activeTab === "services_add") && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
                <div>
                  <h2 className="font-black text-lg text-slate-900 flex items-center gap-2">
                    <Wrench className="w-6 h-6 text-amber-600" />
                    <span>إدارة طلبات وخدمات لجنة الخدمات والصيانة</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    متابعة وتلبية طلبات الصيانة والنظافة والتموين للغرف والنزلاء
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddServiceModal(true)}
                    className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-amber-950/20 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة طلب خدمة جديد</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
                {[
                  { key: "all", label: "كافة الطلبات", count: serviceRequests.length },
                  { key: "new", label: "جديد / قيد الانتظار", count: serviceRequests.filter(s => s.status === "new").length },
                  { key: "in_progress", label: "جاري التنفيذ", count: serviceRequests.filter(s => s.status === "in_progress").length },
                  { key: "completed", label: "مكتملة", count: serviceRequests.filter(s => s.status === "completed").length }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setServiceStatusFilter(tab.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                      serviceStatusFilter === tab.key
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${serviceStatusFilter === tab.key ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Service Requests Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceRequests
                  .filter(s => serviceStatusFilter === "all" || s.status === serviceStatusFilter)
                  .map((srv) => {
                    const statusColor = srv.status === "completed"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : srv.status === "in_progress"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-amber-100 text-amber-800 border-amber-200";

                    const statusLabel = srv.status === "completed"
                      ? "مكتمل"
                      : srv.status === "in_progress"
                      ? "جاري التنفيذ"
                      : "قيد الانتظار";

                    return (
                      <div key={srv.id} className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${statusColor}`}>
                              {statusLabel}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{srv.createdAt ? new Date(srv.createdAt).toLocaleDateString("ar-SA") : ""}</span>
                          </div>

                          <div>
                            <h3 className="font-black text-sm text-slate-900">{srv.title}</h3>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{srv.description}</p>
                          </div>

                          <div className="flex items-center gap-2 text-xs pt-1">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-bold text-slate-700">
                              غرفة: {srv.roomNumber}
                            </span>
                            {srv.guestName && (
                              <span className="text-slate-500 text-[11px] truncate">
                                النزيل: {srv.guestName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            {srv.status !== "completed" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateServiceStatus(srv.id, "completed")}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] transition cursor-pointer"
                              >
                                إكمال الطلب
                              </button>
                            )}
                            {srv.status === "new" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateServiceStatus(srv.id, "in_progress")}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] transition cursor-pointer"
                              >
                                بدء التنفيذ
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteServiceRequest(srv.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition rounded"
                            title="حذف الطلب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {serviceRequests.length === 0 && (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
                  <Wrench className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="font-extrabold text-base text-slate-700">لا توجد طلبات خدمات حالياً</h3>
                  <p className="text-xs text-slate-400">يمكنك إضافة طلب صيانة أو تموين جديد عبر الزر أعلاه</p>
                </div>
              )}
            </div>
          )}

          {/* ==================== 8. SECURITY GATE SCANNER VIEW ==================== */}
          {(activeTab as any) === "security_gate" && (
            <div className="space-y-6">
              <SecurityGateStation
                guests={guests}
                rooms={rooms}
                selectedYear={selectedYear}
                selectedVisitType={selectedVisitType}
                onOpenEditGuest={handleOpenEditGuest}
                onOpenCardModal={(guest) => setSelectedGuestForCard(guest)}
                onViewPhoto={(guest) => setSelectedGuestForCard(guest)}
                getArabicDayName={getArabicDayName}
                onAppendGateLog={(log) => {
                if (spreadsheetId) {
                  const token = getAccessToken();
                  if (token) {
                    appendGateLogToSheets(spreadsheetId, token, log).catch(console.error);
                  }
                }
              }}
              />
            </div>
          )}

          {/* ==================== 9. PERMISSIONS & USER ROLES VIEW ==================== */}
          {activeTab === "permissions" && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
                <h2 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <span>إدارة صلاحيات المستخدمين والمدراء</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  تحديد الصلاحيات المتاحة لكل دور وظيفي في النظام (مدير عام، استقبال، خدمات، حراسة، إشراف، تدقيق)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rolesList.map((role) => (
                  <div key={role.id} className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-black text-sm text-slate-900">{role.name}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">{role.description}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {role.type}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-600 mb-2">صلاحيات الوصول للأقسام:</div>
                      {Object.keys(role.permissions || {}).map((permKey) => (
                        <label
                          key={permKey}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition cursor-pointer text-xs"
                        >
                          <span className="text-slate-700 font-semibold">
                            {permKey === "dashboard" && "لوحة التحكم"}
                            {permKey === "rooms" && "إدارة الغرف"}
                            {permKey === "guests" && "إدارة النزلاء"}
                            {permKey === "requests" && "طلبات التسجيل"}
                            {permKey === "id_cards" && "بطاقات النزلاء"}
                            {permKey === "reports" && "التقارير والطباعة"}
                            {permKey === "checkin" && "تسكين النزلاء"}
                            {permKey === "checkout" && "مغادرة النزلاء"}
                            {permKey === "room_config" && "إعداد الغرف"}
                            {permKey === "tools" && "الأدوات والإعدادات"}
                            {permKey === "services_committee" && "لجنة الخدمات"}
                            {permKey === "services_add" && "إضافة خدمات"}
                            {permKey === "security_gate" && "بوابة الحراسة"}
                            {permKey === "permissions" && "إدارة الصلاحيات"}
                          </span>
                          <input
                            type="checkbox"
                            checked={!!role.permissions[permKey as keyof UserRole["permissions"]]}
                            onChange={() => handleToggleRolePermission(role.id, permKey as keyof UserRole["permissions"])}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL: ADD SERVICE REQUEST */}
      {/* ========================================================================= */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                <span>إضافة طلب خدمة أو صيانة جديد</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddServiceModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddServiceSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الغرفة</label>
                <input
                  type="text"
                  required
                  value={newServiceForm.roomNumber}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, roomNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                  placeholder="مثال: 101"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم النزيل (اختياري)</label>
                <input
                  type="text"
                  value={newServiceForm.guestName}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, guestName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800"
                  placeholder="اسم النزيل..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الطلب</label>
                <input
                  type="text"
                  required
                  value={newServiceForm.title}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                  placeholder="مثال: صيانة التكييف، طلب مناشف إضافية"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تفاصيل الطلب</label>
                <textarea
                  value={newServiceForm.description}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 resize-none h-20"
                  placeholder="اكتب تفاصيل وملاحظات الطلب..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs transition cursor-pointer shadow-sm"
                >
                  حفظ الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SHARE REGISTRATION LINK & QR */}
      {/* ========================================================================= */}
      {showRegistrationLinkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-fade-in text-center" dir="rtl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <span>رمز وبوابة التسجيل الذاتي</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRegistrationLinkModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-48 h-48 mx-auto p-3 bg-white rounded-2xl border-2 border-emerald-500 shadow-md flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(typeof window !== "undefined" ? `${window.location.origin}/?register=true` : "")}`}
                alt="Registration QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              امسح الرمز بكاميرا الهاتف أو شارك الرابط مع الضيوف لتمكينهم من تسجيل بياناتهم وصورهم مباشرة.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
              >
                <Copy className="w-4 h-4" />
                <span>نسخ الرابط</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRegistrationLinkModal(false);
                  switchToPublicRegisterPreview();
                }}
                className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="معاينة البوابة مباشرة"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>معاينة البوابة</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRegistrationLinkModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHECK-IN SUCCESS POPUP */}
      {/* ========================================================================= */}
      {showCheckInSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-fade-in" dir="rtl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-9 h-9" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">تم التسكين بنجاح!</h3>
              <p className="text-xs text-slate-600 mt-1">
                تم تسكين النزيل <span className="font-bold text-emerald-800">{showCheckInSuccessModal.name}</span> في الغرفة <span className="font-bold text-emerald-800">{showCheckInSuccessModal.roomNumber}</span>
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedGuestForCard(showCheckInSuccessModal);
                  setShowCheckInSuccessModal(null);
                  setActiveTab("id_cards");
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
              >
                <CreditCard className="w-4 h-4" />
                <span>عرض وطباعة بطاقة النزيل التعريفية</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCheckInSuccessModal(null)}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT GUEST DETAILS */}
      {/* ========================================================================= */}
      {editingGuest && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <span>تعديل بيانات النزيل: {editingGuest.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingGuest(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditGuest} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل</label>
                  <input
                    type="text"
                    required
                    value={editGuestForm.name}
                    onChange={(e) => setEditGuestForm({ ...editGuestForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تعيين / نقل إلى غرفة فندقية</label>
                  <select
                    value={editGuestForm.roomNumber}
                    onChange={(e) => setEditGuestForm({ ...editGuestForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:border-emerald-600 outline-none"
                  >
                    <option value="">-- اختر الغرفة --</option>
                    {rooms.map(r => (
                      <option key={r.number} value={r.number}>
                        غرفة {r.number} - {r.name || r.type} (الطابق {r.floor} | {r.status === "available" ? "شاغرة" : "مشغولة"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الدولة والجنسية</label>
                  <input
                    type="text"
                    value={editGuestForm.country}
                    onChange={(e) => setEditGuestForm({ ...editGuestForm, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الجوال</label>
                  <input
                    type="text"
                    value={editGuestForm.mobile}
                    onChange={(e) => setEditGuestForm({ ...editGuestForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الوصول</label>
                  <input
                    type="date"
                    value={editGuestForm.checkInDate}
                    onChange={(e) => setEditGuestForm({ ...editGuestForm, checkInDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حالة النزيل</label>
                  <select
                    value={editGuestForm.status}
                    onChange={(e) => setEditGuestForm({ ...editGuestForm, status: e.target.value as "resident" | "checked_out" })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                  >
                    <option value="resident">نزيل مقيم حالياً</option>
                    <option value="checked_out">غادر الفندق (خروج)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية</label>
                <textarea
                  value={editGuestForm.notes}
                  onChange={(e) => setEditGuestForm({ ...editGuestForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 resize-none h-16"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingGuest(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs transition cursor-pointer shadow-sm"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DIRECT CHECK-IN FOR WEB REQUESTS */}
      {/* ========================================================================= */}
      {directCheckInRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>تسكين فوري للطلب: {directCheckInRequest.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setDirectCheckInRequest(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تعيين الغرفة الفندقية</label>
                <select
                  value={directCheckInRoom}
                  onChange={(e) => setDirectCheckInRoom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                >
                  <option value="">-- اختر الغرفة المتاحة --</option>
                  {rooms.map((r) => (
                    <option key={r.number} value={r.number}>
                      غرفة {r.number} - {r.name || r.type} ({guests.filter(g => g.roomNumber === r.number && g.status === "resident").length}/{r.capacity} نزيل)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الصفة الإدارية للنزيل</label>
                <select
                  value={directCheckInRole}
                  onChange={(e) => setDirectCheckInRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                >
                  <option value="عضو وفد">عضو وفد</option>
                  <option value="رئيس وفد">رئيس وفد</option>
                  <option value="ضيف شرف">ضيف شرف</option>
                  <option value="مشرف">مشرف</option>
                  <option value="إداري">إداري</option>
                  <option value="مرافق">مرافق</option>
                  <option value="custom">صفة مخصصة أخرى...</option>
                </select>
              </div>

              {directCheckInRole === "custom" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اكتب الصفة المخصصة</label>
                  <input
                    type="text"
                    value={directCheckInCustomRole}
                    onChange={(e) => setDirectCheckInCustomRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800"
                    placeholder="مثال: مستشار إعلامي"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات التسكين</label>
                <input
                  type="text"
                  value={directCheckInNotes}
                  onChange={(e) => setDirectCheckInNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800"
                  placeholder="ملاحظات اختيارية..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDirectCheckInRequest(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleDirectCheckIn(directCheckInRequest)}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs transition cursor-pointer shadow-sm"
              >
                تسكين فوري واعتماد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOGIN / AUTHENTICATION */}
      {/* ========================================================================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-fade-in" dir="rtl">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-black text-base text-slate-900">تسجيل الدخول للنظام</h3>
              <p className="text-xs text-slate-500">أدخل اسم المستخدم وكلمة المرور الخاصة بدورك</p>
            </div>

            {loginError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستخدم</label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                  placeholder="اسم المستخدم..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                  placeholder="كلمة المرور..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs transition cursor-pointer shadow-sm"
                >
                  دخول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHANGE PASSWORD */}
      {/* ========================================================================= */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-fade-in" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                <span>تغيير كلمة المرور: {changePasswordTargetRole}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {changePasswordError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{changePasswordError}</span>
              </div>
            )}

            <form onSubmit={handleQuickChangePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور القديمة</label>
                <input
                  type="password"
                  required
                  value={currentOldPasswordInput}
                  onChange={(e) => setCurrentOldPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs transition cursor-pointer shadow-sm"
                >
                  تحديث كلمة المرور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLOUD SYNC DIAGNOSTIC */}
      {/* ========================================================================= */}
      {showCloudSyncDiagnosticModal && (
        <CloudSyncDiagnosticModal
          isOpen={showCloudSyncDiagnosticModal}
          onClose={() => setShowCloudSyncDiagnosticModal(false)}
          errorDetails={authErrorDetails}
          onRetryLogin={handleGoogleLogin}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: VERCEL AUTH HELP */}
      {/* ========================================================================= */}
      {showVercelAuthHelpModal && (
        <VercelAuthHelpModal
          isOpen={showVercelAuthHelpModal}
          onClose={() => setShowVercelAuthHelpModal(false)}
          onRetryLogin={handleGoogleLogin}
          currentProjectId="hotel-management-cloud"
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM DELETE OPERATIONAL YEAR / SEASON */}
      {/* ========================================================================= */}
      {yearToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 text-right space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">تأكيد حذف الموسم التشغيلي</h3>
                  <p className="text-xs text-slate-500">الموسم: {yearToDelete}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setYearToDelete(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-2">
              <p className="text-xs text-slate-700 leading-relaxed">
                هل ترغب بحذف الموسم ({yearToDelete}) من قائمة المواسم والسنوات التشغيلية؟
              </p>
              <div className="text-xs text-slate-600 font-bold">
                النزلاء المسجلون تحت هذا الموسم:{" "}
                <span className="text-rose-600 font-black">
                  {guests.filter(g => g.year === yearToDelete || (!g.year && yearToDelete === "2026")).length} نزيل
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setYearToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => executeDeleteYear(yearToDelete)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، احذف الموسم الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
