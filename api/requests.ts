import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://eiuftadyyxmczizxmkin.supabase.co").trim();
  const key = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) return null;
  try {
    return createClient(url, key, { auth: { persistSession: false } });
  } catch {
    return null;
  }
}

function getRequestsFilePath(): string {
  const tmpPath = path.join("/tmp", "pending_requests.json");
  const localDir = path.join(process.cwd(), "data");
  const localPath = path.join(localDir, "pending_requests.json");

  if (process.env.VERCEL) {
    return tmpPath;
  }

  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localPath;
  } catch {
    return tmpPath;
  }
}

function readRequestsLocal(): any[] {
  const tmpPath = path.join("/tmp", "pending_requests.json");
  const localPath = path.join(process.cwd(), "data", "pending_requests.json");

  if (fs.existsSync(tmpPath)) {
    try {
      const raw = fs.readFileSync(tmpPath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  if (fs.existsSync(localPath)) {
    try {
      const raw = fs.readFileSync(localPath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  return [];
}

function saveRequestsLocal(list: any[]): void {
  const targetPath = getRequestsFilePath();
  try {
    fs.writeFileSync(targetPath, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    try {
      fs.writeFileSync(path.join("/tmp", "pending_requests.json"), JSON.stringify(list, null, 2), "utf8");
    } catch (e) {
      console.warn("Could not write requests locally:", e);
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

  const sb = getSupabaseClient();

  if (req.method === "GET") {
    if (sb) {
      try {
        const [resResult, pendingResult] = await Promise.all([
          sb.from("reservations").select("*").order("created_at", { ascending: false }),
          sb.from("pending_requests").select("*").order("created_at", { ascending: false })
        ]);

        const combined = new Map<string, any>();
        if (resResult.data && Array.isArray(resResult.data)) {
          for (const r of resResult.data) {
            combined.set(r.id, {
              id: r.id,
              name: r.name || r.guest_name || "",
              country: r.country || "المملكة العربية السعودية",
              mobile: r.mobile || r.phone || "",
              email: r.email || "",
              whatsapp: r.whatsapp || "",
              roomType: r.room_type || "",
              status: r.status,
              checkInDate: r.check_in_date || r.check_in || "",
              checkOutDate: r.check_out_date || r.check_out || "",
              companionsCount: r.companions_count || 0,
              administrativeRole: r.administrative_role || "عضو وفد",
              notes: r.notes || "",
              year: r.year || "2026",
              visitType: r.visit_type || "general_1",
              assignedRoomNumber: r.assigned_room_number || r.room_number || "",
              assignedGuestId: r.assigned_guest_id || r.guest_id || "",
              date: r.created_at,
            });
          }
        }

        if (pendingResult.data && Array.isArray(pendingResult.data)) {
          for (const r of pendingResult.data) {
            if (!combined.has(r.id)) {
              combined.set(r.id, {
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
              });
            }
          }
        }

        if (combined.size > 0) {
          res.statusCode = 200;
          res.end(JSON.stringify(Array.from(combined.values())));
          return;
        }
      } catch (err) {
        console.warn("Supabase fetch failed in serverless handler:", err);
      }
    }

    const requests = readRequestsLocal();
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

    if (sb) {
      try {
        await sb.from("reservations").delete().eq("id", id);
      } catch {}
      try {
        await sb.from("pending_requests").delete().eq("id", id);
      } catch {}
    }

    const current = readRequestsLocal();
    const updated = current.filter(r => r.id !== id);
    saveRequestsLocal(updated);
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
      roomType: body.roomType || "غرفة مفردة (Single)",
      notes: notes ? String(notes).trim() : "",
      photoUrl: photoUrl || "",
      checkInDate: checkInDate || new Date().toISOString().split("T")[0],
      status: "pending",
      date: new Date().toISOString(),
      administrativeRole: administrativeRole || "عضو وفد",
      year: year || "2026",
      visitType: visitType || "general_1"
    };

    if (sb) {
      const payload = {
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
      };
      try {
        await sb.from("reservations").upsert(payload, { onConflict: "id" });
      } catch {}
      try {
        await sb.from("pending_requests").upsert(payload, { onConflict: "id" });
      } catch {}
    }

    const currentRequests = readRequestsLocal();
    const filtered = currentRequests.filter(r => r.id !== newRequest.id);
    filtered.unshift(newRequest);
    saveRequestsLocal(filtered);

    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, request: newRequest, id: newRequest.id }));
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: "Method not allowed" }));
}
