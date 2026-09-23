<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/19303196-2a2f-4326-b03a-fa2d0dc3f9b2

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

For a deployed web app, set `APP_URL` and `VITE_API_BASE_URL` to the public HTTPS
origin that serves the Express API before building. The browser uses relative
`/api` URLs when `VITE_API_BASE_URL` is empty.

During development, saving a source file is applied automatically through Vite HMR. The backend is also restarted by `tsx watch`, so this works independently of whether files are edited in VS Code, Antigravity, or another editor. Browser clients check the server version every 30 seconds and reload after a server restart.

### One-click startup

- Linux: double-click `start-server.sh`, then open `http://localhost:3000/`
- Windows: double-click `start-server.bat`, then open `http://localhost:3000/`
- Browser launcher: open `launch.html` after starting the server

An HTML file cannot start a Node.js server by itself because browsers do not allow local process execution. The launcher opens the server and reports when it is not running.

### Android APK

Install Android Studio and an Android SDK first, then run:

```bash
npm run cap:add:android
npm run cap:sync
npm run cap:open:android
```

Build a debug APK from Android Studio, or use `npm run cap:build:android` after the Android platform has been added. The APK bundles the web UI; Gemini API calls still require the configured server/API endpoint.

Before `npm run cap:sync`, create a production environment file with the public
API URL, for example:

```bash
VITE_API_BASE_URL=https://api.example.com npm run cap:sync
```

The API must be served over HTTPS and allow requests from the app origin. Never
put `GEMINI_API_KEY` in the Vite environment because `VITE_*` values are bundled
into the client.

An installed APK cannot update its bundled code just because a developer edits a file. APK updates require rebuilding and distributing a new APK, or adding a dedicated Capacitor OTA update service. The automatic update behavior applies to the web and PWA versions.

### GitHub cloud APK build

The workflow at `.github/workflows/build-apk.yml` builds a debug APK automatically on pushes to `main`/`master`, or manually from the GitHub Actions tab. For a manual run, enter the public HTTPS API URL in the `api_base_url` field. Alternatively, configure the repository variable `VITE_API_BASE_URL`. After the workflow completes, download `mk1-search-engine-debug-apk` from the workflow run's Artifacts section.

The Android build must be performed by GitHub Actions. Do not run the Gradle
build locally. The workflow installs its own Node.js, JDK, and Android SDK.
