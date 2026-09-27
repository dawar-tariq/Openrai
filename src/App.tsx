import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { ProjectsView } from './components/ProjectsView';
import { AssistantsView } from './components/AssistantsView';
import { ToolsView } from './components/ToolsView';
import { WebsitesView } from './components/WebsitesView';
import { SettingsView } from './components/SettingsView';
import { RightPanel } from './components/RightPanel';
import { CommandPalette } from './components/CommandPalette';
import { MobileNav } from './components/MobileNav';
import { Onboarding } from './components/Onboarding';
import { useStore } from './lib/store';
import { useThemeInit, useKeyboardShortcuts, useMediaQuery } from './lib/hooks';

function MainContent() {
  const { view } = useStore();
  switch (view) {
    case 'chat': return <ChatView />;
    case 'projects': return <ProjectsView />;
    case 'assistants': return <AssistantsView />;
    case 'tools': return <ToolsView />;
    case 'websites': return <WebsitesView />;
    case 'settings': return <SettingsView />;
    default: return <ChatView />;
  }
}

export default function App() {
  useThemeInit();
  useKeyboardShortcuts();
  const { view, rightPanelOpen } = useStore();
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-surface-0">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent />

        {!isMobile && view === 'chat' && (
          <AnimatePresence>
            {rightPanelOpen && <RightPanel />}
          </AnimatePresence>
        )}
      </div>

      {isMobile && <MobileNav />}

      <CommandPalette />
      <Onboarding />
    </div>
  );
}
