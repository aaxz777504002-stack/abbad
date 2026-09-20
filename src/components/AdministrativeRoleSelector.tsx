import React, { useState } from "react";
import { 
  Sparkles, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Award
} from "lucide-react";
import { getAdminRoleBadge } from "../App";

interface AdministrativeRoleSelectorProps {
  roles: string[];
  selectedRole: string;
  onSelectRole: (role: string) => void;
  onRolesChange: (newRoles: string[]) => void;
  onNotification?: (type: "success" | "error" | "info", msg: string) => void;
  label?: string;
  required?: boolean;
}

export const AdministrativeRoleSelector: React.FC<AdministrativeRoleSelectorProps> = ({
  roles,
  selectedRole,
  onSelectRole,
  onRolesChange,
  onNotification,
  label = "الصفة / الدور الإداري للنزيل",
  required = true
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeletingConfirm, setIsDeletingConfirm] = useState(false);

  const [newRoleInput, setNewRoleInput] = useState("");
  const [editRoleInput, setEditRoleInput] = useState("");

  // Handle adding a new role
  const handleStartAdd = () => {
    setNewRoleInput("");
    setIsAdding(true);
    setIsEditing(false);
    setIsDeletingConfirm(false);
  };

  const handleConfirmAdd = () => {
    const trimmed = newRoleInput.trim();
    if (!trimmed) {
      onNotification?.("error", "يرجى كتابة مسمى الصفة أو الدور الإداري.");
      return;
    }

    if (roles.includes(trimmed)) {
      onNotification?.("error", `الصفة "${trimmed}" موجودة بالفعل في القائمة.`);
      onSelectRole(trimmed);
      setIsAdding(false);
      return;
    }

    const updated = [...roles, trimmed];
    onRolesChange(updated);
    onSelectRole(trimmed);
    setIsAdding(false);
    setNewRoleInput("");
    onNotification?.("success", `تمت إضافة الصفة الإدارية "${trimmed}" بنجاح.`);
  };

  // Handle editing the currently selected role
  const handleStartEdit = () => {
    if (!selectedRole) {
      onNotification?.("error", "يرجى تحديد صفة لتعديلها.");
      return;
    }
    setEditRoleInput(selectedRole);
    setIsEditing(true);
    setIsAdding(false);
    setIsDeletingConfirm(false);
  };

  const handleConfirmEdit = () => {
    const trimmed = editRoleInput.trim();
    if (!trimmed) {
      onNotification?.("error", "يرجى كتابة مسمى الصفة الجديد.");
      return;
    }

    if (trimmed === selectedRole) {
      setIsEditing(false);
      return;
    }

    if (roles.includes(trimmed) && trimmed !== selectedRole) {
      onNotification?.("error", `الصفة "${trimmed}" موجودة بالفعل.`);
      return;
    }

    const updated = roles.map(r => (r === selectedRole ? trimmed : r));
    onRolesChange(updated);
    onSelectRole(trimmed);
    setIsEditing(false);
    onNotification?.("success", `تم تعديل الصفة من "${selectedRole}" إلى "${trimmed}" بنجاح.`);
  };

  // Handle deleting the currently selected role
  const handleStartDelete = () => {
    if (!selectedRole) {
      onNotification?.("error", "يرجى تحديد صفة لحذفها.");
      return;
    }
    if (roles.length <= 1) {
      onNotification?.("error", "لا يمكن حذف جميع الصفات، يجب الإبقاء على صفة واحدة على الأقل.");
      return;
    }
    setIsDeletingConfirm(true);
    setIsAdding(false);
    setIsEditing(false);
  };

  const handleConfirmDelete = () => {
    const roleToDelete = selectedRole;
    const updated = roles.filter(r => r !== roleToDelete);
    onRolesChange(updated);
    // Select the first remaining role
    const nextRole = updated[0] || "";
    onSelectRole(nextRole);
    setIsDeletingConfirm(false);
    onNotification?.("success", `تم حذف الصفة "${roleToDelete}" من القائمة بنجاح.`);
  };

  return (
    <div className="bg-slate-50/90 rounded-2xl border-2 border-slate-200/90 p-4 space-y-3.5 shadow-xs">
      {/* Header with Title and Current Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-black text-slate-800 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-indigo-600/10 border border-indigo-600/20 text-indigo-700 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </span>
          <span>{label}</span>
          {required && <span className="text-rose-600 font-bold">*</span>}
        </label>

        <div className="flex items-center gap-2">
          {getAdminRoleBadge(selectedRole)}
        </div>
      </div>

      {/* Main Selector + 3 Action Buttons (إضافة - تعديل - حذف) */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Dropdown Selector */}
          <div className="relative flex-1">
            <select
              value={selectedRole}
              onChange={(e) => onSelectRole(e.target.value)}
              className="w-full bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none transition shadow-2xs"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons: زر إضافة - زر تعديل - زر حذف */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            {/* 1. زر إضافة */}
            <button
              type="button"
              onClick={handleStartAdd}
              title="إضافة صفة إدارية جديدة إلى القائمة"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                isAdding
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>إضافة صفة</span>
            </button>

            {/* 2. زر تعديل */}
            <button
              type="button"
              onClick={handleStartEdit}
              title="تعديل مسمى الصفة المحددة حالياً"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                isEditing
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>تعديل</span>
            </button>

            {/* 3. زر حذف */}
            <button
              type="button"
              onClick={handleStartDelete}
              title="حذف الصفة المحددة من القائمة"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                isDeletingConfirm
                  ? "bg-rose-700 text-white shadow-xs"
                  : "bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف</span>
            </button>
          </div>
        </div>

        {/* Panel 1: Inline Form for Adding New Role */}
        {isAdding && (
          <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between text-xs font-black text-emerald-900">
              <span className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-700" />
                <span>إضافة صفة / دور إداري جديد للقائمة</span>
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={newRoleInput}
                onChange={(e) => setNewRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmAdd();
                  }
                }}
                placeholder="اكتب الصفة الجديدة (مثال: مستشار إعلامي، طبيب البعثة، إلخ)..."
                className="flex-1 bg-white border-2 border-emerald-400 focus:border-emerald-600 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
              />
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>حفظ الإضافة</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1.5 bg-white text-slate-600 hover:bg-slate-100 border border-slate-300 text-xs font-bold rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Panel 2: Inline Form for Editing Selected Role */}
        {isEditing && (
          <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between text-xs font-black text-amber-900">
              <span className="flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                <span>تعديل مسمى الصفة: <strong className="underline">{selectedRole}</strong></span>
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={editRoleInput}
                onChange={(e) => setEditRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirmEdit();
                  }
                }}
                placeholder="أدخل المسمى المعدل للصفة..."
                className="flex-1 bg-white border-2 border-amber-400 focus:border-amber-600 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
              />
              <button
                type="button"
                onClick={handleConfirmEdit}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>حفظ التعديل</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1.5 bg-white text-slate-600 hover:bg-slate-100 border border-slate-300 text-xs font-bold rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Panel 3: Confirmation Form for Deleting Role */}
        {isDeletingConfirm && (
          <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2 text-xs font-black text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>هل أنت متأكد من حذف الصفة <span className="bg-white px-2 py-0.5 rounded border border-rose-300 text-rose-800 font-black">"{selectedRole}"</span> نهائياً من القائمة؟</span>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>نعم، حذف نهائي</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDeletingConfirm(false)}
                className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 text-xs font-bold rounded-lg cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
