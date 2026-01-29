import React, { useState } from 'react';
import './PromptGenerator.css';

interface Template {
  id: string;
  name: string;
  content: string;
}

const defaultTemplates: Template[] = [
  {
    id: 'example',
    name: 'Example Template',
    content: 'Review the following {{language}} code and provide feedback on:\n1. Code quality and best practices\n2. Potential bugs or issues\n\nCode:\n{{code}}',
  }
];

const PromptGenerator: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(defaultTemplates[0].id);
  const [promptText, setPromptText] = useState(defaultTemplates[0].content);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [output, setOutput] = useState('');
  const [isOneLine, setIsOneLine] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showNewTemplateInput, setShowNewTemplateInput] = useState(false);

  // Extract variables from {{variable}} pattern
  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g);
    return matches ? Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))) : [];
  };

  const generateOutput = (template: string, vars: Record<string, string>, oneLine: boolean) => {
    let result = template;
    
    // Replace variables
    Object.entries(vars).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    // Apply one-line format
    if (oneLine) {
      result = result
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t')
        .replace(/"/g, '\\"');
    }

    setOutput(result);
  };

  const handlePromptChange = (value: string) => {
    setPromptText(value);
    
    // Extract and update variables
    const detectedVars = extractVariables(value);
    const newVars: Record<string, string> = {};
    
    // Keep existing values for variables that still exist
    detectedVars.forEach(varName => {
      newVars[varName] = variables[varName] || '';
    });
    
    setVariables(newVars);
    generateOutput(value, newVars, isOneLine);
    
    // Update current template
    setTemplates(templates.map(t => 
      t.id === selectedTemplateId ? { ...t, content: value } : t
    ));
  };

  const handleVariableChange = (varName: string, value: string) => {
    const newVars = { ...variables, [varName]: value };
    setVariables(newVars);
    generateOutput(promptText, newVars, isOneLine);
  };

  const handleFormatToggle = () => {
    const newOneLine = !isOneLine;
    setIsOneLine(newOneLine);
    generateOutput(promptText, variables, newOneLine);
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setPromptText(template.content);
      const detectedVars = extractVariables(template.content);
      const newVars: Record<string, string> = {};
      detectedVars.forEach(v => newVars[v] = '');
      setVariables(newVars);
      generateOutput(template.content, newVars, isOneLine);
    }
  };

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) return;
    
    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: newTemplateName,
      content: '',
    };
    
    setTemplates([...templates, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
    setPromptText('');
    setVariables({});
    setOutput('');
    setNewTemplateName('');
    setShowNewTemplateInput(false);
  };

  const handleDeleteTemplate = () => {
    if (templates.length <= 1) {
      alert('Cannot delete the last template');
      return;
    }
    
    if (!confirm(`Delete template "${templates.find(t => t.id === selectedTemplateId)?.name}"?`)) {
      return;
    }
    
    const newTemplates = templates.filter(t => t.id !== selectedTemplateId);
    setTemplates(newTemplates);
    
    // Switch to first template
    const firstTemplate = newTemplates[0];
    setSelectedTemplateId(firstTemplate.id);
    setPromptText(firstTemplate.content);
    const detectedVars = extractVariables(firstTemplate.content);
    const newVars: Record<string, string> = {};
    detectedVars.forEach(v => newVars[v] = '');
    setVariables(newVars);
    generateOutput(firstTemplate.content, newVars, isOneLine);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const clearAll = () => {
    // Clear only variable values, keep the template
    const clearedVars: Record<string, string> = {};
    Object.keys(variables).forEach(key => {
      clearedVars[key] = '';
    });
    setVariables(clearedVars);
    generateOutput(promptText, clearedVars, isOneLine);
  };

  React.useEffect(() => {
    generateOutput(promptText, variables, isOneLine);
  }, []);

  const currentVariables = extractVariables(promptText);

  return (
    <div className="prompt-generator">
      <div className="tool-header">
        <h2>✨ Prompt Generator</h2>
        <p className="tool-description">
          Build AI prompts with templates and convert to one-line format for API requests
        </p>
      </div>

      <div className="controls">
        <div className="control-group">
          <label>Template:</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
          >
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        <div className="template-actions">
          {showNewTemplateInput ? (
            <div className="new-template-input">
              <input
                type="text"
                placeholder="Template name..."
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTemplate();
                  if (e.key === 'Escape') {
                    setShowNewTemplateInput(false);
                    setNewTemplateName('');
                  }
                }}
                autoFocus
              />
              <button onClick={handleCreateTemplate} className="btn-confirm">✓</button>
              <button onClick={() => {
                setShowNewTemplateInput(false);
                setNewTemplateName('');
              }} className="btn-cancel">✗</button>
            </div>
          ) : (
            <button onClick={() => setShowNewTemplateInput(true)} className="btn-new">
              + New Template
            </button>
          )}
          <button onClick={handleDeleteTemplate} className="btn-delete">
            🗑️ Delete
          </button>
        </div>

        <div className="control-group format-control">
          <label>
            <input
              type="checkbox"
              checked={isOneLine}
              onChange={handleFormatToggle}
            />
            One-line format (for JSON)
          </label>
        </div>

        <div className="control-actions">
          <button onClick={clearAll} title="Clear all variable values">
            🗑️ Clear Variables
          </button>
        </div>
      </div>

      <div className="editor-container">
        <div className="editor-panel prompt-panel">
          <div className="panel-header">
            <h3>Prompt Template</h3>
            <span className="info-text">Use {`{{variable}}`} for placeholders</span>
          </div>
          <textarea
            value={promptText}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="Enter your prompt template here... Use {{variable}} for dynamic values"
            spellCheck={false}
          />
        </div>

        {currentVariables.length > 0 && (
          <div className="variables-panel">
            <div className="panel-header">
              <h3>Variables</h3>
              <span className="info-text">{currentVariables.length} variable{currentVariables.length > 1 ? 's' : ''}</span>
            </div>
            <div className="variables-list">
              {currentVariables.map(varName => (
                <div key={varName} className="variable-input">
                  <label>{varName}:</label>
                  <textarea
                    value={variables[varName] || ''}
                    onChange={(e) => handleVariableChange(varName, e.target.value)}
                    placeholder={`Enter ${varName}...`}
                    rows={3}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="editor-panel output-panel">
          <div className="panel-header">
            <h3>Generated Output</h3>
            <div className="panel-actions">
              <span className="char-count">{output.length} characters</span>
              {output && (
                <button onClick={copyToClipboard} className="btn-copy">
                  📋 Copy
                </button>
              )}
            </div>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="Generated prompt will appear here..."
            spellCheck={false}
          />
          {isOneLine && output && (
            <div className="format-info">
              ✓ Formatted for JSON request body (newlines escaped as \n)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptGenerator;
