import { Room, Guest } from "../types";

// بيانات الغرف الافتراضية الأولية للنظام
export const SEED_ROOMS: Room[] = [
  { number: "101", name: "جناح اليمامة الملكي", floor: 1, type: "جناح ملكي (Royal Suite)", capacity: 4, status: "occupied", direction: "إطلالة بحرية", visitType: "general_1" },
  { number: "102", name: "غرفة الياسمين الراقية", floor: 1, type: "غرفة مزدوجة فاخرة (Double)", capacity: 2, status: "available", direction: "إطلالة على المسبح", visitType: "general_1" },
  { number: "103", name: "غرفة النرجس الهادئة", floor: 1, type: "غرفة مفردة (Single)", capacity: 1, status: "available", direction: "إطلالة داخلية", visitType: "general_1" },
  { number: "201", name: "جناح الريان العائلي", floor: 2, type: "جناح عائلي (Family Suite)", capacity: 6, status: "available", direction: "إطلالة على المدينة", visitType: "general_1" },
  { number: "202", name: "غرفة النخيل الدافئة", floor: 2, type: "غرفة مزدوجة فاخرة (Double)", capacity: 2, status: "occupied", direction: "إطلالة بحرية", visitType: "general_1" },
  { number: "203", name: "غرفة السدرة البسيطة", floor: 2, type: "غرفة مفردة (Single)", capacity: 1, status: "available", direction: "إطلالة على المدينة", visitType: "general_1" },
  { number: "301", name: "جناح الأندلس الفخم", floor: 3, type: "جناح ملكي (Royal Suite)", capacity: 4, status: "occupied", direction: "إطلالة بحرية", visitType: "general_1" },
  { number: "302", name: "غرفة الفيروز المطلة", floor: 3, type: "غرفة مزدوجة فاخرة (Double)", capacity: 2, status: "available", direction: "إطلالة على المسبح", visitType: "general_1" },
  { number: "303", name: "غرفة المرجان الكلاسيكية", floor: 3, type: "غرفة مفردة (Single)", capacity: 1, status: "available", direction: "إطلالة داخلية", visitType: "general_1" },
  { number: "401", name: "جناح القمة البانورامي", floor: 4, type: "جناح ملكي (Royal Suite)", capacity: 4, status: "available", direction: "إطلالة بانورامية كاملة", visitType: "general_1" },
  { number: "402", name: "غرفة الزمرد التنفيذية", floor: 4, type: "غرفة مزدوجة فاخرة (Double)", capacity: 2, status: "available", direction: "إطلالة على المدينة", visitType: "general_1" },
  { number: "403", name: "غرفة اللؤلؤ الهادئة", floor: 4, type: "غرفة مفردة (Single)", capacity: 1, status: "available", direction: "إطلالة داخلية", visitType: "general_1" }
];

// بيانات النزلاء الافتراضية الأولية للنظام
export const SEED_GUESTS: Guest[] = [
  {
    id: "G-101",
    name: "د. عبد الرحمن بن فهد الشمري",
    country: "المملكة العربية السعودية",
    mobile: "+966501234567",
    whatsapp: "+966501234567",
    roomNumber: "101",
    status: "resident",
    administrativeRole: "رئيس الوفد",
    visitType: "general_1",
    year: "2026",
    checkInDate: "2026-09-15",
    photoUrl: "/logo.jpg",
    notes: "رئيس الوفد الرسمي - ضيافة ملكية خاصة"
  },
  {
    id: "G-202",
    name: "م. طارق بن خالد المنصور",
    country: "دولة الكويت",
    mobile: "+96599887766",
    whatsapp: "+96599887766",
    roomNumber: "202",
    status: "resident",
    administrativeRole: "نائب رئيس الوفد",
    visitType: "general_1",
    year: "2026",
    checkInDate: "2026-09-16",
    photoUrl: "",
    notes: "عضو وفد دبلوماسي رفيع"
  },
  {
    id: "G-301",
    name: "سعادة الشيخ فيصل بن حمد النعيمي",
    country: "الإمارات العربية المتحدة",
    mobile: "+971509876543",
    whatsapp: "+971509876543",
    roomNumber: "301",
    status: "resident",
    administrativeRole: "ضيف شرف (VIP)",
    visitType: "general_1",
    year: "2026",
    checkInDate: "2026-09-14",
    photoUrl: "",
    notes: "ضيف شرف خاص - حجز الجناح الملكي بالكامل"
  }
];
