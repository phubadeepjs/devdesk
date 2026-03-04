import React, { useState, useEffect } from "react";
import "./JsonToTs.css";
import { useSettings } from "../../contexts/SettingsContext";

interface ConversionOptions {
  rootName: string;
  useInterface: boolean;
  optionalFields: boolean;
  exportKeyword: boolean;
}

const JsonToTs: React.FC = () => {
  const [input, setInput] = useState(() => {
    try {
      return localStorage.getItem("json-to-ts.input") || "";
    } catch {
      return "";
    }
  });

  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [options, setOptions] = useState<ConversionOptions>({
    rootName: "Root",
    useInterface: true,
    optionalFields: false,
    exportKeyword: true,
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("json-to-ts.input", input);
    } catch {}
  }, [input]);

  useEffect(() => {
    if (input.trim()) {
      try {
        setError("");
        const json = JSON.parse(input);
        const effectiveRoot = options.rootName.trim() || "Root";
        const interfaces = generateInterfaces(json, effectiveRoot, options);
        setOutput(interfaces);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid JSON");
        setOutput("");
      }
    } else {
      setOutput("");
      setError("");
    }
  }, [input, options]);

  const toInterfaceName = (key: string): string => {
    // Convert key to PascalCase
    return (
      key
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .replace(/_+([a-zA-Z0-9])/g, (_, char) => char.toUpperCase())
        .replace(/^[a-z]/, (char) => char.toUpperCase()) || "Unknown"
    );
  };

  const toSafePropName = (key: string): string => {
    // If key contains special chars, wrap in quotes
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) return key;
    return `"${key}"`;
  };

  const generateInterfaces = (
    data: any,
    name: string,
    opts: ConversionOptions,
  ): string => {
    const interfaces: Map<string, string> = new Map();

    const inferType = (value: any, keyHint: string): string => {
      if (value === null) return "null";
      if (Array.isArray(value)) {
        if (value.length === 0) return "unknown[]";
        const itemType = inferType(value[0], keyHint);
        return `${itemType}[]`;
      }
      const t = typeof value;
      if (t === "object") {
        const subName = toInterfaceName(keyHint);
        buildInterface(value, subName);
        return subName;
      }
      if (t === "number") return Number.isInteger(value) ? "number" : "number";
      return t; // string, boolean
    };

    const buildInterface = (
      obj: Record<string, any>,
      interfaceName: string,
    ): void => {
      if (interfaces.has(interfaceName)) return;

      const lines: string[] = [];
      const exportStr = opts.exportKeyword ? "export " : "";

      if (opts.useInterface) {
        lines.push(`${exportStr}interface ${interfaceName} {`);
      } else {
        lines.push(`${exportStr}type ${interfaceName} = {`);
      }

      for (const [key, val] of Object.entries(obj)) {
        const safeProp = toSafePropName(key);
        const optional = opts.optionalFields ? "?" : "";
        let tsType: string;

        if (val === null) {
          tsType = "null";
        } else if (Array.isArray(val)) {
          if (val.length === 0) {
            tsType = "unknown[]";
          } else if (
            typeof val[0] === "object" &&
            val[0] !== null &&
            !Array.isArray(val[0])
          ) {
            const subName = toInterfaceName(key);
            buildInterface(val[0], subName);
            tsType = `${subName}[]`;
          } else {
            tsType = `${inferType(val[0], key)}[]`;
          }
        } else if (typeof val === "object") {
          const subName = toInterfaceName(key);
          buildInterface(val, subName);
          tsType = subName;
        } else if (typeof val === "number") {
          tsType = "number";
        } else {
          tsType = typeof val; // string, boolean
        }

        lines.push(`  ${safeProp}${optional}: ${tsType};`);
      }

      if (opts.useInterface) {
        lines.push("}");
      } else {
        lines.push("};");
      }

      interfaces.set(interfaceName, lines.join("\n"));
    };

    const topName = toInterfaceName(name);

    if (Array.isArray(data)) {
      if (data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
        buildInterface(data[0], topName);
      } else {
        const itemType = data.length > 0 ? typeof data[0] : "unknown";
        const exportStr = opts.exportKeyword ? "export " : "";
        interfaces.set(topName, `${exportStr}type ${topName} = ${itemType}[];`);
      }
    } else if (typeof data === "object" && data !== null) {
      buildInterface(data, topName);
    } else {
      const exportStr = opts.exportKeyword ? "export " : "";
      const tsType = typeof data;
      interfaces.set(topName, `${exportStr}type ${topName} = ${tsType};`);
    }

    // Return nested interfaces first (dependencies), root last
    const result: string[] = [];
    for (const [k, v] of interfaces) {
      if (k !== topName) result.push(v);
    }
    if (interfaces.has(topName)) result.push(interfaces.get(topName)!);

    return result.join("\n\n");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setError("");
    try {
      localStorage.removeItem("json-to-ts.input");
    } catch {}
  };

  const syntaxHighlightTs = (code: string): string => {
    return (
      code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        // keywords
        .replace(
          /\b(export|interface|type|extends|readonly|null|unknown)\b/g,
          '<span class="ts-keyword">$1</span>',
        )
        // type names (PascalCase words)
        .replace(/\b([A-Z][a-zA-Z0-9]*)\b/g, '<span class="ts-type">$1</span>')
        // property names before colon
        .replace(
          /(\s+)("?[a-z_$]["a-zA-Z0-9_$]*"?\??)(:\s)/g,
          '$1<span class="ts-prop">$2</span>$3',
        )
        // primitive types
        .replace(
          /\b(string|number|boolean|object|any|void|never)\b/g,
          '<span class="ts-primitive">$1</span>',
        )
    );
  };

  const handleOutputKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "a") {
      e.preventDefault();
      e.stopPropagation();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(e.currentTarget);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  };

  const { wrapLongLines } = useSettings();

  const EXAMPLE_JSON = `{
  "user": {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com",
    "isActive": true,
    "score": 98.5,
    "tags": ["admin", "user"],
    "address": {
      "street": "123 Main St",
      "city": "Springfield",
      "zip": "12345"
    }
  }
}`;

  return (
    <div className={`json-to-ts ${wrapLongLines ? "wrap-on" : "wrap-off"}`}>
      <div className="tool-header">
        <h2>🔷 JSON to TypeScript</h2>
        <p className="tool-description">
          Convert JSON to TypeScript interfaces or type aliases instantly
        </p>
      </div>

      {/* Options Bar */}
      <div className="jts-controls">
        <div className="jts-option-group">
          <label>Root name</label>
          <input
            className="jts-name-input"
            type="text"
            value={options.rootName}
            onChange={(e) =>
              setOptions({ ...options, rootName: e.target.value })
            }
            placeholder="Root"
          />
        </div>

        <div className="jts-option-group">
          <label>Output type</label>
          <div className="jts-toggle">
            <button
              className={options.useInterface ? "active" : ""}
              onClick={() => setOptions({ ...options, useInterface: true })}
            >
              interface
            </button>
            <button
              className={!options.useInterface ? "active" : ""}
              onClick={() => setOptions({ ...options, useInterface: false })}
            >
              type
            </button>
          </div>
        </div>

        <div className="jts-option-group">
          <label className="jts-checkbox-label">
            <input
              type="checkbox"
              checked={options.optionalFields}
              onChange={(e) =>
                setOptions({ ...options, optionalFields: e.target.checked })
              }
            />
            Optional fields
          </label>
        </div>

        <div className="jts-option-group">
          <label className="jts-checkbox-label">
            <input
              type="checkbox"
              checked={options.exportKeyword}
              onChange={(e) =>
                setOptions({ ...options, exportKeyword: e.target.checked })
              }
            />
            Export keyword
          </label>
        </div>

        <div className="jts-option-actions">
          <button
            className="jts-btn-secondary"
            onClick={() => setInput(EXAMPLE_JSON)}
          >
            📄 Example
          </button>
          <button className="jts-btn-danger" onClick={clearAll}>
            🗑️ Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="jts-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="editor-container">
        {/* Input Panel */}
        <div className="editor-panel">
          <div className="panel-header">
            <h3>JSON Input</h3>
            <span className="char-count">{input.length} characters</span>
          </div>
          <textarea
            className="editor-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Paste your JSON here...\n\nExample:\n{\n  "name": "Alice",\n  "age": 30\n}`}
            spellCheck={false}
          />
        </div>

        {/* Output Panel */}
        <div className="editor-panel">
          <div className="panel-header">
            <h3>TypeScript Output</h3>
            <div className="panel-actions">
              {output && (
                <button
                  onClick={copyToClipboard}
                  className={`jts-btn-copy ${copied ? "copied" : ""}`}
                >
                  {copied ? "✅ Copied!" : "📋 Copy"}
                </button>
              )}
            </div>
          </div>
          {output ? (
            <pre
              className="editor-output"
              dangerouslySetInnerHTML={{
                __html: syntaxHighlightTs(output),
              }}
              tabIndex={0}
              onKeyDown={handleOutputKeyDown}
              title="Use Ctrl+A to select all, Ctrl+C to copy"
            />
          ) : (
            <div className="editor-placeholder">
              TypeScript interfaces will appear here...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JsonToTs;
