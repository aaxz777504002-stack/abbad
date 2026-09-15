import React, { useState, useRef, useEffect } from "react";
import { 
  CountryInfo, 
  COUNTRIES_DATA, 
  findCountryByNameOrText, 
  normalizeSearchText 
} from "../lib/countryCodes";
import { Globe, ChevronDown, Search, Check, Sparkles, X } from "lucide-react";

interface CountrySelectInputProps {
  label?: string;
  value: string;
  onChange: (countryName: string, countryInfo?: CountryInfo) => void;
  onCountrySelected?: (countryInfo: CountryInfo) => void;
  required?: boolean;
  theme?: "dark" | "light";
  id?: string;
  placeholder?: string;
}

type RegionFilter = "all" | "arab" | "gcc" | "europe_americas" | "asia_africa";

export const CountrySelectInput: React.FC<CountrySelectInputProps> = ({
  label = "الجنسية / بلد الإقامة",
  value,
  onChange,
  onCountrySelected,
  required = false,
  theme = "dark",
  id,
  placeholder = "اختر أو اكتب بلد الإقامة أو الجنسية..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<RegionFilter>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const matchedCountry = findCountryByNameOrText(value) || COUNTRIES_DATA[0];
  const isDark = theme === "dark";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredCountries = COUNTRIES_DATA.filter(c => {
    // 1. Tab filter
    if (activeTab === "arab" && !c.isArab) return false;
    if (activeTab === "gcc" && !c.isGCC) return false;
    if (activeTab === "europe_americas" && c.region !== "europe" && c.region !== "americas") return false;
    if (activeTab === "asia_africa" && c.region !== "asia" && c.region !== "africa" && c.region !== "oceania") return false;

    // 2. Search filter
    if (!searchQuery.trim()) return true;
    const q = normalizeSearchText(searchQuery);
    return (
      normalizeSearchText(c.nameAr).includes(q) ||
      normalizeSearchText(c.shortNameAr).includes(q) ||
      normalizeSearchText(c.nameEn).includes(q) ||
      c.cleanDialCode.includes(q.replace(/[^\d]/g, "")) ||
      c.aliases.some(a => normalizeSearchText(a).includes(q))
    );
  });

  const handleSelect = (c: CountryInfo) => {
    onChange(c.nameAr, c);
    if (onCountrySelected) {
      onCountrySelected(c);
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleCustomTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const txt = e.target.value;
    const recognized = findCountryByNameOrText(txt);
    onChange(txt, recognized || undefined);
    if (recognized && onCountrySelected) {
      onCountrySelected(recognized);
    }
  };

  return (
    <div className="space-y-1.5" id={id} ref={dropdownRef}>
      <label className={`block text-xs font-semibold flex items-center justify-between ${
        isDark ? "text-slate-300" : "text-slate-700"
      }`}>
        <span className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>{label}</span>
          {required && <span className="text-rose-400 font-normal">*</span>}
        </span>

        {matchedCountry && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border transition ${
            isDark 
              ? "bg-slate-800/80 text-emerald-300 border-slate-700/80" 
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}>
            <span>{matchedCountry.flag}</span>
            <span>الرمز الدولي:</span>
            <span className="font-mono text-[9px] dir-ltr" dir="ltr">{matchedCountry.dialCode}</span>
          </span>
        )}
      </label>

      <div className="relative">
        <div className="flex items-stretch rounded-xl overflow-hidden shadow-sm">
          {/* Flag Preview / Quick Selector Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-r-xl border border-l-0 text-xs font-bold transition shrink-0 cursor-pointer select-none ${
              isDark
                ? "bg-slate-800/90 hover:bg-slate-750 text-slate-200 border-slate-700/70"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
            }`}
            title="تصفح قائمة جميع البلدان العربية والأجنبية"
          >
            <span className="text-base leading-none">{matchedCountry ? matchedCountry.flag : "🌍"}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Text Input allowing custom typing or search */}
          <input
            type="text"
            required={required}
            value={value}
            onChange={handleCustomTextChange}
            placeholder={placeholder}
            className={`flex-1 rounded-l-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition border ${
              isDark
                ? "bg-slate-900/80 border-slate-700/70 text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                : "bg-white border-slate-200 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            }`}
          />
        </div>

        {/* Dropdown Popup List with Tabs */}
        {isOpen && (
          <div 
            className={`absolute top-full right-0 mt-1.5 w-full sm:w-[380px] max-w-[95vw] rounded-2xl shadow-2xl border z-50 overflow-hidden text-right animate-in fade-in zoom-in duration-150 ${
              isDark 
                ? "bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/80" 
                : "bg-white border-slate-200 text-slate-800 shadow-xl"
            }`}
            dir="rtl"
          >
            {/* Search Box */}
            <div className={`p-2.5 border-b ${isDark ? "border-slate-800 bg-slate-950/60" : "border-slate-100 bg-slate-50"}`}>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="ابحث بالدولة أو الجنسية (مثال: سعودي، مصر، فرنسا، أمريكا)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full pr-8 pl-8 py-1.5 rounded-xl text-xs outline-none font-semibold ${
                    isDark 
                      ? "bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:border-emerald-500" 
                      : "bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500"
                  }`}
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-0.5 scrollbar-none text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                    activeTab === "all"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  الكل ({COUNTRIES_DATA.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("arab")}
                  className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                    activeTab === "arab"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  🌴 الدول العربية
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("gcc")}
                  className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                    activeTab === "gcc"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  👑 الخليج
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("europe_americas")}
                  className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                    activeTab === "europe_americas"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  🌍 أوروبا وأمريكا
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("asia_africa")}
                  className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                    activeTab === "asia_africa"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  🌏 آسيا وأفريقيا
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
              {filteredCountries.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 font-medium">
                  لا توجد دولة مطابقة لخيارات البحث
                </div>
              ) : (
                filteredCountries.map(c => {
                  const isSelected = value === c.nameAr || value === c.shortNameAr;
                  return (
                    <button
                      key={c.code + "_" + c.dialCode + "_" + c.nameAr}
                      type="button"
                      onClick={() => handleSelect(c)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                        isSelected
                          ? isDark
                            ? "bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800/80"
                            : "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200"
                          : isDark
                            ? "hover:bg-slate-800 text-slate-200"
                            : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">{c.flag}</span>
                        <div className="flex flex-col text-right truncate">
                          <span className="truncate font-semibold">{c.nameAr}</span>
                          <span className={`text-[10px] truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            {c.nameEn}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px] text-emerald-400" dir="ltr">
                        <span>{c.dialCode}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <p className={`text-[10px] flex items-center gap-1 ${
        isDark ? "text-slate-400" : "text-slate-500"
      }`}>
        <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
        <span>
          قائمة شاملة لكافة الدول العربية والأجنبية مع التحديث التلقائي لرمز الهاتف والواتساب.
        </span>
      </p>
    </div>
  );
};
