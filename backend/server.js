const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
const path = require("path");

// ✅ Serve frontend static files
app.use(express.static(path.join(__dirname, "frontend")));

// ✅ Default route opens login.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "login.html"));
});
/* ======================
   Middleware
====================== */
app.use(cors());
app.use(express.json());


/* ======================
   MySQL Connection
====================== */
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // ← your MySQL password
  database: "mini_crm",
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL Database");
  }
});

/* ======================
   Test Route
====================== */
app.get("/", (req, res) => {
  res.send("Mini CRM Backend is running 🚀");
});

/* ======================
   GET all leads
====================== */
app.get("/leads", (req, res) => {
  const sql = "SELECT * FROM leads ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch leads" });
    }
    res.json(results);
  });
});

/* ======================
   ADD new lead ✅ (FIXED)
   Accepts: name, email, phone, status, source
====================== */
app.post("/leads", (req, res) => {
  const { name, email, phone, status, source } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const finalStatus = status || "new";
  const finalSource = source || "manual";

  const sql =
    "INSERT INTO leads (name, email, phone, status, source) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [name, email, phone || null, finalStatus, finalSource], (err, result) => {
    if (err) {
      console.error("Add lead error:", err);
      return res.status(500).json({ error: "Failed to add lead", details: err.sqlMessage });
    }

    res.status(201).json({
      message: "Lead added successfully",
      leadId: result.insertId,
    });
  });
});

/* ======================
   Update lead status
====================== */
app.put("/leads/:id/status", (req, res) => {
  const leadId = req.params.id;
  const { status } = req.body;

  const allowedStatus = ["new", "contacted", "converted"];
  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  const sql = "UPDATE leads SET status = ? WHERE id = ?";
  db.query(sql, [status, leadId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to update status" });
    }
    res.json({ message: "Lead status updated successfully" });
  });
});

/* =========================
   ADD FOLLOW-UP NOTE
========================= */
app.post("/leads/:id/notes", (req, res) => {
  const leadId = req.params.id;
  const { note } = req.body;

  if (!note) {
    return res.status(400).json({ error: "Note is required" });
  }

  const sql = `
    INSERT INTO lead_notes (lead_id, note)
    VALUES (?, ?)
  `;

  db.query(sql, [leadId, note], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to add note" });
    }

    res.status(201).json({
      message: "Note added successfully",
      noteId: result.insertId,
    });
  });
});

/* =========================
   GET LEAD NOTES
========================= */
app.get("/leads/:id/notes", (req, res) => {
  const leadId = req.params.id;

  const sql = `
    SELECT * FROM lead_notes
    WHERE lead_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [leadId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch notes" });
    }

    res.json(results);
  });
});

// ✅ DELETE a lead
app.delete("/leads/:id", (req, res) => {
  const leadId = req.params.id;

  const sql = "DELETE FROM leads WHERE id = ?";
  db.query(sql, [leadId], (err, result) => {
    if (err) {
      console.error("DELETE /leads/:id error:", err);
      return res.status(500).json({ error: "Failed to delete lead", details: err.sqlMessage });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    res.json({ message: "Lead deleted successfully" });
  });
});

/* ======================
   ADMIN LOGIN
====================== */
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      user: { id: results[0].id, username: results[0].username },
    });
  });
});

/* ======================
   LEADS ANALYTICS
====================== */
app.get("/analytics", (req, res) => {
  const sql = `
    SELECT 
      COUNT(*) AS total,
      SUM(status = 'new') AS newLeads,
      SUM(status = 'contacted') AS contacted,
      SUM(status = 'converted') AS converted
    FROM leads
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Analytics error" });
    }

    const data = result[0];
    const conversionRate =
      data.total === 0 ? 0 : ((data.converted / data.total) * 100).toFixed(1);

    res.json({ ...data, conversionRate });
  });
});

/* ======================
   Server Start
====================== */
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
app.delete("/leads/:id", (req, res) => {
  const leadId = req.params.id;
  const sql = "DELETE FROM leads WHERE id = ?";

  db.query(sql, [leadId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to delete lead" });
    }
    res.json({ message: "Lead deleted successfully" });
  });
});
