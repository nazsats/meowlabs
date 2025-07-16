'use client';

import { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: [10, -10, 0], transition: { duration: 0.5, ease: 'easeOut' } }}
          className="text-center p-4 sm:p-6 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-xl shadow-xl border-2 border-[var(--accent)] max-w-md mx-auto"
        >
          <p className="text-base sm:text-lg mb-4">
            Meow! Something went wrong in the Catcents universe. Try again?
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[var(--border)] text-[var(--text)] rounded-lg hover:bg-[var(--accent)] hover:text-white hover:scale-105 hover:animate-glow transition-all duration-300"
          >
            Retry
          </button>
        </motion.div>
      );
    }
    return this.props.children;
  }
}