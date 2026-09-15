import { Room, Guest, PendingRequest, ServiceRequest, GateEntryLog } from "../types";
import { clearStoredToken } from "./firebase";

export const SPREADSHEET_NAME = "خدر ليالي الانس - إدارة الفندق والنظام";

export const SHEET_TABS = {
  ROOMS: "الغرف",
  GUESTS: "النزلاء",
  PENDING_REQUESTS: "طلبات_التسجيل",
  SERVICE_REQUESTS: "طلبات_الخدمات",
  GATE_LOGS: "سجل_البوابة",
  SETTINGS: "الإعدادات",
};

// Initial seed data if sheets are newly created or empty
export const SEED_ROOMS: Room[] = [
  { number: "101", name: "جناح اليمامة الملكي", floor: 1, type: "جناح ملكي (Royal Suite)", capacity: 4, status: "available", direction: "إطلالة بحرية", visitType: "general_1" },
  { number: "102", name: "غرفة الياسمين الراقية", floor: 1, type: "غرفة مزدوجة فاخرة (Double)", capacity: 2, status: "available", direction: "إطلالة على المسبح", visitType: "general_1" },
  { number: "103", name: "غرفة النرجس الهادئة", floor: 1, type: "غرفة مفردة (Single)", capacity: 1, status: "available", direction: "إطلالة داخلية", visitType: "general_1" },
  { number: "201", name: "جناح الريان العائلي", floor: 2, type: "جناح عائلي (Family Suite)", capacity: 6, status: "available", direction: "إطلالة على المدينة", visitType: "general_1" },
  { number: "202", name: "غرفة النخيل الدافئة", floor: 2, type: "غرفة مزدوجة فاخرة (Double)", capacity: 2, status: "available", direction: "إطلالة بحرية", visitType: "general_1" },
  { number: "203", name: "غرفة السدرة البسيطة", floor: 2, type: "غرفة مفردة (Single)", capacity: 1, status: "available", direction: "إطلالة على المدينة", visitType: "general_1" },
  { number: "301", name: "جناح الأندلس الفخم", floor: 3, type: "جناح ملكي (Royal Suite)", capacity: 4, status: "available", direction: "إطلالة بحرية", visitType: "general_1" },
  { number: "302", name: "غرفة الفيروز المطلة", floor: 3, type: "غرفة مزدوجة فاخرة (Double)", capacity: 2, status: "available", direction: "إطلالة على المسبح", visitType: "general_1" },
  { number: "303", name: "غرفة المرجان الكلاسيكية", floor: 3, type: "غرفة مفردة (Single)", capacity: 1, status: "available", direction: "إطلالة داخلية", visitType: "general_1" },
];

export const SEED_GUESTS: Guest[] = [];

/**
 * Standard Column Headers Configuration for all 6 tabs
 */
export const SHEET_HEADERS_CONFIG = {
  [SHEET_TABS.ROOMS]: [
    "رقم الغرفة",
    "اسم الغرفة",
    "الطابق",
    "نوع الغرفة",
    "السعة",
    "الحالة",
    "الاتجاه والإطلالة",
    "نطاق الزيارة"
  ],
  [SHEET_TABS.GUESTS]: [
    "المعرف",
    "الاسم الكامل",
    "الجنسية / البلد",
    "رقم الجوال",
    "رقم الغرفة",
    "الحالة",
    "ملاحظات",
    "تاريخ الدخول",
    "تاريخ الخروج",
    "رابط الصورة",
    "الصفة الإدارية",
    "السنة التشغيلية",
    "نطاق الزيارة",
    "رقم الواتساب",
    "البريد الإلكتروني"
  ],
  [SHEET_TABS.PENDING_REQUESTS]: [
    "معرف الطلب",
    "اسم النزيل",
    "الجنسية / البلد",
    "رقم الجوال",
    "رقم الواتساب",
    "البريد الإلكتروني",
    "نوع الغرفة المطلوبة",
    "الصفة الإدارية",
    "ملاحظات وطلبات",
    "رابط الصورة",
    "حالة الطلب",
    "تاريخ الوصول",
    "تاريخ التقديم",
    "السنة",
    "نطاق الزيارة"
  ],
  [SHEET_TABS.SERVICE_REQUESTS]: [
    "معرف الطلب",
    "رقم الغرفة",
    "اسم النزيل",
    "التصنيف",
    "عنوان الطلب",
    "الوصف والتفاصيل",
    "الأولوية",
    "حالة الطلب",
    "تاريخ الإنشاء",
    "المسؤول / الفني",
    "ملاحظات إضافية",
    "السنة",
    "نطاق الزيارة"
  ],
  [SHEET_TABS.GATE_LOGS]: [
    "معرف الحركة",
    "اسم النزيل",
    "رقم الغرفة",
    "الصفة الإدارية",
    "البلد",
    "الجوال",
    "نوع الحركة",
    "وقت الحركة",
    "الحالة الأمنية",
    "رجل الأمن",
    "ملاحظات",
    "رمز الباركود",
    "معرف النزيل",
    "رابط الصورة"
  ],
  [SHEET_TABS.SETTINGS]: [
    "المفتاح (Key)",
    "القيمة (Value)"
  ]
};

/**
 * Fetch wrapper with timeout and retry logic for robust API calls
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 2, backoff = 600): Promise<Response> {
  const timeoutMs = 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    // If 401 Unauthorized, token has expired on Google's side
    if (res.status === 401) {
      clearStoredToken();
      return res;
    }

    // If rate limited or server error, retry
    if ((res.status === 429 || res.status >= 500) && retries > 0) {
      await new Promise(r => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }

    return res;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (retries > 0 && err.name !== "AbortError") {
      await new Promise(r => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}

/**
 * Extract spreadsheet ID from either a raw ID or full Google Sheets URL
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  // Check if it's a URL like https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Check if it's a URL with id= parameter
  const matchParam = trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (matchParam && matchParam[1]) {
    return matchParam[1];
  }
  // Otherwise assume it's already a clean ID
  return trimmed;
}

/**
 * Helper to query Drive for our custom Spreadsheet or create one
 */
export async function findOrCreateSpreadsheet(accessToken: string): Promise<string> {
  try {
    // 1. Search for the file in user's Drive
    const query = encodeURIComponent(`name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
    
    const searchRes = await fetchWithRetry(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const existingId = searchData.files[0].id;
        localStorage.setItem("spreadsheet_id", existingId);
        // Ensure all tabs and headers exist in the existing sheet
        await ensureSpreadsheetStructure(existingId, accessToken);
        return existingId;
      }
    }

    // 2. If not found, create a new spreadsheet with all correct tabs
    const createUrl = "https://sheets.googleapis.com/v4/spreadsheets";
    const body = {
      properties: {
        title: SPREADSHEET_NAME,
        locale: "ar_SA",
        autoRecalc: "ON_CHANGE",
        timeZone: "Asia/Riyadh"
      },
      sheets: [
        { properties: { title: SHEET_TABS.ROOMS, rightToLeft: true, tabColor: { red: 0.05, green: 0.5, blue: 0.3 } } },
        { properties: { title: SHEET_TABS.GUESTS, rightToLeft: true, tabColor: { red: 0.1, green: 0.6, blue: 0.8 } } },
        { properties: { title: SHEET_TABS.PENDING_REQUESTS, rightToLeft: true, tabColor: { red: 0.9, green: 0.6, blue: 0.1 } } },
        { properties: { title: SHEET_TABS.SERVICE_REQUESTS, rightToLeft: true, tabColor: { red: 0.8, green: 0.3, blue: 0.1 } } },
        { properties: { title: SHEET_TABS.GATE_LOGS, rightToLeft: true, tabColor: { red: 0.3, green: 0.2, blue: 0.6 } } },
        { properties: { title: SHEET_TABS.SETTINGS, rightToLeft: true, tabColor: { red: 0.4, green: 0.4, blue: 0.4 } } },
      ],
    };

    const createRes = await fetchWithRetry(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`فشل إنشاء جدول جديد (${createRes.status}): ${errText}`);
    }

    const createData = await createRes.json();
    const newId = createData.spreadsheetId;
    localStorage.setItem("spreadsheet_id", newId);

    // 3. Initialize headers in all sheets
    await initializeSheetHeaders(newId, accessToken);
    
    return newId;
  } catch (error) {
    console.error("findOrCreateSpreadsheet error:", error);
    throw error;
  }
}

export interface SpreadsheetValidationResult {
  success: boolean;
  spreadsheetId: string;
  title: string;
  sheetsCount?: number;
  tabsVerified?: string[];
  error?: string;
  errorType?: "INVALID_INPUT" | "AUTH_EXPIRED" | "PERMISSION_DENIED" | "NOT_FOUND" | "RATE_LIMIT" | "NETWORK_ERROR" | "UNKNOWN";
}

/**
 * Validates access to an existing custom spreadsheet ID or URL, and ensures its structure
 * Enhanced with comprehensive error classification and self-healing schema checks.
 */
export async function validateAndConnectSpreadsheet(
  spreadsheetInput: string, 
  accessToken: string
): Promise<SpreadsheetValidationResult> {
  try {
    if (!spreadsheetInput || !spreadsheetInput.trim()) {
      return { 
        success: false, 
        spreadsheetId: "", 
        title: "", 
        error: "يرجى إدخال رابط جدول قوقل شيت أو معرّف الجدول (Spreadsheet ID).",
        errorType: "INVALID_INPUT"
      };
    }

    if (!accessToken || !accessToken.trim()) {
      return {
        success: false,
        spreadsheetId: "",
        title: "",
        error: "رمز التحقق الأمني الخاص بقوقل مفقود. يرجى تسجيل الدخول بحساب قوقل أولاً.",
        errorType: "AUTH_EXPIRED"
      };
    }

    const id = extractSpreadsheetId(spreadsheetInput);
    if (!id || id.length < 5) {
      return { 
        success: false, 
        spreadsheetId: "", 
        title: "", 
        error: "معرّف الجدول أو الرابط المدخل غير صالح. يرجى التأكد من نسخ رابط جدول قوقل بشكل كامل وصحيح.",
        errorType: "INVALID_INPUT"
      };
    }

    // 1. Check spreadsheet accessibility & metadata
    const checkRes = await fetchWithRetry(
      `https://sheets.googleapis.com/v4/spreadsheets/${id}?fields=properties(title,locale,timeZone),sheets.properties(sheetId,title)`, 
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!checkRes.ok) {
      if (checkRes.status === 401) {
        return { 
          success: false, 
          spreadsheetId: id, 
          title: "", 
          error: "انتهت صلاحية جلسة تسجيل الدخول بحساب قوقل. يرجى إعادة تسجيل الدخول لتجديد التصريح.",
          errorType: "AUTH_EXPIRED"
        };
      }
      if (checkRes.status === 403) {
        return { 
          success: false, 
          spreadsheetId: id, 
          title: "", 
          error: "تعذّر الوصول إلى الجدول بسبب صلاحيات الأمان. تأكد من منح حسابك إذن التعديل (Editor Access) ومشاركة الملف مع حسابك.",
          errorType: "PERMISSION_DENIED"
        };
      }
      if (checkRes.status === 404) {
        return { 
          success: false, 
          spreadsheetId: id, 
          title: "", 
          error: "لم يتم العثور على جدول قوقل شيت المحدد. تأكد من أن الرابط صحيح وأن الملف غير محذوف من Google Drive.",
          errorType: "NOT_FOUND"
        };
      }
      if (checkRes.status === 429) {
        return { 
          success: false, 
          spreadsheetId: id, 
          title: "", 
          error: "تم تجاوز حد الطلبات في Google Sheets مؤقتاً. يرجى الانتظار بضع ثوانٍ ثم إعادة المحاولة.",
          errorType: "RATE_LIMIT"
        };
      }
      return { 
        success: false, 
        spreadsheetId: id, 
        title: "", 
        error: `فشل التحقق من الجدول (رمز الخطأ: ${checkRes.status}). يرجى التحقق من صلاحيات الملف والمحاولة ثانية.`,
        errorType: "UNKNOWN"
      };
    }

    const data = await checkRes.json();
    const title = data.properties?.title || SPREADSHEET_NAME;
    const existingSheets = (data.sheets || []).map((s: any) => s.properties?.title || "");

    // 2. Ensure all 6 required tabs and column headers exist
    await ensureSpreadsheetStructure(id, accessToken);

    localStorage.setItem("spreadsheet_id", id);
    return { 
      success: true, 
      spreadsheetId: id, 
      title,
      sheetsCount: existingSheets.length,
      tabsVerified: Object.values(SHEET_TABS)
    };
  } catch (error: any) {
    console.error("validateAndConnectSpreadsheet error:", error);
    const isAbort = error.name === "AbortError";
    return { 
      success: false, 
      spreadsheetId: "", 
      title: "", 
      error: isAbort 
        ? "استغرقت عملية الاتصال بقوقل شيت وقتاً أطول من المعتاد (انتهت المهلة). يرجى التحقق من سرعة الإنترنت وإعادة المحاولة."
        : (error.message || "حدث خطأ غير متوقع أثناء الاتصال بجدول قوقل شيت."),
      errorType: isAbort ? "NETWORK_ERROR" : "UNKNOWN"
    };
  }
}

/**
 * Verifies that all required tabs exist in the spreadsheet. If any tab is missing, creates it!
 */
export async function ensureSpreadsheetStructure(spreadsheetId: string, accessToken: string) {
  try {
    const metaRes = await fetchWithRetry(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`, 
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!metaRes.ok) return;
    const meta = await metaRes.json();
    const existingSheetTitles = new Set((meta.sheets || []).map((s: any) => (s.properties?.title || "").trim()));

    const requiredTabs = [
      { title: SHEET_TABS.ROOMS, color: { red: 0.05, green: 0.5, blue: 0.3 } },
      { title: SHEET_TABS.GUESTS, color: { red: 0.1, green: 0.6, blue: 0.8 } },
      { title: SHEET_TABS.PENDING_REQUESTS, color: { red: 0.9, green: 0.6, blue: 0.1 } },
      { title: SHEET_TABS.SERVICE_REQUESTS, color: { red: 0.8, green: 0.3, blue: 0.1 } },
      { title: SHEET_TABS.GATE_LOGS, color: { red: 0.3, green: 0.2, blue: 0.6 } },
      { title: SHEET_TABS.SETTINGS, color: { red: 0.4, green: 0.4, blue: 0.4 } },
    ];

    const requestsToAdd: any[] = [];
    for (const tab of requiredTabs) {
      if (!existingSheetTitles.has(tab.title)) {
        requestsToAdd.push({
          addSheet: {
            properties: {
              title: tab.title,
              rightToLeft: true,
              tabColor: tab.color
            }
          }
        });
      }
    }

    if (requestsToAdd.length > 0) {
      await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests: requestsToAdd }),
      });
    }

    // Always ensure verified row 1 headers exist in all tabs
    await initializeSheetHeaders(spreadsheetId, accessToken);
  } catch (error) {
    console.error("ensureSpreadsheetStructure error:", error);
  }
}

/**
 * Initializes row 1 column headers in all tabs according to the authorized schema
 */
export async function initializeSheetHeaders(spreadsheetId: string, accessToken: string) {
  try {
    const values = {
      valueInputOption: "USER_ENTERED",
      data: [
        {
          range: `${SHEET_TABS.ROOMS}!A1:H1`,
          values: [SHEET_HEADERS_CONFIG[SHEET_TABS.ROOMS]],
        },
        {
          range: `${SHEET_TABS.GUESTS}!A1:O1`,
          values: [SHEET_HEADERS_CONFIG[SHEET_TABS.GUESTS]],
        },
        {
          range: `${SHEET_TABS.PENDING_REQUESTS}!A1:O1`,
          values: [SHEET_HEADERS_CONFIG[SHEET_TABS.PENDING_REQUESTS]],
        },
        {
          range: `${SHEET_TABS.SERVICE_REQUESTS}!A1:M1`,
          values: [SHEET_HEADERS_CONFIG[SHEET_TABS.SERVICE_REQUESTS]],
        },
        {
          range: `${SHEET_TABS.GATE_LOGS}!A1:N1`,
          values: [SHEET_HEADERS_CONFIG[SHEET_TABS.GATE_LOGS]],
        },
        {
          range: `${SHEET_TABS.SETTINGS}!A1:B1`,
          values: [SHEET_HEADERS_CONFIG[SHEET_TABS.SETTINGS]],
        },
      ],
    };

    await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
  } catch (error) {
    console.error("initializeSheetHeaders error:", error);
  }
}

// -------------------------------------------------------------
// ROOMS (الغرف)
// -------------------------------------------------------------

export async function fetchRoomsFromSheets(spreadsheetId: string, accessToken: string): Promise<Room[] | null> {
  try {
    if (!accessToken) return null;
    const res = await fetchWithRetry(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.ROOMS)}!A2:H`, 
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    
    if (!res.ok) {
      if (res.status === 401) {
        clearStoredToken();
        return null;
      }
      return null;
    }
    const data = await res.json();
    if (!data.values || data.values.length === 0) return [];

    return data.values.map((row: any) => ({
      number: String(row[0] || "").trim(),
      name: String(row[1] || "").trim(),
      floor: parseInt(row[2]) || 1,
      type: String(row[3] || "غرفة مفردة").trim(),
      capacity: parseInt(row[4]) || 2,
      status: (row[5] === "occupied" || row[5] === "full" ? row[5] : "available") as Room["status"],
      direction: String(row[6] || "إطلالة داخلية").trim(),
      visitType: (row[7] || "general_1") as Room["visitType"]
    })).filter((r: Room) => r.number.length > 0);
  } catch (error) {
    return null;
  }
}

export async function saveRoomsToSheets(spreadsheetId: string, accessToken: string, rooms: Room[]) {
  try {
    // Clear existing data under headers (open-ended range)
    await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.ROOMS)}!A2:H:clear`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const rows = rooms.map(r => [
      r.number,
      r.name,
      r.floor,
      r.type,
      r.capacity,
      r.status,
      r.direction,
      r.visitType || "general_1"
    ]);

    if (rows.length === 0) return;

    await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.ROOMS)}!A2?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: rows }),
    });
  } catch (error) {
    console.error("saveRoomsToSheets error:", error);
    throw error;
  }
}

// -------------------------------------------------------------
// GUESTS (النزلاء)
// -------------------------------------------------------------

export async function fetchGuestsFromSheets(spreadsheetId: string, accessToken: string): Promise<Guest[] | null> {
  try {
    if (!accessToken) return null;
    const res = await fetchWithRetry(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.GUESTS)}!A2:O`, 
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    
    if (!res.ok) {
      if (res.status === 401) {
        clearStoredToken();
        return null;
      }
      return null;
    }
    const data = await res.json();
    if (!data.values || data.values.length === 0) return [];

    return data.values.map((row: any) => ({
      id: String(row[0] || "").trim(),
      name: String(row[1] || "").trim(),
      country: String(row[2] || "المملكة العربية السعودية").trim(),
      mobile: String(row[3] || "").trim(),
      roomNumber: String(row[4] || "").trim(),
      status: (row[5] === "checked_out" ? "checked_out" : "resident") as Guest["status"],
      notes: String(row[6] || "").trim(),
      checkInDate: String(row[7] || new Date().toISOString()).trim(),
      checkOutDate: row[8] ? String(row[8]).trim() : undefined,
      photoUrl: String(row[9] || "").trim(),
      administrativeRole: String(row[10] || "عضو وفد").trim(),
      year: String(row[11] || "2026").trim(),
      visitType: (row[12] || "general_1") as Guest["visitType"],
      whatsapp: String(row[13] || "").trim(),
      email: row[14] ? String(row[14]).trim() : undefined
    })).filter((g: Guest) => g.id.length > 0 && g.name.length > 0);
  } catch (error) {
    return null;
  }
}

export async function saveGuestsToSheets(spreadsheetId: string, accessToken: string, guests: Guest[]) {
  try {
    await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.GUESTS)}!A2:O:clear`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const rows = guests.map(g => [
      g.id,
      g.name,
      g.country || "المملكة العربية السعودية",
      g.mobile || "",
      g.roomNumber || "",
      g.status,
      g.notes || "",
      g.checkInDate || "",
      g.checkOutDate || "",
      g.photoUrl || "",
      g.administrativeRole || "عضو وفد",
      g.year || "2026",
      g.visitType || "general_1",
      g.whatsapp || "",
      g.email || ""
    ]);

    if (rows.length === 0) return;

    await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.GUESTS)}!A2?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: rows }),
    });
  } catch (error) {
    console.error("saveGuestsToSheets error:", error);
    throw error;
  }
}

// -------------------------------------------------------------
// PENDING REQUESTS (طلبات_التسجيل)
// -------------------------------------------------------------

export async function fetchPendingRequestsFromSheets(spreadsheetId: string, accessToken: string): Promise<PendingRequest[]> {
  try {
    const res = await fetchWithRetry(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.PENDING_REQUESTS)}!A2:O`, 
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.values || data.values.length === 0) return [];

    return data.values.map((row: any) => {
      // Support both 14-column legacy format and 15-column format with roomType
      const hasRoomTypeCol = row.length >= 15;
      return {
        id: String(row[0] || "").trim(),
        name: String(row[1] || "").trim(),
        country: String(row[2] || "المملكة العربية السعودية").trim(),
        mobile: String(row[3] || "").trim(),
        whatsapp: String(row[4] || "").trim(),
        email: row[5] ? String(row[5]).trim() : undefined,
        roomType: hasRoomTypeCol ? (row[6] ? String(row[6]).trim() : undefined) : undefined,
        administrativeRole: String(hasRoomTypeCol ? row[7] : row[6] || "عضو وفد").trim(),
        notes: String(hasRoomTypeCol ? row[8] : row[7] || "").trim(),
        photoUrl: (hasRoomTypeCol ? row[9] : row[8]) ? String(hasRoomTypeCol ? row[9] : row[8]).trim() : undefined,
        status: ((hasRoomTypeCol ? row[10] : row[9]) === "approved" || (hasRoomTypeCol ? row[10] : row[9]) === "rejected" ? (hasRoomTypeCol ? row[10] : row[9]) : "pending") as PendingRequest["status"],
        checkInDate: (hasRoomTypeCol ? row[11] : row[10]) ? String(hasRoomTypeCol ? row[11] : row[10]).trim() : undefined,
        date: String((hasRoomTypeCol ? row[12] : row[11]) || new Date().toISOString()).trim(),
        year: (hasRoomTypeCol ? row[13] : row[12]) ? String(hasRoomTypeCol ? row[13] : row[12]).trim() : "2026",
        visitType: ((hasRoomTypeCol ? row[14] : row[13]) || "general_1") as PendingRequest["visitType"],
      };
    }).filter((r: PendingRequest) => r.id.length > 0 && r.name.length > 0);
  } catch (error) {
    console.error("fetchPendingRequestsFromSheets error:", error);
    return [];
  }
}

export async function savePendingRequestsToSheets(spreadsheetId: string, accessToken: string, requests: PendingRequest[]) {
  try {
    await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.PENDING_REQUESTS)}!A2:O:clear`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const rows = requests.map(r => [
      r.id,
      r.name,
      r.country || "المملكة العربية السعودية",
      r.mobile || "",
      r.whatsapp || "",
      r.email || "",
      r.roomType || "",
      r.administrativeRole || "عضو وفد",
      r.notes || "",
      r.photoUrl || "",
      r.status,
      r.checkInDate || "",
      r.date || "",
      r.year || "2026",
      r.visitType || "general_1"
    ]);

    if (rows.length === 0) return;

    await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.PENDING_REQUESTS)}!A2?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: rows }),
    });
  } catch (error) {
    console.error("savePendingRequestsToSheets error:", error);
    throw error;
  }
}

export async function appendPendingRequestToSheets(spreadsheetId: string, accessToken: string, r: PendingRequest) {
  try {
    const row = [
      r.id,
      r.name,
      r.country || "المملكة العربية السعودية",
      r.mobile || "",
      r.whatsapp || "",
      r.email || "",
      r.roomType || "",
      r.administrativeRole || "عضو وفد",
      r.notes || "",
      r.photoUrl || "",
      r.status,
      r.checkInDate || "",
      r.date || "",
      r.year || "2026",
      r.visitType || "general_1"
    ];

    await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.PENDING_REQUESTS)}!A:O:append?valueInputOption=USER_ENTERED`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [row] }),
    });
  } catch (error) {
    console.error("appendPendingRequestToSheets error:", error);
    throw error;
  }
}

// -------------------------------------------------------------
// SERVICE REQUESTS (طلبات_الخدمات - لجنة الخدمات)
// -------------------------------------------------------------

export async function fetchServiceRequestsFromSheets(spreadsheetId: string, accessToken: string): Promise<ServiceRequest[]> {
  try {
    const res = await fetchWithRetry(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.SERVICE_REQUESTS)}!A2:M`, 
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.values || data.values.length === 0) return [];

    return data.values.map((row: any) => ({
      id: String(row[0] || "").trim(),
      roomNumber: String(row[1] || "").trim(),
      guestName: String(row[2] || "").trim(),
      category: (row[3] || "maintenance") as ServiceRequest["category"],
      title: String(row[4] || "").trim(),
      description: String(row[5] || "").trim(),
      priority: (row[6] || "normal") as ServiceRequest["priority"],
      status: (row[7] || "new") as ServiceRequest["status"],
      createdAt: String(row[8] || new Date().toISOString()).trim(),
      assignedTo: row[9] ? String(row[9]).trim() : undefined,
      notes: row[10] ? String(row[10]).trim() : undefined,
      year: row[11] ? String(row[11]).trim() : "2026",
      visitType: (row[12] || "general_1") as ServiceRequest["visitType"],
    })).filter((s: ServiceRequest) => s.id.length > 0 && s.title.length > 0);
  } catch (error) {
    console.error("fetchServiceRequestsFromSheets error:", error);
    return [];
  }
}

export async function saveServiceRequestsToSheets(spreadsheetId: string, accessToken: string, requests: ServiceRequest[]) {
  try {
    await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.SERVICE_REQUESTS)}!A2:M:clear`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const rows = requests.map(s => [
      s.id,
      s.roomNumber,
      s.guestName,
      s.category,
      s.title,
      s.description,
      s.priority,
      s.status,
      s.createdAt,
      s.assignedTo || "",
      s.notes || "",
      s.year || "2026",
      s.visitType || "general_1"
    ]);

    if (rows.length === 0) return;

    await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.SERVICE_REQUESTS)}!A2?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: rows }),
    });
  } catch (error) {
    console.error("saveServiceRequestsToSheets error:", error);
    throw error;
  }
}

// -------------------------------------------------------------
// GATE LOGS (سجل_البوابة - حركة الأمن والدخول)
// -------------------------------------------------------------

export async function fetchGateLogsFromSheets(spreadsheetId: string, accessToken: string): Promise<GateEntryLog[]> {
  try {
    const res = await fetchWithRetry(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.GATE_LOGS)}!A2:N`, 
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.values || data.values.length === 0) return [];

    return data.values.map((row: any) => ({
      id: String(row[0] || "").trim(),
      guestName: String(row[1] || "").trim(),
      roomNumber: String(row[2] || "").trim(),
      administrativeRole: String(row[3] || "عضو وفد").trim(),
      country: row[4] ? String(row[4]).trim() : undefined,
      mobile: row[5] ? String(row[5]).trim() : undefined,
      action: (row[6] || "verification") as GateEntryLog["action"],
      timestamp: String(row[7] || new Date().toISOString()).trim(),
      status: (row[8] || "granted") as GateEntryLog["status"],
      guardName: row[9] ? String(row[9]).trim() : undefined,
      notes: row[10] ? String(row[10]).trim() : undefined,
      scannedCode: row[11] ? String(row[11]).trim() : undefined,
      guestId: row[12] ? String(row[12]).trim() : undefined,
      photoUrl: row[13] ? String(row[13]).trim() : undefined,
    })).filter((l: GateEntryLog) => l.id.length > 0);
  } catch (error) {
    console.error("fetchGateLogsFromSheets error:", error);
    return [];
  }
}

export async function saveGateLogsToSheets(spreadsheetId: string, accessToken: string, logs: GateEntryLog[]) {
  try {
    await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.GATE_LOGS)}!A2:N:clear`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const rows = logs.map(l => [
      l.id,
      l.guestName,
      l.roomNumber,
      l.administrativeRole || "عضو وفد",
      l.country || "",
      l.mobile || "",
      l.action,
      l.timestamp,
      l.status,
      l.guardName || "",
      l.notes || "",
      l.scannedCode || "",
      l.guestId || "",
      l.photoUrl || ""
    ]);

    if (rows.length === 0) return;

    await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.GATE_LOGS)}!A2?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: rows }),
    });
  } catch (error) {
    console.error("saveGateLogsToSheets error:", error);
    throw error;
  }
}

export async function appendGateLogToSheets(spreadsheetId: string, accessToken: string, l: GateEntryLog) {
  try {
    const row = [
      l.id,
      l.guestName,
      l.roomNumber,
      l.administrativeRole || "عضو وفد",
      l.country || "",
      l.mobile || "",
      l.action,
      l.timestamp,
      l.status,
      l.guardName || "",
      l.notes || "",
      l.scannedCode || "",
      l.guestId || "",
      l.photoUrl || ""
    ];

    await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.GATE_LOGS)}!A:N:append?valueInputOption=USER_ENTERED`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [row] }),
    });
  } catch (error) {
    console.error("appendGateLogToSheets error:", error);
    throw error;
  }
}

// -------------------------------------------------------------
// SETTINGS (الإعدادات)
// -------------------------------------------------------------

export async function fetchSettingsFromSheets(spreadsheetId: string, accessToken: string): Promise<Record<string, string>> {
  try {
    const res = await fetchWithRetry(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.SETTINGS)}!A2:B`, 
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    
    if (!res.ok) return { registrationLinkStatus: "open" };
    const data = await res.json();
    if (!data.values) return { registrationLinkStatus: "open" };

    const config: Record<string, string> = {};
    data.values.forEach((row: any) => {
      if (row[0]) {
        const key = String(row[0]).trim();
        config[key] = row[1] !== undefined ? String(row[1]).trim() : "";
      }
    });
    return config;
  } catch (error) {
    return { registrationLinkStatus: "open" };
  }
}

export async function saveSettingsToSheets(spreadsheetId: string, accessToken: string, key: string, value: string) {
  try {
    const existing = await fetchSettingsFromSheets(spreadsheetId, accessToken);
    existing[key] = value;

    const rows = Object.entries(existing).map(([k, v]) => [k, v]);

    await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.SETTINGS)}!A2:B?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: rows }),
    });
  } catch (error) {
    console.error("saveSettingsToSheets error:", error);
    throw error;
  }
}

export async function saveAllSettingsToSheets(spreadsheetId: string, accessToken: string, settings: Record<string, string>) {
  try {
    const existing = await fetchSettingsFromSheets(spreadsheetId, accessToken);
    const merged = { ...existing, ...settings };
    const rows = Object.entries(merged).map(([k, v]) => [k, v]);

    await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_TABS.SETTINGS)}!A2:B?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: rows }),
    });
  } catch (error) {
    console.error("saveAllSettingsToSheets error:", error);
    throw error;
  }
}
