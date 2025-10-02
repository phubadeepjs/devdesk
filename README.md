# 🛠️ DevDesk

A modern desktop and web application for developers built with Electron, React, and TypeScript. A collection of essential developer tools in one beautiful, native app.

**Available as both Desktop App (macOS/Windows/Linux) and Web App** - Same codebase, deploy anywhere! 🚀

## 📦 Installation

### Prerequisites

- Node.js 18+ (recommended: Node 20)
- Yarn package manager

### Setup

1. Clone the repository:

```bash
git clone https://github.com/phubadeepjs/devdesk.git
cd devdesk-app
```

1. Install root dependencies:

```bash
yarn install
```

1. Install renderer dependencies:

```bash
cd renderer && yarn install && cd ..
```

## 🚀 Development

### Desktop App Development

Run in development mode:

```bash
yarn dev
```

This will:

1. Build the Electron main process
2. Build the React renderer
3. Launch the Electron app

### Watch Mode (Advanced)

For faster development with hot reload, run in separate terminals:

```bash
# Terminal 1 - Watch main process
yarn watch

# Terminal 2 - Watch renderer
cd renderer && yarn dev

# Terminal 3 - Run Electron
yarn start
```

### Web App Development

Run web version locally:

```bash
yarn dev:web
```

Preview production build:

```bash
yarn preview:web
```

## 📦 Building & Packaging

### Desktop App

**Build for production:**

```bash
yarn build:desktop
```

**Package for macOS (Apple Silicon):**

```bash
yarn package:mac
```

This creates `.dmg` and `.zip` files in the `release` folder optimized for Apple Silicon (ARM64).

**Package for all platforms:**

```bash
yarn package
```

### Web App

**Build for production:**

```bash
yarn build:web
```

Output will be in `renderer/dist/` - ready to deploy to any static hosting!

## 🌐 Web Deployment

DevDesk can be deployed as a web application! The same codebase works for both desktop and web.

### Feature Comparison

| Feature         | Web Version | Desktop Version |
| --------------- | ----------- | --------------- |
| JSON Formatter  | ✅           | ✅               |
| JSON Schema     | ✅           | ✅               |
| JSON Query      | ✅           | ✅               |
| Text Compare    | ✅           | ✅               |
| RegEx Tester    | ✅           | ✅               |
| Lorem Ipsum     | ✅           | ✅               |
| Repo to Context | ❌           | ✅               |
| Auto-launch     | ❌           | ✅               |
| System Tray     | ❌           | ✅               |

### Deployment Options

#### 1. Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from renderer directory
cd renderer
vercel

# Production deployment
vercel --prod
```

#### 2. Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy from renderer directory
cd renderer
netlify deploy

# Production deployment
netlify deploy --prod
```

Create `netlify.toml` in the renderer directory:

```toml
[build]
  command = "yarn build:web"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 3. GitHub Pages

```bash
# Build
yarn build:web

# Deploy (using gh-pages)
npx gh-pages -d renderer/dist
```

Update `renderer/vite.config.ts` base to your repo name:

```typescript
base: isWeb ? '/devdesk/' : './',
```

#### 4. Static Hosting (AWS S3, Cloudflare Pages, etc.)

```bash
yarn build:web
# Upload renderer/dist/* to your hosting provider
```

### How It Works

Web builds automatically set `VITE_BUILD_TARGET=web`, which:

- Disables Electron-specific features
- Shows fallback UI for desktop-only tools
- Optimizes bundle size by lazy-loading desktop components
- Adapts UI automatically based on environment

### Troubleshooting

**Build fails with Electron errors**  
→ Make sure you're using `yarn build:web` which skips Electron builds.

**Features not showing**  
→ Check that `VITE_BUILD_TARGET=web` is set during build.

**404 on page refresh (SPA routing)**  
→ Configure your host to redirect all routes to `index.html`.

## 🔧 Development Guide

### Project Structure

```text
devdesk-app/
├── src/                    # Electron main process
│   ├── main.ts            # Main entry point
│   ├── preload.ts         # Preload script
│   └── utils/             # Utility functions
│       └── repo-processor.ts
├── renderer/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── tools/     # Tool components
│   │   │   └── Sidebar.tsx
│   │   ├── contexts/      # React contexts
│   │   ├── styles/        # CSS files
│   │   ├── config.ts      # App configuration
│   │   └── App.tsx        # Main React component
│   ├── index.html         # HTML template
│   └── vite.config.ts     # Vite configuration
├── assets/                # Icons and images
├── dist/                  # Build output
└── release/               # Packaged apps
```

### Adding New Tools

To add a new tool:

1. **Create component** in `renderer/src/components/tools/YourTool.tsx`

1. **Add to config** in `renderer/src/config.ts`:

```typescript
export const FEATURES = {
  // ...
  yourTool: true, // or IS_ELECTRON for desktop-only
};
```

1. **Add type** in `renderer/src/App.tsx`:

```typescript
export type ToolType = '...' | 'your-tool';
```

1. **Add to sidebar** in `renderer/src/components/Sidebar.tsx`:

```typescript
const allTools = [
  // ...
  { id: 'your-tool' as ToolType, name: 'Your Tool', icon: '🔧', feature: 'yourTool' },
];
```

1. **Add render case** in `renderer/src/App.tsx`:

```typescript
case 'your-tool':
  return <YourTool />;
```

### Code Style

- Use TypeScript for type safety
- Follow React best practices (hooks, functional components)
- Keep components focused and reusable
- Use CSS for styling (no CSS-in-JS)
- Save state to localStorage for persistence

### Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
