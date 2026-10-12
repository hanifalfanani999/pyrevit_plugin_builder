import { useState, useCallback } from 'react';
import { PluginConfig, ScriptConfig, GeneratedFile } from './types';
import { generateAllFiles, generateFolderStructure, generateScriptFile } from './generator';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const defaultPlugin: PluginConfig = {
  name: 'MyRevitTools',
  bundleName: 'MyRevitTools',
  author: 'Developer',
  description: 'Custom pyRevit tools for Revit automation',
  version: '1.0.0',
  panelName: 'Tools',
  tabName: 'MyTools',
  scripts: [],
};

const defaultScript: Omit<ScriptConfig, 'id'> = {
  name: 'sample_tool',
  title: 'Sample Tool',
  tooltip: 'A sample pyRevit tool',
  type: 'pushbutton',
  script: '',
  icon: '',
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

type Tab = 'config' | 'scripts' | 'preview' | 'structure';

export default function App() {
  const [config, setConfig] = useState<PluginConfig>(defaultPlugin);
  const [activeTab, setActiveTab] = useState<Tab>('config');
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const updateConfig = useCallback((updates: Partial<PluginConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const addScript = useCallback(() => {
    const newScript: ScriptConfig = {
      ...defaultScript,
      id: generateId(),
      name: `tool_${config.scripts.length + 1}`,
      title: `Tool ${config.scripts.length + 1}`,
    };
    updateConfig({ scripts: [...config.scripts, newScript] });
    setSelectedScript(newScript.id);
  }, [config.scripts, updateConfig]);

  const updateScript = useCallback((id: string, updates: Partial<ScriptConfig>) => {
    updateConfig({
      scripts: config.scripts.map(s => s.id === id ? { ...s, ...updates } : s),
    });
  }, [config.scripts, updateConfig]);

  const removeScript = useCallback((id: string) => {
    updateConfig({ scripts: config.scripts.filter(s => s.id !== id) });
    if (selectedScript === id) setSelectedScript(null);
  }, [config.scripts, selectedScript, updateConfig]);

  const generatedFiles = generateAllFiles(config);
  const folderStructure = generateFolderStructure(config);

  const downloadZip = async () => {
    const zip = new JSZip();
    for (const file of generatedFiles) {
      if (!file.path.endsWith('.png')) {
        zip.file(file.path, file.content);
      } else {
        // Add a placeholder for icon
        zip.file(file.path.replace('.png', '.txt'), 'Place your 32x32 PNG icon here');
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${config.bundleName}.extension.zip`);
  };

  const copyToClipboard = (content: string, filePath: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filePath);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">pyRevit Plugin Builder</h1>
              <p className="text-xs text-gray-400">Generate pyRevit extension bundles visually</p>
            </div>
          </div>
          <button
            onClick={downloadZip}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download ZIP
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-900/50 border-b border-gray-800 px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {[
            { id: 'config' as Tab, label: 'Plugin Config', icon: '⚙️' },
            { id: 'scripts' as Tab, label: 'Scripts', icon: '📝' },
            { id: 'structure' as Tab, label: 'Folder Structure', icon: '📁' },
            { id: 'preview' as Tab, label: 'Code Preview', icon: '👁️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'config' && (
            <ConfigPanel config={config} updateConfig={updateConfig} />
          )}
          {activeTab === 'scripts' && (
            <ScriptsPanel
              config={config}
              selectedScript={selectedScript}
              setSelectedScript={setSelectedScript}
              addScript={addScript}
              updateScript={updateScript}
              removeScript={removeScript}
            />
          )}
          {activeTab === 'structure' && (
            <StructurePanel structure={folderStructure} config={config} />
          )}
          {activeTab === 'preview' && (
            <PreviewPanel files={generatedFiles} copyToClipboard={copyToClipboard} copiedFile={copiedFile} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-500">
          <span>pyRevit Plugin Builder — Generate extension bundles for Autodesk Revit</span>
          <span>Compatible with pyRevit 4.x+</span>
        </div>
      </footer>
    </div>
  );
}

// Config Panel Component
function ConfigPanel({ config, updateConfig }: { config: PluginConfig; updateConfig: (u: Partial<PluginConfig>) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-blue-400">●</span> Extension Settings
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Extension Name</label>
            <input
              type="text"
              value={config.name}
              onChange={e => updateConfig({ name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="MyExtension"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Bundle Name (folder name)</label>
            <input
              type="text"
              value={config.bundleName}
              onChange={e => updateConfig({ bundleName: e.target.value.replace(/\s+/g, '') })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="MyExtension"
            />
            <p className="text-xs text-gray-500 mt-1">No spaces. Will become: <code className="text-blue-400">{config.bundleName}.extension</code></p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Author</label>
            <input
              type="text"
              value={config.author}
              onChange={e => updateConfig({ author: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Your Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Version</label>
            <input
              type="text"
              value={config.version}
              onChange={e => updateConfig({ version: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="1.0.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={config.description}
              onChange={e => updateConfig({ description: e.target.value })}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="What does this extension do?"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-purple-400">●</span> UI Structure
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tab Name</label>
            <input
              type="text"
              value={config.tabName}
              onChange={e => updateConfig({ tabName: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="MyTab"
            />
            <p className="text-xs text-gray-500 mt-1">Appears as a tab in the Revit ribbon</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Panel Name</label>
            <input
              type="text"
              value={config.panelName}
              onChange={e => updateConfig({ panelName: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="MyPanel"
            />
            <p className="text-xs text-gray-500 mt-1">Panel within the tab containing your tools</p>
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Ribbon Preview</h3>
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-2 font-mono">Revit Ribbon</div>
              <div className="flex items-center gap-2">
                <div className="bg-gray-600 px-3 py-1 rounded text-xs text-gray-300">Home</div>
                <div className="bg-gray-600 px-3 py-1 rounded text-xs text-gray-300">Insert</div>
                <div className="bg-blue-600 px-3 py-1 rounded text-xs text-white font-medium">{config.tabName}</div>
                <div className="bg-gray-600 px-3 py-1 rounded text-xs text-gray-300">Analyze</div>
              </div>
              <div className="mt-3 border-t border-gray-600 pt-3">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-600 rounded-lg p-2 border border-blue-500/30">
                    <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center text-xs">🔧</div>
                    <div className="text-[10px] text-gray-300 mt-1 text-center">{config.panelName}</div>
                  </div>
                  {config.scripts.slice(0, 3).map(s => (
                    <div key={s.id} className="text-center">
                      <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center text-xs">⚡</div>
                      <div className="text-[9px] text-gray-400 mt-1 max-w-[50px] truncate">{s.title}</div>
                    </div>
                  ))}
                  {config.scripts.length === 0 && (
                    <div className="text-xs text-gray-500 italic">Add scripts to see them here</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Scripts Panel Component
function ScriptsPanel({
  config,
  selectedScript,
  setSelectedScript,
  addScript,
  updateScript,
  removeScript,
}: {
  config: PluginConfig;
  selectedScript: string | null;
  setSelectedScript: (id: string | null) => void;
  addScript: () => void;
  updateScript: (id: string, updates: Partial<ScriptConfig>) => void;
  removeScript: (id: string) => void;
}) {
  const currentScript = config.scripts.find(s => s.id === selectedScript);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Script List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Scripts</h2>
          <button
            onClick={addScript}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {config.scripts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-sm">No scripts yet</p>
              <p className="text-xs mt-1">Click "Add" to create your first tool</p>
            </div>
          )}
          {config.scripts.map(script => (
            <button
              key={script.id}
              onClick={() => setSelectedScript(script.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedScript === script.id
                  ? 'bg-blue-600/10 border-blue-500/50 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{script.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{script.type} • {script.name}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeScript(script.id); }}
                  className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Script Editor */}
      <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6">
        {currentScript ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Edit Script: {currentScript.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Script Name (folder)</label>
                <input
                  type="text"
                  value={currentScript.name}
                  onChange={e => updateScript(currentScript.id, { name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Button Title</label>
                <input
                  type="text"
                  value={currentScript.title}
                  onChange={e => updateScript(currentScript.id, { title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Button Type</label>
                <select
                  value={currentScript.type}
                  onChange={e => updateScript(currentScript.id, { type: e.target.value as ScriptConfig['type'] })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="pushbutton">Push Button</option>
                  <option value="togglebutton">Toggle Button</option>
                  <option value="urlbutton">URL Button</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tooltip</label>
                <input
                  type="text"
                  value={currentScript.tooltip}
                  onChange={e => updateScript(currentScript.id, { tooltip: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              {currentScript.type === 'urlbutton' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">URL</label>
                  <input
                    type="text"
                    value={currentScript.script}
                    onChange={e => updateScript(currentScript.id, { script: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="https://example.com"
                  />
                </div>
              )}
            </div>

            {/* Code Preview */}
            {currentScript.type !== 'urlbutton' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Generated Python Script</label>
                <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-green-400 overflow-x-auto max-h-64 font-mono">
                  {generateScriptFile(currentScript)}
                </pre>
                <p className="text-xs text-gray-500 mt-2">💡 Edit this code after downloading. The template includes common pyRevit patterns.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-3">👈</div>
              <p>Select a script to edit or add a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Structure Panel Component
function StructurePanel({ structure, config }: { structure: string; config: PluginConfig }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">📁 Folder Structure</h2>
        <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto font-mono leading-relaxed">
          {structure}
        </pre>
        {config.scripts.length === 0 && (
          <p className="text-sm text-yellow-500/80 mt-3 flex items-center gap-2">
            <span>⚠️</span> Add scripts to see the complete structure
          </p>
        )}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">📋 Installation Guide</h2>
        <div className="space-y-4 text-sm text-gray-300">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <div>
              <p className="font-medium text-white">Download the ZIP file</p>
              <p className="text-gray-400 text-xs mt-1">Click the "Download ZIP" button in the header</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <div>
              <p className="font-medium text-white">Extract to pyRevit extensions folder</p>
              <p className="text-gray-400 text-xs mt-1">Usually: <code className="bg-gray-800 px-1 rounded">%appdata%/pyRevit/Extensions/</code></p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <div>
              <p className="font-medium text-white">Add icon files</p>
              <p className="text-gray-400 text-xs mt-1">Place 32×32 PNG icons in each button folder</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <div>
              <p className="font-medium text-white">Reload pyRevit</p>
              <p className="text-gray-400 text-xs mt-1">Click "Reload" in pyRevit or restart Revit</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
            <div>
              <p className="font-medium text-white">Your tools appear in the Revit ribbon!</p>
              <p className="text-gray-400 text-xs mt-1">Under the "{config.tabName}" tab → "{config.panelName}" panel</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Extension Path</h3>
          <code className="text-xs text-blue-400 break-all">
            %appdata%\pyRevit\Extensions\{config.bundleName}.extension\
          </code>
        </div>
      </div>
    </div>
  );
}

// Preview Panel Component
function PreviewPanel({
  files,
  copyToClipboard,
  copiedFile,
}: {
  files: GeneratedFile[];
  copyToClipboard: (content: string, path: string) => void;
  copiedFile: string | null;
}) {
  const [activeFile, setActiveFile] = useState(0);

  if (files.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center text-gray-500">
        <div className="text-4xl mb-3">📄</div>
        <p>Configure your plugin and add scripts to see generated code</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex border-b border-gray-800 overflow-x-auto">
        {files.map((file, i) => (
          <button
            key={file.path}
            onClick={() => setActiveFile(i)}
            className={`px-4 py-2.5 text-xs font-mono whitespace-nowrap border-b-2 transition-colors ${
              activeFile === i
                ? 'border-blue-500 text-blue-400 bg-gray-800/50'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {file.path.split('/').pop()}
          </button>
        ))}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 font-mono">{files[activeFile].path}</span>
          <button
            onClick={() => copyToClipboard(files[activeFile].content, files[activeFile].path)}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded transition-colors"
          >
            {copiedFile === files[activeFile].path ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
        <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm overflow-x-auto max-h-[500px] font-mono">
          <code className={files[activeFile].language === 'python' ? 'text-green-400' : 'text-yellow-300'}>
            {files[activeFile].content}
          </code>
        </pre>
      </div>
    </div>
  );
}
