import { motion } from 'framer-motion';
import {
  FileSearch, ImagePlus, Code2, Globe, Database, Terminal,
  Languages, PenTool, BarChart3, Shield, Cpu, Workflow, Menu
} from 'lucide-react';
import { useStore } from '../lib/store';
import { useMediaQuery } from '../lib/hooks';

const TOOLS = [
  { icon: FileSearch, name: 'Document Analysis', description: 'Extract insights from PDFs, docs, and spreadsheets', status: 'available' as const, color: '#3b9eff' },
  { icon: ImagePlus, name: 'Image Generation', description: 'Create images with AI models', status: 'available' as const, color: '#7828c8' },
  { icon: Code2, name: 'Code Interpreter', description: 'Execute code in a secure sandbox', status: 'available' as const, color: '#17c964' },
  { icon: Globe, name: 'Web Browsing', description: 'Search and browse the web for real-time info', status: 'available' as const, color: '#f5a623' },
  { icon: Database, name: 'Data Connector', description: 'Connect to databases, APIs, and data sources', status: 'beta' as const, color: '#06b6d4' },
  { icon: Terminal, name: 'Shell Access', description: 'Run terminal commands in secure environment', status: 'available' as const, color: '#ec4899' },
  { icon: Languages, name: 'Translation', description: 'Translate between 100+ languages', status: 'available' as const, color: '#84cc16' },
  { icon: PenTool, name: 'Content Writer', description: 'Long-form content, blog posts, documentation', status: 'available' as const, color: '#f59e0b' },
  { icon: BarChart3, name: 'Data Visualization', description: 'Create charts, graphs, and dashboards', status: 'beta' as const, color: '#8b5cf6' },
  { icon: Shield, name: 'Security Scanner', description: 'Analyze code for vulnerabilities', status: 'coming' as const, color: '#ef4444' },
  { icon: Cpu, name: 'Fine-tuning', description: 'Train custom models on your data', status: 'coming' as const, color: '#14b8a6' },
  { icon: Workflow, name: 'Workflows', description: 'Automate multi-step AI pipelines', status: 'coming' as const, color: '#f97316' },
];

const STATUS_STYLES = {
  available: 'bg-success/10 text-success',
  beta: 'bg-warning/10 text-warning',
  coming: 'bg-surface-3 text-text-tertiary',
};

export function ToolsView() {
  const { toggleSidebar, sidebarOpen } = useStore();
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-0">
      <header className="flex items-center gap-2 px-3 md:px-4 py-3 border-b border-border-default bg-surface-1/80 backdrop-blur-md">
        {(!sidebarOpen || isMobile) && (
          <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-surface-2 text-text-secondary touch-target">
            <Menu size={20} />
          </button>
        )}
        <Workflow size={18} className="text-accent" />
        <h1 className="font-semibold text-sm">AI Tools & Agents</h1>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain p-3 md:p-4">
        <div className="mb-4 px-3 py-2.5 rounded-xl bg-surface-1 border border-border-subtle">
          <p className="text-xs text-text-tertiary">Tools integrate with your connected AI providers. Connect a provider in Settings to enable tool functionality.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`group p-4 rounded-xl bg-surface-1 border border-border-subtle hover:border-border-default active:scale-[0.98] transition-all cursor-pointer ${
                  tool.status === 'coming' ? 'opacity-60' : 'hover:bg-surface-2'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 md:w-10 md:h-10 rounded-xl flex items-center justify-center" style={{ background: tool.color + '18', color: tool.color }}>
                    <Icon size={isMobile ? 22 : 20} />
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[tool.status]}`}>
                    {tool.status === 'available' ? 'Ready' : tool.status === 'beta' ? 'Beta' : 'Planned'}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{tool.name}</h3>
                <p className="text-xs text-text-tertiary line-clamp-2">{tool.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
