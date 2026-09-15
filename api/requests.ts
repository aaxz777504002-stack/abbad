import fs from "fs";
import path from "path";

function getRequestsFilePath(): string {
  // On Vercel, only /tmp is writable
  const tmpPath = path.join("/tmp", "pending_requests.json");
  const localDir = path.join(process.cwd(), "data");
  const localPath = path.join(localDir, "pending_requests.json");

  if (process.env.VERCEL) {
    return tmpPath;
  }

  // If local data exists and is writable, use it, otherwise fallback to /tmp
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localPath;
  } catch {
    return tmpPath;
  }
}

function readRequests(): any[] {
  const tmpPath = path.join("/tmp", "pending_requests.json");
  const localPath = path.join(process.cwd(), "data", "pending_requests.json");

  // Try tmp first (latest updates on Vercel)
  if (fs.existsSync(tmpPath)) {
    try {
      const raw = fs.readFileSync(tmpPath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  // Fallback to local
  if (fs.existsSync(localPath)) {
    try {
      const raw = fs.readFileSync(localPath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  return [];
}

function saveRequests(list: any[]): void {
  const targetPath = getRequestsFilePath();
  try {
    fs.writeFileSync(targetPath, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    // If saving to local failed, try /tmp
    try {
      fs.writeFileSync(path.join("/tmp", "pending_requests.json"), JSON.stringify(list, null, 2), "utf8");
    } catch (e) {
      console.warn("Could not write requests:", e);
    }
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method === "GET") {
    const requests = readRequests();
    res.statusCode = 200;
    res.end(JSON.stringify(requests));
    return;
  }

  if (req.method === "DELETE") {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const id = url.searchParams.get("id") || req.body?.id;
    if (!id) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Request ID is required for deletion" }));
      return;
    }
    const current = readRequests();
    const updated = current.filter(r => r.id !== id);
    saveRequests(updated);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, removedId: id }));
    return;
  }

  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const { name, country, mobile, email, whatsapp, notes, photoUrl, checkInDate, administrativeRole, year, visitType } = body;
    if (!name || !mobile) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "الاسم ورقم الجوال مطلوبان لإتمام التسجيل." }));
      return;
    }

    const newRequest = {
      id: body.id || ("req_" + Date.now()),
      name: String(name).trim(),
      country: country || "المملكة العربية السعودية",
      mobile: String(mobile).trim(),
      email: email ? String(email).trim() : "",
      whatsapp: whatsapp ? String(whatsapp).trim() : String(mobile).trim(),
      notes: notes ? String(notes).trim() : "",
      photoUrl: photoUrl || "",
      checkInDate: checkInDate || new Date().toISOString().split("T")[0],
      status: "pending",
      date: new Date().toISOString(),
      administrativeRole: administrativeRole || "عضو وفد",
      year: year || "2026",
      visitType: visitType || "general_1"
    };

    const currentRequests = readRequests();
    // Prepend new request, avoiding duplicates
    const filtered = currentRequests.filter(r => r.id !== newRequest.id);
    filtered.unshift(newRequest);
    saveRequests(filtered);

    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, request: newRequest, id: newRequest.id }));
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: "Method not allowed" }));
}
