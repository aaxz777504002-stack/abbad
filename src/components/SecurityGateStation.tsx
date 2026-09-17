import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import {
  ShieldCheck,
  ShieldAlert,
  Camera,
  QrCode,
  Search,
  UserCheck,
  UserX,
  Clock,
  LogIn,
  LogOut,
  Sparkles,
  User,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Printer,
  Download,
  Filter,
  Volume2,
  VolumeX,
  Edit3,
  IdCard,
  Maximize2,
  CheckCircle,
  XCircle,
  HelpCircle,
  FlipHorizontal,
  Lock,
  Wrench
} from "lucide-react";
import { Guest, Room, GateEntryLog, VisitType } from "../types";
import { playSecurityBeep } from "../lib/securityAudio";
import { safeLocalStorage as localStorage } from "../lib/safeStorage";

interface SecurityGateStationProps {
  guests: Guest[];
  rooms: Room[];
  selectedYear: string;
  selectedVisitType: VisitType;
  onOpenEditGuest: (guest: Guest) => void;
  onOpenCardModal: (guest: Guest) => void;
  onViewPhoto: (guest: Guest) => void;
  getArabicDayName: (dateStr: string) => string;
  onAppendGateLog?: (log: GateEntryLog) => void;
}

export const SecurityGateStation: React.FC<SecurityGateStationProps> = ({
  guests,
  rooms,
  selectedYear,
  selectedVisitType,
  onOpenEditGuest,
  onOpenCardModal,
  onViewPhoto,
  getArabicDayName,
  onAppendGateLog
}) => {
  // Sound enabled state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Scanner Mode & Camera state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingFrame, setIsProcessingFrame] = useState<boolean>(false);

  // Barcode / Input state
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const [lastScannedRaw, setLastScannedRaw] = useState<string>("");

  // Matched Guest / Scan Result
  const [scannedGuest, setScannedGuest] = useState<Guest | null>(null);
  const [scanStatus, setScanStatus] = useState<"idle" | "authorized" | "checked_out" | "not_found" | "mismatch">("idle");
  const [scanMessage, setScanMessage] = useState<string>("");

  // Gate Logs History
  const [gateLogs, setGateLogs] = useState<GateEntryLog[]>(() => {
    const saved = localStorage.getItem("hotel_gate_logs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [logFilter, setLogFilter] = useState<"all" | "entry" | "exit" | "today">("all");
  const [logSearchQuery, setLogSearchQuery] = useState<string>("");

  // Video & Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Save logs to localStorage
  useEffect(() => {
    localStorage.setItem("hotel_gate_logs", JSON.stringify(gateLogs));
  }, [gateLogs]);

  // Audio helper respecting user sound preference
  const playSound = (type: "success" | "warning" | "error" | "scan" | "entry" | "exit") => {
    if (soundEnabled) {
      playSecurityBeep(type);
    }
  };

  // Helper to parse query and find matching guest
  const findMatchingGuest = (rawText: string): { guest: Guest | null; reason?: string } => {
    const trimmed = rawText.trim();
    if (!trimmed) return { guest: null };

    // 1. Check if raw text is JSON
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const obj = JSON.parse(trimmed);
        if (obj.guestId || obj.id) {
          const g = guests.find(item => item.id === (obj.guestId || obj.id));
          if (g) return { guest: g };
        }
        if (obj.roomNumber || obj.room) {
          const g = guests.find(item => item.roomNumber === String(obj.roomNumber || obj.room) && item.status === "resident");
          if (g) return { guest: g };
        }
        if (obj.mobile || obj.phone) {
          const g = guests.find(item => item.mobile.includes(obj.mobile || obj.phone));
          if (g) return { guest: g };
        }
      } catch (e) {}
    }

    // 2. Direct match by exact ID
    const byId = guests.find(g => g.id.toLowerCase() === trimmed.toLowerCase());
    if (byId) return { guest: byId };

    // 3. Match from standard QR format: "اسم النزيل: ... | رقم الغرفة: 101 | ..."
    if (trimmed.includes("رقم الغرفة:") || trimmed.includes("غرفة:")) {
      const roomMatch = trimmed.match(/(?:رقم الغرفة|غرفة):\s*([A-Za-z0-9\-_]+)/);
      if (roomMatch && roomMatch[1]) {
        const roomNum = roomMatch[1].trim();
        const residentInRoom = guests.find(g => g.roomNumber === roomNum && g.status === "resident");
        if (residentInRoom) return { guest: residentInRoom };
        const anyInRoom = guests.find(g => g.roomNumber === roomNum);
        if (anyInRoom) return { guest: anyInRoom };
      }
    }

    // 4. Direct match by Room Number (exact match)
    const byRoomResident = guests.find(g => g.roomNumber === trimmed && g.status === "resident");
    if (byRoomResident) return { guest: byRoomResident };

    const byRoomAny = guests.find(g => g.roomNumber === trimmed);
    if (byRoomAny) return { guest: byRoomAny };

    // 5. Match by Mobile Phone
    const cleanDigits = trimmed.replace(/\D/g, "");
    if (cleanDigits.length >= 7) {
      const byPhone = guests.find(g => g.mobile.replace(/\D/g, "").includes(cleanDigits) || cleanDigits.includes(g.mobile.replace(/\D/g, "")));
      if (byPhone) return { guest: byPhone };
    }

    // 6. Match by Full Name
    const byName = guests.find(g => g.name.toLowerCase().includes(trimmed.toLowerCase()));
    if (byName) return { guest: byName };

    return { guest: null };
  };

  // Process code scanning result
  const handleProcessScan = (rawCode: string) => {
    if (!rawCode || rawCode === lastScannedRaw) return;
    setLastScannedRaw(rawCode);

    const { guest } = findMatchingGuest(rawCode);

    if (guest) {
      setScannedGuest(guest);

      if (guest.status === "resident") {
        // Active resident
        if (guest.year && guest.year !== selectedYear) {
          setScanStatus("mismatch");
          setScanMessage(`تحذير: النزيل مسجل في موسم آخر (${guest.year}) وليس الموسم الحالي (${selectedYear})`);
          playSound("warning");
        } else {
          setScanStatus("authorized");
          setScanMessage(`تصريح ساري • النزيل مقيم حالياً في الغرفة ${guest.roomNumber}`);
          playSound("success");
        }
      } else {
        // Checked out
        setScanStatus("checked_out");
        setScanMessage(`تنبيه أمني: النزيل أتم المغادرة وسجل خروجه من الفندق`);
        playSound("warning");
      }
    } else {
      setScannedGuest(null);
      setScanStatus("not_found");
      setScanMessage(`الرمز المدخل (${rawCode.slice(0, 30)}) غير مسجل في منظومة الفندق`);
      playSound("error");
    }
  };

  // Barcode / Manual Form Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    handleProcessScan(barcodeInput.trim());
    setBarcodeInput("");
  };

  // Add Gate Entry Log
  const handleAddGateLog = (action: "entry" | "exit" | "verification", notes?: string) => {
    if (!scannedGuest) return;

    const newLog: GateEntryLog = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      guestId: scannedGuest.id,
      guestName: scannedGuest.name,
      roomNumber: scannedGuest.roomNumber,
      administrativeRole: scannedGuest.administrativeRole || "عضو وفد",
      photoUrl: scannedGuest.photoUrl,
      country: scannedGuest.country,
      mobile: scannedGuest.mobile,
      action: action,
      timestamp: new Date().toISOString(),
      guardName: "حارس البوابة",
      status: scannedGuest.status === "resident" ? "granted" : "flagged",
      notes: notes || (action === "entry" ? "تسجيل حركة دخول من البوابة" : action === "exit" ? "تسجيل حركة خروج من البوابة" : "تحقق أمني ومطابقة")
    };

    setGateLogs(prev => [newLog, ...prev]);

    if (onAppendGateLog) {
      try {
        onAppendGateLog(newLog);
      } catch (e) {
        console.error("onAppendGateLog error:", e);
      }
    }

    if (action === "entry") {
      playSound("entry");
    } else if (action === "exit") {
      playSound("exit");
    } else {
      playSound("success");
    }
  };

  // Start Camera Feed
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);
        requestScanFrame();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("تعذر الوصول إلى الكاميرا. يرجى التأكد من منح الإذن للمتصفح.");
      setCameraActive(false);
    }
  };

  // Stop Camera Feed
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Switch between back and front camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    if (cameraActive) {
      stopCamera();
      setTimeout(() => {
        setFacingMode(nextMode);
      }, 100);
    }
  };

  // Frame Scanner loop using jsQR
  const requestScanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert"
      });

      if (code && code.data) {
        handleProcessScan(code.data);
      }
    }

    animationFrameId.current = requestAnimationFrame(requestScanFrame);
  };

  // Manage camera lifecycle
  useEffect(() => {
    if (cameraActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Filtered logs
  const todayStr = new Date().toISOString().split("T")[0];
  const filteredLogs = gateLogs.filter(log => {
    // Tab filter
    if (logFilter === "entry" && log.action !== "entry") return false;
    if (logFilter === "exit" && log.action !== "exit") return false;
    if (logFilter === "today" && !log.timestamp.startsWith(todayStr)) return false;

    // Search query
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase();
      const matchName = log.guestName.toLowerCase().includes(q);
      const matchRoom = log.roomNumber.toLowerCase().includes(q);
      const matchRole = (log.administrativeRole || "").toLowerCase().includes(q);
      const matchMobile = (log.mobile || "").includes(q);
      if (!matchName && !matchRoom && !matchRole && !matchMobile) return false;
    }

    return true;
  });

  // Calculate statistics
  const todayLogs = gateLogs.filter(l => l.timestamp.startsWith(todayStr));
  const todayEntries = todayLogs.filter(l => l.action === "entry").length;
  const todayExits = todayLogs.filter(l => l.action === "exit").length;
  const todayWarnings = todayLogs.filter(l => l.status === "flagged").length;

  // Export Gate Logs to CSV
  const handleExportCSV = () => {
    if (gateLogs.length === 0) return;

    const headers = ["المعرف", "الوقت والتاريخ", "اسم النزيل", "رقم الغرفة", "الصفة/الدور الإداري", "نوع الحركة", "الحالة الأمنية", "الجوال", "ملاحظات"];
    const rows = gateLogs.map(l => [
      l.id,
      new Date(l.timestamp).toLocaleString("ar-EG"),
      l.guestName,
      l.roomNumber,
      l.administrativeRole || "عضو وفد",
      l.action === "entry" ? "دخول" : l.action === "exit" ? "خروج" : "تحقق أمني",
      l.status === "granted" ? "مصرح" : l.status === "denied" ? "مرفوض" : "تنبيه",
      l.mobile || "",
      l.notes || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `سجل_بوابة_الحراسة_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for Role Badge rendering
  const renderRoleBadge = (role?: string) => {
    if (!role) return null;
    if (role.includes("رئيس") || role.includes("VIP") || role.includes("شرف")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{role}</span>
        </span>
      );
    }
    if (role.includes("مشرف") || role.includes("منسق")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>{role}</span>
        </span>
      );
    }
    if (role.includes("أمن") || role.includes("حراسة")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs">
          <Lock className="w-3.5 h-3.5 text-rose-400" />
          <span>{role}</span>
        </span>
      );
    }
    if (role.includes("خدمات") || role.includes("إعلامي")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs">
          <Wrench className="w-3.5 h-3.5 text-cyan-400" />
          <span>{role}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
        <User className="w-3.5 h-3.5 text-emerald-400" />
        <span>{role}</span>
      </span>
    );
  };

  const guestRoom = scannedGuest ? rooms.find(r => r.number === scannedGuest.roomNumber) : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 select-none" dir="rtl">
      
      {/* Top Banner: Security Gate Station Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border-2 border-indigo-400/50 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-950/50">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">بوابة الحراسة والأمن والمسح الذكي</h2>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  محطة فحص حية (LIVE)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-2xl font-medium">
                مسح بطاقات النزلاء عبر كاميرا الجوال وقارئ الباركود، التحقق الفوري من الهوية والصفة الإدارية، وتسجيل حركات الدخول والخروج.
              </p>
            </div>
          </div>

          {/* Sound & Mode Controls */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 border transition ${
                soundEnabled 
                  ? "bg-indigo-900/60 text-indigo-200 border-indigo-500/40 hover:bg-indigo-900" 
                  : "bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800"
              }`}
              title="تفعيل/تعطيل التنبيهات الصوتية للتمرير"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span>{soundEnabled ? "الصوت مفعل" : "الصوت مكتوم"}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-900/40 text-center relative z-10">
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-indigo-500/20">
            <span className="text-[11px] text-indigo-300/80 block font-bold">عمليات العبور اليوم</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">{todayLogs.length}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-emerald-500/20">
            <span className="text-[11px] text-emerald-300/80 block font-bold">حركات الدخول</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 block">{todayEntries}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-rose-500/20">
            <span className="text-[11px] text-rose-300/80 block font-bold">حركات الخروج</span>
            <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono mt-0.5 block">{todayExits}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-2xl border border-amber-500/20">
            <span className="text-[11px] text-amber-300/80 block font-bold">تنبيهات أمنية</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5 block">{todayWarnings}</span>
          </div>
        </div>
      </div>

      {/* Main Dual Grid: Left Scanner & Quick Inputs / Right Verification Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Scanner + Gun + Search (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Camera Scanner Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-sm text-white">ماسح الكاميرا الحي (QR & Barcode)</h3>
              </div>

              {cameraActive && (
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                  title="تبديل الكاميرا الخلفية / الأمامية"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>{facingMode === "environment" ? "كاميرا خلفية" : "كاميرا سيلفي"}</span>
                </button>
              )}
            </div>

            {/* Video Preview Container */}
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-4/3 flex flex-col items-center justify-center border-2 border-dashed border-indigo-500/40 shadow-inner">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {cameraActive ? (
                <>
                  {/* Laser Line Overlay */}
                  <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce my-auto top-1/2 pointer-events-none" />

                  {/* Corner Targets */}
                  <div className="absolute top-4 right-4 w-7 h-7 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg pointer-events-none" />
                  <div className="absolute top-4 left-4 w-7 h-7 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg pointer-events-none" />
                  <div className="absolute bottom-4 right-4 w-7 h-7 border-b-2 border-r-2 border-emerald-400 rounded-br-lg pointer-events-none" />
                  <div className="absolute bottom-4 left-4 w-7 h-7 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg pointer-events-none" />

                  <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none">
                    <span className="px-3 py-1 bg-slate-950/80 backdrop-blur-xs rounded-full text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                      وجه بطاقة النزيل داخل الإطار
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">الكاميرا متوقفة</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      انقر بالأسفل لتشغيل كاميرا الجهاز ومسح رموز QR تلقائياً
                    </p>
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center">
                  <AlertTriangle className="w-8 h-8 text-rose-400 mb-2" />
                  <p className="text-xs text-rose-300 font-bold">{cameraError}</p>
                </div>
              )}
            </div>

            {/* Camera Activation Button */}
            <button
              type="button"
              onClick={() => {
                if (cameraActive) {
                  stopCamera();
                } else {
                  startCamera();
                }
              }}
              className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer active:scale-98 ${
                cameraActive
                  ? "bg-rose-600 hover:bg-rose-500 text-white"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{cameraActive ? "إيقاف الكاميرا" : "تشغيل الكاميرا ومسح QR"}</span>
            </button>
          </div>

          {/* Handheld Barcode Gun & Quick Input */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-800 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>إدخال يدوي / قارئ الباركود اليدوي (Scanner Gun):</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">يدعم USB / Bluetooth</span>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="امسح الرمز أو أدخل رقم الغرفة (مثال 101) أو الجوال..."
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl pr-4 pl-12 py-3 text-sm font-bold text-slate-800 outline-none transition"
                />
                <button
                  type="submit"
                  className="absolute left-2 top-2 bottom-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs rounded-xl shadow transition"
                >
                  فحص
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>💡 اضغط Enter بعد المسح أو الإدخال</span>
              <button
                type="button"
                onClick={() => {
                  setLastScannedRaw("");
                  setScannedGuest(null);
                  setScanStatus("idle");
                  setScanMessage("");
                }}
                className="text-slate-400 hover:text-slate-600 font-bold transition"
              >
                تفريغ الشاشة
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Scanned Guest Verification Card & Fast Actions (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Verification Status Banner */}
          {scanStatus !== "idle" && (
            <div className={`p-4 rounded-2xl border-2 flex items-center justify-between shadow-md animate-in fade-in duration-200 ${
              scanStatus === "authorized"
                ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                : scanStatus === "checked_out"
                ? "bg-rose-50 border-rose-500 text-rose-900"
                : scanStatus === "mismatch"
                ? "bg-amber-50 border-amber-500 text-amber-900"
                : "bg-slate-100 border-slate-400 text-slate-900"
            }`}>
              <div className="flex items-center gap-3">
                {scanStatus === "authorized" && <CheckCircle className="w-7 h-7 text-emerald-600 shrink-0" />}
                {scanStatus === "checked_out" && <XCircle className="w-7 h-7 text-rose-600 shrink-0" />}
                {scanStatus === "mismatch" && <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0" />}
                {scanStatus === "not_found" && <HelpCircle className="w-7 h-7 text-slate-500 shrink-0" />}
                <div>
                  <h4 className="font-black text-sm">
                    {scanStatus === "authorized" && "🟢 تصريح ساري ومصرح له بالدخول"}
                    {scanStatus === "checked_out" && "🔴 تنبيه: النزيل سجل خروجه من الفندق"}
                    {scanStatus === "mismatch" && "⚠️ تنبيه: عدم تطابق الموسم أو نوع الزيارة"}
                    {scanStatus === "not_found" && "❓ الرمز غير مسجل بالنظام"}
                  </h4>
                  <p className="text-xs mt-0.5 font-medium">{scanMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Scanned Guest Identity Card Display */}
          {scannedGuest ? (
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
              
              {/* Guest Profile Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div 
                    className="relative group cursor-pointer shrink-0"
                    onClick={() => onViewPhoto(scannedGuest)}
                    title="تكبير الصورة الشخصية للنزيل"
                  >
                    <img
                      src={scannedGuest.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                      alt={scannedGuest.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-4 border-slate-100 shadow-md group-hover:scale-105 transition"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 text-white rounded-xl shadow">
                      <Maximize2 className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900">{scannedGuest.name}</h3>
                      {renderRoleBadge(scannedGuest.administrativeRole || "عضو وفد")}
                    </div>

                    <p className="text-xs text-slate-500 font-medium">
                      🌍 {scannedGuest.country} • 📱 <span className="font-mono">{scannedGuest.mobile}</span>
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                        scannedGuest.status === "resident" 
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                          : "bg-rose-100 text-rose-800 border border-rose-200"
                      }`}>
                        {scannedGuest.status === "resident" ? "🟢 نزيل مقيم" : "🔴 تم تسجيل الخروج"}
                      </span>

                      {scannedGuest.year && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                          موسم {scannedGuest.year}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assigned Room Badge */}
                <div className="bg-indigo-50 border-2 border-indigo-200/80 p-4 rounded-2xl text-center shrink-0 w-full sm:w-auto">
                  <span className="text-[10px] text-indigo-700 font-black block">الغرفة المخصصة</span>
                  <span className="text-2xl font-black text-indigo-950 font-mono block">
                    غرفة {scannedGuest.roomNumber}
                  </span>
                  <span className="text-[11px] text-indigo-800 font-bold block truncate mt-0.5">
                    {guestRoom ? guestRoom.name : "طابق الفندق"}
                  </span>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">الصفة / الدور الإداري:</span>
                  <span className="font-black text-slate-800">{scannedGuest.administrativeRole || "عضو وفد"}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">تاريخ ويوم الدخول:</span>
                  <span className="font-black text-slate-800 font-mono">
                    {scannedGuest.checkInDate ? scannedGuest.checkInDate.split("T")[0] : "غير مسجل"}
                    {scannedGuest.checkInDate && getArabicDayName(scannedGuest.checkInDate.split("T")[0]) && (
                      <span className="block text-[10px] text-emerald-700 font-sans font-bold">
                        (يوم {getArabicDayName(scannedGuest.checkInDate.split("T")[0])})
                      </span>
                    )}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">معرف النزيل:</span>
                  <span className="font-mono font-bold text-amber-700 truncate block">{scannedGuest.id}</span>
                </div>
              </div>

              {scannedGuest.notes && (
                <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900">
                  <span className="font-bold block text-[10px] text-amber-700 mb-0.5">📝 تعليمات وملاحظات أمنية/خاصة:</span>
                  <p className="font-medium">{scannedGuest.notes}</p>
                </div>
              )}

              {/* Gate Actions Buttons (تسجيل حركة دخول / خروج / تحقق) */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-black text-slate-700 block">إجراءات البوابة الفورية:</span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleAddGateLog("entry")}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل حركة دخول</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddGateLog("exit")}
                    className="py-3 px-4 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل حركة خروج</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddGateLog("verification")}
                    className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>تسجيل تحقق أمني فقط</span>
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenCardModal(scannedGuest)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <IdCard className="w-4 h-4 text-slate-600" />
                    <span>عرض البطاقة التعريفية</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenEditGuest(scannedGuest)}
                    className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <Edit3 className="w-4 h-4 text-amber-600" />
                    <span>تعديل بيانات النزيل</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">بانتظار مسح بطاقة أو إدخال رمز</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  قم بتوجيه الكاميرا إلى بطاقة النزيل أو استخدم قارئ الباركود لعرض ملف النزيل والتحقق من صلاحية الدخول فوراً.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Bottom Section: Gate Entry/Exit Logs Stream (سجل حركات البوابة) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Logs Header and Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="font-black text-lg text-slate-900">سجل حركات البوابة الأمنية</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              توثيق زمني فوري لكافة عمليات المسح وحركات الدخول والخروج والتحقق الأمني
            </p>
          </div>

          {/* Action Buttons: CSV, Print, Clear */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              disabled={gateLogs.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
              title="تصدير السجل إلى ملف Excel/CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              disabled={gateLogs.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
              title="طباعة التقرير الأمني"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>

            {gateLogs.length > 0 && (
              <button
                onClick={() => {
                  const confirmed = window.confirm("هل أنت متأكد من مسح وتفريغ سجل حركات البوابة بالكامل؟");
                  if (confirmed) {
                    setGateLogs([]);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition"
                title="مسح سجل الحركات"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تفريغ</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          
          {/* Sub Tab Filter */}
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setLogFilter("all")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition ${
                logFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              الكل ({gateLogs.length})
            </button>
            <button
              onClick={() => setLogFilter("today")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition ${
                logFilter === "today" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              اليوم ({todayLogs.length})
            </button>
            <button
              onClick={() => setLogFilter("entry")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition ${
                logFilter === "entry" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              دخول ({gateLogs.filter(l => l.action === "entry").length})
            </button>
            <button
              onClick={() => setLogFilter("exit")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition ${
                logFilter === "exit" ? "bg-white text-rose-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              خروج ({gateLogs.filter(l => l.action === "exit").length})
            </button>
          </div>

          {/* Search Field */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="بحث في سجلات البوابة..."
              value={logSearchQuery}
              onChange={e => setLogSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl pr-9 pl-4 py-2 text-xs outline-none transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                <th className="p-3.5 pr-5">الوقت والتاريخ</th>
                <th className="p-3.5">النزيل</th>
                <th className="p-3.5">الصفة / الدور الإداري</th>
                <th className="p-3.5">رقم الغرفة</th>
                <th className="p-3.5">نوع الحركة</th>
                <th className="p-3.5">الحالة الأمنية</th>
                <th className="p-3.5 pl-5">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto text-slate-200 mb-2" />
                    <p>لا توجد حركات مسجلة تطابق التصفية الحالية</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5 pr-5 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      <span className="block text-[10px] text-slate-400">{log.timestamp.split("T")[0]}</span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        {log.photoUrl && (
                          <img
                            src={log.photoUrl}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <span>{log.guestName}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {renderRoleBadge(log.administrativeRole || "عضو وفد")}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-indigo-900">
                      غرفة {log.roomNumber}
                    </td>
                    <td className="p-3.5">
                      {log.action === "entry" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-black text-[11px] bg-emerald-100 text-emerald-800">
                          <LogIn className="w-3 h-3 text-emerald-600" />
                          <span>دخول</span>
                        </span>
                      )}
                      {log.action === "exit" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-black text-[11px] bg-rose-100 text-rose-800">
                          <LogOut className="w-3 h-3 text-rose-600" />
                          <span>خروج</span>
                        </span>
                      )}
                      {log.action === "verification" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-black text-[11px] bg-indigo-100 text-indigo-800">
                          <ShieldCheck className="w-3 h-3 text-indigo-600" />
                          <span>تحقق</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        log.status === "granted" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : log.status === "denied"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {log.status === "granted" ? "✓ مصرح" : log.status === "denied" ? "✕ مرفوض" : "⚠️ تنبيه"}
                      </span>
                    </td>
                    <td className="p-3.5 pl-5 text-slate-500 text-[11px] max-w-xs truncate">
                      {log.notes || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
