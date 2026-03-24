'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Rocket,
  Bot,
  RefreshCw,
  Package,
  Globe,
  ArrowRight,
  Zap,
  Shield,
  Eye,
} from 'lucide-react';

const pipelineSteps = [
  { icon: Rocket, label: 'Describe App', emoji: '📝' },
  { icon: Bot, label: 'AI Generates', emoji: '🤖' },
  { icon: RefreshCw, label: 'Self-Heal', emoji: '🔄' },
  { icon: Package, label: 'Compile', emoji: '📦' },
  { icon: Globe, label: 'Live App', emoji: '🌐' },
];

const features = [
  {
    icon: Zap,
    title: 'Self-Healing AI',
    description: 'Iterates up to 5x — tests, finds bugs, fixes them automatically. You get zero-bug output.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20',
  },
  {
    icon: Shield,
    title: 'Bytecode Output',
    description: 'Compiles directly to Python bytecode (.pyc). Production-ready, optimized, debugged.',
    color: 'text-bytetrust-cyan',
    bgColor: 'bg-bytetrust-cyan/10',
    borderColor: 'border-bytetrust-cyan/20',
  },
  {
    icon: Eye,
    title: 'Live Preview',
    description: 'Your app runs on localhost instantly. Interact with it right inside the dashboard.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/20',
  },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-24 sm:py-32 px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-bytetrust-cyan/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-bytetrust-cyan/20 bg-bytetrust-cyan/5 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-bytetrust-cyan animate-pulse" />
            <span className="text-xs text-bytetrust-cyan tracking-wide font-medium">
              Prompt-to-App · Self-Healing · Bytecode-Ready
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-heading font-bold text-white leading-[1.1] mb-6"
          >
            Describe Your App.
            <br />
            <span className="text-bytetrust-cyan text-glow-cyan">We Build & Run It.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            ByteTrust generates your full application, auto-fixes bugs, compiles to bytecode,
            and gives you a running localhost URL — all from a single prompt.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-bytetrust-cyan to-cyan-600 text-bytetrust-dark font-semibold text-sm hover:shadow-lg hover:shadow-bytetrust-cyan/20 transition-all active:scale-[0.98]"
            >
              Build an App
            </Link>
            <a
              href="#pipeline"
              className="px-6 py-3 rounded-xl border border-bytetrust-border text-slate-300 font-medium text-sm hover:border-bytetrust-cyan/40 hover:text-white transition-all"
            >
              See How It Works
            </a>
          </motion.div>
        </div>
      </section>

      {/* Pipeline Visual */}
      <section id="pipeline" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-heading font-bold text-white text-center mb-12"
          >
            From Prompt to Running App
          </motion.h2>

          <div className="flex items-center justify-between overflow-x-auto pb-4 gap-2">
            {pipelineSteps.map((step, index) => (
              <div key={index} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex flex-col items-center gap-3 min-w-[100px]"
                >
                  <div className="w-16 h-16 rounded-2xl bg-bytetrust-card border border-bytetrust-border flex items-center justify-center text-2xl card-hover">
                    {step.emoji}
                  </div>
                  <span className="text-xs text-slate-400 text-center font-medium">
                    {step.label}
                  </span>
                </motion.div>

                {index < pipelineSteps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                    className="mx-1 flex-shrink-0"
                  >
                    <ArrowRight size={16} className="text-bytetrust-cyan/40" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`rounded-2xl border ${feature.borderColor} bg-bytetrust-card p-6 card-hover`}
                >
                  <div className={`w-10 h-10 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <Icon size={20} className={feature.color} />
                  </div>
                  <h3 className="text-md font-heading font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-bytetrust-border/40 py-8 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-bytetrust-cyan">⬡</span>
            <span className="text-sm font-heading font-semibold text-slate-400">ByteTrust AI</span>
          </div>
          <p className="text-xs text-slate-600">
            Describe. Build. Run. © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
