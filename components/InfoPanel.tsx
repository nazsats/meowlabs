'use client';
import { useState } from 'react';
import { getRoleProperties } from '../app/lib/discord';

interface InfoPanelProps {
  roles: string[];
}

export default function InfoPanel({ roles }: InfoPanelProps) {
  const [open, setOpen] = useState<{ [key: string]: boolean }>({});

  const toggleAccordion = (role: string) => {
    setOpen((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  return (
    <div className='bg-[var(--accent)] rounded-xl p-4 sm:p-8 shadow-xl border-4 border-[var(--border)] animate-fade-in'>
      <h2 className='text-xl sm:text-3xl font-bold text-[var(--border)] mb-4 sm:mb-6'>Role-Specific Information</h2>
      {roles.length === 0 ? (
        <p className='text-[var(--border)] text-sm sm:text-base'>No roles assigned.</p>
      ) : (
        roles.map((role) => {
          const { type, mintPhase } = getRoleProperties(role);
          const message = `Type: ${type}. You are eligible to mint NFTs in ${mintPhase}.`;
          return (
            <div key={role} className='border-b border-[var(--border)] last:border-b-0'>
              <button
                className='w-full text-left py-3 sm:py-4 flex justify-between items-center text-[var(--border)] font-semibold hover:scale-[1.02] transition-transform duration-200 text-sm sm:text-base'
                onClick={() => toggleAccordion(role)}
                aria-expanded={open[role]}
                aria-controls={`panel-${role}`}
              >
                <span>{role}</span>
                <span
                  className={`transition-transform duration-300 ${open[role] ? 'rotate-180' : 'rotate-0'}`}
                >
                  {open[role] ? '−' : '+'}
                </span>
              </button>
              <div
                id={`panel-${role}`}
                className={`overflow-hidden transition-all duration-300 ${
                  open[role] ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {open[role] && (
                  <div className='py-2 sm:py-3 text-xs sm:text-sm text-[var(--border)] bg-[var(--background)] rounded-lg p-2 sm:p-3'>
                    {message}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}