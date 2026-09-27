import { motion } from 'framer-motion';
import { Cloud, Server, Wrench, ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store';
import { useMediaQuery } from '../lib/hooks';

export function Onboarding() {
  const { onboardingDismissed, dismissOnboarding, setView, connectedProviders } = useStore();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Don't show if already dismissed or has providers
  if (onboardingDismissed || connectedProviders.length > 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-surface-0 flex items-center justify-center p-4 md:p-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5, type: 'spring', damping: 25 }}
        className="w-full max-w-lg"
      >
        {/* Logo + Welcome */}
        <div className="text-center mb-8 md:mb-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-accent/20 via-info/15 to-accent/10 flex items-center justify-center border border-accent/20"
          >
            <img src="/logo.png" alt="OpenRAI" className="w-12 h-12 md:w-14 md:h-14" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-3xl font-bold mb-2"
          >
            Welcome to OpenRAI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-text-secondary text-sm md:text-base"
          >
            Your Open AI Workspace
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-text-tertiary text-xs md:text-sm mt-1"
          >
            Connect any AI provider to get started
          </motion.p>
        </div>

        {/* Provider options */}
        <div className="space-y-3 mb-8">
          {[
            { icon: Cloud, title: 'Cloud AI', desc: 'OpenAI, Anthropic, Google, OpenRouter, Groq & more', color: '#3b9eff', delay: 0.45 },
            { icon: Server, title: 'Local AI', desc: 'Ollama, LM Studio, vLLM — run models on your device', color: '#17c964', delay: 0.5 },
            { icon: Wrench, title: 'Private Server', desc: 'Any OpenAI-compatible API endpoint', color: '#f59e0b', delay: 0.55 },
          ].map(item => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: item.delay }}
                onClick={() => { dismissOnboarding(); setView('settings'); }}
                className="w-full flex items-center gap-4 p-4 md:p-5 rounded-2xl bg-surface-1 border border-border-subtle hover:border-border-default hover:bg-surface-2 active:scale-[0.98] transition-all text-left group"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.color + '15', color: item.color }}>
                  <Icon size={isMobile ? 24 : 28} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm md:text-base">{item.title}</p>
                  <p className="text-xs md:text-sm text-text-tertiary mt-0.5">{item.desc}</p>
                </div>
                <ArrowRight size={18} className="text-text-tertiary group-hover:text-text-secondary group-hover:translate-x-0.5 transition-all shrink-0" />
              </motion.button>
            );
          })}
        </div>

        {/* Skip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="text-center"
        >
          <button
            onClick={dismissOnboarding}
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors px-4 py-2"
          >
            Skip for now — explore OpenRAI first
          </button>
        </motion.div>

        {/* Features hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 md:mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 md:gap-6 text-[11px] text-text-tertiary"
        >
          {['Multi-provider', 'Local models', 'Website builder', 'Secure'].map(f => (
            <span key={f} className="flex items-center gap-1">
              <Sparkles size={10} className="text-accent" />
              {f}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
