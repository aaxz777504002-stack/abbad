import React, { useRef, useState } from "react";
import { 
  Printer, 
  FileText, 
  User, 
  Globe, 
  Phone, 
  Mail, 
  Bed, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CheckCircle, 
  Download, 
  Search, 
  ArrowRight, 
  DoorClosed,
  Hotel,
  Tag,
  Hash,
  MessageCircle,
  Wrench,
  CheckCircle2,
  X
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Guest, Room, ServiceRequest, GateEntryLog } from "../types";

const DEFAULT_GUEST_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

interface IndividualGuestReportProps {
  initialGuest?: Guest | null;
  guests: Guest[];
  rooms: Room[];
  serviceRequests: ServiceRequest[];
  gateLogs: GateEntryLog[];
  appLogoImage?: string;
  cardLogoImage?: string;
  onClose?: () => void;
  triggerNotification?: (type: "success" | "error" | "info", msg: string) => void;
}

export const IndividualGuestReport: React.FC<IndividualGuestReportProps> = ({
  initialGuest,
  guests,
  rooms,
  serviceRequests,
  gateLogs,
  appLogoImage,
  cardLogoImage,
  onClose,
  triggerNotification
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string>(
    initialGuest?.id || (guests.length > 0 ? guests[0].id : "")
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const currentGuest = guests.find(g => g.id === selectedGuestId) || initialGuest || guests[0];
  const assignedRoom = rooms.find(r => r.number === currentGuest?.roomNumber);

  // Filter gate logs for this specific guest
  const guestGateLogs = gateLogs.filter(log => 
    (currentGuest && log.guestId === currentGuest.id) ||
    (currentGuest && log.guestName === currentGuest.name) ||
    (currentGuest && log.roomNumber === currentGuest.roomNumber)
  );

  // Filter service requests for this guest's room
  const guestServices = serviceRequests.filter(s => 
    currentGuest && (s.roomNumber === currentGuest.roomNumber || s.guestName === currentGuest.name)
  );

  // Stay calculation
  const checkInDate = currentGuest ? new Date(currentGuest.checkInDate) : new Date();
  const checkOutDate = currentGuest?.checkOutDate ? new Date(currentGuest.checkOutDate) : new Date();
  const stayDays = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Safe photo url
  const safePhotoUrl = currentGuest?.photoUrl && currentGuest.photoUrl.trim() !== ""
    ? currentGuest.photoUrl
    : DEFAULT_GUEST_AVATAR;

  // QR Code Payload
  const qrPayload = currentGuest 
    ? `تقرير نزيل معتمد | الاسم: ${currentGuest.name} | المعرف: ${currentGuest.id} | الغرفة: ${currentGuest.roomNumber} | الجنسية: ${currentGuest.country} | الحالة: ${currentGuest.status === "resident" ? "مقيم حالياً" : "غادر"} | خدر ليالي الانس`
    : "";
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPayload)}`;

  // Serial number
  const reportSerial = currentGuest 
    ? `REP-IND-${currentGuest.roomNumber}-${currentGuest.id.slice(0, 5).toUpperCase()}`
    : "REP-IND-000";

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Export PDF handler
  const handleExportPDF = async () => {
    if (!reportRef.current || !currentGuest) return;
    setIsExporting(true);
    triggerNotification?.("info", `جاري إعداد التقرير الفردي للنزيل ${currentGuest.name} بصيغة PDF...`);

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

      const fileName = `Guest_Report_${currentGuest.name.trim().replace(/\s+/g, "_")}_${currentGuest.roomNumber}.pdf`;
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
        triggerNotification?.("success", `تم تصدير التقرير الفردي للنزيل ${currentGuest.name} بنجاح!`);
      } catch {
        pdf.save(fileName);
        triggerNotification?.("success", `تم تصدير التقرير الفردي للنزيل ${currentGuest.name} بنجاح!`);
      }
    } catch (err) {
      console.error("Individual report export error:", err);
      triggerNotification?.("error", "فشل تصدير التقرير كـ PDF. يرجى تجربة الطباعة الورقية.");
    } finally {
      setIsExporting(false);
    }
  };

  // Filtered guests for search
  const filteredSearchGuests = guests.filter(g => 
    !searchQuery || 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.mobile && g.mobile.includes(searchQuery))
  );

  if (!currentGuest) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-700 text-sm">لا يوجد نزلاء مسجلين حالياً لعرض تقاريرهم الفردية</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Controller Bar - No Print */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        {/* Guest Selector Dropdown & Search */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="إغلاق التقرير الفردي والعودة"
            >
              <ArrowRight className="w-4 h-4" />
              <span>رجوع</span>
            </button>
          )}

          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="ابحث لاختيار نزيل آخر..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl pr-8 pl-3 py-2 text-xs font-semibold outline-none transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <span className="text-slate-500 font-bold">النزيل:</span>
            <select
              value={currentGuest.id}
              onChange={e => setSelectedGuestId(e.target.value)}
              className="bg-transparent font-black text-slate-800 outline-none cursor-pointer max-w-[180px] truncate"
            >
              {filteredSearchGuests.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} (غرفة {g.roomNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-800 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
            title="تنزيل التقرير الفردي بصيغة PDF"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "جارٍ التصدير..." : "تصدير التقرير PDF"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            title="طباعة التقرير الفردي للنزيل A4"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>طباعة التقرير الفردي</span>
          </button>
        </div>
      </div>

      {/* Printable Individual Report Document */}
      <div 
        ref={reportRef} 
        id="printable-report-container" 
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 text-slate-800 max-w-4xl mx-auto"
      >
        {/* Document Header */}
        <div className="border-b-2 border-emerald-950 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {appLogoImage && appLogoImage.trim() !== "" ? (
              <img 
                src={appLogoImage} 
                alt="Logo" 
                className="w-16 h-16 object-contain rounded-2xl border border-slate-200 p-1 bg-slate-50 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-950 text-amber-400 flex flex-col items-center justify-center font-black shadow-md border border-amber-500/40">
                <Hotel className="w-8 h-8 text-amber-400" />
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight">
                فندق خِدْرِ لَيَالِي الأَنْسِ للأجنحة الفندقية
              </h1>
              <p className="text-xs font-bold text-amber-700 mt-0.5">
                بشعب النبي هود عليه السلام • بطاقة وتقرير النزيل الفردي المعتمد
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                <span>الرقم المرجعي: {reportSerial}</span>
                <span>•</span>
                <span>الموسم التشغيلي: 2026 م</span>
              </div>
            </div>
          </div>

          <div className="text-right sm:text-left bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 text-xs space-y-1">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
              شهادة إقامة وهوية رسمية
            </span>
            <div className="font-bold text-slate-700">
              تاريخ الإصدار: {new Date().toLocaleDateString("ar-EG")}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              الوقت: {new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="pt-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${currentGuest.status === "resident" ? "bg-emerald-600 text-white border-emerald-700" : "bg-slate-200 text-slate-700 border-slate-300"}`}>
                {currentGuest.status === "resident" ? "مقيم حالياً بالفندق" : "غادر وصُفّي حسابه"}
              </span>
            </div>
          </div>
        </div>

        {/* Guest Profile & Identity Section */}
        <div className="bg-slate-50/90 rounded-2xl p-5 border border-slate-200 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Guest Photo & Verification Stamp */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-3 border-emerald-800 shadow-md bg-white">
              <img 
                src={safePhotoUrl} 
                alt={currentGuest.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-700 text-white p-1 rounded-full shadow border-2 border-white">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>

          {/* Guest Identity Details Grid */}
          <div className="flex-1 w-full space-y-3 text-right">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  {currentGuest.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-100 text-amber-900 border border-amber-200 inline-block">
                    {currentGuest.administrativeRole || "عضو وفد"}
                  </span>
                  <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    {currentGuest.country}
                  </span>
                </div>
              </div>

              <div className="text-left font-mono text-xs">
                <span className="text-slate-400 block text-[10px]">معرّف النزيل الفردي:</span>
                <span className="font-black text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 inline-block">
                  {currentGuest.id}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] block font-bold mb-0.5">رقم الهاتف الجوال:</span>
                <span className="font-mono font-bold text-slate-800 dir-ltr block text-right">
                  {currentGuest.mobile || "غير مسجل"}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] block font-bold mb-0.5">الواتساب:</span>
                <span className="font-mono font-bold text-slate-800 dir-ltr block text-right">
                  {currentGuest.whatsapp || currentGuest.mobile || "غير مسجل"}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] block font-bold mb-0.5">نوع الزيارة:</span>
                <span className="font-bold text-emerald-800 block">
                  {currentGuest.visitType === "general_1" ? "الزيارة العامة الأولى" :
                   currentGuest.visitType === "general_2" ? "الزيارة العامة الثانية" :
                   currentGuest.visitType === "private" ? "الزيارة الخاصة" : "زيارة رسمية"}
                </span>
              </div>
            </div>

            {currentGuest.email && (
              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>البريد الإلكتروني: {currentGuest.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Accommodation & Room Details Box */}
        <div>
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Bed className="w-3.5 h-3.5 text-emerald-700" />
            بيانات الإقامة الفندقية وتفاصيل الغرفة المعينة
          </h2>

          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="bg-emerald-950 text-white p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-400 text-emerald-950 font-black text-lg flex items-center justify-center shadow">
                  {currentGuest.roomNumber}
                </div>
                <div>
                  <h3 className="font-black text-base text-amber-200">
                    غرفة رقم {currentGuest.roomNumber} - {assignedRoom?.name || "جناح فندقي"}
                  </h3>
                  <p className="text-xs text-emerald-300">
                    {assignedRoom?.type || "غرفة فندقية فاخرة"} • {assignedRoom ? (assignedRoom.floor === 0 ? "الطابق الأرضي" : `الطابق ${assignedRoom.floor}`) : "الطابق الأول"}
                  </p>
                </div>
              </div>

              <div className="text-left text-xs bg-emerald-900/80 px-3 py-1.5 rounded-xl border border-emerald-700/50">
                <span className="text-emerald-300 block text-[10px]">الإطلالة والاتجاه:</span>
                <span className="font-bold text-amber-300">{assignedRoom?.direction || "إطلالة مميزة"}</span>
              </div>
            </div>

            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/50 border-b border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">تاريخ وساعة الدخول:</span>
                <span className="font-black text-slate-800">
                  {new Date(currentGuest.checkInDate).toLocaleDateString("ar-EG")}
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">
                  {new Date(currentGuest.checkInDate).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">تاريخ وساعة الخروج:</span>
                <span className="font-black text-slate-800">
                  {currentGuest.checkOutDate ? new Date(currentGuest.checkOutDate).toLocaleDateString("ar-EG") : "مقيم حالياً"}
                </span>
                {currentGuest.checkOutDate && (
                  <span className="text-[10px] text-slate-500 block font-mono">
                    {new Date(currentGuest.checkOutDate).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">مدة الإقامة الإجمالية:</span>
                <span className="font-black text-emerald-800 text-sm">{stayDays} ليالٍ / أيام</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">سعر الليلة التقديري:</span>
                <span className="font-bold text-slate-800">
                  {assignedRoom?.pricePerNight ? `${assignedRoom.pricePerNight} ر.س / ليلة` : "ضيافة ملكية"}
                </span>
              </div>
            </div>

            {/* Room Features */}
            {assignedRoom?.features && assignedRoom.features.length > 0 && (
              <div className="p-3 bg-white border-b border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[10px] font-bold text-slate-400">مميزات الغرفة:</span>
                {assignedRoom.features.map((f, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                    ✓ {f}
                  </span>
                ))}
              </div>
            )}

            {/* Special Notes */}
            {currentGuest.notes && (
              <div className="p-3 bg-amber-50/40 text-xs flex items-start gap-2 text-amber-900">
                <span className="font-bold text-[11px] shrink-0">ملاحظات التسكين والخدمة:</span>
                <span className="font-medium text-slate-700">{currentGuest.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Digital Verification Barcode & QR Code Section */}
        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <img 
                src={qrSrc} 
                alt="QR Code" 
                className="w-20 h-20 object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <div className="space-y-1 text-right">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md inline-block">
                رمز التحقق الرقمي المشفر
              </span>
              <h4 className="font-black text-xs text-slate-800">مسح سريع للتحقق الأمني عبر البوابة والاستقبال</h4>
              <p className="text-[11px] text-slate-500 font-mono">
                PAYLOAD: {currentGuest.id} • ROOM_{currentGuest.roomNumber}
              </p>
            </div>
          </div>

          <div className="text-center sm:text-left text-xs bg-white p-2.5 rounded-xl border border-slate-200 font-mono">
            <span className="text-slate-400 block text-[9px]">الباركود الأمني التتابعي:</span>
            <span className="font-black text-slate-900 tracking-widest text-sm block mt-0.5">
              ||| | |||| | ||| || ||| |
            </span>
            <span className="text-[10px] text-slate-500">*{reportSerial}*</span>
          </div>
        </div>

        {/* Gate Movement History for this guest */}
        <div>
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            سجل حركة الدخول والخروج من البوابة الأمنية ({guestGateLogs.length} حركة مسجلة)
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-black">
                  <th className="p-2.5">توقيت وتاريخ الحركة</th>
                  <th className="p-2.5 text-center">نوع الحركة</th>
                  <th className="p-2.5 text-center">حالة الإذن</th>
                  <th className="p-2.5">الحارس المسؤول</th>
                  <th className="p-2.5">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {guestGateLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400 font-bold">
                      لا توجد سجلات حركة مسجلة لهذا النزيل عبر البوابة حتى الآن
                    </td>
                  </tr>
                ) : (
                  guestGateLogs.slice(0, 5).map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="p-2.5 font-mono text-slate-600">
                        {new Date(log.timestamp).toLocaleDateString("ar-EG")} {new Date(log.timestamp).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${log.action === "entry" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                          {log.action === "entry" ? "دخول" : log.action === "exit" ? "خروج" : "تحقق"}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="text-emerald-700 font-bold text-[10px]">
                          ✓ مصرح به
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600">{log.guardName || "بوابة الاستقبال"}</td>
                      <td className="p-2.5 text-slate-400 text-[10px]">{log.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Room Service Requests */}
        {guestServices.length > 0 && (
          <div>
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-emerald-700" />
              طلبات الخدمات والصيانة المسجلة للغرفة ({guestServices.length} طلب)
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-black">
                    <th className="p-2.5">عنوان الطلب</th>
                    <th className="p-2.5 text-center">التصنيف</th>
                    <th className="p-2.5 text-center">الأولوية</th>
                    <th className="p-2.5 text-center">الحالة</th>
                    <th className="p-2.5">تاريخ الطلب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {guestServices.map(srv => (
                    <tr key={srv.id} className="hover:bg-slate-50/60">
                      <td className="p-2.5 font-bold text-slate-800">{srv.title}</td>
                      <td className="p-2.5 text-center text-[10px] text-slate-600">{srv.category}</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${srv.priority === "urgent" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600"}`}>
                          {srv.priority === "urgent" ? "عاجل" : "عادي"}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${srv.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {srv.status === "completed" ? "مكتمل" : "قيد المتابعة"}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                        {new Date(srv.createdAt).toLocaleDateString("ar-EG")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Official Endorsement & Signatures Block */}
        <div className="border-t-2 border-slate-200 pt-6 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
            {/* Guest Signature */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between h-28">
              <span className="font-extrabold text-slate-700 block">توقيع النزيل / المستلم</span>
              <div className="border-b border-dashed border-slate-300 w-3/4 mx-auto my-1"></div>
              <span className="text-[10px] text-slate-400">التوقيع بالاستلام والموافقة</span>
            </div>

            {/* Reception */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between h-28">
              <span className="font-extrabold text-slate-700 block">موظف الاستقبال والتسكين</span>
              <div className="border-b border-dashed border-slate-300 w-3/4 mx-auto my-1"></div>
              <span className="text-[10px] text-slate-400">الاعتماد والتسجيل</span>
            </div>

            {/* Hotel Manager Seal */}
            <div className="border-2 border-emerald-900/30 rounded-xl p-4 bg-emerald-50/30 flex flex-col justify-between h-28 items-center">
              <span className="font-extrabold text-emerald-950 block">خاتم إدارة الفندق المعتمد</span>
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-emerald-700 flex items-center justify-center text-emerald-800 font-serif text-[8px] font-black opacity-80">
                خدر ليالي الأنس
              </div>
              <span className="text-[8px] text-emerald-800 font-mono">ختم رسمي</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 mt-5 pt-3 border-t border-slate-100 flex items-center justify-between font-mono">
            <span>تقرير نزيل فردي معتمد • فندق خدر ليالي الأنس بشعب النبي هود عليه السلام</span>
            <span>الرقم المرجعي: {reportSerial}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
