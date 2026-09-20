import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../hooks/useAppState';
import { getDensityColor, getSignalColor } from '../../utils/helpers';
import { Shield, Zap, AlertTriangle, Radio } from 'lucide-react';

interface NetworkMapProps {
  interactive?: boolean;
  showEmergency?: boolean;
  highlightRoute?: string[];
  mode?: 'classical' | 'quantum';
  height?: number | string;
}

export function NetworkMap({
  interactive = true,
  showEmergency = true,
  highlightRoute = ['J1', 'J3', 'J4'],
  mode,
  height = 420,
}: NetworkMapProps) {
  const { state, dispatch } = useApp();
  const intersections = state.traffic.intersections;
  const roads = state.traffic.roads;
  const emergency = state.emergency;
  const activeMode = mode || state.activeMode;

  const handleNodeClick = (id: string) => {
    if (!interactive) return;
    dispatch({ type: 'SELECT_INTERSECTION', id });
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm"
      style={{ height, width: '100%' }}
    >
      {/* Top Overlay Badge */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2 bg-white/95 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-lg text-xs shadow-xs">
        <div className={`w-2 h-2 rounded-full ${activeMode === 'quantum' ? 'bg-purple-600' : 'bg-teal-600'} animate-ping`} />
        <span className="font-mono uppercase text-slate-800 font-semibold tracking-wider">
          {activeMode === 'quantum' ? 'Quantum Mesh Topology' : 'Classical Fixed Mesh'}
        </span>
        <span className="text-slate-300">|</span>
        <span className="text-teal-700 font-semibold">6 Intersections Active</span>
      </div>

      <svg className="w-full h-full bg-slate-50/50" viewBox="0 0 800 420" preserveAspectRatio="xMidYMid meet">
        {/* Render Road Links */}
        {roads.map((road, idx) => {
          const fromNode = intersections[road.from];
          const toNode = intersections[road.to];
          if (!fromNode || !toNode) return null;

          const isEmergencyCorridor =
            emergency.active &&
            highlightRoute.includes(road.from) &&
            highlightRoute.includes(road.to) &&
            Math.abs(highlightRoute.indexOf(road.from) - highlightRoute.indexOf(road.to)) === 1;

          return (
            <g key={`road-${idx}`}>
              {/* Outer Road Base */}
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={road.isBlocked ? '#ef4444' : isEmergencyCorridor ? '#0d9488' : '#cbd5e1'}
                strokeWidth={isEmergencyCorridor ? '10' : '8'}
                strokeLinecap="round"
                opacity={road.isBlocked ? 0.8 : 0.9}
              />

              {/* Inner Animated Flow Line */}
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={
                  road.isBlocked
                    ? '#f87171'
                    : isEmergencyCorridor
                    ? '#0d9488'
                    : activeMode === 'quantum'
                    ? '#7c3aed'
                    : '#0284c7'
                }
                strokeWidth={isEmergencyCorridor ? '4' : '2.5'}
                strokeDasharray={isEmergencyCorridor ? '10,5' : '6,4'}
                opacity={road.isBlocked ? 0.4 : 0.95}
              />

              {/* Flow label */}
              <text
                x={(fromNode.x + toNode.x) / 2 + 8}
                y={(fromNode.y + toNode.y) / 2 - 8}
                fill="#475569"
                fontSize="10"
                fontWeight="600"
                fontFamily="JetBrains Mono"
                textAnchor="middle"
              >
                {road.isBlocked ? 'BLOCKED' : `${road.currentFlow} veh/m`}
              </text>
            </g>
          );
        })}

        {/* Render Emergency Vehicle Animation along route */}
        {emergency.active && showEmergency && (
          <g>
            <motion.circle
              cx={emergency.position.x}
              cy={emergency.position.y}
              r={16}
              fill="rgba(220, 38, 38, 0.2)"
              stroke="#dc2626"
              strokeWidth="2"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.9, 0.4, 0.9],
              }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
            <circle
              cx={emergency.position.x}
              cy={emergency.position.y}
              r={8}
              fill="#dc2626"
            />
            <text
              x={emergency.position.x}
              y={emergency.position.y - 14}
              fill="#b91c1c"
              fontSize="10"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
            >
              🚑 AMB-001 (ETA: {emergency.eta[emergency.route[emergency.currentSegment]] ?? 0}s)
            </text>
          </g>
        )}

        {/* Render Intersection Nodes */}
        {Object.values(intersections).map((node) => {
          const isSelected = state.selectedIntersection === node.id;
          const isEmergencyNode = emergency.active && emergency.route.includes(node.id);
          const densityColor = getDensityColor(node.density);
          const signalColor = getSignalColor(node.signal);

          return (
            <g
              key={node.id}
              className="intersection-node"
              onClick={() => handleNodeClick(node.id)}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
            >
              {/* Outer pulsing ring for high risk or emergency */}
              {(node.riskLevel === 'high' || node.riskLevel === 'critical' || isEmergencyNode) && (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={32}
                  fill="none"
                  stroke={isEmergencyNode ? '#0d9488' : densityColor}
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                />
              )}

              {/* Node Base Circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={isSelected ? 26 : 22}
                fill="#ffffff"
                stroke={isSelected ? '#0d9488' : isEmergencyNode ? '#0d9488' : '#94a3b8'}
                strokeWidth={isSelected ? 3 : 2}
              />

              {/* Density Progress Ring */}
              <circle
                cx={node.x}
                cy={node.y}
                r={isSelected ? 26 : 22}
                fill="none"
                stroke={densityColor}
                strokeWidth="3.5"
                strokeDasharray={`${(node.density / 100) * 138}, 200`}
                strokeLinecap="round"
                transform={`rotate(-90 ${node.x} ${node.y})`}
              />

              {/* Signal indicator bulb */}
              <circle
                cx={node.x + 12}
                cy={node.y - 12}
                r={6}
                fill={signalColor}
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* Intersection ID */}
              <text
                x={node.x}
                y={node.y + 4}
                fill="#0f172a"
                fontSize="12"
                fontWeight="800"
                fontFamily="JetBrains Mono"
                textAnchor="middle"
              >
                {node.id}
              </text>

              {/* Density & Countdown Badges - Positioned in clear empty quadrants away from road lines */}
              {(() => {
                let badgeX = node.x > 500 ? node.x - 82 : node.x + 26;
                let badgeY = node.y - 10;
                if (node.id === 'J1') { badgeX = node.x - 38; badgeY = node.y - 48; }
                else if (node.id === 'J2') { badgeX = node.x - 90; badgeY = node.y + 8; }
                else if (node.id === 'J3') { badgeX = node.x - 90; badgeY = node.y - 42; }
                else if (node.id === 'J4') { badgeX = node.x + 28; badgeY = node.y - 10; }
                else if (node.id === 'J5') { badgeX = node.x - 90; badgeY = node.y + 8; }
                else if (node.id === 'J6') { badgeX = node.x - 38; badgeY = node.y + 28; }

                return (
                  <g transform={`translate(${badgeX}, ${badgeY})`}>
                    <rect
                      width="76"
                      height="20"
                      rx="6"
                      fill="#ffffff"
                      stroke="#cbd5e1"
                      strokeWidth="1.2"
                    />
                    <text
                      x="38"
                      y="13.5"
                      fill="#0f172a"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {node.density.toFixed(0)}% · {node.signalCountdown.toFixed(0)}s
                    </text>
                  </g>
                );
              })()}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
