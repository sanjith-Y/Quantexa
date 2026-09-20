import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, Zap, Bell } from 'lucide-react';
import { useApp } from '../../hooks/useAppState';
import { getAlertColor } from '../../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import type { Alert } from '../../types/traffic';

function AlertIcon({ type }: { type: Alert['type'] }) {
  const color = getAlertColor(type);
  if (type === 'critical') return <AlertTriangle size={13} color={color} />;
  if (type === 'success') return <CheckCircle size={13} color={color} />;
  if (type === 'emergency') return <Zap size={13} color={color} />;
  if (type === 'warning') return <AlertTriangle size={13} color={color} />;
  return <Info size={13} color={color} />;
}

export function AlertPanel() {
  const { state, dispatch } = useApp();

  return (
    <div style={{
      width: 260,
      minWidth: 260,
      background: 'rgba(3, 7, 18, 0.95)',
      borderLeft: '1px solid rgba(6, 182, 212, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid rgba(6, 182, 212, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={13} color="#06b6d4" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' }}>
            Live Alerts
          </span>
          {state.alerts.length > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: '#06b6d4',
              background: 'rgba(6,182,212,0.15)',
              padding: '1px 5px', borderRadius: 10,
            }}>{state.alerts.length}</span>
          )}
        </div>
        {state.alerts.length > 0 && (
          <button
            onClick={() => dispatch({ type: 'CLEAR_ALERTS' })}
            style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 10 }}
          >Clear</button>
        )}
      </div>

      {/* Alerts list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        <AnimatePresence mode="popLayout">
          {state.alerts.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#334155', fontSize: 11 }}>
              No active alerts
            </div>
          ) : (
            state.alerts.map((alert) => {
              const color = getAlertColor(alert.type);
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{
                    padding: '8px 10px',
                    marginBottom: 4,
                    borderRadius: 6,
                    background: `${color}0a`,
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ marginTop: 1 }}>
                      <AlertIcon type={alert.type} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.4 }}>
                        {alert.message}
                      </div>
                      {alert.intersection && (
                        <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                          {alert.intersection}
                        </div>
                      )}
                      <div style={{ fontSize: 9, color: '#334155', marginTop: 3 }}>
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Spillback alerts */}
      {state.spillbackAlerts.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(6,182,212,0.1)', padding: '8px' }}>
          <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
            Spillback Firewall
          </div>
          {state.spillbackAlerts.slice(0, 3).map((sb, i) => (
            <div key={i} style={{
              padding: '6px 8px', borderRadius: 6,
              background: 'rgba(245, 158, 11, 0.08)',
              borderLeft: '3px solid #f59e0b',
              marginBottom: 4,
            }}>
              <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
                {sb.fromIntersection}→{sb.toIntersection}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                {sb.recommendedAction}
              </div>
              <div style={{ fontSize: 10, color: '#475569' }}>
                Spillback in {sb.spillbackTime.toFixed(0)}s
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
