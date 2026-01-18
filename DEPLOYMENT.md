# Deployment Guide - Shadows of the 1920s

This game supports multiple deployment platforms with automatic environment detection.

## Supported Platforms

### 1. Google AI Studio (aistudio.google.com/apps)

**Best for:** Development and testing with built-in API key management

**Setup:**
1. Upload the entire project to AI Studio
2. The game will automatically detect the AI Studio environment
3. API key is provided automatically by the platform
4. No additional configuration needed

**Build command:**
```bash
npm run build
```

The build will use relative paths (`./`) which works seamlessly in AI Studio.

---

### 2. GitHub Pages

**Best for:** Public hosting and sharing

**Setup:**
1. Create a `.env` file in the project root (or set GitHub Secrets):
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy the `dist` folder to GitHub Pages

**Automatic Deployment (Optional):**
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Don't forget to add `GEMINI_API_KEY` to your GitHub repository secrets!

---

### 3. Local Development

**Setup:**
1. Create a `.env` file:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

The game will run on `http://localhost:3000`

---

## Environment Detection

The game automatically detects which platform it's running on:

- **AI Studio**: Detected by hostname or injected global variables
- **GitHub Pages**: Detected by `github.io` hostname
- **Local**: Default fallback

## API Key Priority

The game looks for API keys in this order:

1. **AI Studio**: `window.GOOGLE_API_KEY` or `window.GEMINI_API_KEY`
2. **Build-time**: `process.env.API_KEY` (from `.env` file)
3. **Fallback**: AI features disabled if no key found

## Customizing Base Path

By default, the build uses relative paths (`./`). To use a custom base path:

```bash
BASE_PATH=/my-game/ npm run build
```

## Troubleshooting

### AI Features Not Working
- Check console for "No API key available" warning
- Verify `.env` file exists (local/GitHub)
- Check AI Studio injected variables

### Assets Not Loading (404 errors)
- Verify `base` path in `vite.config.ts`
- Check that assets use relative paths
- Ensure `dist/assets/` folder exists after build

### Game Doesn't Start
- Check browser console for errors
- Verify all dependencies installed (`npm install`)
- Clear browser cache and localStorage

## Production Checklist

- [ ] API key configured for target platform
- [ ] Build completes without errors (`npm run build`)
- [ ] Test on target platform before public release
- [ ] Verify AI image generation works
- [ ] Check that localStorage saves work correctly
- [ ] Test on mobile devices (responsive design)

## Platform Comparison

| Feature | AI Studio | GitHub Pages | Local |
|---------|-----------|--------------|-------|
| Setup Difficulty | ⭐ Easy | ⭐⭐ Medium | ⭐ Easy |
| API Key | Automatic | Manual | Manual |
| Performance | Fast | Fast | Fast |
| Sharing | Limited | Public | Private |
| Cost | Free | Free | Free |

---

**Recommended Platform:** Start with **AI Studio** for quick testing, then deploy to **GitHub Pages** for public sharing.
