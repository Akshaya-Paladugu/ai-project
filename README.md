# LifeLink — Blood Donor Directory & Smart Alert System

LifeLink is a responsive blood donor directory, smart urgency triage, donor matching engine, and localized alert dispatch web application designed for regional healthcare networks.

---

## Live Links & Localhost Access

- **Cloud Dev URL**: [Open Live App in Browser](https://ais-dev-rgzgxzwf4lqnty53xfaefq-979569117611.asia-southeast1.run.app)
- **Local Dev Server**: `http://localhost:3000`

---

## Getting Started Locally

### 1. Prerequisites
- **Node.js** (v18.0.0 or later)
- **npm** or **bun** / **yarn**

### 2. Installation
Clone or extract the repository, open a terminal in the project directory, and install dependencies:
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The application will launch on:
👉 **`http://localhost:3000`**

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## How to Push to Your GitHub Repository

The local Git repository has already been initialized and committed with branch `main`.

To push to your personal GitHub account:

1. **Create a new repository on GitHub**:
   - Go to [github.com/new](https://github.com/new).
   - Name your repository (e.g. `lifelink-blood-directory`).
   - Do **not** initialize with README, .gitignore, or license (they already exist in this project).
   - Click **Create repository**.

2. **Link this project to your GitHub repository**:
   Run the following commands in your terminal (replace `<YOUR_GITHUB_USERNAME>` and `<REPO_NAME>` with your details):
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<REPO_NAME>.git
   git branch -M main
   git push -u origin main
   ```

---

## Architectural Highlights

- **Data Persistence**: Centralized `localStorage` service (`src/services/storage.ts`) with safe JSON parsing, validation, reactive event broadcasting, and persistent storage across refreshes.
- **ABO/Rh Blood Matching**: Comprehensive rule-based theoretical red blood cell compatibility matrix with 56-day whole blood recovery cooldown calculation and transparent scoring factors (`src/services/matching.ts`).
- **Clinical Safety**: Warning banners and audit checks reminding operators that licensed pathologists and transfusion services must verify crossmatching and clinical donor eligibility.
- **Alert Dispatch Engine**: Notification drafts with channel support (SMS, WhatsApp, Email), duplicate alert suppression, and full dispatch history logs.
- **Export Capabilities**: Direct CSV downloads for Donors, Blood Requests, Dispatched Alerts, and System Activity Logs, along with complete JSON database backup and restore.
- **Optional Gemini AI**: Clinical doctor note triage parser and outreach message customizer with deterministic rule-based fallbacks that ensure the app runs completely without external API keys.
