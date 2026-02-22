import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* ── BookiesAPI credentials ── */
const BOOKIES_BASE = "https://bookiesapi.com/api/get.php";
const BOOKIES_LOGIN = "vectorumiks";
const BOOKIES_TOKEN = "48843-5B4qFOEF2LuRAD7";

/* ── JWT secret ── */
const JWT_SECRET = process.env.JWT_SECRET || "crystalbet_jwt_secret_key_2026";

/* ── Neon SQL client ── */
function getSql() {
  return neon(process.env.DATABASE_URL);
}

/* ── Helpers ── */
function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

function signToken(userId, role) {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: "30d" });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/* ── Auth & User API middleware ── */
function authApiPlugin() {
  return {
    name: "auth-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        /* CORS preflight */
        if (req.method === "OPTIONS") {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
          res.statusCode = 204;
          return res.end();
        }

        const url = new URL(req.url, "http://localhost");
        const path = url.pathname;

        /* ── POST /auth/register ── */
        if (path === "/auth/register" && req.method === "POST") {
          try {
            const sql = getSql();
            const { email, password, name, phone, currency } = await readBody(req);

            if (!email || !password) {
              return json(res, 400, { message: "Email and password are required" });
            }

            const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()}`;
            if (existing.length > 0) {
              return json(res, 409, { message: "Пользователь с таким email уже существует" });
            }

            const hash = bcrypt.hashSync(password, 10);
            const rows = await sql`
              INSERT INTO users (email, password_hash, name, phone, currency, role, balance, created_at, updated_at)
              VALUES (${email.toLowerCase().trim()}, ${hash}, ${name || ""}, ${phone || ""}, ${currency || "RUB"}, 'USER', 0, NOW(), NOW())
              RETURNING id, email, name, phone, currency, role, balance
            `;
            const user = rows[0];
            const accessToken = signToken(user.id, user.role);

            return json(res, 201, { accessToken, user });
          } catch (err) {
            console.error("[v0] register error:", err);
            return json(res, 500, { message: "Ошибка регистрации: " + err.message });
          }
        }

        /* ── POST /auth/login ── */
        if (path === "/auth/login" && req.method === "POST") {
          try {
            const sql = getSql();
            const { email, password } = await readBody(req);

            if (!email || !password) {
              return json(res, 400, { message: "Email and password are required" });
            }

            const rows = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase().trim()}`;
            if (rows.length === 0) {
              return json(res, 401, { message: "Неверный email или пароль" });
            }

            const user = rows[0];
            const valid = bcrypt.compareSync(password, user.password_hash);
            if (!valid) {
              return json(res, 401, { message: "Неверный email или пароль" });
            }

            const accessToken = signToken(user.id, user.role);
            return json(res, 200, {
              accessToken,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                currency: user.currency,
                role: user.role,
                balance: user.balance,
              },
            });
          } catch (err) {
            console.error("[v0] login error:", err);
            return json(res, 500, { message: "Ошибка входа: " + err.message });
          }
        }

        /* ── POST /auth/forgot ── */
        if (path === "/auth/forgot" && req.method === "POST") {
          return json(res, 200, { message: "Инструкция отправлена на email" });
        }

        /* ── POST /auth/reset ── */
        if (path === "/auth/reset" && req.method === "POST") {
          return json(res, 200, { message: "Пароль обновлён" });
        }

        /* ── GET /user/profile ── */
        if (path === "/user/profile" && req.method === "GET") {
          try {
            const authHeader = req.headers.authorization || "";
            const token = authHeader.replace("Bearer ", "");
            const payload = verifyToken(token);

            if (!payload) {
              return json(res, 401, { message: "Unauthorized" });
            }

            const sql = getSql();
            const rows = await sql`SELECT id, email, name, phone, currency, role, balance, created_at FROM users WHERE id = ${payload.sub}`;
            if (rows.length === 0) {
              return json(res, 404, { message: "User not found" });
            }

            return json(res, 200, rows[0]);
          } catch (err) {
            console.error("[v0] profile error:", err);
            return json(res, 500, { message: err.message });
          }
        }

        /* ── POST /user/update-profile ── */
        if (path === "/user/update-profile" && req.method === "POST") {
          try {
            const authHeader = req.headers.authorization || "";
            const token = authHeader.replace("Bearer ", "");
            const payload = verifyToken(token);
            if (!payload) return json(res, 401, { message: "Unauthorized" });

            const sql = getSql();
            const { name, phone } = await readBody(req);
            await sql`UPDATE users SET name = ${name || ""}, phone = ${phone || ""}, updated_at = NOW() WHERE id = ${payload.sub}`;
            const rows = await sql`SELECT id, email, name, phone, currency, role, balance FROM users WHERE id = ${payload.sub}`;
            return json(res, 200, rows[0]);
          } catch (err) {
            return json(res, 500, { message: err.message });
          }
        }

        return next();
      });
    },
  };
}

/* ── BookiesAPI proxy middleware ── */
function bookiesApiPlugin() {
  return {
    name: "bookies-api-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith("/sports/")) return next();

        const url = new URL(req.url, "http://localhost");
        const path = url.pathname;
        const qp = Object.fromEntries(url.searchParams.entries());

        let params = { login: BOOKIES_LOGIN, token: BOOKIES_TOKEN };

        if (path === "/sports/live") {
          params.task = "bet365live";
        } else if (path === "/sports/live/odds") {
          params.task = "liveodds";
          params.bookmaker = qp.bookmaker || "bet365";
          params.game_id = qp.game_id;
        } else if (path === "/sports/prematch") {
          params.task = "pre";
          params.bookmaker = qp.bookmaker || "bet365";
          params.sport = qp.sport || "soccer";
        } else if (path === "/sports/prematch/odds") {
          params.task = "preodds2";
          params.bookmaker = qp.bookmaker || "bet365";
          params.game_id = qp.game_id;
        } else if (path === "/sports/result") {
          params.task = "result";
          params.bookmaker = qp.bookmaker || "bet365";
          params.game_id = qp.game_id;
        } else {
          return next();
        }

        try {
          const qs = new URLSearchParams(params).toString();
          const apiUrl = `${BOOKIES_BASE}?${qs}`;
          const response = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });
          const text = await response.text();

          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.statusCode = response.status;
          res.end(text);
        } catch (err) {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: true, message: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [vue(), authApiPlugin(), bookiesApiPlugin()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
});
