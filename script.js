function generateUniqueId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let guilds = [];
let scoreChartInstance, winLossChartInstance, killsChartInstance;

const dom = {
  loadingOverlay: document.getElementById("loadingOverlay"),
  messageBox: document.getElementById("messageBox"),
  guildModal: document.getElementById("guildModal"),
  guildForm: document.getElementById("guildForm"),
  modalTitle: document.getElementById("modalTitle"),
  guildIdInput: document.getElementById("guildId"),
  guildNameInput: document.getElementById("guildName"),
  guildScoreInput: document.getElementById("guildScore"),
  guildWinsInput: document.getElementById("guildWins"),
  guildLossesInput: document.getElementById("guildLosses"),
  guildKillsForInput: document.getElementById("guildKillsFor"),
  guildKillsAgainstInput: document.getElementById("guildKillsAgainst"),
  guildLeagueSelect: document.getElementById("guildLeague"),
  leagueATableBody: document.getElementById("leagueATableBody"),
  leagueBTableBody: document.getElementById("leagueBTableBody"),
  noGuildsA: document.getElementById("noGuildsA"),
  noGuildsB: document.getElementById("noGuildsB"),
  addGuildBtn: document.getElementById("addGuildBtn"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  importCsvInput: document.getElementById("importCsvInput"),
  clearAllDataBtn: document.getElementById("clearAllDataBtn"),
  scoreChartCanvas: document.getElementById("scoreChart"),
  winLossChartCanvas: document.getElementById("winLossChart"),
  killsChartCanvas: document.getElementById("killsChart"),
};

function showLoading() {
  dom.loadingOverlay.classList.add("show");
}

function hideLoading() {
  dom.loadingOverlay.classList.remove("show");
}

function showMessage(message, duration = 3000) {
  dom.messageBox.textContent = message;
  dom.messageBox.classList.add("show");
  setTimeout(() => dom.messageBox.classList.remove("show"), duration);
}

function saveGuildsToLocalStorage() {
  localStorage.setItem("guildsLeaderboard", JSON.stringify(guilds));
}

function loadGuildsFromLocalStorage() {
  showLoading();
  const storedGuilds = localStorage.getItem("guildsLeaderboard");
  guilds = storedGuilds ? JSON.parse(storedGuilds) : [];
  renderGuilds(guilds);
  updateCharts();
  hideLoading();
}

window.openModal = (guild = null) => {
  if (guild) {
    dom.modalTitle.textContent = "Edit Guild";
    dom.guildIdInput.value = guild.id;
    dom.guildNameInput.value = guild.name;
    dom.guildScoreInput.value = guild.score;
    dom.guildWinsInput.value = guild.wins || 0;
    dom.guildLossesInput.value = guild.losses || 0;
    dom.guildKillsForInput.value = guild.killsFor || 0;
    dom.guildKillsAgainstInput.value = guild.killsAgainst || 0;
    dom.guildLeagueSelect.value = guild.league;
  } else {
    dom.modalTitle.textContent = "Add New Guild";
    dom.guildIdInput.value = "";
    dom.guildNameInput.value = "";
    dom.guildScoreInput.value = "0";
    dom.guildWinsInput.value = "0";
    dom.guildLossesInput.value = "0";
    dom.guildKillsForInput.value = "0";
    dom.guildKillsAgainstInput.value = "0";
    dom.guildLeagueSelect.value = "A";
  }
  dom.guildModal.classList.add("show");
};

window.closeModal = () => {
  dom.guildModal.classList.remove("show");
  dom.guildForm.reset();
};

function compareGuilds(g1, g2) {
  if (g1.score !== g2.score) return g2.score - g1.score;
  if (g1.wins !== g2.wins) return g2.wins - g1.wins;
  if (g1.losses !== g2.losses) return g1.losses - g2.losses;
  if (g1.killsFor !== g2.killsFor) return g2.killsFor - g1.killsFor;
  if (g1.killsAgainst !== g2.killsAgainst)
    return g1.killsAgainst - g2.killsAgainst;
  return 0;
}

function renderGuilds(currentGuilds) {
  const leagueAGuilds = currentGuilds
    .filter((g) => g.league === "A")
    .sort(compareGuilds);
  leagueAGuilds.forEach((guild, index) => (guild.rank = index + 1));

  const leagueBGuilds = currentGuilds
    .filter((g) => g.league === "B")
    .sort(compareGuilds);
  leagueBGuilds.forEach((guild, index) => (guild.rank = index + 1));

  dom.leagueATableBody.innerHTML = "";
  dom.leagueBTableBody.innerHTML = "";

  if (leagueAGuilds.length === 0) {
    dom.noGuildsA.classList.remove("hidden");
  } else {
    dom.noGuildsA.classList.add("hidden");
    leagueAGuilds.forEach(
      (guild) => (dom.leagueATableBody.innerHTML += createGuildRow(guild))
    );
  }

  if (leagueBGuilds.length === 0) {
    dom.noGuildsB.classList.remove("hidden");
  } else {
    dom.noGuildsB.classList.add("hidden");
    leagueBGuilds.forEach(
      (guild) => (dom.leagueBTableBody.innerHTML += createGuildRow(guild))
    );
  }
}

function createGuildRow(guild) {
  return `
        <tr class="table-row hover:bg-gray-50" data-guild-id="${guild.id}">
            <td class="table-cell font-bold text-gray-800">${guild.rank}</td>
            <td class="table-cell font-medium text-gray-900">${guild.name}</td>
            <td class="table-cell">${guild.score}</td>
            <td class="table-cell">${guild.wins || 0}</td>
            <td class="table-cell">${guild.losses || 0}</td>
            <td class="table-cell">${guild.killsFor || 0}</td>
            <td class="table-cell">${guild.killsAgainst || 0}</td>
            <td class="table-cell text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-2 flex-wrap">
                    <button class="btn btn-success btn-sm" data-action="add-score"><i class="fas fa-plus"></i> Score</button>
                    <button class="btn btn-secondary btn-sm" data-action="subtract-score"><i class="fas fa-minus"></i> Score</button>
                    <button class="btn btn-info btn-sm" data-action="add-win"><i class="fas fa-trophy"></i> Win</button>
                    <button class="btn btn-warning btn-sm" data-action="add-loss"><i class="fas fa-frown"></i> Loss</button>
                    <button class="btn btn-kills-for btn-sm" data-action="add-kills-for"><i class="fas fa-skull-crossbones"></i> Kills For</button>
                    <button class="btn btn-kills-against btn-sm" data-action="add-kills-against"><i class="fas fa-shield-alt"></i> Kills Against</button>
                    <button class="btn btn-primary btn-sm" data-action="edit"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-danger btn-sm" data-action="delete"><i class="fas fa-trash-alt"></i> Delete</button>
                </div>
            </td>
        </tr>
    `;
}

dom.guildForm.addEventListener("submit", (e) => {
  e.preventDefault();
  showLoading();

  const {
    guildIdInput,
    guildNameInput,
    guildScoreInput,
    guildWinsInput,
    guildLossesInput,
    guildKillsForInput,
    guildKillsAgainstInput,
    guildLeagueSelect,
  } = dom;

  const id = guildIdInput.value;
  const name = guildNameInput.value.trim();
  const score = parseInt(guildScoreInput.value);
  const wins = parseInt(guildWinsInput.value);
  const losses = parseInt(guildLossesInput.value);
  const killsFor = parseInt(guildKillsForInput.value);
  const killsAgainst = parseInt(guildKillsAgainstInput.value);
  const league = guildLeagueSelect.value;

  if (
    !name ||
    isNaN(score) ||
    isNaN(wins) ||
    isNaN(losses) ||
    isNaN(killsFor) ||
    isNaN(killsAgainst)
  ) {
    showMessage(
      "Please enter valid guild name, score, wins, losses, kills for, and kills against."
    );
    hideLoading();
    return;
  }

  if (id) {
    const guildIndex = guilds.findIndex((g) => g.id === id);
    if (guildIndex > -1) {
      guilds[guildIndex] = {
        ...guilds[guildIndex],
        name,
        score,
        wins,
        losses,
        killsFor,
        killsAgainst,
        league,
      };
      showMessage("Guild updated successfully!");
    } else {
      showMessage("Error: Guild not found for update.");
    }
  } else {
    const newGuild = {
      id: generateUniqueId(),
      name,
      score,
      wins,
      losses,
      killsFor,
      killsAgainst,
      league,
      rank: 0,
    };
    guilds.push(newGuild);
    showMessage("Guild added successfully!");
  }

  saveGuildsToLocalStorage();
  renderGuilds(guilds);
  updateCharts();
  closeModal();
  hideLoading();
});

function handleGuildAction(event) {
  const button = event.target.closest("button");
  if (!button) return;

  const row = button.closest("tr");
  if (!row) return;

  const guildId = row.dataset.guildId;
  const action = button.dataset.action;
  const guild = guilds.find((g) => g.id === guildId);

  if (!guild) {
    showMessage("Error: Guild not found for action.");
    return;
  }

  const updateGuildField = (id, field, newValue) => {
    showLoading();
    const guildIndex = guilds.findIndex((g) => g.id === id);
    if (guildIndex > -1) {
      guilds[guildIndex][field] = Math.max(0, newValue);
      saveGuildsToLocalStorage();
      renderGuilds(guilds);
      updateCharts();
      showMessage(`${field} updated!`);
    } else {
      showMessage("Error: Guild not found.");
    }
    hideLoading();
  };

  const deleteGuild = async (id) => {
    const confirmDelete = await new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.className = "modal show";
      modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">Confirm Deletion</h3>
                        <button class="close-button" onclick="this.closest('.modal').remove(); resolve(false);">&times;</button>
                    </div>
                    <p class="text-gray-700 mb-6">Are you sure you want to delete this guild?</p>
                    <div class="flex justify-end gap-3">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove(); resolve(false);">Cancel</button>
                        <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove(); resolve(true);">Delete</button>
                    </div>
                </div>
            `;
      document.body.appendChild(modal);
    });

    if (!confirmDelete) return;

    showLoading();
    const initialLength = guilds.length;
    guilds = guilds.filter((g) => g.id !== id);
    if (guilds.length < initialLength) {
      saveGuildsToLocalStorage();
      renderGuilds(guilds);
      updateCharts();
      showMessage("Guild deleted successfully!");
    } else {
      showMessage("Error: Guild not found for deletion.");
    }
    hideLoading();
  };

  switch (action) {
    case "add-score":
      updateGuildField(guild.id, "score", guild.score + 1);
      break;
    case "subtract-score":
      updateGuildField(guild.id, "score", guild.score - 1);
      break;
    case "add-win":
      updateGuildField(guild.id, "wins", (guild.wins || 0) + 1);
      break;
    case "add-loss":
      updateGuildField(guild.id, "losses", (guild.losses || 0) + 1);
      break;
    case "add-kills-for":
      updateGuildField(guild.id, "killsFor", (guild.killsFor || 0) + 1);
      break;
    case "add-kills-against":
      updateGuildField(guild.id, "killsAgainst", (guild.killsAgainst || 0) + 1);
      break;
    case "edit":
      openModal(guild);
      break;
    case "delete":
      deleteGuild(guild.id);
      break;
    default:
      console.warn("Unknown action:", action);
  }
}

dom.leagueATableBody.addEventListener("click", handleGuildAction);
dom.leagueBTableBody.addEventListener("click", handleGuildAction);

function updateCharts() {
  const guildNames = guilds.map((g) => g.name);
  const guildScores = guilds.map((g) => g.score);
  const guildWins = guilds.map((g) => g.wins || 0);
  const guildLosses = guilds.map((g) => g.losses || 0);
  const guildKillsFor = guilds.map((g) => g.killsFor || 0);
  const guildKillsAgainst = guilds.map((g) => g.killsAgainst || 0);

  if (scoreChartInstance) scoreChartInstance.destroy();
  if (winLossChartInstance) winLossChartInstance.destroy();
  if (killsChartInstance) killsChartInstance.destroy();

  scoreChartInstance = new Chart(dom.scoreChartCanvas, {
    type: "bar",
    data: {
      labels: guildNames,
      datasets: [
        {
          label: "Score",
          data: guildScores,
          backgroundColor: "rgba(99, 102, 241, 0.6)",
          borderColor: "rgba(99, 102, 241, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Guild Scores",
          font: { size: 18, weight: "bold" },
          color: "#334155",
        },
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Score", color: "#4a5568" },
        },
        x: { title: { display: true, text: "Guild Name", color: "#4a5568" } },
      },
    },
  });

  winLossChartInstance = new Chart(dom.winLossChartCanvas, {
    type: "bar",
    data: {
      labels: guildNames,
      datasets: [
        {
          label: "Wins",
          data: guildWins,
          backgroundColor: "rgba(34, 197, 94, 0.6)",
          borderColor: "rgba(34, 197, 94, 1)",
          borderWidth: 1,
        },
        {
          label: "Losses",
          data: guildLosses,
          backgroundColor: "rgba(239, 68, 68, 0.6)",
          borderColor: "rgba(239, 68, 68, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Wins vs Losses",
          font: { size: 18, weight: "bold" },
          color: "#334155",
        },
      },
      scales: {
        x: {
          stacked: true,
          title: { display: true, text: "Guild Name", color: "#4a5568" },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: { display: true, text: "Count", color: "#4a5568" },
        },
      },
    },
  });

  killsChartInstance = new Chart(dom.killsChartCanvas, {
    type: "bar",
    data: {
      labels: guildNames,
      datasets: [
        {
          label: "Kills For",
          data: guildKillsFor,
          backgroundColor: "rgba(132, 204, 22, 0.6)",
          borderColor: "rgba(132, 204, 22, 1)",
          borderWidth: 1,
        },
        {
          label: "Kills Against",
          data: guildKillsAgainst,
          backgroundColor: "rgba(244, 63, 94, 0.6)",
          borderColor: "rgba(244, 63, 94, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Kills For vs Kills Against",
          font: { size: 18, weight: "bold" },
          color: "#334155",
        },
      },
      scales: {
        x: {
          stacked: true,
          title: { display: true, text: "Guild Name", color: "#4a5568" },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: { display: true, text: "Count", color: "#4a5568" },
        },
      },
    },
  });
}

function exportToCsv() {
  if (guilds.length === 0) {
    showMessage("No data to export.");
    return;
  }

  showLoading();

  const headers = [
    "id",
    "name",
    "score",
    "wins",
    "losses",
    "killsFor",
    "killsAgainst",
    "league",
    "rank",
  ];
  const csvRows = [];

  csvRows.push(headers.join(","));

  guilds.forEach((guild) => {
    const row = headers
      .map((header) => {
        const value = guild[header] !== undefined ? guild[header] : "";
        return typeof value === "string" &&
          (value.includes(",") || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      })
      .join(",");
    csvRows.push(row);
  });

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "guild_leaderboard.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showMessage("Data exported to CSV!");
  hideLoading();
}

function importFromCsv(event) {
  const file = event.target.files[0];
  if (!file) {
    showMessage("No file selected.");
    return;
  }

  showLoading();
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const csvString = e.target.result;
      const lines = csvString.split("\n").filter((line) => line.trim() !== "");
      if (lines.length === 0) {
        showMessage("CSV file is empty or invalid.");
        hideLoading();
        return;
      }

      const headers = lines[0].split(",");
      const importedGuilds = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        if (values.length !== headers.length) {
          console.warn(
            `Skipping row ${i + 1} due to mismatch in column count.`
          );
          continue;
        }
        const guild = {};
        headers.forEach((header, index) => {
          let value = values[index];
          if (
            typeof value === "string" &&
            value.startsWith('"') &&
            value.endsWith('"')
          ) {
            value = value.substring(1, value.length - 1).replace(/""/g, '"');
          }
          if (
            [
              "score",
              "wins",
              "losses",
              "killsFor",
              "killsAgainst",
              "rank",
            ].includes(header)
          ) {
            guild[header] = parseInt(value) || 0;
          } else {
            guild[header] = value;
          }
        });
        if (!guild.id) guild.id = generateUniqueId();
        importedGuilds.push(guild);
      }

      guilds = importedGuilds;
      saveGuildsToLocalStorage();
      renderGuilds(guilds);
      updateCharts();
      showMessage(`Successfully imported ${importedGuilds.length} guilds!`);
    } catch (error) {
      console.error("Error importing CSV:", error);
      showMessage("Failed to import CSV. Please check file format.");
    } finally {
      hideLoading();
      event.target.value = "";
    }
  };

  reader.onerror = () => {
    showMessage("Error reading file.");
    hideLoading();
    event.target.value = "";
  };

  reader.readAsText(file);
}

async function clearAllData() {
  const confirmClear = await new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "modal show";
    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Confirm Clear All Data</h3>
                    <button class="close-button" onclick="this.closest('.modal').remove(); resolve(false);">&times;</button>
                </div>
                <p class="text-gray-700 mb-6">Are you sure you want to clear ALL guild data? This action cannot be undone.</p>
                <div class="flex justify-end gap-3">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove(); resolve(false);">Cancel</button>
                    <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove(); resolve(true);">Clear All</button>
                </div>
            </div>
        `;
    document.body.appendChild(modal);
  });

  if (!confirmClear) return;

  showLoading();
  localStorage.removeItem("guildsLeaderboard");
  guilds = [];
  renderGuilds(guilds);
  updateCharts();
  showMessage("All guild data cleared successfully!");
  hideLoading();
}

dom.addGuildBtn.addEventListener("click", () => openModal());
dom.exportCsvBtn.addEventListener("click", exportToCsv);
dom.importCsvInput.addEventListener("change", importFromCsv);
dom.clearAllDataBtn.addEventListener("click", clearAllData);

window.onload = loadGuildsFromLocalStorage;
