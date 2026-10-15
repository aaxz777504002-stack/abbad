import React, { useRef, useState, useMemo } from "react";
import {
  Printer,
  FileText,
  Download,
  Users,
  UserCheck,
  LogOut,
  Globe,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building,
  DoorClosed,
  Phone,
  Hotel,
  Eye,
  Layers,
  ArrowRight
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Guest, Room } from "../types";

export const DEFAULT_GUEST_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

interface AllGuestsReportViewProps {
  guests: Guest[];
  rooms: Room[];
  appLogoImage?: string;
  cardLogoImage?: string;
  onOpenGuestReport?: (guest: Guest) => void;
  onOpenRoomReport?: (roomNumber: string) => void;
  triggerNotification?: (type: "success" | "error" | "info", msg: string) => void;
}

export const AllGuestsReportView: React.FC<AllGuestsReportViewProps> = ({
  guests,
  rooms,
  appLogoImage,
  cardLogoImage,
  onOpenGuestReport,
  onOpenRoomReport,
  triggerNotification
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "resident" | "checked_out">("all");
  const [nationalityFilter, setNationalityFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Distinct nationalities
  const allNationalities = useMemo(() => {
    return Array.from(new Set(guests.map(g => g.country).filter(Boolean))).sort();
  }, [guests]);

  // Distinct roles
  const allRoles = useMemo(() => {
    return Array.from(
      new Set(guests.map(g => g.administrativeRole || "عضو وفد").filter(Boolean))
    ).sort();
  }, [guests]);

  // Filtered guest list
  const filteredGuests = useMemo(() => {
    return guests.filter(g => {
      // Status filter
      if (statusFilter !== "all" && g.status !== statusFilter) return false;

      // Nationality filter
      if (nationalityFilter !== "all" && g.country !== nationalityFilter) return false;

      // Role filter
      if (roleFilter !== "all" && (g.administrativeRole || "عضو وفد") !== roleFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchRoom = g.roomNumber.toLowerCase().includes(q);
        const matchMobile = g.mobile && g.mobile.includes(q);
        const matchCountry = g.country.toLowerCase().includes(q);
        const matchId = g.id.toLowerCase().includes(q);
        const matchNotes = g.notes && g.notes.toLowerCase().includes(q);
        return matchName || matchRoom || matchMobile || matchCountry || matchId || matchNotes;
      }

      return true;
    });
  }, [guests, statusFilter, nationalityFilter, roleFilter, searchQuery]);

  // Overall Statistics
  const totalCount = guests.length;
  const residentsCount = guests.filter(g => g.status === "resident").length;
  const checkedOutCount = guests.filter(g => g.status === "checked_out").length;
  const nationalitiesCount = allNationalities.length;

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // PDF Export handler
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    triggerNotification?.("info", "جاري إعداد تقرير جميع النزلاء بصيغة PDF...");

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

      const fileName = `All_Guests_Register_Report_${new Date().toISOString().split("T")[0]}.pdf`;
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
        triggerNotification?.("success", "تم تصدير تقرير جميع النزلاء كـ PDF بنجاح!");
      } catch {
        pdf.save(fileName);
        triggerNotification?.("success", "تم تصدير تقرير جميع النزلاء كـ PDF بنجاح!");
      }
    } catch (err) {
      console.error("All guests report export error:", err);
      triggerNotification?.("error", "فشل تصدير التقرير كـ PDF. يرجى تجربة خيار الطباعة الورقية.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* TOP CONTROLLER & FILTERS BAR (NO-PRINT) */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
        {/* Top actions & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="ابحث بالاسم، الغرفة، الجوال أو الجنسية..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl pr-9 pl-3 py-2.5 text-xs font-semibold outline-none transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          </div>

          {/* Action Buttons: Print & PDF */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              title="تصدير سجل جميع النزلاء كملف PDF"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>{isExporting ? "جارٍ إعداد PDF..." : "تصدير التقرير PDF"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              title="طباعة السجل العام لجميع النزلاء A4"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>طباعة ورقية</span>
            </button>
          </div>
        </div>

        {/* Filter Pills / Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100 text-xs">
          {/* Status filter tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition font-bold cursor-pointer ${
                statusFilter === "all" ? "bg-white text-emerald-950 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              كافة النزلاء ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("resident")}
              className={`px-3 py-1.5 rounded-lg transition font-bold cursor-pointer ${
                statusFilter === "resident" ? "bg-white text-emerald-800 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              المقيمين حالياً ({residentsCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("checked_out")}
              className={`px-3 py-1.5 rounded-lg transition font-bold cursor-pointer ${
                statusFilter === "checked_out" ? "bg-white text-rose-800 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              المغادرين ({checkedOutCount})
            </button>
          </div>

          {/* Nationality Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold text-slate-600">الجنسية:</span>
            <select
              value={nationalityFilter}
              onChange={e => setNationalityFilter(e.target.value)}
              className="bg-transparent font-black text-slate-800 outline-none cursor-pointer max-w-[130px] truncate"
            >
              <option value="all">كل الجنسيات ({nationalitiesCount})</option>
              {allNationalities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold text-slate-600">الصفة:</span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-transparent font-black text-slate-800 outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="all">كافة الأدوار</option>
              {allRoles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {(searchQuery || statusFilter !== "all" || nationalityFilter !== "all" || roleFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setNationalityFilter("all");
                setRoleFilter("all");
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 cursor-pointer"
            >
              إلغاء التصفية ↺
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE ALL GUESTS REPORT DOCUMENT */}
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
                  سجل النزلاء العام والنزالة المعتمد
                </span>
                <span className="text-xs font-mono text-slate-400">
                  REP-ALL-GUESTS
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight mt-1">
                فندق خِدْرِ لَيَالِي الأَنْسِ للأجنحة الفندقية
              </h1>
              <p className="text-xs text-slate-500 font-semibold">
                تقرير شامل لبيانات جميع النزلاء والمقيمين وسجلات الإقامة والوفود
              </p>
            </div>
          </div>

          <div className="text-right sm:text-left text-xs space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shrink-0">
            <div className="font-extrabold text-slate-900 text-sm">
              إجمالي النزلاء بالسجل: {filteredGuests.length} نزيل
            </div>
            <div className="text-[11px] text-emerald-800 font-bold">
              المقيمين حالياً: {residentsCount} | المغادرين: {checkedOutCount}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              تاريخ استخراج التقرير: {new Date().toLocaleDateString("ar-SA")} - {new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KPI SUMMARY CARDS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>إجمالي النزلاء المسجلين</span>
              <Users className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-black text-slate-900">{totalCount}</div>
            <span className="text-[10px] text-slate-400 font-medium">سجل النزلاء والأرشيف</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
              <span>النزلاء المقيمين حالياً</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-950">{residentsCount}</div>
            <span className="text-[10px] text-emerald-700 font-medium">يشغلون غرفاً نشطة</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>النزلاء المغادرين</span>
              <LogOut className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{checkedOutCount}</div>
            <span className="text-[10px] text-slate-400 font-medium">تمت إجراءات المغادرة</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>الجنسيات والدول</span>
              <Globe className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{nationalitiesCount}</div>
            <span className="text-[10px] text-indigo-700 font-medium">تنوع وفود الزوار</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COMPREHENSIVE GUESTS TABLE */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-800" />
              <span>جدول النزلاء المعتمد (الاسم، الغرفة، التواريخ، والصفة الإدارية)</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">
              عرض {filteredGuests.length} من أصل {totalCount}
            </span>
          </div>

          {filteredGuests.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pr-4 text-center w-12">#</th>
                    <th className="p-3.5">النزيل والصورة</th>
                    <th className="p-3.5">الجنسية</th>
                    <th className="p-3.5">الغرفة المسكنة</th>
                    <th className="p-3.5">الصفة الإدارية</th>
                    <th className="p-3.5">رقم الجوال</th>
                    <th className="p-3.5">تاريخ الدخول</th>
                    <th className="p-3.5">تاريخ المغادرة</th>
                    <th className="p-3.5 text-center">حالة الإقامة</th>
                    <th className="p-3.5 text-center no-print">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredGuests.map((g, idx) => {
                    const guestRoom = rooms.find(r => r.number === g.roomNumber);
                    return (
                      <tr key={g.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={g.photoUrl || DEFAULT_GUEST_AVATAR}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <span className="block font-black text-slate-800">{g.name}</span>
                              {g.notes && (
                                <span className="block text-[10px] text-amber-700 truncate max-w-[140px]" title={g.notes}>
                                  💡 {g.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 whitespace-nowrap">
                          {g.country}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => onOpenRoomReport?.(g.roomNumber)}
                            className="font-extrabold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition cursor-pointer text-xs"
                            title="عرض التقرير المفصل لهذه الغرفة"
                          >
                            غرفة {g.roomNumber}
                          </button>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[10px] border border-slate-200">
                            {g.administrativeRole || "عضو وفد"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600 text-[11px]" dir="ltr">
                          {g.mobile || "-"}
                        </td>
                        <td className="p-3 font-mono text-slate-600 text-[11px]">
                          {new Date(g.checkInDate).toLocaleDateString("ar-SA")}
                        </td>
                        <td className="p-3 font-mono text-slate-600 text-[11px]">
                          {g.checkOutDate ? new Date(g.checkOutDate).toLocaleDateString("ar-SA") : "مقيم"}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              g.status === "resident"
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {g.status === "resident" ? "مقيم حالياً" : "غادر"}
                          </span>
                        </td>
                        <td className="p-3 text-center no-print">
                          {onOpenGuestReport && (
                            <button
                              type="button"
                              onClick={() => onOpenGuestReport(g)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg transition flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-2xs"
                              title="عرض وطباعة التقرير الفردي المعتمد للنزيل"
                            >
                              <FileText className="w-3 h-3 text-emerald-400" />
                              <span>تقرير فردي</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-1">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-xs text-slate-600">لا يوجد نزلاء يطابقون خيارات البحث والتصفية المحددة</p>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* OFFICIAL SIGNATURES & HOTEL STAMP (PRINT CERTIFICATION) */}
        {/* ========================================================================= */}
        <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-6">
            <span className="font-extrabold text-slate-700 block">
              موظف الاستقبال والتسجيل:
            </span>
            <div className="border-b border-dashed border-slate-400 w-44 mx-auto pb-1 text-slate-500 font-mono text-[11px]">
              التوقيع: ............................
            </div>
            <span className="text-[10px] text-slate-400 block">قسم الإيواء والحجوزات</span>
          </div>

          <div className="space-y-6">
            <span className="font-extrabold text-slate-700 block">
              مدير العمليات والشؤون الإدارية:
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
