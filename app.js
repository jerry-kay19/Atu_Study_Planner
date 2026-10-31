document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const taskForm = document.getElementById('taskForm');
  const taskTitleInput = document.getElementById('taskTitle');
  const taskSubjectInput = document.getElementById('taskSubject');
  const taskDateInput = document.getElementById('task-date');
  const taskTimeInput = document.getElementById('task-time');
  const taskList = document.getElementById('taskList');
  const listCountEl = document.getElementById('listCount');
  const totalCountEl = document.getElementById('totalTasks');
  const completedCountEl = document.getElementById('completedTasks');
  const pendingCountEl = document.getElementById('remainingTasks');
  const progressPercentEl = document.getElementById('progressPercent');
  const progressFillEl = document.getElementById('progressFill');
  const filterSelect = document.getElementById('taskFilter');
  const emptyState = document.getElementById('emptyState');
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const liveClock = document.getElementById('liveClock');
  const currentDateEl = document.getElementById('liveDate');
  const toast = document.getElementById('toast');

  // Load Tasks from LocalStorage
  let tasks = JSON.parse(localStorage.getItem('atu_study_tasks')) || [];

  // Theme Initialization
  const currentTheme = localStorage.getItem('atu_theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  themeToggle.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('atu_theme', newTheme);
    updateThemeIcon(newTheme);
    showToast(`Switched to ${newTheme} mode`);
  });

  function updateThemeIcon(theme) {
    if (theme === 'dark') {
      themeIcon.className = 'fa-solid fa-moon';
    } else {
      themeIcon.className = 'fa-solid fa-sun';
    }
  }

  // Live Clock & Date
  function updateClock() {
    const now = new Date();
    liveClock.textContent = now.toLocaleTimeString();
    currentDateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Toast Notification System
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // Form Submission
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    const subject = taskSubjectInput.value.trim();
    const dueDate = taskDateInput.value;
    const dueTime = taskTimeInput.value;

    if (!title) {
      showToast('Please enter a valid task title.');
      taskTitleInput.focus();
      return;
    }

    const newTask = {
      id: Date.now(),
      title,
      subject: subject || 'General Study',
      completed: false,
      dateAdded: new Date().toLocaleDateString(),
      dueAt: createDueDate(dueDate, dueTime)
    };

    tasks.unshift(newTask);
    saveAndRender();
    taskForm.reset();
    showToast('✨ Study task added successfully!');
  });

  // Toggle Completion
  window.toggleTask = function(id) {
    tasks = tasks.map(task => {
      if (task.id === id) {
        const updatedStatus = !task.completed;
        showToast(updatedStatus ? '🎉 Task completed!' : '🔄 Task marked pending');
        return { ...task, completed: updatedStatus };
      }
      return task;
    });
    saveAndRender();
  };

  // Delete Task
  window.deleteTask = function(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveAndRender();
    showToast('🗑️ Task removed successfully');
  };

  // Save to LocalStorage & Re-render
  function saveAndRender() {
    localStorage.setItem('atu_study_tasks', JSON.stringify(tasks));
    renderTasks();
    updateStats();
  }

  function createDueDate(date, time) {
    if (!date && !time) {
      return null;
    }

    const datePart = date || getLocalDateString(new Date());
    return new Date(`${datePart}T${time || '23:59'}`).toISOString();
  }

  function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Filter Event
  filterSelect.addEventListener('change', renderTasks);

  // Render Tasks
  function renderTasks() {
    const filter = filterSelect.value;
    let filteredTasks = tasks;

    if (filter === 'pending') {
      filteredTasks = tasks.filter(t => !t.completed);
    } else if (filter === 'completed') {
      filteredTasks = tasks.filter(t => t.completed);
    }

    taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
      emptyState.classList.add('visible');
    } else {
      emptyState.classList.remove('visible');
    }

    filteredTasks.forEach(task => {
      const item = document.createElement('div');
      item.className = `task-item ${task.completed ? 'is-complete' : ''}`;
      item.innerHTML = `
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onclick="toggleTask(${task.id})">
          <div class="task-content">
            <h3 class="task-title">${escapeHTML(task.title)}</h3>
            <span class="task-subject">${escapeHTML(task.subject)}</span>
            <span class="task-date">Added: ${escapeHTML(task.dateAdded)}</span>
            ${getDueMarkup(task)}
          </div>
        </div>
        <div class="task-actions">
          <span class="status-label">${task.completed ? 'Completed' : 'Pending'}</span>
          <button class="delete-button" onclick="deleteTask(${task.id})" title="Delete Task">&times;</button>
        </div>
      `;
      taskList.appendChild(item);
    });
  }

  function getDueMarkup(task) {
    if (!task.dueAt) {
      return '';
    }

    const dueDate = new Date(task.dueAt);
    if (Number.isNaN(dueDate.getTime())) {
      return '';
    }

    return `
      <span class="task-due" data-due-at="${dueDate.toISOString()}">
        <span class="due-label">Due ${dueDate.toLocaleString([], {
          dateStyle: 'medium',
          timeStyle: 'short'
        })}</span>
        <strong class="countdown">${getCountdownText(dueDate)}</strong>
      </span>
    `;
  }

  function getCountdownText(dueDate) {
    const difference = dueDate.getTime() - Date.now();
    if (difference < 0) {
      return 'Overdue';
    }

    const totalSeconds = Math.floor(difference / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} remaining`;
  }

  function updateCountdowns() {
    document.querySelectorAll('.task-due').forEach(dueElement => {
      const dueDate = new Date(dueElement.dataset.dueAt);
      const difference = dueDate.getTime() - Date.now();
      const countdown = dueElement.querySelector('.countdown');

      countdown.textContent = getCountdownText(dueDate);
      dueElement.classList.toggle('is-overdue', difference < 0);
      dueElement.classList.toggle('is-urgent', difference >= 0 && difference <= 3600000);
    });
  }

  // Update Stats & Progress Bar
  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    totalCountEl.textContent = total;
    completedCountEl.textContent = completed;
    pendingCountEl.textContent = pending;
    listCountEl.textContent = total;
    progressPercentEl.textContent = `${percent}%`;
    progressFillEl.style.width = `${percent}%`;
  }

  // Security Helper
  function escapeHTML(str) {
    return String(str || '').replace(/[&<>'"]/g,
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag] || tag)
    );
  }

  // Initial render
  saveAndRender();
  setInterval(updateCountdowns, 1000);
});