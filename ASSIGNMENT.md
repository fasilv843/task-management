# Angular Developer Machine Test — Assignment Spec

Source: `Angular Developer Machine Test 2026.docx` (provided by interviewer). Kept here so any session working on this repo has the full requirements without needing the original doc.

## Overview

Build a **Task Management Module** using **Angular 21**, with **Standalone Components**, following Angular best practices.

AI assistance is allowed, but you must be able to explain the implementation, architectural decisions, and code during a follow-up technical discussion.

## Functional Requirements

### 1. Task List (Mandatory)

- Page displaying a list of tasks.
- Each task shows:
  - Title
  - Description (short preview)
  - Deadline
  - Status: `Pending`, `In Progress`, `Completed`
- Supported actions: View, Add, Edit, Delete task.
- Load task data using `HttpClient` from either:
  - `assets/tasks.json` (preferred), or
  - an in-memory API.
- Do **not** use external APIs.

### 2. Task Form (Mandatory)

- Reusable form for both creating and editing tasks.
- Fields: Title, Description, Deadline, Status.
- Use **Reactive Forms**.
- Implement validation, e.g.:
  - Required field validation
  - Deadline cannot be in the past (optional)
- Display validation messages where appropriate.

### 3. Task Details (Mandatory)

- Selecting a task navigates to a Task Details page.
- Displays complete task information.
- Description must use a rich text editor (any Angular-compatible option: `ngx-quill`, `ngx-editor`, CKEditor, TinyMCE).
- Rich text editor must support at least: Bold, Italic, Underline, Bullet List.

### 4. Comments (Mandatory)

- Comments section per task.
- Requirements:
  - Add comments
  - Reply to comments
  - Support unlimited nested replies
- Comments may be stored locally (JSON or in-memory) — no backend persistence required.
- A clean recursive implementation is encouraged.

## Bonus Features

### 1. Calendar View

- Integrate any Angular-compatible calendar library (e.g. FullCalendar, Angular Calendar).
- Display tasks based on their deadlines.
- Clicking a calendar event navigates to the corresponding Task Details page.
- Optional: different colors per task status.

### 2. State Management

- Instead of a plain Angular service, use a well-structured state management approach: Signals, NgRx, or MobX.
- Briefly explain the choice in the README.

## Technical Requirements

- Angular 21
- Standalone Components
- Angular Router
- Reactive Forms
- HttpClient
- TypeScript
- Clean component architecture, proper project organization, meaningful naming conventions.
- Focus is on clean, maintainable, well-structured code — not a pixel-perfect UI.

## Submission

- Public GitHub repository.
- `README.md` including:
  - Setup instructions
  - Angular version
  - Packages used
  - Any assumptions made
  - Brief explanation of application architecture
- Meaningful Git commit messages.

## Follow-up Discussion

Shortlisted candidates participate in a brief code review discussion, where you may be asked to:

- Explain your implementation
- Describe architectural decisions
- Walk through your code
- Make a small enhancement or bug fix

Goal: assess approach, problem-solving ability, and code quality — not memorization.

## Timeline

Complete the assignment as soon as possible — earlier submissions may receive priority during review.
