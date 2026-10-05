import React, { useState } from "react";
import { 
  AlertTriangle, 
  Trash2, 
  UserMinus, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  Archive, 
  DoorOpen 
} from "lucide-react";
import { Guest, Room } from "../types";

interface GuestRemovalModalProps {
  isOpen: boolean;
  guest: Guest | null;
  room?: Room | null;
  onClose: () => void;
  onExcludeGuest: (guestId: string) => void; // رمزية 1: استبعاد النزيل
  onPermanentDelete: (guestId: string) => void; // رمزية 2: حذف نهائي
}

export const GuestRemovalModal: React.FC<GuestRemovalModalProps> = ({
  isOpen,
  guest,
  room,
  onClose,
  onExcludeGuest,
  onPermanentDelete
}) => {
  const [selectedAction, setSelectedAction] = useState<"exclude" | "delete" | null>(null);

  if (!isOpen || !guest) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 text-right border border-slate-200"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-base text-slate-900">
                إجراءات إنهاء الإقامة أو حذف السجل
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                اختر نوع الإجراء المطلوب تطبيقه على النزيل
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest Summary Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center">
              {guest.photoUrl ? (
                <img 
                  src={guest.photoUrl} 
                  alt={guest.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-slate-500 font-black text-sm">{guest.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900">{guest.name}</h4>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                <span>غرفة {guest.roomNumber}</span>
                <span>•</span>
                <span>{guest.administrativeRole || "عضو وفد"}</span>
                <span>•</span>
                <span className={guest.status === "resident" ? "text-emerald-700 font-bold" : "text-slate-400"}>
                  {guest.status === "resident" ? "مقيم حالياً" : "مغادر"}
                </span>
              </div>
            </div>
          </div>

          <div className="text-left font-mono text-xs font-bold text-slate-500">
            {guest.mobile}
          </div>
        </div>

        {/* The Two Distinct Action Choices: رمزية 1 و رمزية 2 */}
        <div className="space-y-3">
          <p className="text-xs font-black text-slate-700">
            حدد الخيار المناسب (رمزية 1 أو رمزية 2):
          </p>

          {/* Option 1: رمزية 1 - استبعاد النزيل */}
          <div
            onClick={() => setSelectedAction("exclude")}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative space-y-2 ${
              selectedAction === "exclude"
                ? "bg-amber-50/90 border-amber-500 shadow-sm ring-2 ring-amber-400/20"
                : "bg-slate-50/60 border-slate-200 hover:border-amber-400 hover:bg-amber-50/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-black">
                  رمزية 1
                </span>
                <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
                  <UserMinus className="w-4 h-4 text-amber-700" />
                  <span>استبعاد النزيل (مغادرة وتحرير الغرفة)</span>
                </h4>
              </div>

              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedAction === "exclude"
                  ? "border-amber-600 bg-amber-600 text-white"
                  : "border-slate-300 bg-white"
              }`}>
                {selectedAction === "exclude" && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
              </div>
            </div>

            <p className="text-xs text-amber-900/80 leading-relaxed font-medium pr-1">
              يقوم هذا الإجراء بتحويل حالة النزيل إلى <strong className="text-amber-950">مغادر (تسجيل خروج)</strong> وتحرير الغرفة فوراً لتصبح شاغرة وجاهزة لتسكين نزيل آخر، مع <strong className="text-amber-950">الاحتفاظ بكافة السجلات والبيانات والبطاقة في أرشيف الفندق</strong> للرجوع إليها مستقبلاً.
            </p>
          </div>

          {/* Option 2: رمزية 2 - حذف نهائي */}
          <div
            onClick={() => setSelectedAction("delete")}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative space-y-2 ${
              selectedAction === "delete"
                ? "bg-rose-50/90 border-rose-500 shadow-sm ring-2 ring-rose-400/20"
                : "bg-slate-50/60 border-slate-200 hover:border-rose-400 hover:bg-rose-50/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black">
                  رمزية 2
                </span>
                <h4 className="font-extrabold text-sm text-rose-950 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-rose-700" />
                  <span>حذف نهائي (مسح كلي وشامل من النظام)</span>
                </h4>
              </div>

              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedAction === "delete"
                  ? "border-rose-600 bg-rose-600 text-white"
                  : "border-slate-300 bg-white"
              }`}>
                {selectedAction === "delete" && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
              </div>
            </div>

            <p className="text-xs text-rose-900/80 leading-relaxed font-medium pr-1">
              يقوم هذا الإجراء بـ <strong className="text-rose-950">حذف ومسح سجل النزيل بالكامل ونهائياً</strong> من قاعدة البيانات والسجلات السحابية وتفريغ الغرفة، <strong className="text-rose-950">ولا يمكن استرجاع بيانات النزيل بعد تنفيذ هذا الخيار</strong>.
            </p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            إلغاء التراجع
          </button>

          {selectedAction === "exclude" && (
            <button
              type="button"
              onClick={() => {
                onExcludeGuest(guest.id);
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <UserMinus className="w-4 h-4" />
              <span>تأكيد استبعاد النزيل (رمزية 1)</span>
            </button>
          )}

          {selectedAction === "delete" && (
            <button
              type="button"
              onClick={() => {
                onPermanentDelete(guest.id);
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>تأكيد الحذف النهائي (رمزية 2)</span>
            </button>
          )}

          {!selectedAction && (
            <button
              type="button"
              disabled
              className="px-5 py-2.5 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed"
            >
              اختر إجراء للمتابعة
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
