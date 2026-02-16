
# MindfulRemind 🧠

A sophisticated, AI-powered task manager with user authentication, persistent SQLite storage, and a beautiful React interface.

## Features
- **AI Task Optimization**: Uses Google Gemini to improve your task titles and descriptions.
- **Persistent Storage**: Built-in SQLite database ensures your data survives restarts.
- **Admin Dashboard**: Global view of all users and tasks.
- **Docker Ready**: Deploy anywhere in seconds with one command.

## Quick Start (Local)

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set your Gemini API Key:
   ```bash
   export API_KEY=your_gemini_key_here
   ```
4. Start the server:
   ```bash
   npm start
   ```

## Deployment with Docker

The easiest way to run MindfulRemind is via Docker Compose:

1. Create a `.env` file in the root directory:
   ```env
   API_KEY=your_actual_gemini_api_key
   ```
2. Run the deployment command:
   ```bash
   docker-compose up -d
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Credentials
- **Admin Login**: `admin`
- **Password**: `password@2026` (or `passwowrd`, `passwortask`)

## Tech Stack
- **Frontend**: React (No-build ESM), Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express
- **Database**: SQLite (better-sqlite3)
- **AI**: Google Generative AI (Gemini 3 Flash)
