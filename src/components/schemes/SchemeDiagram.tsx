'use client'

import React from 'react'

const W = {
  l:  '#EF4444',
  n:  '#60A5FA',
  pe: '#34D399',
  sw: '#C084FC',
}

function wireLabel(k: keyof typeof W): string {
  return k === 'l' ? 'L' : k === 'n' ? 'N' : k === 'pe' ? 'PE' : 'SW'
}

/** Одна жила: откуда → куда, какого цвета */
export interface WirePath {
  kind: keyof typeof W
  from: string
  to: string
}

interface Props {
  title: string
  source: string
  jbox: string
  devices: { name: string; wires: WirePath[] }[]
  className?: string
}

/** Минимальная чистая диаграмма расключения на CSS */
export default function SchemeDiagram({ title, source, jbox, devices, className }: Props) {
  return (
    <div className={className} style={{ background: '#0A0B0D', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', padding: 20, overflow: 'hidden' }}>
      {/* Заголовок */}
      <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 13, color: '#94A3B8', fontFamily: 'IBM Plex Mono, monospace' }}>
        {title}
      </div>

      {/* Источник → Распредкоробка */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          background: '#1A1D24', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
          padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#F1F5F9',
        }}>
          {source}
        </div>
        {/* Линии вниз */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ color: W.l, fontSize: 11, fontWeight: 700 }}>L</span>
          <span style={{ color: W.n, fontSize: 11, fontWeight: 700 }}>N</span>
          <span style={{ color: W.pe, fontSize: 11, fontWeight: 700 }}>PE</span>
        </div>
        <svg width="80" height="24" style={{ display: 'block' }}>
          <line x1={10} y1={0} x2={10} y2={24} stroke={W.l} strokeWidth={2} />
          <line x1={40} y1={0} x2={40} y2={24} stroke={W.n} strokeWidth={2} />
          <line x1={70} y1={0} x2={70} y2={24} stroke={W.pe} strokeWidth={2} />
        </svg>
      </div>

      {/* Распредкоробка */}
      <div style={{
        background: '#111318', border: '2px dashed rgba(255,255,255,0.15)', borderRadius: 10,
        padding: '10px 24px', textAlign: 'center', marginBottom: 16,
        fontSize: 13, fontWeight: 600, color: '#94A3B8',
      }}>
        {jbox}
      </div>

      {/* Линии из коробки к устройствам */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
        {devices.map((dev, di) => (
          <div key={di} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {/* Жилы над устройством */}
            <div style={{ display: 'flex', gap: 10 }}>
              {dev.wires.map((w, wi) => (
                <span key={wi} style={{ fontSize: 10, fontWeight: 700, color: W[w.kind] }}>
                  {wireLabel(w.kind)}
                </span>
              ))}
            </div>
            {/* SVG линии */}
            <svg width={dev.wires.length * 18} height={18} style={{ display: 'block' }}>
              {dev.wires.map((w, wi) => (
                <line key={wi} x1={8 + wi * 18} y1={0} x2={8 + wi * 18} y2={18} stroke={W[w.kind]} strokeWidth={2} />
              ))}
            </svg>
            {/* Устройство */}
            <div style={{
              background: '#1A1D24', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
              padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#F1F5F9',
              whiteSpace: 'nowrap',
            }}>
              {dev.name}
            </div>
          </div>
        ))}
      </div>

      {/* Легенда */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {(['l', 'n', 'pe', 'sw'] as const).map(k => (
          <span key={k} style={{ fontSize: 10, color: W[k], fontWeight: 700 }}>
            {wireLabel(k)}{' = '}
            <span style={{ fontWeight: 400, color: '#64748B' }}>
              {k === 'l' ? 'Фаза' : k === 'n' ? 'Ноль' : k === 'pe' ? 'Земля' : 'Управл.'}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
