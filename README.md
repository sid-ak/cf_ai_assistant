# Full-Stack Cloudflare AI Assistant

**Live Demo:** [https://my-angular-app.sidharthak25.workers.dev](https://my-angular-app.sidharthak25.workers.dev)

This project is a real-time, stateful AI chat application built entirely on Cloudflare's edge infrastructure. It features a modern, responsive UI built with Angular SSR (Server Side Rendering) that supports both text and voice interactions, utilizing Cloudflare Workers AI for natural language processing and Durable Objects for isolated, auto-cleaning session memory.

## Core Components

* **1. LLM (Large Language Model):**
  * Uses Cloudflare Workers AI to run Meta's `Llama 3` for text responses and OpenAI's `Whisper` for audio transcription directly at the edge.

* **2. Workflow / Coordination:**
  * A Cloudflare Worker serves as the central orchestrator, routing HTTP requests, handling multipart audio files, and sequencing the AI models.

* **3. User Input (Chat & Voice):**
  * A custom Angular UI captures text or records voice via the native MediaRecorder API, transcribing audio for user review before prompting the LLM.

* **4. Memory / State:**
  * Cloudflare Durable Objects (SQLite backend) provide isolated session histories tied to unique user UUIDs, utilizing the Alarms API for automatic self-deletion of abandoned chats.

## Local Development & Deployment

### Prerequisites
* Node.js installed.
* Wrangler CLI authenticated (`npx wrangler login`).

### Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the Angular frontend and SSR engine:**
   ```bash
   npm run build
   ```

3. **Test locally:**
   ```bash
   npx wrangler dev
   ```

4. **Deploy to Cloudflare:**
   ```bash
   npx wrangler deploy
   ```
   *(Note: Ensure your `wrangler.json` includes the `new_sqlite_classes` migration array for free-tier Durable Object compatibility).*