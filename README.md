<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Shadows of the 1920s

A Lovecraftian horror board game built with React, TypeScript, and Google AI.

View your app in AI Studio: https://ai.studio/apps/drive/1gdZ2Qr7ZeYMffjIgSpgDHLMCrJyhhC6y

## Features

- Hexagonal grid-based gameplay
- AI-generated artwork using Google Gemini
- Dynamic enemy spawning and combat
- Sanity and health mechanics
- Procedurally generated events and puzzles
- Persistent save system

## Run Locally

**Prerequisites:** Node.js 20+

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tombonator3000/https-github.com-Tombonator3000.git
   cd https-github.com-Tombonator3000
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google AI API Key**

   Get your free API key from [Google AI Studio](https://aistudio.google.com/apikey)

   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:3000

## Deploy to GitHub Pages

This repository is configured to automatically deploy to GitHub Pages when you push to the main branch.

### Setup Steps:

1. **Enable GitHub Pages**
   - Go to your repository Settings > Pages
   - Under "Build and deployment", select "GitHub Actions" as the source

2. **Add your Gemini API Key as a Secret**
   - Go to Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `GEMINI_API_KEY`
   - Value: Your Google AI API key from https://aistudio.google.com/apikey
   - Click "Add secret"

3. **Push to deploy**
   ```bash
   git push origin main
   ```

   The GitHub Action will automatically build and deploy your app to:
   `https://tombonator3000.github.io/https-github.com-Tombonator3000/`

## Technology Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Audio:** Tone.js
- **AI:** Google GenAI SDK (@google/genai)

## Development

See [agents.md](agents.md) for development protocols and architecture guidelines.
See [log.md](log.md) for project history and changes.

## License

This project is private and not licensed for public use.
