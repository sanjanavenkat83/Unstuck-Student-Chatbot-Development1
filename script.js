/**
 * UNSTUCK — Your Student Problem-Solving Assistant
 * Pure Vanilla JavaScript Client-Side NLP & State Engine
 * 
 * Features:
 *  - Pattern-based and keyword-based Intent Recognition
 *  - Entity Extraction (Subject, Date, Workload, Priority)
 *  - Multi-Turn Slot Filling & Context State Machine
 *  - Smart Academic Prioritisation Algorithm
 *  - Personalized Exam Study Plan Generator
 *  - Emergency "Running Out of Time" Workload Triage
 *  - LocalStorage Persistent Data Management
 *  - Synchronous Dual-View (Chatbot + Interactive Dashboard)
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. CONFIGURATION & CONSTANTS
  // =========================================================================
  const STORAGE_KEY_TASKS = 'unstuck_tasks_v2';
  const STORAGE_KEY_CHAT = 'unstuck_chat_history_v2';

  // Recognized academic subjects for entity extraction
  const ACADEMIC_SUBJECTS = [
    'python', 'java', 'c++', 'c programming', 'javascript', 'html', 'css', 'react', 'sql',
    'database', 'data structures', 'algorithms', 'dsa', 'operating systems', 'networking',
    'machine learning', 'artificial intelligence', 'ai', 'calculus', 'linear algebra',
    'mathematics', 'math', 'discrete math', 'statistics', 'physics', 'chemistry', 'biology',
    'economics', 'microeconomics', 'macroeconomics', 'accounting', 'finance', 'history',
    'psychology', 'sociology', 'philosophy', 'literature', 'english', 'engineering',
    'digital logic', 'computer science', 'web development', 'cybersecurity'
  ];

  // =========================================================================
  // 2. STORAGE MANAGER
  // =========================================================================
  const StorageManager = {
    getTasks() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_TASKS);
        if (!raw) {
          return this.seedDefaultTasks();
        }
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to load tasks from localStorage', e);
        return [];
      }
    },

    saveTasks(tasks) {
      try {
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
      } catch (e) {
        console.error('Failed to save tasks to localStorage', e);
      }
    },

    seedDefaultTasks() {
      // Current anchor date helper: Today is approx Nov 20, 2026
      const today = new Date();
      
      const addDays = (d, n) => {
        const result = new Date(d);
        result.setDate(result.getDate() + n);
        return result.toISOString().split('T')[0];
      };

      const seed = [
        {
          id: 'task_' + Date.now() + '_1',
          title: 'Python Machine Learning Assignment',
          subject: 'Python',
          category: 'assignment',
          dueDate: addDays(today, 2), // Due in 2 days (Urgent)
          workloadHours: 4,
          priority: 'high',
          completed: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'task_' + Date.now() + '_2',
          title: 'Data Structures Midterm Exam',
          subject: 'Data Structures',
          category: 'exam',
          dueDate: addDays(today, 5), // Due in 5 days
          workloadHours: 10,
          priority: 'critical',
          completed: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'task_' + Date.now() + '_3',
          title: 'Calculus Problem Set 4',
          subject: 'Calculus',
          category: 'assignment',
          dueDate: addDays(today, 8),
          workloadHours: 3,
          priority: 'medium',
          completed: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'task_' + Date.now() + '_4',
          title: 'Web Dev Portfolio Milestone 1',
          subject: 'Web Development',
          category: 'project',
          dueDate: addDays(today, -1), // Completed yesterday
          workloadHours: 5,
          priority: 'medium',
          completed: true,
          createdAt: new Date().toISOString()
        }
      ];

      this.saveTasks(seed);
      return seed;
    },

    getChatHistory() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_CHAT);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },

    saveChatHistory(history) {
      try {
        localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(history.slice(-30))); // Keep last 30
      } catch (e) {
        console.error('Chat storage error', e);
      }
    },

    clearChatHistory() {
      localStorage.removeItem(STORAGE_KEY_CHAT);
    }
  };

  // =========================================================================
  // 3. DATE & TIME UTILITY ENGINE
  // =========================================================================
  const DateUtils = {
    // Normalizes input string to a real Date object and YYYY-MM-DD
    parseNaturalDate(text) {
      if (!text || typeof text !== 'string') return null;
      const lower = text.toLowerCase().trim();
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Relative terms
      if (lower === 'today' || lower === 'tonight') {
        return this.formatISO(now);
      }
      if (lower === 'tomorrow') {
        const d = new Date(now);
        d.setDate(d.getDate() + 1);
        return this.formatISO(d);
      }
      if (lower === 'day after tomorrow') {
        const d = new Date(now);
        d.setDate(d.getDate() + 2);
        return this.formatISO(d);
      }

      // "in X days"
      const inDaysMatch = lower.match(/in\s+(\d+)\s+days?/i);
      if (inDaysMatch) {
        const days = parseInt(inDaysMatch[1], 10);
        const d = new Date(now);
        d.setDate(d.getDate() + days);
        return this.formatISO(d);
      }

      // "in a week" or "next week"
      if (lower.includes('in a week') || lower === 'next week') {
        const d = new Date(now);
        d.setDate(d.getDate() + 7);
        return this.formatISO(d);
      }

      // Day of week e.g. "this friday", "next monday", "friday"
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      for (let i = 0; i < daysOfWeek.length; i++) {
        const dayName = daysOfWeek[i];
        if (lower.includes(dayName)) {
          const currentDay = now.getDay();
          let diff = i - currentDay;
          if (lower.includes('next') && diff <= 0) {
            diff += 7;
          } else if (diff <= 0) {
            diff += 7; // Next occurrence of that day
          }
          const target = new Date(now);
          target.setDate(target.getDate() + diff);
          return this.formatISO(target);
        }
      }

      // Month name parsing, e.g. "November 25", "Nov 25", "25th Nov", "25 November"
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const monthShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

      for (let m = 0; m < 12; m++) {
        const full = monthNames[m];
        const short = monthShort[m];
        const regex = new RegExp(`(?:${full}|${short})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?|(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:${full}|${short})\\.?`, 'i');
        const match = lower.match(regex);
        if (match) {
          const day = parseInt(match[1] || match[3], 10);
          const year = match[2] ? parseInt(match[2], 10) : now.getFullYear();
          if (day >= 1 && day <= 31) {
            const parsed = new Date(year, m, day);
            // If the date passed in the current year and user didn't specify year, assume next year
            if (!match[2] && parsed < now && (now.getMonth() - m > 1)) {
              parsed.setFullYear(year + 1);
            }
            return this.formatISO(parsed);
          }
        }
      }

      // ISO or Slash format YYYY-MM-DD or MM/DD/YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) {
        return lower;
      }

      const slashMatch = lower.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
      if (slashMatch) {
        let m = parseInt(slashMatch[1], 10) - 1;
        let d = parseInt(slashMatch[2], 10);
        let y = parseInt(slashMatch[3], 10);
        if (y < 100) y += 2000;
        const parsed = new Date(y, m, d);
        if (!isNaN(parsed.getTime())) {
          return this.formatISO(parsed);
        }
      }

      // Native fallback
      const direct = new Date(text);
      if (!isNaN(direct.getTime()) && direct.getFullYear() > 2000) {
        return this.formatISO(direct);
      }

      return null;
    },

    formatISO(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    },

    formatDisplay(dateStr) {
      if (!dateStr) return 'No Date';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return dateStr;
    },

    calculateDaysRemaining(dateStr) {
      if (!dateStr) return { days: 999, text: 'No deadline', isUrgent: false, isOverdue: false };
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const parts = dateStr.split('-');
      const due = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      due.setHours(0, 0, 0, 0);

      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return {
          days: diffDays,
          text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}!`,
          isUrgent: true,
          isOverdue: true
        };
      }
      if (diffDays === 0) {
        return { days: 0, text: 'Due Today!', isUrgent: true, isOverdue: false };
      }
      if (diffDays === 1) {
        return { days: 1, text: 'Due Tomorrow', isUrgent: true, isOverdue: false };
      }
      if (diffDays <= 2) {
        return { days: diffDays, text: `Due in ${diffDays} days`, isUrgent: true, isOverdue: false };
      }
      return { days: diffDays, text: `In ${diffDays} days`, isUrgent: false, isOverdue: false };
    }
  };

  // =========================================================================
  // 4. SMART PRIORITISATION ENGINE
  // =========================================================================
  const PriorityEngine = {
    /**
     * Calculates priority score based on:
     * - Deadline proximity (Urgency)
     * - Remaining workload hours
     * - Base importance
     */
    calculateTaskPriority(task) {
      if (task.completed) return 'low';
      if (task.priority && task.priority !== 'auto') {
        return task.priority;
      }

      const daysInfo = DateUtils.calculateDaysRemaining(task.dueDate);
      const hours = parseFloat(task.workloadHours) || 3;

      let score = 0;

      // Deadline weight
      if (daysInfo.isOverdue) score += 60;
      else if (daysInfo.days === 0) score += 55;
      else if (daysInfo.days === 1) score += 45;
      else if (daysInfo.days <= 2) score += 35;
      else if (daysInfo.days <= 4) score += 20;
      else if (daysInfo.days <= 7) score += 10;

      // Workload weight
      if (hours >= 8) score += 25;
      else if (hours >= 4) score += 15;
      else if (hours >= 2) score += 8;

      // Category weight
      if (task.category === 'exam') score += 20;
      else if (task.category === 'project') score += 10;

      if (score >= 50) return 'critical';
      if (score >= 35) return 'high';
      if (score >= 20) return 'medium';
      return 'low';
    },

    // Sort tasks: Incomplete first, then by priority (critical > high > medium > low), then closest deadline
    sortTasks(tasks) {
      const priorityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
      return [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const pA = priorityWeights[this.calculateTaskPriority(a)] || 0;
        const pB = priorityWeights[this.calculateTaskPriority(b)] || 0;
        if (pA !== pB) return pB - pA;
        // Closest date
        const dA = new Date(a.dueDate).getTime();
        const dB = new Date(b.dueDate).getTime();
        return dA - dB;
      });
    }
  };

  // =========================================================================
  // 5. NLP ENGINE — INTENT RECOGNITION & ENTITY EXTRACTION
  // =========================================================================
  const NLPEngine = {
    // Intents catalogue
    INTENTS: {
      ADD_ASSIGNMENT: 'ADD_ASSIGNMENT',
      VIEW_TASKS: 'VIEW_TASKS',
      CHECK_DEADLINES: 'CHECK_DEADLINES',
      STUDY_PLAN: 'STUDY_PLAN',
      DAYS_REMAINING: 'DAYS_REMAINING',
      PRIORITIZE: 'PRIORITIZE',
      PANIC_MODE: 'PANIC_MODE',
      TIME_MANAGEMENT: 'TIME_MANAGEMENT',
      COMPLETE_TASK: 'COMPLETE_TASK',
      DELETE_TASK: 'DELETE_TASK',
      CLEAR_DATA: 'CLEAR_DATA',
      GREETING: 'GREETING',
      HELP: 'HELP',
      CANCEL: 'CANCEL',
      UNKNOWN: 'UNKNOWN'
    },

    detectIntent(text) {
      if (!text || typeof text !== 'string') return this.INTENTS.UNKNOWN;
      const t = text.toLowerCase().trim();

      // Cancel check
      if (t === 'cancel' || t === 'nevermind' || t === 'stop' || t === 'abort' || t === 'exit') {
        return this.INTENTS.CANCEL;
      }

      // Reset / Clear check
      if (t.includes('reset chat') || t.includes('clear chat') || t.includes('clear everything') || t.includes('start over')) {
        return this.INTENTS.CLEAR_DATA;
      }

      // Panic / Overwhelmed / Running out of time
      if (
        t.includes('running out of time') ||
        t.includes('out of time') ||
        t.includes('behind schedule') ||
        t.includes('falling behind') ||
        t.includes('overwhelmed') ||
        t.includes('stressed') ||
        t.includes('panic') ||
        t.includes('emergency') ||
        t.includes('too much work') ||
        t.includes("can't keep up") ||
        t.includes('help me i have so much')
      ) {
        return this.INTENTS.PANIC_MODE;
      }

      // Study plan / exam preparation
      if (
        t.includes('study plan') ||
        t.includes('study schedule') ||
        t.includes('exam prep') ||
        t.includes('prepare for') ||
        t.includes('revision plan') ||
        t.includes('revision schedule') ||
        t.includes('how to study for') ||
        t.includes('exam coming up') ||
        t.includes('study routine') ||
        t.includes('exam next') ||
        t.includes('exam in') ||
        t.includes('exam on') ||
        (t.includes('exam') && !t.includes('delete') && !t.includes('mark') && !t.includes('remove')) ||
        (t.includes('midterm') && !t.includes('delete') && !t.includes('mark') && !t.includes('remove'))
      ) {
        return this.INTENTS.STUDY_PLAN;
      }

      // Add assignment / task
      if (
        t.startsWith('add') ||
        t.includes('add assignment') ||
        t.includes('add task') ||
        t.includes('new assignment') ||
        t.includes('new task') ||
        t.includes('i have a') ||
        t.includes('i have an') ||
        t.includes('due on') ||
        t.includes('due tomorrow') ||
        t.includes('assignment due') ||
        t.includes('submit homework') ||
        t.includes('create assignment') ||
        t.includes('record task')
      ) {
        return this.INTENTS.ADD_ASSIGNMENT;
      }

      // Days remaining / deadline countdown
      if (
        t.includes('days remaining') ||
        t.includes('days left') ||
        t.includes('how many days') ||
        t.includes('countdown') ||
        t.includes('when is my') ||
        t.includes('time left')
      ) {
        return this.INTENTS.DAYS_REMAINING;
      }

      // Check deadlines / View pending
      if (
        t.includes('check my deadlines') ||
        t.includes('check deadlines') ||
        t.includes('deadlines') ||
        t.includes('what is due') ||
        t.includes("what's due") ||
        t.includes('upcoming')
      ) {
        return this.INTENTS.CHECK_DEADLINES;
      }

      // Prioritize / what should I do next?
      if (
        t.includes('prioritize') ||
        t.includes('priority') ||
        t.includes('what should i do first') ||
        t.includes('what to do first') ||
        t.includes('what next') ||
        t.includes('which assignment') ||
        t.includes('most urgent') ||
        t.includes('recommendation')
      ) {
        return this.INTENTS.PRIORITIZE;
      }

      // Complete / Done
      if (
        t.startsWith('done') ||
        t.includes('mark done') ||
        t.includes('mark complete') ||
        t.includes('completed') ||
        t.includes('finished') ||
        t.includes('i finished')
      ) {
        return this.INTENTS.COMPLETE_TASK;
      }

      // Delete / Remove
      if (
        t.startsWith('delete') ||
        t.startsWith('remove') ||
        t.includes('delete task') ||
        t.includes('remove task')
      ) {
        return this.INTENTS.DELETE_TASK;
      }

      // View tasks / Pending
      if (
        t.includes('view my tasks') ||
        t.includes('view tasks') ||
        t.includes('show tasks') ||
        t.includes('my assignments') ||
        t.includes('list tasks') ||
        t.includes('pending') ||
        t.includes('what do i have')
      ) {
        return this.INTENTS.VIEW_TASKS;
      }

      // Time management advice / tips
      if (
        t.includes('time management') ||
        t.includes('pomodoro') ||
        t.includes('procrastinat') ||
        t.includes('productivity') ||
        t.includes('focus tips') ||
        t.includes('study technique') ||
        t.includes('how should i manage my time')
      ) {
        return this.INTENTS.TIME_MANAGEMENT;
      }

      // Greetings
      if (
        t === 'hi' ||
        t === 'hello' ||
        t === 'hey' ||
        t.startsWith('hi ') ||
        t.startsWith('hello ') ||
        t.startsWith('good morning') ||
        t.startsWith('good evening')
      ) {
        return this.INTENTS.GREETING;
      }

      // Help
      if (t === 'help' || t.includes('what can you do') || t.includes('how does this work')) {
        return this.INTENTS.HELP;
      }

      return this.INTENTS.UNKNOWN;
    },

    /**
     * Extracts named entities from input:
     * - Subject
     * - Due date
     * - Workload / hours
     * - Priority
     * - Category (assignment, exam, project)
     */
    extractEntities(text) {
      const entities = {};
      const lower = text.toLowerCase();

      // 1. Extract Subject
      for (const sub of ACADEMIC_SUBJECTS) {
        // Regex word boundary match
        const regex = new RegExp(`\\b${sub.replace('+', '\\+')}\\b`, 'i');
        if (regex.test(lower)) {
          // Capitalize properly
          entities.subject = sub.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          break;
        }
      }

      // 2. Extract Task Category
      if (lower.includes('exam') || lower.includes('midterm') || lower.includes('final')) {
        entities.category = 'exam';
      } else if (lower.includes('project')) {
        entities.category = 'project';
      } else if (lower.includes('quiz') || lower.includes('test')) {
        entities.category = 'quiz';
      } else if (lower.includes('lab') || lower.includes('reading')) {
        entities.category = 'reading';
      } else {
        entities.category = 'assignment';
      }

      // 3. Extract Due Date
      // Pattern A: "due on November 25" or "due tomorrow" or "exam on friday"
      const duePattern = /(?:due(?: on| by)?|exam on|deadline is|before|by)\s+([^,.;]+)/i;
      const dueMatch = text.match(duePattern);
      if (dueMatch && dueMatch[1]) {
        const parsed = DateUtils.parseNaturalDate(dueMatch[1].trim());
        if (parsed) {
          entities.dueDate = parsed;
        }
      }

      // If not captured via "due on", scan whole text for natural dates
      if (!entities.dueDate) {
        const generalParsed = DateUtils.parseNaturalDate(text);
        if (generalParsed) {
          entities.dueDate = generalParsed;
        }
      }

      // 4. Extract Hours / Workload
      const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
      if (hoursMatch) {
        entities.workloadHours = parseFloat(hoursMatch[1]);
      } else if (lower.includes('quick') || lower.includes('easy')) {
        entities.workloadHours = 1.5;
      } else if (lower.includes('hard') || lower.includes('big project') || lower.includes('heavy')) {
        entities.workloadHours = 6;
      }

      // 5. Extract Priority Override
      if (lower.includes('critical') || lower.includes('urgent')) {
        entities.priority = 'critical';
      } else if (lower.includes('high priority') || lower.includes('important')) {
        entities.priority = 'high';
      } else if (lower.includes('low priority')) {
        entities.priority = 'low';
      }

      // 6. Synthesize Title if possible
      if (entities.subject) {
        const catTitle = entities.category.charAt(0).toUpperCase() + entities.category.slice(1);
        entities.title = `${entities.subject} ${catTitle}`;
      }

      return entities;
    }
  };

  // =========================================================================
  // 6. CONVERSATION STATE MACHINE & CONTEXT MANAGER
  // =========================================================================
  const ConversationContext = {
    state: 'IDLE', // 'IDLE', 'SLOT_FILLING_ADD', 'SLOT_FILLING_STUDY_PLAN', 'SELECTING_COMPLETE'
    activeFlow: null,
    collectedSlots: {},
    lastReferencedTaskId: null,

    reset() {
      this.state = 'IDLE';
      this.activeFlow = null;
      this.collectedSlots = {};
      this.lastReferencedTaskId = null;
    },

    setFlow(flowName, initialSlots = {}) {
      this.state = flowName;
      this.activeFlow = flowName;
      this.collectedSlots = { ...initialSlots };
    },

    updateSlots(newSlots) {
      this.collectedSlots = { ...this.collectedSlots, ...newSlots };
    }
  };

  // =========================================================================
  // 7. STUDY PLAN GENERATOR
  // =========================================================================
  const StudyPlanGenerator = {
    generate(subject, examDateStr, dailyHours = 2) {
      const daysInfo = DateUtils.calculateDaysRemaining(examDateStr);
      const totalDays = Math.max(1, daysInfo.days);
      const hoursPerDay = Math.min(8, Math.max(1, parseFloat(dailyHours) || 2));
      const totalStudyHours = totalDays * hoursPerDay;

      // Phased roadmap breakdown
      const schedule = [];
      const phaseNames = [
        { label: 'Foundation & Concepts', desc: `Review lecture notes, high-yield theory, and core definitions for ${subject}.` },
        { label: 'Problem Sets & Practice', desc: `Solve past exam questions and active recall drills under timed conditions.` },
        { label: 'Weak Spot Mastery', desc: `Target high-difficulty formulas and topics where you struggled during practice.` },
        { label: 'Full Mock Test & Review', desc: `Simulate real exam atmosphere. Score your attempt and review mistakes.` },
        { label: 'Final High-Yield Recap', desc: `Light summary sheets, flashcards, formula sheets, and good night's rest.` }
      ];

      // Distribute across days
      if (totalDays <= 2) {
        schedule.push({
          day: 'Day 1 (Crash Phase)',
          desc: `High-yield focus (${hoursPerDay}h): Top 20% key concepts that drive 80% of marks, plus essential practice problems.`
        });
        schedule.push({
          day: 'Day 2 (Final Polish)',
          desc: `Active recall drill (${hoursPerDay}h): Review formula cheat-sheet, summarize notes, and avoid late-night burnout.`
        });
      } else {
        const step = totalDays / phaseNames.length;
        for (let i = 0; i < phaseNames.length; i++) {
          const startDay = Math.floor(i * step) + 1;
          const endDay = Math.min(totalDays, Math.floor((i + 1) * step));
          const dayLabel = startDay === endDay ? `Day ${startDay}` : `Days ${startDay}–${endDay}`;
          schedule.push({
            day: dayLabel,
            desc: `${phaseNames[i].label} (${hoursPerDay}h/day): ${phaseNames[i].desc}`
          });
        }
      }

      return {
        subject,
        examDateStr,
        totalDays,
        hoursPerDay,
        totalStudyHours,
        schedule
      };
    }
  };

  // =========================================================================
  // 8. CHATBOT CONTROLLER & DIALOGUE MANAGER
  // =========================================================================
  const ChatBot = {
    tasks: [],

    init() {
      this.tasks = StorageManager.getTasks();
      this.cacheDOMElements();
      this.bindEvents();
      this.renderTasksDashboard();
      this.updateHeaderMetrics();
      this.updateRecommendation();
      this.renderInitialChips();
      this.restoreChatHistory();
    },

    cacheDOMElements() {
      this.welcomeScreen = document.getElementById('welcome-screen');
      this.chatMessages = document.getElementById('chat-messages');
      this.chatForm = document.getElementById('chat-form');
      this.userInput = document.getElementById('user-input');
      this.typingIndicator = document.getElementById('typing-indicator');
      this.dynamicChips = document.getElementById('dynamic-chips');
      this.resetChatBtn = document.getElementById('reset-chat-btn');
      this.toggleDashboardBtn = document.getElementById('toggle-dashboard-btn');
      this.closeDashboardBtn = document.getElementById('close-dashboard-btn');
      this.dashboardSidebar = document.getElementById('dashboard-sidebar');

      // Metric badges
      this.headerPendingCount = document.getElementById('header-pending-count');
      this.headerUrgentCount = document.getElementById('header-urgent-count');
      this.statProgressPct = document.getElementById('stat-progress-pct');
      this.statCompletedCount = document.getElementById('stat-completed-count');
      this.statPendingCount = document.getElementById('stat-pending-count');
      this.progressBarFill = document.getElementById('progress-bar-fill');
      this.recommendationText = document.getElementById('recommendation-text');

      // Tasks tab & list
      this.taskListContainer = document.getElementById('task-list-container');
      this.countAll = document.getElementById('count-all');
      this.countUrgent = document.getElementById('count-urgent');
      this.countPending = document.getElementById('count-pending');
      this.countCompleted = document.getElementById('count-completed');
      this.filterTabs = document.querySelectorAll('.filter-tab');

      // Modal elements
      this.openAddModalBtn = document.getElementById('open-add-modal-btn');
      this.taskModal = document.getElementById('task-modal');
      this.modalCloseBtn = document.getElementById('modal-close-btn');
      this.modalCancelBtn = document.getElementById('modal-cancel-btn');
      this.taskModalForm = document.getElementById('task-modal-form');
      this.modalTaskId = document.getElementById('modal-task-id');
      this.modalTaskTitle = document.getElementById('modal-task-title');
      this.modalTaskType = document.getElementById('modal-task-type');
      this.modalTaskDate = document.getElementById('modal-task-date');
      this.modalTaskWorkload = document.getElementById('modal-task-workload');
      this.modalTaskPriority = document.getElementById('modal-task-priority');

      // Footer actions
      this.clearCompletedBtn = document.getElementById('clear-completed-btn');
      this.sampleTasksBtn = document.getElementById('sample-tasks-btn');
      this.toastContainer = document.getElementById('toast-container');

      this.currentFilter = 'all';
    },

    bindEvents() {
      // Chat submit
      this.chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleUserSubmit();
      });

      // Quick prompt buttons on welcome screen
      document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const prompt = btn.getAttribute('data-prompt');
          if (prompt) {
            this.processUserMessage(prompt);
          }
        });
      });

      // Reset chat
      this.resetChatBtn.addEventListener('click', () => {
        this.resetChat();
      });

      // Dashboard toggle (for mobile and responsive drawer)
      this.toggleDashboardBtn.addEventListener('click', () => {
        this.dashboardSidebar.classList.toggle('open');
      });

      this.closeDashboardBtn.addEventListener('click', () => {
        this.dashboardSidebar.classList.remove('open');
      });

      // Filter tabs in dashboard
      this.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          this.filterTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.currentFilter = tab.getAttribute('data-filter');
          this.renderTasksDashboard();
        });
      });

      // Modal open / close
      this.openAddModalBtn.addEventListener('click', () => {
        this.openTaskModal();
      });

      this.modalCloseBtn.addEventListener('click', () => {
        this.closeTaskModal();
      });

      this.modalCancelBtn.addEventListener('click', () => {
        this.closeTaskModal();
      });

      this.taskModal.addEventListener('click', (e) => {
        if (e.target === this.taskModal) {
          this.closeTaskModal();
        }
      });

      // Modal Form Save
      this.taskModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveModalTask();
      });

      // Footer link buttons
      this.clearCompletedBtn.addEventListener('click', () => {
        this.clearCompletedTasks();
      });

      this.sampleTasksBtn.addEventListener('click', () => {
        this.loadSampleData();
      });
    },

    showToast(message, emoji = '✨') {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `<span>${emoji}</span> <span>${message}</span>`;
      this.toastContainer.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.2s ease';
        setTimeout(() => toast.remove(), 200);
      }, 3000);
    },

    // =======================================================================
    // User Message Processing & Dialogue State Flow
    // =======================================================================
    handleUserSubmit() {
      const text = this.userInput.value.trim();
      if (!text) return;
      this.userInput.value = '';
      this.processUserMessage(text);
    },

    processUserMessage(text) {
      // Hide welcome screen when conversation begins
      this.welcomeScreen.classList.add('hidden');

      // Append user message bubble
      this.appendMessage('user', text);

      // Show typing indicator
      this.showTyping(true);

      // Simulate human-paced processing
      setTimeout(() => {
        this.showTyping(false);
        this.routeMessage(text);
      }, 450);
    },

    routeMessage(rawText) {
      const text = rawText.trim();
      const detectedIntent = NLPEngine.detectIntent(text);

      // Handle Cancel / Escape at any stage
      if (detectedIntent === NLPEngine.INTENTS.CANCEL) {
        ConversationContext.reset();
        this.appendMessage('bot', `Action cancelled. I'm right here whenever you need to organize assignments, build a study plan, or check deadlines.`, [
          'Add an assignment', 'Check my deadlines', 'Prioritize tasks'
        ]);
        return;
      }

      // Handle Clear / Reset Chat
      if (detectedIntent === NLPEngine.INTENTS.CLEAR_DATA) {
        this.resetChat();
        return;
      }

      // If user is currently in a Slot-Filling conversation flow:
      if (ConversationContext.state === 'SLOT_FILLING_ADD') {
        this.handleSlotFillingAdd(text, detectedIntent);
        return;
      }

      if (ConversationContext.state === 'SLOT_FILLING_STUDY_PLAN') {
        this.handleSlotFillingStudyPlan(text, detectedIntent);
        return;
      }

      // If user explicitly asks to switch intents while in another flow, break out:
      // Route by main intent
      switch (detectedIntent) {
        case NLPEngine.INTENTS.ADD_ASSIGNMENT:
          this.initiateAddAssignmentFlow(text);
          break;

        case NLPEngine.INTENTS.CHECK_DEADLINES:
        case NLPEngine.INTENTS.VIEW_TASKS:
          this.handleViewTasks();
          break;

        case NLPEngine.INTENTS.DAYS_REMAINING:
          this.handleDaysRemaining(text);
          break;

        case NLPEngine.INTENTS.STUDY_PLAN:
          this.initiateStudyPlanFlow(text);
          break;

        case NLPEngine.INTENTS.PRIORITIZE:
          this.handlePrioritizeTasks();
          break;

        case NLPEngine.INTENTS.PANIC_MODE:
          this.handlePanicMode();
          break;

        case NLPEngine.INTENTS.TIME_MANAGEMENT:
          this.handleTimeManagementTips();
          break;

        case NLPEngine.INTENTS.COMPLETE_TASK:
          this.handleCompleteTaskFlow(text);
          break;

        case NLPEngine.INTENTS.DELETE_TASK:
          this.handleDeleteTaskFlow(text);
          break;

        case NLPEngine.INTENTS.GREETING:
          this.handleGreeting();
          break;

        case NLPEngine.INTENTS.HELP:
          this.handleHelp();
          break;

        default:
          this.handleFallback(text);
          break;
      }
    },

    // =======================================================================
    // 1. ADD ASSIGNMENT FLOW & MULTI-TURN SLOT FILLING
    // =======================================================================
    initiateAddAssignmentFlow(text) {
      const extracted = NLPEngine.extractEntities(text);

      ConversationContext.setFlow('SLOT_FILLING_ADD', {
        title: extracted.title || (extracted.subject ? `${extracted.subject} Assignment` : null),
        subject: extracted.subject || null,
        category: extracted.category || 'assignment',
        dueDate: extracted.dueDate || null,
        workloadHours: extracted.workloadHours || null,
        priority: extracted.priority || 'auto'
      });

      this.continueSlotFillingAdd();
    },

    continueSlotFillingAdd() {
      const slots = ConversationContext.collectedSlots;

      // Slot 1: Subject or Title
      if (!slots.subject && !slots.title) {
        this.appendMessage('bot', `Sure! Let's get that logged. **Which subject or topic is it for?** (e.g., *Python, Calculus, Data Structures, Economics*)`, [
          'Python', 'Calculus', 'Data Structures', 'Chemistry', 'Cancel'
        ]);
        return;
      }

      // Slot 2: Due Date
      if (!slots.dueDate) {
        const titleRef = slots.title || slots.subject;
        this.appendMessage('bot', `Got it, **${titleRef}**. **When is the deadline?** You can say *'tomorrow'*, *'Friday'*, or a date like *'Nov 25'*.`, [
          'Tomorrow', 'This Friday', 'In 3 days', 'Next week', 'Cancel'
        ]);
        return;
      }

      // Slot 3: Workload / Hours remaining
      if (!slots.workloadHours) {
        this.appendMessage('bot', `Deadline locked for **${DateUtils.formatDisplay(slots.dueDate)}**. Roughly **how many hours of work are remaining?** (e.g., *2 hours, 4 hours, or quick*)`, [
          '2 hours', '4 hours', '6 hours', 'Quick (1h)', 'Cancel'
        ]);
        return;
      }

      // All essential slots filled! Commit task.
      this.finalizeAddAssignment();
    },

    handleSlotFillingAdd(text, detectedIntent) {
      const slots = ConversationContext.collectedSlots;

      // Check if user changed their mind to another action
      if (detectedIntent === NLPEngine.INTENTS.VIEW_TASKS || detectedIntent === NLPEngine.INTENTS.CHECK_DEADLINES) {
        this.handleViewTasks();
        this.appendMessage('bot', `*PS: We were adding **${slots.subject || 'your assignment'}**. Would you like to finish adding it, or type 'cancel'?*`);
        return;
      }

      // Slot 1: Missing subject/title
      if (!slots.subject && !slots.title) {
        const extracted = NLPEngine.extractEntities(text);
        if (extracted.subject) {
          slots.subject = extracted.subject;
          slots.title = `${extracted.subject} Assignment`;
        } else {
          // Use user's raw input as title
          slots.title = text.replace(/^(my|an|a|add)\s+/i, '').trim();
          slots.title = slots.title.charAt(0).toUpperCase() + slots.title.slice(1);
          slots.subject = slots.title;
        }

        // If they also mentioned a date in the same reply, extract it!
        if (extracted.dueDate) slots.dueDate = extracted.dueDate;
        if (extracted.workloadHours) slots.workloadHours = extracted.workloadHours;

        this.continueSlotFillingAdd();
        return;
      }

      // Slot 2: Missing Due Date
      if (!slots.dueDate) {
        const parsedDate = DateUtils.parseNaturalDate(text);
        if (parsedDate) {
          slots.dueDate = parsedDate;
          // Check if they also stated hours: e.g. "Tomorrow, about 3 hours"
          const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)/i);
          if (hoursMatch) {
            slots.workloadHours = parseFloat(hoursMatch[1]);
          }
          this.continueSlotFillingAdd();
        } else {
          this.appendMessage('bot', `I didn't quite catch that date format. Could you try saying **'tomorrow'**, **'Friday'**, **'in 3 days'**, or **'Nov 25'**?`, [
            'Tomorrow', 'Friday', 'In 2 days', 'Nov 25', 'Cancel'
          ]);
        }
        return;
      }

      // Slot 3: Missing Workload
      if (!slots.workloadHours) {
        const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)?/i);
        if (hoursMatch) {
          slots.workloadHours = parseFloat(hoursMatch[1]);
        } else if (text.toLowerCase().includes('quick') || text.toLowerCase().includes('easy')) {
          slots.workloadHours = 1.5;
        } else {
          slots.workloadHours = 3; // sensible default
        }
        this.continueSlotFillingAdd();
        return;
      }
    },

    finalizeAddAssignment() {
      const slots = ConversationContext.collectedSlots;

      const newTask = {
        id: 'task_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        title: slots.title || (slots.subject ? `${slots.subject} Assignment` : 'Course Assignment'),
        subject: slots.subject || 'General Study',
        category: slots.category || 'assignment',
        dueDate: slots.dueDate,
        workloadHours: parseFloat(slots.workloadHours) || 3,
        priority: slots.priority || 'auto',
        completed: false,
        createdAt: new Date().toISOString()
      };

      // Calculate smart priority
      const smartPriority = PriorityEngine.calculateTaskPriority(newTask);
      newTask.priority = smartPriority;

      this.tasks.push(newTask);
      StorageManager.saveTasks(this.tasks);

      // Refresh dashboard UI
      this.renderTasksDashboard();
      this.updateHeaderMetrics();
      this.updateRecommendation();

      const daysInfo = DateUtils.calculateDaysRemaining(newTask.dueDate);

      // Reset flow
      ConversationContext.reset();

      // Show confirmation with rich task card
      const responseHtml = `
        <div class="bot-highlight-box">
          🎉 <strong>Assignment Successfully Added!</strong>
          <div class="chat-task-card">
            <div class="chat-task-header">
              <span class="chat-task-title">${this.escapeHtml(newTask.title)}</span>
              <span class="task-priority-tag ${smartPriority}">${smartPriority.toUpperCase()}</span>
            </div>
            <div class="chat-task-meta">
              <span>📅 ${DateUtils.formatDisplay(newTask.dueDate)} (${daysInfo.text})</span>
              <span>⏱️ ${newTask.workloadHours}h estimated</span>
            </div>
            <div class="chat-task-actions">
              <button class="chat-btn-action" onclick="window.UNSTUCK.toggleTask('${newTask.id}')">✓ Mark Done</button>
              <button class="chat-btn-action" onclick="window.UNSTUCK.askStudyPlan('${newTask.subject}')">🗓️ Make Study Plan</button>
            </div>
          </div>
        </div>
        I've pinned this to your tracker and updated your priority queue. What would you like to tackle next?
      `;

      this.appendMessage('bot', responseHtml, [
        'Check my deadlines', 'What should I do first?', 'Create study plan'
      ], true);

      this.showToast(`Saved "${newTask.title}"`, '✅');
    },

    // =======================================================================
    // 2. EXAM STUDY PLAN GENERATOR & MULTI-TURN FLOW
    // =======================================================================
    initiateStudyPlanFlow(text) {
      const extracted = NLPEngine.extractEntities(text);

      ConversationContext.setFlow('SLOT_FILLING_STUDY_PLAN', {
        subject: extracted.subject || null,
        examDate: extracted.dueDate || null,
        dailyHours: extracted.workloadHours || null
      });

      this.continueSlotFillingStudyPlan();
    },

    continueSlotFillingStudyPlan() {
      const slots = ConversationContext.collectedSlots;

      // Slot 1: Subject
      if (!slots.subject) {
        this.appendMessage('bot', `I'll build a structured, stress-free revision schedule for you. **Which subject is the exam in?** (e.g., *Java, Calculus, Data Structures, Physics*)`, [
          'Java', 'Calculus', 'Data Structures', 'Operating Systems', 'Cancel'
        ]);
        return;
      }

      // Slot 2: Exam Date
      if (!slots.examDate) {
        this.appendMessage('bot', `Great, **${slots.subject}**. **When is the exam date?** (e.g., *next Friday*, *in 5 days*, or *Nov 28*)`, [
          'In 3 days', 'In 5 days', 'Next week', 'Next Friday', 'Cancel'
        ]);
        return;
      }

      // Slot 3: Daily available hours
      if (!slots.dailyHours) {
        this.appendMessage('bot', `How many hours can you study daily? (e.g., *2 hours*, *3 hours*)`, [
          '1.5 hours', '2 hours', '3 hours', '4 hours', 'Cancel'
        ]);
        return;
      }

      // All slots ready!
      this.finalizeStudyPlan();
    },

    handleSlotFillingStudyPlan(text, detectedIntent) {
      const slots = ConversationContext.collectedSlots;

      if (!slots.subject) {
        const extracted = NLPEngine.extractEntities(text);
        slots.subject = extracted.subject || text.trim();
        if (extracted.dueDate) slots.examDate = extracted.dueDate;
        if (extracted.workloadHours) slots.dailyHours = extracted.workloadHours;
        this.continueSlotFillingStudyPlan();
        return;
      }

      if (!slots.examDate) {
        const parsed = DateUtils.parseNaturalDate(text);
        if (parsed) {
          slots.examDate = parsed;
          const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)/i);
          if (hoursMatch) slots.dailyHours = parseFloat(hoursMatch[1]);
          this.continueSlotFillingStudyPlan();
        } else {
          this.appendMessage('bot', `Please give me a date like **'in 4 days'**, **'next Monday'**, or **'Nov 25'**.`, [
            'In 3 days', 'Next week', 'Cancel'
          ]);
        }
        return;
      }

      if (!slots.dailyHours) {
        const hoursMatch = text.match(/(\d+(?:\.\d+)?)/);
        slots.dailyHours = hoursMatch ? parseFloat(hoursMatch[1]) : 2;
        this.continueSlotFillingStudyPlan();
        return;
      }
    },

    finalizeStudyPlan() {
      const slots = ConversationContext.collectedSlots;
      const plan = StudyPlanGenerator.generate(slots.subject, slots.examDate, slots.dailyHours);

      // Reset context
      ConversationContext.reset();

      // Check if an exam task already exists, or offer to auto-create it
      const existingExam = this.tasks.find(t => t.subject.toLowerCase() === slots.subject.toLowerCase() && t.category === 'exam');
      if (!existingExam) {
        const autoTask = {
          id: 'task_' + Date.now() + '_exam',
          title: `${slots.subject} Final Exam`,
          subject: slots.subject,
          category: 'exam',
          dueDate: slots.examDate,
          workloadHours: plan.totalStudyHours,
          priority: 'critical',
          completed: false,
          createdAt: new Date().toISOString()
        };
        this.tasks.push(autoTask);
        StorageManager.saveTasks(this.tasks);
        this.renderTasksDashboard();
        this.updateHeaderMetrics();
        this.updateRecommendation();
      }

      let daysListHtml = plan.schedule.map(item => `
        <div class="study-day-item">
          <span class="day-badge">${item.day}</span>
          <span class="day-desc">${item.desc}</span>
        </div>
      `).join('');

      const html = `
        <p style="font-weight: 700; color: var(--color-indigo); margin-bottom: 8px;">
          I'll create a ${plan.hoursPerDay}-hour daily ${this.escapeHtml(plan.subject)} study plan.
        </p>
        <div class="study-schedule-box">
          <div class="study-schedule-title">
            <span>🗓️</span> Personalised Revision Roadmap: <strong>${this.escapeHtml(plan.subject)}</strong>
          </div>
          <p style="font-size: 13px; margin-bottom: 10px; color: var(--color-ink-muted);">
            Exam is in <strong>${plan.totalDays} day${plan.totalDays === 1 ? '' : 's'}</strong> (${DateUtils.formatDisplay(plan.examDateStr)}). Dedicating <strong>${plan.hoursPerDay} hours/day</strong> gives you <strong>${plan.totalStudyHours} total study hours</strong>.
          </p>
          <div class="study-days-list">
            ${daysListHtml}
          </div>
        </div>
        <p style="margin-top: 10px;">
          💡 <strong>Pro Tip:</strong> Study in 50-minute focused blocks with 10-minute movement breaks. Would you like to check what other deadlines you have?
        </p>
      `;

      this.appendMessage('bot', html, [
        'Check my deadlines', 'What should I do first?', 'I am running out of time'
      ], true);
    },

    // =======================================================================
    // 3. CHECK DEADLINES & VIEW TASKS
    // =======================================================================
    handleViewTasks() {
      const pendingTasks = this.tasks.filter(t => !t.completed);
      const sorted = PriorityEngine.sortTasks(pendingTasks);

      if (sorted.length === 0) {
        this.appendMessage('bot', `🎉 **You have no pending assignments or exams right now!** Your schedule is crystal clear. Would you like to add an assignment or create a future study plan?`, [
          'Add an assignment', 'Create study plan'
        ]);
        return;
      }

      let cardsHtml = sorted.slice(0, 5).map(task => {
        const daysInfo = DateUtils.calculateDaysRemaining(task.dueDate);
        const priority = PriorityEngine.calculateTaskPriority(task);
        const urgencyClass = daysInfo.isOverdue ? 'color: #d11a00; font-weight: 700;' : (daysInfo.isUrgent ? 'color: #b82d17; font-weight: 700;' : '');
        return `
          <div class="chat-task-card">
            <div class="chat-task-header">
              <span class="chat-task-title">${this.escapeHtml(task.title)}</span>
              <span class="task-priority-tag ${priority}">${priority.toUpperCase()}</span>
            </div>
            <div class="chat-task-meta">
              <span style="${urgencyClass}">📅 ${DateUtils.formatDisplay(task.dueDate)} (${daysInfo.text})</span>
              <span>⏱️ ${task.workloadHours}h remaining</span>
            </div>
            <div class="chat-task-actions">
              <button class="chat-btn-action" onclick="window.UNSTUCK.toggleTask('${task.id}')">✓ Done</button>
              <button class="chat-btn-action" onclick="window.UNSTUCK.askStudyPlan('${task.subject}')">🗓️ Study Plan</button>
              <button class="chat-btn-action" onclick="window.UNSTUCK.deleteTask('${task.id}')">🗑️ Remove</button>
            </div>
          </div>
        `;
      }).join('');

      const countMsg = sorted.length > 5 ? `<p style="font-size: 12px; margin-top: 6px; color: var(--color-ink-muted);">Showing top 5 urgent items (${sorted.length} total). See the Academic Tracker sidebar for full list.</p>` : '';

      const html = `
        <div>
          You currently have <strong>${sorted.length} pending academic task${sorted.length === 1 ? '' : 's'}</strong>. Here is your priority queue:
          ${cardsHtml}
          ${countMsg}
        </div>
      `;

      this.appendMessage('bot', html, [
        'What should I do first?', 'I am running out of time', 'Add an assignment'
      ], true);
    },

    handleDaysRemaining(text) {
      const extracted = NLPEngine.extractEntities(text);
      let targetTask = null;

      if (extracted.subject) {
        targetTask = this.tasks.find(t => t.subject.toLowerCase() === extracted.subject.toLowerCase() && !t.completed);
      }

      if (!targetTask) {
        // Find closest pending task
        const pending = PriorityEngine.sortTasks(this.tasks.filter(t => !t.completed));
        if (pending.length > 0) {
          targetTask = pending[0];
        }
      }

      if (!targetTask) {
        this.appendMessage('bot', `You don't have any pending deadlines on your tracker right now! Would you like to log an assignment?`, [
          'Add an assignment'
        ]);
        return;
      }

      const daysInfo = DateUtils.calculateDaysRemaining(targetTask.dueDate);
      const html = `
        <div class="bot-highlight-box">
          ⏳ <strong>Countdown for ${this.escapeHtml(targetTask.title)}</strong>:
          <p style="font-size: 16px; font-weight: 800; color: var(--color-indigo); margin: 6px 0;">
            ${daysInfo.text} (${DateUtils.formatDisplay(targetTask.dueDate)})
          </p>
          <span style="font-size: 12.5px; color: var(--color-ink-muted);">Estimated workload: ${targetTask.workloadHours} hours remaining.</span>
        </div>
      `;

      this.appendMessage('bot', html, [
        'What should I do first?', 'Create study plan', 'Check all deadlines'
      ], true);
    },

    // =======================================================================
    // 4. SMART PRIORITISATION & "WHAT TO DO NEXT"
    // =======================================================================
    handlePrioritizeTasks() {
      const pending = this.tasks.filter(t => !t.completed);
      if (pending.length === 0) {
        this.appendMessage('bot', `No tasks left to prioritize! You're completely caught up. 🎉`, [
          'Add an assignment'
        ]);
        return;
      }

      const sorted = PriorityEngine.sortTasks(pending);
      const topTask = sorted[0];
      const daysInfo = DateUtils.calculateDaysRemaining(topTask.dueDate);
      const priority = PriorityEngine.calculateTaskPriority(topTask);

      const html = `
        <div class="bot-highlight-box" style="border-left-color: var(--color-coral);">
          🎯 <strong>Recommended #1 Priority Right Now:</strong>
          <h4 style="font-family: var(--font-display); font-size: 18px; color: var(--color-indigo); margin: 8px 0 4px 0;">
            ${this.escapeHtml(topTask.title)}
          </h4>
          <p style="font-size: 13.5px; color: var(--color-ink);">
            <strong>Reasoning:</strong> It has a <strong>${priority.toUpperCase()}</strong> priority score because it is <strong>${daysInfo.text}</strong> (${DateUtils.formatDisplay(topTask.dueDate)}) and requires approximately <strong>${topTask.workloadHours} hours</strong>.
          </p>
          <div style="margin-top: 10px;">
            <button class="chat-btn-action done" onclick="window.UNSTUCK.toggleTask('${topTask.id}')">✓ Mark as Finished</button>
            <button class="chat-btn-action" onclick="window.UNSTUCK.askStudyPlan('${topTask.subject}')">🗓️ Make Schedule</button>
          </div>
        </div>
        <strong>Next Step Recommendation:</strong> Sit down for a single <strong>25-minute Pomodoro sprint</strong> on this task right now. Don't worry about finishing the whole thing—just commit to the first 25 minutes!
      `;

      this.appendMessage('bot', html, [
        'I am running out of time', 'View all tasks', 'Time management tips'
      ], true);
    },

    // =======================================================================
    // 5. EMERGENCY TRIAGE / "I'M RUNNING OUT OF TIME" (PANIC MODE)
    // =======================================================================
    handlePanicMode() {
      const pending = PriorityEngine.sortTasks(this.tasks.filter(t => !t.completed));

      if (pending.length === 0) {
        this.appendMessage('bot', `Take a deep breath! 🧘 You actually have **zero pending tasks** saved on your tracker. If something new came up, let's add it together and break it down.`, [
          'Add an assignment'
        ]);
        return;
      }

      // Triage logic: Separate MUST-DO (critical/urgent within 3 days) vs CAN-DEFER (beyond 3 days)
      const mustDo = [];
      const canDefer = [];

      pending.forEach(t => {
        const days = DateUtils.calculateDaysRemaining(t.dueDate);
        if (days.isOverdue || days.days <= 3) {
          mustDo.push(t);
        } else {
          canDefer.push(t);
        }
      });

      let triageList = '';
      if (mustDo.length > 0) {
        triageList += `<strong style="color: #b82d17;">🚨 MUST-DO (Immediate Focus — Due in &le; 3 Days):</strong><ul style="margin: 6px 0 12px 18px; font-size: 13px;">`;
        mustDo.forEach(t => {
          const days = DateUtils.calculateDaysRemaining(t.dueDate);
          triageList += `<li><strong>${this.escapeHtml(t.title)}</strong> — ${days.text} (~${t.workloadHours}h)</li>`;
        });
        triageList += `</ul>`;
      }

      if (canDefer.length > 0) {
        triageList += `<strong style="color: var(--color-indigo);">⏸️ SAFE TO POSTPONE (Do NOT stress about these today):</strong><ul style="margin: 6px 0 12px 18px; font-size: 13px;">`;
        canDefer.forEach(t => {
          const days = DateUtils.calculateDaysRemaining(t.dueDate);
          triageList += `<li>${this.escapeHtml(t.title)} — ${days.text}</li>`;
        });
        triageList += `</ul>`;
      }

      const html = `
        <div class="bot-highlight-box" style="background-color: #fff2f0; border-left-color: var(--color-coral);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 18px;">🛡️</span>
            <strong style="color: #b82d17; font-size: 15px;">EMERGENCY WORKLOAD TRIAGE ACTIVATED</strong>
          </div>
          <p style="font-size: 13.5px; line-height: 1.5; color: var(--color-ink);">
            Pause. Academic panic happens when your brain tries to hold everything at once. We're cutting your mental load down right now:
          </p>
          <div style="margin-top: 10px;">
            ${triageList}
          </div>
          <div style="background: #FFFFFF; padding: 10px; border-radius: 6px; border: 1.5px solid var(--color-ink); margin-top: 8px;">
            <strong>Your 3-Step Emergency Plan:</strong>
            <ol style="margin-left: 18px; font-size: 12.5px; margin-top: 4px;">
              <li>Pick ONLY the top must-do task: <em>${mustDo.length > 0 ? this.escapeHtml(mustDo[0].title) : 'your first assignment'}</em>.</li>
              <li>Close all other browser tabs, put phone on Do Not Disturb.</li>
              <li>Set a timer for <strong>25 minutes</strong>. Aim for "good enough", not perfection.</li>
            </ol>
          </div>
        </div>
      `;

      this.appendMessage('bot', html, [
        'What should I do first?', 'Check my deadlines', 'Time management tips'
      ], true);
    },

    // =======================================================================
    // 6. TIME MANAGEMENT & STUDY STRATEGIES
    // =======================================================================
    handleTimeManagementTips() {
      const tips = [
        `**1. The 25/5 Pomodoro Cycle:** Work with zero tab switching for 25 mins, then take a strict 5 min stretch break. After 4 rounds, take 20 mins off.`,
        `**2. The 2-Minute Rule:** If a student task takes under 2 minutes (emailing a professor, downloading a rubric, creating a file), do it immediately without scheduling.`,
        `**3. The 'Worst-First' Method (Eat the Frog):** Tackle your most dreaded 45-minute homework piece first thing in the morning. Everything else feels effortless afterwards.`,
        `**4. Active Recall over Passive Reading:** Re-reading notes is an illusion of competence. Close the book and quiz yourself or explain the concept out loud.`
      ];

      const html = `
        <div class="bot-highlight-box">
          ⏱️ <strong>High-Impact Time Management Frameworks:</strong>
          <div style="margin-top: 8px; font-size: 13.5px; display: flex; flex-direction: column; gap: 8px;">
            <div>${tips[0]}</div>
            <div>${tips[1]}</div>
            <div>${tips[2]}</div>
            <div>${tips[3]}</div>
          </div>
        </div>
        Which technique fits your current study session?
      `;

      this.appendMessage('bot', html, [
        'I am running out of time', 'What should I do first?', 'Check my deadlines'
      ], true);
    },

    // =======================================================================
    // 7. TASK COMPLETION & DELETION ACTIONS
    // =======================================================================
    handleCompleteTaskFlow(text) {
      const pending = this.tasks.filter(t => !t.completed);
      if (pending.length === 0) {
        this.appendMessage('bot', `All your tasks are already marked as completed! 🥳`, ['Add an assignment']);
        return;
      }

      // Try to match subject from user message
      const extracted = NLPEngine.extractEntities(text);
      let match = null;
      if (extracted.subject) {
        match = pending.find(t => t.subject.toLowerCase() === extracted.subject.toLowerCase());
      }

      if (!match) {
        // Try substring matching
        const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !['mark', 'done', 'complete', 'task', 'assignment', 'finished'].includes(w));
        for (const w of words) {
          match = pending.find(t => t.title.toLowerCase().includes(w));
          if (match) break;
        }
      }

      if (match) {
        this.toggleTaskStatus(match.id, true);
        this.appendMessage('bot', `Awesome work! 🎉 I've marked **${this.escapeHtml(match.title)}** as completed! Your progress tracker has been updated.`, [
          'View my tasks', 'What should I do first?', 'Add an assignment'
        ]);
        return;
      }

      // If no specific match, list pending tasks with quick one-click completion
      let buttonsHtml = pending.slice(0, 4).map(t => `
        <button class="chat-btn-action" style="margin: 3px;" onclick="window.UNSTUCK.toggleTask('${t.id}')">✓ ${this.escapeHtml(t.title)}</button>
      `).join('');

      this.appendMessage('bot', `Which task did you complete? Click below or tell me its name:<br><div style="margin-top: 8px;">${buttonsHtml}</div>`, [
        'Cancel'
      ], true);
    },

    handleDeleteTaskFlow(text) {
      const pending = this.tasks;
      const extracted = NLPEngine.extractEntities(text);
      let match = null;

      if (extracted.subject) {
        match = pending.find(t => t.subject.toLowerCase() === extracted.subject.toLowerCase());
      }

      if (match) {
        this.deleteTask(match.id);
        this.appendMessage('bot', `Removed **${this.escapeHtml(match.title)}** from your tracker.`, [
          'View my tasks', 'Add an assignment'
        ]);
        return;
      }

      this.appendMessage('bot', `To remove a task, you can click the trash icon 🗑️ on any card in the tracker on your right, or tell me the exact subject to delete.`, [
        'View my tasks', 'Check my deadlines'
      ]);
    },

    toggleTaskStatus(id, forceDone = null) {
      const task = this.tasks.find(t => t.id === id);
      if (!task) return;

      task.completed = forceDone !== null ? forceDone : !task.completed;
      StorageManager.saveTasks(this.tasks);

      this.renderTasksDashboard();
      this.updateHeaderMetrics();
      this.updateRecommendation();

      this.showToast(task.completed ? `Completed "${task.title}"` : `Reopened "${task.title}"`, task.completed ? '🎉' : '🔄');
    },

    deleteTask(id) {
      const index = this.tasks.findIndex(t => t.id === id);
      if (index === -1) return;
      const title = this.tasks[index].title;
      this.tasks.splice(index, 1);
      StorageManager.saveTasks(this.tasks);

      this.renderTasksDashboard();
      this.updateHeaderMetrics();
      this.updateRecommendation();

      this.showToast(`Deleted "${title}"`, '🗑️');
    },

    clearCompletedTasks() {
      const initialCount = this.tasks.length;
      this.tasks = this.tasks.filter(t => !t.completed);
      StorageManager.saveTasks(this.tasks);

      this.renderTasksDashboard();
      this.updateHeaderMetrics();
      this.updateRecommendation();

      const removed = initialCount - this.tasks.length;
      this.showToast(`Cleared ${removed} completed task${removed === 1 ? '' : 's'}`, '🧹');
    },

    loadSampleData() {
      this.tasks = StorageManager.seedDefaultTasks();
      this.renderTasksDashboard();
      this.updateHeaderMetrics();
      this.updateRecommendation();
      this.showToast('Sample academic tasks loaded!', '✨');
    },

    // =======================================================================
    // 8. GREETING, HELP & FALLBACK RESPONSES
    // =======================================================================
    handleGreeting() {
      const greetings = [
        `Hey there! 👋 I'm **UNSTUCK**, your personal student problem-solving assistant. How are your classes going today? Tell me what's on your plate!`,
        `Hello! Ready to conquer assignments and beat study procrastination. What are we working on?`,
        `Hey! Feeling overwhelmed or just need to organize your schedule? Tell me what's up, and we'll fix it.`
      ];
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      this.appendMessage('bot', randomGreeting, [
        'Add an assignment', 'Check my deadlines', 'Create study plan', 'I am running out of time'
      ]);
    },

    handleHelp() {
      const helpHtml = `
        <div class="bot-highlight-box">
          🤖 <strong>Here is everything UNSTUCK can do for you:</strong>
          <ul style="margin: 6px 0 6px 18px; font-size: 13.5px; line-height: 1.6;">
            <li><strong>Add Assignments:</strong> Say <em>"I have a Python assignment due Nov 25"</em>.</li>
            <li><strong>Exam Study Plans:</strong> Say <em>"Java exam next week, I have 2 hours daily"</em>.</li>
            <li><strong>Check Deadlines:</strong> Say <em>"What deadlines are coming up?"</em> or <em>"Days remaining"</em>.</li>
            <li><strong>Prioritize:</strong> Say <em>"What should I do first?"</em> for smart algorithmic recommendations.</li>
            <li><strong>Emergency Triage:</strong> Say <em>"I'm running out of time"</em> when overwhelmed.</li>
            <li><strong>Time Management:</strong> Ask for study techniques, Pomodoro cycles, or focus tips.</li>
            <li><strong>Complete Tasks:</strong> Say <em>"Mark Python as done"</em> or click any card.</li>
          </ul>
        </div>
        Give any of these a try!
      `;
      this.appendMessage('bot', helpHtml, [
        'Add an assignment', 'Create study plan', 'Check my deadlines', 'What should I do first?'
      ], true);
    },

    handleFallback(rawText) {
      // Intelligent fallback that suggests closest actions
      this.appendMessage('bot', `I want to make sure I help you solve this! While I'm specialized in student problem-solving (assignments, exams, deadlines, schedules, and triage), you can try asking:
        <ul style="margin: 6px 0 0 18px; font-size: 13px;">
          <li><em>"Add my Calculus assignment"</em></li>
          <li><em>"Create an exam revision schedule"</em></li>
          <li><em>"What should I work on first?"</em></li>
          <li><em>"I'm running out of time"</em></li>
        </ul>
      `, [
        'Add an assignment', 'Check my deadlines', 'What should I do first?', 'Help'
      ], true);
    },

    // =======================================================================
    // 9. CHAT UI RENDERING & TYPING SIMULATION
    // =======================================================================
    appendMessage(sender, content, suggestionChips = [], isHtml = false) {
      const row = document.createElement('div');
      row.className = `message-row ${sender}`;

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (sender === 'user') {
        row.innerHTML = `
          <div class="user-avatar" title="You">ME</div>
          <div class="message-content">
            <div class="message-bubble">${this.escapeHtml(content)}</div>
            <span class="message-timestamp">${timestamp}</span>
          </div>
        `;
      } else {
        const bodyContent = isHtml ? content : this.formatMarkdownBasic(content);
        row.innerHTML = `
          <div class="bot-avatar" title="UNSTUCK AI">U</div>
          <div class="message-content">
            <div class="message-bubble">${bodyContent}</div>
            <span class="message-timestamp">${timestamp}</span>
          </div>
        `;
      }

      this.chatMessages.appendChild(row);
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

      // Render suggestions below
      this.renderChips(suggestionChips);

      // Save to chat history
      const history = StorageManager.getChatHistory();
      history.push({ sender, content, isHtml, timestamp });
      StorageManager.saveChatHistory(history);
    },

    formatMarkdownBasic(text) {
      if (!text) return '';
      // Bold
      let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italics
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Line breaks
      formatted = formatted.replace(/\n/g, '<br>');
      return formatted;
    },

    showTyping(show) {
      if (show) {
        this.typingIndicator.classList.remove('hidden');
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
      } else {
        this.typingIndicator.classList.add('hidden');
      }
    },

    renderChips(chips = []) {
      this.dynamicChips.innerHTML = '';
      if (!chips || chips.length === 0) {
        this.renderInitialChips();
        return;
      }

      chips.forEach(chipText => {
        const chip = document.createElement('button');
        chip.className = 'prompt-chip';
        chip.textContent = chipText;
        chip.addEventListener('click', () => {
          this.processUserMessage(chipText);
        });
        this.dynamicChips.appendChild(chip);
      });
    },

    renderInitialChips() {
      const defaults = [
        'Add an assignment',
        'Check my deadlines',
        'What should I do first?',
        "I'm running out of time",
        'Create study plan'
      ];
      this.renderChips(defaults);
    },

    restoreChatHistory() {
      const history = StorageManager.getChatHistory();
      if (history.length > 0) {
        this.welcomeScreen.classList.add('hidden');
        history.forEach(item => {
          const row = document.createElement('div');
          row.className = `message-row ${item.sender}`;
          if (item.sender === 'user') {
            row.innerHTML = `
              <div class="user-avatar">ME</div>
              <div class="message-content">
                <div class="message-bubble">${this.escapeHtml(item.content)}</div>
                <span class="message-timestamp">${item.timestamp || ''}</span>
              </div>
            `;
          } else {
            const body = item.isHtml ? item.content : this.formatMarkdownBasic(item.content);
            row.innerHTML = `
              <div class="bot-avatar">U</div>
              <div class="message-content">
                <div class="message-bubble">${body}</div>
                <span class="message-timestamp">${item.timestamp || ''}</span>
              </div>
            `;
          }
          this.chatMessages.appendChild(row);
        });
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
      }
    },

    resetChat() {
      StorageManager.clearChatHistory();
      ConversationContext.reset();
      this.chatMessages.innerHTML = '';
      this.welcomeScreen.classList.remove('hidden');
      this.renderInitialChips();
      this.showToast('Conversation & context reset.', '🔄');
    },

    // =======================================================================
    // 10. DASHBOARD RENDERING & SYNC
    // =======================================================================
    renderTasksDashboard() {
      const filter = this.currentFilter;
      let tasksToDisplay = [...this.tasks];

      if (filter === 'urgent') {
        tasksToDisplay = tasksToDisplay.filter(t => {
          if (t.completed) return false;
          const days = DateUtils.calculateDaysRemaining(t.dueDate);
          return days.isUrgent || days.isOverdue;
        });
      } else if (filter === 'pending') {
        tasksToDisplay = tasksToDisplay.filter(t => !t.completed);
      } else if (filter === 'completed') {
        tasksToDisplay = tasksToDisplay.filter(t => t.completed);
      }

      tasksToDisplay = PriorityEngine.sortTasks(tasksToDisplay);

      this.taskListContainer.innerHTML = '';

      if (tasksToDisplay.length === 0) {
        this.taskListContainer.innerHTML = `
          <div class="empty-tasks-state">
            <div class="empty-icon">📂</div>
            <h4>No tasks found</h4>
            <p>Your filter has no matching academic tasks. Try adding one or switching filter tabs.</p>
          </div>
        `;
        return;
      }

      tasksToDisplay.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-item-card ${task.completed ? 'completed' : ''}`;

        const priority = PriorityEngine.calculateTaskPriority(task);
        const days = DateUtils.calculateDaysRemaining(task.dueDate);

        let deadlineBadgeClass = '';
        if (days.isOverdue) deadlineBadgeClass = 'overdue';
        else if (days.isUrgent) deadlineBadgeClass = 'urgent';

        card.innerHTML = `
          <div class="task-item-header">
            <button class="task-checkbox-btn ${task.completed ? 'checked' : ''}" data-id="${task.id}" title="${task.completed ? 'Mark pending' : 'Mark completed'}">
              ${task.completed ? '✓' : ''}
            </button>
            <span class="task-title-text">${this.escapeHtml(task.title)}</span>
            <button class="task-delete-btn" data-id="${task.id}" title="Delete task">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
          <div class="task-item-footer">
            <span class="task-deadline-badge ${deadlineBadgeClass}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${DateUtils.formatDisplay(task.dueDate)} (${days.text})
            </span>
            <div style="display: flex; gap: 6px; align-items: center;">
              <span style="font-size: 11px; color: var(--color-ink-muted);">⏱️ ${task.workloadHours}h</span>
              <span class="task-priority-tag ${priority}">${priority}</span>
            </div>
          </div>
        `;

        // Checkbox click
        card.querySelector('.task-checkbox-btn').addEventListener('click', () => {
          this.toggleTaskStatus(task.id);
        });

        // Delete click
        card.querySelector('.task-delete-btn').addEventListener('click', () => {
          this.deleteTask(task.id);
        });

        this.taskListContainer.appendChild(card);
      });
    },

    updateHeaderMetrics() {
      const total = this.tasks.length;
      const completed = this.tasks.filter(t => t.completed).length;
      const pending = total - completed;
      const urgent = this.tasks.filter(t => {
        if (t.completed) return false;
        const days = DateUtils.calculateDaysRemaining(t.dueDate);
        return days.isUrgent || days.isOverdue;
      }).length;

      const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

      // Header pills
      this.headerPendingCount.textContent = pending;
      this.headerUrgentCount.textContent = urgent;

      // Dashboard stats
      this.statProgressPct.textContent = `${pct}%`;
      this.statCompletedCount.textContent = completed;
      this.statPendingCount.textContent = pending;
      this.progressBarFill.style.width = `${pct}%`;

      // Filter tabs counts
      this.countAll.textContent = total;
      this.countUrgent.textContent = urgent;
      this.countPending.textContent = pending;
      this.countCompleted.textContent = completed;
    },

    updateRecommendation() {
      const pending = this.tasks.filter(t => !t.completed);
      if (pending.length === 0) {
        this.recommendationText.textContent = `All caught up! Excellent work. Relax or add upcoming syllabus goals.`;
        return;
      }

      const sorted = PriorityEngine.sortTasks(pending);
      const top = sorted[0];
      const days = DateUtils.calculateDaysRemaining(top.dueDate);

      this.recommendationText.innerHTML = `Focus on <strong>${this.escapeHtml(top.title)}</strong> (${days.text}). Estimated <strong>${top.workloadHours} hours</strong> required.`;
    },

    // =======================================================================
    // 11. MODAL DIALOG MANAGEMENT
    // =======================================================================
    openTaskModal(task = null) {
      if (task) {
        this.modalTaskId.value = task.id;
        this.modalTaskTitle.value = task.title;
        this.modalTaskType.value = task.category || 'assignment';
        this.modalTaskDate.value = task.dueDate;
        this.modalTaskWorkload.value = task.workloadHours || 3;
        this.modalTaskPriority.value = task.priority || 'auto';
      } else {
        this.modalTaskId.value = '';
        this.modalTaskTitle.value = '';
        this.modalTaskType.value = 'assignment';
        // default to 3 days from now
        const d = new Date();
        d.setDate(d.getDate() + 3);
        this.modalTaskDate.value = DateUtils.formatISO(d);
        this.modalTaskWorkload.value = 3;
        this.modalTaskPriority.value = 'auto';
      }

      this.taskModal.classList.remove('hidden');
      this.modalTaskTitle.focus();
    },

    closeTaskModal() {
      this.taskModal.classList.add('hidden');
      this.taskModalForm.reset();
    },

    saveModalTask() {
      const id = this.modalTaskId.value;
      const title = this.modalTaskTitle.value.trim();
      const category = this.modalTaskType.value;
      const dueDate = this.modalTaskDate.value;
      const workloadHours = parseFloat(this.modalTaskWorkload.value) || 3;
      const priority = this.modalTaskPriority.value;

      if (!title || !dueDate) {
        alert('Please fill in the title and due date.');
        return;
      }

      // Extract subject if possible
      const extracted = NLPEngine.extractEntities(title);
      const subject = extracted.subject || title;

      if (id) {
        // Edit existing
        const task = this.tasks.find(t => t.id === id);
        if (task) {
          task.title = title;
          task.category = category;
          task.dueDate = dueDate;
          task.workloadHours = workloadHours;
          task.priority = priority;
          task.subject = subject;
        }
      } else {
        // New task
        const newTask = {
          id: 'task_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          title,
          subject,
          category,
          dueDate,
          workloadHours,
          priority: priority === 'auto' ? PriorityEngine.calculateTaskPriority({ category, dueDate, workloadHours }) : priority,
          completed: false,
          createdAt: new Date().toISOString()
        };
        this.tasks.push(newTask);
      }

      StorageManager.saveTasks(this.tasks);
      this.renderTasksDashboard();
      this.updateHeaderMetrics();
      this.updateRecommendation();
      this.closeTaskModal();
      this.showToast(id ? 'Task updated!' : 'Task added to UNSTUCK!', '✅');
    },

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  };

  // Expose global bridge for in-chat inline actions
  window.UNSTUCK = {
    toggleTask(id) {
      ChatBot.toggleTaskStatus(id);
    },
    deleteTask(id) {
      ChatBot.deleteTask(id);
    },
    askStudyPlan(subject) {
      ChatBot.processUserMessage(`Create a study plan for ${subject}`);
    }
  };

  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    ChatBot.init();
  });

})();
