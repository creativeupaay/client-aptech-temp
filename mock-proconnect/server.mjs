import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5175;
const HOST = process.env.HOST || "0.0.0.0";
const HTML_FILE = path.join(__dirname, "index.html");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  // Allow cross-origin requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse requested path
  const urlPath = req.url ? req.url.split("?")[0] : "/";
  let filePath = path.join(__dirname, urlPath === "/" ? "index.html" : urlPath);

  // Security check: prevent directory traversal
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(__dirname)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("403 Forbidden");
    return;
  }

  // Fallback to index.html for SPA or root access
  if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
    filePath = HTML_FILE;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(`500 Internal Server Error: ${err.message}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "text/html; charset=utf-8";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    res.end(content);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`🎓 Aptech ProConnect Mock IdP Portal Active`);
  console.log(`📡 Local Portal URL:    http://localhost:${PORT}`);
  console.log(`🎯 Target TBX App:      http://localhost:5173`);
  console.log(`⚡ TBX Backend API:     http://localhost:8000`);
  console.log(`======================================================\n`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use. Please terminate any existing process on port ${PORT}.`);
  } else {
    console.error(`❌ Server error:`, err);
  }
});
