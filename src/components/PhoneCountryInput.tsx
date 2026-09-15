import React, { useState, useRef, useEffect } from "react";
import { 
  CountryInfo, 
  COUNTRIES_DATA, 
  findCountryByDialCode, 
  findCountryByNameOrText, 
  formatPhoneWithCountryCode,
  normalizeSearchText 
} from "../lib/countryCodes";
import { ChevronDown, Search, Check, Sparkles, Phone, MessageCircle, X } from "lucide-react";

interface PhoneCountryInputProps {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  onCountryChange?: (countryName: string, countryInfo: CountryInfo) => void;
  countryName?: string;
  placeholder?: string;
  required?: boolean;
  theme?: "dark" | "light";
  type?: "whatsapp" | "mobile" | "general";
  id?: string;
}

type RegionFilter = "all" | "arab" | "gcc" | "europe_americas" | "asia_africa";

export const PhoneCountryInput: React.FC<PhoneCountryInputProps> = ({
  label,
  value,
  onChange,
  onCountryChange,
  countryName,
  placeholder,
  required = false,
  theme = "dark",
  type = "general",
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<RegionFilter>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Determine current active country from dial code in phone or from countryName prop
  const detectedFromPhone = findCountryByDialCode(value);
  const detectedFromName = countryName ? findCountryByNameOrText(countryName) : null;
  const activeCountry: CountryInfo = detectedFromPhone || detectedFromName || COUNTRIES_DATA[0];

  // Close dropdown on outside click
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

  // Filter countries for dropdown search and tab filter
  const filteredCountries = COUNTRIES_DATA.filter(c => {
    // 1. Tab filter
    if (activeTab === "arab" && !c.isArab) return false;
    if (activeTab === "gcc" && !c.isGCC) return false;
    if (activeTab === "europe_americas" && c.region !== "europe" && c.region !== "americas") return false;
    if (activeTab === "asia_africa" && c.region !== "asia" && c.region !== "africa" && c.region !== "oceania") return false;

    // 2. Search query
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

  // Handle direct text typing in input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    onChange(rawVal);

    // Auto-detect country if dial code entered/changed
    const detected = findCountryByDialCode(rawVal);
    if (detected && onCountryChange) {
      onCountryChange(detected.nameAr, detected);
    }
  };

  // Handle selecting a country from the dropdown
  const handleSelectCountry = (country: CountryInfo) => {
    setIsOpen(false);
    setSearchQuery("");
    const formatted = formatPhoneWithCountryCode(value, country);
    onChange(formatted);
    if (onCountryChange) {
      onCountryChange(country.nameAr, country);
    }
  };

  const isDark = theme === "dark";

  return (
    <div className="space-y-1.5" id={id}>
      <label className={`block text-xs font-semibold flex items-center justify-between ${
        isDark ? "text-slate-300" : "text-slate-700"
      }`}>
        <span className="flex items-center gap-1.5">
          {type === "whatsapp" ? (
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>{label}</span>
          {required && <span className="text-rose-400 font-normal">*</span>}
        </span>

        {/* Live Detected Country Indicator Badge */}
        {activeCountry && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border transition ${
            isDark 
              ? "bg-slate-800/80 text-emerald-300 border-slate-700/80" 
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}>
            <span>{activeCountry.flag}</span>
            <span>{activeCountry.shortNameAr}</span>
            <span className="font-mono text-[9px] opacity-75 dir-ltr" dir="ltr">{activeCountry.dialCode}</span>
          </span>
        )}
      </label>

      {/* Input Group with Integrated Country Selector Button */}
      <div className="relative flex items-stretch rounded-xl overflow-visible shadow-sm" ref={dropdownRef}>
        
        {/* Country Flag & Dial Code Dropdown Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-r-xl border border-l-0 text-xs font-bold transition shrink-0 cursor-pointer select-none ${
            isDark
              ? "bg-slate-800/90 hover:bg-slate-750 text-slate-200 border-slate-700/70"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
          }`}
          title="تغيير كود الدولة والرمز الدولي"
        >
          <span className="text-base leading-none">{activeCountry.flag}</span>
          <span className="font-mono text-xs text-emerald-400 dir-ltr font-bold" dir="ltr">
            {activeCountry.dialCode}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Phone / WhatsApp Input Field */}
        <input
          type="tel"
          required={required}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder || activeCountry.example || "مثال: 9665xxxxxxxx+"}
          className={`flex-1 rounded-l-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition text-left dir-ltr font-mono border ${
            isDark
              ? "bg-slate-900/80 border-slate-700/70 text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              : "bg-white border-slate-200 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          }`}
          dir="ltr"
        />

        {/* Dropdown Popup Menu */}
        {isOpen && (
          <div 
            className={`absolute top-full right-0 mt-1.5 w-full sm:w-[360px] max-w-[95vw] rounded-2xl shadow-2xl border z-50 overflow-hidden text-right animate-in fade-in zoom-in duration-150 ${
              isDark 
                ? "bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/80" 
                : "bg-white border-slate-200 text-slate-800 shadow-xl"
            }`}
            dir="rtl"
          >
            {/* Dropdown Search Input */}
            <div className={`p-2.5 border-b ${isDark ? "border-slate-800 bg-slate-950/60" : "border-slate-100 bg-slate-50"}`}>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="ابحث بالاسم أو الرمز (مثال: مصر، 966، كويت)..."
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
                  className={`px-2 py-0.5 rounded-lg transition whitespace-nowrap ${
                    activeTab === "all"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("arab")}
                  className={`px-2 py-0.5 rounded-lg transition whitespace-nowrap ${
                    activeTab === "arab"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  🌴 العرب
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("gcc")}
                  className={`px-2 py-0.5 rounded-lg transition whitespace-nowrap ${
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
                  className={`px-2 py-0.5 rounded-lg transition whitespace-nowrap ${
                    activeTab === "europe_americas"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  🌍 أوروبا/أمريكا
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("asia_africa")}
                  className={`px-2 py-0.5 rounded-lg transition whitespace-nowrap ${
                    activeTab === "asia_africa"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  🌏 آسيا/أفريقيا
                </button>
              </div>
            </div>

            {/* Countries List */}
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
              {filteredCountries.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 font-medium">
                  لا توجد دولة مطابقة للبحث
                </div>
              ) : (
                filteredCountries.map(country => {
                  const isSelected = activeCountry.code === country.code;
                  return (
                    <button
                      key={country.code + "_" + country.dialCode + "_" + country.nameAr}
                      type="button"
                      onClick={() => handleSelectCountry(country)}
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
                        <span className="text-base shrink-0">{country.flag}</span>
                        <div className="flex flex-col text-right truncate">
                          <span className="truncate font-semibold text-xs">{country.nameAr}</span>
                          <span className={`text-[10px] truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            {country.nameEn}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px] text-emerald-400" dir="ltr">
                        <span>{country.dialCode}</span>
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

      {/* Helper text linking notice */}
      <p className={`text-[10px] flex items-center gap-1 ${
        isDark ? "text-slate-400" : "text-slate-500"
      }`}>
        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
        <span>
          عند كتابة أو اختيار رمز الدولة يتحدّث حقل <strong>الجنسية / بلد الإقامة</strong> تلقائياً.
        </span>
      </p>
    </div>
  );
};
