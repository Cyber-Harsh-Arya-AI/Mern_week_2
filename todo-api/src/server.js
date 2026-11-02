require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, default: "" },
  completed: { type: Boolean, default: false }
}, { timestamps: true });
const Task = mongoose.model("Task", taskSchema);

app.get("/", (req, res) => res.json({ message: "To-Do List API is running" }));

app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: "Task title is required" });
    const task = await Task.create({ title, description });
    res.status(201).json(task);
  } catch (error) { res.status(500).json({ message: "Could not create task" }); }
});

app.get("/api/tasks", async (req, res) => {
  try { res.json(await Task.find().sort({ createdAt: -1 })); }
  catch (error) { res.status(500).json({ message: "Could not fetch tasks" }); }
});

app.get("/api/tasks/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid task ID" });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (error) { res.status(500).json({ message: "Could not fetch task" }); }
});

app.patch("/api/tasks/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid task ID" });
    const allowed = ["title", "description", "completed"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (updates.title !== undefined && (typeof updates.title !== "string" || !updates.title.trim())) {
      return res.status(400).json({ message: "Title must not be empty" });
    }
    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (error) { res.status(500).json({ message: "Could not update task" }); }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid task ID" });
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (error) { res.status(500).json({ message: "Could not delete task" }); }
});

const port = process.env.PORT || 5001;
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/todo_db")
  .then(() => app.listen(port, () => console.log(`To-Do API running at http://localhost:${port}`)))
  .catch((error) => { console.error("MongoDB connection failed:", error.message); process.exit(1); });
