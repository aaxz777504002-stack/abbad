import React, { useRef, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from "recharts";
import {
  Printer,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  Users,
  DoorClosed,
  Bed,
  TrendingUp,
  Percent,
  Hotel,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Activity,
  Layers
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Room, Guest } from "../types";

interface WeeklyOccupancyReportProps {
  rooms: Room[];
  guests: Guest[];
  appLogoImage?: string;
  cardLogoImage?: string;
  triggerNotification?: (type: "success" | "error" | "info", message: string) => void;
}

interface DayOccupancyData {
  dayName: string;
  arabicDayName: string;
  dateStr: string;
  formattedDate: string;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  residentsCount: number;
  expectedCheckIns: number;
  expectedCheckOuts: number;
}

export const WeeklyOccupancyReport: React.FC<WeeklyOccupancyReportProps> = ({
  rooms,
  guests,
  appLogoImage,
  cardLogoImage,
  triggerNotification
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = current week, -1 = last week, etc.
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>("all");
  const [activeChartType, setActiveChartType] = useState<"area" | "bar">("area");

  // Filter rooms if floor filter selected
  const targetRooms = useMemo(() => {
    if (selectedFloorFilter === "all") return rooms;
    return rooms.filter(r => String(r.floor) === selectedFloorFilter);
  }, [rooms, selectedFloorFilter]);

  // Compute 7 days for the selected week offset
  const weekData = useMemo(() => {
    const days: DayOccupancyData[] = [];
    const today = new Date();
    
    // Start of week (Saturday as start of Arabic business week)
    // In JS: 0=Sunday, 1=Monday... 6=Saturday
    const currentDayOfWeek = today.getDay(); // 0 to 6
    // Days since Saturday: Saturday is (currentDayOfWeek + 1) % 7
    const diffToSaturday = (currentDayOfWeek + 1) % 7;
    
    const saturday = new Date(today);
    saturday.setDate(today.getDate() - diffToSaturday + (weekOffset * 7));
    saturday.setHours(0, 0, 0, 0);

    const arabicDayNames = [
      "السبت",
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة"
    ];

    const totalRoomsCount = targetRooms.length || 1;

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(saturday);
      targetDate.setDate(saturday.getDate() + i);
      const targetDateStr = targetDate.toISOString().split("T")[0];

      // Find guests active on this date
      const activeGuestsOnDate = guests.filter(g => {
        // Also check if assigned room is in targetRooms
        const roomMatches = targetRooms.some(r => r.number === g.roomNumber);
        if (!roomMatches) return false;

        const checkInStr = (g.checkInDate || "").slice(0, 10);
        let checkOutStr = (g.checkOutDate || "").slice(0, 10);
        if (!checkOutStr) {
          if (g.status === "checked_out") {
            checkOutStr = checkInStr || targetDateStr;
          } else {
            checkOutStr = "2099-12-31";
          }
        }

        const isWithinStay = targetDateStr >= checkInStr && targetDateStr <= checkOutStr;
        return isWithinStay;
      });

      // Calculate unique occupied rooms
      const uniqueOccupiedRooms = new Set(activeGuestsOnDate.map(g => g.roomNumber));
      const occupiedRoomsCount = Math.min(uniqueOccupiedRooms.size, totalRoomsCount);
      const availableRoomsCount = Math.max(0, totalRoomsCount - occupiedRoomsCount);
      const occupancyRate = Math.round((occupiedRoomsCount / totalRoomsCount) * 100);

      // Expected checkins and checkouts
      const checkInsCount = guests.filter(g => (g.checkInDate || "").startsWith(targetDateStr)).length;
      const checkOutsCount = guests.filter(g => (g.checkOutDate || "").startsWith(targetDateStr)).length;

      days.push({
        dayName: arabicDayNames[i],
        arabicDayName: arabicDayNames[i],
        dateStr: targetDateStr,
        formattedDate: targetDate.toLocaleDateString("ar-SA", { month: "numeric", day: "numeric" }),
        totalRooms: totalRoomsCount,
        occupiedRooms: occupiedRoomsCount,
        availableRooms: availableRoomsCount,
        occupancyRate: occupancyRate,
        residentsCount: activeGuestsOnDate.length,
        expectedCheckIns: checkInsCount,
        expectedCheckOuts: checkOutsCount
      });
    }

    return days;
  }, [targetRooms, guests, weekOffset]);

  // Aggregate stats for the week
  const weeklyStats = useMemo(() => {
    if (weekData.length === 0) {
      return { avgRate: 0, peakDay: "-", peakRate: 0, lowestDay: "-", lowestRate: 0, totalOccupiedNights: 0 };
    }

    const sumRate = weekData.reduce((acc, d) => acc + d.occupancyRate, 0);
    const avgRate = Math.round(sumRate / weekData.length);

    let peak = weekData[0];
    let lowest = weekData[0];

    weekData.forEach(d => {
      if (d.occupancyRate > peak.occupancyRate) peak = d;
      if (d.occupancyRate < lowest.occupancyRate) lowest = d;
    });

    const totalOccupiedNights = weekData.reduce((acc, d) => acc + d.occupiedRooms, 0);

    return {
      avgRate,
      peakDay: `${peak.arabicDayName} (${peak.occupancyRate}%)`,
      peakRate: peak.occupancyRate,
      lowestDay: `${lowest.arabicDayName} (${lowest.occupancyRate}%)`,
      lowestRate: lowest.occupancyRate,
      totalOccupiedNights
    };
  }, [weekData]);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // PDF Export handler
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExportingPDF(true);
    triggerNotification?.("info", "جاري إعداد تقرير إشغال الغرف الأسبوعي كملف PDF...");

    try {
      await new Promise(r => setTimeout(r, 250));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        windowWidth: 1200,
        backgroundColor: "#ffffff",
        logging: false
      });

      const imgWidth = 595.28; // A4 pt width
      const pageHeight = 841.89; // A4 pt height
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

      const startDate = weekData[0]?.dateStr || "week";
      const endDate = weekData[weekData.length - 1]?.dateStr || "end";
      const fileName = `Weekly_Occupancy_Report_${startDate}_to_${endDate}.pdf`;

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
        triggerNotification?.("success", "تم تصدير تقرير الإشغال الأسبوعي بنجاح!");
      } catch {
        pdf.save(fileName);
        triggerNotification?.("success", "تم حفظ تقرير الإشغال الأسبوعي كـ PDF!");
      }
    } catch (err) {
      console.warn("Weekly occupancy export fallback to window.print:", err);
      triggerNotification?.("info", "تم فتح نافذة الطباعة كبديل مباشر؛ يمكنك اختيار 'حفظ بتنسيق PDF' لتنزيل التقرير بجودة عالية.");
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const weekRangeText = useMemo(() => {
    if (weekData.length < 2) return "";
    return `من ${weekData[0].arabicDayName} ${weekData[0].dateStr} إلى ${weekData[weekData.length - 1].arabicDayName} ${weekData[weekData.length - 1].dateStr}`;
  }, [weekData]);

  // Unique floors
  const availableFloors = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach(r => {
      if (r.floor !== undefined) set.add(String(r.floor));
    });
    return Array.from(set).sort();
  }, [rooms]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* TOP CONTROLLER & ACTION BAR (NO-PRINT) */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 no-print">
        {/* Week navigation & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Week Offset Buttons */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="p-1.5 hover:bg-white text-slate-700 hover:text-emerald-800 rounded-lg transition cursor-pointer text-xs flex items-center gap-1 font-bold"
              title="الأسبوع السابق"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                weekOffset === 0
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              الأسبوع الحالي
            </button>

            <button
              type="button"
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="p-1.5 hover:bg-white text-slate-700 hover:text-emerald-800 rounded-lg transition cursor-pointer text-xs flex items-center gap-1 font-bold"
              title="الأسبوع القادم"
            >
              <span>التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Floor Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold text-slate-600">تصفية الطابق:</span>
            <select
              value={selectedFloorFilter}
              onChange={e => setSelectedFloorFilter(e.target.value)}
              className="bg-transparent font-black text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">جميع الطوابق ({rooms.length} غرفة)</option>
              {availableFloors.map(f => (
                <option key={f} value={f}>
                  الطابق {f}
                </option>
              ))}
            </select>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveChartType("area")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeChartType === "area"
                  ? "bg-white text-emerald-900 shadow-xs font-black"
                  : "hover:text-slate-900"
              }`}
            >
              منحنى تعبئة (Area)
            </button>
            <button
              type="button"
              onClick={() => setActiveChartType("bar")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeChartType === "bar"
                  ? "bg-white text-emerald-900 shadow-xs font-black"
                  : "hover:text-slate-900"
              }`}
            >
              أعمدة مقارنة (Bar)
            </button>
          </div>
        </div>

        {/* Action Buttons: Print & PDF */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            title="تصدير التقرير كملف PDF"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>{isExportingPDF ? "جارٍ إعداد PDF..." : "تصدير التقرير PDF"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            title="طباعة التقرير ورقية فورية A4"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>طباعة ورقية</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE REPORT DOCUMENT CONTAINER */}
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
                  تقرير إحصائي تحليلي معتمد
                </span>
                <span className="text-xs font-mono text-slate-400">
                  REF-OCC-WK{Math.abs(weekOffset) + 1}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight mt-1">
                فندق خِدْرِ لَيَالِي الأَنْسِ للأجنحة الفندقية
              </h1>
              <p className="text-xs text-slate-500 font-semibold">
                تقرير ومخطط نسبة إشغال الغرف على مدار الأسبوع (Recharts Analytics)
              </p>
            </div>
          </div>

          <div className="text-right sm:text-left text-xs space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shrink-0">
            <div className="flex items-center sm:justify-end gap-2 text-slate-700 font-bold">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-700" />
              <span>{weekRangeText}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              تاريخ استخراج التقرير: {new Date().toLocaleDateString("ar-SA")} - {new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-[10px] text-emerald-800 font-bold">
              النطاق: {selectedFloorFilter === "all" ? "كافة أجنحة وغرف الفندق" : `الطابق ${selectedFloorFilter}`} ({targetRooms.length} غرفة)
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KPI SUMMARY CARDS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 rounded-2xl shadow-sm border border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-200">متوسط الإشغال الأسبوعي</span>
              <Percent className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              {weeklyStats.avgRate}%
            </div>
            <div className="text-[11px] text-emerald-300 flex items-center gap-1 font-medium">
              <Activity className="w-3.5 h-3.5" />
              <span>على مدار الـ 7 أيام</span>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">ذروة الإشغال (الأعلى)</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {weeklyStats.peakDay}
            </div>
            <div className="text-[11px] text-emerald-700 font-bold">
              أعلى معدل حجوزات وتسكين
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">أقل يوم إشغالاً</span>
              <DoorClosed className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {weeklyStats.lowestDay}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              فرصة لتنشيط الحجوزات
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">إجمالي الليالي المشغولة</span>
              <Bed className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {weeklyStats.totalOccupiedNights} <span className="text-xs font-medium text-slate-500">ليلة / غرفة</span>
            </div>
            <div className="text-[11px] text-indigo-700 font-bold">
              من أصل {targetRooms.length * 7} ليلة متاحة
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RECHARTS OCCUPANCY VISUALIZATION */}
        {/* ========================================================================= */}
        <div className="bg-slate-50/70 p-6 rounded-3xl border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
                <span>الرسم البياني لنسبة إشغال الغرف على مدار أيام الأسبوع</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                توضح الأعمدة والمنحنيات نسبة الإشغال المئوية وعدد الغرف المشغولة والشاغرة يومياً
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
              <span>نسبة الإشغال %</span>
              <span className="mx-1">•</span>
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span>الغرف المشغولة</span>
            </div>
          </div>

          {/* Chart Rendering Container */}
          <div className="w-full h-80 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs" dir="ltr">
            <ResponsiveContainer width="100%" height={320}>
              {activeChartType === "area" ? (
                <AreaChart
                  data={weekData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="roomsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="arabicDayName"
                    tick={{ fill: "#334155", fontSize: 12, fontWeight: 700 }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    unit="%"
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "12px",
                      border: "none",
                      padding: "10px 14px",
                      textAlign: "right",
                      fontFamily: "inherit"
                    }}
                    formatter={(val: any, name: any) => {
                      if (name === "occupancyRate") return [`${val}%`, "نسبة الإشغال"];
                      if (name === "occupiedRooms") return [`${val} غرفة`, "الغرف المشغولة"];
                      if (name === "availableRooms") return [`${val} غرفة`, "الغرف الشاغرة"];
                      return [val, name];
                    }}
                    labelFormatter={(label) => `يوم: ${label}`}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(val) => {
                      if (val === "occupancyRate") return "نسبة الإشغال (%)";
                      if (val === "occupiedRooms") return "عدد الغرف المشغولة";
                      return val;
                    }}
                  />
                  <ReferenceLine
                    y={weeklyStats.avgRate}
                    label={{
                      value: `المتوسط ${weeklyStats.avgRate}%`,
                      fill: "#047857",
                      fontSize: 10,
                      fontWeight: 700,
                      position: "insideTopLeft"
                    }}
                    stroke="#047857"
                    strokeDasharray="4 4"
                  />
                  <Area
                    type="monotone"
                    dataKey="occupancyRate"
                    stroke="#059669"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#occupancyGradient)"
                    name="occupancyRate"
                    activeDot={{ r: 6, fill: "#047857", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={weekData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="arabicDayName"
                    tick={{ fill: "#334155", fontSize: 12, fontWeight: 700 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "12px",
                      border: "none",
                      padding: "10px 14px",
                      textAlign: "right",
                      fontFamily: "inherit"
                    }}
                    formatter={(val: any, name: any) => {
                      if (name === "occupiedRooms") return [`${val} غرفة`, "الغرف المشغولة"];
                      if (name === "availableRooms") return [`${val} غرفة`, "الغرف الشاغرة"];
                      return [val, name];
                    }}
                    labelFormatter={(label) => `يوم: ${label}`}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(val) => {
                      if (val === "occupiedRooms") return "الغرف المشغولة";
                      if (val === "availableRooms") return "الغرف الشاغرة";
                      return val;
                    }}
                  />
                  <Bar
                    dataKey="occupiedRooms"
                    fill="#059669"
                    radius={[6, 6, 0, 0]}
                    name="occupiedRooms"
                  />
                  <Bar
                    dataKey="availableRooms"
                    fill="#cbd5e1"
                    radius={[6, 6, 0, 0]}
                    name="availableRooms"
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DETAILED DAILY OCCUPANCY TABLE */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-800" />
              <span>جدول تفصيل الإشغال اليومي على مدار الأسبوع</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              WEEK_DETAIL_7DAYS
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pr-5">اليوم والتاريخ</th>
                  <th className="p-3.5 text-center">إجمالي الغرف</th>
                  <th className="p-3.5 text-center">الغرف المشغولة</th>
                  <th className="p-3.5 text-center">الغرف الشاغرة</th>
                  <th className="p-3.5 text-center">نسبة الإشغال %</th>
                  <th className="p-3.5 text-center">مؤشر الإشغال</th>
                  <th className="p-3.5 text-center">حركة الدخول والخروج</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {weekData.map((d, index) => {
                  const isPeak = d.occupancyRate === weeklyStats.peakRate && weeklyStats.peakRate > 0;
                  return (
                    <tr
                      key={d.dateStr}
                      className={`hover:bg-slate-50 transition ${
                        isPeak ? "bg-emerald-50/50" : ""
                      }`}
                    >
                      <td className="p-3.5 pr-5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center text-[11px] font-black shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <span className="block font-black text-slate-800 text-sm">
                              {d.arabicDayName}
                            </span>
                            <span className="block text-[11px] text-slate-400 font-mono">
                              {d.dateStr}
                            </span>
                          </div>
                          {isPeak && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[9px] font-black shadow-2xs mr-1">
                              ذروة الأسبوع ⭐
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-700">
                        {d.totalRooms}
                      </td>
                      <td className="p-3.5 text-center font-black text-emerald-800 bg-emerald-50/30">
                        {d.occupiedRooms}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-500">
                        {d.availableRooms}
                      </td>
                      <td className="p-3.5 text-center font-black text-slate-900 text-sm">
                        <span
                          className={`px-2.5 py-1 rounded-lg inline-block ${
                            d.occupancyRate >= 80
                              ? "bg-emerald-800 text-white font-black"
                              : d.occupancyRate >= 50
                              ? "bg-emerald-100 text-emerald-900 font-extrabold"
                              : "bg-amber-100 text-amber-900 font-bold"
                          }`}
                        >
                          {d.occupancyRate}%
                        </span>
                      </td>
                      <td className="p-3.5 text-center min-w-[120px]">
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              d.occupancyRate >= 80
                                ? "bg-emerald-600"
                                : d.occupancyRate >= 50
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(100, d.occupancyRate)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2 text-[11px] font-bold">
                          <span className="text-emerald-700" title="تسجيلات دخول متوقعة">
                            +{d.expectedCheckIns} دخول
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="text-rose-600" title="تسجيلات مغادرة متوقعة">
                            -{d.expectedCheckOuts} خروج
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OFFICIAL SIGNATURES & STAMPS (PRINT CERTIFICATION) */}
        {/* ========================================================================= */}
        <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-6">
            <span className="font-extrabold text-slate-700 block">
              إعداد ومراجعة مسؤول الحجوزات:
            </span>
            <div className="border-b border-dashed border-slate-400 w-44 mx-auto pb-1 text-slate-500 font-mono text-[11px]">
              التوقيع: ............................
            </div>
            <span className="text-[10px] text-slate-400 block">قسم الإيواء والاستقبال</span>
          </div>

          <div className="space-y-6">
            <span className="font-extrabold text-slate-700 block">
              اعتماد مدير العمليات والتشغيل:
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
