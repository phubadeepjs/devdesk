# 🚀 Phubadee Super App

A modern desktop application for developers built with Electron, React, and TypeScript. Optimized for Apple Silicon (M1/M2/M3).

## ✨ Features

### Available Tools

#### JSON Formatter
Beautify, minify, and validate JSON data
- Multiple indent size options (2, 4, 8 spaces)
- Copy to clipboard functionality
- Real-time validation with error messages
- Character count display

#### Text Compare
Compare two texts with intelligent diff algorithm
- **LCS-based diff** - Uses Longest Common Subsequence algorithm for accurate comparison
- Handles insertions and deletions correctly (not just line-by-line)
- Ignore case and whitespace options
- Color-coded diff visualization (equal, added, removed)
- Line numbers for both original and modified texts
- Copy/paste functionality
- Swap texts feature
- Real-time statistics

### Coming Soon
- **Base64 Encoder/Decoder**
- **Hash Generator**
- **Color Picker**
- **URL Encoder/Decoder**
- And more...

## 🛠️ Tech Stack

- **Electron** - Desktop application framework
- **React** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **CSS** - Modern styling with dark theme

## 📦 Installation

### Prerequisites
- Node.js 18+ (recommended: Node 20)
- npm or yarn (ใช้อันใดก็ได้)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd phubadee-super-app
```

2. Install root dependencies:
```bash
# ใช้ npm
npm install

# หรือใช้ yarn
yarn install
```

3. Install renderer dependencies:
```bash
# ใช้ npm
cd renderer && npm install && cd ..

# หรือใช้ yarn
cd renderer && yarn install && cd ..
```

## 🚀 Development

### Run in Development Mode

```bash
# ใช้ npm
npm run dev

# หรือใช้ yarn
yarn dev
```

This will:
1. Build the Electron main process
2. Build the React renderer
3. Launch the Electron app

### Watch Mode (for development)

In separate terminals:

```bash
# Terminal 1 - Watch main process
npm run watch    # หรือ yarn watch

# Terminal 2 - Watch renderer
cd renderer
npm run dev      # หรือ yarn dev

# Terminal 3 - Run Electron
npm start        # หรือ yarn start
```

## 📦 Building

### Build for Production

```bash
# ใช้ npm
npm run build:all

# หรือใช้ yarn
yarn build:all
```

### Package for macOS (Apple Silicon)

```bash
# ใช้ npm
npm run package:mac

# หรือใช้ yarn
yarn package:mac
```

This will create a `.dmg` and `.zip` file in the `dist` folder optimized for Apple Silicon (ARM64).

### Package for All Platforms

```bash
# ใช้ npm
npm run package

# หรือใช้ yarn
yarn package
```

## 🏗️ Project Structure

```
phubadee-super-app/
├── src/                    # Electron main process
│   ├── main.ts            # Main entry point
│   └── preload.ts         # Preload script
├── assets/                # Icons (tray/app)
│   ├── appIcon.png        # App icon (provided by user)
│   └── tray.png           # Tray icon (optional, fallback to appIcon)
├── renderer/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── tools/    # Tool components
│   │   │   └── Sidebar.tsx
│   │   ├── styles/       # CSS files
│   │   ├── App.tsx       # Main React component
│   │   └── main.tsx      # React entry point
│   ├── index.html        # HTML template
│   └── vite.config.ts    # Vite configuration
├── dist/                  # Build output
├── package.json          # Root dependencies
└── tsconfig.json         # TypeScript config
```

## 🎨 UI/UX Features

- **Dark Theme** - Eye-friendly dark color scheme
- **Native macOS Feel** - Hidden inset title bar, draggable regions
- **Responsive Layout** - Adapts to different window sizes
- **Modern Design** - Clean and minimal interface
- **Smooth Transitions** - Polished animations and interactions

## 🔧 Adding New Tools

To add a new tool:

1. Create a new component in `renderer/src/components/tools/`
2. Add the tool to the `ToolType` in `App.tsx`
3. Add the tool to the sidebar navigation in `Sidebar.tsx`
4. Add a case in the `renderTool()` switch statement in `App.tsx`

Example:
```tsx
// 1. Add type
export type ToolType = 'json-formatter' | 'text-compare' | 'your-tool';

// 2. Add to sidebar
{ id: 'your-tool', name: 'Your Tool', icon: '🔧' }

// 3. Add to renderTool()
case 'your-tool':
  return <YourTool />;
```

## 📝 License

MIT

## 🙏 Credits

Built with ❤️ by Phubadee

