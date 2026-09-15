import fs from "fs";
import path from "path";

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

function readRequests(): any[] {
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

function saveRequests(list: any[]): void {
  const targetPath = getRequestsFilePath();
  try {
    fs.writeFileSync(targetPath, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    try {
      fs.writeFileSync(path.join("/tmp", "pending_requests.json"), JSON.stringify(list, null, 2), "utf8");
    } catch (e) {
      console.warn("Could not write requests in action:", e);
    }
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
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

    const { id, action, assignedRoomNumber, assignedGuestId } = body || {};
    if (!id || !action) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "ID and Action are required" }));
      return;
    }

    let requests = readRequests();

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

    saveRequests(requests);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true }));
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: "Method not allowed" }));
}
