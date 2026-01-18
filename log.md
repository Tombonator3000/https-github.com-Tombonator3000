
# Project Log - Shadows of the 1920s

Track all major milestones, feature additions, and bug fixes here.

## [Initial Phase]
*   **Core Setup:** Initialized project structure with React, Tailwind, and Lucide-icons.
*   **Engine:** Created a hexagonal grid board with pixel-to-hex conversion logic.
*   **Investigators:** Defined initial character roster: Detective, Professor, Journalist, Veteran, Occultist, and Doctor.

## [v1.1 - v3.9.3]
*   *(Previous logs collapsed for brevity - see history)*
*   **v3.9.2:** Eldritch Visions (Lore-accurate AI Art).
*   **v3.9.3:** The Roguelite Expansion (Traits & Modifiers).

## [v3.9.4 Update - Hex Clarity & Navigation]
*   **Visual Overhaul:** Replaced CSS borders with SVG overlays for tiles. This fixes the issue where hex borders were cut off at corners.
*   **Dead End Indicators:** Implemented dynamic wall rendering. The grid now visually indicates blocked directions/dead ends on the hex edges where no connection exists.
*   **Ghost Tiles:** Improved visibility of valid move targets with dashed outlines.

## [v4.0.0 Update - GitHub Pages Deployment & Google AI Integration]
*   **GitHub Actions Workflow:** Implemented automated deployment to GitHub Pages via GitHub Actions.
*   **Google AI Studio Integration:** Configured project to use Google Gemini API for AI-generated artwork. Added proper environment variable handling for API keys.
*   **Deployment Configuration:** Updated Vite configuration with proper base path handling for GitHub Pages deployment.
*   **Documentation:** Comprehensive README with setup instructions for both local development and GitHub Pages deployment.
*   **Environment Setup:** Added .env.example template with instructions for obtaining Google AI API keys from https://aistudio.google.com/apikey.
*   **Build Fix:** Fixed Vite build configuration to properly bundle all TypeScript/React modules into production assets.
