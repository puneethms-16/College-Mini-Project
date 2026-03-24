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
});

const API_URL = "http://localhost:5001/api";

// File input handling
const fileInput = document.getElementById("resumeFile");
const fileNameDisplay = document.querySelector(".file-name");

fileInput.addEventListener("change", (e) => {
  const fileName = e.target.files[0]?.name || "No file chosen";
  fileNameDisplay.textContent = fileName;
});

// Form submission
const uploadForm = document.getElementById("uploadForm");
const submitBtn = document.getElementById("submitBtn");
const resultMessage = document.getElementById("resultMessage");
const uploadResult = document.getElementById("uploadResult");

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  const resumeFile = fileInput.files[0];
  const jobDescription = document.getElementById("jobDescription").value;

  if (!resumeFile) {
    showMessage("Please select a resume file", "error");
    return;
  }

  formData.append("resume", resumeFile);
  formData.append("job_description", jobDescription);

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.querySelector(".btn-text").style.display = "none";
  submitBtn.querySelector(".btn-loader").style.display = "inline";
  hideMessage();
  uploadResult.style.display = "none";

  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      showMessage("Resume uploaded and analyzed successfully!", "success");
      displayResults(data);
    } else {
      showMessage(data.error || "Upload failed", "error");
    }
  } catch (error) {
    showMessage(
      "Connection error. Make sure the backend server is running.",
      "error"
    );
    console.error("Upload error:", error);
  } finally {
    // Reset button
    submitBtn.disabled = false;
    submitBtn.querySelector(".btn-text").style.display = "inline";
    submitBtn.querySelector(".btn-loader").style.display = "none";
  }
});

// Screen all resumes button
const screenAllBtn = document.getElementById("screenAllBtn");
screenAllBtn.addEventListener("click", async () => {
  const jobDescription = document.getElementById("jobDescription").value;

  if (!jobDescription) {
    showMessage("Please enter a job description first", "error");
    return;
  }

  screenAllBtn.disabled = true;
  screenAllBtn.textContent = "Screening...";

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
      showMessage(
        `Successfully screened ${data.total_resumes} resumes!`,
        "success"
      );
      setTimeout(() => {
        window.location.href = "results.html";
      }, 1500);
    } else {
      showMessage(data.error || "Screening failed", "error");
    }
  } catch (error) {
    showMessage(
      "Connection error. Make sure the backend server is running.",
      "error"
    );
    console.error("Screening error:", error);
  } finally {
    screenAllBtn.disabled = false;
    screenAllBtn.textContent = "Screen All Resumes";
  }
});

function displayResults(data) {
  uploadResult.style.display = "block";

  // Display match score with color coding
  const matchScore = data.match_score;
  const matchScoreElement = document.getElementById("matchScore");
  matchScoreElement.textContent = `${matchScore}%`;

  if (matchScore >= 70) {
    matchScoreElement.style.color = "#10b981"; // Green
  } else if (matchScore >= 50) {
    matchScoreElement.style.color = "#f59e0b"; // Orange
  } else {
    matchScoreElement.style.color = "#ef4444"; // Red
  }

  // Display skills count
  const skills = data.extracted_data.skills || [];
  document.getElementById("skillsCount").textContent = skills.length;

  // Display experience
  const experience = data.extracted_data.experience_years || 0;
  document.getElementById("experience").textContent = `${experience} years`;

  // Display skills tags
  const skillsList = document.getElementById("skillsList");
  skillsList.innerHTML = "";

  skills.forEach((skill) => {
    const tag = document.createElement("span");
    tag.className = "skill-tag";
    tag.textContent = skill;
    skillsList.appendChild(tag);
  });

  if (skills.length === 0) {
    skillsList.innerHTML = '<p style="color: #6b7280;">No skills detected</p>';
  }
}

function showMessage(message, type) {
  resultMessage.textContent = message;
  resultMessage.className = `message ${type}`;
  resultMessage.style.display = "block";
}

function hideMessage() {
  resultMessage.style.display = "none";
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
