
import React, { useState, useCallback } from 'react';
import {
  Terminal,
  ShieldCheck,
  Cpu,
  Globe,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Download,
  Command,
  RotateCcw,
  FlaskConical,
  FileCode,
  Box,
  Github,
  Ship,
  Archive,
  ChevronDown,
  Layers,
  Zap,
  Activity,
  Clock,
  TrendingUp,
  Bug
} from 'lucide-react';
import {
  Language,
  Environment,
  SafetyLevel,
  ScriptType,
  ScriptRequest,
  ScriptResponse
} from './types';
import { generateScript } from './groqService';
import JSZip from 'jszip';

const LANGUAGES: Language[] = ['Python', 'Bash', 'PowerShell', 'JavaScript', 'TypeScript', 'Go', 'Ruby', 'Auto'];
const ENVIRONMENTS: Environment[] = ['Linux', 'Windows', 'macOS', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Generic'];
const SAFETY_LEVELS: SafetyLevel[] = ['Dry Run Only', 'Normal (Recommended)', 'Production (Strict)'];
const SCRIPT_TYPES: ScriptType[] = ['Automation', 'Workflow', 'Integration', 'Business Logic', 'DevOps', 'Data Processing'];

type TabType = 'script' | 'tests' | 'dockerfile' | 'cicd' | 'failures';

const App: React.FC = () => {
  const [request, setRequest] = useState<ScriptRequest>({
    description: '',
    language: 'Python',
    environment: 'Linux',
    safetyLevel: 'Normal (Recommended)',
    scriptType: 'Automation',
    includeTests: true,
  });

  const [response, setResponse] = useState<ScriptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('script');
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!request.description.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setActiveTab('script');

    try {
      const result = await generateScript(request);
      if (!result.script) {
        throw new Error("Script generation failed to produce a valid code block.");
      }
      setResponse(result);
    } catch (err: any) {
      setError(err.message || 'An engineering fault occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = useCallback(() => {
    const textToCopy = response?.[activeTab as keyof ScriptResponse] as string;
    if (textToCopy && typeof textToCopy === 'string') {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [response, activeTab]);

  const getExtension = (lang: Language) => {
    switch (lang) {
      case 'Python': return 'py';
      case 'Bash': return 'sh';
      case 'PowerShell': return 'ps1';
      case 'JavaScript': return 'js';
      case 'TypeScript': return 'ts';
      case 'Go': return 'go';
      case 'Ruby': return 'rb';
      default: return 'txt';
    }
  };

  const downloadFile = useCallback((type: TabType) => {
    const content = response?.[type as keyof ScriptResponse] as string;
    if (!content || typeof content !== 'string') return;

    let filename = '';
    let mimeType = 'text/plain';

    switch (type) {
      case 'script': filename = `script.${getExtension(request.language)}`; break;
      case 'tests': filename = `test_script.${getExtension(request.language)}`; break;
      case 'dockerfile': filename = `Dockerfile`; break;
      case 'cicd': filename = `github-workflow.yml`; break;
      default: return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [response, request.language]);

  const exportAsZip = async () => {
    if (!response) return;
    const zip = new JSZip();
    const ext = getExtension(request.language);

    zip.file(`script.${ext}`, response.script);
    if (response.tests) zip.file(`tests.${ext}`, response.tests);
    if (response.dockerfile) zip.file(`Dockerfile`, response.dockerfile);
    if (response.cicd) zip.file(`.github/workflows/main.yml`, response.cicd);

    const failuresText = response.failureSimulations.map(f => `### ${f.scenario}\n**Trigger:** ${f.trigger}\n**Behavior:** ${f.behavior}`).join('\n\n');
    zip.file(`README.md`, `# ${request.scriptType} Script\n\n## Value Summary\n- Engineering Time Saved: ${response.metrics.timeSavedMinutes} mins\n- Optimized Production Code: ${response.metrics.linesProduced} Lines\n- Explicit Error Handlers: ${response.metrics.potentialErrorsMitigated}\n\n## Summary\n${response.summary}\n\n## Failure Mode Simulations\n${failuresText}\n\n## Usage\n\`\`\`bash\n${response.usage}\n\`\`\``);

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engineering-package.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  const exportToGist = () => {
    if (!response) return;
    const ext = getExtension(request.language);
    const files: any = {
      [`script.${ext}`]: { content: response.script },
      [`README.md`]: { content: response.summary + '\n\nUsage: ' + response.usage }
    };
    if (response.tests) files[`tests.${ext}`] = { content: response.tests };
    if (response.dockerfile) files[`Dockerfile`] = { content: response.dockerfile };

    const gistData = {
      description: `Engineered Script: ${request.description.substring(0, 50)}...`,
      public: false,
      files
    };

    const blob = new Blob([JSON.stringify(gistData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gist-payload.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      {/* Header */}
      <header className="w-full max-w-5xl mb-12 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-700 pb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Command className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Script Engineer Pro</h1>
            <p className="text-slate-400 text-sm">Automated CI/CD Ready Module Generation</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs font-medium uppercase tracking-widest text-slate-500">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            Failure Sim
          </div>
          <div className="flex items-center gap-1.5">
            <Ship className="w-4 h-4 text-cyan-400" />
            Docker Ready
          </div>
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Panel: Configuration */}
        <section className="lg:col-span-4 space-y-6">
          <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-3xl border border-slate-700 p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Engineering Specification</label>
              <textarea
                value={request.description}
                onChange={(e) => setRequest({ ...request, description: e.target.value })}
                placeholder="Describe your intent..."
                className="w-full h-44 bg-slate-900 border border-slate-700 rounded-2xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none placeholder:text-slate-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> Language
                </label>
                <select
                  value={request.language}
                  onChange={(e) => setRequest({ ...request, language: e.target.value as Language })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Env
                </label>
                <select
                  value={request.environment}
                  onChange={(e) => setRequest({ ...request, environment: e.target.value as Environment })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {ENVIRONMENTS.map(env => <option key={env} value={env}>{env}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 cursor-pointer">
                  <FlaskConical className="w-4 h-4 text-indigo-400" />
                  Unit Test Module
                </label>
                <input
                  type="checkbox"
                  checked={request.includeTests}
                  onChange={(e) => setRequest({ ...request, includeTests: e.target.checked })}
                  className="w-5 h-5 rounded-lg border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !request.description.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
              {isLoading ? 'Engineering Module...' : 'Generate Solution'}
            </button>
          </form>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-4 flex flex-col gap-3 text-red-400">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
              <button onClick={() => handleSubmit()} className="text-xs flex items-center gap-1.5 underline underline-offset-4">
                <RotateCcw className="w-3 h-3" /> Retry Generation
              </button>
            </div>
          )}
        </section>

        {/* Right Panel: Output */}
        <section className="lg:col-span-8 space-y-6">
          {!response && !isLoading && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-[32px] p-12 text-center text-slate-500">
              <Box className="w-16 h-16 mb-4 opacity-10" />
              <h3 className="text-xl font-semibold mb-2 text-slate-400">Project Workspace</h3>
              <p className="max-w-xs text-sm">Initiate an engineering request to generate a complete deployment package.</p>
            </div>
          )}

          {isLoading && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-800/10 border border-slate-700 rounded-[32px] p-12 text-center animate-pulse">
              <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
              <h3 className="text-xl font-semibold mb-2 text-indigo-400">Architecting Module</h3>
              <p className="text-slate-400 text-sm max-w-sm">Generating script, tests, Docker container config, and failure simulations.</p>
            </div>
          )}

          {response && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Value Metrics Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  icon={<Clock className="w-5 h-5 text-indigo-400" />}
                  label="Manual Effort Avoided"
                  value={`${response.metrics.timeSavedMinutes} Minutes`}
                  sub="Senior engineering time saved"
                />
                <MetricCard
                  icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
                  label="Optimized Code"
                  value={`${response.metrics.linesProduced} Lines`}
                  sub="Production-ready module volume"
                />
                <MetricCard
                  icon={<Bug className="w-5 h-5 text-rose-400" />}
                  label="Explicit Handlers"
                  value={`${response.metrics.potentialErrorsMitigated} Safety Blocks`}
                  sub="Explicit error checks implemented"
                />
              </div>

              {/* Header Info */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 bg-slate-800/40 border border-slate-700 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-2 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                    <Layers className="w-4 h-4" /> Solution Blueprint
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{response.summary}</p>
                </div>
              </div>

              {/* Advanced Code Explorer */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-600 rounded-3xl blur opacity-10 group-hover:opacity-25 transition duration-1000"></div>
                <div className="relative bg-slate-900 border border-slate-700 rounded-[32px] overflow-hidden shadow-2xl">
                  {/* Tab Navigation */}
                  <div className="bg-slate-800/60 px-6 pt-4 flex flex-wrap items-center justify-between border-b border-slate-700 gap-4">
                    <div className="flex gap-2">
                      <TabButton active={activeTab === 'script'} onClick={() => setActiveTab('script')} icon={<FileCode className="w-3 h-3" />} label="Script" />
                      {response.tests && <TabButton active={activeTab === 'tests'} onClick={() => setActiveTab('tests')} icon={<FlaskConical className="w-3 h-3" />} label="Tests" />}
                      <TabButton active={activeTab === 'failures'} onClick={() => setActiveTab('failures')} icon={<Zap className="w-3 h-3" />} label="Failure Sim" />
                      {response.dockerfile && <TabButton active={activeTab === 'dockerfile'} onClick={() => setActiveTab('dockerfile')} icon={<Ship className="w-3 h-3" />} label="Dockerfile" />}
                      {response.cicd && <TabButton active={activeTab === 'cicd'} onClick={() => setActiveTab('cicd')} icon={<Github className="w-3 h-3" />} label="CI/CD" />}
                    </div>

                    <div className="flex gap-3 pb-4">
                      {activeTab !== 'failures' && (
                        <button onClick={copyToClipboard} className="p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-xl border border-slate-700 transition-all">
                          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}

                      <div className="relative">
                        <button
                          onClick={() => setIsExportOpen(!isExportOpen)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                        >
                          <Archive className="w-4 h-4" /> Export Module <ChevronDown className={`w-3 h-3 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isExportOpen && (
                          <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <ExportItem icon={<Archive className="w-4 h-4 text-amber-400" />} label="ZIP Package" sub="Complete source bundle" onClick={exportAsZip} />
                            {activeTab !== 'failures' && (
                              <ExportItem icon={<Download className="w-4 h-4 text-indigo-400" />} label="Download Tab" sub="Single file export" onClick={() => { downloadFile(activeTab); setIsExportOpen(false); }} />
                            )}
                            <ExportItem icon={<Github className="w-4 h-4 text-white" />} label="Gist Payload" sub="Export as JSON structure" onClick={exportToGist} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-8 overflow-x-auto max-h-[600px] custom-scrollbar bg-slate-950/30">
                    {activeTab === 'failures' ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Activity className="w-5 h-5 text-indigo-400" />
                          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Failure Mode Analysis</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {response.failureSimulations.map((f, i) => (
                            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 hover:border-slate-500 transition-colors">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-bold text-white">{f.scenario}</span>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4 mt-3">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase">Trigger Event</p>
                                  <p className="text-xs text-slate-400 leading-relaxed">{f.trigger}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-indigo-500 uppercase">Script Behavior</p>
                                  <p className="text-xs text-indigo-200 leading-relaxed">{f.behavior}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <pre className="font-mono text-sm text-slate-300 leading-relaxed whitespace-pre">
                        <code>{response[activeTab as keyof ScriptResponse] as string}</code>
                      </pre>
                    )}
                  </div>
                </div>
              </div>

              {/* Execution UI */}
              <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                  <Play className="w-5 h-5 text-emerald-400 fill-current" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Production Execution Command</p>
                  <code className="text-sm font-mono text-emerald-300 truncate block bg-black/40 p-2 rounded-lg border border-slate-700/50 select-all">
                    {response.usage}
                  </code>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="mt-16 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] pb-12 text-center">
        Script Engineer Pro // FAILURE-MODE VERIFIED // ROI-QUANTIFIED
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

const MetricCard = ({ icon, label, value, sub }: { icon: any, label: string, value: string, sub: string }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 flex flex-col gap-1 hover:border-indigo-500/30 transition-all group">
    <div className="flex items-center gap-2 mb-2">
      <div className="p-2 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
    <p className="text-[10px] text-slate-500">{sub}</p>
  </div>
);

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-widest rounded-t-2xl transition-all whitespace-nowrap ${active
        ? 'bg-slate-900 text-indigo-400 border-t border-x border-slate-700'
        : 'text-slate-500 hover:text-slate-300'
      }`}
  >
    {icon} {label}
  </button>
);

const ExportItem = ({ icon, label, sub, onClick }: { icon: any, label: string, sub: string, onClick: () => void }) => (
  <button onClick={onClick} className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-700/50 transition-colors text-left border-b border-slate-700/50 last:border-0">
    <div className="p-2 bg-slate-900 rounded-lg">{icon}</div>
    <div>
      <p className="text-xs font-bold text-white">{label}</p>
      <p className="text-[10px] text-slate-500">{sub}</p>
    </div>
  </button>
);

export default App;
