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
app.use(express.json({ limit: "20kb" }));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false }
}, { timestamps: true });
const User = mongoose.model("User", userSchema);

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  content: { type: String, trim: true, default: "", maxlength: 20000 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }
}, { timestamps: true });
const Note = mongoose.model("Note", noteSchema);

function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return res.status(401).json({ message: "Bearer token required" });
  try { req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET); next(); }
  catch (error) { return res.status(401).json({ message: "Invalid or expired token" }); }
}

app.get("/", (req, res) => res.json({ message: "Notes App API is running" }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim() || typeof password !== "string") return res.status(400).json({ message: "Name, email, and password are required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: "Email already registered" });
    const user = await User.create({ name, email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ message: "Registration successful", user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Email already registered" });
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

app.use("/api/notes", authenticateToken);

app.post("/api/notes", async (req, res) => {
  try {
    const { title, content } = req.body;
    if (typeof title !== "string" || !title.trim()) return res.status(400).json({ message: "Note title is required" });
    const note = await Note.create({ title, content, owner: req.user.sub });
    res.status(201).json(note);
  } catch (error) { res.status(500).json({ message: "Could not create note" }); }
});

app.get("/api/notes", async (req, res) => {
  try { res.json(await Note.find({ owner: req.user.sub }).sort({ updatedAt: -1 })); }
  catch (error) { res.status(500).json({ message: "Could not fetch notes" }); }
});

app.get("/api/notes/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid note ID" });
    const note = await Note.findOne({ _id: req.params.id, owner: req.user.sub });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch (error) { res.status(500).json({ message: "Could not fetch note" }); }
});

app.patch("/api/notes/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid note ID" });
    const updates = {};
    if (req.body.title !== undefined) {
      if (typeof req.body.title !== "string" || !req.body.title.trim()) return res.status(400).json({ message: "Title must not be empty" });
      updates.title = req.body.title;
    }
    if (req.body.content !== undefined) {
      if (typeof req.body.content !== "string") return res.status(400).json({ message: "Content must be text" });
      updates.content = req.body.content;
    }
    const note = await Note.findOneAndUpdate({ _id: req.params.id, owner: req.user.sub }, updates, { new: true, runValidators: true });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch (error) { res.status(500).json({ message: "Could not update note" }); }
});

app.delete("/api/notes/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid note ID" });
    const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user.sub });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Note deleted successfully" });
  } catch (error) { res.status(500).json({ message: "Could not delete note" }); }
});

const port = process.env.PORT || 5003;
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/notes_db")
  .then(() => app.listen(port, () => console.log(`Notes API running at http://localhost:${port}`)))
  .catch((error) => { console.error("MongoDB connection failed:", error.message); process.exit(1); });
