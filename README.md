# 🛠️ DevDesk

A modern desktop application for developers built with Electron, React, and TypeScript. A collection of essential developer tools in one beautiful, native app.

## ✨ Features

### Available Tools

#### JSON Formatter

Beautify, minify, and validate JSON data with syntax highlighting

- Multiple indent size options (2, 4, 8 spaces)
- Syntax highlighting with color-coded tokens
- Quote keys toggle
- Copy to clipboard functionality
- Real-time validation with error messages
- Character count display
- Persistent state across sessions

#### Text Compare

Compare two texts with intelligent diff algorithm

- **LCS-based diff** - Uses Longest Common Subsequence algorithm for accurate comparison
- Handles insertions and deletions correctly (not just line-by-line)
- Ignore case and whitespace options
- Color-coded diff visualization (equal, added, removed)
- Navigate between diffs with keyboard shortcuts (Shift + ↑/↓)
- Line numbers for both original and modified texts
- Copy/paste functionality
- Swap texts feature
- Real-time statistics with diff count
- Persistent state across sessions

#### RegEx Tester

Test and debug regular expressions with live matching

- Real-time pattern matching
- Support for global, multiline, and case-insensitive flags
- Visual highlighting of matches in test text
- Detailed match results with groups and positions
- Copy pattern and matches
- Example patterns included
- Persistent state across sessions

#### JSON Query

Query JSON data using JSONPath syntax

- Support for JSONPath expressions
- Real-time query execution
- Syntax highlighting for results
- Display matched paths
- Quick reference guide
- Copy query and results
- Example queries included
- Persistent state across sessions

#### Lorem Ipsum Generator

Generate placeholder text for mockups and designs

- Generate paragraphs, sentences, or words
- Adjustable count
- One-click copy to clipboard
- Classic Lorem Ipsum text

#### Repo to Context

Convert entire repositories into PDF/TXT for AI context

- Generate comprehensive repository documentation
- Include file tree structure
- Filter by file extensions
- Exclude patterns support
- Export as PDF or TXT
- Progress tracking
- Quick open generated files

## 🛠️ Tech Stack

- **Electron** - Desktop application framework
- **React** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **CSS** - Modern styling with dark theme

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
