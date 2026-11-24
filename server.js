const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify({ projects: [], tasks: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    console.error("Could not read database:", error);
    return { projects: [], tasks: [] };
  }
}

function writeData(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get("/api/data", (req, res) => {
  res.json(readData());
});

app.put("/api/data", (req, res) => {
  const { projects, tasks } = req.body || {};
  if (!Array.isArray(projects) || !Array.isArray(tasks)) {
    return res.status(400).json({ error: "projects and tasks must be arrays" });
  }
  writeData({ projects, tasks });
  res.json({ message: "Data saved successfully" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Daily Planner API is running" });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Daily Planner running at http://localhost:${PORT}`);
});
