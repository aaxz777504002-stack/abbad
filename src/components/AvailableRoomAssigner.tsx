import React, { useState, useMemo } from "react";
import { 
  Building2, 
  Bed, 
  CheckCircle2, 
  Search, 
  Layers, 
  Compass, 
  Users, 
  Check, 
  AlertCircle,
  LayoutGrid,
  List,
  Sparkles,
  RotateCcw
} from "lucide-react";
import { Room, Guest } from "../types";

interface AvailableRoomAssignerProps {
  rooms: Room[];
  selectedRoomNumber: string;
  onSelectRoom: (roomNumber: string) => void;
  guests?: Guest[];
  required?: boolean;
  label?: string;
}

export const AvailableRoomAssigner: React.FC<AvailableRoomAssignerProps> = ({
  rooms,
  selectedRoomNumber,
  onSelectRoom,
  guests = [],
  required = true,
  label = "تعيين الغرفة الفندقية المتاحة"
}) => {
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"cards" | "dropdown">("cards");

  // Determine available rooms (either marked available or currently matching the selected room)
  const availableRooms = useMemo(() => {
    return rooms.filter(r => r.status === "available" || r.number === selectedRoomNumber);
  }, [rooms, selectedRoomNumber]);

  // Extract unique floors and types for filter tabs
  const uniqueFloors = useMemo(() => {
    const floors = Array.from(new Set(availableRooms.map(r => r.floor))).sort((a, b) => a - b);
    return floors;
  }, [availableRooms]);

  const uniqueTypes = useMemo(() => {
    const types = Array.from(new Set(availableRooms.map(r => r.type).filter(Boolean))).sort();
    return types;
  }, [availableRooms]);

  // Filtered rooms based on floor, type, and search
  const filteredRooms = useMemo(() => {
    return availableRooms.filter(r => {
      const matchFloor = selectedFloor === "all" || String(r.floor) === selectedFloor;
      const matchType = selectedType === "all" || r.type === selectedType;
      const matchQuery = !searchQuery.trim() || 
        r.number.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        (r.name && r.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
        (r.type && r.type.toLowerCase().includes(searchQuery.trim().toLowerCase()));
      return matchFloor && matchType && matchQuery;
    });
  }, [availableRooms, selectedFloor, selectedType, searchQuery]);

  // Group rooms by floor for organized listing
  const roomsGroupedByFloor = useMemo(() => {
    const groups: { [key: number]: Room[] } = {};
    filteredRooms.forEach(room => {
      const fl = room.floor || 1;
      if (!groups[fl]) groups[fl] = [];
      groups[fl].push(room);
    });
    return groups;
  }, [filteredRooms]);

  // Selected room object
  const currentSelectedRoom = useMemo(() => {
    return rooms.find(r => r.number === selectedRoomNumber);
  }, [rooms, selectedRoomNumber]);

  return (
    <div className="bg-slate-50/90 rounded-2xl border-2 border-slate-200/90 p-4 sm:p-5 space-y-4 shadow-xs">
      {/* Top Header: Title, Counter & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="space-y-0.5">
          <label className="text-sm font-black text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-600/10 border border-emerald-600/20 text-emerald-700 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </span>
            <span>{label}</span>
            {required && <span className="text-rose-600 font-bold">*</span>}
          </label>
          <p className="text-xs text-slate-500 font-medium">
            اختر غرفة فندقية شاغرة ومجهزة بالكامل للتسكين الفوري للنزيل
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Available Counter Badge */}
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{availableRooms.length} غرفة متاحة</span>
          </span>

          {/* View Mode Toggle */}
          <div className="bg-white p-0.5 rounded-xl border border-slate-200 flex items-center shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              title="عرض البطاقات المنظمة"
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === "cards" 
                  ? "bg-emerald-800 text-white shadow-xs" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden md:inline">شبكة الغرف</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("dropdown")}
              title="عرض القائمة المنسدلة"
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === "dropdown" 
                  ? "bg-emerald-800 text-white shadow-xs" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden md:inline">قائمة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Room Confirmation Card (When a room is selected) */}
      {currentSelectedRoom ? (
        <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs transition-all">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white font-black text-sm flex flex-col items-center justify-center shrink-0 shadow-xs border border-emerald-800">
              <span className="text-[9px] uppercase tracking-wider text-emerald-200">غرفة</span>
              <span className="text-base font-black leading-none">{currentSelectedRoom.number}</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-black text-slate-900">
                  {currentSelectedRoom.name || `الغرفة ${currentSelectedRoom.number}`}
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900 text-[11px] font-bold">
                  {currentSelectedRoom.type || "غرفة فندقية"}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>معينة للتسكين</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-600 font-medium flex-wrap">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>الطابق {currentSelectedRoom.floor || 1}</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>السعة: {currentSelectedRoom.capacity || 1} نزلاء</span>
                </span>
                {currentSelectedRoom.direction && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentSelectedRoom.direction}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectRoom("")}
            className="self-end md:self-auto px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
            <span>تغيير الغرفة</span>
          </button>
        </div>
      ) : (
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>يرجى اختيار وتحديد الغرفة المناسبة من القائمة أو البطاقات أدناه لإكمال عملية التسكين.</span>
        </div>
      )}

      {/* Filter and Search Bar for Available Rooms */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ابحث برقم الغرفة، اسمها، أو نوعها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl pr-9 pl-3 py-1.5 text-xs font-medium outline-none transition text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Floor Filter Tabs */}
        {uniqueFloors.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedFloor("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedFloor === "all"
                  ? "bg-slate-800 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              جميع الطوابق
            </button>
            {uniqueFloors.map(floorNum => (
              <button
                key={floorNum}
                type="button"
                onClick={() => setSelectedFloor(String(floorNum))}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedFloor === String(floorNum)
                    ? "bg-emerald-800 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                الطابق {floorNum}
              </button>
            ))}
          </div>
        )}

        {/* Room Type Selector Filter (if multiple types) */}
        {uniqueTypes.length > 1 && (
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none focus:border-emerald-500"
          >
            <option value="all">كافة الأنواع</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      {/* Main Selection Area */}
      {availableRooms.length === 0 ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h4 className="text-sm font-black text-rose-900">لا توجد أي غرف فندقية شاغرة حالياً</h4>
          <p className="text-xs text-rose-700 max-w-md mx-auto leading-relaxed">
            جميع الغرف مشغولة بالكامل. يمكنك مراجعة لوحة الغرف وتفريغ الغرف المغادرة أو زيادة سعة الفندق لبدء التسكين.
          </p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-400 space-y-2">
          <Search className="w-6 h-6 mx-auto text-slate-300" />
          <p className="text-xs font-bold text-slate-600">لا توجد غرف تطابق شروط البحث أو التصفية الحالية</p>
          <button
            type="button"
            onClick={() => { setSearchQuery(""); setSelectedFloor("all"); setSelectedType("all"); }}
            className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>إعادة ضبط التصفية</span>
          </button>
        </div>
      ) : viewMode === "cards" ? (
        /* Organized Visual Cards Grid */
        <div className="space-y-4 max-h-72 overflow-y-auto pr-1 pl-1 scrollbar-thin">
          {Object.entries(roomsGroupedByFloor).map(([floorNum, floorRooms]) => (
            <div key={floorNum} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-600 bg-slate-100/80 px-3 py-1 rounded-lg border border-slate-200/60">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>الطابق {floorNum}</span>
                <span className="text-[10px] text-slate-400 font-medium mr-auto">
                  ({floorRooms.length} غرف متاحة)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {floorRooms.map(room => {
                  const isSelected = selectedRoomNumber === room.number;
                  return (
                    <button
                      key={room.number}
                      type="button"
                      onClick={() => onSelectRoom(room.number)}
                      className={`p-3 rounded-xl border-2 text-right transition-all flex flex-col justify-between gap-2 cursor-pointer relative group ${
                        isSelected
                          ? "bg-emerald-800 border-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40"
                          : "bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-slate-800 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-base font-black tracking-tight ${isSelected ? "text-amber-300" : "text-slate-900"}`}>
                          غرفة {room.number}
                        </span>
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" title="شاغرة ومتاحة" />
                        )}
                      </div>

                      <div className="space-y-0.5 w-full">
                        <div className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-slate-800"}`}>
                          {room.name || room.type}
                        </div>
                        <div className={`text-[10px] font-medium truncate ${isSelected ? "text-emerald-200" : "text-slate-400"}`}>
                          {room.type} {room.direction ? `• ${room.direction}` : ""}
                        </div>
                      </div>

                      <div className={`text-[10px] font-bold pt-1 border-t flex items-center justify-between w-full ${isSelected ? "border-emerald-700/60 text-emerald-200" : "border-slate-100 text-slate-500"}`}>
                        <span className="flex items-center gap-1">
                          <Bed className="w-3 h-3" />
                          <span>سعة {room.capacity}</span>
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${isSelected ? "bg-emerald-950/60 text-emerald-300" : "bg-slate-100 text-slate-600"}`}>
                          ط {room.floor}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Organized Grouped Dropdown View */
        <div className="space-y-2">
          <select
            required={required}
            value={selectedRoomNumber}
            onChange={(e) => onSelectRoom(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 focus:border-emerald-600 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition shadow-2xs"
          >
            <option value="">-- اضغط لاختيار الغرفة المتاحة من القائمة --</option>
            {Object.entries(roomsGroupedByFloor).map(([floorNum, floorRooms]) => (
              <optgroup key={floorNum} label={`=== الطابق ${floorNum} (${floorRooms.length} غرف متاحة) ===`}>
                {floorRooms.map(r => (
                  <option key={r.number} value={r.number}>
                    غرفة {r.number} - {r.name} ({r.type} | سعة {r.capacity} نزلاء {r.direction ? `| ${r.direction}` : ""})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}

      {/* Hidden input to ensure HTML form validation works if required */}
      {required && (
        <input
          type="text"
          value={selectedRoomNumber}
          required
          readOnly
          className="sr-only"
          tabIndex={-1}
          onChange={() => {}}
        />
      )}
    </div>
  );
};
