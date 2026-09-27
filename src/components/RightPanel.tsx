import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Code, Globe, Layers, ChevronRight } from 'lucide-react';
import { useStore } from '../lib/store';

type Tab = 'context' | 'code' | 'preview' | 'files';

export function RightPanel() {
  const { rightPanelOpen, setRightPanelOpen, activeConversationId, conversations } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('context');

  if (!rightPanelOpen) return null;

  const conv = conversations.find(c => c.id === activeConversationId);
  const tabs: { id: Tab; icon: typeof FileText; label: string }[] = [
    { id: 'context', icon: Layers, label: 'Context' },
    { id: 'code', icon: Code, label: 'Code' },
    { id: 'preview', icon: Globe, label: 'Preview' },
    { id: 'files', icon: FileText, label: 'Files' },
  ];

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 380, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full border-l border-border-default bg-surface-1 flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between p-3 border-b border-border-default">
        <div className="flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent-muted text-accent'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2'
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <button onClick={() => setRightPanelOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-tertiary">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'context' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Conversation Info</h4>
              {conv ? (
                <div className="space-y-3">
                  <InfoRow label="Title" value={conv.title} />
                  <InfoRow label="Model" value={conv.model} />
                  <InfoRow label="Provider" value={conv.provider} />
                  <InfoRow label="Messages" value={String(conv.messages.length)} />
                  <InfoRow label="Created" value={new Date(conv.createdAt).toLocaleDateString()} />
                </div>
              ) : (
                <p className="text-sm text-text-tertiary">No active conversation</p>
              )}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">System</h4>
              <div className="space-y-3">
                <InfoRow label="Platform" value="OpenRAI v1.0" />
                <InfoRow label="Status" value="Connected" />
                <InfoRow label="Latency" value="~42ms" />
              </div>
            </div>
          </div>
        )}
        {activeTab === 'code' && (
          <div>
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Code Artifacts</h4>
            <div className="rounded-xl bg-surface-2 border border-border-subtle p-8 text-center">
              <Code size={24} className="mx-auto mb-2 text-text-tertiary" />
              <p className="text-sm text-text-tertiary">Code artifacts from conversations will appear here</p>
            </div>
          </div>
        )}
        {activeTab === 'preview' && (
          <div>
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Live Preview</h4>
            <div className="rounded-xl bg-surface-2 border border-border-subtle aspect-video flex items-center justify-center">
              <div className="text-center">
                <Globe size={24} className="mx-auto mb-2 text-text-tertiary" />
                <p className="text-sm text-text-tertiary">Website previews will render here</p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'files' && (
          <div>
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Attached Files</h4>
            <div className="rounded-xl bg-surface-2 border border-border-subtle p-8 text-center">
              <FileText size={24} className="mx-auto mb-2 text-text-tertiary" />
              <p className="text-sm text-text-tertiary">Drag & drop files to attach them</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-2">
      <span className="text-xs text-text-tertiary">{label}</span>
      <span className="text-xs font-medium text-text-primary">{value}</span>
    </div>
  );
}
