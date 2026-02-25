const API = "https://mini-crm-1-obkc.onrender.com/";

if (!localStorage.getItem("loggedIn")) {
  window.location.href = "login.html";
}

function logout() {
  localStorage.removeItem("loggedIn");
  window.location.href = "login.html";
}

fetchLeads();

function fetchLeads() {
  fetch(`${API}/leads`)
    .then(res => res.json())
    .then(data => {
      renderStats(data);
      renderTable(data);
    });
}

function renderStats(leads) {
  document.getElementById("totalLeads").innerText = leads.length;
  document.getElementById("newLeads").innerText =
    leads.filter(l => l.status === "new").length;
  document.getElementById("convertedLeads").innerText =
    leads.filter(l => l.status === "converted").length;
}

function renderTable(leads) {
  const table = document.getElementById("leadsTable");
  table.innerHTML = "";

  leads.forEach(lead => {
    table.innerHTML += `
      <tr>
        <td>${lead.name}</td>
        <td>${lead.email}</td>
        <td>
          <select onchange="updateStatus(${lead.id}, this.value)">
            <option ${lead.status=="new"?"selected":""}>new</option>
            <option ${lead.status=="contacted"?"selected":""}>contacted</option>
            <option ${lead.status=="converted"?"selected":""}>converted</option>
          </select>
        </td>
        <td>
          <textarea id="note-${lead.id}"></textarea>
          <button onclick="addNote(${lead.id})">Add</button>
        </td>
      </tr>
    `;
  });
}

function updateStatus(id, status) {
  fetch(`${API}/leads/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
}

function addNote(id) {
  const note = document.getElementById(`note-${id}`).value;

  fetch(`${API}/leads/${id}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note })
  }).then(() => alert("Note added"));
}