/**
 * Environment Detection and Configuration
 * Handles API keys and settings for different deployment platforms
 */

export interface Environment {
  platform: 'ai-studio' | 'github-pages' | 'local';
  apiKey: string | null;
  basePath: string;
}

/**
 * Detects the current platform and returns appropriate configuration
 */
export function detectEnvironment(): Environment {
  // Check if running in AI Studio
  const isAIStudio =
    window.location.hostname.includes('aistudio.google.com') ||
    window.location.hostname.includes('generativelanguage.googleapis.com') ||
    // AI Studio may inject API key through special global
    typeof (window as any).GOOGLE_API_KEY !== 'undefined';

  // Check if running on GitHub Pages
  const isGitHubPages =
    window.location.hostname.includes('github.io');

  // Determine platform
  let platform: Environment['platform'];
  if (isAIStudio) {
    platform = 'ai-studio';
  } else if (isGitHubPages) {
    platform = 'github-pages';
  } else {
    platform = 'local';
  }

  // Get API key based on platform
  let apiKey: string | null = null;

  if (platform === 'ai-studio') {
    // AI Studio may provide API key through different mechanisms
    apiKey =
      (window as any).GOOGLE_API_KEY ||
      (window as any).GEMINI_API_KEY ||
      // Fallback to environment variable if available
      (typeof process !== 'undefined' && process.env?.API_KEY) ||
      null;
  } else {
    // For GitHub Pages and local, use build-time injected key
    apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || null;
  }

  // Determine base path
  const basePath = platform === 'github-pages'
    ? window.location.pathname.split('/').slice(0, 2).join('/') + '/'
    : '/';

  return {
    platform,
    apiKey,
    basePath
  };
}

/**
 * Gets the API key for the current environment
 * Returns null if no key is available
 */
export function getApiKey(): string | null {
  const env = detectEnvironment();
  return env.apiKey;
}

/**
 * Checks if the current environment has a valid API key
 */
export function hasApiKey(): boolean {
  return getApiKey() !== null;
}

/**
 * Gets a user-friendly message about the current environment
 */
export function getEnvironmentInfo(): string {
  const env = detectEnvironment();
  const platformNames = {
    'ai-studio': 'Google AI Studio',
    'github-pages': 'GitHub Pages',
    'local': 'Local Development'
  };

  return `Running on ${platformNames[env.platform]}${env.apiKey ? ' (API key detected)' : ' (No API key)'}`;
}
