# 🚀 Mini CRM Dashboard (Elite SaaS UI)

A modern **Customer Relationship Management (CRM)** dashboard built using  
**HTML, CSS, JavaScript, Node.js, Express, and MySQL**.

This project helps businesses manage leads efficiently with a premium SaaS-style interface including analytics, pipeline management, bulk actions, and notes.

> 💡 Built as a full-stack learning project and portfolio showcase.

---

# ✨ Key Features

## 🧾 Lead Management
- Add leads manually
- View leads in a structured table
- Update lead status:
  - new
  - contacted
  - converted
- Delete leads
- Smart lead scoring (0–100)

---

## ⚡ Productivity Tools
- 🔍 Real-time search (name/email/phone)
- 🎯 Status filters
- 📄 Pagination + page size control
- ✅ Multi-select leads
- 🔄 Bulk actions:
  - Bulk status update
  - Bulk delete
- ⤓ Export leads to CSV

---

## 📊 Dashboard & Analytics
- Total leads counter
- New / Contacted / Converted stats
- Bar chart (status breakdown)
- Donut chart (conversion rate)
- 🏆 Top leads widget (auto scoring)
- 🕒 Activity timeline

---

## 🧩 Pipeline (Kanban Board)
- Drag & drop leads between stages
- Instant status update
- Priority sorting by score

---

## 🎨 Elite SaaS UI
- 🌙 Dark / Light mode toggle
- 📂 Collapsible vertical sidebar
- 🔔 Toast notifications
- ⚡ Skeleton loading states
- 📱 Fully responsive layout
- ✨ Smooth animations

---

# 🧱 Tech Stack

## Frontend
- HTML5  
- CSS3 (Custom SaaS theme)  
- Vanilla JavaScript  
- Chart.js  

## Backend
- Node.js  
- Express.js  

## Database
- MySQL  

---

# 📁 Project Structure
mini-crm/
│
├── backend/
│ ├── server.js
│ └── package.json
│
├── frontend/
│ ├── dashboard.html
│ ├── style.css
│ └── script.js
│
└── README.md


---

⚙️ Installation & Setup

Follow these steps to run the Mini CRM Project locally.

1️⃣ Clone Repository
git clone https://github.com/ummeruhi/FUTURE_FS_02.git
cd FUTURE_FS_02
2️⃣ Backend Setup

Navigate to the backend folder and install dependencies:

cd backend
npm install
node server.js

✅ Server will run at:
👉 http://localhost:5000

3️⃣ Database Setup (MySQL)

Create the required database in MySQL:

CREATE DATABASE mini_crm;

⚠️ Make sure your MySQL credentials in server.js match your local setup.

4️⃣ Run Frontend

Open the frontend using either method:

Option A — Directly open:

dashboard.html

Option B — Recommended (VS Code):

Install Live Server

Right-click dashboard.html

Click Open with Live Server
