# SprintMind AI — Burnout-Proof Project Planner

SprintMind AI is a web-based, production-ready project planner that utilizes Google Gemini models to automatically deconstruct high-level goals into organized, weekly sprint schedules. Equipped with custom pacing buffers, interactive timeline views, and Kanban boards, it helps engineers, solo founders, and agile teams transition from loose ambitions to systematic execution without the risk of over-scheduling and fatigue.

---

## Key Features

* **Interactive Timeline View:** Displays your multi-week sprint plan chronologically. Each week lists a specific focus theme, sprint objective, a checklists of tasks with custom schedules, and a checkpoint milestone.
* **Drag-and-Shift Kanban Board:** Provides a focused, week-by-week execution board where tasks can be moved between "To Do", "In Progress", and "Completed" status columns.
* **Real-time Feasibility Engine:** Dynamically calculates a pacing score (0-100%) based on total task hours relative to your weekly budget. It warns you when a sprint week is overloaded, helping prevent planning fallacies.
* **Inline Task Details Editor:** Double-click any task to rename it, adjust hourly estimates, schedule specific timings, add buffer details, or delete it entirely.
* **Multi-Format Exporter:** Export your final roadmap into JSON (for import and backup), Markdown (for repository readmes), or CSV (for spreadsheet software like Excel and Google Sheets).
* **Local Persistence:** Automatically saves all generated plans in browser local storage, allowing you to manage and switch between multiple projects.
* **Mobile Responsive Design:** Adapts fluidly to mobile viewports with collapsed layouts, custom modal spacing, and stacked controls for on-the-go planning.

---

## Technical Stack

* **Backend:** Flask microserver (Python) featuring Pydantic schemas for parameter validation, rate limiting protections, and security headers.
* **AI Engine:** Google GenAI SDK (Gemini 2.5 Flash) executing structured dual-stage prompting.
* **Frontend:** Clean HTML5, responsive CSS3 variables (supporting Cyberpunk, Ocean, Emerald, and Sunset rose themes), and vanilla client-side JavaScript.

---

## Project Directory Structure

* **app.py:** Flask server script hosting validation schemas and model orchestration API endpoints.
* **run_production.py:** Production-grade runner script serving the WSGI application via Waitress.
* **wsgi.py:** Web Server Gateway Interface entry point for containerized or custom server hosting.
* **templates/index.html:** Core single-page frontend structure containing panels, modals, and templates.
* **static/style.css:** Modular UI styles, colors, grids, animations, and mobile responsive rules.
* **static/main.js:** Client-side state manager, exporter engines, and feasibility score heuristics.
* **tests/test_app.py:** Unit testing suite with mock request test cases.

---

## Setup and Local Installation

### 1. Environment Variables Configuration
Create a copy of `.env.example` named `.env` and supply your Gemini key:
* `GEMINI_API_KEY=your_actual_gemini_api_key_here`
* `PORT=5000`
* `FLASK_ENV=production`

### 2. Local Setup Steps
Open your terminal inside the project directory and run:
* `python -m venv venv`
* `venv\Scripts\activate` (Windows) OR `source venv/bin/activate` (macOS/Linux)
* `pip install -r requirements.txt`
* `python run_production.py`

Open `http://localhost:5000` in your web browser.

---

## Running the Automated Test Suite

Verify application integrity by executing the tests:
* `pytest`

Tests cover validation boundaries, header injections, Gemini pipeline mock assertions, and error boundary sanitization.

---

## Deployment Guide

Deploy easily to cloud application engines like Render, Railway, or Heroku:
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `python run_production.py`
* **Required Variable:** Set `GEMINI_API_KEY` in the service environment settings.
