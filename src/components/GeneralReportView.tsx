import React, { useRef, useState } from "react";
import { 
  Printer, 
  FileText, 
  Users, 
  Bed, 
  DoorClosed, 
  Percent, 
  Globe, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Calendar,
  Building,
  UserCheck,
  LogOut,
  Layers,
  Wrench,
  Download,
  Hotel
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Room, Guest, ServiceRequest, GateEntryLog, HotelStats, VisitType } from "../types";

interface GeneralReportViewProps {
  rooms: Room[];
  guests: Guest[];
  serviceRequests: ServiceRequest[];
  gateLogs: GateEntryLog[];
  stats: HotelStats;
  appLogoImage?: string;
  cardLogoImage?: string;
  onOpenIndividualReport?: (guest: Guest) => void;
  triggerNotification?: (type: "success" | "error" | "info", msg: string) => void;
}

export const GeneralReportView: React.FC<GeneralReportViewProps> = ({
  rooms,
  guests,
  serviceRequests,
  gateLogs,
  stats,
  appLogoImage,
  cardLogoImage,
  onOpenIndividualReport,
  triggerNotification
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [filterVisitType, setFilterVisitType] = useState<string>("all");

  const filteredGuests = filterVisitType === "all" 
    ? guests 
    : guests.filter(g => g.visitType === filterVisitType);

  const residentsCount = filteredGuests.filter(g => g.status === "resident").length;
  const checkedOutCount = filteredGuests.filter(g => g.status === "checked_out").length;

  // Floor breakdown
  const floors = Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => a - b);
  const floorStats = floors.map(floorNum => {
    const floorRooms = rooms.filter(r => r.floor === floorNum);
    const occupied = floorRooms.filter(r => r.status === "occupied").length;
    const available = floorRooms.filter(r => r.status === "available").length;
    const maintenance = floorRooms.filter(r => r.status === "maintenance" || r.status === "cleaning").length;
    const rate = floorRooms.length > 0 ? Math.round((occupied / floorRooms.length) * 100) : 0;
    return {
      floorNum,
      total: floorRooms.length,
      occupied,
      available,
      maintenance,
      rate
    };
  });

  // Nationality breakdown
  const nationalityMap: Record<string, number> = {};
  filteredGuests.forEach(g => {
    const c = g.country || "غير محدد";
    nationalityMap[c] = (nationalityMap[c] || 0) + 1;
  });
  const nationalityList = Object.entries(nationalityMap)
    .map(([country, count]) => ({
      country,
      count,
      percent: Math.round((count / (filteredGuests.length || 1)) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  // Administrative Role breakdown
  const roleMap: Record<string, number> = {};
  filteredGuests.forEach(g => {
    const r = g.administrativeRole || "عضو وفد";
    roleMap[r] = (roleMap[r] || 0) + 1;
  });
  const roleList = Object.entries(roleMap)
    .map(([role, count]) => ({
      role,
      count,
      percent: Math.round((count / (filteredGuests.length || 1)) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  // Visit type breakdown
  const visitTypeLabels: Record<VisitType, string> = {
    general_1: "الزيارة العامة الأولى",
    general_2: "الزيارة العامة الثانية",
    private: "الزيارة الخاصة"
  };
  const visitTypeMap: Record<string, number> = {
    general_1: 0,
    general_2: 0,
    private: 0
  };
  guests.forEach(g => {
    if (g.visitType && visitTypeMap[g.visitType] !== undefined) {
      visitTypeMap[g.visitType]++;
    }
  });

  // Services stats
  const completedServices = serviceRequests.filter(s => s.status === "completed").length;
  const inProgressServices = serviceRequests.filter(s => s.status === "in_progress" || s.status === "new").length;

  // Gate stats
  const gateEntries = gateLogs.filter(l => l.action === "entry").length;
  const gateExits = gateLogs.filter(l => l.action === "exit").length;

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // PDF Export handler
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    triggerNotification?.("info", "جاري إعداد التقرير العام وتصديره كملف PDF...");

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

      const fileName = `Hotel_General_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
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
        triggerNotification?.("success", "تم تصدير التقرير العام بصيغة PDF بنجاح!");
      } catch {
        pdf.save(fileName);
        triggerNotification?.("success", "تم تصدير التقرير العام بصيغة PDF بنجاح!");
      }
    } catch (err) {
      console.warn("General report export fallback to window.print:", err);
      triggerNotification?.("info", "تم فتح نافذة الطباعة كبديل مباشر؛ يمكنك اختيار 'حفظ بتنسيق PDF' لتنزيل التقرير بجودة عالية.");
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const reportDateStr = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const reportTimeStr = new Date().toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit"
  });
  const reportSerial = `REP-GEN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div className="space-y-6">
      {/* Action Header - No Print */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-md">
            <FileText className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-800">التقرير العام الشامل والإحصائي للمنشأة</h3>
            <p className="text-xs text-slate-500">كشف إحصائي تشغيلي متكامل لجميع الغرف، النزلاء، الطوابق، والبوابة</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Visit Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-500 font-bold">نوع الزيارة:</span>
            <select
              value={filterVisitType}
              onChange={e => setFilterVisitType(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">كافة الزيارات</option>
              <option value="general_1">الزيارة العامة الأولى</option>
              <option value="general_2">الزيارة العامة الثانية</option>
              <option value="private">الزيارة الخاصة</option>
            </select>
          </div>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow transition cursor-pointer"
            title="تصدير التقرير العام كملف PDF"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "جارٍ التصدير..." : "تصدير PDF"}</span>
          </button>

          {/* Primary Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            title="طباعة التقرير العام الشامل فوراً"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>طباعة التقرير العام</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Container */}
      <div 
        ref={reportRef} 
        id="printable-report-container" 
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 text-slate-800"
      >
        {/* Document Header */}
        <div className="border-b-2 border-emerald-950 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            {appLogoImage && appLogoImage.trim() !== "" ? (
              <img 
                src={appLogoImage} 
                alt="Logo" 
                className="w-14 h-14 object-contain rounded-xl border border-slate-200 p-1 bg-slate-50"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-amber-400 flex flex-col items-center justify-center font-black shadow-md border border-amber-500/40">
                <Hotel className="w-7 h-7 text-amber-400" />
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight">
                فندق خِدْرِ لَيَالِي الأَنْسِ للأجنحة الفندقية
              </h1>
              <p className="text-xs font-bold text-amber-700 mt-0.5">
                بشعب النبي هود عليه السلام • التقرير العام والإحصائي الشامل
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                <span>الرقم المرجعي: {reportSerial}</span>
                <span>•</span>
                <span>الموسم: 2026 م</span>
              </div>
            </div>
          </div>

          <div className="text-right sm:text-left bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>التاريخ: {reportDateStr}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>وقت الاستخراج: {reportTimeStr}</span>
            </div>
            <div className="text-[10px] text-emerald-800 font-extrabold bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block">
              تقرير رسمي معتمد
            </div>
          </div>
        </div>

        {/* Executive Summary Stat Cards */}
        <div>
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            المؤشرات التشغيلية ونسب الإشغال العامة
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4">
              <div className="flex justify-between items-center text-emerald-700 mb-1">
                <span className="text-xs font-bold">نسبة إشغال الفندق</span>
                <Percent className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-emerald-950">{stats.occupancyRate}%</div>
              <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-emerald-700 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, stats.occupancyRate)}%` }} 
                />
              </div>
              <span className="text-[10px] text-emerald-800 mt-1 block font-medium">
                {stats.occupiedRooms} مشغولة من {rooms.length} غرفة
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between items-center text-slate-600 mb-1">
                <span className="text-xs font-bold">إجمالي النزلاء</span>
                <Users className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{filteredGuests.length}</div>
              <div className="flex items-center gap-2 mt-2 text-[10px]">
                <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                  {residentsCount} مقيم
                </span>
                <span className="text-slate-500 font-bold bg-slate-200 px-1.5 py-0.5 rounded">
                  {checkedOutCount} غادر
                </span>
              </div>
            </div>

            <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-4">
              <div className="flex justify-between items-center text-blue-700 mb-1">
                <span className="text-xs font-bold">الغرف المتاحة للحجز</span>
                <Bed className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-blue-950">{stats.availableRooms}</div>
              <span className="text-[10px] text-blue-800 mt-2 block font-medium">
                جاهزة فوراً للتسكين
              </span>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4">
              <div className="flex justify-between items-center text-amber-700 mb-1">
                <span className="text-xs font-bold">حركات البوابة والخدمات</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-amber-950">{gateLogs.length}</div>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-amber-900 font-medium">
                <span>دخول: {gateEntries}</span>
                <span>•</span>
                <span>خروج: {gateExits}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floor Breakdown Table */}
        <div>
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-emerald-700" />
            جرد وتوزيع الغرف ونسب الإشغال حسب الطوابق
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-black">
                  <th className="p-3">الطابق</th>
                  <th className="p-3 text-center">إجمالي الغرف</th>
                  <th className="p-3 text-center">الغرف المشغولة</th>
                  <th className="p-3 text-center">الغرف الشاغرة</th>
                  <th className="p-3 text-center">صيانة / تنظيف</th>
                  <th className="p-3 text-center">نسبة إشغال الطابق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {floorStats.map(f => (
                  <tr key={f.floorNum} className="hover:bg-slate-50/60">
                    <td className="p-3 font-extrabold text-slate-800">
                      {f.floorNum === 0 ? "الطابق الأرضي (Ground Floor)" : `الطابق ${f.floorNum} (Floor ${f.floorNum})`}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700">{f.total}</td>
                    <td className="p-3 text-center font-extrabold text-emerald-700 bg-emerald-50/50">{f.occupied}</td>
                    <td className="p-3 text-center font-bold text-blue-700 bg-blue-50/40">{f.available}</td>
                    <td className="p-3 text-center font-bold text-amber-700">{f.maintenance}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-black text-slate-800">{f.rate}%</span>
                        <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full" style={{ width: `${f.rate}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Two-column Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nationality Distribution */}
          <div>
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-700" />
              توزيع النزلاء حسب الجنسيات والوفود
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-black">
                    <th className="p-2.5">الدولة / الجنسية</th>
                    <th className="p-2.5 text-center">عدد النزلاء</th>
                    <th className="p-2.5 text-center">النسبة المئوية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {nationalityList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-400">لا يوجد بيانات مسجلة</td>
                    </tr>
                  ) : (
                    nationalityList.map(n => (
                      <tr key={n.country} className="hover:bg-slate-50/60">
                        <td className="p-2.5 font-bold text-slate-800">{n.country}</td>
                        <td className="p-2.5 text-center font-extrabold text-emerald-700">{n.count}</td>
                        <td className="p-2.5 text-center font-bold text-slate-600">{n.percent}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Roles & Visit Types Distribution */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                توزيع النزلاء حسب الصفة الإدارية
              </h2>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-black">
                      <th className="p-2.5">الصفة / الدور الإداري</th>
                      <th className="p-2.5 text-center">العدد</th>
                      <th className="p-2.5 text-center">النسبة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {roleList.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-400">لا يوجد بيانات مسجلة</td>
                      </tr>
                    ) : (
                      roleList.map(r => (
                        <tr key={r.role} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-bold text-slate-800">{r.role}</td>
                          <td className="p-2.5 text-center font-extrabold text-indigo-700">{r.count}</td>
                          <td className="p-2.5 text-center font-bold text-slate-600">{r.percent}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visit Types Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <h3 className="text-xs font-bold text-slate-700 mb-2">إحصائيات حسب نوع الزيارة:</h3>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">العامة الأولى</span>
                  <span className="font-black text-emerald-800 text-sm">{visitTypeMap.general_1}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">العامة الثانية</span>
                  <span className="font-black text-blue-800 text-sm">{visitTypeMap.general_2}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">الخاصة</span>
                  <span className="font-black text-purple-800 text-sm">{visitTypeMap.private}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Residents Complete Roster Table */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
              كشف النزلاء المقيمين حالياً والمسكنين بالغرف ({residentsCount} نزيل)
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">مرتب حسب رقم الغرفة</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-black">
                  <th className="p-2.5 text-center">الغرفة</th>
                  <th className="p-2.5">اسم النزيل الكامل</th>
                  <th className="p-2.5">الصفة الإدارية</th>
                  <th className="p-2.5">الجنسية</th>
                  <th className="p-2.5">الجوال</th>
                  <th className="p-2.5">تاريخ الدخول</th>
                  <th className="p-2.5 text-center no-print">التقرير الفردي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredGuests.filter(g => g.status === "resident").length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 font-bold">
                      لا يوجد نزلاء مقيمين حالياً متوافقين مع الفلتر
                    </td>
                  </tr>
                ) : (
                  filteredGuests
                    .filter(g => g.status === "resident")
                    .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }))
                    .map(guest => (
                      <tr key={guest.id} className="hover:bg-slate-50/60">
                        <td className="p-2.5 text-center font-black text-emerald-900 bg-emerald-50/60">
                          {guest.roomNumber}
                        </td>
                        <td className="p-2.5 font-extrabold text-slate-900">{guest.name}</td>
                        <td className="p-2.5 font-bold text-slate-600">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 border border-slate-200">
                            {guest.administrativeRole || "عضو وفد"}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700">{guest.country}</td>
                        <td className="p-2.5 font-mono text-slate-600">{guest.mobile || "-"}</td>
                        <td className="p-2.5 text-slate-500 font-medium">
                          {new Date(guest.checkInDate).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="p-2.5 text-center no-print">
                          <button
                            type="button"
                            onClick={() => onOpenIndividualReport?.(guest)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 mx-auto transition cursor-pointer"
                            title="عرض وطباعة التقرير الفردي للنزيل"
                          >
                            <Printer className="w-3 h-3" />
                            <span>تقرير فردي</span>
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Endorsement & Signatures Block */}
        <div className="border-t-2 border-slate-200 pt-6 mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
            {/* Reception */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between h-32">
              <span className="font-extrabold text-slate-700 block">مسؤول قسم الاستقبال والتسكين</span>
              <div className="border-b border-dashed border-slate-300 w-3/4 mx-auto my-2"></div>
              <span className="text-[10px] text-slate-400">التوقيع والاعتماد</span>
            </div>

            {/* General Supervisor */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between h-32">
              <span className="font-extrabold text-slate-700 block">المشرف الإداري العام</span>
              <div className="border-b border-dashed border-slate-300 w-3/4 mx-auto my-2"></div>
              <span className="text-[10px] text-slate-400">التوقيع والاعتماد</span>
            </div>

            {/* Hotel Manager Seal */}
            <div className="border-2 border-emerald-900/30 rounded-xl p-4 bg-emerald-50/30 flex flex-col justify-between h-32 items-center">
              <span className="font-extrabold text-emerald-950 block">خاتم إدارة الفندق المعتمد</span>
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-emerald-700 flex items-center justify-center text-emerald-800 font-serif text-[10px] font-black opacity-80">
                خدر ليالي الأنس
              </div>
              <span className="text-[9px] text-emerald-800 font-mono">الختم الرسمي</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 mt-6 pt-3 border-t border-slate-100 flex items-center justify-between font-mono">
            <span>نظام إدارة الفنادق الذكي • خدر ليالي الأنس بشعب النبي هود عليه السلام</span>
            <span>تاريخ الإصدار: {new Date().toLocaleDateString("ar-EG")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
