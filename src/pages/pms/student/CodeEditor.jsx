import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Code2, Play, RotateCcw, Copy, Download, Terminal, FileCode, Loader2,
  ExternalLink, Info, AlertTriangle, CheckCircle2, XCircle, Cpu, Server,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI } from '../../../api/pms';
import { handleError } from '../../../api/pms/client';
import { Card, Spinner } from '../../../components/pms/Common';
import { cn } from '../../../utils/pms/helpers';

// Language configurations with simple, guaranteed-to-work starter code
const LANGUAGES = [
  {
    id: 'python', label: 'Python 3', monaco: 'python', ext: 'py',
    starter: `# Python 3
print("Hello from Python!")
print(2 + 3)
`,
  },
  {
    id: 'javascript', label: 'JavaScript (Node.js)', monaco: 'javascript', ext: 'js',
    starter: `// JavaScript / Node.js
console.log("Hello from Node.js!");
console.log(2 + 3);
`,
  },
  {
    id: 'java', label: 'Java', monaco: 'java', ext: 'java',
    starter: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
        System.out.println(2 + 3);
    }
}
`,
  },
  {
    id: 'c', label: 'C', monaco: 'c', ext: 'c',
    starter: `#include <stdio.h>
int main() {
    printf("Hello from C!\\n");
    printf("%d\\n", 2 + 3);
    return 0;
}
`,
  },
  {
    id: 'cpp', label: 'C++', monaco: 'cpp', ext: 'cpp',
    starter: `#include <iostream>
using namespace std;
int main() {
    cout << "Hello from C++!" << endl;
    cout << (2 + 3) << endl;
    return 0;
}
`,
  },
  {
    id: 'html', label: 'HTML', monaco: 'html', ext: 'html',
    starter: `<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
    <style>
        body { font-family: system-ui; padding: 2rem; }
        h1 { color: #4f46e5; }
    </style>
</head>
<body>
    <h1>Hello, HTML!</h1>
    <p>Edit the code on the left to see live preview.</p>
    <button onclick="alert('Hi!')">Click me</button>
</body>
</html>
`,
  },
];

// =========== OUTPUT PANEL ===========
const OutputPanel = ({ running, output, language }) => {
  // HTML mode → preview only
  if (language === 'html' && output?.html) {
    return null; // shown in iframe elsewhere
  }

  return (
    <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5" /> Output
        </span>
        {output?.run?.code !== undefined && (
          <span className={cn(
            'text-[10px] font-mono px-2 py-0.5 rounded',
            output.run.code === 0 ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'
          )}>
            exit {output.run.code}
          </span>
        )}
      </div>

      <div className="p-4 font-mono text-sm overflow-auto" style={{ minHeight: '320px', maxHeight: '500px' }}>
        {/* RUNNING STATE */}
        {running && (
          <div className="flex items-center gap-2 text-amber-300">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Compiling and running… (this may take up to 30s)</span>
          </div>
        )}

        {/* IDLE STATE (no output yet) */}
        {!running && !output && (
          <div className="text-slate-500 italic text-center py-12">
            <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Click "Run Code" to see output here.
          </div>
        )}

        {/* ERROR STATE (network / server failure) */}
        {!running && output?.error && (
          <div>
            <div className="text-red-400 font-semibold mb-2 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" /> Execution Failed
            </div>
            <pre className="text-red-300 whitespace-pre-wrap text-xs leading-relaxed bg-red-950/30 p-3 rounded border border-red-900/40">
              {output.error}
            </pre>
            <div className="mt-3 text-xs text-slate-500 border-t border-slate-800 pt-3">
              💡 <strong>Common causes:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                <li>Server doesn't have <code className="text-amber-300">python3 / node / gcc / g++ / javac</code> installed</li>
                <li>Piston public API (fallback) is unreachable or rate-limited</li>
                <li>Network/firewall blocks outbound HTTPS to <code className="text-amber-300">emkc.org</code></li>
              </ul>
              <div className="mt-2">Click <strong>"Server Status"</strong> button above to check what's available.</div>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {!running && output && !output.error && !output.html && (
          <div className="space-y-3">
            {/* Compile section (shown only when present and has content) */}
            {output.compile && (output.compile.stdout || output.compile.stderr) && (
              <div>
                <div className="text-xs uppercase tracking-wider text-amber-400 mb-1.5 font-semibold flex items-center gap-1">
                  <FileCode className="w-3 h-3" /> Compile
                  {output.compile.code === 0
                    ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    : <span className="text-red-400 text-[10px]">(failed, exit {output.compile.code})</span>}
                </div>
                {output.compile.stderr && (
                  <pre className="text-red-300 text-xs whitespace-pre-wrap leading-relaxed">{output.compile.stderr}</pre>
                )}
                {output.compile.stdout && (
                  <pre className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">{output.compile.stdout}</pre>
                )}
              </div>
            )}

            {/* Run section */}
            {output.run && (
              <div>
                <div className="text-xs uppercase tracking-wider text-emerald-400 mb-1.5 font-semibold">
                  Program Output
                </div>
                {output.run.stdout ? (
                  <pre className="text-emerald-200 whitespace-pre-wrap leading-relaxed">{output.run.stdout}</pre>
                ) : output.run.stderr ? null : (
                  <div className="text-slate-500 italic">(no stdout)</div>
                )}
                {output.run.stderr && (
                  <div className="mt-2">
                    <div className="text-[10px] uppercase tracking-wider text-red-400 mb-1">stderr</div>
                    <pre className="text-red-300 whitespace-pre-wrap leading-relaxed">{output.run.stderr}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Compile failed → no run section */}
            {output.compile && output.compile.code !== 0 && !output.run && (
              <div className="text-amber-400 text-xs italic">
                Program was not executed because compilation failed.
              </div>
            )}

            {/* Edge case: no compile, no run */}
            {!output.compile && !output.run && (
              <div className="text-slate-500 italic">
                Code ran but no output was captured. Make sure your code prints to stdout (e.g. <code className="text-amber-300">print()</code>, <code className="text-amber-300">console.log()</code>, <code className="text-amber-300">printf()</code>).
              </div>
            )}

            {/* Runtime info at bottom */}
            {(output.language || output.version) && (
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center gap-2">
                <Cpu className="w-3 h-3" />
                {output.language} {output.version && `· ${output.version}`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// =========== DIAGNOSTICS PANEL ===========
const DiagnosticsPanel = ({ open, onClose }) => {
  const [diag, setDiag] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !diag) {
      setLoading(true);
      studentAPI.getCodeDiagnostics()
        .then((res) => setDiag(res.data.diagnostics))
        .catch((err) => toast.error(handleError(err)))
        .finally(() => setLoading(false));
    }
  }, [open, diag]);

  if (!open) return null;

  return (
    <Card title={<span className="flex items-center gap-2"><Server className="w-4 h-4 text-brand-600" /> Server Status</span>} action={
      <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-700">Hide ×</button>
    }>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Checking server…</div>
      ) : !diag ? (
        <div className="text-sm text-slate-500">Could not load diagnostics.</div>
      ) : (
        <div className="space-y-3 text-sm">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Execution Mode</div>
            <div className="font-semibold">
              {diag.preferLocal
                ? <><span className="badge-success">Local-first</span> Code runs on the backend server itself.</>
                : <><span className="badge-info">Piston-first</span> Code runs via public Piston API.</>}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Local Compilers / Interpreters</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(diag.localBinaries || {}).map(([name, available]) => (
                <div key={name} className={cn(
                  'p-2 rounded border flex items-center gap-2 text-xs',
                  available ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                )}>
                  {available
                    ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span className="font-mono">{name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Missing tools? Install on the server:
              <code className="bg-slate-100 px-1.5 py-0.5 rounded ml-1 text-xs">apt install python3 nodejs gcc g++ default-jdk</code>
            </p>
          </div>

          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Piston Fallback</div>
            <div className="font-mono text-xs bg-slate-50 p-2 rounded">{diag.pistonUrl}</div>
          </div>
        </div>
      )}
    </Card>
  );
};

// =========== MAIN ===========
const CodeEditor = () => {
  const [language, setLanguage] = useState('python');
  const [source, setSource] = useState(LANGUAGES.find((l) => l.id === 'python').starter);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [theme, setTheme] = useState('vs-dark');
  const [showDiag, setShowDiag] = useState(false);
  const [showStdin, setShowStdin] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.id === language);

  const changeLanguage = (newLangId) => {
    const newLang = LANGUAGES.find((l) => l.id === newLangId);
    const oldStarter = currentLang.starter;
    if (source !== oldStarter && source.trim()) {
      if (!window.confirm('Switching language will replace your code with a new starter template. Continue?')) return;
    }
    setLanguage(newLangId);
    setSource(newLang.starter);
    setOutput(null);
  };

  const resetCode = () => {
    if (!window.confirm('Reset to starter template?')) return;
    setSource(currentLang.starter);
    setOutput(null);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(source);
      toast.success('Code copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  const downloadCode = () => {
    const blob = new Blob([source], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${currentLang.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runCode = async () => {
    if (!source.trim()) {
      toast.error('Empty code');
      return;
    }
    setRunning(true);
    setOutput(null);

    try {
      // HTML — render in iframe, no backend
      if (language === 'html') {
        setOutput({ html: true });
        toast.success('Rendered');
        return;
      }

      console.log('[CodeEditor] Sending:', { language, sourceLength: source.length, hasStdin: !!stdin });
      const res = await studentAPI.runCode({ language, source, stdin });
      console.log('[CodeEditor] Got response:', res.data);

      const data = res.data;

      // Backend failed (network / Piston error) → success: false
      if (!data.success) {
        const msg = data.message || 'Code execution failed (no message from server)';
        setOutput({ error: msg });
        toast.error('Execution failed - see output panel');
        return;
      }

      if (!data.result) {
        setOutput({ error: 'Server returned success but no result object. This is a backend bug.' });
        toast.error('Empty result');
        return;
      }

      setOutput(data.result);

      // Toast based on exit code
      const exitCode = data.result.run?.code;
      const compileFailed = data.result.compile && data.result.compile.code !== 0;
      if (compileFailed) {
        toast.error('Compilation error - see output');
      } else if (exitCode === 0) {
        toast.success('Executed successfully');
      } else if (exitCode !== undefined) {
        toast(`Exited with code ${exitCode}`, { icon: '⚠️' });
      }
    } catch (err) {
      console.error('[CodeEditor] Network/axios error:', err);
      const msg = err.code === 'ECONNABORTED'
        ? 'Request timed out after 60 seconds. The server or Piston API may be slow.'
        : handleError(err);
      setOutput({ error: `Network error: ${msg}\n\nCheck:\n- Backend server is running on port 5000\n- Network connection is OK\n- Browser console (F12) for more details` });
      toast.error('Network error - see output panel');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Code Editor</h1>
          <p className="text-sm text-slate-500 mt-1">
            Run code in 6 languages. Output appears below.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowDiag(!showDiag)} className="btn-outline btn-sm">
            <Server className="w-3 h-3" /> Server Status
          </button>
        </div>
      </div>

      {/* Diagnostics panel */}
      <DiagnosticsPanel open={showDiag} onClose={() => setShowDiag(false)} />

      {/* Toolbar */}
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <label className="text-xs font-semibold text-slate-500 uppercase">Language:</label>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="form-select py-1.5 text-sm flex-1 max-w-[220px]"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Theme:</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)} className="form-select py-1.5 text-sm">
              <option value="vs-dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div className="flex gap-1 ml-auto">
            <button onClick={resetCode} className="btn-secondary btn-sm" title="Reset to starter">
              <RotateCcw className="w-3 h-3" />
            </button>
            <button onClick={copyCode} className="btn-secondary btn-sm" title="Copy to clipboard">
              <Copy className="w-3 h-3" />
            </button>
            <button onClick={downloadCode} className="btn-secondary btn-sm" title="Download file">
              <Download className="w-3 h-3" />
            </button>
            <button
              onClick={runCode}
              disabled={running}
              className="btn-success"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run Code
            </button>
          </div>
        </div>
      </Card>

      {/* Editor */}
      <Card title={<span className="flex items-center gap-2"><Code2 className="w-4 h-4 text-brand-600" /> Source Code</span>} noPadding>
        <div className="bg-slate-900 rounded-b-xl overflow-hidden">
          <Editor
            height="400px"
            language={currentLang.monaco}
            value={source}
            onChange={(v) => setSource(v || '')}
            theme={theme}
            options={{
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Consolas, monospace',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              tabSize: 2,
              automaticLayout: true,
              wordWrap: 'on',
              lineNumbers: 'on',
              folding: true,
              renderLineHighlight: 'all',
            }}
          />
        </div>
      </Card>

      {/* Stdin (collapsible) */}
      {language !== 'html' && (
        <Card noPadding>
          <button
            type="button"
            onClick={() => setShowStdin(!showStdin)}
            className="w-full text-left px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <span className="text-sm font-semibold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand-600" />
              Input (stdin) {stdin && <span className="badge-info text-[10px]">has data</span>}
            </span>
            {showStdin ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {showStdin && (
            <div className="px-5 pb-4">
              <textarea
                className="form-input font-mono text-sm"
                rows="3"
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Optional input lines for input(), scanf(), Scanner, etc. — one value per line"
              />
            </div>
          )}
        </Card>
      )}

      {/* HTML preview (only for HTML) */}
      {language === 'html' && output?.html && (
        <Card title={<span className="flex items-center gap-2"><ExternalLink className="w-4 h-4 text-brand-600" /> Live Preview</span>} noPadding>
          <iframe
            title="HTML Preview"
            srcDoc={source}
            className="w-full bg-white rounded-b-xl"
            style={{ height: '500px', border: 'none' }}
            sandbox="allow-scripts allow-forms"
          />
        </Card>
      )}

      {/* OUTPUT PANEL - always visible for non-HTML, prominent */}
      {language !== 'html' && (
        <OutputPanel running={running} output={output} language={language} />
      )}

      {/* HTML mode help */}
      {language === 'html' && !output?.html && (
        <Card>
          <div className="text-slate-400 text-sm italic text-center py-8">
            <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Click "Run Code" to render the HTML preview here.
          </div>
        </Card>
      )}
    </div>
  );
};

export default CodeEditor;
