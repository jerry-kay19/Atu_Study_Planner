// =========================================
// ATU STUDY PLANNER
// Task management, live clock, themes and storage
// =========================================

"use strict";

// 1. Select HTML elements

const taskForm = document.getElementById("taskForm");
const taskTitleInput = document.getElementById("taskTitle");
const taskSubjectInput = document.getElementById("taskSubject");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const emptyTitle = document.getElementById("emptyTitle");
const emptyMessage = document.getElementById("emptyMessage");
const taskFilter = document.getElementById("taskFilter");

const totalTasksElement = document.getElementById("totalTasks");
const completedTasksElement = document.getElementById("completedTasks");
const remainingTasksElement = document.getElementById("remainingTasks");
const listCountElement = document.getElementById("listCount");

const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");
const progressTrack = document.getElementById("progressTrack");
const progressCaption = document.getElementById("progressCaption");

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeLabel = document.getElementById("themeLabel");

const liveClock = document.getElementById("liveClock");
const liveDate = document.getElementById("liveDate");
const currentYear = document.getElementById("currentYear");
const toast = document.getElementById("toast");

// 2. Storage configuration

const TASKS_KEY = "atuStudyPlannerTasks";
const THEME_KEY = "atuStudyPlannerTheme";

let tasks = loadTasks();
let toastTimer;

// 3. Load saved tasks safely

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(TASKS_KEY);

    if (!savedTasks) {
      return [];
    }

    const parsedTasks = JSON.parse(savedTasks);

    if (!Array.isArray(parsedTasks)) {
      return [];
    }

    return parsedTasks.filter((task) =>
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.subject === "string" &&
      typeof task.completed === "boolean"
    );
  } catch (error) {
    console.error("Could not load saved tasks:", error);
    return [];
  }
}

// 4. Save tasks to the browser

function saveTasks() {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Could not save tasks:", error);

    showToast(
      "Unable to save tasks. Check your browser storage."
    );

    return false;
  }
}

// 5. Generate unique task identifiers

function createTaskId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}

// 6. Display notifications

function showToast(message) {
  clearTimeout(toastTimer);

  toast.textContent = message;
  toast.classList.add("show");

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

// 7. Add a new task

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = taskTitleInput.value.trim();
  const subject = taskSubjectInput.value.trim();

  if (!title) {
    showToast("Please enter a task title.");
    taskTitleInput.focus();
    return;
  }

  if (!subject) {
    showToast("Please enter the subject or course.");
    taskSubjectInput.focus();
    return;
  }

  const newTask = {
    id: createTaskId(),
    title: title,
    subject: subject,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask);

  if (!saveTasks()) {
    tasks.shift();
    return;
  }

  taskFilter.value = "all";
  renderTasks();

  taskForm.reset();
  taskTitleInput.focus();

  showToast("Task added successfully!");
});

// 8. Toggle task completion

function toggleTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  const previousState = task.completed;
  task.completed = !task.completed;

  if (!saveTasks()) {
    task.completed = previousState;
    renderTasks();
    return;
  }

  renderTasks();

  showToast(
    task.completed
      ? "Great work! Task completed."
      : "Task marked as pending."
  );
}

// 9. Delete a task

function deleteTask(taskId) {
  const index = tasks.findIndex((item) => item.id === taskId);

  if (index === -1) {
    return;
  }

  const deletedTask = tasks[index];

  tasks.splice(index, 1);

  if (!saveTasks()) {
    tasks.splice(index, 0, deletedTask);
    renderTasks();
    return;
  }

  renderTasks();
  showToast("Task deleted successfully.");
}

// 10. Build an individual task card

function createTaskElement(task) {
  const article = document.createElement("article");
  article.className = "task-item";

  if (task.completed) {
    article.classList.add("is-complete");
  }

  // Completion checkbox

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute(
    "aria-label",
    `Mark ${task.title} as ${
      task.completed ? "pending" : "completed"
    }`
  );

  checkbox.addEventListener("change", () => {
    toggleTask(task.id);
  });

  // Task information

  const content = document.createElement("div");
  content.className = "task-content";

  const title = document.createElement("h4");
  title.className = "task-title";
  title.textContent = task.title;

  const subject = document.createElement("span");
  subject.className = "task-subject";
  subject.textContent = task.subject;

  const createdDate = document.createElement("time");
  createdDate.className = "task-date";

  if (task.createdAt) {
    const date = new Date(task.createdAt);

    if (!Number.isNaN(date.getTime())) {
      createdDate.dateTime = date.toISOString();
      createdDate.textContent =
        "Added " +
        new Intl.DateTimeFormat(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric"
        }).format(date);
    }
  }

  content.append(title, subject, createdDate);

  // Status and delete controls

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const status = document.createElement("span");
  status.className = "status-label";
  status.textContent = task.completed ? "✓ Done" : "◷ Pending";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "×";
  deleteButton.setAttribute(
    "aria-label",
    `Delete ${task.title}`
  );
  deleteButton.title = "Delete task";

  deleteButton.addEventListener("click", () => {
    deleteTask(task.id);
  });

  actions.append(status, deleteButton);
  article.append(checkbox, content, actions);

  return article;
}

// 11. Render tasks and empty-state messages

function renderTasks() {
  const filter = taskFilter.value;

  const visibleTasks = tasks.filter((task) => {
    if (filter === "pending") {
      return !task.completed;
    }

    if (filter === "completed") {
      return task.completed;
    }

    return true;
  });

  taskList.replaceChildren();

  visibleTasks.forEach((task) => {
    taskList.appendChild(createTaskElement(task));
  });

  // Show an appropriate empty state

  const isEmpty = visibleTasks.length === 0;

  emptyState.classList.toggle("visible", isEmpty);
  taskList.hidden = isEmpty;

  if (isEmpty && tasks.length === 0) {
    emptyTitle.textContent = "Your study journey starts here";
    emptyMessage.textContent =
      "Add your first task above and take control of your studies.";
  } else if (isEmpty && filter === "completed") {
    emptyTitle.textContent = "No completed tasks yet";
    emptyMessage.textContent =
      "Complete a study task and it will appear here.";
  } else if (isEmpty && filter === "pending") {
    emptyTitle.textContent = "All caught up!";
    emptyMessage.textContent =
      "You have no pending tasks. Excellent work!";
  }

  // Update dashboard statistics

  updateStatistics();
}

// 12. Update progress and task counts

function updateStatistics() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const remaining = total - completed;

  const percentage = total === 0
    ? 0
    : Math.round((completed / total) * 100);

  totalTasksElement.textContent = total;
  completedTasksElement.textContent = completed;
  remainingTasksElement.textContent = remaining;
  listCountElement.textContent = tasks.length;

  progressPercent.textContent = `${percentage}%`;
  progressFill.style.width = `${percentage}%`;

  progressTrack.setAttribute("aria-valuenow", percentage);

  if (total === 0) {
    progressCaption.textContent =
      "Add a task to begin your study journey.";
  } else if (percentage === 100) {
    progressCaption.textContent =
      "Outstanding! You have completed every task.";
  } else {
    progressCaption.textContent =
      `${completed} of ${total} tasks completed. Keep going!`;
  }
}

// 13. Filter tasks

taskFilter.addEventListener("change", renderTasks);

// 14. Dark and light mode

function applyTheme(theme) {
  const isDark = theme === "dark";

  document.documentElement.dataset.theme = isDark
    ? "dark"
    : "light";

  themeIcon.textContent = isDark ? "☀" : "☾";
  themeLabel.textContent = isDark ? "Light mode" : "Dark mode";

  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light mode" : "Switch to dark mode"
  );

  const themeColor = document.querySelector(
    'meta[name="theme-color"]'
  );

  if (themeColor) {
    themeColor.content = isDark ? "#0d1422" : "#12356a";
  }
}

function loadTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);

    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }
  } catch (error) {
    console.warn("Could not read saved theme:", error);
  }

  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
}

let currentTheme = loadTheme();
applyTheme(currentTheme);

themeToggle.addEventListener("click", () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";

  applyTheme(currentTheme);

  try {
    localStorage.setItem(THEME_KEY, currentTheme);
  } catch (error) {
    console.warn("Could not save theme preference:", error);
  }
});

// 15. Live clock and date

function updateClock() {
  const now = new Date();

  liveClock.textContent = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(now);

  liveDate.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(now);

  currentYear.textContent = now.getFullYear();
}

updateClock();
setInterval(updateClock, 1000);

// 16. Initial application render

renderTasks();