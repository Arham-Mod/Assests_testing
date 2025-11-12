import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type Agent = {
  id: string | number;
  name: string;
  country?: string; // short code like 'GBR'
  team?: string;
  points: number;
};

type LeaderboardColumnProps = {
  title: string;
  items: Agent[];
  compact?: boolean; // if true, show fewer details
};

// Single column (driver / team) component
const LeaderboardColumn: React.FC<LeaderboardColumnProps> = ({ title, items, compact = false }) => {
  return (
    <div className="w-full max-w-[420px]">
      {/* Header with left orange bar */}
      <div className="relative bg-black rounded-lg overflow-hidden border border-neutral-800 shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#ff4500]" />
        <div className="px-6 py-3">
          <h3 className="text-white font-bold text-[16px] tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>{title.toUpperCase()}</h3>
        </div>

        {/* Column headings */}
        <div className="grid grid-cols-12 gap-2 text-neutral-400 px-4 py-2 text-xs border-t border-neutral-800">
          <div className="col-span-1">#</div>
          <div className="col-span-6">{compact ? 'Agent' : 'Driver'}</div>
          <div className="col-span-3 text-left">{compact ? 'Team' : 'Country / Team'}</div>
          <div className="col-span-2 text-right">Pts</div>
        </div>

        {/* Items */}
        <ul className="px-4 py-3 space-y-2">
          <AnimatePresence initial={false}>
            {items.map((it, idx) => (
              <motion.li
                layout
                key={it.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="grid grid-cols-12 items-center gap-2"
              >
                {/* row background block */}
                <div className="col-span-12">
                  <div className={`flex items-center justify-between p-3 rounded-md shadow-sm`} style={{ background: '#222' }}>
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-8 flex-shrink-0 text-center text-sm font-semibold text-white">{idx + 1}</div>

                      <div className="flex flex-col min-w-0">
                        <div className="text-white font-medium truncate" style={{ fontFamily: 'Orbitron, sans-serif' }}>{it.name}</div>
                        <div className="text-neutral-400 text-xs truncate mt-1">
                          {it.country ? it.country : (it.team ?? '')}
                        </div>
                      </div>

                      <div className="ml-auto text-right">
                        <div className="text-white font-semibold text-sm">{it.points}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
};

// A small wrapper you can drop into any page. Renders two columns side-by-side similar to the reference image.
export const LeaderboardPanel: React.FC<{ drivers: Agent[]; teams?: Agent[] }> = ({ drivers, teams = [] }) => {
  // ensure sorted by points desc
  const driversSorted = [...drivers].sort((a, b) => b.points - a.points);
  const teamsSorted = [...teams].sort((a, b) => b.points - a.points);

  return (
    <div className="w-full flex flex-col items-center px-6 py-6">
      <div className="max-w-screen-lg w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <LeaderboardColumn title="Driver Standings" items={driversSorted} />
        <LeaderboardColumn title="Team Standings" items={teamsSorted.length ? teamsSorted : driversSorted.map(d => ({ id: d.id, name: d.team ?? d.name, points: d.points }))} compact />
      </div>
    </div>
  );
};

export default LeaderboardPanel;
