document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const taskForm = document.getElementById('taskForm');
  const taskTitleInput = document.getElementById('taskTitle');
  const taskSubjectInput = document.getElementById('taskSubject');
  const taskList = document.getElementById('taskList');
  const totalCountEl = document.getElementById('totalCount');
  const completedCountEl = document.getElementById('completedCount');
  const pendingCountEl = document.getElementById('pendingCount');
  const progressPercentEl = document.getElementById('progressPercent');
  const progressFillEl = document.getElementById('progressFill');
  const filterSelect = document.getElementById('filterSelect');
  const emptyState = document.getElementById('emptyState');
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const liveClock = document.getElementById('liveClock');
  const currentDateEl = document.getElementById('currentDate');
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
      dateAdded: new Date().toLocaleDateString()
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
            <span class="task-date">Added: ${task.dateAdded}</span>
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

  // Update Stats & Progress Bar
  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    totalCountEl.textContent = total;
    completedCountEl.textContent = completed;
    pendingCountEl.textContent = pending;
    progressPercentEl.textContent = `${percent}%`;
    progressFillEl.style.width = `${percent}%`;
  }

  // Security Helper
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag] || tag)
    );
  }

  // Initial render
  saveAndRender();
});