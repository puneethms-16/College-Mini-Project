// ============================================
// DARK MODE FUNCTIONALITY
// ============================================

// Apply theme immediately
const currentTheme = localStorage.getItem("theme") || "light";
if (currentTheme === "dark") {
  document.documentElement.classList.add("dark-mode");
  document.body.classList.add("dark-mode");
}

document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme");

  if (themeToggle) {
    // Set checkbox to match current theme
    themeToggle.checked = currentTheme === "dark";

    themeToggle.addEventListener("change", function () {
      if (this.checked) {
        document.documentElement.classList.add("dark-mode");
        document.body.classList.add("dark-mode");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark-mode");
        document.body.classList.remove("dark-mode");
        localStorage.setItem("theme", "light");
      }
    });
  }

  // Load results
  loadResults();
});
const API_URL = "http://localhost:5001/api";

// Load results on page load
document.addEventListener("DOMContentLoaded", () => {
  loadResults();
});

// Refresh button
document.getElementById("refreshBtn").addEventListener("click", () => {
  loadResults();
});

// Clear all button
document.getElementById("clearBtn").addEventListener("click", async () => {
  if (
    !confirm("Are you sure you want to delete all resumes from the database?")
  ) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/clear`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message);
      loadResults();
    } else {
      alert("Failed to clear database");
    }
  } catch (error) {
    alert("Connection error");
    console.error("Clear error:", error);
  }
});

// Screen now button
document.getElementById("screenNowBtn").addEventListener("click", async () => {
  const jobDescription = document.getElementById("screenJobDescription").value;

  if (!jobDescription) {
    alert("Please enter a job description");
    return;
  }

  const btn = document.getElementById("screenNowBtn");
  btn.disabled = true;
  btn.textContent = "Screening...";

  try {
    const response = await fetch(`${API_URL}/screen`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ job_description: jobDescription }),
    });

    const data = await response.json();

    if (response.ok) {
      alert(`Successfully screened ${data.total_resumes} resumes!`);
      displayScreenResults(data.candidates);
      updateStats(data.candidates);
    } else {
      alert(data.error || "Screening failed");
    }
  } catch (error) {
    alert("Connection error");
    console.error("Screening error:", error);
  } finally {
    btn.disabled = false;
    btn.textContent = "Screen All Resumes";
  }
});

async function loadResults() {
  const loadingMessage = document.getElementById("loadingMessage");
  const resultsContainer = document.getElementById("resultsContainer");
  const noResults = document.getElementById("noResults");

  loadingMessage.style.display = "block";
  resultsContainer.innerHTML = "";
  noResults.style.display = "none";

  try {
    const response = await fetch(`${API_URL}/resumes`);
    const data = await response.json();

    if (response.ok && data.resumes.length > 0) {
      displayResults(data.resumes);
      updateStatsFromList(data.resumes);
    } else {
      noResults.style.display = "block";
      updateStatsFromList([]);
    }
  } catch (error) {
    resultsContainer.innerHTML = `
            <div class="message error">
                <strong>Connection Error</strong><br>
                Make sure the backend server is running at ${API_URL}
            </div>
        `;
    console.error("Load error:", error);
  } finally {
    loadingMessage.style.display = "none";
  }
}

function displayResults(resumes) {
  const resultsContainer = document.getElementById("resultsContainer");
  resultsContainer.innerHTML = "<h2>All Uploaded Resumes</h2>";

  resumes.forEach((resume, index) => {
    const card = createResumeCard(resume, index + 1);
    resultsContainer.appendChild(card);
  });
}

function displayScreenResults(candidates) {
  const resultsContainer = document.getElementById("resultsContainer");
  resultsContainer.innerHTML = "<h2>Screening Results (Ranked)</h2>";

  candidates.forEach((candidate) => {
    const card = createCandidateCard(candidate);
    resultsContainer.appendChild(card);
  });
}

function createResumeCard(resume, rank) {
  const card = document.createElement("div");
  card.className = "candidate-card";

  const matchScore = resume.match_score || 0;
  const scoreColor =
    matchScore >= 70 ? "#10b981" : matchScore >= 50 ? "#f59e0b" : "#ef4444";

  card.innerHTML = `
        <div class="candidate-header">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="rank-badge">${rank}</div>
                <div>
                    <h3 style="margin: 0;">${resume.filename}</h3>
                    <p style="color: #6b7280; margin: 0; font-size: 0.875rem;">Uploaded: ${
                      resume.upload_date
                    }</p>
                </div>
            </div>
            <div class="match-score" style="color: ${scoreColor};">
                ${matchScore.toFixed(1)}%
            </div>
        </div>
    `;

  return card;
}

function createCandidateCard(candidate) {
  const card = document.createElement("div");
  card.className = "candidate-card";

  const scoreColor =
    candidate.match_score >= 70
      ? "#10b981"
      : candidate.match_score >= 50
      ? "#f59e0b"
      : "#ef4444";

  const skillsHtml = candidate.skills
    .slice(0, 8)
    .map((skill) => `<span class="skill-tag">${skill}</span>`)
    .join("");

  const education =
    candidate.education.length > 0 ? candidate.education[0] : "Not specified";

  card.innerHTML = `
        <div class="candidate-header">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="rank-badge">#${candidate.rank}</div>
                <div>
                    <h3 style="margin: 0;">${candidate.filename}</h3>
                    <p style="color: #6b7280; margin: 0; font-size: 0.875rem;">
                        ${candidate.email} | ${candidate.phone}
                    </p>
                </div>
            </div>
            <div class="match-score" style="color: ${scoreColor};">
                ${candidate.match_score}%
            </div>
        </div>
        
        <div class="candidate-info">
            <div class="info-item">
                <span class="info-label">Experience</span>
                <span class="info-value">${
                  candidate.experience_years
                } years</span>
            </div>
            <div class="info-item">
                <span class="info-label">Skills Found</span>
                <span class="info-value">${
                  candidate.skills.length
                } skills</span>
            </div>
            <div class="info-item">
                <span class="info-label">Education</span>
                <span class="info-value">${education.substring(0, 50)}...</span>
            </div>
        </div>
        
        <div class="skills-section">
            <h4>Top Skills:</h4>
            <div class="skills-tags">
                ${skillsHtml}
                ${
                  candidate.skills.length > 8
                    ? `<span style="color: #6b7280;">+${
                        candidate.skills.length - 8
                      } more</span>`
                    : ""
                }
            </div>
        </div>
    `;

  return card;
}

function updateStatsFromList(resumes) {
  document.getElementById("totalResumes").textContent = resumes.length;

  if (resumes.length > 0) {
    const avgScore =
      resumes.reduce((sum, r) => sum + (r.match_score || 0), 0) /
      resumes.length;
    document.getElementById("avgScore").textContent = `${avgScore.toFixed(1)}%`;

    const topCount = resumes.filter((r) => (r.match_score || 0) >= 70).length;
    document.getElementById("topCandidates").textContent = topCount;
  } else {
    document.getElementById("avgScore").textContent = "0%";
    document.getElementById("topCandidates").textContent = "0";
  }
}

function updateStats(candidates) {
  document.getElementById("totalResumes").textContent = candidates.length;

  if (candidates.length > 0) {
    const avgScore =
      candidates.reduce((sum, c) => sum + c.match_score, 0) / candidates.length;
    document.getElementById("avgScore").textContent = `${avgScore.toFixed(1)}%`;

    const topCount = candidates.filter((c) => c.match_score >= 70).length;
    document.getElementById("topCandidates").textContent = topCount;
  } else {
    document.getElementById("avgScore").textContent = "0%";
    document.getElementById("topCandidates").textContent = "0";
  }
}

// ============================================
// MOBILE MENU TOGGLE
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");

  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", function () {
      // Toggle active class
      this.classList.toggle("active");
      navMenu.classList.toggle("active");
    });

    // Close menu when clicking on a link
    const navLinks = navMenu.querySelectorAll("a");
    navLinks.forEach((link) => {
      link.addEventListener("click", function () {
        menuToggle.classList.remove("active");
        navMenu.classList.remove("active");
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", function (event) {
      const isClickInsideNav = navMenu.contains(event.target);
      const isClickOnToggle = menuToggle.contains(event.target);

      if (
        !isClickInsideNav &&
        !isClickOnToggle &&
        navMenu.classList.contains("active")
      ) {
        menuToggle.classList.remove("active");
        navMenu.classList.remove("active");
      }
    });
  }
});
