import React, { useRef, useState, useMemo } from "react";
import {
  Printer,
  FileText,
  Download,
  Building,
  Bed,
  DoorClosed,
  User,
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Wrench,
  Search,
  ArrowRight,
  Phone,
  Globe,
  Sparkles,
  Hotel,
  Coffee,
  Tv,
  Wifi,
  Wind,
  CheckSquare,
  AlertCircle,
  Eye,
  QrCode
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Room, Guest, ServiceRequest } from "../types";

export const DEFAULT_GUEST_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

interface DetailedRoomReportProps {
  rooms: Room[];
  guests: Guest[];
  serviceRequests: ServiceRequest[];
  initialRoomNumber?: string;
  appLogoImage?: string;
  cardLogoImage?: string;
  onOpenGuestReport?: (guest: Guest) => void;
  onClose?: () => void;
  triggerNotification?: (type: "success" | "error" | "info", msg: string) => void;
}

export const DetailedRoomReport: React.FC<DetailedRoomReportProps> = ({
  rooms,
  guests,
  serviceRequests,
  initialRoomNumber,
  appLogoImage,
  cardLogoImage,
  onOpenGuestReport,
  onClose,
  triggerNotification
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>(
    initialRoomNumber || (rooms[0] ? rooms[0].number : "")
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Current selected room
  const currentRoom = useMemo(() => {
    return rooms.find(r => r.number === selectedRoomNumber) || rooms[0];
  }, [rooms, selectedRoomNumber]);

  // Current active resident occupying this room (if any)
  const currentResident = useMemo(() => {
    if (!currentRoom) return null;
    return guests.find(g => g.roomNumber === currentRoom.number && g.status === "resident") || null;
  }, [guests, currentRoom]);

  // Historical guests who stayed in this room
  const roomGuestHistory = useMemo(() => {
    if (!currentRoom) return [];
    return guests.filter(g => g.roomNumber === currentRoom.number);
  }, [guests, currentRoom]);

  // Service & maintenance requests for this room
  const roomServiceRequests = useMemo(() => {
    if (!currentRoom) return [];
    return serviceRequests.filter(s => s.roomNumber === currentRoom.number);
  }, [serviceRequests, currentRoom]);

  // Filtered rooms for room selector search
  const filteredRooms = useMemo(() => {
    if (!searchQuery) return rooms;
    const q = searchQuery.toLowerCase();
    return rooms.filter(
      r =>
        r.number.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.type && r.type.toLowerCase().includes(q)) ||
        String(r.floor).includes(q)
    );
  }, [rooms, searchQuery]);

  // Floor text helper
  const getFloorName = (floorNum: number) => {
    switch (floorNum) {
      case 0:
        return "الطابق الأرضي (Ground Floor)";
      case 1:
        return "الطابق الأول (First Floor)";
      case 2:
        return "الطابق الثاني (Second Floor)";
      case 3:
        return "الطابق الثالث (Third Floor)";
      default:
        return `الطابق ${floorNum}`;
    }
  };

  // Status badge config
  const getStatusBadge = (status: Room["status"]) => {
    switch (status) {
      case "occupied":
      case "full":
        return {
          label: "مشغولة حالياً بنزيل",
          bg: "bg-emerald-800 text-white border-emerald-900",
          dot: "bg-emerald-400"
        };
      case "maintenance":
        return {
          label: "تحت أعمال الصيانة",
          bg: "bg-rose-100 text-rose-900 border-rose-300",
          dot: "bg-rose-500"
        };
      case "cleaning":
        return {
          label: "قيد التنظيف والتعقيم",
          bg: "bg-amber-100 text-amber-900 border-amber-300",
          dot: "bg-amber-500"
        };
      case "available":
      default:
        return {
          label: "شاغرة ومجهزة للتسكين",
          bg: "bg-blue-50 text-blue-900 border-blue-200",
          dot: "bg-blue-500"
        };
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // PDF Export Handler
  const handleExportPDF = async () => {
    if (!reportRef.current || !currentRoom) return;
    setIsExporting(true);
    triggerNotification?.("info", `جاري إعداد التقرير المفصل للغرفة ${currentRoom.number} بصيغة PDF...`);

    try {
      await new Promise(r => setTimeout(r, 200));
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        windowWidth: 1200,
        backgroundColor: "#ffffff",
        logging: false
      });

      const imgWidth = 595.28;
      const pageHeight = 841.89;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF("p", "pt", "a4");
      const imgData = canvas.toDataURL("image/png");

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Detailed_Room_Report_${currentRoom.number}_${new Date().toISOString().split("T")[0]}.pdf`;
      try {
        const blob = pdf.output("blob");
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
        triggerNotification?.("success", `تم تصدير التقرير المفصل للغرفة ${currentRoom.number} بنجاح!`);
      } catch {
        pdf.save(fileName);
        triggerNotification?.("success", `تم تصدير التقرير المفصل للغرفة ${currentRoom.number} بنجاح!`);
      }
    } catch (err) {
      console.warn("Room detailed report export fallback to window.print:", err);
      triggerNotification?.("info", "تم فتح نافذة الطباعة كبديل مباشر؛ يمكنك اختيار 'حفظ بتنسيق PDF' لتنزيل التقرير بجودة عالية.");
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  if (!currentRoom) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
        <DoorClosed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-700 text-sm">لا توجد غرف مسجلة حالياً لعرض تقاريرها المفصلة</h3>
      </div>
    );
  }

  const roomStatusBadge = getStatusBadge(currentRoom.status);

  // Digital verification QR
  const qrPayload = `تقرير مفصل معتمد | الغرفة: ${currentRoom.number} (${currentRoom.name}) | الطابق: ${currentRoom.floor} | الحالة: ${roomStatusBadge.label} | فندق خدر ليالي الانس`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPayload)}`;

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* TOP CONTROLLER BAR - (NO PRINT) */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        {/* Room Selector & Search */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="إغلاق التقرير والعودة"
            >
              <ArrowRight className="w-4 h-4" />
              <span>رجوع</span>
            </button>
          )}

          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="ابحث برقم أو اسم الغرفة..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl pr-8 pl-3 py-2 text-xs font-semibold outline-none transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <DoorClosed className="w-4 h-4 text-emerald-800" />
            <span className="text-slate-500 font-bold">الغرفة المحددة:</span>
            <select
              value={currentRoom.number}
              onChange={e => setSelectedRoomNumber(e.target.value)}
              className="bg-transparent font-black text-slate-900 outline-none cursor-pointer max-w-[200px] truncate"
            >
              {filteredRooms.map(r => (
                <option key={r.number} value={r.number}>
                  غرفة {r.number} - {r.name} ({r.status === "occupied" ? "مشغولة" : "شاغرة"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons: Print & PDF */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
            title="تنزيل التقرير المفصل للغرفة بصيغة PDF"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "جارٍ التصدير..." : "تصدير التقرير PDF"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            title="طباعة التقرير المفصل للغرفة A4"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>طباعة ورقية</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE ROOM REPORT DOCUMENT */}
      {/* ========================================================================= */}
      <div
        ref={reportRef}
        id="printable-report-container"
        className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 text-slate-800 max-w-5xl mx-auto"
      >
        {/* Document Header */}
        <div className="border-b-2 border-emerald-950 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {appLogoImage && appLogoImage.trim() !== "" ? (
              <img
                src={appLogoImage}
                alt="Logo"
                className="w-16 h-16 object-contain rounded-2xl border border-slate-200 p-1 bg-slate-50 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-950 text-amber-400 flex flex-col items-center justify-center font-black shadow-md border border-amber-500/40">
                <Hotel className="w-8 h-8 text-amber-400" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black border border-emerald-300">
                  ملف فحص وسجل الغرفة المعتمد
                </span>
                <span className="text-xs font-mono text-slate-400">
                  REF-ROOM-{currentRoom.number}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight mt-1">
                فندق خِدْرِ لَيَالِي الأَنْسِ للأجنحة الفندقية
              </h1>
              <p className="text-xs text-slate-500 font-semibold">
                التقرير التفصيلي الشامل لمواصفات الغرفة وتاريخ الإشغال وطلبات الخدمة
              </p>
            </div>
          </div>

          <div className="text-right sm:text-left text-xs space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shrink-0">
            <div className="font-extrabold text-slate-900 text-base">
              غرفة رقم {currentRoom.number}
            </div>
            <div className="text-[11px] text-slate-500">
              {currentRoom.name} • {getFloorName(currentRoom.floor)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              تاريخ استخراج التقرير: {new Date().toLocaleDateString("ar-SA")}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROOM SPECIFICATIONS & METRICS GRID */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-800" />
              <span>المواصفات الفنية والهندسية للغرفة</span>
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${roomStatusBadge.bg}`}
            >
              <span className={`w-2 h-2 rounded-full ${roomStatusBadge.dot}`}></span>
              <span>{roomStatusBadge.label}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">رقم الغرفة والمعرّف</span>
              <div className="font-black text-lg text-slate-900">غرفة {currentRoom.number}</div>
              <span className="text-[10px] text-slate-500 font-medium">{currentRoom.name}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">نوع الغرفة والتصنيف</span>
              <div className="font-black text-base text-emerald-900">{currentRoom.type || "جناح فندقي فاخر"}</div>
              <span className="text-[10px] text-slate-500 font-medium">سعة {currentRoom.capacity || 2} نزلاء</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">الطابق والموقع</span>
              <div className="font-black text-base text-slate-900">{getFloorName(currentRoom.floor)}</div>
              <span className="text-[10px] text-slate-500 font-medium">مصاعد ودرج متاح</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block">الإطلالة والاتجاه</span>
              <div className="font-black text-base text-slate-900">{currentRoom.direction || "إطلالة بانورامية"}</div>
              <span className="text-[10px] text-slate-500 font-medium">إضاءة طبيعية ممتازة</span>
            </div>
          </div>

          {/* Pricing & Amenities Banner */}
          <div className="p-4 rounded-2xl bg-emerald-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-900 flex items-center justify-center text-amber-400 font-black">
                ✨
              </div>
              <div>
                <h4 className="font-black text-sm text-white">المميزات والتجهيزات الفندقية المرفقة</h4>
                <p className="text-[11px] text-emerald-200">
                  واي فاي فائق السرعة • شاشة ذكية • تكييف مركزي مستقل • ثلاجة ميني بار • أدوات شاي وقهوة • خزنة إلكترونية
                </p>
              </div>
            </div>
            {currentRoom.pricePerNight ? (
              <div className="text-right sm:text-left shrink-0 bg-emerald-900/80 px-4 py-2 rounded-xl border border-emerald-700/60">
                <span className="text-[10px] text-emerald-300 block">سعر الإقامة لليلة:</span>
                <span className="text-base font-black text-amber-400">{currentRoom.pricePerNight} ريال</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CURRENT RESIDENT OCCUPANCY DOSSIER (IF OCCUPIED) */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-800" />
            <span>بيانات النزيل الساكن حالياً في الغرفة</span>
          </h3>

          {currentResident ? (
            <div className="p-5 rounded-2xl border-2 border-emerald-600/30 bg-emerald-50/30 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={currentResident.photoUrl || DEFAULT_GUEST_AVATAR}
                      alt={currentResident.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-emerald-700 text-white p-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-900">{currentResident.name}</h4>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-black text-[10px] rounded-md border border-emerald-300">
                        {currentResident.administrativeRole || "عضو وفد"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-3 mt-1 font-semibold">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        {currentResident.country}
                      </span>
                      {currentResident.mobile && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {currentResident.mobile}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                  {onOpenGuestReport && (
                    <button
                      type="button"
                      onClick={() => onOpenGuestReport(currentResident)}
                      className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer no-print"
                      title="عرض التقرير الفردي الكامل لهذا النزيل"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>تقرير النزيل الفردي</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Stay Dates & CheckIn Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-emerald-200/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">تاريخ الدخول المسجل:</span>
                  <span className="font-black text-slate-800 font-mono">
                    {new Date(currentResident.checkInDate).toLocaleDateString("ar-SA")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">تاريخ المغادرة المتوقع:</span>
                  <span className="font-black text-slate-800 font-mono">
                    {currentResident.checkOutDate
                      ? new Date(currentResident.checkOutDate).toLocaleDateString("ar-SA")
                      : "حجز مفتوح (مقيم)"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">معرف النزيل الأمني:</span>
                  <span className="font-black text-slate-800 font-mono">
                    {currentResident.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">حالة التسكين:</span>
                  <span className="font-black text-emerald-800">مقيم ومسلم له كرت الدخول</span>
                </div>
              </div>

              {currentResident.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                  <span className="font-black block mb-0.5">ملاحظات خاصة بإقامة النزيل:</span>
                  {currentResident.notes}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-1">
              <DoorClosed className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-xs text-slate-700">لا يوجد نزيل مقيم حالياً في هذه الغرفة</h4>
              <p className="text-[11px] text-slate-400">
                {currentRoom.status === "available"
                  ? "الغرفة معقمة وشاغرة وجاهزة للتسكين الفوري واستقبال النزلاء."
                  : "الغرفة قيد المتابعة من قبل قسم الإشراف الداخلي والصيانة."}
              </p>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ROOM STAY HISTORY (سجل النزلاء السابقين) */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-800" />
              <span>سجل النزلاء والحجوزات المسجلة في هذه الغرفة</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">
              إجمالي السجلات: {roomGuestHistory.length}
            </span>
          </div>

          {roomGuestHistory.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                  <tr>
                    <th className="p-3 pr-4">النزيل</th>
                    <th className="p-3">الجنسية</th>
                    <th className="p-3">الصفة الإدارية</th>
                    <th className="p-3">تاريخ الدخول</th>
                    <th className="p-3">تاريخ المغادرة</th>
                    <th className="p-3 text-center">حالة الإقامة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {roomGuestHistory.map(g => (
                    <tr key={g.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 pr-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <img
                            src={g.photoUrl || DEFAULT_GUEST_AVATAR}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                          <span>{g.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">{g.country}</td>
                      <td className="p-3 text-slate-700">{g.administrativeRole || "عضو وفد"}</td>
                      <td className="p-3 font-mono text-slate-500">
                        {new Date(g.checkInDate).toLocaleDateString("ar-SA")}
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {g.checkOutDate ? new Date(g.checkOutDate).toLocaleDateString("ar-SA") : "-"}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            g.status === "resident"
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {g.status === "resident" ? "مقيم حالياً" : "غادر الغرفة"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">
              لا توجد سجلات إقامة سابقة مسجلة لهذه الغرفة بعد.
            </p>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ROOM SERVICES & MAINTENANCE LOG (سجل الخدمات والصيانة) */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-800" />
              <span>سجل طلبات الخدمة والصيانة الخاصة بالغرفة</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">
              إجمالي الطلبات: {roomServiceRequests.length}
            </span>
          </div>

          {roomServiceRequests.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                  <tr>
                    <th className="p-3 pr-4">نوع الطلب</th>
                    <th className="p-3">وصف البلاغ أو الخدمة</th>
                    <th className="p-3">مقدم الطلب</th>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3 text-center">الحالة التنفيذية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {roomServiceRequests.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 pr-4 font-bold text-slate-900">
                        {s.category === "cleaning"
                          ? "نظافة وتعقيم"
                          : s.category === "maintenance"
                          ? "صيانة فنية"
                          : s.category === "catering"
                          ? "ضيافة ومأكولات"
                          : s.category === "amenities"
                          ? "مستلزمات الغرفة"
                          : s.category || "خدمة عامة"}
                      </td>
                      <td className="p-3 text-slate-700 max-w-xs">{s.description || s.title || "طلب خدمة فندقية"}</td>
                      <td className="p-3 text-slate-600">{s.guestName || "الاستقبال"}</td>
                      <td className="p-3 font-mono text-slate-500">
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString("ar-SA") : "-"}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === "completed"
                              ? "bg-emerald-100 text-emerald-900"
                              : s.status === "in_progress"
                              ? "bg-blue-100 text-blue-900"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {s.status === "completed"
                            ? "مكتمل بنجاح"
                            : s.status === "in_progress"
                            ? "جاري المتابعة"
                            : "قيد الانتظار"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">
              لا توجد بلاغات صيانة أو طلبات خدمة مسجلة لهذه الغرفة حالياً (الحالة ممتازة).
            </p>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ROOM READINESS & INSPECTION CHECKLIST (معايير الفحص المعتمدة) */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-800" />
            <span>قائمة الجاهزية ومعايير الجودة الفندقية المعتمدة للغرفة</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block">نظافة المفارش والسرير والتعقيم الكامل</span>
                <span className="text-[10px] text-slate-500">تم الفحص وفق البروتوكول الفندقي المعتمد</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block">كفاءة قفل الباب الذكي ومفاتيح الكروت RFID</span>
                <span className="text-[10px] text-slate-500">تمت المزامنة مع بوابة الأمن والاستقبال</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block">عمل أجهزة التكييف والإنارة والشاشة الذكية</span>
                <span className="text-[10px] text-slate-500">الحالة التشغيلية تعمل بكفاءة 100%</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block">جاهزية دورة المياه ومستلزمات الضيافة الملكية</span>
                <span className="text-[10px] text-slate-500">تم تزويدها بكامل المناشف واللوازم الشخصية</span>
              </div>
            </div>
          </div>
        </div>

        {/* Digital Verification Barcode Section */}
        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <img src={qrSrc} alt="QR Code" className="w-18 h-18 object-contain" crossOrigin="anonymous" />
            </div>
            <div className="space-y-1 text-right">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-black rounded-md inline-block">
                رمز التحقق الرقمي المشفر للغرفة
              </span>
              <h4 className="font-black text-xs text-slate-800">
                فحص ومسح سريع لحالة الغرفة وبيانات النزيل الحالي
              </h4>
              <p className="text-[11px] text-slate-500 font-mono">
                ROOM_{currentRoom.number} • FLOOR_{currentRoom.floor} • KHIDR_LAYALI
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OFFICIAL SIGNATURES & HOTEL STAMP (PRINT CERTIFICATION) */}
        {/* ========================================================================= */}
        <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-6">
            <span className="font-extrabold text-slate-700 block">
              مشرف الإشراف الداخلي والجودة:
            </span>
            <div className="border-b border-dashed border-slate-400 w-44 mx-auto pb-1 text-slate-500 font-mono text-[11px]">
              التوقيع: ............................
            </div>
            <span className="text-[10px] text-slate-400 block">قسم الصيانة والنظافة الفندقية</span>
          </div>

          <div className="space-y-6">
            <span className="font-extrabold text-slate-700 block">
              مدير الإيواء والاستقبال:
            </span>
            <div className="border-b border-dashed border-slate-400 w-44 mx-auto pb-1 text-slate-500 font-mono text-[11px]">
              التوقيع: ............................
            </div>
            <span className="text-[10px] text-slate-400 block">إدارة الفندق العامة</span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full border-2 border-emerald-900/60 p-1 flex flex-col items-center justify-center text-emerald-950 font-black shadow-xs rotate-[-8deg] bg-emerald-50/40">
              <ShieldCheck className="w-5 h-5 text-emerald-800 mb-0.5" />
              <span className="text-[9px] leading-tight font-black">خدر ليالي الأنس</span>
              <span className="text-[7px] text-emerald-700">معتمد رسمياً</span>
              <span className="text-[6.5px] font-mono text-slate-500 mt-0.5">
                {new Date().toISOString().split("T")[0]}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">الختم الرقمي للمنشأة</span>
          </div>
        </div>
      </div>
    </div>
  );
};
