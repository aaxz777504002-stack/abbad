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
  const [viewMode, setViewMode] = useState<"compact" | "grid">("compact");

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

  // Selected room object
  const currentSelectedRoom = useMemo(() => {
    return rooms.find(r => r.number === selectedRoomNumber);
  }, [rooms, selectedRoomNumber]);

  // Calculate current occupants in a room
  const getOccupantCount = (roomNum: string) => {
    return guests.filter(g => g.roomNumber === roomNum && g.status === "resident").length;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-3.5 text-right">
      {/* Header: Clean, Disciplined Label and Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-slate-900">
              <span>{label}</span>
              {required && <span className="text-rose-600 font-black">*</span>}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              تسكين فوري منضبط واختيار الغرفة المتاحة والجاهزة لاستقبال النزيل
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{availableRooms.length} غرفة متاحة</span>
          </span>

          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center text-xs">
            <button
              type="button"
              onClick={() => setViewMode("compact")}
              title="عرض منضبط وموجز"
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === "compact"
                  ? "bg-white text-emerald-800 shadow-2xs font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>قائمة منضبطة</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="عرض الشبكة المرتبة"
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-emerald-800 shadow-2xs font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>شبكة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Room Confirmation Card (Clean, disciplined style) */}
      {currentSelectedRoom ? (
        <div className="bg-emerald-50/60 border border-emerald-300/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white font-mono font-black text-xs flex flex-col items-center justify-center shrink-0 border border-emerald-900 shadow-2xs">
              <span className="text-[8px] uppercase tracking-wider text-emerald-200">غرفة</span>
              <span className="text-sm font-black leading-none">{currentSelectedRoom.number}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xs text-slate-900">
                  {currentSelectedRoom.name || `الغرفة ${currentSelectedRoom.number}`}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  {currentSelectedRoom.type || "غرفة فندقية"}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>تم التعيين للتسكين</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-medium">
                <span>الطابق {currentSelectedRoom.floor || 1}</span>
                <span>•</span>
                <span>السعة: {currentSelectedRoom.capacity || 1} نزلاء</span>
                {currentSelectedRoom.direction && (
                  <>
                    <span>•</span>
                    <span>{currentSelectedRoom.direction}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectRoom("")}
            className="self-end sm:self-auto px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>إلغاء التعيين</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2 text-xs text-slate-600">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>اختر غرفة فندقية من القائمة أدناه لتعيينها وتسكين النزيل فيها فوراً.</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث برقم الغرفة، الاسم أو النوع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl pr-8 pl-3 py-1.5 text-xs font-medium outline-none transition text-slate-800 placeholder-slate-400"
          />
        </div>

        {uniqueFloors.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedFloor("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                selectedFloor === "all"
                  ? "bg-slate-800 text-white shadow-2xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              كافة الطوابق
            </button>
            {uniqueFloors.map(floorNum => (
              <button
                key={floorNum}
                type="button"
                onClick={() => setSelectedFloor(String(floorNum))}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedFloor === String(floorNum)
                    ? "bg-emerald-800 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                ط {floorNum}
              </button>
            ))}
          </div>
        )}

        {uniqueTypes.length > 1 && (
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none focus:border-emerald-600"
          >
            <option value="all">كافة الأنواع</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      {/* Main Room Selection View */}
      {availableRooms.length === 0 ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center space-y-1">
          <p className="text-xs font-black text-rose-800">لا توجد غرف فندقية شاغرة حالياً</p>
          <p className="text-[11px] text-rose-600 font-medium">
            جميع غرف الفندق مشغولة بالكامل. يمكنك مراجعة لوحة النزلاء لتفريغ الغرف المغادرة أو زيادة السعة.
          </p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-slate-500 text-xs">
          لا توجد غرف تطابق البحث أو التصفية الحالية.
        </div>
      ) : viewMode === "compact" ? (
        /* Disciplined, Clean Compact List Table */
        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100">
          {filteredRooms.map((room) => {
            const isSelected = selectedRoomNumber === room.number;
            const currentOccupants = getOccupantCount(room.number);
            return (
              <div
                key={room.number}
                onClick={() => onSelectRoom(room.number)}
                className={`p-2.5 sm:px-3 sm:py-2 flex items-center justify-between gap-3 cursor-pointer transition text-xs ${
                  isSelected
                    ? "bg-emerald-50 text-emerald-950 font-black"
                    : "hover:bg-slate-50 text-slate-800 font-medium"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg font-mono font-black text-xs flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? "bg-emerald-800 text-white border-emerald-900"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}>
                    {room.number}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>غرفة {room.number}</span>
                      {room.name && <span className="text-slate-500 font-normal">({room.name})</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal flex items-center gap-2">
                      <span>{room.type}</span>
                      <span>•</span>
                      <span>الطابق {room.floor}</span>
                      {room.direction && (
                        <>
                          <span>•</span>
                          <span>{room.direction}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-[11px] text-slate-500 text-left font-medium">
                    <span>السعة: {currentOccupants}/{room.capacity}</span>
                  </div>

                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition ${
                    isSelected
                      ? "bg-emerald-700 border-emerald-800 text-white"
                      : "border-slate-300 bg-white text-transparent hover:border-slate-400"
                  }`}>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Disciplined Grid Cards */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-0.5">
          {filteredRooms.map((room) => {
            const isSelected = selectedRoomNumber === room.number;
            return (
              <button
                key={room.number}
                type="button"
                onClick={() => onSelectRoom(room.number)}
                className={`p-2.5 rounded-xl border text-right transition flex flex-col justify-between gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-emerald-800 border-emerald-700 text-white shadow-xs"
                    : "bg-slate-50/70 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-slate-800"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-black ${isSelected ? "text-amber-300" : "text-slate-900"}`}>
                    غرفة {room.number}
                  </span>
                  {isSelected ? (
                    <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </div>

                <div className={`text-[11px] font-bold truncate ${isSelected ? "text-white" : "text-slate-700"}`}>
                  {room.name || room.type}
                </div>

                <div className={`text-[10px] pt-1 border-t flex items-center justify-between w-full font-medium ${
                  isSelected ? "border-emerald-700/60 text-emerald-200" : "border-slate-200 text-slate-400"
                }`}>
                  <span>طابق {room.floor}</span>
                  <span>سعة {room.capacity}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Hidden input for form validation */}
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
