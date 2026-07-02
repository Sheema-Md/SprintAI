/**
 * SprintMind AI - Main Client Application Logic (Production Level)
 * 
 * FEATURES:
 * 1. Multi-Theme Caching (Cyberpunk, Ocean, Emerald, Sunset).
 * 2. High-Tech AI Agent Loading Monitor Terminal Simulator.
 * 3. Dynamic Task Editor Modal (Add, Edit, Delete).
 * 4. Interactive Kanban Board with Quick-Shift Controls.
 * 5. Client-Side Workload & Feasibility Score Calculation Engine.
 * 6. Multi-Format Exporter (JSON, Markdown, CSV) & JSON Importer.
 */

document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentPlan = null;
    let activeTab = 'timeline'; // 'timeline' or 'kanban'
    let selectedKanbanWeek = 1; // 1-indexed
    let editingSprintIdx = null;
    let editingTaskIdx = null;
    let modalMode = 'edit'; // 'edit' or 'add'

    const STORAGE_KEY = 'sprint_planner_saved_plans';
    const THEME_KEY = 'sprint_planner_active_theme';

    // DOM Elements
    const body = document.body;
    const themeSelect = document.getElementById('theme-select');
    const form = document.getElementById('sprint-form');
    const submitBtn = document.getElementById('submit-btn');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const importJsonInput = document.getElementById('import-json');

    // Display Panels
    const idleState = document.getElementById('idle-state');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const planDashboard = document.getElementById('plan-dashboard');

    // Dashboard Meta
    const planTitle = document.getElementById('plan-title');
    const planSummary = document.getElementById('plan-summary');
    const feasibilityScore = document.getElementById('feasibility-score');
    const scoreCircle = document.getElementById('score-circle');
    const metricBudget = document.getElementById('metric-budget');
    const metricDuration = document.getElementById('metric-duration');
    const metricNotes = document.getElementById('metric-notes');
    const sprintsContainer = document.getElementById('sprints-container');

    // Progress Controls
    const completedTasksCount = document.getElementById('completed-tasks-count');
    const totalTasksCount = document.getElementById('total-tasks-count');
    const totalHoursCompleted = document.getElementById('total-hours-completed');
    const totalHoursEstimate = document.getElementById('total-hours-estimate');
    const progressPercentLabel = document.getElementById('progress-percent-label');
    const progressBarFill = document.getElementById('progress-bar-fill');

    // Tabs & Switchers
    const tabTimelineBtn = document.getElementById('tab-timeline-btn');
    const tabKanbanBtn = document.getElementById('tab-kanban-btn');
    const timelineView = document.getElementById('timeline-view');
    const kanbanView = document.getElementById('kanban-view');

    // Kanban Controls & Columns
    const kanbanWeekSelect = document.getElementById('kanban-week-select');
    const kanbanAddTaskBtn = document.getElementById('kanban-add-task-btn');
    const tasksTodo = document.getElementById('tasks-todo');
    const tasksInprogress = document.getElementById('tasks-inprogress');
    const tasksDone = document.getElementById('tasks-done');
    const countTodo = document.getElementById('count-todo');
    const countInprogress = document.getElementById('count-inprogress');
    const countDone = document.getElementById('count-done');

    // Export Dropdown Controls
    const exportDropdownBtn = document.getElementById('export-dropdown-btn');
    const exportDropdown = document.getElementById('export-dropdown');

    // Modals
    const taskModal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');
    const modalTitle = document.getElementById('modal-title');
    const modalTaskName = document.getElementById('modal-task-name');
    const modalTaskHours = document.getElementById('modal-task-hours');
    const modalTaskSchedule = document.getElementById('modal-task-schedule');
    const modalTaskBuffer = document.getElementById('modal-task-buffer');
    const deleteTaskBtn = document.getElementById('delete-task-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // Initializations
    initTheme();
    renderHistory();

    // Event Listeners
    form.addEventListener('submit', handleFormSubmit);
    retryBtn.addEventListener('click', () => showState('idle'));
    clearHistoryBtn.addEventListener('click', clearHistory);
    importJsonInput.addEventListener('change', handleImportJson);

    // Tab Listeners
    tabTimelineBtn.addEventListener('click', () => switchTab('timeline'));
    tabKanbanBtn.addEventListener('click', () => switchTab('kanban'));

    // Export Listener
    exportDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', () => exportDropdown.classList.add('hidden'));

    document.querySelectorAll('.export-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const format = e.currentTarget.getAttribute('data-format');
            exportPlan(format);
        });
    });

    // Theme Switcher Listener
    themeSelect.addEventListener('change', (e) => {
        setTheme(e.target.value);
    });

    // Kanban Week Selector Listener
    kanbanWeekSelect.addEventListener('change', (e) => {
        selectedKanbanWeek = parseInt(e.target.value, 10);
        renderKanbanBoard();
    });

    // Add Task Listener
    kanbanAddTaskBtn.addEventListener('click', () => {
        openTaskModalForAdd(selectedKanbanWeek - 1);
    });

    // Modal close listeners
    closeModalBtn.addEventListener('click', () => hideModal(taskModal));

    // Task form submission
    taskForm.addEventListener('submit', handleTaskFormSubmit);
    deleteTaskBtn.addEventListener('click', handleDeleteTask);

    /**
     * Theme management
     */
    function initTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY) || 'theme-cyberpunk';
        setTheme(savedTheme);
        themeSelect.value = savedTheme;
    }

    function setTheme(themeClass) {
        body.className = '';
        body.classList.add(themeClass);
        localStorage.setItem(THEME_KEY, themeClass);
    }

    /**
     * Shows modal helper
     */
    function showModal(modalEl) {
        modalEl.classList.remove('hidden');
    }

    function hideModal(modalEl) {
        modalEl.classList.add('hidden');
    }

    /**
     * Modal logic for adding task
     */
    function openTaskModalForAdd(sprintIdx) {
        modalMode = 'add';
        editingSprintIdx = sprintIdx;
        editingTaskIdx = null;

        modalTitle.textContent = `Add Task to Week ${sprintIdx + 1}`;
        modalTaskName.value = '';
        modalTaskHours.value = '2.0';
        modalTaskSchedule.value = '';
        modalTaskBuffer.value = '';

        deleteTaskBtn.classList.add('hidden');
        showModal(taskModal);
    }

    /**
     * Modal logic for editing task
     */
    function openTaskModalForEdit(sprintIdx, taskIdx) {
        modalMode = 'edit';
        editingSprintIdx = sprintIdx;
        editingTaskIdx = taskIdx;

        const task = currentPlan.sprints[sprintIdx].tasks[taskIdx];
        modalTitle.textContent = `Edit Task (Week ${sprintIdx + 1})`;
        modalTaskName.value = task.task_name || '';
        modalTaskHours.value = task.estimated_hours || 1;
        modalTaskSchedule.value = task.suggested_schedule || '';
        modalTaskBuffer.value = task.buffer_note || '';

        deleteTaskBtn.classList.remove('hidden');
        showModal(taskModal);
    }

    /**
     * Form submit for adding or updating tasks
     */
    function handleTaskFormSubmit(e) {
        e.preventDefault();

        const name = modalTaskName.value.trim();
        const hours = parseFloat(modalTaskHours.value);
        const schedule = modalTaskSchedule.value.trim();
        const buffer = modalTaskBuffer.value.trim();

        if (!name || isNaN(hours) || hours <= 0) {
            alert('Please supply a valid task name and hours.');
            return;
        }

        if (modalMode === 'add') {
            const newTask = {
                task_name: name,
                estimated_hours: hours,
                suggested_schedule: schedule || null,
                buffer_note: buffer || null,
                completed: false,
                status: 'todo'
            };
            if (!currentPlan.sprints[editingSprintIdx].tasks) {
                currentPlan.sprints[editingSprintIdx].tasks = [];
            }
            currentPlan.sprints[editingSprintIdx].tasks.push(newTask);
        } else {
            const task = currentPlan.sprints[editingSprintIdx].tasks[editingTaskIdx];
            task.task_name = name;
            task.estimated_hours = hours;
            task.suggested_schedule = schedule || null;
            task.buffer_note = buffer || null;
        }

        recalculatePlanMetrics();
        savePlanToStorage(currentPlan);
        renderHistory();
        renderPlanDashboard(currentPlan);

        hideModal(taskModal);
    }

    /**
     * Handles task deletion
     */
    function handleDeleteTask() {
        if (editingSprintIdx === null || editingTaskIdx === null) return;

        if (confirm('Are you sure you want to delete this task?')) {
            currentPlan.sprints[editingSprintIdx].tasks.splice(editingTaskIdx, 1);

            recalculatePlanMetrics();
            savePlanToStorage(currentPlan);
            renderHistory();
            renderPlanDashboard(currentPlan);

            hideModal(taskModal);
        }
    }

    /**
     * Dynamic validation and Feasibility Calculator heuristic
     */
    function recalculatePlanMetrics() {
        if (!currentPlan || !currentPlan.sprints) return;

        let totalTasks = 0;
        let completedTasks = 0;
        let totalEstHours = 0;
        let totalCompHours = 0;
        const weeklyBudget = currentPlan.weekly_hours_budget || 10;
        let totalFeasibilityDeductions = 0;

        currentPlan.sprints.forEach((sprint) => {
            let sprintHours = 0;
            if (sprint.tasks) {
                sprint.tasks.forEach((task) => {
                    totalTasks++;
                    totalEstHours += task.estimated_hours;
                    sprintHours += task.estimated_hours;

                    if (task.completed || task.status === 'done') {
                        completedTasks++;
                        totalCompHours += task.estimated_hours;
                    }
                });
            }

            // Heuristic deduction: If weekly hours exceed the budget, it drops feasibility
            if (sprintHours > weeklyBudget) {
                const overage = sprintHours - weeklyBudget;
                totalFeasibilityDeductions += (overage * 8); // -8% feasibility score per hour over budget
            }
        });

        // Calculate custom feasibility score
        let newScore = Math.max(20, Math.min(100, Math.round(95 - totalFeasibilityDeductions)));
        currentPlan.feasibility_score = newScore;

        if (totalFeasibilityDeductions > 0) {
            currentPlan.feasibility_notes = `Warning: Workload exceeds budget in some weeks. Buffer risk exists. Suggest delegating or scheduling extra time.`;
        } else {
            currentPlan.feasibility_notes = `Excellent pacing! The workload fits neatly within your weekly budget with safety margins.`;
        }
    }

    /**
     * Client UI Switcher Tabs
     */
    function switchTab(tab) {
        activeTab = tab;
        tabTimelineBtn.classList.toggle('active', tab === 'timeline');
        tabKanbanBtn.classList.toggle('active', tab === 'kanban');

        timelineView.classList.toggle('hidden', tab !== 'timeline');
        kanbanView.classList.toggle('hidden', tab !== 'kanban');

        if (tab === 'kanban') {
            renderKanbanBoard();
        }
    }

    /**
     * Handles Form Submission and API Request
     */
    async function handleFormSubmit(e) {
        e.preventDefault();

        const goal = document.getElementById('goal').value.trim();
        const timeframe = document.getElementById('timeframe').value.trim();
        const hours_per_week = document.getElementById('hours').value.trim();

        if (!goal || !timeframe || !hours_per_week) {
            alert('Please fill out all required fields.');
            return;
        }

        showState('loading');

        try {
            // Call API
            const response = await fetch('/api/generate-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    goal,
                    timeframe,
                    hours_per_week: parseFloat(hours_per_week)
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to generate sprint plan from server.');
            }

            // Populate initial status/completed values if absent
            currentPlan = result.data;
            sanitizePlanTasks(currentPlan);

            // Save to localStorage
            savePlanToStorage(currentPlan);
            renderHistory();

            // Render and show dashboard
            renderPlanDashboard(currentPlan);

            showState('dashboard');
            switchTab('timeline');

        } catch (err) {
            console.error('API Error:', err);
            errorMessage.textContent = err.message || 'An unexpected server error occurred.';
            showState('error');
        }
    }

    /**
     * Sanitizes response JSON to ensure every task has status and completed fields
     */
    function sanitizePlanTasks(plan) {
        if (plan && plan.sprints) {
            plan.sprints.forEach((sprint) => {
                if (sprint.tasks) {
                    sprint.tasks.forEach((task) => {
                        if (task.completed === undefined) {
                            task.completed = false;
                        }
                        if (!task.status) {
                            task.status = task.completed ? 'done' : 'todo';
                        }
                    });
                }
            });
        }
    }

    /**
     * Controls Visibility of Output States
     */
    function showState(state) {
        idleState.classList.add('hidden');
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        planDashboard.classList.add('hidden');

        if (state === 'idle') idleState.classList.remove('hidden');
        if (state === 'loading') loadingState.classList.remove('hidden');
        if (state === 'error') errorState.classList.remove('hidden');
        if (state === 'dashboard') planDashboard.classList.remove('hidden');

        if (window.lucide) lucide.createIcons();
    }

    /**
     * Renders the Plan Output Dashboard
     */
    function renderPlanDashboard(plan) {
        planTitle.textContent = plan.project_title || 'Sprint Schedule';
        planSummary.textContent = plan.summary || 'Custom generated agile plan.';

        // Feasibility Gauge
        const score = plan.feasibility_score || 85;
        feasibilityScore.textContent = `${score}%`;
        scoreCircle.style.background = `conic-gradient(var(--accent) ${score}%, rgba(255,255,255,0.06) ${score}%)`;

        metricBudget.textContent = `${plan.weekly_hours_budget || 10} hrs/wk`;
        metricDuration.textContent = `${plan.total_duration_weeks || 4} weeks`;
        metricNotes.textContent = plan.feasibility_notes || 'Timeline loaded with burnout buffer margins.';

        // Render Sprints in Timeline View
        sprintsContainer.innerHTML = '';

        if (plan.sprints && Array.isArray(plan.sprints)) {
            plan.sprints.forEach((sprint, sprintIdx) => {
                const sprintCard = document.createElement('div');
                sprintCard.className = 'sprint-card';

                let tasksHtml = '';
                if (sprint.tasks && Array.isArray(sprint.tasks)) {
                    sprint.tasks.forEach((task, taskIdx) => {
                        const checkedAttr = task.completed ? 'checked' : '';
                        const completedClass = task.completed ? 'completed' : '';
                        tasksHtml += `
                            <div class="task-item ${completedClass}" data-sprint="${sprintIdx}" data-task="${taskIdx}">
                                <input type="checkbox" class="task-checkbox" ${checkedAttr} onclick="event.stopPropagation()">
                                <div class="task-details">
                                    <div class="task-name">${escapeHtml(task.task_name)}</div>
                                    <div class="task-meta">
                                        <span class="meta-hours"><i data-lucide="clock" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"></i> ${task.estimated_hours}h</span>
                                        ${task.suggested_schedule ? `<span><i data-lucide="calendar" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"></i> ${escapeHtml(task.suggested_schedule)}</span>` : ''}
                                        ${task.buffer_note ? `<span class="meta-buffer"><i data-lucide="shield-alert" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"></i> ${escapeHtml(task.buffer_note)}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                }

                sprintCard.innerHTML = `
                    <div class="sprint-header">
                        <div>
                            <span class="sprint-tag">Week ${sprint.week_number}</span>
                            <span class="sprint-title">${escapeHtml(sprint.sprint_title)}</span>
                        </div>
                        <div class="sprint-header-actions">
                            <button class="btn btn-secondary btn-sm add-task-btn" data-sprint="${sprintIdx}"><i data-lucide="plus"></i> Add Task</button>
                        </div>
                    </div>
                    <div class="sprint-body">
                        <div class="sprint-objective">${escapeHtml(sprint.objective)}</div>
                        <div class="tasks-list">
                            ${tasksHtml || '<div class="empty-history" style="padding:0.5rem 0">No tasks in this sprint.</div>'}
                        </div>
                        ${sprint.milestone_checkpoint ? `
                            <div class="milestone-footer">
                                <i data-lucide="flag" style="width:14px;height:14px"></i>
                                <span>Checkpoint: ${escapeHtml(sprint.milestone_checkpoint)}</span>
                            </div>
                        ` : ''}
                    </div>
                `;

                sprintsContainer.appendChild(sprintCard);
            });

            // Set up double click listener to edit task items
            sprintsContainer.querySelectorAll('.task-item').forEach(item => {
                item.addEventListener('dblclick', (e) => {
                    const sprintIdx = parseInt(item.getAttribute('data-sprint'), 10);
                    const taskIdx = parseInt(item.getAttribute('data-task'), 10);
                    openTaskModalForEdit(sprintIdx, taskIdx);
                });

                // Toggle check status when clicking checkbox
                item.querySelector('.task-checkbox').addEventListener('change', (e) => {
                    const sprintIdx = parseInt(item.getAttribute('data-sprint'), 10);
                    const taskIdx = parseInt(item.getAttribute('data-task'), 10);
                    const completed = e.target.checked;

                    const task = currentPlan.sprints[sprintIdx].tasks[taskIdx];
                    task.completed = completed;
                    task.status = completed ? 'done' : 'todo';

                    item.classList.toggle('completed', completed);

                    recalculatePlanMetrics();
                    savePlanToStorage(currentPlan);
                    updateProgressCounters();
                });
            });

            // Set up inline add task click listeners
            sprintsContainer.querySelectorAll('.add-task-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const sprintIdx = parseInt(btn.getAttribute('data-sprint'), 10);
                    openTaskModalForAdd(sprintIdx);
                });
            });
        }

        // Initialize Week Selector for Kanban
        populateKanbanWeekSelector(plan);

        // Update overall progress numbers
        updateProgressCounters();

        if (window.lucide) lucide.createIcons();
    }

    /**
     * Populates Kanban focused week dropdown
     */
    function populateKanbanWeekSelector(plan) {
        kanbanWeekSelect.innerHTML = '';
        if (plan.sprints && plan.sprints.length > 0) {
            plan.sprints.forEach((sprint) => {
                const opt = document.createElement('option');
                opt.value = sprint.week_number;
                opt.textContent = `Week ${sprint.week_number} - ${sprint.sprint_title}`;
                kanbanWeekSelect.appendChild(opt);
            });
            // Reset focus to week 1 if timeline exceeds weeks
            if (selectedKanbanWeek > plan.sprints.length) {
                selectedKanbanWeek = 1;
            }
            kanbanWeekSelect.value = selectedKanbanWeek;
        }
    }

    /**
     * Renders Kanban board for active focused week
     */
    function renderKanbanBoard() {
        tasksTodo.innerHTML = '';
        tasksInprogress.innerHTML = '';
        tasksDone.innerHTML = '';

        if (!currentPlan || !currentPlan.sprints) return;

        const sprintIdx = selectedKanbanWeek - 1;
        const sprint = currentPlan.sprints[sprintIdx];
        if (!sprint) return;

        let todoCount = 0;
        let inprogressCount = 0;
        let doneCount = 0;

        if (sprint.tasks && Array.isArray(sprint.tasks)) {
            sprint.tasks.forEach((task, taskIdx) => {
                // Ensure default values are active
                if (!task.status) {
                    task.status = task.completed ? 'done' : 'todo';
                }

                const card = document.createElement('div');
                card.className = 'kanban-card';
                card.setAttribute('data-task', taskIdx);
                card.innerHTML = `
                    <div class="kanban-card-title">${escapeHtml(task.task_name)}</div>
                    <div class="kanban-card-meta">
                        <span class="meta-hours"><i data-lucide="clock" style="width:10px;height:10px;display:inline-block;vertical-align:middle;"></i> ${task.estimated_hours}h</span>
                        ${task.suggested_schedule ? `<span><i data-lucide="calendar" style="width:10px;height:10px;display:inline-block;vertical-align:middle;"></i> ${escapeHtml(task.suggested_schedule)}</span>` : ''}
                    </div>
                    <div class="kanban-card-footer">
                        ${task.status !== 'todo' ? `<button class="kanban-move-btn shift-left" title="Move to left"><i data-lucide="chevron-left" style="width:12px;height:12px"></i></button>` : ''}
                        ${task.status !== 'done' ? `<button class="kanban-move-btn shift-right" title="Move to right"><i data-lucide="chevron-right" style="width:12px;height:12px"></i></button>` : ''}
                    </div>
                `;

                // Add shift left / right actions
                card.querySelectorAll('.kanban-move-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const isRight = btn.classList.contains('shift-right');
                        shiftTaskStatus(sprintIdx, taskIdx, isRight);
                    });
                });

                // Double click to edit card details
                card.addEventListener('dblclick', () => {
                    openTaskModalForEdit(sprintIdx, taskIdx);
                });

                if (task.status === 'todo') {
                    tasksTodo.appendChild(card);
                    todoCount++;
                } else if (task.status === 'inprogress') {
                    tasksInprogress.appendChild(card);
                    inprogressCount++;
                } else if (task.status === 'done') {
                    tasksDone.appendChild(card);
                    doneCount++;
                }
            });
        }

        countTodo.textContent = todoCount;
        countInprogress.textContent = inprogressCount;
        countDone.textContent = doneCount;

        if (window.lucide) lucide.createIcons();
    }

    /**
     * Shifts task between columns in Kanban Board
     */
    function shiftTaskStatus(sprintIdx, taskIdx, shiftRight) {
        const task = currentPlan.sprints[sprintIdx].tasks[taskIdx];
        if (!task) return;

        if (task.status === 'todo') {
            if (shiftRight) {
                task.status = 'inprogress';
                task.completed = false;
            }
        } else if (task.status === 'inprogress') {
            if (shiftRight) {
                task.status = 'done';
                task.completed = true;
            } else {
                task.status = 'todo';
                task.completed = false;
            }
        } else if (task.status === 'done') {
            if (!shiftRight) {
                task.status = 'inprogress';
                task.completed = false;
            }
        }

        recalculatePlanMetrics();
        savePlanToStorage(currentPlan);
        renderHistory();
        renderPlanDashboard(currentPlan);
        renderKanbanBoard();
    }

    /**
     * Updates completion figures and overall progress card
     */
    function updateProgressCounters() {
        if (!currentPlan || !currentPlan.sprints) return;

        let totalCount = 0;
        let compCount = 0;
        let totalHrs = 0;
        let compHrs = 0;

        currentPlan.sprints.forEach(sprint => {
            if (sprint.tasks) {
                sprint.tasks.forEach(t => {
                    totalCount++;
                    totalHrs += t.estimated_hours;
                    if (t.completed || t.status === 'done') {
                        compCount++;
                        compHrs += t.estimated_hours;
                    }
                });
            }
        });

        completedTasksCount.textContent = compCount;
        totalTasksCount.textContent = totalCount;
        totalHoursCompleted.textContent = compHrs.toFixed(1);
        totalHoursEstimate.textContent = totalHrs.toFixed(1);

        const percent = totalCount > 0 ? Math.round((compCount / totalCount) * 100) : 0;
        progressPercentLabel.textContent = `${percent}%`;
        progressBarFill.style.width = `${percent}%`;
    }

    /**
     * LocalStorage Management
     */
    function savePlanToStorage(plan) {
        try {
            const history = getSavedPlans();
            plan.savedAt = plan.savedAt || new Date().toLocaleDateString();
            const updated = [plan, ...history.filter(p => p.project_title !== plan.project_title)].slice(0, 15);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to write to localStorage:', e);
        }
    }

    function getSavedPlans() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to read from localStorage:', e);
            return [];
        }
    }

    function renderHistory() {
        const history = getSavedPlans();
        historyList.innerHTML = '';

        if (history.length === 0) {
            historyList.innerHTML = '<div class="empty-history">No local plans saved yet.</div>';
            return;
        }

        history.forEach((plan) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-title">${escapeHtml(plan.project_title)}</div>
                <div class="history-meta">${plan.total_duration_weeks}w • ${plan.weekly_hours_budget}h/wk • ${plan.savedAt || 'Saved'}</div>
            `;
            item.addEventListener('click', () => {
                currentPlan = plan;
                sanitizePlanTasks(currentPlan);
                renderPlanDashboard(plan);
                showState('dashboard');
                switchTab('timeline');
            });
            historyList.appendChild(item);
        });
    }

    function clearHistory() {
        if (confirm('Are you sure you want to delete all saved sprint plans?')) {
            localStorage.removeItem(STORAGE_KEY);
            renderHistory();
            if (!planDashboard.classList.contains('hidden')) {
                showState('idle');
            }
        }
    }

    /**
     * File Importer Engine
     */
    function handleImportJson(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (evt) {
            try {
                const plan = JSON.parse(evt.target.result);
                // Basic validation
                if (!plan.project_title || !plan.sprints || !Array.isArray(plan.sprints)) {
                    throw new Error('Required properties (project_title, sprints) are missing.');
                }

                sanitizePlanTasks(plan);
                plan.savedAt = new Date().toLocaleDateString();

                // Save & Render
                currentPlan = plan;
                savePlanToStorage(currentPlan);
                renderHistory();
                renderPlanDashboard(currentPlan);
                showState('dashboard');
                switchTab('timeline');

                alert('Plan imported successfully!');
            } catch (err) {
                alert(`Failed to parse plan file: ${err.message}`);
            }
            // Reset input
            importJsonInput.value = '';
        };
        reader.readAsText(file);
    }

    /**
     * File Exporter Engine
     */
    function exportPlan(format) {
        if (!currentPlan) return;

        let content = '';
        let filename = `${currentPlan.project_title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_plan`;
        let mimeType = 'text/plain';

        if (format === 'json') {
            content = JSON.stringify(currentPlan, null, 2);
            filename += '.json';
            mimeType = 'application/json';
        } else if (format === 'markdown') {
            content = generateMarkdown(currentPlan);
            filename += '.md';
            mimeType = 'text/markdown';
        } else if (format === 'csv') {
            content = generateCSV(currentPlan);
            filename += '.csv';
            mimeType = 'text/csv';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    function generateMarkdown(plan) {
        let md = `# ${plan.project_title}\n\n`;
        md += `> **Feasibility Score**: ${plan.feasibility_score}%  \n`;
        md += `> **Weekly Workload Budget**: ${plan.weekly_hours_budget} hours/week  \n`;
        md += `> **Total Duration**: ${plan.total_duration_weeks} weeks  \n\n`;
        md += `## Executive Summary\n${plan.summary}\n\n`;
        md += `## Burnout & Buffer Analysis\n${plan.feasibility_notes}\n\n`;
        md += `## Sprint Schedule Timeline\n\n`;

        plan.sprints.forEach(sprint => {
            md += `### Week ${sprint.week_number}: ${sprint.sprint_title}\n`;
            md += `* **Sprint Objective**: ${sprint.objective}\n`;
            md += `* **Checkpoint**: ${sprint.milestone_checkpoint}\n\n`;
            md += `| Completed | Task | Est. Hours | Suggested Schedule | Buffer notes |\n`;
            md += `| :---: | :--- | :---: | :--- | :--- |\n`;

            if (sprint.tasks && sprint.tasks.length > 0) {
                sprint.tasks.forEach(t => {
                    const compSign = t.completed || t.status === 'done' ? '[x]' : '[ ]';
                    const sched = t.suggested_schedule || '-';
                    const buf = t.buffer_note || '-';
                    md += `| ${compSign} | ${t.task_name} | ${t.estimated_hours}h | ${sched} | ${buf} |\n`;
                });
            } else {
                md += `| | No tasks defined. | | | |\n`;
            }
            md += `\n`;
        });

        return md;
    }

    function generateCSV(plan) {
        let csv = 'Week,Sprint Title,Objective,Checkpoint,Task Name,Est Hours,Schedule,Buffer,Completed\n';
        plan.sprints.forEach(sprint => {
            const week = sprint.week_number;
            const title = escapeCSV(sprint.sprint_title);
            const obj = escapeCSV(sprint.objective);
            const check = escapeCSV(sprint.milestone_checkpoint);

            if (sprint.tasks && sprint.tasks.length > 0) {
                sprint.tasks.forEach(t => {
                    const taskName = escapeCSV(t.task_name);
                    const hours = t.estimated_hours;
                    const sched = escapeCSV(t.suggested_schedule || '');
                    const buf = escapeCSV(t.buffer_note || '');
                    const comp = t.completed || t.status === 'done' ? 'Yes' : 'No';
                    csv += `${week},${title},${obj},${check},${taskName},${hours},${sched},${buf},${comp}\n`;
                });
            } else {
                csv += `${week},${title},${obj},${check},,,,\n`;
            }
        });
        return csv;
    }

    function escapeCSV(str) {
        if (!str) return '';
        const escaped = str.replace(/"/g, '""');
        return `"${escaped}"`;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
});
