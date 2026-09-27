import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, FolderKanban, FileText, Code, Trash2,
  X, Menu
} from 'lucide-react';
import { useStore } from '../lib/store';
import { useMediaQuery } from '../lib/hooks';

export function ProjectsView() {
  const {
    projects, activeProjectId, setActiveProject, createProject,
    deleteProject, toggleSidebar, sidebarOpen
  } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleCreate = () => {
    if (!newName.trim()) return;
    createProject(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-0">
      <header className="flex items-center justify-between px-3 md:px-4 py-3 border-b border-border-default bg-surface-1/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {(!sidebarOpen || isMobile) && (
            <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-surface-2 text-text-secondary touch-target">
              <Menu size={20} />
            </button>
          )}
          <FolderKanban size={18} className="text-accent" />
          <h1 className="font-semibold text-sm">Projects</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg bg-accent text-accent-text text-sm font-medium hover:bg-accent-hover active:scale-[0.97] transition-all"
        >
          <Plus size={14} />
          New Project
        </button>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain p-3 md:p-4">
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
              <div className="p-4 rounded-xl bg-surface-1 border border-border-default">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Create Project</h3>
                  <button onClick={() => setShowCreate(false)} className="p-1.5 rounded hover:bg-surface-2 touch-target"><X size={16} /></button>
                </div>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Project name"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border-subtle text-sm mb-2 focus:outline-none focus:border-accent/50" autoFocus />
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border-subtle text-sm mb-3 focus:outline-none focus:border-accent/50" rows={2} />
                <button onClick={handleCreate} disabled={!newName.trim()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-accent text-accent-text text-sm font-medium hover:bg-accent-hover active:scale-[0.97] transition-all disabled:opacity-50">
                  Create
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setActiveProject(project.id === activeProjectId ? null : project.id)}
              className={`group p-4 rounded-xl border cursor-pointer active:scale-[0.98] transition-all ${
                activeProjectId === project.id
                  ? 'bg-accent-muted border-accent/30'
                  : 'bg-surface-1 border-border-subtle hover:border-border-default hover:bg-surface-2'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: project.color }}>
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteProject(project.id); }}
                  className={`p-2 rounded-lg hover:bg-danger/20 text-text-tertiary hover:text-danger transition-all touch-target ${isMobile ? '' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <h3 className="font-semibold text-sm mb-1">{project.name}</h3>
              <p className="text-xs text-text-tertiary mb-3 line-clamp-2">{project.description || 'No description'}</p>
              <div className="flex items-center gap-3 text-xs text-text-tertiary">
                <span className="flex items-center gap-1"><FileText size={12} /> {project.files.length} files</span>
                <span className="flex items-center gap-1"><Code size={12} /> {project.conversations.length} chats</span>
              </div>
            </motion.div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-16">
            <FolderKanban size={40} className="mx-auto mb-3 text-text-tertiary" />
            <p className="text-text-secondary font-medium mb-1">No projects yet</p>
            <p className="text-text-tertiary text-sm mb-4">Create your first project to organize work</p>
            <button onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-accent-text text-sm font-semibold hover:bg-accent-hover active:scale-[0.97] transition-all">
              <Plus size={16} /> Create Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
