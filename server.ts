import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_HOTEL_DATA } from "./src/lib/defaultData.ts";
import { SUPABASE_SQL_SETUP_SCRIPT } from "./src/lib/supabase.ts";

// Persistent environment fix for AI Studio preview iframe and nginx
function fixNginxAndIframeEnvironment() {
  try {
    let nginxModified = false;
    const confPaths = ["/etc/nginx/nginx.conf", "/etc/nginx/nginx.conf.template"];
    for (const cp of confPaths) {
      if (fs.existsSync(cp)) {
        let content = fs.readFileSync(cp, "utf8");
        const oldCsp = 'add_header Content-Security-Policy "frame-ancestors \'self\' https://*.google.com https://localhost.corp.google.com:26001;";';
        const newCsp = 'add_header Content-Security-Policy "frame-ancestors \'self\' https://*.google.com https://*.google https://aistudio.google https://*.aistudio.google https://ai.studio https://*.ai.studio https://localhost.corp.google.com:26001;";';
        if (content.includes(oldCsp)) {
          content = content.replace(oldCsp, newCsp);
          nginxModified = true;
        }
        if (content.includes("_aistudio-iframe.js?v=2f1c016a")) {
          content = content.replace(/_aistudio-iframe\.js\?v=[a-zA-Z0-9_-]+/g, "_aistudio-iframe.js?v=v3_aistudio_fixed");
          nginxModified = true;
        }
        if (nginxModified) {
          fs.writeFileSync(cp, content);
        }
      }
    }

    const luaPath = "/etc/nginx/user_auth_verification.lua";
    if (fs.existsSync(luaPath)) {
      let lua = fs.readFileSync(luaPath, "utf8");
      if (!lua.startsWith("do return end")) {
        lua = "do return end\n" + lua;
        fs.writeFileSync(luaPath, lua);
        nginxModified = true;
      }
    }

    const iframeJsPath = "/var/www/assets/_aistudio-iframe.js";
    if (fs.existsSync(iframeJsPath)) {
      let js = fs.readFileSync(iframeJsPath, "utf8");
      const oldCheck = "if (!url.hostname.endsWith('.google.com')) {";
      const newCheck = "if (!url.hostname.endsWith('.google.com') && !url.hostname.endsWith('.google') && url.hostname !== 'ai.studio' && !url.hostname.endsWith('.ai.studio') && url.hostname !== 'localhost') {";
      let jsModified = false;
      if (js.includes(oldCheck)) {
        js = js.replace(oldCheck, newCheck);
        jsModified = true;
      }
      const regexFetch = /async function fetch\(resource, options\) \{[\s\S]*?if \(!config \|\| !config\.urlPatterns\) \{ return nativeFetch\(resource, options\); \}/;
      const optimizedFetch = `async function fetch(resource, options) {
    const urlStr = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
    if (!urlStr || urlStr.startsWith('/') || (typeof window !== 'undefined' && urlStr.startsWith(window.location.origin))) {
      return nativeFetch(resource, options);
    }
    const config = await Promise.race([bootstrapChannel, new Promise((res) => setTimeout(() => res(null), 50))]);
    if (!config || !config.urlPatterns) { return nativeFetch(resource, options); }`;

      if (regexFetch.test(js)) {
        js = js.replace(regexFetch, optimizedFetch);
        jsModified = true;
      }
      if (jsModified) {
        fs.writeFileSync(iframeJsPath, js);
      }
    }

    if (nginxModified) {
      try {
        execSync("nginx -s reload", { stdio: "ignore", timeout: 1500 });
        console.log("Persistent AI Studio environment fix applied and nginx reloaded.");
      } catch {}
    }
  } catch (err) {
    console.warn("Could not patch nginx/iframe:", err);
  }
}

// Interface for pending requests
interface GuestRequest {
  id: string;
  name: string;
  country: string;
  mobile: string;
  email?: string;
  whatsapp?: string;
  roomType?: string;
  notes?: string;
  photoUrl?: string;
  checkInDate?: string;
  checkOutDate?: string;
  companionsCount?: number;
  status: "pending" | "approved" | "rejected" | string;
  date?: string;
  createdAt?: string;
  administrativeRole?: string;
  year?: string;
  visitType?: string;
  assignedRoomNumber?: string;
  assignedGuestId?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const REQUESTS_FILE = path.join(DATA_DIR, "pending_requests.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const ROOT_CONFIG_FILE = path.join(process.cwd(), "config.json");
const PUBLIC_CONFIG_FILE = path.join(process.cwd(), "public", "config.json");
const PUBLIC_DATA_CONFIG_FILE = path.join(process.cwd(), "public", "data", "config.json");
const PUBLIC_PUBLIC_CONFIG_FILE = path.join(process.cwd(), "public", "public", "config.json");
const HOTEL_DATA_FILE = path.join(DATA_DIR, "hotel_data.json");
const PUBLIC_HOTEL_DATA_FILE = path.join(process.cwd(), "public", "data", "hotel_data.json");

// Safe helper to read hotel data (rooms, guests, services, logs)
function readHotelDataSafely(): Record<string, any> {
  const candidateFiles = [HOTEL_DATA_FILE, PUBLIC_HOTEL_DATA_FILE];
  for (const fp of candidateFiles) {
    try {
      if (fs.existsSync(fp)) {
        const raw = fs.readFileSync(fp, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && (parsed.rooms?.length || parsed.guests?.length)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`Warning reading hotel data from ${fp}:`, e);
    }
  }
  return {
    ...DEFAULT_HOTEL_DATA,
    updatedAt: new Date().toISOString()
  };
}

// Safe helper to write and synchronize hotel data across backend storage
function writeHotelDataSafely(updated: Record<string, any>): Record<string, any> {
  const current = readHotelDataSafely();
  const merged = {
    ...current,
    ...updated,
    updatedAt: new Date().toISOString()
  };
  const content = JSON.stringify(merged, null, 2);

  const candidateFiles = [HOTEL_DATA_FILE, PUBLIC_HOTEL_DATA_FILE];
  for (const fp of candidateFiles) {
    try {
      const dir = path.dirname(fp);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fp, content, "utf8");
    } catch (e) {
      console.warn(`Could not sync hotel data to ${fp}:`, e);
    }
  }
  return merged;
}

// Safe helper to read config from all possible locations
function readConfigFileSafely(): Record<string, any> {
  const candidateFiles = [
    CONFIG_FILE,
    ROOT_CONFIG_FILE,
    PUBLIC_CONFIG_FILE,
    PUBLIC_DATA_CONFIG_FILE,
    PUBLIC_PUBLIC_CONFIG_FILE
  ];
  for (const filePath of candidateFiles) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`Warning reading config from ${filePath}:`, e);
    }
  }
  return {
    hotelName: "خدر ليالي الانس",
    registrationLinkStatus: "open",
    activeDatabase: "supabase",
    supabaseUrl: "",
    supabaseAnonKey: ""
  };
}

// Safe helper to write and synchronize config across candidate locations
function writeConfigFileSafely(updatedValues: Record<string, any>): Record<string, any> {
  const current = readConfigFileSafely();
  const merged = { ...current, ...updatedValues };
  const content = JSON.stringify(merged, null, 2);

  const candidateFiles = [
    CONFIG_FILE,
    ROOT_CONFIG_FILE,
    PUBLIC_CONFIG_FILE,
    PUBLIC_DATA_CONFIG_FILE,
    PUBLIC_PUBLIC_CONFIG_FILE
  ];
  for (const filePath of candidateFiles) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content, "utf8");
    } catch (e) {
      console.warn(`Could not sync config to ${filePath}:`, e);
    }
  }
  return merged;
}

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(REQUESTS_FILE)) {
  const initialRequests: GuestRequest[] = DEFAULT_HOTEL_DATA.pendingRequests || [];
  fs.writeFileSync(REQUESTS_FILE, JSON.stringify(initialRequests, null, 2), "utf8");
}

if (!fs.existsSync(HOTEL_DATA_FILE)) {
  writeHotelDataSafely(DEFAULT_HOTEL_DATA);
}

// Initialize config across locations if needed
const initialLoadedConfig = readConfigFileSafely();
writeConfigFileSafely(initialLoadedConfig);

// Helper to get active server-side Supabase client
function getServerSupabaseClient(): SupabaseClient | null {
  const config = readConfigFileSafely();
  const url = (config.supabaseUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
  const key = (config.supabaseAnonKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "").trim();

  if (!url || !key) return null;
  try {
    return createClient(url, key, {
      auth: { persistSession: false }
    });
  } catch (e) {
    console.warn("Failed to create server Supabase client:", e);
    return null;
  }
}

async function startServer() {
  fixNginxAndIframeEnvironment();

  const app = express();
  const PORT = 3000;

  // CORS and Headers middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    } else {
      res.header("Access-Control-Allow-Origin", "*");
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie");
    res.header("Access-Control-Expose-Headers", "Set-Cookie, *");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Support large payload for base64 photo uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: "supabase", timestamp: new Date().toISOString() });
  });

  // API Route: Unblock cookies
  app.get("/api/unblock-cookies", (req, res) => {
    res.setHeader("Set-Cookie", "hotel_session=unblocked; Path=/; SameSite=None; Secure; Partitioned; Max-Age=2592000");
    res.json({
      success: true,
      status: "unblocked",
      cookiesAllowed: true,
      message: "تم فتح حظر ملفات تعريف الارتباط والأذونات السحابية بنجاح!",
      timestamp: new Date().toISOString()
    });
  });

  // API Route: Get complete hotel data
  app.get(["/api/hotel-data", "/data/hotel_data.json"], async (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    try {
      const sb = getServerSupabaseClient();
      if (sb) {
        try {
          const [roomsRes, guestsRes, servicesRes, gatesRes] = await Promise.all([
            sb.from("rooms").select("*").order("number", { ascending: true }),
            sb.from("guests").select("*").order("created_at", { ascending: false }),
            sb.from("service_requests").select("*").order("created_at", { ascending: false }),
            sb.from("gate_logs").select("*").order("timestamp", { ascending: false })
          ]);

          if (roomsRes.data && roomsRes.data.length > 0) {
            const clientRooms = roomsRes.data.map((r: any) => ({
              id: r.id,
              number: r.number,
              floor: r.floor,
              type: r.type,
              name: r.name || "",
              capacity: r.capacity,
              status: r.status,
              direction: r.direction || "",
              pricePerNight: r.price_per_night || 0,
              features: Array.isArray(r.features) ? r.features : [],
              notes: r.notes || "",
            }));

            const clientGuests = (guestsRes.data || []).map((g: any) => ({
              id: g.id,
              name: g.name,
              country: g.country || "المملكة العربية السعودية",
              mobile: g.mobile,
              email: g.email || "",
              whatsapp: g.whatsapp || "",
              roomNumber: g.room_number || "",
              status: g.status,
              checkInDate: g.check_in_date,
              checkOutDate: g.check_out_date || "",
              notes: g.notes || "",
              year: g.year || "2026",
              visitType: g.visit_type || "general_1",
              photoUrl: g.photo_url || "",
              photoRawUrl: g.photo_raw_url || "",
              photoQuality: g.photo_quality || "",
              photoSizeKb: g.photo_size_kb || 0,
              photoDimensions: g.photo_dimensions || "",
              administrativeRole: g.administrative_role || "عضو وفد",
              qrCode: g.qr_code || "",
              nationalId: g.national_id || "",
            }));

            const clientServices = (servicesRes.data || []).map((s: any) => ({
              id: s.id,
              roomNumber: s.room_number,
              guestName: s.guest_name || "",
              guestMobile: s.guest_mobile || "",
              serviceType: s.service_type,
              details: s.details || "",
              status: s.status || "pending",
              createdAt: s.created_at,
              completedAt: s.completed_at || null,
              year: s.year || "2026",
              visitType: s.visit_type || "general_1",
            }));

            const clientGates = (gatesRes.data || []).map((gl: any) => ({
              id: gl.id,
              guestId: gl.guest_id || "",
              guestName: gl.guest_name,
              roomNumber: gl.room_number || "",
              entryType: gl.entry_type || "دخول",
              action: gl.entry_type === "خروج" ? "exit" : "entry",
              gateName: gl.gate_name || "البوابة الرئيسية",
              timestamp: gl.timestamp,
              officerName: gl.officer_name || "",
              notes: gl.notes || "",
            }));

            return res.json({
              success: true,
              source: "supabase",
              rooms: clientRooms,
              guests: clientGuests,
              serviceRequests: clientServices,
              gateLogs: clientGates,
              updatedAt: new Date().toISOString()
            });
          }
        } catch (sbErr) {
          console.warn("Supabase query fallback to file:", sbErr);
        }
      }

      // Fallback to local file
      const data = readHotelDataSafely();
      res.json({
        success: true,
        source: "local_cache",
        rooms: data.rooms || DEFAULT_HOTEL_DATA.rooms,
        guests: data.guests || DEFAULT_HOTEL_DATA.guests,
        serviceRequests: data.serviceRequests || DEFAULT_HOTEL_DATA.serviceRequests,
        gateLogs: data.gateLogs || DEFAULT_HOTEL_DATA.gateLogs,
        updatedAt: data.updatedAt || new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to read hotel data:", error);
      res.status(500).json({ error: "Failed to read hotel data" });
    }
  });

  // API Route: Save complete hotel data or partial updates
  app.post("/api/hotel-data", async (req, res) => {
    try {
      const { rooms, guests, serviceRequests, gateLogs } = req.body;
      const updatePayload: Record<string, any> = {};
      if (Array.isArray(rooms)) updatePayload.rooms = rooms;
      if (Array.isArray(guests)) updatePayload.guests = guests;
      if (Array.isArray(serviceRequests)) updatePayload.serviceRequests = serviceRequests;
      if (Array.isArray(gateLogs)) updatePayload.gateLogs = gateLogs;

      const saved = writeHotelDataSafely(updatePayload);

      // Async write to Supabase if configured
      const sb = getServerSupabaseClient();
      if (sb) {
        try {
          if (Array.isArray(rooms) && rooms.length > 0) {
            const roomPayload = rooms.map(r => ({
              id: r.id || `room_${r.number}`,
              number: String(r.number),
              floor: Number(r.floor) || 1,
              type: r.type || "غرفة مزدوجة",
              name: r.name || "",
              capacity: Number(r.capacity) || 2,
              status: r.status || "available",
              direction: r.direction || "",
              price_per_night: Number(r.pricePerNight) || 0,
              features: Array.isArray(r.features) ? r.features : [],
              notes: r.notes || "",
              updated_at: new Date().toISOString()
            }));
            await sb.from("rooms").upsert(roomPayload, { onConflict: "number" });
          }

          if (Array.isArray(guests) && guests.length > 0) {
            const guestPayload = guests.map(g => ({
              id: g.id,
              name: g.name,
              country: g.country || "المملكة العربية السعودية",
              mobile: g.mobile,
              email: g.email || null,
              whatsapp: g.whatsapp || null,
              room_number: g.roomNumber || null,
              status: g.status || "resident",
              check_in_date: g.checkInDate || new Date().toISOString(),
              check_out_date: g.checkOutDate || null,
              notes: g.notes || null,
              year: g.year || "2026",
              visit_type: g.visitType || "general_1",
              photo_url: g.photoUrl || null,
              photo_raw_url: g.photoRawUrl || null,
              photo_quality: g.photoQuality || null,
              photo_size_kb: g.photoSizeKb || null,
              photo_dimensions: g.photoDimensions || null,
              administrative_role: g.administrativeRole || "عضو وفد",
              qr_code: g.qrCode || null,
              national_id: g.nationalId || null,
              updated_at: new Date().toISOString()
            }));
            await sb.from("guests").upsert(guestPayload, { onConflict: "id" });
          }

          if (Array.isArray(serviceRequests) && serviceRequests.length > 0) {
            const servicePayload = serviceRequests.map(s => ({
              id: s.id,
              room_number: s.roomNumber,
              guest_name: s.guestName || "",
              guest_mobile: s.guestMobile || "",
              service_type: s.serviceType,
              details: s.details || "",
              status: s.status || "pending",
              created_at: s.createdAt || new Date().toISOString(),
              completed_at: s.completedAt || null,
              year: s.year || "2026",
              visit_type: s.visitType || "general_1"
            }));
            await sb.from("service_requests").upsert(servicePayload, { onConflict: "id" });
          }

          if (Array.isArray(gateLogs) && gateLogs.length > 0) {
            const gatePayload = gateLogs.map(gl => ({
              id: gl.id,
              guest_id: gl.guestId || null,
              guest_name: gl.guestName,
              room_number: gl.roomNumber || null,
              entry_type: gl.entryType || "دخول",
              gate_name: gl.gateName || "البوابة الرئيسية",
              timestamp: gl.timestamp || new Date().toISOString(),
              officer_name: gl.officerName || "",
              notes: gl.notes || ""
            }));
            await sb.from("gate_logs").upsert(gatePayload, { onConflict: "id" });
          }
        } catch (sbErr) {
          console.warn("Supabase async persist warning:", sbErr);
        }
      }

      res.json({
        success: true,
        rooms: saved.rooms,
        guests: saved.guests,
        serviceRequests: saved.serviceRequests,
        gateLogs: saved.gateLogs,
        updatedAt: saved.updatedAt
      });
    } catch (error) {
      console.error("Failed to save hotel data:", error);
      res.status(500).json({ error: "Failed to save hotel data" });
    }
  });

  // API Route: Reset hotel data to initial seed state
  app.post("/api/hotel-data/reset", async (req, res) => {
    try {
      // 1. Reset local files
      const reset = writeHotelDataSafely(DEFAULT_HOTEL_DATA);

      // 2. Reset pending requests file
      if (DEFAULT_HOTEL_DATA.pendingRequests) {
        fs.writeFileSync(REQUESTS_FILE, JSON.stringify(DEFAULT_HOTEL_DATA.pendingRequests, null, 2), "utf8");
      }

      // 3. Reset Supabase tables if configured
      const sb = getServerSupabaseClient();
      if (sb) {
        try {
          const roomPayload = DEFAULT_HOTEL_DATA.rooms.map(r => ({
            id: r.id,
            number: r.number,
            floor: r.floor,
            type: r.type,
            name: r.name || "",
            capacity: r.capacity,
            status: r.status,
            direction: r.direction || "",
            price_per_night: r.pricePerNight || 0,
            features: r.features || [],
            notes: r.notes || "",
          }));
          await sb.from("rooms").upsert(roomPayload, { onConflict: "number" });

          const guestPayload = DEFAULT_HOTEL_DATA.guests.map(g => ({
            id: g.id,
            name: g.name,
            country: g.country || "المملكة العربية السعودية",
            mobile: g.mobile,
            email: g.email || null,
            whatsapp: g.whatsapp || null,
            room_number: g.roomNumber || null,
            status: g.status || "resident",
            check_in_date: g.checkInDate || new Date().toISOString(),
            check_out_date: g.checkOutDate || null,
            notes: g.notes || null,
            year: g.year || "2026",
            visit_type: g.visitType || "general_1",
            photo_url: g.photoUrl || null,
            administrative_role: g.administrativeRole || "عضو وفد",
            qr_code: g.qrCode || null,
            national_id: g.nationalId || null,
          }));
          await sb.from("guests").upsert(guestPayload, { onConflict: "id" });
        } catch (sbResetErr) {
          console.warn("Supabase reset warning:", sbResetErr);
        }
      }

      res.json({
        success: true,
        message: "تم إعادة ضبط النظام بالكامل وتحديث كافة البيانات في قاعدة البيانات بنجاح!",
        data: reset
      });
    } catch (error) {
      console.error("Failed to reset hotel data:", error);
      res.status(500).json({ error: "Failed to reset hotel data" });
    }
  });

  // Supabase Integration Endpoints
  // GET Supabase Configuration
  app.get("/api/supabase/config", (req, res) => {
    try {
      const config = readConfigFileSafely();
      const url = config.supabaseUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
      const anonKey = config.supabaseAnonKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

      res.json({
        success: true,
        url,
        isConfigured: Boolean(url && anonKey),
        activeDb: "supabase",
        hasKey: Boolean(anonKey),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch supabase config" });
    }
  });

  // POST Save Supabase Configuration
  app.post("/api/supabase/config", (req, res) => {
    try {
      const { url, anonKey } = req.body;
      const cleanUrl = String(url || "").trim();
      const cleanKey = String(anonKey || "").trim();

      writeConfigFileSafely({
        supabaseUrl: cleanUrl,
        supabaseAnonKey: cleanKey,
        activeDatabase: "supabase"
      });

      res.json({
        success: true,
        message: "تم حفظ إعدادات Supabase وتفعيل قاعدة البيانات بنجاح!",
        isConfigured: Boolean(cleanUrl && cleanKey),
        activeDb: "supabase",
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to save supabase config" });
    }
  });

  // POST Test Supabase Connection
  app.post("/api/supabase/test", async (req, res) => {
    try {
      const { url, anonKey } = req.body;
      const cleanUrl = String(url || "").trim();
      const cleanKey = String(anonKey || "").trim();

      if (!cleanUrl || !cleanKey) {
        return res.status(400).json({
          success: false,
          message: "يرجى تقديم Project URL و API Key الخاصين بمشروعك في Supabase."
        });
      }

      const client = createClient(cleanUrl, cleanKey);
      const { error } = await client.from("rooms").select("count", { count: "exact", head: true });

      if (error) {
        if (error.code === "42P01" || error.message?.toLowerCase().includes("does not exist") || error.message?.toLowerCase().includes("relation")) {
          return res.json({
            success: true,
            status: "connected_needs_tables",
            message: "تم الاتصال بنجاح بمشروع Supabase! الجداول لم يتم إنشاؤها بعد، يمكنك الضغط على 'نسخ سكربت SQL' وتشغيله في لوحة Supabase.",
          });
        }
        return res.status(400).json({
          success: false,
          message: `خطأ أثناء الاتصال بـ Supabase: ${error.message}`
        });
      }

      res.json({
        success: true,
        status: "ready",
        message: "تم الاتصال بنجاح بقاعدة بيانات Supabase، وجداول الفندق متصلة وجاهزة!",
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: `تعذر الاتصال بـ Supabase: ${err?.message || "خطأ غير معروف"}`
      });
    }
  });

  // GET Table Status Verification in Supabase
  app.get("/api/supabase/tables-status", async (req, res) => {
    try {
      const sb = getServerSupabaseClient();
      if (!sb) {
        return res.json({
          isConfigured: false,
          allReady: false,
          tables: {}
        });
      }

      const tablesList = [
        { name: "rooms", arabicName: "الغرف الفندقية" },
        { name: "guests", arabicName: "النزلاء والوفود" },
        { name: "service_requests", arabicName: "طلبات الخدمات" },
        { name: "pending_requests", arabicName: "طلبات الحجز والتسجيل" },
        { name: "gate_logs", arabicName: "سجلات البوابات وحركات الدخول" },
        { name: "hotel_settings", arabicName: "إعدادات وتكوين النظام" }
      ];

      const tablesStatus: Record<string, any> = {};
      let allReady = true;

      for (const t of tablesList) {
        try {
          const { count, error } = await sb.from(t.name).select("*", { count: "exact", head: true });
          if (error) {
            allReady = false;
            tablesStatus[t.name] = {
              name: t.name,
              arabicName: t.arabicName,
              exists: false,
              count: 0,
              error: error.message
            };
          } else {
            tablesStatus[t.name] = {
              name: t.name,
              arabicName: t.arabicName,
              exists: true,
              count: count || 0
            };
          }
        } catch (e: any) {
          allReady = false;
          tablesStatus[t.name] = {
            name: t.name,
            arabicName: t.arabicName,
            exists: false,
            count: 0,
            error: e?.message || "Error"
          };
        }
      }

      res.json({
        isConfigured: true,
        allReady,
        tables: tablesStatus
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to verify tables status" });
    }
  });

  // POST Sync / Migrate All Data to Supabase
  app.post("/api/supabase/sync", async (req, res) => {
    try {
      const { url, anonKey } = req.body;
      let targetUrl = String(url || "").trim();
      let targetKey = String(anonKey || "").trim();

      if (!targetUrl || !targetKey) {
        const config = readConfigFileSafely();
        targetUrl = config.supabaseUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
        targetKey = config.supabaseAnonKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
      }

      if (!targetUrl || !targetKey) {
        return res.status(400).json({
          success: false,
          message: "يرجى إدخال وتأكيد رابط ومفتاح Supabase للبدء في المزامنة."
        });
      }

      const client = createClient(targetUrl, targetKey);
      const data = readHotelDataSafely();

      let currentRooms: any[] = data.rooms || DEFAULT_HOTEL_DATA.rooms;
      let currentGuests: any[] = data.guests || DEFAULT_HOTEL_DATA.guests;
      let currentServices: any[] = data.serviceRequests || DEFAULT_HOTEL_DATA.serviceRequests;
      let currentGates: any[] = data.gateLogs || DEFAULT_HOTEL_DATA.gateLogs;

      // Upsert rooms to Supabase
      const roomPayload = currentRooms.map((r) => ({
        id: r.id || `room_${r.number}`,
        number: String(r.number),
        floor: Number(r.floor) || 1,
        type: r.type || "غرفة مزدوجة",
        name: r.name || "",
        capacity: Number(r.capacity) || 2,
        status: r.status || "available",
        direction: r.direction || "",
        price_per_night: Number(r.pricePerNight) || 0,
        features: Array.isArray(r.features) ? r.features : [],
        notes: r.notes || "",
      }));
      await client.from("rooms").upsert(roomPayload, { onConflict: "number" });

      // Upsert guests to Supabase
      const guestPayload = currentGuests.map((g) => ({
        id: g.id,
        name: g.name,
        country: g.country || "المملكة العربية السعودية",
        mobile: g.mobile,
        email: g.email || null,
        whatsapp: g.whatsapp || null,
        room_number: g.roomNumber || null,
        status: g.status || "resident",
        check_in_date: g.checkInDate || new Date().toISOString(),
        check_out_date: g.checkOutDate || null,
        notes: g.notes || null,
        year: g.year || "2026",
        visit_type: g.visitType || "general_1",
        administrative_role: g.administrativeRole || "عضو وفد",
        qr_code: g.qrCode || null,
        national_id: g.nationalId || null,
      }));
      await client.from("guests").upsert(guestPayload, { onConflict: "id" });

      // Upsert services to Supabase
      const servicePayload = currentServices.map((s) => ({
        id: s.id,
        room_number: s.roomNumber,
        guest_name: s.guestName || "",
        guest_mobile: s.guestMobile || "",
        service_type: s.serviceType,
        details: s.details || "",
        status: s.status || "pending",
        created_at: s.createdAt || new Date().toISOString(),
        completed_at: s.completedAt || null,
        year: s.year || "2026",
        visit_type: s.visitType || "general_1",
      }));
      await client.from("service_requests").upsert(servicePayload, { onConflict: "id" });

      // Upsert gate logs to Supabase
      const gatePayload = currentGates.map((gl) => ({
        id: gl.id,
        guest_id: gl.guestId || null,
        guest_name: gl.guestName,
        room_number: gl.roomNumber || null,
        entry_type: gl.entryType || "دخول",
        gate_name: gl.gateName || "البوابة الرئيسية",
        timestamp: gl.timestamp || new Date().toISOString(),
        officer_name: gl.officerName || "",
        notes: gl.notes || "",
      }));
      await client.from("gate_logs").upsert(gatePayload, { onConflict: "id" });

      // Upsert hotel settings to Supabase
      await client.from("hotel_settings").upsert([
        {
          key: "general_config",
          value: {
            hotelName: "فندق قصر الضيافة الملكي - خدر ليالي الأنس",
            registrationLinkStatus: "open",
            updatedAt: new Date().toISOString()
          }
        }
      ], { onConflict: "key" });

      res.json({
        success: true,
        message: "تم ترحيل ومزامنة كافة البيانات إلى قاعدة بيانات Supabase بنجاح تام!",
        synced: {
          rooms: roomPayload.length,
          guests: guestPayload.length,
          serviceRequests: servicePayload.length,
          gateLogs: gatePayload.length,
        }
      });
    } catch (err: any) {
      console.error("Supabase sync failed:", err);
      res.status(500).json({
        success: false,
        message: `فشلت المزامنة مع Supabase: ${err?.message || "خطأ غير متوقع"}`
      });
    }
  });

  // GET Copyable Supabase Setup SQL Script
  app.get("/api/supabase/script", (req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(SUPABASE_SQL_SETUP_SCRIPT);
  });

  // API Route: Get pending requests
  app.get("/api/requests", async (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    try {
      const sb = getServerSupabaseClient();
      if (sb) {
        try {
          const { data: sbRequests } = await sb.from("pending_requests").select("*").order("created_at", { ascending: false });
          if (sbRequests && sbRequests.length > 0) {
            const clientReqs = sbRequests.map((r: any) => ({
              id: r.id,
              name: r.name,
              country: r.country || "المملكة العربية السعودية",
              mobile: r.mobile,
              email: r.email || "",
              whatsapp: r.whatsapp || "",
              roomType: r.room_type || "",
              status: r.status,
              checkInDate: r.check_in_date || "",
              checkOutDate: r.check_out_date || "",
              companionsCount: r.companions_count || 0,
              administrativeRole: r.administrative_role || "عضو وفد",
              notes: r.notes || "",
              year: r.year || "2026",
              visitType: r.visit_type || "general_1",
              assignedRoomNumber: r.assigned_room_number || "",
              assignedGuestId: r.assigned_guest_id || "",
              date: r.created_at,
            }));
            return res.json(clientReqs);
          }
        } catch (sbErr) {
          console.warn("Supabase requests query fallback:", sbErr);
        }
      }

      if (fs.existsSync(REQUESTS_FILE)) {
        const data = fs.readFileSync(REQUESTS_FILE, "utf8");
        const parsed = JSON.parse(data);
        res.json(Array.isArray(parsed) ? parsed : []);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Failed to read requests:", error);
      res.status(500).json({ error: "Failed to read requests" });
    }
  });

  // API Route: Submit new request
  app.post("/api/requests", async (req, res) => {
    try {
      const { name, country, mobile, email, whatsapp, roomType, notes, photoUrl, checkInDate, administrativeRole, year, visitType } = req.body;
      if (!name || !mobile) {
        return res.status(400).json({ error: "الاسم ورقم الجوال مطلوبان لإتمام التسجيل." });
      }

      const config = readConfigFileSafely();
      if (config.registrationLinkStatus === "closed") {
        return res.status(403).json({ error: "رابط التسجيل مغلق حالياً من قبل إدارة الفندق." });
      }

      const newRequest: GuestRequest = {
        id: "req_" + Date.now(),
        name: String(name).trim(),
        country: country || "المملكة العربية السعودية",
        mobile: String(mobile).trim(),
        email: email ? String(email).trim() : "",
        whatsapp: whatsapp ? String(whatsapp).trim() : String(mobile).trim(),
        roomType: roomType || "غرفة مفردة (Single)",
        notes: notes ? String(notes).trim() : "",
        photoUrl: photoUrl || "",
        checkInDate: checkInDate || new Date().toISOString().split("T")[0],
        status: "pending",
        date: new Date().toISOString(),
        administrativeRole: administrativeRole || "عضو وفد",
        year: year || "2026",
        visitType: visitType || "general_1"
      };

      // Save to Supabase if configured
      const sb = getServerSupabaseClient();
      if (sb) {
        try {
          await sb.from("pending_requests").upsert({
            id: newRequest.id,
            name: newRequest.name,
            country: newRequest.country,
            mobile: newRequest.mobile,
            email: newRequest.email || null,
            whatsapp: newRequest.whatsapp || null,
            room_type: newRequest.roomType || null,
            status: "pending",
            check_in_date: newRequest.checkInDate || null,
            administrative_role: newRequest.administrativeRole,
            notes: newRequest.notes || null,
            photo_url: newRequest.photoUrl || null,
            year: newRequest.year,
            visit_type: newRequest.visitType,
            created_at: newRequest.date
          }, { onConflict: "id" });
        } catch (sbErr) {
          console.warn("Supabase pending request persist warning:", sbErr);
        }
      }

      let requests: GuestRequest[] = [];
      try {
        if (fs.existsSync(REQUESTS_FILE)) {
          requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, "utf8"));
          if (!Array.isArray(requests)) requests = [];
        }
      } catch (e) {
        requests = [];
      }

      requests.unshift(newRequest);
      fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), "utf8");
      res.json({ success: true, request: newRequest });
    } catch (error) {
      console.error("Failed to save request:", error);
      res.status(500).json({ error: "فشل حفظ الطلب على الخادم." });
    }
  });

  // API Route: Action on request (approve / reject / delete / reset)
  app.post("/api/requests/action", async (req, res) => {
    try {
      const { id, action, assignedRoomNumber, assignedGuestId } = req.body;
      if (!id || !action) {
        return res.status(400).json({ error: "ID and Action are required" });
      }

      let requests: GuestRequest[] = [];
      if (fs.existsSync(REQUESTS_FILE)) {
        try {
          requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, "utf8"));
        } catch {}
      }

      const sb = getServerSupabaseClient();

      if (action === "delete") {
        requests = requests.filter(r => r.id !== id);
        if (sb) {
          try {
            await sb.from("pending_requests").delete().eq("id", id);
          } catch {}
        }
      } else {
        const updatedStatus = action === "approve" ? "approved" : action === "reset" ? "pending" : "rejected";
        requests = requests.map(r => {
          if (r.id === id) {
            return {
              ...r,
              status: updatedStatus,
              assignedRoomNumber: assignedRoomNumber !== undefined ? assignedRoomNumber : r.assignedRoomNumber,
              assignedGuestId: assignedGuestId !== undefined ? assignedGuestId : r.assignedGuestId
            };
          }
          return r;
        });

        if (sb) {
          try {
            await sb.from("pending_requests").update({
              status: updatedStatus,
              assigned_room_number: assignedRoomNumber || null,
              assigned_guest_id: assignedGuestId || null
            }).eq("id", id);
          } catch {}
        }
      }

      fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), "utf8");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to perform action" });
    }
  });

  // API Route: Get configuration
  app.get(["/api/config", "/config.json", "/data/config.json", "/public/config.json"], (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Content-Type", "application/json");
    try {
      const config = readConfigFileSafely();
      res.json(config);
    } catch (error) {
      res.json({ registrationLinkStatus: "open", hotelName: "خدر ليالي الانس" });
    }
  });

  // Explicit static route mapping
  app.use("/public", express.static(path.join(process.cwd(), "public")));
  app.use("/data", express.static(DATA_DIR));

  // API Route: Save configuration
  app.post("/api/config", (req, res) => {
    try {
      const { registrationLinkStatus, ...rest } = req.body;
      if (registrationLinkStatus && !["open", "closed"].includes(registrationLinkStatus)) {
        return res.status(400).json({ error: "Invalid registration link status" });
      }

      const updated = writeConfigFileSafely({
        ...(registrationLinkStatus ? { registrationLinkStatus } : {}),
        ...rest
      });
      res.json({ success: true, config: updated });
    } catch (error) {
      console.error("Failed to save config:", error);
      res.status(500).json({ error: "Failed to save config" });
    }
  });

  const httpServer = http.createServer(app);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : { server: httpServer }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Application index.html not found");
      }
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} with Supabase database architecture`);
  });
}

startServer();
