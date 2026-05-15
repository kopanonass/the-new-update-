import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getDb } from "./src/db/index";
import { users, chats, messages } from "./src/db/schema";
import bcrypt from "bcryptjs";
import { eq, desc, asc } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

interface AuthRequest extends Request {
  user?: any;
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  if (token === 'guest_token') {
    req.user = { uid: "guest_user", email: "student@orbit.edu", name: "Student", avatarUrl: null };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure guest user exists
  const ensureGuestUser = async () => {
    try {
      const db = getDb();
      const guest = await db.select().from(users).where(eq(users.uid, "guest_user")).limit(1);
      if (guest.length === 0) {
        await db.insert(users).values({
          uid: "guest_user",
          name: "Student",
          surname: "User",
          idNumber: "0000000000000",
          studentNumber: "GUEST001",
          email: "student@orbit.edu",
          password: "no_password_required",
          emailVerified: 'true',
          createdAt: new Date(),
        });
        console.log("Guest user created");
      }
    } catch (err) {
      console.error("Error ensuring guest user:", err);
    }
  };
  ensureGuestUser();

  const otps = new Map<string, { otp: string, expires: number }>();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Request logger for debugging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date() });
  });

  app.post("/api/register", async (req, res) => {
    const { name, surname, idNumber, studentNumber, email, password } = req.body;

    try {
      const db = getDb();
      
      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        return res.status(409).json({ error: "A user with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const uid = uuidv4();

      await db.insert(users).values({
        uid,
        name,
        surname,
        idNumber,
        studentNumber,
        email,
        password: hashedPassword,
        emailVerified: 'true',
        createdAt: new Date(),
      });

      const token = jwt.sign({ uid, email, name, avatarUrl: null }, JWT_SECRET);
      res.status(201).json({ success: true, token, user: { uid, email, name, avatarUrl: null } });
    } catch (error: any) {
      console.error("Registration Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    try {
      const db = getDb();
      const userList = await db.select().from(users).where(eq(users.email, email));
      
      if (userList.length === 0) {
        console.log(`Login failed: User ${email} not found in database`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = userList[0];

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        console.log(`Login failed: Password mismatch for ${email}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log(`Login successful for ${email}`);
      const token = jwt.sign({ uid: user.uid, email: user.email, name: user.name, avatarUrl: user.avatarUrl }, JWT_SECRET);
      res.json({ token, user: { uid: user.uid, email: user.email, name: user.name, avatarUrl: user.avatarUrl, surname: user.surname, idNumber: user.idNumber, studentNumber: user.studentNumber } });
    } catch (error: any) {
      console.error("Login Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Chat Routes
  app.get("/api/chats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const db = getDb();
      const userChats = await db.select()
        .from(chats)
        .where(eq(chats.userId, req.user.uid))
        .orderBy(desc(chats.updatedAt));
      res.json(userChats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chats", authenticateToken, async (req: AuthRequest, res) => {
    const { title } = req.body;
    try {
      const db = getDb();
      const id = uuidv4();
      await db.insert(chats).values({
        id,
        userId: req.user.uid,
        title: title || "New Conversation",
        updatedAt: new Date(),
      });
      res.status(201).json({ id, title: title || "New Conversation" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/chats/:id", authenticateToken, async (req: AuthRequest, res) => {
    const { title } = req.body;
    try {
      const db = getDb();
      await db.update(chats)
        .set({ title, updatedAt: new Date() })
        .where(eq(chats.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chats/:chatId/messages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const db = getDb();
      const chatMessages = await db.select()
        .from(messages)
        .where(eq(messages.chatId, req.params.chatId))
        .orderBy(asc(messages.createdAt));
      res.json(chatMessages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chats/:chatId/messages", authenticateToken, async (req: AuthRequest, res) => {
    const { role, content, image, action } = req.body;
    try {
      const db = getDb();
      await db.insert(messages).values({
        chatId: req.params.chatId,
        role,
        content,
        image,
        action,
        createdAt: new Date(),
      });
      
      // Update chat's updatedAt
      await db.update(chats)
        .set({ updatedAt: new Date() })
        .where(eq(chats.id, req.params.chatId));

      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const db = getDb();
      const userList = await db.select().from(users).where(eq(users.uid, req.user.uid)).limit(1);
      if (userList.length === 0) return res.status(404).json({ error: "User not found" });
      const user = userList[0];
      res.json({ 
        uid: user.uid, 
        email: user.email, 
        name: user.name, 
        surname: user.surname, 
        idNumber: user.idNumber, 
        studentNumber: user.studentNumber,
        avatarUrl: user.avatarUrl 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/chat", authenticateToken, async (req: AuthRequest, res) => {
    const { prompt, history, image, action, language } = req.body;
    try {
      const { chatWithGemini } = await import("./server/gemini-service");
      
      let finalPrompt = prompt;
      if (action === 'summarize') {
        const isPdf = image?.startsWith('data:application/pdf');
        finalPrompt = `
          You are a professional academic assistant and expert document analyst. 
          Please provide a high-level, "Pro" summary of this ${isPdf ? 'PDF document' : 'image'}.
          
          CRITICAL INSTRUCTIONS:
          1. OCR & EXTRACTION: If the document contains scanned text, images, or handwriting, perform a detailed OCR extraction to ensure no key information is missed.
          2. LANGUAGE: You MUST provide the full summary translated into ${language || 'English'}.
          3. STRUCTURE: Present the information in a highly structured, logical flow.
          
          Follow these strict formatting rules:
          1. TOPIC HEADER: Start with the topic name as a main header (e.g., # TOPIC NAME).
          2. HEADINGS: Use <u> tags to underline the Main Heading and all Sub-headings (e.g., ## <u>Main Heading</u>).
          3. MEANINGS/DEFINITIONS: For any term or concept, write it as: "Term -> Meaning" on its own line.
          4. POINT FORM: Do not write long paragraphs. Summarize all information into clear, professional point forms using bullet points (*) or numbered lists (1.).
          5. KEY POINTS: Use arrows (->) for key takeaways.
          6. SEPARATORS: Use dotted lines (....................) to separate major sections.
          7. STYLE: Write like a professional expert. Be concise but thorough.
        `;
      }
      
      const responseText = await chatWithGemini(finalPrompt, history, image);
      res.json({ text: responseText });
    } catch (error: any) {
      console.error("AI Route Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/profile/avatar", authenticateToken, async (req: AuthRequest, res) => {
    const { avatarUrl } = req.body;
    try {
      const db = getDb();
      await db.update(users)
        .set({ avatarUrl })
        .where(eq(users.uid, req.user.uid));
      res.json({ success: true, avatarUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Forgot Password / Reset Flow (Simulated OTP)

  app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
      const db = getDb();
      const userList = await db.select().from(users).where(eq(users.email, email));
      if (userList.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Generate a simple 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otps.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 }); // 10 mins

      console.log(`OTP for ${email}: ${otp}`); // In real app, send via email
      res.json({ success: true, message: "OTP sent (check server logs for simulation)" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
      const stored = otps.get(email);
      if (!stored || stored.otp !== otp || stored.expires < Date.now()) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      const db = getDb();
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, email));

      otps.delete(email);
      res.json({ success: true, message: "Password reset successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
});
