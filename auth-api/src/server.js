require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("Set JWT_SECRET to a random secret of at least 32 characters in .env");
  process.exit(1);
}
const app = express();
app.use(express.json({ limit: "10kb" }));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false }
}, { timestamps: true });
const User = mongoose.model("User", userSchema);

function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return res.status(401).json({ message: "Bearer token required" });
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch (error) { return res.status(401).json({ message: "Invalid or expired token" }); }
}

app.get("/", (req, res) => res.json({ message: "User Authentication API is running" }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim() || typeof password !== "string") {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) return res.status(409).json({ message: "An account with this email already exists" });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    res.status(201).json({ message: "Registration successful", user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "An account with this email already exists" });
    res.status(500).json({ message: "Could not register user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string") return res.status(400).json({ message: "Email and password are required" });
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: "Invalid email or password" });
    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1h" });
    res.json({ message: "Login successful", token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) { res.status(500).json({ message: "Could not log in" }); }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select("name email createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (error) { res.status(500).json({ message: "Could not fetch profile" }); }
});

const port = process.env.PORT || 5002;
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auth_db")
  .then(() => app.listen(port, () => console.log(`Auth API running at http://localhost:${port}`)))
  .catch((error) => { console.error("MongoDB connection failed:", error.message); process.exit(1); });
