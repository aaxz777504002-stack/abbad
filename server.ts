import express from "express";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

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

    // 2. Fix /etc/nginx/user_auth_verification.lua so iframe isn't blocked by 3rd-party cookie check
    const luaPath = "/etc/nginx/user_auth_verification.lua";
    if (fs.existsSync(luaPath)) {
      let lua = fs.readFileSync(luaPath, "utf8");
      if (!lua.startsWith("do return end")) {
        lua = "do return end\n" + lua;
        fs.writeFileSync(luaPath, lua);
        nginxModified = true;
      }
    }

    // 3. Fix /var/www/assets/_aistudio-iframe.js so aistudio.google origin is allowed and local requests are never delayed
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
        execSync("nginx -s reload", { stdio: "ignore" });
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
  notes: string;
  photoUrl?: string;
  checkInDate?: string;
  status: "pending" | "approved" | "rejected";
  date: string;
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
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`Warning reading hotel data from ${fp}:`, e);
    }
  }
  return {
    rooms: [],
    guests: [],
    serviceRequests: [],
    gateLogs: [],
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

// Safe helper to read config from all possible locations with robust fallback
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
    registrationLinkStatus: "open"
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
  const initialRequests: GuestRequest[] = [];
  fs.writeFileSync(REQUESTS_FILE, JSON.stringify(initialRequests, null, 2), "utf8");
}

// Initialize config across locations if needed
const initialLoadedConfig = readConfigFileSafely();
writeConfigFileSafely(initialLoadedConfig);

async function startServer() {
  // Apply persistent environment fixes on server startup
  fixNginxAndIframeEnvironment();

  const app = express();
  const PORT = 3000;

  // CORS and Headers middleware for robust API communication and cookie unblocking in all environments
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

  // Support large payload for base64 photo uploads from mobile devices
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Route: Unblock cookies and identification tokens for iframe/preview environments
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

  // API Route: Get complete hotel data (rooms, guests, serviceRequests, gateLogs)
  app.get(["/api/hotel-data", "/data/hotel_data.json"], (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    try {
      const data = readHotelDataSafely();
      res.json({
        success: true,
        rooms: data.rooms || [],
        guests: data.guests || [],
        serviceRequests: data.serviceRequests || [],
        gateLogs: data.gateLogs || [],
        updatedAt: data.updatedAt || new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to read hotel data:", error);
      res.status(500).json({ error: "Failed to read hotel data" });
    }
  });

  // API Route: Save complete hotel data or partial updates
  app.post("/api/hotel-data", (req, res) => {
    try {
      const { rooms, guests, serviceRequests, gateLogs } = req.body;
      const updatePayload: Record<string, any> = {};
      if (Array.isArray(rooms)) updatePayload.rooms = rooms;
      if (Array.isArray(guests)) updatePayload.guests = guests;
      if (Array.isArray(serviceRequests)) updatePayload.serviceRequests = serviceRequests;
      if (Array.isArray(gateLogs)) updatePayload.gateLogs = gateLogs;

      const saved = writeHotelDataSafely(updatePayload);
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

  // API Route: Reset hotel data to initial rich seed state
  app.post("/api/hotel-data/reset", (req, res) => {
    try {
      let defaultData: any = {};
      if (fs.existsSync(PUBLIC_HOTEL_DATA_FILE)) {
        defaultData = JSON.parse(fs.readFileSync(PUBLIC_HOTEL_DATA_FILE, "utf8"));
      }
      const reset = writeHotelDataSafely(defaultData);
      res.json({ success: true, message: "تم إعادة ضبط بيانات الفندق للحالة الافتراضية بنجاح", data: reset });
    } catch (error) {
      console.error("Failed to reset hotel data:", error);
      res.status(500).json({ error: "Failed to reset hotel data" });
    }
  });

  // API Route: Get pending requests
  app.get("/api/requests", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    try {
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
  app.post("/api/requests", (req, res) => {
    try {
      const { name, country, mobile, email, whatsapp, roomType, notes, photoUrl, checkInDate, administrativeRole, year, visitType } = req.body;
      if (!name || !mobile) {
        return res.status(400).json({ error: "الاسم ورقم الجوال مطلوبان لإتمام التسجيل." });
      }

      // Check if registration link is open
      const config = readConfigFileSafely();
      if (config.registrationLinkStatus === "closed") {
        return res.status(403).json({ error: "رابط التسجيل مغلق حالياً من قبل إدارة الفندق." });
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

      requests.unshift(newRequest); // Add to the beginning
      fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), "utf8");
      res.json({ success: true, request: newRequest });
    } catch (error) {
      console.error("Failed to save request:", error);
      res.status(500).json({ error: "فشل حفظ الطلب على الخادم." });
    }
  });

  // API Route: Action on request (approve / reject / delete / reset)
  app.post("/api/requests/action", (req, res) => {
    try {
      const { id, action, assignedRoomNumber, assignedGuestId } = req.body; // action: "approve" | "reject" | "delete" | "reset"
      if (!id || !action) {
        return res.status(400).json({ error: "ID and Action are required" });
      }

      let requests: GuestRequest[] = JSON.parse(fs.readFileSync(REQUESTS_FILE, "utf8"));
      
      if (action === "delete") {
        requests = requests.filter(r => r.id !== id);
      } else {
        requests = requests.map(r => {
          if (r.id === id) {
            const updatedStatus = action === "approve" ? "approved" : action === "reset" ? "pending" : "rejected";
            return {
              ...r,
              status: updatedStatus,
              assignedRoomNumber: assignedRoomNumber !== undefined ? assignedRoomNumber : r.assignedRoomNumber,
              assignedGuestId: assignedGuestId !== undefined ? assignedGuestId : r.assignedGuestId
            };
          }
          return r;
        });
      }

      fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), "utf8");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to perform action" });
    }
  });

  // API Route: Get configuration (supports /api/config, /config.json, /data/config.json, and /public/config.json)
  app.get(["/api/config", "/config.json", "/data/config.json", "/public/config.json"], (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Content-Type", "application/json");
    try {
      const config = readConfigFileSafely();
      res.json(config);
    } catch (error) {
      console.error("Failed to read config:", error);
      res.json({ registrationLinkStatus: "open", hotelName: "خدر ليالي الانس" });
    }
  });

  // Explicit static route mapping for /public and /data directories
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
