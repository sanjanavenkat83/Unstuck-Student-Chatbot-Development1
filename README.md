# UNSTUCK — Your Student Problem-Solving Assistant

> An intelligent, interactive, editorial-style chatbot designed for college students to eliminate academic overwhelm, manage deadlines, build personalized exam revision schedules, and triage urgent workloads.

[![Platform](https://img.shields.io/badge/Platform-Web%20Browser-24205C?style=for-the-badge)](https://github.com)
[![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-C5FF5A?style=for-the-badge&logoColor=191825)](https://github.com)
[![Storage](https://img.shields.io/badge/Storage-localStorage-FF806B?style=for-the-badge)](https://github.com)
[![Deployment](https://img.shields.io/badge/Deploy-GitHub%20Pages-D9CBFF?style=for-the-badge&logoColor=24205C)](https://github.com)

---

## 📖 1. Project Overview & Objective

College students constantly juggle multiple high-stakes deadlines, overlapping assignment requirements, and unpredictable exam schedules. Traditional to-do list apps are static and passive, while standard chatbots merely regurgitate canned FAQ answers without understanding context, missing information, or taking actions.

**UNSTUCK** is built from the ground up to solve this:
- **Intelligent Dialogue Management:** It understands user intent through client-side natural language processing.
- **Dynamic Slot Filling:** When given incomplete instructions (e.g., *"Add my assignment"*), it conversationally asks focused follow-up questions to collect subject, deadline, and workload effort.
- **Context Retention:** It remembers what was said earlier in the conversation and never asks for information you've already supplied.
- **Real-Time Actions:** It directly modifies an interactive academic dashboard, calculates live countdowns, generates phased revision roadmaps, and saves everything persistently to `localStorage`.
- **Zero Dependencies:** Pure Vanilla JavaScript, HTML5, and CSS3. No frameworks, no paid APIs, no node modules, and no backend required.

---

## 🎨 2. Unique Neo-Editorial Design & Color Palette

UNSTUCK rejects the generic corporate blue-and-white chatbot pattern in favor of a bold, tactile, futuristic editorial aesthetic inspired by modern student lifestyle tools.

| Color Token | Hex Code | Visual Role |
| :--- | :--- | :--- |
| **Electric Indigo** | `#24205C` | Primary brand canvas, header background, and user message bubbles |
| **Acid Lime** | `#C5FF5A` | Primary interactive accents, primary buttons, completion checkmarks |
| **Coral Pop** | `#FF806B` | Emergency indicators, high-urgency alerts, panic mode triage tags |
| **Lavender** | `#D9CBFF` | Secondary metric cards, pending status chips, recommendation backdrops |
| **Warm Off-White** | `#F7F4ED` | Editorial page background, subtle texture, secondary buttons |
| **Dark Ink** | `#191825` | High-contrast brutalist borders (`2px solid`), primary typography |

### Typography
- **Headings & Brand:** `Syne` (Bold geometric display font)
- **Body & Dialogue:** `Plus Jakarta Sans` (Clean, hyper-readable modern sans-serif)
- **Data, Badges & Timestamps:** `JetBrains Mono` (Technical precision)

---

## ⚡ 3. Core Chatbot Capabilities

### A. Intent Recognition
The custom rule-based and pattern-matching NLP engine recognizes diverse student intentions:
1. `ADD_ASSIGNMENT` / `ADD_TASK`: e.g., *"I have a Python project due next Friday"*, *"Add assignment"*.
2. `STUDY_PLAN`: e.g., *"Java exam in 5 days, I have 2 hours daily"*, *"Create revision plan for Calculus"*.
3. `CHECK_DEADLINES` / `VIEW_TASKS`: e.g., *"What is due this week?"*, *"Check my deadlines"*.
4. `DAYS_REMAINING`: e.g., *"How many days left until my Data Structures midterm?"*.
5. `PRIORITIZE`: e.g., *"What should I work on first?"*, *"What's most urgent?"*.
6. `PANIC_MODE` (Emergency Triage): e.g., *"I'm running out of time"*, *"I'm falling behind and stressed"*.
7. `TIME_MANAGEMENT`: e.g., *"How to stop procrastinating"*, *"Pomodoro technique"*, *"Time tips"*.
8. `COMPLETE_TASK`: e.g., *"Mark Python as done"*, *"Finished my Calculus problem set"*.
9. `DELETE_TASK`: e.g., *"Delete chemistry task"*, *"Remove assignment"*.
10. `CLEAR_DATA` / `RESET_CHAT`: e.g., *"Reset chat"*, *"Start over"*.

### B. Entity Extraction
Extracts key parameters from unstructured sentences:
- **Academic Subject:** Python, Java, Calculus, Data Structures, Physics, Web Dev, Economics, etc.
- **Task Category:** Assignment, Exam / Midterm, Course Project, Quiz / Test, Reading.
- **Deadlines & Dates:** 
  - Relative dates: *"today"*, *"tomorrow"*, *"day after tomorrow"*, *"in 3 days"*, *"next week"*, *"this Friday"*.
  - Calendar dates: *"November 25"*, *"Nov 28"*, *"2026-12-05"*.
- **Workload / Study Hours:** e.g., *"2 hours"*, *"3 hrs daily"*, *"quick (1.5h)"*, *"hard (6h)"*.
- **Priority Level:** Critical, High, Medium, Low.

### C. Conversational Slot Filling & State Machine
If a student provides incomplete information, UNSTUCK executes a step-by-step slot-filling sequence:
```
User: "Add my assignment."
UNSTUCK: "Sure! Which subject or topic is it for? (e.g. Python, Calculus)"
User: "Python"
UNSTUCK: "Got it, Python Assignment. When is the deadline? (e.g. 'tomorrow', 'Friday', or 'Nov 25')"
User: "November 25"
UNSTUCK: "Deadline locked for Nov 25. Roughly how many hours of work are remaining?"
User: "4 hours"
UNSTUCK: [Saves assignment to Tracker, displays interactive card, calculates days remaining & priority]
```

### D. Context Management
UNSTUCK maintains conversation state across turns:
- **Zero Redundancy:** If the user starts with *"I have a Java exam next Friday"*, UNSTUCK immediately extracts `Java` and `Next Friday`, and only prompts for missing daily study hours.
- **Mid-Flow Switching:** If the user interrupts a slot-filling dialogue by asking *"Wait, what are my current deadlines?"*, UNSTUCK answers the deadline query and offers to resume the assignment.

### E. Smart Prioritisation Algorithm
Tasks are prioritized using a weighted academic formula:
$$\text{Priority Score} = \text{Urgency Weight} + \text{Workload Weight} + \text{Category Weight}$$
- **Urgency:** Overdue (+60), Due today (+55), Due tomorrow (+45), Due $\le 2$ days (+35), Due $\le 4$ days (+20).
- **Workload:** $\ge 8$ hours (+25), $\ge 4$ hours (+15), $\ge 2$ hours (+8).
- **Category:** Exams (+20), Major Projects (+10).
- **Output:** Categorized into `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW`, and displayed with distinctive color badges.

### F. Emergency Workload Triage ("I'm Running Out of Time")
When a student is overwhelmed, UNSTUCK activates emergency triage:
1. Filters tasks due in $\le 3$ days as **MUST-DO** items.
2. Isolates tasks due later as **SAFE TO POSTPONE** to immediately reduce anxiety.
3. Guides the student to commit to a single 25-minute Pomodoro sprint on the highest-priority item.

---

## 📁 4. Strict File Structure

All files reside directly inside the root directory. There are **zero subfolders**:

```
unstuck/
├── index.html     # Semantic HTML5 markup, app shell, header, welcome hero & modal
├── style.css      # Pure CSS3 styles, editorial theme variables, animations & layout
├── script.js      # Vanilla JS NLP engine, state machine, storage manager & UI sync
└── README.md      # Comprehensive project documentation & deployment guide
```

---

## 🚀 5. How to Run the Project Locally

No web server or build step is required!

1. Download or clone this repository to your computer.
2. Open the project directory (`unstuck`).
3. Double-click **`index.html`** or right-click $\rightarrow$ **Open with Google Chrome / Microsoft Edge / Firefox**.
4. The application is completely functional offline and in any modern browser.

---

## 🧪 6. Feature Testing Guide

Test the chatbot using these sample commands:

| Capability | Sample Test Prompt | Expected Behavior |
| :--- | :--- | :--- |
| **Natural Add** | `I have a Python assignment due on November 25, 4 hours left` | Extracts all 3 entities at once, saves task immediately without extra prompts. |
| **Slot Filling** | `Add an assignment` | Prompts for subject $\rightarrow$ prompts for deadline $\rightarrow$ prompts for workload $\rightarrow$ confirms. |
| **Exam Plan** | `Java exam next week, I can study 2 hours daily` | Generates a multi-phase revision schedule with daily milestones and total hours. |
| **Check Deadlines**| `Check my deadlines` | Renders interactive cards with real-time countdown badges and quick action buttons. |
| **Prioritize** | `What should I do first?` | Recommends the #1 most urgent task with rationale and immediate 25-minute action step. |
| **Panic Triage** | `I'm running out of time and stressed` | Activates triage mode: splits workload into Must-Do vs Postpone, gives 3-step action plan. |
| **Time Management**| `How can I stop procrastinating?` | Returns 4 actionable student frameworks (Pomodoro, 2-Minute Rule, Eat the Frog, Active Recall). |
| **Mark Done** | `Mark Python as done` | Marks the task complete, updates progress bar, and re-sorts tracker. |
| **Reset Chat** | `Reset chat` | Clears conversation feed and returns to the initial Welcome Screen. |

---

## 🌐 7. Step-by-Step GitHub & GitHub Pages Deployment Guide

### Step 1: Initialize Git and Commit
Open PowerShell or your terminal inside the project directory:
```bash
git init
git add index.html style.css script.js README.md
git commit -m "Initial commit: UNSTUCK Student Problem-Solving Assistant"
```

### Step 2: Create a New GitHub Repository
1. Log in to [GitHub](https://github.com).
2. Click **New Repository** (green button).
3. Name the repository `unstuck` (or `unstuck-assistant`).
4. Set visibility to **Public**.
5. Leave "Initialize this repository with a README" **unchecked** (we already created one).
6. Click **Create repository**.

### Step 3: Push Code to GitHub
Copy the commands shown on GitHub:
```bash
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/unstuck.git
git push -u origin main
```

### Step 4: Enable GitHub Pages
1. On your GitHub repository page, click the **Settings** tab (gear icon at top).
2. In the left navigation sidebar, click **Pages** (under the "Code and automation" section).
3. Under **Build and deployment**:
   - **Source:** Select `Deploy from a branch`.
   - **Branch:** Select `main` and folder `/ (root)`.
4. Click **Save**.
5. Wait 60–90 seconds. Refresh the page until GitHub displays:
   > **Your site is live at `https://<YOUR-USERNAME>.github.io/unstuck/`**
6. Click the link to view your live, deployed UNSTUCK chatbot!

---

## 🎓 8. Evaluation Criteria Checklist

- [x] **Complete Frontend Application:** Pure HTML5, CSS3, and Vanilla JavaScript.
- [x] **Zero Dependencies:** No backend, no database, no API keys, no paid external AI services.
- [x] **Strict File Structure:** Exactly 4 files directly in the root directory. No folders or subfolders.
- [x] **Intent Recognition:** Understands tasks, exams, schedules, prioritisation, panic triage, and time advice.
- [x] **Entity Extraction:** Pulls subjects, dates, workload hours, and categories automatically.
- [x] **Multi-Turn Slot Filling:** Collects missing parameters conversationally one at a time.
- [x] **Context Management:** Retains prior user answers without re-prompting.
- [x] **Actionable State:** Tasks are actually created, edited, prioritized, and toggled in real time.
- [x] **Persistent Storage:** `localStorage` preserves tasks and metrics across page reloads.
- [x] **Distinctive Neo-Editorial UI:** Built using Electric Indigo, Acid Lime, Coral Pop, Lavender, Warm Off-White, and Dark Ink.
- [x] **Responsive Design:** Optimized for mobile phones, tablets, and desktop displays.
- [x] **GitHub Pages Ready:** Uses relative file references; works seamlessly out-of-the-box.

---

**Developed with ❤️ for students everywhere. Feeling stuck? Let's fix that.**
