import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Plus, Trash2, X, Menu } from 'lucide-react';
import { useStore } from '../lib/store';
import { useMediaQuery } from '../lib/hooks';

export function AssistantsView() {
  const {
    assistants, activeAssistantId, setActiveAssistant,
    createAssistant, deleteAssistant, toggleSidebar, sidebarOpen,
    connectedProviders
  } = useStore();
  const [showCreate, setShowCreate] = useState(false);

  const activeProviders = connectedProviders.filter(p => p.status === 'connected');
  const firstProvider = activeProviders[0];
  const firstModel = firstProvider?.models[0];

  const [form, setForm] = useState({
    name: '', description: '', systemPrompt: '',
    model: firstModel?.id || '', provider: firstProvider?.id || '',
    icon: '✦', color: '#3b9eff'
  });
  const isMobile = useMediaQuery('(max-width: 768px)');

  const colors = ['#3b9eff', '#17c964', '#f5a623', '#f31260', '#7828c8', '#06b6d4', '#ec4899', '#84cc16'];
  const icons = ['✦', '◈', '◉', '◆', '✎', '⟨/⟩', '⬡', '◎'];

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createAssistant(form);
    setForm({
      name: '', description: '', systemPrompt: '',
      model: firstModel?.id || '', provider: firstProvider?.id || '',
      icon: '✦', color: '#3b9eff'
    });
    setShowCreate(false);
  };

  const selectedFormProvider = activeProviders.find(p => p.id === form.provider);

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-0">
      <header className="flex items-center justify-between px-3 md:px-4 py-3 border-b border-border-default bg-surface-1/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {(!sidebarOpen || isMobile) && (
            <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-surface-2 text-text-secondary touch-target">
              <Menu size={20} />
            </button>
          )}
          <Bot size={18} className="text-accent" />
          <h1 className="font-semibold text-sm">AI Assistants</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg bg-accent text-accent-text text-sm font-medium hover:bg-accent-hover active:scale-[0.97] transition-all"
        >
          <Plus size={14} />
          Create
        </button>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain p-3 md:p-4">
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-surface-1 border border-border-default space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Create Assistant</h3>
                  <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-surface-2">
                    <X size={14} />
                  </button>
                </div>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Assistant name"
                  className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border-subtle text-sm focus:outline-none focus:border-accent/50"
                  autoFocus
                />
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Description"
                  className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border-subtle text-sm focus:outline-none focus:border-accent/50"
                />
                <textarea
                  value={form.systemPrompt}
                  onChange={e => setForm({ ...form, systemPrompt: e.target.value })}
                  placeholder="System prompt (instructions for the AI)"
                  className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border-subtle text-sm focus:outline-none focus:border-accent/50"
                  rows={3}
                />
                {activeProviders.length > 0 ? (
                  <div className="flex gap-3">
                    <select
                      value={form.provider}
                      onChange={e => {
                        const prov = activeProviders.find(p => p.id === e.target.value);
                        setForm({ ...form, provider: e.target.value, model: prov?.models[0]?.id || '' });
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-surface-2 border border-border-subtle text-sm focus:outline-none"
                    >
                      <option value="">Select provider...</option>
                      {activeProviders.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <select
                      value={form.model}
                      onChange={e => setForm({ ...form, model: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg bg-surface-2 border border-border-subtle text-sm focus:outline-none"
                    >
                      <option value="">Select model...</option>
                      {selectedFormProvider?.models.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-text-tertiary bg-surface-2 rounded-lg px-3 py-2">
                    No providers connected. Add one in Settings to assign a model.
                  </p>
                )}
                <div>
                  <p className="text-xs text-text-tertiary mb-2">Color</p>
                  <div className="flex gap-2">
                    {colors.map(c => (
                      <button
                        key={c}
                        onClick={() => setForm({ ...form, color: c })}
                        className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-surface-1' : ''}`}
                        style={{ background: c, outlineColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-2">Icon</p>
                  <div className="flex gap-2">
                    {icons.map(ic => (
                      <button
                        key={ic}
                        onClick={() => setForm({ ...form, icon: ic })}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
                          form.icon === ic ? 'bg-accent-muted text-accent' : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!form.name.trim()}
                  className="px-4 py-2 rounded-lg bg-accent text-accent-text text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  Create Assistant
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assistants.map((assistant, i) => {
            const isActive = activeAssistantId === assistant.id;
            const provider = connectedProviders.find(p => p.id === assistant.provider);
            return (
              <motion.div
                key={assistant.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setActiveAssistant(assistant.id)}
                className={`group p-4 rounded-xl border cursor-pointer transition-all ${
                  isActive
                    ? 'bg-accent-muted border-accent/30'
                    : 'bg-surface-1 border-border-subtle hover:border-border-default hover:bg-surface-2'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: assistant.color }}>
                    {assistant.icon}
                  </div>
                  <div className="flex items-center gap-1">
                    {isActive && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">Active</span>
                    )}
                    {!['general', 'coder', 'writer', 'analyst'].includes(assistant.id) && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteAssistant(assistant.id); }}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-danger/20 text-text-tertiary hover:text-danger transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-1">{assistant.name}</h3>
                <p className="text-xs text-text-tertiary mb-3 line-clamp-2">{assistant.description}</p>
                <div className="flex items-center gap-2">
                  {provider ? (
                    <>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface-3 text-text-tertiary">
                        {provider.icon} {provider.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface-3 text-text-tertiary">
                        {assistant.model}
                      </span>
                    </>
                  ) : assistant.model ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-surface-3 text-text-tertiary">
                      {assistant.model || 'No model assigned'}
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-warning/10 text-warning">
                      Uses active model
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
