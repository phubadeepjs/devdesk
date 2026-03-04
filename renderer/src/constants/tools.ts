export interface Tool {
  id: string;
  path: string;
  name: string;
  icon: string;
  feature: string;
}

export const allTools: Tool[] = [
  {
    id: "json-formatter",
    path: "/",
    name: "JSON Formatter",
    icon: "{ }",
    feature: "jsonFormatter",
  },
  {
    id: "json-schema",
    path: "/json-schema",
    name: "JSON Schema",
    icon: "📋",
    feature: "jsonSchema",
  },
  {
    id: "json-query",
    path: "/json-query",
    name: "JSON Query",
    icon: "🔎",
    feature: "jsonQuery",
  },
  {
    id: "text-compare",
    path: "/text-compare",
    name: "Text Compare",
    icon: "⚖️",
    feature: "textCompare",
  },
  {
    id: "regex-tester",
    path: "/regex-tester",
    name: "RegEx Tester",
    icon: "🔍",
    feature: "regexTester",
  },
  {
    id: "lorem-ipsum",
    path: "/lorem-ipsum",
    name: "Lorem Ipsum",
    icon: "📝",
    feature: "loremIpsum",
  },
  {
    id: "timestamp-converter",
    path: "/timestamp-converter",
    name: "Timestamp Converter",
    icon: "⏱️",
    feature: "timestampConverter",
  },
  {
    id: "base64-encoder",
    path: "/base64-encoder",
    name: "Encoder/Decoder",
    icon: "🔐",
    feature: "base64Encoder",
  },
  {
    id: "prompt-generator",
    path: "/prompt-generator",
    name: "Prompt Generator",
    icon: "✨",
    feature: "promptGenerator",
  },
  {
    id: "json-to-ts",
    path: "/json-to-ts",
    name: "JSON to TypeScript",
    icon: "🔷",
    feature: "jsonToTs",
  },
  {
    id: "repo-to-context",
    path: "/repo-to-context",
    name: "Repo to Context",
    icon: "📦",
    feature: "repoToContext",
  },
  {
    id: "cheat-sheet",
    path: "/cheat-sheet",
    name: "Cheat Sheet",
    icon: "📜",
    feature: "cheatSheet",
  },
];
