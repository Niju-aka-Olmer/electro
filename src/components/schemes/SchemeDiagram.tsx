'use client'

import React from 'react'

const W = { l: '#EF4444', n: '#60A5FA', pe: '#34D399', sw: '#C084FC' }
const W_NAME: Record<string, string> = { l: 'L', n: 'N', pe: 'PE', sw: 'SW' }

export interface WagoGroup {
  kind: keyof typeof W
  from: string
  to: string
}

interface Props {
  title: string
  cableInfo: string
  groups: WagoGroup[]
  className?: string
}

export default function SchemeDiagram({ title, cableInfo, groups, className }: Props) {
  return (
    <div className={className} style={{
      background: '#0A0B0D', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.08)', padding: 16, overflow: 'hidden',
    }}>
      {/* Заголовок */}
      <div style={{ textAlign: 'center', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', fontFamily: 'IBM Plex Mono, monospace' }}>
          {title}
        </span>
        <span style={{ fontSize: 11, color: '#64748B' }}>{cableInfo}</span>
      </div>

      {/* Источник (вверху) */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <div style={{
          background: '#1A1D24', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
          padding: '6px 18px', fontSize: 13, fontWeight: 700, color: '#F1F5F9',
        }}>
          ⚡ Щиток
        </div>
      </div>

      <svg width="32" height="16" style={{ display: 'block', margin: '0 auto' }}>
        <line x1={16} y1={0} x2={16} y2={16} stroke="#475569" strokeWidth={1.5} />
        <polygon points="12,14 20,14 16,24" fill="#475569" />
      </svg>

      {/* Распредкоробка с Wago-группами */}
      <div style={{
        background: '#111318', border: '2px dashed rgba(255,255,255,0.18)', borderRadius: 12,
        padding: 12, maxWidth: 420, margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 10, letterSpacing: 1 }}>
          РАСПРЕДКОРОБКА
        </div>

        {groups.map((g, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px',
            background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
            borderRadius: 6, marginBottom: 4,
          }}>
            {/* Wago-клемма (цветной кружок) */}
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: W[g.kind], display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#000' }}>{W_NAME[g.kind]}</span>
            </div>

            {/* Откуда */}
            <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', minWidth: 80, textAlign: 'right' }}>
              {g.from}
            </span>

            {/* Стрелка */}
            <span style={{ color: '#475569', fontSize: 14 }}>→</span>

            {/* Куда */}
            <span style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9' }}>
              {g.to}
            </span>
          </div>
        ))}

        {groups.length === 0 && (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#475569', padding: 8 }}>
            нет данных о соединениях
          </div>
        )}
      </div>

      {/* Легенда */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {(['l', 'n', 'pe', 'sw'] as const).map(k => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: W[k] }} />
            <span style={{ color: W[k], fontWeight: 700 }}>{W_NAME[k]}</span>
            <span style={{ color: '#475569', fontWeight: 400 }}>
              {k === 'l' ? 'фаза' : k === 'n' ? 'ноль' : k === 'pe' ? 'земля' : 'управл.'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
