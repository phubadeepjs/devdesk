# 🛠️ DevDesk

A modern desktop application for developers built with Electron, React, and TypeScript. A collection of essential developer tools in one beautiful, native app.

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

### Run in Development Mode

```bash
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
yarn watch

# Terminal 2 - Watch renderer
cd renderer && yarn dev

# Terminal 3 - Run Electron
yarn start
```

## 📦 Building

### Build for Production

```bash
yarn build:all
```

### Package for macOS (Apple Silicon)

```bash
yarn package:mac
```

This will create a `.dmg` and `.zip` file in the `release` folder optimized for Apple Silicon (ARM64).

### Package for All Platforms

```bash
yarn package
```

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

## 🙏 Credits

Built with ❤️ by [Phubadee](https://github.com/phubadeepjs)
