import React, { useState, useEffect, useMemo, useRef } from "react";
import "./CheatSheet.css";

interface CheatSheetRow {
  id: string;
  command: string;
  description: string;
  updatedAt: number;
}

const CheatSheet: React.FC = () => {
  const [rows, setRows] = useState<CheatSheetRow[]>(() => {
    try {
      const stored = localStorage.getItem("devdesk.cheatsheet_rows");
      if (stored) return JSON.parse(stored);

      // Migration from old card format if exists
      const oldCards = localStorage.getItem("devdesk.cheatsheets");
      if (oldCards) {
        const cards = JSON.parse(oldCards);
        return cards.map((c: any) => ({
          id: c.id,
          command: c.title,
          description: c.content,
          updatedAt: c.updatedAt,
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: "command" | "description";
  } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save on changes
  useEffect(() => {
    localStorage.setItem("devdesk.cheatsheet_rows", JSON.stringify(rows));
  }, [rows]);

  // Focus input when starting edit
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const query = searchQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.command.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query),
    );
  }, [rows, searchQuery]);

  const addRow = () => {
    const newRow: CheatSheetRow = {
      id: Date.now().toString(),
      command: "new command",
      description: "description goes here",
      updatedAt: Date.now(),
    };
    setRows([newRow, ...rows]);
    setEditingCell({ id: newRow.id, field: "command" });
  };

  const updateRow = (id: string, updates: Partial<CheatSheetRow>) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r,
      ),
    );
  };

  const deleteRow = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this row?")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (editingCell?.id === id) setEditingCell(null);
  };

  const copySnippet = (e: React.MouseEvent, content: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      const newRows: CheatSheetRow[] = [];
      const now = Date.now();

      lines.forEach((line, index) => {
        if (!line.trim()) return;

        // Simple CSV parsing: handle quotes
        const parts: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            parts.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        parts.push(current.trim());

        if (parts.length >= 2) {
          newRows.push({
            id: (now + index).toString(),
            command: parts[0].replace(/^"|"$/g, ""),
            description: parts[1].replace(/^"|"$/g, ""),
            updatedAt: now,
          });
        }
      });

      if (newRows.length > 0) {
        setRows((prev) => [...newRows, ...prev]);
        alert(`Successfully imported ${newRows.length} rows!`);
      } else {
        alert("No valid rows found in CSV. Expected: Command,Description");
      }

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map((r) => r.id)));
    }
  };

  const deleteSelectedRows = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected rows?`)) return;

    setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
  };

  return (
    <div className="cheat-sheet">
      <div className="tool-header">
        <h2>📜 Cheat Sheet Table</h2>
        <p className="tool-description">
          Quick reference for your commands, snippets, and notes
        </p>
      </div>

      <div className="cs-controls">
        <div className="cs-search-wrapper">
          <input
            type="text"
            className="cs-search-input"
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="cs-actions-main">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".csv"
            onChange={handleImportCSV}
          />
          <button
            className="cs-btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            📥 Import CSV
          </button>
          {selectedIds.size > 0 && (
            <button className="cs-btn-danger" onClick={deleteSelectedRows}>
              🗑️ Delete ({selectedIds.size})
            </button>
          )}
          <button className="cs-btn-primary" onClick={addRow}>
            ➕ Add Row
          </button>
        </div>
      </div>

      <div className="cs-table-container">
        {filteredRows.length > 0 ? (
          <table className="cs-table">
            <thead>
              <tr>
                <th style={{ width: "40px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={
                      filteredRows.length > 0 &&
                      selectedIds.size === filteredRows.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Snippet / Command</th>
                <th>Description / Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleSelectRow(row.id)}
                    />
                  </td>
                  {/* Command Cell */}
                  <td
                    className="cs-cell-editable cs-command-cell"
                    onClick={() =>
                      setEditingCell({ id: row.id, field: "command" })
                    }
                  >
                    {editingCell?.id === row.id &&
                    editingCell.field === "command" ? (
                      <textarea
                        ref={inputRef}
                        className="cs-cell-input"
                        value={row.command}
                        onChange={(e) =>
                          updateRow(row.id, { command: e.target.value })
                        }
                        onBlur={() => setEditingCell(null)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          setEditingCell(null)
                        }
                      />
                    ) : (
                      row.command || <em style={{ opacity: 0.3 }}>empty</em>
                    )}
                  </td>

                  {/* Description Cell */}
                  <td
                    className="cs-cell-editable cs-description-cell"
                    onClick={() =>
                      setEditingCell({ id: row.id, field: "description" })
                    }
                  >
                    {editingCell?.id === row.id &&
                    editingCell.field === "description" ? (
                      <textarea
                        ref={inputRef}
                        className="cs-cell-input"
                        value={row.description}
                        onChange={(e) =>
                          updateRow(row.id, { description: e.target.value })
                        }
                        onBlur={() => setEditingCell(null)}
                      />
                    ) : (
                      row.description || <em style={{ opacity: 0.3 }}>empty</em>
                    )}
                  </td>

                  {/* Action Cell */}
                  <td>
                    <div className="cs-row-actions">
                      <button
                        className="cs-action-btn"
                        onClick={(e) => copySnippet(e, row.command)}
                        title="Copy Snippet"
                      >
                        📋
                      </button>
                      <button
                        className="cs-action-btn delete"
                        onClick={(e) => deleteRow(e, row.id)}
                        title="Delete Row"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="cs-empty-table">
            <div className="cs-empty-icon">📂</div>
            <p>No snippets found. Click 'Add Row' to start your sheet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheatSheet;
