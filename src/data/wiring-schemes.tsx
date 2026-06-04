// ═══════════════════════════════════════════════
// БИБЛИОТЕКА СХЕМ РАСКЛЮЧЕНИЯ — ВСЕ ВЫКЛЮЧАТЕЛИ
// ═══════════════════════════════════════════════
// Каждая схема — кэшированный React-SVG компонент,
// показывающий распредкоробку с соединениями Wago.
// Цвета проводов: L(красный) N(синий) PE(зелёный) SW(фиолетовый)

import React from 'react'

// ─── ЦВЕТА (через CSS-переменные для тёмной/светлой темы) ───
const C = {
  l:        'var(--wire-l)',
  n:        'var(--wire-n)',
  pe:       'var(--wire-pe)',
  sw:       'var(--wire-sw)',
  box:      'var(--border)',
  boxBrd:   'var(--border-accent)',
  txt:      'var(--text-primary)',
  txtSec:   'var(--text-secondary)',
  txtDim:   'var(--text-muted)',
  bg:       'var(--bg-base)',
  glow:     'var(--amber-glow)',
  amber:    'var(--amber-500)',
}

// ─── ТИП ───
export interface WiringScheme {
  id: string
  title: string
  description: string
  category: string
  cableInfo: string
  devices: string
  Svg: React.FC
}

// ─── УТИЛИТЫ ───
function line(x1: number, y1: number, x2: number, y2: number, color: string, width = 2) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} />
}
function txt(x: number, y: number, text: string, color: string, size = 10) {
  return <text x={x} y={y} textAnchor="middle" fontSize={size} fill={color}>{text}</text>
}

// ─── ПРИМИТИВЫ ───

/** Лампа */
function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="14" stroke={C.sw} strokeWidth="1.5" fill="none" />
      <line x1={x - 10} y1={y} x2={x + 10} y2={y} stroke={C.sw} strokeWidth="1" />
      <line x1={x} y1={y - 10} x2={x} y2={y + 10} stroke={C.sw} strokeWidth="1" />
      <line x1={x - 7} y1={y - 7} x2={x + 7} y2={y + 7} stroke={C.sw} strokeWidth="0.5" opacity="0.4" />
      <line x1={x + 7} y1={y - 7} x2={x - 7} y2={y + 7} stroke={C.sw} strokeWidth="0.5" opacity="0.4" />
    </g>
  )
}

/** Одноклавишный выключатель */
function Switch1({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g>
      <rect x={x - 15} y={y - 18} width="30" height="40" rx="4" stroke={C.txtDim} strokeWidth="1.5" fill="none" />
      <line x1={x} y1={y - 5} x2={x} y2={y + 5} stroke={C.txt} strokeWidth="2" />
      <line x1={x - 6} y1={y - 5} x2={x + 6} y2={y - 5} stroke={C.txt} strokeWidth="2" />
      {label && <text x={x} y={y + 32} textAnchor="middle" fontSize="9" fill={C.txtDim}>{label}</text>}
    </g>
  )
}

/** Двухклавишный выключатель */
function Switch2({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g>
      <rect x={x - 18} y={y - 22} width="36" height="48" rx="4" stroke={C.txtDim} strokeWidth="1.5" fill="none" />
      <line x1={x} y1={y - 12} x2={x} y2={y + 12} stroke={C.txtDim} strokeWidth="1" />
      <line x1={x - 8} y1={y - 9} x2={x + 8} y2={y - 9} stroke={C.txt} strokeWidth="1.5" />
      <line x1={x - 8} y1={y + 3} x2={x + 8} y2={y + 3} stroke={C.txt} strokeWidth="1.5" />
      {label && <text x={x} y={y + 36} textAnchor="middle" fontSize="9" fill={C.txtDim}>{label}</text>}
    </g>
  )
}

/** Трёхклавишный выключатель */
function Switch3({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g>
      <rect x={x - 20} y={y - 24} width="40" height="52" rx="4" stroke={C.txtDim} strokeWidth="1.5" fill="none" />
      <line x1={x - 7} y1={y - 14} x2={x - 7} y2={y + 14} stroke={C.txtDim} strokeWidth="1" />
      <line x1={x + 7} y1={y - 14} x2={x + 7} y2={y + 14} stroke={C.txtDim} strokeWidth="1" />
      <line x1={x - 13} y1={y - 11} x2={x} y2={y - 11} stroke={C.txt} strokeWidth="1.5" />
      <line x1={x - 13} y1={y - 1} x2={x} y2={y - 1} stroke={C.txt} strokeWidth="1.5" />
      <line x1={x} y1={y + 9} x2={x + 13} y2={y + 9} stroke={C.txt} strokeWidth="1.5" />
      {label && <text x={x} y={y + 38} textAnchor="middle" fontSize="9" fill={C.txtDim}>{label}</text>}
    </g>
  )
}

/** Проходной выключатель */
function PassSwitch({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g>
      <rect x={x - 15} y={y - 18} width="30" height="40" rx="4" stroke={C.txtDim} strokeWidth="1.5" fill="none" />
      <line x1={x} y1={y - 5} x2={x} y2={y + 5} stroke={C.txt} strokeWidth="2" />
      <line x1={x - 6} y1={y - 5} x2={x + 6} y2={y - 5} stroke={C.txt} strokeWidth="2" />
      <polyline points={`${x-8},${y-12} ${x-3},${y-5} ${x+8},${y-5}`} stroke={C.amber} strokeWidth="1" fill="none" opacity="0.5" />
      {label && <text x={x} y={y + 32} textAnchor="middle" fontSize="9" fill={C.txtDim}>{label}</text>}
    </g>
  )
}

/** Перекрёстный выключатель */
function CrossSwitch({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g>
      <rect x={x - 15} y={y - 18} width="30" height="40" rx="4" stroke={C.amber} strokeWidth="1.5" fill="none" />
      <line x1={x - 8} y1={y - 8} x2={x + 8} y2={y + 8} stroke={C.amber} strokeWidth="1.5" />
      <line x1={x + 8} y1={y - 8} x2={x - 8} y2={y + 8} stroke={C.amber} strokeWidth="1.5" />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill={C.amber}>✕</text>
      {label && <text x={x} y={y + 32} textAnchor="middle" fontSize="9" fill={C.txtDim}>{label}</text>}
    </g>
  )
}

/** Розетка */
function Socket({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g>
      <rect x={x - 16} y={y - 20} width="32" height="44" rx="5" stroke={C.txtDim} strokeWidth="1.5" fill="none" />
      <line x1={x - 7} y1={y - 6} x2={x - 7} y2={y + 6} stroke={C.txt} strokeWidth="1.5" />
      <line x1={x + 7} y1={y - 6} x2={x + 7} y2={y + 6} stroke={C.txt} strokeWidth="1.5" />
      <line x1={x - 3} y1={y + 12} x2={x + 3} y2={y + 12} stroke={C.pe} strokeWidth="2" />
      {label && <text x={x} y={y + 34} textAnchor="middle" fontSize="9" fill={C.txtDim}>{label}</text>}
    </g>
  )
}

/** Распредкоробка */
function JBox({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="6" stroke={C.boxBrd} strokeWidth="2" strokeDasharray="6,3" fill={C.bg} fillOpacity="0.3" />
      <text x={x + w / 2} y={y - 6} textAnchor="middle" fontSize="10" fill={C.boxBrd}>Распредкоробка</text>
    </g>
  )
}

/** Точка соединения */
function Dot({ cx, cy, color }: { cx: number; cy: number; color?: string }) {
  return <circle cx={cx} cy={cy} r="4" fill={color || C.amber} />
}

/** Wago-клемма */
function Wago({ x, y, label, color }: { x: number; y: number; label?: string; color?: string }) {
  const c = color || C.amber
  return (
    <g>
      <rect x={x - 10} y={y - 6} width="20" height="12" rx="3" stroke={c} strokeWidth="1" fill={c} fillOpacity="0.12" />
      {label && <text x={x} y={y + 4} textAnchor="middle" fontSize="7" fill={c}>{label}</text>}
    </g>
  )
}

/** Маркировка жил в штриховой рамке */
function WireLegend({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <text x={x} y={y} fontSize="9" fill={C.txtDim}>
        <tspan fill={C.l}>●</tspan> L (фаза)
        <tspan dx="10" fill={C.n}>●</tspan> N (ноль)
        <tspan dx="10" fill={C.pe}>●</tspan> PE (земля)
        <tspan dx="10" fill={C.sw}>●</tspan> L(упр)
      </text>
    </g>
  )
}

// ══════════════════════════════════════════════════════════
//  1. ОДНОКЛАВИШНЫЙ ВЫКЛЮЧАТЕЛЬ
// ══════════════════════════════════════════════════════════
export const SvgSingleSwitch: React.FC = () => {
  const jx=200, jy=100, jw=140, jh=100, swX=70, lampX=440, feedY=280
  return (
    <svg viewBox="0 0 550 350" className="w-full h-auto" fill="none" style={{background:'var(--bg-surface)'}}>
      {/* Питание */}
      {line(270, feedY, 270, jy+jh, C.l)}
      {line(290, feedY, 290, jy+jh, C.n)}
      {line(310, feedY, 310, jy+jh, C.pe)}
      {txt(270, feedY+12, 'L', C.l, 9)} {txt(290, feedY+12, 'N', C.n, 9)} {txt(310, feedY+12, 'PE', C.pe, 9)}
      {txt(290, feedY+30, 'от щитка 220В', C.txtDim, 10)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <Switch1 x={swX} y={jy+jh/2} label="Выключатель" />

      {/* L к выключателю */}
      {line(jx, jy+jh/2-12, swX+15, jy+jh/2-12, C.l)}
      {txt(swX+15+(jx-swX-15)/2, jy+jh/2-16, 'L', C.l, 8)}
      {/* управляющая от выключателя */}
      {line(jx, jy+jh/2+12, swX+15, jy+jh/2+12, C.sw)}
      {txt(swX+15+(jx-swX-15)/2, jy+jh/2+24, 'L(упр)', C.sw, 8)}

      <Lamp x={lampX} y={jy+jh/2} />
      {line(jx+jw, jy+jh/2-14, lampX-14, jy+jh/2-14, C.sw)}
      {line(jx+jw, jy+jh/2, lampX-14, jy+jh/2, C.n)}
      {line(jx+jw, jy+jh/2+14, lampX-14, jy+jh/2+14, C.pe)}
      {txt(jx+jw+(lampX-jx-jw)/2, jy+jh/2-18, 'L(упр)', C.sw, 8)}
      {txt(jx+jw+(lampX-jx-jw)/2, jy+jh/2-4, 'N', C.n, 8)}
      {txt(jx+jw+(lampX-jx-jw)/2, jy+jh/2+26, 'PE', C.pe, 8)}

      {/* Внутри коробки */}
      {/* L входит → к выключателю */}
      {line(jx+30, jy+20, jx+30, jy+jh/2-12, C.l)}
      <Dot cx={jx+30} cy={jy+20} color={C.l} />
      {/* N входит → к лампе */}
      {line(jx+55, jy+jh, jx+55, jy+jh/2, C.n)}
      {line(jx+55, jy+jh/2, jx+jw-45, jy+jh/2, C.n)}
      <Dot cx={jx+55} cy={jy+jh/2} color={C.n} />
      {/* PE входит → к лампе */}
      {line(jx+80, jy+jh, jx+80, jy+jh/2+14, C.pe)}
      {line(jx+80, jy+jh/2+14, jx+jw-25, jy+jh/2+14, C.pe)}
      <Dot cx={jx+80} cy={jy+jh/2+14} color={C.pe} />
      {/* L(упр) от выключателя → к лампе */}
      {line(jx+30, jy+jh/2+12, jx+jw-30, jy+jh/2-14, C.sw)}
      <Dot cx={jx+jw-30} cy={jy+jh/2-14} color={C.sw} />

      <Wago x={jx+30} y={jy+20} label="L" color={C.l} />
      <Wago x={jx+55} y={jy+jh/2} label="N" color={C.n} />
      <Wago x={jx+80} y={jy+jh/2+14} label="PE" color={C.pe} />
      <WireLegend x={30} y={330} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
//  2. ДВУХКЛАВИШНЫЙ ВЫКЛЮЧАТЕЛЬ
// ══════════════════════════════════════════════════════════
export const SvgTwoKeySwitch: React.FC = () => {
  const jx=200, jy=90, jw=160, jh=110, swX=60, lamp1X=460, lamp2X=460, feedY=280
  const lamp1Y=jy+jh/2-30, lamp2Y=jy+jh/2+30
  return (
    <svg viewBox="0 0 560 350" className="w-full h-auto" fill="none" style={{background:'var(--bg-surface)'}}>
      {line(270, feedY, 270, jy+jh, C.l)}
      {line(290, feedY, 290, jy+jh, C.n)}
      {line(310, feedY, 310, jy+jh, C.pe)}
      {txt(270, feedY+12, 'L', C.l, 9)} {txt(290, feedY+12, 'N', C.n, 9)} {txt(310, feedY+12, 'PE', C.pe, 9)}
      {txt(290, feedY+30, 'от щитка 220В', C.txtDim, 10)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <Switch2 x={swX} y={jy+jh/2} label="2-клавишный" />

      {/* L к выключателю */}
      {line(jx, jy+jh/2-22, swX+18, jy+jh/2-22, C.l)}
      {txt(swX+18+(jx-swX-18)/2, jy+jh/2-26, 'L', C.l, 8)}
      {/* упр1 от выключателя */}
      {line(jx, jy+jh/2-8, swX+18, jy+jh/2-8, C.sw)}
      {txt(swX+18+(jx-swX-18)/2, jy+jh/2-4, 'L1', C.sw, 8)}
      {/* упр2 от выключателя */}
      {line(jx, jy+jh/2+14, swX+18, jy+jh/2+14, C.sw)}

      {/* Лампа 1 */}
      <Lamp x={lamp1X} y={lamp1Y} />
      {line(jx+jw, jy+jh/2-30, lamp1X-14, jy+jh/2-30, C.sw)}
      {line(jx+jw, jy+jh/2-8, lamp1X-14, jy+jh/2-8, C.n)}
      {txt(jx+jw+(lamp1X-jx-jw)/2, jy+jh/2-34, 'L1', C.sw, 8)}

      {/* Лампа 2 */}
      <Lamp x={lamp2X} y={lamp2Y} />
      {line(jx+jw, jy+jh/2+8, lamp2X-14, jy+jh/2+8, C.sw)}
      {line(jx+jw, jy+jh/2+30, lamp2X-14, jy+jh/2+30, C.sw)}

      {/* N + PE общие */}
      {line(jx+jw, jy+jh/2-8, lamp1X-14, jy+jh/2-8, C.n)}
      {line(jx+jw, jy+jh/2+8, lamp2X-14, jy+jh/2+8, C.n)}
      {line(jx+jw, jy+jh/2+30, lamp2X-14, jy+jh/2+30, C.pe)}

      {/* N магистраль */}
      {line(jx+50, jy+jh, jx+50, jy+jh/2-8, C.n)}
      {line(jx+50, jy+jh/2-8, jx+jw-40, jy+jh/2-8, C.n)}
      {line(jx+jw-40, jy+jh/2-8, jx+jw-40, jy+jh/2+8, C.n)}
      <Dot cx={jx+50} cy={jy+jh/2-8} color={C.n} />
      <Dot cx={jx+jw-40} cy={jy+jh/2+8} color={C.n} />

      {/* PE магистраль */}
      {line(jx+80, jy+jh, jx+80, jy+jh/2+30, C.pe)}
      {line(jx+80, jy+jh/2+30, jx+jw-25, jy+jh/2+30, C.pe)}
      <Dot cx={jx+80} cy={jy+jh/2+30} color={C.pe} />

      {/* L в коробке */}
      {line(jx+25, jy+20, jx+25, jy+jh/2-22, C.l)}
      <Dot cx={jx+25} cy={jy+20} color={C.l} />

      {/* упр линии в коробке */}
      {line(jx+25, jy+jh/2-8, jx+jw-55, jy+jh/2-30, C.sw)}
      <Dot cx={jx+jw-55} cy={jy+jh/2-30} color={C.sw} />
      {line(jx+25, jy+jh/2+14, jx+jw-55, jy+jh/2+8, C.sw)}
      <Dot cx={jx+jw-55} cy={jy+jh/2+8} color={C.sw} />

      <Wago x={jx+25} y={jy+20} label="L" color={C.l} />
      <Wago x={jx+50} y={jy+jh/2-8} label="N" color={C.n} />
      <Wago x={jx+80} y={jy+jh/2+30} label="PE" color={C.pe} />
      <WireLegend x={30} y={330} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
//  3. ТРЁХКЛАВИШНЫЙ ВЫКЛЮЧАТЕЛЬ
// ══════════════════════════════════════════════════════════
export const SvgThreeKeySwitch: React.FC = () => {
  const jx=200, jy=80, jw=170, jh=130, swX=50
  const lampYs=[jy+jh/2-40, jy+jh/2, jy+jh/2+40], lampX=470, feedY=290
  return (
    <svg viewBox="0 0 570 370" className="w-full h-auto" fill="none" style={{background:'var(--bg-surface)'}}>
      {line(270, feedY, 270, jy+jh, C.l)}
      {line(290, feedY, 290, jy+jh, C.n)}
      {line(310, feedY, 310, jy+jh, C.pe)}
      {txt(270, feedY+12, 'L', C.l, 9)} {txt(290, feedY+12, 'N', C.n, 9)} {txt(310, feedY+12, 'PE', C.pe, 9)}
      {txt(290, feedY+30, 'от щитка 220В', C.txtDim, 10)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <Switch3 x={swX} y={jy+jh/2} label="3-клавишный" />

      {/* L к выключателю */}
      {line(jx, jy+jh/2-30, swX+20, jy+jh/2-30, C.l)}
      {txt(swX+20+(jx-swX-20)/2, jy+jh/2-34, 'L', C.l, 8)}
      {/* 3 упр линии */}
      {line(jx, jy+jh/2-12, swX+20, jy+jh/2-12, C.sw)}
      {line(jx, jy+jh/2+4, swX+20, jy+jh/2+4, C.sw)}
      {line(jx, jy+jh/2+20, swX+20, jy+jh/2+20, C.sw)}

      {/* 3 лампы */}
      {lampYs.map((ly, i) => (<Lamp key={i} x={lampX} y={ly} />))}
      {lampYs.map((ly, i) => line(jx+jw, ly, lampX-14, ly, C.sw))}
      {txt(jx+jw+(lampX-jx-jw)/2, lampYs[0]-4, 'L1', C.sw, 8)}
      {txt(jx+jw+(lampX-jx-jw)/2, lampYs[1]-4, 'L2', C.sw, 8)}
      {txt(jx+jw+(lampX-jx-jw)/2, lampYs[2]-4, 'L3', C.sw, 8)}

      {/* N + PE */}
      {line(jx+jw, jy+jh/2-40, lampX-14, jy+jh/2-40, C.n)}
      {line(jx+jw, jy+jh/2, lampX-14, jy+jh/2, C.n)}
      {line(jx+jw, jy+jh/2+40, lampX-14, jy+jh/2+40, C.n)}
      {line(jx+jw, jy+jh/2+40, lampX-14, jy+jh/2+40, C.pe)}

      {/* Внутри коробки */}
      {line(jx+25, jy+20, jx+25, jy+jh/2-30, C.l)}
      <Dot cx={jx+25} cy={jy+20} color={C.l} />
      {line(jx+50, jy+jh, jx+50, jy+jh/2-40, C.n)}
      {line(jx+50, jy+jh/2-40, jx+jw-40, jy+jh/2-40, C.n)}
      <Dot cx={jx+50} cy={jy+jh/2-40} color={C.n} />
      {line(jx+80, jy+jh, jx+80, jy+jh/2+40, C.pe)}
      {line(jx+80, jy+jh/2+40, jx+jw-25, jy+jh/2+40, C.pe)}
      <Dot cx={jx+80} cy={jy+jh/2+40} color={C.pe} />

      {/* упр в коробке */}
      {[0,1,2].map(i => {
        const fromY = jy+jh/2-12 + i*16
        const toY = lampYs[i]
        return <React.Fragment key={i}>{line(jx+25, fromY, jx+jw-50, toY, C.sw)}<Dot cx={jx+jw-50} cy={toY} color={C.sw} /></React.Fragment>
      })}

      <Wago x={jx+25} y={jy+20} label="L" color={C.l} />
      <Wago x={jx+50} y={jy+jh/2-40} label="N" color={C.n} />
      <Wago x={jx+80} y={jy+jh/2+40} label="PE" color={C.pe} />
      <WireLegend x={30} y={345} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
//  4. ПРОХОДНОЙ — 2 ТОЧКИ
// ══════════════════════════════════════════════════════════
export const SvgPassThrough2: React.FC = () => {
  const jx=220, jy=100, jw=150, jh=110, sw1X=60, sw2X=500, lampX=620, feedY=290
  return (
    <svg viewBox="0 0 700 360" className="w-full h-auto" fill="none" style={{background:'var(--bg-surface)'}}>
      {line(300, feedY, 300, jy+jh, C.l)}
      {line(320, feedY, 320, jy+jh, C.n)}
      {line(340, feedY, 340, jy+jh, C.pe)}
      {txt(300, feedY+12, 'L', C.l, 9)} {txt(320, feedY+12, 'N', C.n, 9)} {txt(340, feedY+12, 'PE', C.pe, 9)}
      {txt(320, feedY+30, 'от щитка 220В', C.txtDim, 10)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <PassSwitch x={sw1X} y={jy+jh/2} label="Проходной S1" />
      <PassSwitch x={sw2X} y={jy+jh/2} label="Проходной S2" />

      {/* L из коробки к S1 */}
      {line(jx, jy+jh/2-20, sw1X+15, jy+jh/2-20, C.l)}
      {txt(sw1X+15+(jx-sw1X-15)/2, jy+jh/2-24, 'L', C.l, 8)}
      {/* 2 параллельные линии между выключателями */}
      {line(jx, jy+jh/2-10, sw1X+15, jy+jh/2-10, C.sw)}
      {line(sw1X+15, jy+jh/2-10, sw2X-15, jy+jh/2-10, C.sw)}
      {line(sw1X+15, jy+jh/2+8, sw2X-15, jy+jh/2+8, C.sw)}
      {line(sw2X-15, jy+jh/2-10, jx+jw, jy+jh/2-10, C.sw)}
      {txt(sw1X+15+(sw2X-sw1X-30)/2, jy+jh/2-16, 'P1', C.sw, 8)}
      {txt(sw1X+15+(sw2X-sw1X-30)/2, jy+jh/2+2, 'P2', C.sw, 8)}

      {/* S1 → S2 через коробку */}
      {/* L(упр) от S2 к лампе */}
      {line(jx+jw, jy+jh/2-10, lampX-14, jy+jh/2-10, C.sw)}

      <Lamp x={lampX} y={jy+jh/2} />
      {line(jx+jw, jy+jh/2, lampX-14, jy+jh/2, C.n)}
      {line(jx+jw, jy+jh/2+14, lampX-14, jy+jh/2+14, C.pe)}

      {/* Внутри коробки */}
      {line(jx+30, jy+20, jx+30, jy+jh/2-20, C.l)}
      <Dot cx={jx+30} cy={jy+20} color={C.l} />
      {/* L в коробке → соединение с P1 */}
      {line(jx+30, jy+jh/2-20, jx+50, jy+jh/2-10, C.l)}
      <Dot cx={jx+50} cy={jy+jh/2-10} color={C.l} />
      {/* P2 проходит насквозь */}
      {line(jx+50, jy+jh/2+8, jx+jw-50, jy+jh/2+8, C.sw)}
      <Dot cx={jx+jw-50} cy={jy+jh/2-10} color={C.sw} />
      {/* P1 → к лампе */}
      {line(jx+jw-50, jy+jh/2-10, jx+jw-20, jy+jh/2-10, C.sw)}
      <Dot cx={jx+jw-20} cy={jy+jh/2-10} color={C.sw} />
      {/* N */}
      {line(jx+60, jy+jh, jx+60, jy+jh/2, C.n)}
      {line(jx+60, jy+jh/2, jx+jw-40, jy+jh/2, C.n)}
      <Dot cx={jx+60} cy={jy+jh/2} color={C.n} />
      {/* PE */}
      {line(jx+85, jy+jh, jx+85, jy+jh/2+14, C.pe)}
      {line(jx+85, jy+jh/2+14, jx+jw-25, jy+jh/2+14, C.pe)}
      <Dot cx={jx+85} cy={jy+jh/2+14} color={C.pe} />

      <Wago x={jx+30} y={jy+20} label="L" color={C.l} />
      <Wago x={jx+60} y={jy+jh/2} label="N" color={C.n} />
      <Wago x={jx+85} y={jy+jh/2+14} label="PE" color={C.pe} />
      <Wago x={jx+50} y={jy+jh/2-10} label="P1" color={C.sw} />
      <Wago x={jx+jw-20} y={jy+jh/2-10} label="L(упр)" color={C.sw} />
      <WireLegend x={30} y={340} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
//  5. ПРОХОДНОЙ + ПЕРЕКРЁСТНЫЙ — 3 ТОЧКИ
// ══════════════════════════════════════════════════════════
export const SvgPassThrough3: React.FC = () => {
  const jx=220, jy=90, jw=160, jh=120, sw1X=50, crossX=360, sw2X=500, lampX=620, feedY=290
  return (
    <svg viewBox="0 0 710 370" className="w-full h-auto" fill="none" style={{background:'var(--bg-surface)'}}>
      {line(300, feedY, 300, jy+jh, C.l)}
      {line(320, feedY, 320, jy+jh, C.n)}
      {line(340, feedY, 340, jy+jh, C.pe)}
      {txt(300, feedY+12, 'L', C.l, 9)} {txt(320, feedY+12, 'N', C.n, 9)} {txt(340, feedY+12, 'PE', C.pe, 9)}
      {txt(320, feedY+30, 'от щитка 220В', C.txtDim, 10)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <PassSwitch x={sw1X} y={jy+jh/2} label="Проходной S1" />
      <CrossSwitch x={crossX} y={jy+jh/2} label="Перекрёстный S2" />
      <PassSwitch x={sw2X} y={jy+jh/2} label="Проходной S3" />

      {/* L → S1 */}
      {line(jx, jy+jh/2-20, sw1X+15, jy+jh/2-20, C.l)}
      {/* S1 → cross */}
      {line(sw1X+15, jy+jh/2-10, crossX-15, jy+jh/2-10, C.sw)}
      {line(sw1X+15, jy+jh/2+8, crossX-15, jy+jh/2+8, C.sw)}
      {/* cross → S3 */}
      {line(crossX+15, jy+jh/2-10, sw2X-15, jy+jh/2-10, C.sw)}
      {line(crossX+15, jy+jh/2+8, sw2X-15, jy+jh/2+8, C.sw)}
      {/* S3 → лампа */}
      {line(sw2X+15, jy+jh/2-10, jx+jw, jy+jh/2-10, C.sw)}

      {/* Лампа */}
      <Lamp x={lampX} y={jy+jh/2} />
      {line(jx+jw, jy+jh/2, lampX-14, jy+jh/2, C.n)}
      {line(jx+jw, jy+jh/2+14, lampX-14, jy+jh/2+14, C.pe)}

      {/* N+PE через коробку */}
      {/* Внутри коробки — простая разводка */}
      {line(jx+30, jy+20, jx+30, jy+jh/2-20, C.l)}
      <Dot cx={jx+30} cy={jy+20} color={C.l} />
      {line(jx+30, jy+jh/2-20, jx+55, jy+jh/2-10, C.l)}
      <Dot cx={jx+55} cy={jy+jh/2-10} color={C.l} />
      {line(jx+55, jy+jh/2-10, jx+jw-30, jy+jh/2-10, C.sw)}
      <Dot cx={jx+jw-30} cy={jy+jh/2-10} color={C.sw} />

      {line(jx+55, jy+jh, jx+55, jy+jh/2, C.n)}
      {line(jx+55, jy+jh/2, jx+jw-40, jy+jh/2, C.n)}
      <Dot cx={jx+55} cy={jy+jh/2} color={C.n} />

      {line(jx+80, jy+jh, jx+80, jy+jh/2+14, C.pe)}
      {line(jx+80, jy+jh/2+14, jx+jw-25, jy+jh/2+14, C.pe)}
      <Dot cx={jx+80} cy={jy+jh/2+14} color={C.pe} />

      <Wago x={jx+30} y={jy+20} label="L" color={C.l} />
      <Wago x={jx+55} y={jy+jh/2} label="N" color={C.n} />
      <Wago x={jx+80} y={jy+jh/2+14} label="PE" color={C.pe} />
      <Wago x={jx+55} y={jy+jh/2-10} label="P1" color={C.sw} />
      <WireLegend x={30} y={345} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
//  6. ДВА ПЕРЕКРЁСТНЫХ — 4 ТОЧКИ
// ══════════════════════════════════════════════════════════
export const SvgPassThrough4: React.FC = () => {
  const jx=220, jy=90, jw=170, jh=120, sw1X=40, cross1X=320, cross2X=440, sw2X=540, lampX=650, feedY=290
  return (
    <svg viewBox="0 0 740 370" className="w-full h-auto" fill="none" style={{background:'var(--bg-surface)'}}>
      {line(310, feedY, 310, jy+jh, C.l)}
      {line(330, feedY, 330, jy+jh, C.n)}
      {line(350, feedY, 350, jy+jh, C.pe)}
      {txt(310, feedY+12, 'L', C.l, 9)} {txt(330, feedY+12, 'N', C.n, 9)} {txt(350, feedY+12, 'PE', C.pe, 9)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <PassSwitch x={sw1X} y={jy+jh/2} label="S1" />
      <CrossSwitch x={cross1X} y={jy+jh/2} label="S2✕" />
      <CrossSwitch x={cross2X} y={jy+jh/2} label="S3✕" />
      <PassSwitch x={sw2X} y={jy+jh/2} label="S4" />

      {line(jx, jy+jh/2-20, sw1X+15, jy+jh/2-20, C.l)}
      {line(sw1X+15, jy+jh/2-10, sw2X-15, jy+jh/2-10, C.sw)}
      {line(sw1X+15, jy+jh/2+8, sw2X-15, jy+jh/2+8, C.sw)}
      {line(sw2X+15, jy+jh/2-10, jx+jw, jy+jh/2-10, C.sw)}

      <Lamp x={lampX} y={jy+jh/2} />
      {line(jx+jw, jy+jh/2, lampX-14, jy+jh/2, C.n)}
      {line(jx+jw, jy+jh/2+14, lampX-14, jy+jh/2+14, C.pe)}

      {line(jx+25, jy+20, jx+25, jy+jh/2-20, C.l)}
      <Dot cx={jx+25} cy={jy+20} color={C.l} />
      {line(jx+25, jy+jh/2-20, jx+50, jy+jh/2-10, C.l)}
      <Dot cx={jx+50} cy={jy+jh/2-10} color={C.l} />
      {line(jx+50, jy+jh/2-10, jx+jw-30, jy+jh/2-10, C.sw)}
      <Dot cx={jx+jw-30} cy={jy+jh/2-10} color={C.sw} />

      {line(jx+50, jy+jh, jx+50, jy+jh/2, C.n)}
      {line(jx+50, jy+jh/2, jx+jw-40, jy+jh/2, C.n)}
      <Dot cx={jx+50} cy={jy+jh/2} color={C.n} />
      {line(jx+75, jy+jh, jx+75, jy+jh/2+14, C.pe)}
      {line(jx+75, jy+jh/2+14, jx+jw-25, jy+jh/2+14, C.pe)}
      <Dot cx={jx+75} cy={jy+jh/2+14} color={C.pe} />

      <Wago x={jx+25} y={jy+20} label="L" color={C.l} />
      <Wago x={jx+50} y={jy+jh/2} label="N" color={C.n} />
      <Wago x={jx+75} y={jy+jh/2+14} label="PE" color={C.pe} />
      <Wago x={jx+50} y={jy+jh/2-10} label="P1" color={C.sw} />
      <WireLegend x={30} y={345} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
//  7. ДВУХКЛАВИШНЫЙ ПРОХОДНОЙ (2 группы, 2 точки)
// ══════════════════════════════════════════════════════════
export const SvgDualPassThrough: React.FC = () => {
  const jx=220, jy=80, jw=170, jh=140, sw1X=40, sw2X=510, lamp1X=630, lamp2X=630
  const lamp1Y=jy+jh/2-35, lamp2Y=jy+jh/2+35
  return (
    <svg viewBox="0 0 730 380" className="w-full h-auto" fill="none" style={{background:'var(--bg-surface)'}}>
      {line(300, 310, 300, jy+jh, C.l)}
      {line(320, 310, 320, jy+jh, C.n)}
      {line(340, 310, 340, jy+jh, C.pe)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <Switch2 x={sw1X} y={lamp1Y} label="S1 (гр.A)" />
      <Switch2 x={sw1X} y={lamp2Y} label="S1 (гр.B)" />
      <Switch2 x={sw2X} y={lamp1Y} label="S2 (гр.A)" />
      <Switch2 x={sw2X} y={lamp2Y} label="S2 (гр.B)" />

      {/* Группа A */}
      {line(jx, lamp1Y-12, sw1X+18, lamp1Y-12, C.l)}
      {line(sw1X+18, lamp1Y-18, sw2X-18, lamp1Y-18, C.sw)}
      {line(sw1X+18, lamp1Y+6, sw2X-18, lamp1Y+6, C.sw)}
      {line(sw2X-18, lamp1Y-18, jx+jw, lamp1Y-18, C.sw)}

      {/* Группа B */}
      {line(jx, lamp2Y-12, sw1X+18, lamp2Y-12, C.l)}
      {line(sw1X+18, lamp2Y-18, sw2X-18, lamp2Y-18, C.sw)}
      {line(sw1X+18, lamp2Y+6, sw2X-18, lamp2Y+6, C.sw)}
      {line(sw2X-18, lamp2Y-18, jx+jw, lamp2Y-18, C.sw)}

      <Lamp x={lamp1X} y={lamp1Y} />
      <Lamp x={lamp2X} y={lamp2Y} />
      {line(jx+jw, lamp1Y, lamp1X-14, lamp1Y, C.n)}
      {line(jx+jw, lamp2Y, lamp2X-14, lamp2Y, C.n)}
      {line(jx+jw, lamp1Y+14, lamp1X-14, lamp1Y+14, C.pe)}
      {line(jx+jw, lamp2Y+14, lamp2X-14, lamp2Y+14, C.pe)}

      {/* Внутри */}
      {line(jx+25, jy+20, jx+25, lamp1Y-12, C.l)}
      <Dot cx={jx+25} cy={jy+20} color={C.l} />
      {line(jx+25, lamp1Y-12, jx+25, lamp2Y-12, C.l)}
      <Dot cx={jx+25} cy={lamp2Y-12} color={C.l} />

      {line(jx+50, jy+jh, jx+50, jy+jh/2, C.n)}
      {line(jx+50, jy+jh/2, jx+jw-40, jy+jh/2, C.n)}
      <Dot cx={jx+50} cy={jy+jh/2} color={C.n} />
      {line(jx+80, jy+jh, jx+80, jy+jh/2+35, C.pe)}
      {line(jx+80, jy+jh/2+35, jx+jw-25, jy+jh/2+35, C.pe)}
      <Dot cx={jx+80} cy={jy+jh/2+35} color={C.pe} />

      <Wago x={jx+25} y={jy+20} label="L" color={C.l} />
      <Wago x={jx+50} y={jy+jh/2} label="N" color={C.n} />
      <Wago x={jx+80} y={jy+jh/2+35} label="PE" color={C.pe} />
      <WireLegend x={30} y={360} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
//  8. ИМПУЛЬСНОЕ РЕЛЕ (бистабильное)
// ══════════════════════════════════════════════════════════
export const SvgImpulseRelay: React.FC = () => {
  const jx=200, jy=90, jw=160, jh=120, btnX=60, lampX=460, feedY=280
  return (
    <svg viewBox="0 0 560 360" className="w-full h-auto" fill="none" style={{background:'var(--bg-surface)'}}>
      {line(270, feedY, 270, jy+jh, C.l)}
      {line(290, feedY, 290, jy+jh, C.n)}
      {line(310, feedY, 310, jy+jh, C.pe)}
      {txt(270, feedY+12, 'L', C.l, 9)} {txt(290, feedY+12, 'N', C.n, 9)} {txt(310, feedY+12, 'PE', C.pe, 9)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      {/* Кнопка */}
      <g>
        <rect x={btnX-15} y={jy+jh/2-18} width="30" height="40" rx="4" stroke={C.txtDim} strokeWidth="1.5" fill="none" />
        <circle cx={btnX} cy={jy+jh/2} r="4" fill={C.txt} />
        <text x={btnX} y={jy+jh/2+32} textAnchor="middle" fontSize="9" fill={C.txtDim}>Кнопка</text>
      </g>
      {/* Импульсное реле */}
      <g>
        <rect x={370} y={jy+jh/2-25} width="50" height="50" rx="6" stroke={C.amber} strokeWidth="2" fill={C.glow} />
        <text x={395} y={jy+jh/2-6} textAnchor="middle" fontSize="9" fill={C.amber}>Имп.</text>
        <text x={395} y={jy+jh/2+6} textAnchor="middle" fontSize="9" fill={C.amber}>реле</text>
      </g>

      {line(jx, jy+jh/2-20, btnX+15, jy+jh/2-20, C.l)}
      {line(jx, jy+jh/2+6, btnX+15, jy+jh/2+6, C.l)}
      {txt(btnX+15+(jx-btnX-15)/2, jy+jh/2-24, 'L', C.l, 8)}

      {line(jx, jy+jh/2-20, 370, jy+jh/2-20, C.sw)}
      {line(btnX+15, jy+jh/2+6, 370, jy+jh/2+6, C.l)}
      {line(420, jy+jh/2-20, jx+jw, jy+jh/2-20, C.sw)}

      <Lamp x={lampX} y={jy+jh/2} />
      {line(jx+jw, jy+jh/2, lampX-14, jy+jh/2, C.n)}
      {line(jx+jw, jy+jh/2+14, lampX-14, jy+jh/2+14, C.pe)}

      {/* Внутри */}
      {line(jx+25, jy+20, jx+25, jy+jh/2-20, C.l)}
      <Dot cx={jx+25} cy={jy+20} color={C.l} />
      {line(jx+25, jy+jh/2-20, jx+50, jy+jh/2-20, C.l)}
      <Dot cx={jx+50} cy={jy+jh/2-20} color={C.l} />
      {line(jx+50, jy+jh/2-20, jx+jw-30, jy+jh/2-20, C.sw)}
      <Dot cx={jx+jw-30} cy={jy+jh/2-20} color={C.sw} />

      {line(jx+50, jy+jh, jx+50, jy+jh/2, C.n)}
      {line(jx+50, jy+jh/2, jx+jw-40, jy+jh/2, C.n)}
      <Dot cx={jx+50} cy={jy+jh/2} color={C.n} />
      {line(jx+75, jy+jh, jx+75, jy+jh/2+14, C.pe)}
      {line(jx+75, jy+jh/2+14, jx+jw-25, jy+jh/2+14, C.pe)}
      <Dot cx={jx+75} cy={jy+jh/2+14} color={C.pe} />

      <Wago x={jx+25} y={jy+20} label="L" color={C.l} />
      <Wago x={jx+50} y={jy+jh/2} label="N" color={C.n} />
      <Wago x={jx+75} y={jy+jh/2+14} label="PE" color={C.pe} />
      <WireLegend x={30} y={340} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
//  9. ДИММЕР
// ══════════════════════════════════════════════════════════
export const SvgDimmer: React.FC = () => {
  const jx=200, jy=100, jw=140, jh=100, dimX=60, lampX=440, feedY=280
  return (
    <svg viewBox="0 0 550 350" className="w-full h-auto" fill="none" style={{background:'var(--bg-surface)'}}>
      {line(270, feedY, 270, jy+jh, C.l)}
      {line(290, feedY, 290, jy+jh, C.n)}
      {line(310, feedY, 310, jy+jh, C.pe)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      {/* Диммер */}
      <g>
        <rect x={dimX-18} y={jy+jh/2-22} width="36" height="48" rx="6" stroke={C.amber} strokeWidth="2" fill={C.glow} />
        <line x1={dimX} y1={jy+jh/2-12} x2={dimX} y2={jy+jh/2+12} stroke={C.amber} strokeWidth="2" />
        <polyline points={`${dimX-8},${jy+jh/2-4} ${dimX},${jy+jh/2-12} ${dimX+8},${jy+jh/2-4}`} stroke={C.amber} strokeWidth="1.5" fill="none" />
        <polyline points={`${dimX-8},${jy+jh/2+4} ${dimX},${jy+jh/2+12} ${dimX+8},${jy+jh/2+4}`} stroke={C.amber} strokeWidth="1.5" fill="none" />
        <text x={dimX} y={jy+jh/2+36} textAnchor="middle" fontSize="9" fill={C.amber}>Диммер</text>
      </g>

      {line(jx, jy+jh/2-12, dimX+18, jy+jh/2-12, C.l)}
      {txt(dimX+18+(jx-dimX-18)/2, jy+jh/2-16, 'L', C.l, 8)}
      {line(jx, jy+jh/2+12, dimX+18, jy+jh/2+12, C.sw)}

      <Lamp x={lampX} y={jy+jh/2} />
      {line(jx+jw, jy+jh/2-14, lampX-14, jy+jh/2-14, C.sw)}
      {line(jx+jw, jy+jh/2, lampX-14, jy+jh/2, C.n)}
      {line(jx+jw, jy+jh/2+14, lampX-14, jy+jh/2+14, C.pe)}

      {line(jx+25, jy+20, jx+25, jy+jh/2-12, C.l)}
      <Dot cx={jx+25} cy={jy+20} color={C.l} />
      {line(jx+50, jy+jh, jx+50, jy+jh/2, C.n)}
      {line(jx+50, jy+jh/2, jx+jw-40, jy+jh/2, C.n)}
      <Dot cx={jx+50} cy={jy+jh/2} color={C.n} />
      {line(jx+75, jy+jh, jx+75, jy+jh/2+14, C.pe)}
      {line(jx+75, jy+jh/2+14, jx+jw-25, jy+jh/2+14, C.pe)}
      <Dot cx={jx+75} cy={jy+jh/2+14} color={C.pe} />
      {line(jx+25, jy+jh/2+12, jx+jw-30, jy+jh/2-14, C.sw)}
      <Dot cx={jx+jw-30} cy={jy+jh/2-14} color={C.sw} />

      <Wago x={jx+25} y={jy+20} label="L" color={C.l} />
      <Wago x={jx+50} y={jy+jh/2} label="N" color={C.n} />
      <Wago x={jx+75} y={jy+jh/2+14} label="PE" color={C.pe} />
      <WireLegend x={30} y={330} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
// 10. ВЫКЛЮЧАТЕЛЬ С ПОДСВЕТКОЙ
// ══════════════════════════════════════════════════════════
export const SvgSwitchWithIndicator: React.FC = () => {
  const jx=200, jy=100, jw=140, jh=100, swX=70, lampX=440, feedY=280
  return (
    <svg viewBox="0 0 550 350" className="w-full h-auto" fill="none" style={{background:'var(--bg-surface)'}}>
      {line(270, feedY, 270, jy+jh, C.l)}
      {line(290, feedY, 290, jy+jh, C.n)}
      {line(310, feedY, 310, jy+jh, C.pe)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      {/* Выключатель с подсветкой */}
      <g>
        <rect x={swX-15} y={jy+jh/2-18} width="30" height="40" rx="4" stroke={C.txtDim} strokeWidth="1.5" fill="none" />
        <line x1={swX} y1={jy+jh/2-5} x2={swX} y2={jy+jh/2+5} stroke={C.txt} strokeWidth="2" />
        <line x1={swX-6} y1={jy+jh/2-5} x2={swX+6} y2={jy+jh/2-5} stroke={C.txt} strokeWidth="2" />
        {/* неонка */}
        <circle cx={swX+10} cy={jy+jh/2-12} r="3" fill={C.amber} opacity="0.8" />
        <text x={swX} y={jy+jh/2+32} textAnchor="middle" fontSize="9" fill={C.txtDim}>С подсветкой</text>
      </g>

      {line(jx, jy+jh/2-12, swX+15, jy+jh/2-12, C.l)}
      {line(jx, jy+jh/2+12, swX+15, jy+jh/2+12, C.sw)}
      {/* N на подсветку */}
      {line(swX+15, jy+jh/2-12, swX+10, jy+jh/2-12, C.n)}

      <Lamp x={lampX} y={jy+jh/2} />
      {line(jx+jw, jy+jh/2-14, lampX-14, jy+jh/2-14, C.sw)}
      {line(jx+jw, jy+jh/2, lampX-14, jy+jh/2, C.n)}
      {line(jx+jw, jy+jh/2+14, lampX-14, jy+jh/2+14, C.pe)}

      {line(jx+25, jy+20, jx+25, jy+jh/2-12, C.l)}
      <Dot cx={jx+25} cy={jy+20} color={C.l} />
      {line(jx+50, jy+jh, jx+50, jy+jh/2, C.n)}
      {line(jx+50, jy+jh/2, jx+jw-40, jy+jh/2, C.n)}
      <Dot cx={jx+50} cy={jy+jh/2} color={C.n} />
      {line(jx+75, jy+jh, jx+75, jy+jh/2+14, C.pe)}
      {line(jx+75, jy+jh/2+14, jx+jw-25, jy+jh/2+14, C.pe)}
      <Dot cx={jx+75} cy={jy+jh/2+14} color={C.pe} />
      {line(jx+25, jy+jh/2+12, jx+jw-30, jy+jh/2-14, C.sw)}
      <Dot cx={jx+jw-30} cy={jy+jh/2-14} color={C.sw} />

      <Wago x={jx+25} y={jy+20} label="L" color={C.l} />
      <Wago x={jx+50} y={jy+jh/2} label="N" color={C.n} />
      <Wago x={jx+75} y={jy+jh/2+14} label="PE" color={C.pe} />
      <WireLegend x={30} y={330} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
// 11. ДАТЧИК ДВИЖЕНИЯ
// ══════════════════════════════════════════════════════════
export const SvgMotionSensor: React.FC = () => {
  const jx=200, jy=90, jw=150, jh=120, senX=50, lampX=460, feedY=290
  return (
    <svg viewBox="0 0 570 370" className="w-full h-auto" fill="none" style={{background:'var(--bg-surface)'}}>
      {line(275, feedY, 275, jy+jh, C.l)}
      {line(295, feedY, 295, jy+jh, C.n)}
      {line(315, feedY, 315, jy+jh, C.pe)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      {/* Датчик движения */}
      <g>
        <rect x={senX-18} y={jy+jh/2-22} width="36" height="48" rx="6" stroke={C.amber} strokeWidth="2" fill={C.glow} />
        <path d={`M${senX-8} ${jy+jh/2+6} L${senX} ${jy+jh/2-10} L${senX+8} ${jy+jh/2+6} Z`} stroke={C.amber} strokeWidth="1.5" fill="none" />
        <circle cx={senX} cy={jy+jh/2-14} r="3" fill={C.amber} />
        <text x={senX} y={jy+jh/2+36} textAnchor="middle" fontSize="9" fill={C.amber}>Датчик</text>
        <text x={senX} y={jy+jh/2+46} textAnchor="middle" fontSize="9" fill={C.amber}>движения</text>
      </g>

      {line(jx, jy+jh/2-20, senX+18, jy+jh/2-20, C.l)}
      {txt(senX+18+(jx-senX-18)/2, jy+jh/2-24, 'L', C.l, 8)}
      {line(jx, jy+jh/2+6, senX+18, jy+jh/2+6, C.sw)}
      {line(senX+18, jy+jh/2-20, jx+jw, jy+jh/2-20, C.sw)}

      <Lamp x={lampX} y={jy+jh/2} />
      {line(jx+jw, jy+jh/2, lampX-14, jy+jh/2, C.n)}
      {line(jx+jw, jy+jh/2+14, lampX-14, jy+jh/2+14, C.pe)}

      {line(jx+25, jy+20, jx+25, jy+jh/2-20, C.l)}
      <Dot cx={jx+25} cy={jy+20} color={C.l} />
      {line(jx+25, jy+jh/2-20, jx+50, jy+jh/2-20, C.l)}
      <Dot cx={jx+50} cy={jy+jh/2-20} color={C.l} />
      {line(jx+50, jy+jh/2-20, jx+jw-30, jy+jh/2-20, C.sw)}
      <Dot cx={jx+jw-30} cy={jy+jh/2-20} color={C.sw} />
      {line(jx+50, jy+jh, jx+50, jy+jh/2, C.n)}
      {line(jx+50, jy+jh/2, jx+jw-40, jy+jh/2, C.n)}
      <Dot cx={jx+50} cy={jy+jh/2} color={C.n} />
      {line(jx+75, jy+jh, jx+75, jy+jh/2+14, C.pe)}
      {line(jx+75, jy+jh/2+14, jx+jw-25, jy+jh/2+14, C.pe)}
      <Dot cx={jx+75} cy={jy+jh/2+14} color={C.pe} />

      <Wago x={jx+25} y={jy+20} label="L" color={C.l} />
      <Wago x={jx+50} y={jy+jh/2} label="N" color={C.n} />
      <Wago x={jx+75} y={jy+jh/2+14} label="PE" color={C.pe} />
      <WireLegend x={30} y={345} />
    </svg>
  )
}// ══════════════════════════════════════════════════════════
// 12. СУМЕРЕЧНЫЙ ВЫКЛЮЧАТЕЛЬ (ФОТОРЕЛЕ)
// ══════════════════════════════════════════════════════════
export const SvgTwilightSwitch: React.FC = () => {
  const jx=200, jy=90, jw=150, jh=110, phX=60, lampX=470, feedY=280
  return (
    <svg viewBox="0 0 580 360" className="w-full h-auto" fill="none" style={{background:"var(--bg-surface)"}}>
      {line(275, feedY, 275, jy+jh, C.l)}
      {line(295, feedY, 295, jy+jh, C.n)}
      {line(315, feedY, 315, jy+jh, C.pe)}
      {txt(275, feedY+12, 'L', C.l, 9)} {txt(295, feedY+12, 'N', C.n, 9)} {txt(315, feedY+12, 'PE', C.pe, 9)}
      {txt(295, feedY+30, 'от щитка 220В', C.txtDim, 10)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      {/* Фотореле */}
      <g>
        <rect x={phX-18} y={jy+jh/2-24} width="36" height="52" rx="6" stroke={C.amber} strokeWidth="2" fill={C.glow} />
        <circle cx={phX} cy={jy+jh/2-12} r="6" stroke={C.amber} strokeWidth="1.5" fill="none" />
        <line x1={phX-3} y1={jy+jh/2-12} x2={phX+3} y2={jy+jh/2-12} stroke={C.amber} strokeWidth="1.5" />
        <line x1={phX} y1={jy+jh/2-15} x2={phX} y2={jy+jh/2-9} stroke={C.amber} strokeWidth="1.5" />
        <path d={`M${phX-10} ${jy+jh/2+2} L${phX+10} ${jy+jh/2+2}`} stroke={C.amber} strokeWidth="1" />
        <path d={`M${phX-7} ${jy+jh/2+6} L${phX+7} ${jy+jh/2+6}`} stroke={C.amber} strokeWidth="1" />
        <text x={phX} y={jy+jh/2+36} textAnchor="middle" fontSize="9" fill={C.amber}>Фотореле</text>
      </g>

      {line(jx, jy+jh/2-14, phX+18, jy+jh/2-14, C.l)}
      {txt(phX+18+(jx-phX-18)/2, jy+jh/2-18, 'L', C.l, 8)}
      {line(jx, jy+jh/2+8, phX+18, jy+jh/2+8, C.sw)}
      {txt(phX+18+(jx-phX-18)/2, jy+jh/2+20, 'L(упр)', C.sw, 8)}

      <Lamp x={lampX} y={jy+jh/2} />
      {line(jx+jw, jy+jh/2-14, lampX-14, jy+jh/2-14, C.sw)}
      {line(jx+jw, jy+jh/2, lampX-14, jy+jh/2, C.n)}
      {line(jx+jw, jy+jh/2+14, lampX-14, jy+jh/2+14, C.pe)}
      {txt(jx+jw+(lampX-jx-jw)/2, jy+jh/2-18, 'L(упр)', C.sw, 8)}
      {txt(jx+jw+(lampX-jx-jw)/2, jy+jh/2-4, 'N', C.n, 8)}
      {txt(jx+jw+(lampX-jx-jw)/2, jy+jh/2+26, 'PE', C.pe, 8)}

      {/* Внутри коробки */}
      {line(jx+25, jy+20, jx+25, jy+jh/2-14, C.l)}
      <Dot cx={jx+25} cy={jy+20} color={C.l} />
      {line(jx+50, jy+jh, jx+50, jy+jh/2, C.n)}
      {line(jx+50, jy+jh/2, jx+jw-45, jy+jh/2, C.n)}
      <Dot cx={jx+50} cy={jy+jh/2} color={C.n} />
      {line(jx+75, jy+jh, jx+75, jy+jh/2+14, C.pe)}
      {line(jx+75, jy+jh/2+14, jx+jw-25, jy+jh/2+14, C.pe)}
      <Dot cx={jx+75} cy={jy+jh/2+14} color={C.pe} />
      {line(jx+25, jy+jh/2+8, jx+jw-30, jy+jh/2-14, C.sw)}
      <Dot cx={jx+jw-30} cy={jy+jh/2-14} color={C.sw} />

      <Wago x={jx+25} y={jy+20} label="L" color={C.l} />
      <Wago x={jx+50} y={jy+jh/2} label="N" color={C.n} />
      <Wago x={jx+75} y={jy+jh/2+14} label="PE" color={C.pe} />
      <WireLegend x={30} y={340} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
// 13. РОЗЕТКА + ВЫКЛЮЧАТЕЛЬ (комбинированный блок)
// ══════════════════════════════════════════════════════════
export const SvgSocketSwitch: React.FC = () => {
  const jx=200, jy=80, jw=170, jh=130, swX=50, skX=50, lampX=480, feedY=290
  const swY=jy+jh/2-25, skY=jy+jh/2+30
  return (
    <svg viewBox="0 0 600 370" className="w-full h-auto" fill="none" style={{background:"var(--bg-surface)"}}>
      {line(280, feedY, 280, jy+jh, C.l)}
      {line(300, feedY, 300, jy+jh, C.n)}
      {line(320, feedY, 320, jy+jh, C.pe)}
      {txt(280, feedY+12, "L", C.l, 9)} {txt(300, feedY+12, "N", C.n, 9)} {txt(320, feedY+12, "PE", C.pe, 9)}
      {txt(300, feedY+30, "от щитка 220В", C.txtDim, 10)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      {/* Выключатель (сверху блока) */}
      <Switch1 x={swX} y={swY} label="Выключатель" />
      {/* Розетка (снизу блока) */}
      <Socket x={skX} y={skY} label="Розетка" />

      {/* L к выключателю */}
      {line(jx, swY-12, swX+15, swY-12, C.l)}
      {txt(swX+15+(jx-swX-15)/2, swY-16, "L", C.l, 8)}
      {/* L к розетке */}
      {line(jx, skY-12, skX+16, skY-12, C.l)}
      {/* L(упр) от выключателя */}
      {line(jx, swY+12, swX+15, swY+12, C.sw)}
      {txt(swX+15+(jx-swX-15)/2, swY+4, "L(упр)", C.sw, 8)}

      <Lamp x={lampX} y={swY} />
      {line(jx+jw, swY-14, lampX-14, swY-14, C.sw)}
      {line(jx+jw, swY, lampX-14, swY, C.n)}
      {line(jx+jw, swY+14, lampX-14, swY+14, C.pe)}
      {txt(jx+jw+(lampX-jx-jw)/2, swY-18, "L(упр)", C.sw, 8)}

      {/* Внутри коробки — L на выключатель и розетку */}
      {line(jx+25, jy+20, jx+25, swY-12, C.l)}
      <Dot cx={jx+25} cy={jy+20} color={C.l} />
      {line(jx+25, swY-12, jx+25, skY-12, C.l)}
      <Dot cx={jx+25} cy={skY-12} color={C.l} />
      {/* L от розетки */}
      {line(jx+25, skY-12, jx+jw-50, skY-12, C.l)}
      <Dot cx={jx+jw-50} cy={skY-12} color={C.l} />

      {/* N магистраль */}
      {line(jx+55, jy+jh, jx+55, jy+jh/2, C.n)}
      {line(jx+55, jy+jh/2, jx+jw-40, jy+jh/2, C.n)}
      <Dot cx={jx+55} cy={jy+jh/2} color={C.n} />
      {line(jx+jw-40, jy+jh/2, jx+jw-40, skY, C.n)}
      <Dot cx={jx+jw-40} cy={skY} color={C.n} />

      {/* PE магистраль */}
      {line(jx+85, jy+jh, jx+85, jy+jh/2+30, C.pe)}
      {line(jx+85, jy+jh/2+30, jx+jw-25, jy+jh/2+30, C.pe)}
      <Dot cx={jx+85} cy={jy+jh/2+30} color={C.pe} />
      {line(jx+jw-25, jy+jh/2+30, jx+jw-25, skY+14, C.pe)}
      <Dot cx={jx+jw-25} cy={skY+14} color={C.pe} />

      {/* упр */}
      {line(jx+25, swY+12, jx+jw-45, swY-14, C.sw)}
      <Dot cx={jx+jw-45} cy={swY-14} color={C.sw} />

      <Wago x={jx+25} y={jy+20} label="L" color={C.l} />
      <Wago x={jx+55} y={jy+jh/2} label="N" color={C.n} />
      <Wago x={jx+85} y={jy+jh/2+30} label="PE" color={C.pe} />
      <WireLegend x={30} y={345} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
// 14. ПРОХОДНОЙ — 5+ ТОЧЕК (много перекрёстных)
// ══════════════════════════════════════════════════════════
export const SvgPassThrough5: React.FC = () => {
  const jx=220, jy=80, jw=170, jh=130, sw1X=30, cross1X=250, cross2X=350, cross3X=450, sw2X=560, lampX=660, feedY=290
  return (
    <svg viewBox="0 0 760 380" className="w-full h-auto" fill="none" style={{background:"var(--bg-surface)"}}>
      {line(310, feedY, 310, jy+jh, C.l)}
      {line(330, feedY, 330, jy+jh, C.n)}
      {line(350, feedY, 350, jy+jh, C.pe)}
      {txt(310, feedY+12, "L", C.l, 9)} {txt(330, feedY+12, "N", C.n, 9)} {txt(350, feedY+12, "PE", C.pe, 9)}
      {txt(330, feedY+30, "от щитка 220В", C.txtDim, 10)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <PassSwitch x={sw1X} y={jy+jh/2} label="S1" />
      <CrossSwitch x={cross1X} y={jy+jh/2} label="S2✕" />
      <CrossSwitch x={cross2X} y={jy+jh/2} label="S3✕" />
      <CrossSwitch x={cross3X} y={jy+jh/2} label="S4✕" />
      <PassSwitch x={sw2X} y={jy+jh/2} label="S5" />

      {line(jx, jy+jh/2-20, sw1X+15, jy+jh/2-20, C.l)}
      {txt(sw1X+15+(jx-sw1X-15)/2, jy+jh/2-24, "L", C.l, 8)}
      {line(sw1X+15, jy+jh/2-10, sw2X-15, jy+jh/2-10, C.sw)}
      {line(sw1X+15, jy+jh/2+8, sw2X-15, jy+jh/2+8, C.sw)}
      {line(sw2X+15, jy+jh/2-10, jx+jw, jy+jh/2-10, C.sw)}

      <Lamp x={lampX} y={jy+jh/2} />
      {line(jx+jw, jy+jh/2, lampX-14, jy+jh/2, C.n)}
      {line(jx+jw, jy+jh/2+14, lampX-14, jy+jh/2+14, C.pe)}

      {line(jx+25, jy+20, jx+25, jy+jh/2-20, C.l)}
      <Dot cx={jx+25} cy={jy+20} color={C.l} />
      {line(jx+25, jy+jh/2-20, jx+50, jy+jh/2-10, C.l)}
      <Dot cx={jx+50} cy={jy+jh/2-10} color={C.l} />
      {line(jx+50, jy+jh/2-10, jx+jw-30, jy+jh/2-10, C.sw)}
      <Dot cx={jx+jw-30} cy={jy+jh/2-10} color={C.sw} />

      {line(jx+55, jy+jh, jx+55, jy+jh/2, C.n)}
      {line(jx+55, jy+jh/2, jx+jw-45, jy+jh/2, C.n)}
      <Dot cx={jx+55} cy={jy+jh/2} color={C.n} />
      {line(jx+85, jy+jh, jx+85, jy+jh/2+14, C.pe)}
      {line(jx+85, jy+jh/2+14, jx+jw-25, jy+jh/2+14, C.pe)}
      <Dot cx={jx+85} cy={jy+jh/2+14} color={C.pe} />

      <Wago x={jx+25} y={jy+20} label="L" color={C.l} />
      <Wago x={jx+55} y={jy+jh/2} label="N" color={C.n} />
      <Wago x={jx+85} y={jy+jh/2+14} label="PE" color={C.pe} />
      <Wago x={jx+50} y={jy+jh/2-10} label="P1" color={C.sw} />
      <WireLegend x={30} y={355} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
// 15. ДВУХКЛАВИШНЫЙ ПРОХОДНОЙ С ПЕРЕКРЁСТНЫМ
// ══════════════════════════════════════════════════════════
export const SvgDualCrossPass: React.FC = () => {
  const jx=220, jy=75, jw=180, jh=150, sw1X=30, crossX=300, sw2X=460
  const lamp1X=600, lamp2X=600, lamp1Y=jy+jh/2-35, lamp2Y=jy+jh/2+35
  const feedY=310
  return (
    <svg viewBox="0 0 700 400" className="w-full h-auto" fill="none" style={{background:"var(--bg-surface)"}}>
      {line(310, feedY, 310, jy+jh, C.l)}
      {line(330, feedY, 330, jy+jh, C.n)}
      {line(350, feedY, 350, jy+jh, C.pe)}
      {txt(310, feedY+12, "L", C.l, 9)} {txt(330, feedY+12, "N", C.n, 9)} {txt(350, feedY+12, "PE", C.pe, 9)}
      {txt(330, feedY+30, "от щитка 220В", C.txtDim, 10)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      {/* Группа A */}
      <PassSwitch x={sw1X} y={lamp1Y} label="S1A" />
      <CrossSwitch x={crossX} y={lamp1Y} label="S2✕A" />
      <PassSwitch x={sw2X} y={lamp1Y} label="S3A" />
      {/* Группа B */}
      <PassSwitch x={sw1X} y={lamp2Y} label="S1B" />
      <CrossSwitch x={crossX} y={lamp2Y} label="S2✕B" />
      <PassSwitch x={sw2X} y={lamp2Y} label="S3B" />

      {/* Группа A линии */}
      {line(jx, lamp1Y-14, sw1X+15, lamp1Y-14, C.l)}
      {line(sw1X+15, lamp1Y-10, sw2X-15, lamp1Y-10, C.sw)}
      {line(sw1X+15, lamp1Y+8, sw2X-15, lamp1Y+8, C.sw)}
      {line(sw2X+15, lamp1Y-10, jx+jw, lamp1Y-10, C.sw)}

      {/* Группа B линии */}
      {line(jx, lamp2Y-14, sw1X+15, lamp2Y-14, C.l)}
      {line(sw1X+15, lamp2Y-10, sw2X-15, lamp2Y-10, C.sw)}
      {line(sw1X+15, lamp2Y+8, sw2X-15, lamp2Y+8, C.sw)}
      {line(sw2X+15, lamp2Y-10, jx+jw, lamp2Y-10, C.sw)}

      <Lamp x={lamp1X} y={lamp1Y} />
      <Lamp x={lamp2X} y={lamp2Y} />
      {line(jx+jw, lamp1Y, lamp1X-14, lamp1Y, C.n)}
      {line(jx+jw, lamp2Y, lamp2X-14, lamp2Y, C.n)}
      {line(jx+jw, lamp1Y+14, lamp1X-14, lamp1Y+14, C.pe)}
      {line(jx+jw, lamp2Y+14, lamp2X-14, lamp2Y+14, C.pe)}

      {/* Внутри коробки */}
      {line(jx+25, jy+20, jx+25, lamp1Y-14, C.l)}
      <Dot cx={jx+25} cy={jy+20} color={C.l} />
      {line(jx+25, lamp1Y-14, jx+25, lamp2Y-14, C.l)}
      <Dot cx={jx+25} cy={lamp2Y-14} color={C.l} />

      {line(jx+50, jy+jh, jx+50, jy+jh/2, C.n)}
      {line(jx+50, jy+jh/2, jx+jw-45, jy+jh/2, C.n)}
      <Dot cx={jx+50} cy={jy+jh/2} color={C.n} />
      {line(jx+80, jy+jh, jx+80, jy+jh/2+35, C.pe)}
      {line(jx+80, jy+jh/2+35, jx+jw-25, jy+jh/2+35, C.pe)}
      <Dot cx={jx+80} cy={jy+jh/2+35} color={C.pe} />

      <Wago x={jx+25} y={jy+20} label="L" color={C.l} />
      <Wago x={jx+50} y={jy+jh/2} label="N" color={C.n} />
      <Wago x={jx+80} y={jy+jh/2+35} label="PE" color={C.pe} />
      <WireLegend x={30} y={375} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
// КАТАЛОГ ВСЕХ СХЕМ
// ══════════════════════════════════════════════════════════
export const SCHEMES: WiringScheme[] = [
  {
    id: "single-switch",
    title: "Одноклавишный выключатель",
    description: "Простое управление одной лампой. L→выключатель→лампа→N.",
    category: "Обычные",
    cableInfo: "3×1.5мм² (L+N+PE)",
    devices: "Выключатель 1кл, лампа",
    Svg: SvgSingleSwitch,
  },
  {
    id: "two-key-switch",
    title: "Двухклавишный выключатель",
    description: "Управление двумя группами ламп (люстра: 2×60Вт).",
    category: "Обычные",
    cableInfo: "4×1.5мм² (L+L1+L2+N+PE)",
    devices: "Выключатель 2кл, 2 лампы",
    Svg: SvgTwoKeySwitch,
  },
  {
    id: "three-key-switch",
    title: "Трёхклавишный выключатель",
    description: "Управление тремя группами освещения.",
    category: "Обычные",
    cableInfo: "5×1.5мм² (L+L1+L2+L3+N+PE)",
    devices: "Выключатель 3кл, 3 лампы",
    Svg: SvgThreeKeySwitch,
  },
  {
    id: "pass-through-2",
    title: "Проходной выключатель — 2 точки",
    description: "Управление освещением из двух мест (коридор, спальня).",
    category: "Проходные",
    cableInfo: "5×1.5мм² (L+P1+P2+N+PE)",
    devices: "2 проходных выключателя, лампа",
    Svg: SvgPassThrough2,
  },
  {
    id: "pass-through-3",
    title: "Проходной + перекрёстный — 3 точки",
    description: "Управление из трёх мест: длинный коридор, лестница.",
    category: "Проходные",
    cableInfo: "5×1.5мм² (L+P1+P2+N+PE)",
    devices: "2 проходных + перекрёстный, лампа",
    Svg: SvgPassThrough3,
  },
  {
    id: "pass-through-4",
    title: "Два перекрёстных — 4 точки",
    description: "Управление из четырёх мест: офис, зал.",
    category: "Проходные",
    cableInfo: "5×1.5мм² (L+P1+P2+N+PE)",
    devices: "2 проходных + 2 перекрёстных, лампа",
    Svg: SvgPassThrough4,
  },
  {
    id: "dual-pass-through",
    title: "Двухклавишный проходной — 2 группы",
    description: "Две независимые группы проходного света (2×2 точки).",
    category: "Проходные",
    cableInfo: "7×1.5мм² (2×L+2×P1+2×P2+N+PE)",
    devices: "2 двухкл. проходных, 2 лампы",
    Svg: SvgDualPassThrough,
  },
  {
    id: "pass-through-5",
    title: "Проходной — 5+ точек",
    description: "Управление из пяти и более мест: длинные коридоры, тоннели.",
    category: "Проходные",
    cableInfo: "5×1.5мм² (L+P1+P2+N+PE)",
    devices: "2 проходных + 3 перекрёстных, лампа",
    Svg: SvgPassThrough5,
  },
  {
    id: "dual-cross-pass",
    title: "Двухклавишный проходной с перекрёстным",
    description: "Две группы проходного света с доп. точками управления.",
    category: "Проходные",
    cableInfo: "7×1.5мм² (2×L+2×P1+2×P2+N+PE)",
    devices: "2 двухкл. проходных + 2 перекрёстных, 2 лампы",
    Svg: SvgDualCrossPass,
  },
  {
    id: "impulse-relay",
    title: "Импульсное реле (бистабильное)",
    description: "Управление с неограниченного числа мест. Сигнал импульсом.",
    category: "Специальные",
    cableInfo: "3×1.5мм² (L+N+PE) + витая пара",
    devices: "Импульсное реле, кнопки, лампа",
    Svg: SvgImpulseRelay,
  },
  {
    id: "dimmer",
    title: "Диммер (регулятор яркости)",
    description: "Плавная регулировка яркости лампы.",
    category: "Специальные",
    cableInfo: "3×1.5мм² (L+N+PE)",
    devices: "Диммер, лампа",
    Svg: SvgDimmer,
  },
  {
    id: "switch-with-indicator",
    title: "Выключатель с подсветкой",
    description: "Подсветка неонкой для поиска в темноте.",
    category: "Специальные",
    cableInfo: "3×1.5мм² (L+N+PE)",
    devices: "Выключатель с неонкой, лампа",
    Svg: SvgSwitchWithIndicator,
  },
  {
    id: "motion-sensor",
    title: "Датчик движения",
    description: "Автоматическое включение при обнаружении движения.",
    category: "Автоматика",
    cableInfo: "3×1.5мм² (L+N+PE)",
    devices: "Датчик движения, лампа",
    Svg: SvgMotionSensor,
  },
  {
    id: "twilight-switch",
    title: "Сумеречный выключатель (фотореле)",
    description: "Автоматическое включение по уровню освещённости.",
    category: "Автоматика",
    cableInfo: "3×1.5мм² (L+N+PE)",
    devices: "Фотореле, лампа",
    Svg: SvgTwilightSwitch,
  },
  {
    id: "socket-switch",
    title: "Розетка + выключатель",
    description: "Комбинированный блок: розетка и выключатель в одном месте.",
    category: "Комбинированные",
    cableInfo: "3×2.5мм² + 3×1.5мм²",
    devices: "Блок розетка+выключатель, лампа",
    Svg: SvgSocketSwitch,
  },
]
