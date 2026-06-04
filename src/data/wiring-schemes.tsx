// ═══════════════════════════════════════════════
// БИБЛИОТЕКА СХЕМ РАСКЛЮЧЕНИЯ — ВСЕ ВЫКЛЮЧАТЕЛИ
// ═══════════════════════════════════════════════
// Каждая схема — кэшированный React-SVG компонент,
// показывающий распредкоробку с соединениями Wago.
// Цвета проводов: L(красный) N(синий) PE(зелёный) SW(фиолетовый)

import React from 'react'

// ─── ЦВЕТА (ЧИСТЫЙ ПРОФЕССИОНАЛЬНЫЙ CAD-СТИЛЬ ГОСТ) ───
const C = {
  l:        '#ef4444',
  n:        '#3b82f6',
  pe:       '#22c55e',
  sw:       '#a855f7',
  box:      '#94a3b8',
  boxBrd:   '#1e293b',
  txt:      '#1e293b',
  txtSec:   '#475569',
  txtDim:   '#64748b',
  bg:       '#ffffff',
  amber:    '#1e293b',
}

const CommonDefs = () => <defs />

// ─── ТИП ───
export interface WiringScheme {
  id: string
  title: string
  description: string
  category: string
  cableInfo: string
  devices: string
  connections: string[]
  Svg: React.FC
}

// ─── УТИЛИТЫ ───
function wire(x1: number, y1: number, x2: number, y2: number, type: 'l' | 'n' | 'pe' | 'sw', width = 2.5) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C[type]} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
}

function line(x1: number, y1: number, x2: number, y2: number, color: string, width = 2) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="round" />
}

function txt(x: number, y: number, text: string, color: string, size = 11, bold = false) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={size} fill={color} fontWeight={bold ? 'bold' : 'normal'} fontFamily="monospace">
      {text}
    </text>
  )
}

// ─── ПРИМИТИВЫ (ГОСТ / МЭК СТИЛЬ) ───

function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="14" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
      <path d={`M${x - 10} ${y - 10} L${x + 10} ${y + 10} M${x - 10} ${y + 10} L${x + 10} ${y - 10}`} stroke="#1e293b" strokeWidth="2" />
      <text x={x} y={y + 26} textAnchor="middle" fontSize="11" fill="#1e293b" fontFamily="monospace" fontWeight="bold">HL</text>
    </g>
  )
}

function SwitchBase({ x, y, keys = 1, label }: { x: number; y: number; keys?: 1 | 2 | 3; label?: string }) {
  return (
    <g>
      <circle cx={x - 12} cy={y} r="3" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
      <path d={`M${x - 10} ${y - 2} L${x + 12} ${y - 16}`} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      {keys > 1 && <path d={`M${x - 2} ${y - 6} L${x + 10} ${y - 10}`} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />}
      {keys > 2 && <path d={`M${x + 4} ${y - 10} L${x + 14} ${y - 13}`} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />}
      {label && <text x={x} y={y + 20} textAnchor="middle" fontSize="11" fill="#1e293b" fontFamily="monospace">{label}</text>}
    </g>
  )
}

const Switch1 = (props: any) => <SwitchBase {...props} keys={1} />
const Switch2 = (props: any) => <SwitchBase {...props} keys={2} />
const Switch3 = (props: any) => <SwitchBase {...props} keys={3} />

function PassSwitch({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g>
      <circle cx={x - 12} cy={y} r="3" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
      <path d={`M${x - 10} ${y - 2} L${x + 12} ${y - 16}`} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      <path d={`M${x - 10} ${y + 2} L${x + 12} ${y + 16}`} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
      {label && <text x={x} y={y + 24} textAnchor="middle" fontSize="11" fill="#1e293b" fontFamily="monospace">{label}</text>}
    </g>
  )
}

function CrossSwitch({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g>
      <circle cx={x - 12} cy={y - 8} r="3" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
      <circle cx={x - 12} cy={y + 8} r="3" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
      <path d={`M${x - 10} ${y - 8} L${x + 12} ${y + 8}`} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      <path d={`M${x - 10} ${y + 8} L${x + 12} ${y - 8}`} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      {label && <text x={x} y={y + 24} textAnchor="middle" fontSize="11" fill="#1e293b" fontFamily="monospace">{label}</text>}
    </g>
  )
}

function Socket({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g>
      <path d={`M${x - 12} ${y} A 12 12 0 0 0 ${x + 12} ${y}`} fill="none" stroke="#1e293b" strokeWidth="2" />
      <line x1={x} y1={y} x2={x} y2={y - 12} stroke="#1e293b" strokeWidth="2" />
      <line x1={x - 16} y1={y} x2={x + 16} y2={y} stroke="#1e293b" strokeWidth="2" />
      {label && <text x={x} y={y + 20} textAnchor="middle" fontSize="11" fill="#1e293b" fontFamily="monospace">{label}</text>}
    </g>
  )
}

function JBox({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#f8fafc" stroke="#1e293b" strokeWidth="2" strokeDasharray="8 6" />
      <text x={x + w / 2} y={y - 6} textAnchor="middle" fontSize="12" fill="#1e293b" fontWeight="bold" fontFamily="monospace">РАСПРЕДКОРОБКА</text>
    </g>
  )
}

function Dot({ cx, cy, color }: { cx: number; cy: number; color?: string }) {
  return <circle cx={cx} cy={cy} r="4" fill={color || "#1e293b"} />
}

function Wago({ x, y, label, color, ports = 3 }: { x: number; y: number; label?: string; color?: string; ports?: number }) {
  const w = 24, h = 14
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx={x} cy={y} r="2" fill="#1e293b" />
      {label && <text x={x} y={y - h / 2 - 4} textAnchor="middle" fontSize="11" fill={color || "#1e293b"} fontWeight="bold" fontFamily="monospace">{label}</text>}
    </g>
  )
}

function WireLegend({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <text x={x} y={y} fontSize="12" fill={C.txtSec} fontWeight="bold" fontFamily="monospace">
        <tspan fill={C.l}>— L(фаза)</tspan>
        <tspan dx="15" fill={C.n}>— N(ноль)</tspan>
        <tspan dx="15" fill={C.pe}>— PE(земля)</tspan>
        <tspan dx="15" fill={C.sw}>— SW(упр)</tspan>
      </text>
    </g>
  )
}

// ══════════════════════════════════════════════════════════
//  1. ОДНОКЛАВИШНЫЙ ВЫКЛЮЧАТЕЛЬ
// ══════════════════════════════════════════════════════════
export const SvgSingleSwitch: React.FC = () => {
  const jx = 200, jy = 100, jw = 140, jh = 100, swX = 70, lampX = 440, feedY = 280
  return (
    <svg viewBox="0 0 550 350" className="w-full h-auto" fill="none" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
      <CommonDefs />
      {/* Питание от щитка */}
      {wire(270, feedY, 270, jy + jh, 'l')}
      {wire(290, feedY, 290, jy + jh, 'n')}
      {wire(310, feedY, 310, jy + jh, 'pe')}
      {txt(270, feedY + 15, 'L', '#ef4444', 10, true)}
      {txt(290, feedY + 15, 'N', '#3b82f6', 10, true)}
      {txt(310, feedY + 15, 'PE', '#22c55e', 10, true)}
      {txt(290, feedY + 32, 'от щитка 220В', C.txtDim, 11)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <Switch1 x={swX} y={jy + jh / 2} label="Выключатель" />

      {/* Провода к выключателю */}
      {wire(jx, jy + jh / 2 - 12, swX + 20, jy + jh / 2 - 12, 'l')}
      {wire(jx, jy + jh / 2 + 12, swX + 20, jy + jh / 2 + 12, 'sw')}
      {txt(swX + 45, jy + jh / 2 - 18, 'Фаза (L)', C.l, 8)}
      {txt(swX + 45, jy + jh / 2 + 22, 'Упр (SW)', C.sw, 8)}

      {/* Провода к лампе */}
      <Lamp x={lampX} y={jy + jh / 2} />
      {wire(jx + jw, jy + jh / 2 - 14, lampX - 16, jy + jh / 2 - 14, 'sw')}
      {wire(jx + jw, jy + jh / 2, lampX - 16, jy + jh / 2, 'n')}
      {wire(jx + jw, jy + jh / 2 + 14, lampX - 16, jy + jh / 2 + 14, 'pe')}

      {/* Внутренние соединения (в коробке) */}
      {/* Фаза L */}
      {wire(jx + 30, jy + 20, jx + 30, jy + jh / 2 - 12, 'l')}
      <Dot cx={jx + 30} cy={jy + 20} color={C.l} />
      <Wago x={jx + 30} y={jy + 20} label="L" color="#ef4444" />

      {/* Ноль N */}
      {wire(jx + 60, jy + jh, jx + 60, jy + jh / 2, 'n')}
      {wire(jx + 60, jy + jh / 2, jx + jw - 40, jy + jh / 2, 'n')}
      <Dot cx={jx + 60} cy={jy + jh / 2} color={C.n} />
      <Wago x={jx + 60} y={jy + jh / 2} label="N" color="#3b82f6" />

      {/* Земля PE */}
      {wire(jx + 90, jy + jh, jx + 90, jy + jh / 2 + 14, 'pe')}
      {wire(jx + 90, jy + jh / 2 + 14, jx + jw - 20, jy + jh / 2 + 14, 'pe')}
      <Dot cx={jx + 90} cy={jy + jh / 2 + 14} color={C.pe} />
      <Wago x={jx + 90} y={jy + jh / 2 + 14} label="PE" color="#22c55e" />

      {/* Управляющий SW */}
      {wire(jx + 30, jy + jh / 2 + 12, jx + jw - 30, jy + jh / 2 - 14, 'sw')}
      <Dot cx={jx + jw - 30} cy={jy + jh / 2 - 14} color={C.sw} />
      <Wago x={jx + jw - 30} y={jy + jh / 2 - 14} label="SW" color="#a855f7" />

      <WireLegend x={30} y={330} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
//  2. ДВУХКЛАВИШНЫЙ ВЫКЛЮЧАТЕЛЬ
// ══════════════════════════════════════════════════════════
export const SvgTwoKeySwitch: React.FC = () => {
  const jx = 200, jy = 90, jw = 160, jh = 110, swX = 60, lamp1X = 460, lamp2X = 460, feedY = 280
  const lamp1Y = jy + jh / 2 - 30, lamp2Y = jy + jh / 2 + 30
  return (
    <svg viewBox="0 0 560 350" className="w-full h-auto" fill="none" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
      <CommonDefs />
      {wire(270, feedY, 270, jy + jh, 'l')}
      {wire(290, feedY, 290, jy + jh, 'n')}
      {wire(310, feedY, 310, jy + jh, 'pe')}
      {txt(270, feedY + 15, 'L', '#ef4444', 10, true)}
      {txt(290, feedY + 15, 'N', '#3b82f6', 10, true)}
      {txt(310, feedY + 15, 'PE', '#22c55e', 10, true)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <Switch2 x={swX} y={jy + jh / 2} label="2-клавишный" />

      {/* L к выключателю */}
      {wire(jx, jy + jh / 2 - 22, swX + 18, jy + jh / 2 - 22, 'l')}
      {/* упр1 и упр2 от выключателя */}
      {wire(jx, jy + jh / 2 - 8, swX + 18, jy + jh / 2 - 8, 'sw')}
      {wire(jx, jy + jh / 2 + 14, swX + 18, jy + jh / 2 + 14, 'sw')}

      {/* Лампа 1 */}
      <Lamp x={lamp1X} y={lamp1Y} />
      {wire(jx + jw, jy + jh / 2 - 30, lamp1X - 16, jy + jh / 2 - 30, 'sw')}
      {wire(jx + jw, jy + jh / 2 - 8, lamp1X - 16, jy + jh / 2 - 8, 'n')}
      {txt(lamp1X, lamp1Y - 24, 'L1', C.sw, 8, true)}

      {/* Лампа 2 */}
      <Lamp x={lamp2X} y={lamp2Y} />
      {wire(jx + jw, jy + jh / 2 + 8, lamp2X - 16, jy + jh / 2 + 8, 'n')}
      {wire(jx + jw, jy + jh / 2 + 30, lamp2X - 16, jy + jh / 2 + 30, 'sw')}
      {txt(lamp2X, lamp2Y + 34, 'L2', C.sw, 8, true)}

      {/* Соединения в коробке */}
      {/* L */}
      {wire(jx + 25, jy + 20, jx + 25, jy + jh / 2 - 22, 'l')}
      <Dot cx={jx + 25} cy={jy + 20} color={C.l} />
      <Wago x={jx + 25} y={jy + 20} label="L" color="#ef4444" />

      {/* N */}
      {wire(jx + 55, jy + jh, jx + 55, jy + jh / 2 - 8, 'n')}
      {wire(jx + 55, jy + jh / 2 - 8, jx + jw - 40, jy + jh / 2 - 8, 'n')}
      {wire(jx + jw - 40, jy + jh / 2 - 8, jx + jw - 40, jy + jh / 2 + 8, 'n')}
      <Dot cx={jx + 55} cy={jy + jh / 2 - 8} color={C.n} />
      <Wago x={jx + 55} y={jy + jh / 2 - 8} label="N" color="#3b82f6" ports={3} />

      {/* PE */}
      {wire(jx + 85, jy + jh, jx + 85, jy + jh / 2 + 30, 'pe')}
      {wire(jx + 85, jy + jh / 2 + 30, jx + jw - 20, jy + jh / 2 + 30, 'pe')}
      <Dot cx={jx + 85} cy={jy + jh / 2 + 30} color={C.pe} />
      <Wago x={jx + 85} y={jy + jh / 2 + 30} label="PE" color="#22c55e" />

      {/* SW1 */}
      {wire(jx + 25, jy + jh / 2 - 8, jx + jw - 55, jy + jh / 2 - 30, 'sw')}
      <Dot cx={jx + jw - 55} cy={jy + jh / 2 - 30} color={C.sw} />
      <Wago x={jx + jw - 55} y={jy + jh / 2 - 30} label="SW1" color="#a855f7" />

      {/* SW2 */}
      {wire(jx + 25, jy + jh / 2 + 14, jx + jw - 55, jy + jh / 2 + 30, 'sw')}
      <Dot cx={jx + jw - 55} cy={jy + jh / 2 + 30} color={C.sw} />
      <Wago x={jx + jw - 55} y={jy + jh / 2 + 30} label="SW2" color="#a855f7" />

      <WireLegend x={30} y={330} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
//  3. ТРЁХКЛАВИШНЫЙ ВЫКЛЮЧАТЕЛЬ
// ══════════════════════════════════════════════════════════
export const SvgThreeKeySwitch: React.FC = () => {
  const jx = 200, jy = 80, jw = 170, jh = 130, swX = 50
  const lampYs = [jy + jh / 2 - 40, jy + jh / 2, jy + jh / 2 + 40], lampX = 470, feedY = 290
  return (
    <svg viewBox="0 0 570 370" className="w-full h-auto" fill="none" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
      <CommonDefs />
      {wire(270, feedY, 270, jy + jh, 'l')}
      {wire(290, feedY, 290, jy + jh, 'n')}
      {wire(310, feedY, 310, jy + jh, 'pe')}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <Switch3 x={swX} y={jy + jh / 2} label="3-клавишный" />

      {/* L к выключателю */}
      {wire(jx, jy + jh / 2 - 30, swX + 22, jy + jh / 2 - 30, 'l')}
      {/* 3 упр линии */}
      {wire(jx, jy + jh / 2 - 12, swX + 22, jy + jh / 2 - 12, 'sw')}
      {wire(jx, jy + jh / 2 + 4, swX + 22, jy + jh / 2 + 4, 'sw')}
      {wire(jx, jy + jh / 2 + 20, swX + 22, jy + jh / 2 + 20, 'sw')}

      {/* 3 лампы */}
      {lampYs.map((ly, i) => (<Lamp key={i} x={lampX} y={ly} />))}
      {lampYs.map((ly, i) => wire(jx + jw, ly, lampX - 16, ly, i === 0 ? 'sw' : i === 1 ? 'sw' : 'sw'))}

      {/* N + PE */}
      {wire(jx + jw, jy + jh / 2 - 25, lampX - 16, jy + jh / 2 - 25, 'n')}
      {wire(jx + jw, jy + jh / 2 + 15, lampX - 16, jy + jh / 2 + 15, 'n')}
      {wire(jx + jw, jy + jh / 2 + 55, lampX - 16, jy + jh / 2 + 55, 'pe')}

      {/* Соединения в коробке */}
      {/* L */}
      {wire(jx + 25, jy + 20, jx + 25, jy + jh / 2 - 30, 'l')}
      <Wago x={jx + 25} y={jy + 20} label="L" color="#ef4444" />

      {/* N */}
      {wire(jx + 55, jy + jh, jx + 55, jy + jh / 2, 'n')}
      <Wago x={jx + 55} y={jy + jh / 2} label="N" color="#3b82f6" ports={4} />

      {/* PE */}
      {wire(jx + 85, jy + jh, jx + 85, jy + jh / 2 + 45, 'pe')}
      <Wago x={jx + 85} y={jy + jh / 2 + 45} label="PE" color="#22c55e" />

      {/* упр в коробке */}
      {[0, 1, 2].map(i => {
        const fromY = jy + jh / 2 - 12 + i * 16
        const toY = lampYs[i]
        return (
          <React.Fragment key={i}>
            {wire(jx + 25, fromY, jx + jw - 45, toY, 'sw')}
            <Wago x={jx + jw - 45} y={toY} label={`SW${i + 1}`} color="#a855f7" ports={2} />
          </React.Fragment>
        )
      })}

      <WireLegend x={30} y={345} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
//  4. ПРОХОДНОЙ — 2 ТОЧКИ
// ══════════════════════════════════════════════════════════
export const SvgPassThrough2: React.FC = () => {
  const jx = 220, jy = 100, jw = 150, jh = 110, sw1X = 60, sw2X = 500, lampX = 620, feedY = 290
  return (
    <svg viewBox="0 0 700 360" className="w-full h-auto" fill="none" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
      <CommonDefs />
      {wire(300, feedY, 300, jy + jh, 'l')}
      {wire(320, feedY, 320, jy + jh, 'n')}
      {wire(340, feedY, 340, jy + jh, 'pe')}
      {txt(300, feedY + 15, 'L', '#ef4444', 10, true)}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <PassSwitch x={sw1X} y={jy + jh / 2} label="Проходной S1" />
      <PassSwitch x={sw2X} y={jy + jh / 2} label="Проходной S2" />

      {/* L из коробки к S1 */}
      {wire(jx, jy + jh / 2 - 20, sw1X + 20, jy + jh / 2 - 20, 'l')}
      {/* 2 параллельные линии P1, P2 между выключателями */}
      {wire(sw1X + 20, jy + jh / 2 - 10, sw2X - 20, jy + jh / 2 - 10, 'sw')}
      {wire(sw1X + 20, jy + jh / 2 + 10, sw2X - 20, jy + jh / 2 + 10, 'sw')}
      {txt((sw1X + sw2X) / 2, jy + jh / 2 - 16, 'P1', C.sw, 8)}
      {txt((sw1X + sw2X) / 2, jy + jh / 2 + 18, 'P2', C.sw, 8)}

      {/* L(упр) от S2 к лампе через коробку */}
      {wire(sw2X - 20, jy + jh / 2 - 20, jx + jw, jy + jh / 2 - 20, 'sw')}
      <Lamp x={lampX} y={jy + jh / 2} />
      {wire(jx + jw, jy + jh / 2 - 14, lampX - 16, jy + jh / 2 - 14, 'sw')}
      {wire(jx + jw, jy + jh / 2, lampX - 16, jy + jh / 2, 'n')}
      {wire(jx + jw, jy + jh / 2 + 14, lampX - 16, jy + jh / 2 + 14, 'pe')}

      {/* Внутри коробки */}
      {/* Фаза L */}
      {wire(jx + 25, jy + 20, jx + 25, jy + jh / 2 - 20, 'l')}
      <Wago x={jx + 25} y={jy + 20} label="L" color="#ef4444" />

      {/* Соединение P1 в коробке (просто транзит) */}
      <Wago x={jx + 55} y={jy + jh / 2 - 10} label="P1" color="#a855f7" />

      {/* Соединение P2 в коробке (просто транзит) */}
      <Wago x={jx + 55} y={jy + jh / 2 + 10} label="P2" color="#a855f7" />

      {/* L(упр) к лампе */}
      <Wago x={jx + jw - 30} y={jy + jh / 2 - 20} label="SW" color="#a855f7" />

      {/* N + PE транзит */}
      {wire(jx + 85, jy + jh, jx + 85, jy + jh / 2, 'n')}
      <Wago x={jx + 85} y={jy + jh / 2} label="N" color="#3b82f6" />
      {wire(jx + 115, jy + jh, jx + 115, jy + jh / 2 + 14, 'pe')}
      <Wago x={jx + 115} y={jy + jh / 2 + 14} label="PE" color="#22c55e" />

      <WireLegend x={30} y={340} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
//  5. ПРОХОДНОЙ + ПЕРЕКРЁСТНЫЙ — 3 ТОЧКИ
// ══════════════════════════════════════════════════════════
export const SvgPassThrough3: React.FC = () => {
  const jx = 220, jy = 90, jw = 160, jh = 120, sw1X = 50, crossX = 360, sw2X = 520, lampX = 640, feedY = 290
  return (
    <svg viewBox="0 0 710 370" className="w-full h-auto" fill="none" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
      <CommonDefs />
      {wire(300, feedY, 300, jy + jh, 'l')}
      {wire(320, feedY, 320, jy + jh, 'n')}
      {wire(340, feedY, 340, jy + jh, 'pe')}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <PassSwitch x={sw1X} y={jy + jh / 2} label="S1" />
      <CrossSwitch x={crossX} y={jy + jh / 2} label="S2✕" />
      <PassSwitch x={sw2X} y={jy + jh / 2} label="S3" />

      {/* Линии связи */}
      {wire(sw1X + 20, jy + jh / 2 - 10, crossX - 15, jy + jh / 2 - 10, 'sw')}
      {wire(sw1X + 20, jy + jh / 2 + 10, crossX - 15, jy + jh / 2 + 10, 'sw')}
      {wire(crossX + 15, jy + jh / 2 - 10, sw2X - 20, jy + jh / 2 - 10, 'sw')}
      {wire(crossX + 15, jy + jh / 2 + 10, sw2X - 20, jy + jh / 2 + 10, 'sw')}

      {/* L к S1 */}
      {wire(jx, jy + jh / 2 - 20, sw1X + 20, jy + jh / 2 - 20, 'l')}
      {/* SW от S3 к лампе */}
      {wire(sw2X - 20, jy + jh / 2 - 20, jx + jw, jy + jh / 2 - 20, 'sw')}

      <Lamp x={lampX} y={jy + jh / 2} />
      {wire(jx + jw, jy + jh / 2 - 14, lampX - 16, jy + jh / 2 - 14, 'sw')}
      {wire(jx + jw, jy + jh / 2, lampX - 16, jy + jh / 2, 'n')}
      {wire(jx + jw, jy + jh / 2 + 14, lampX - 16, jy + jh / 2 + 14, 'pe')}

      {/* Соединения в коробке */}
      {wire(jx + 25, jy + 20, jx + 25, jy + jh / 2 - 20, 'l')}
      <Wago x={jx + 25} y={jy + 20} label="L" color="#ef4444" />
      <Wago x={jx + 55} y={jy + jh / 2} label="N" color="#3b82f6" />
      <Wago x={jx + 85} y={jy + jh / 2 + 15} label="PE" color="#22c55e" />
      <Wago x={jx + jw - 30} y={jy + jh / 2 - 20} label="SW" color="#a855f7" />

      <WireLegend x={30} y={345} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
//  6. ДВА ПЕРЕКРЁСТНЫХ — 4 ТОЧКИ
// ══════════════════════════════════════════════════════════
export const SvgPassThrough4: React.FC = () => {
  const jx = 220, jy = 90, jw = 170, jh = 120, sw1X = 40, cross1X = 320, cross2X = 440, sw2X = 540, lampX = 650, feedY = 290
  return (
    <svg viewBox="0 0 740 370" className="w-full h-auto" fill="none" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
      <CommonDefs />
      {wire(310, feedY, 310, jy + jh, 'l')}
      {wire(330, feedY, 330, jy + jh, 'n')}
      {wire(350, feedY, 350, jy + jh, 'pe')}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <PassSwitch x={sw1X} y={jy + jh / 2} label="S1" />
      <CrossSwitch x={cross1X} y={jy + jh / 2} label="S2✕" />
      <CrossSwitch x={cross2X} y={jy + jh / 2} label="S3✕" />
      <PassSwitch x={sw2X} y={jy + jh / 2} label="S4" />

      {/* L к S1 */}
      {wire(jx, jy + jh / 2 - 20, sw1X + 20, jy + jh / 2 - 20, 'l')}
      {/* Линии связи */}
      {wire(sw1X + 20, jy + jh / 2 - 10, cross1X - 15, jy + jh / 2 - 10, 'sw')}
      {wire(sw1X + 20, jy + jh / 2 + 10, cross1X - 15, jy + jh / 2 + 10, 'sw')}
      {wire(cross1X + 15, jy + jh / 2 - 10, cross2X - 15, jy + jh / 2 - 10, 'sw')}
      {wire(cross1X + 15, jy + jh / 2 + 10, cross2X - 15, jy + jh / 2 + 10, 'sw')}
      {wire(cross2X + 15, jy + jh / 2 - 10, sw2X - 20, jy + jh / 2 - 10, 'sw')}
      {wire(cross2X + 15, jy + jh / 2 + 10, sw2X - 20, jy + jh / 2 + 10, 'sw')}
      {/* SW от S4 к лампе */}
      {wire(sw2X - 20, jy + jh / 2 - 20, jx + jw, jy + jh / 2 - 20, 'sw')}

      <Lamp x={lampX} y={jy + jh / 2} />
      {wire(jx + jw, jy + jh / 2 - 14, lampX - 16, jy + jh / 2 - 14, 'sw')}
      {wire(jx + jw, jy + jh / 2, lampX - 16, jy + jh / 2, 'n')}
      {wire(jx + jw, jy + jh / 2 + 14, lampX - 16, jy + jh / 2 + 14, 'pe')}

      {/* Коробка */}
      <Wago x={jx + 25} y={jy + 20} label="L" color="#ef4444" />
      <Wago x={jx + 55} y={jy + jh / 2} label="N" color="#3b82f6" />
      <Wago x={jx + 85} y={jy + jh / 2 + 15} label="PE" color="#22c55e" />
      <Wago x={jx + jw - 30} y={jy + jh / 2 - 20} label="SW" color="#a855f7" />

      <WireLegend x={30} y={345} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
//  7. ДВУХКЛАВИШНЫЙ ПРОХОДНОЙ (2 группы, 2 точки)
// ══════════════════════════════════════════════════════════
export const SvgDualPassThrough: React.FC = () => {
  const jx = 220, jy = 80, jw = 170, jh = 140, sw1X = 40, sw2X = 510, lamp1X = 630, lamp2X = 630
  const lamp1Y = jy + jh / 2 - 35, lamp2Y = jy + jh / 2 + 35
  const feedY = 310
  return (
    <svg viewBox="0 0 730 380" className="w-full h-auto" fill="none" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
      <CommonDefs />
      {wire(300, feedY, 300, jy + jh, 'l')}
      {wire(320, feedY, 320, jy + jh, 'n')}
      {wire(340, feedY, 340, jy + jh, 'pe')}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      {/* Две группы проходных */}
      <Switch2 x={sw1X} y={jy + jh / 2} label="S1 (2-кл)" />
      <Switch2 x={sw2X} y={jy + jh / 2} label="S2 (2-кл)" />

      {/* Лампы */}
      <Lamp x={lamp1X} y={lamp1Y} />
      <Lamp x={lamp2X} y={lamp2Y} />

      {/* Линии к S1 */}
      {wire(jx, jy + 25, sw1X + 22, jy + 25, 'l')}
      {/* Линии связи группа A */}
      {wire(sw1X + 22, jy + 40, sw2X - 22, jy + 40, 'sw')}
      {wire(sw1X + 22, jy + 55, sw2X - 22, jy + 55, 'sw')}
      {/* Линии связи группа B */}
      {wire(sw1X + 22, jy + 85, sw2X - 22, jy + 85, 'sw')}
      {wire(sw1X + 22, jy + 100, sw2X - 22, jy + 100, 'sw')}

      {/* SW выходы к лампам */}
      {wire(sw2X - 22, jy + 25, jx + jw, jy + 25, 'sw')}
      {wire(sw2X - 22, jy + 115, jx + jw, jy + 115, 'sw')}

      {/* Коробка */}
      <Wago x={jx + 25} y={jy + 20} label="L" color="#ef4444" />
      <Wago x={jx + 55} y={jy + jh / 2} label="N" color="#3b82f6" />
      <Wago x={jx + 85} y={jy + jh / 2 + 25} label="PE" color="#22c55e" />

      <WireLegend x={30} y={360} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
//  8. ИМПУЛЬСНОЕ РЕЛЕ (бистабильное)
// ══════════════════════════════════════════════════════════
export const SvgImpulseRelay: React.FC = () => {
  const jx = 200, jy = 90, jw = 160, jh = 120, btnX = 60, lampX = 460, feedY = 280
  return (
    <svg viewBox="0 0 560 360" className="w-full h-auto" fill="none" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
      <CommonDefs />
      {wire(270, feedY, 270, jy + jh, 'l')}
      {wire(290, feedY, 290, jy + jh, 'n')}
      {wire(310, feedY, 310, jy + jh, 'pe')}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      {/* Кнопка (звонковая) */}
      <g>
        <rect x={btnX - 20} y={jy + jh / 2 - 25} width="40" height="50" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
        <circle cx={btnX} cy={jy + jh / 2} r="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
        <text x={btnX} y={jy + jh / 2 + 38} textAnchor="middle" fontSize="9" fill={C.txtSec} fontWeight="bold">Кнопка</text>
      </g>
      {/* Импульсное реле в коробке */}
      <g>
        <rect x={jx + 20} y={jy + 20} width="60" height="40" rx="4" fill="#1e293b" />
        <text x={jx + 50} y={jy + 38} textAnchor="middle" fontSize="9" fill="white">Имп. реле</text>
        <text x={jx + 50} y={jy + 50} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.6)">A1/A2/1/2</text>
      </g>

      {/* Провода */}
      {wire(jx, jy + jh / 2 - 15, btnX + 20, jy + jh / 2 - 15, 'l')}
      {wire(jx, jy + jh / 2 + 10, btnX + 20, jy + jh / 2 + 10, 'sw')}

      <Lamp x={lampX} y={jy + jh / 2} />
      {wire(jx + jw, jy + jh / 2 - 14, lampX - 16, jy + jh / 2 - 14, 'sw')}
      {wire(jx + jw, jy + jh / 2, lampX - 16, jy + jh / 2, 'n')}
      {wire(jx + jw, jy + jh / 2 + 14, lampX - 16, jy + jh / 2 + 14, 'pe')}

      {/* Коробка */}
      <Wago x={jx + 100} y={jy + 30} label="L" color="#ef4444" />
      <Wago x={jx + 50} y={jy + jh - 20} label="N" color="#3b82f6" />
      <Wago x={jx + 100} y={jy + jh - 20} label="PE" color="#22c55e" />

      <WireLegend x={30} y={340} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
//  9. ДИММЕР
// ══════════════════════════════════════════════════════════
export const SvgDimmer: React.FC = () => {
  const jx = 200, jy = 100, jw = 140, jh = 100, dimX = 60, lampX = 440, feedY = 280
  return (
    <svg viewBox="0 0 550 350" className="w-full h-auto" fill="none" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
      <CommonDefs />
      {wire(270, feedY, 270, jy + jh, 'l')}
      {wire(290, feedY, 290, jy + jh, 'n')}
      {wire(310, feedY, 310, jy + jh, 'pe')}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      {/* Диммер */}
      <g>
        <rect x={dimX - 20} y={jy + jh / 2 - 25} width="40" height="50" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
        <circle cx={dimX} cy={jy + jh / 2} r="10" fill="white" stroke="#cbd5e1" strokeWidth="1" />
        <path d={`M${dimX - 6} ${jy + jh / 2} A 6 6 0 1 1 ${dimX + 6} ${jy + jh / 2}`} stroke={C.amber} strokeWidth="2" fill="none" />
        <text x={dimX} y={jy + jh / 2 + 38} textAnchor="middle" fontSize="9" fill={C.txtSec} fontWeight="bold">Диммер</text>
      </g>

      {wire(jx, jy + jh / 2 - 12, dimX + 20, jy + jh / 2 - 12, 'l')}
      {wire(jx, jy + jh / 2 + 12, dimX + 20, jy + jh / 2 + 12, 'sw')}

      <Lamp x={lampX} y={jy + jh / 2} />
      {wire(jx + jw, jy + jh / 2 - 14, lampX - 16, jy + jh / 2 - 14, 'sw')}
      {wire(jx + jw, jy + jh / 2, lampX - 16, jy + jh / 2, 'n')}
      {wire(jx + jw, jy + jh / 2 + 14, lampX - 16, jy + jh / 2 + 14, 'pe')}

      <Wago x={jx + 30} y={jy + 20} label="L" color="#ef4444" />
      <Wago x={jx + 60} y={jy + jh / 2} label="N" color="#3b82f6" />
      <Wago x={jx + 90} y={jy + jh / 2 + 14} label="PE" color="#22c55e" />
      <Wago x={jx + jw - 30} y={jy + jh / 2 - 14} label="SW" color="#a855f7" />

      <WireLegend x={30} y={330} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
// 10. ВЫКЛЮЧАТЕЛЬ С ПОДСВЕТКОЙ
// ══════════════════════════════════════════════════════════
export const SvgSwitchWithIndicator: React.FC = () => {
  const jx = 200, jy = 100, jw = 140, jh = 100, swX = 70, lampX = 440, feedY = 280
  return (
    <svg viewBox="0 0 550 350" className="w-full h-auto" fill="none" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
      <CommonDefs />
      {wire(270, feedY, 270, jy + jh, 'l')}
      {wire(290, feedY, 290, jy + jh, 'n')}
      {wire(310, feedY, 310, jy + jh, 'pe')}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <g>
        <Switch1 x={swX} y={jy + jh / 2} label="С подсветкой" />
        <circle cx={swX} cy={jy + jh / 2 - 8} r="2" fill="#ef4444" filter="url(#glow)" />
      </g>

      {wire(jx, jy + jh / 2 - 12, swX + 20, jy + jh / 2 - 12, 'l')}
      {wire(jx, jy + jh / 2 + 12, swX + 20, jy + jh / 2 + 12, 'sw')}

      <Lamp x={lampX} y={jy + jh / 2} />
      {wire(jx + jw, jy + jh / 2 - 14, lampX - 16, jy + jh / 2 - 14, 'sw')}
      {wire(jx + jw, jy + jh / 2, lampX - 16, jy + jh / 2, 'n')}
      {wire(jx + jw, jy + jh / 2 + 14, lampX - 16, jy + jh / 2 + 14, 'pe')}

      <Wago x={jx + 30} y={jy + 20} label="L" color="#ef4444" />
      <Wago x={jx + 60} y={jy + jh / 2} label="N" color="#3b82f6" />
      <Wago x={jx + 90} y={jy + jh / 2 + 14} label="PE" color="#22c55e" />
      <Wago x={jx + jw - 30} y={jy + jh / 2 - 14} label="SW" color="#a855f7" />

      <WireLegend x={30} y={330} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
// 11. ДАТЧИК ДВИЖЕНИЯ
// ══════════════════════════════════════════════════════════
export const SvgMotionSensor: React.FC = () => {
  const jx = 200, jy = 90, jw = 150, jh = 120, senX = 50, lampX = 460, feedY = 290
  return (
    <svg viewBox="0 0 570 370" className="w-full h-auto" fill="none" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
      <CommonDefs />
      {wire(275, feedY, 275, jy + jh, 'l')}
      {wire(295, feedY, 295, jy + jh, 'n')}
      {wire(315, feedY, 315, jy + jh, 'pe')}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      {/* Датчик движения */}
      <g>
        <rect x={senX - 20} y={jy + jh / 2 - 25} width="40" height="50" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
        <circle cx={senX} cy={jy + jh / 2 - 5} r="12" fill="white" stroke="#cbd5e1" strokeWidth="0.5" />
        <path d={`M${senX - 8} ${jy + jh / 2} Q ${senX} ${jy + jh / 2 - 15} ${senX + 8} ${jy + jh / 2}`} stroke="#94a3b8" fill="none" />
        <text x={senX} y={jy + jh / 2 + 38} textAnchor="middle" fontSize="9" fill={C.txtSec} fontWeight="bold">Датчик</text>
      </g>

      {wire(jx, jy + jh / 2 - 20, senX + 20, jy + jh / 2 - 20, 'l')}
      {wire(jx, jy + jh / 2, senX + 20, jy + jh / 2, 'n')}
      {wire(jx, jy + jh / 2 + 20, senX + 20, jy + jh / 2 + 20, 'sw')}

      <Lamp x={lampX} y={jy + jh / 2} />
      {wire(jx + jw, jy + jh / 2 - 14, lampX - 16, jy + jh / 2 - 14, 'sw')}
      {wire(jx + jw, jy + jh / 2, lampX - 16, jy + jh / 2, 'n')}
      {wire(jx + jw, jy + jh / 2 + 14, lampX - 16, jy + jh / 2 + 14, 'pe')}

      <Wago x={jx + 25} y={jy + 20} label="L" color="#ef4444" />
      <Wago x={jx + 55} y={jy + jh / 2} label="N" color="#3b82f6" />
      <Wago x={jx + 85} y={jy + jh / 2 + 15} label="PE" color="#22c55e" />

      <WireLegend x={30} y={345} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
// 12. СУМЕРЕЧНЫЙ ВЫКЛЮЧАТЕЛЬ (ФОТОРЕЛЕ)
// ══════════════════════════════════════════════════════════
export const SvgTwilightSwitch: React.FC = () => {
  const jx = 200, jy = 90, jw = 150, jh = 110, phX = 60, lampX = 470, feedY = 280
  return (
    <svg viewBox="0 0 580 360" className="w-full h-auto" fill="none" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
      <CommonDefs />
      {wire(275, feedY, 275, jy + jh, 'l')}
      {wire(295, feedY, 295, jy + jh, 'n')}
      {wire(315, feedY, 315, jy + jh, 'pe')}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      {/* Фотореле */}
      <g>
        <rect x={phX - 20} y={jy + jh / 2 - 25} width="40" height="50" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
        <circle cx={phX} cy={jy + jh / 2 - 10} r="10" fill="white" stroke={C.amber} strokeWidth="1" />
        <path d={`M${phX - 5} ${jy + jh / 2 - 10} L${phX + 5} ${jy + jh / 2 - 10} M${phX} ${jy + jh / 2 - 15} L${phX} ${jy + jh / 2 - 5}`} stroke={C.amber} strokeWidth="1.5" />
        <text x={phX} y={jy + jh / 2 + 38} textAnchor="middle" fontSize="9" fill={C.txtSec} fontWeight="bold">Фотореле</text>
      </g>

      {wire(jx, jy + jh / 2 - 14, phX + 20, jy + jh / 2 - 14, 'l')}
      {wire(jx, jy + jh / 2 + 8, phX + 20, jy + jh / 2 + 8, 'sw')}

      <Lamp x={lampX} y={jy + jh / 2} />
      {wire(jx + jw, jy + jh / 2 - 14, lampX - 16, jy + jh / 2 - 14, 'sw')}
      {wire(jx + jw, jy + jh / 2, lampX - 16, jy + jh / 2, 'n')}
      {wire(jx + jw, jy + jh / 2 + 14, lampX - 16, jy + jh / 2 + 14, 'pe')}

      <Wago x={jx + 25} y={jy + 20} label="L" color="#ef4444" />
      <Wago x={jx + 55} y={jy + jh / 2} label="N" color="#3b82f6" />
      <Wago x={jx + 85} y={jy + jh / 2 + 15} label="PE" color="#22c55e" />

      <WireLegend x={30} y={340} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
// 13. РОЗЕТКА + ВЫКЛЮЧАТЕЛЬ (комбинированный блок)
// ══════════════════════════════════════════════════════════
export const SvgSocketSwitch: React.FC = () => {
  const jx = 200, jy = 80, jw = 170, jh = 130, swX = 50, skX = 50, lampX = 480, feedY = 290
  const swY = jy + jh / 2 - 25, skY = jy + jh / 2 + 30
  return (
    <svg viewBox="0 0 600 370" className="w-full h-auto" fill="none" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
      <CommonDefs />
      {wire(280, feedY, 280, jy + jh, 'l')}
      {wire(300, feedY, 300, jy + jh, 'n')}
      {wire(320, feedY, 320, jy + jh, 'pe')}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      {/* Выключатель (сверху блока) */}
      <Switch1 x={swX} y={swY} label="Выключатель" />
      {/* Розетка (снизу блока) */}
      <Socket x={skX} y={skY} label="Розетка" />

      {/* Провода к блоку */}
      {wire(jx, swY - 12, swX + 20, swY - 12, 'l')}
      {wire(jx, swY + 12, swX + 20, swY + 12, 'sw')}
      {wire(jx, skY, skX + 20, skY, 'n')}
      {wire(jx, skY + 14, skX + 20, skY + 14, 'pe')}

      <Lamp x={lampX} y={swY} />
      {wire(jx + jw, swY - 14, lampX - 16, swY - 14, 'sw')}
      {wire(jx + jw, swY, lampX - 16, swY, 'n')}
      {wire(jx + jw, swY + 14, lampX - 16, swY + 14, 'pe')}

      <Wago x={jx + 25} y={jy + 20} label="L" color="#ef4444" ports={3} />
      <Wago x={jx + 55} y={jy + jh / 2} label="N" color="#3b82f6" ports={3} />
      <Wago x={jx + 85} y={jy + jh / 2 + 30} label="PE" color="#22c55e" ports={3} />

      <WireLegend x={30} y={345} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
// 14. ПРОХОДНОЙ — 5+ ТОЧЕК (много перекрёстных)
// ══════════════════════════════════════════════════════════
export const SvgPassThrough5: React.FC = () => {
  const jx = 220, jy = 80, jw = 170, jh = 130, sw1X = 30, cross1X = 250, cross2X = 350, cross3X = 450, sw2X = 560, lampX = 660, feedY = 290
  return (
    <svg viewBox="0 0 760 380" className="w-full h-auto" fill="none" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
      <CommonDefs />
      {wire(310, feedY, 310, jy + jh, 'l')}
      {wire(330, feedY, 330, jy + jh, 'n')}
      {wire(350, feedY, 350, jy + jh, 'pe')}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <PassSwitch x={sw1X} y={jy + jh / 2} label="S1" />
      <CrossSwitch x={cross1X} y={jy + jh / 2} label="S2✕" />
      <CrossSwitch x={cross2X} y={jy + jh / 2} label="S3✕" />
      <CrossSwitch x={cross3X} y={jy + jh / 2} label="S4✕" />
      <PassSwitch x={sw2X} y={jy + jh / 2} label="S5" />

      {/* Линии связи */}
      {wire(sw1X + 20, jy + jh / 2 - 10, cross1X - 15, jy + jh / 2 - 10, 'sw')}
      {wire(sw1X + 20, jy + jh / 2 + 10, cross1X - 15, jy + jh / 2 + 10, 'sw')}
      {wire(cross1X + 15, jy + jh / 2 - 10, cross2X - 15, jy + jh / 2 - 10, 'sw')}
      {wire(cross2X + 15, jy + jh / 2 - 10, cross3X - 15, jy + jh / 2 - 10, 'sw')}
      {wire(cross3X + 15, jy + jh / 2 - 10, sw2X - 20, jy + jh / 2 - 10, 'sw')}

      {/* L к S1 */}
      {wire(jx, jy + jh / 2 - 20, sw1X + 20, jy + jh / 2 - 20, 'l')}
      {/* SW от S5 к лампе */}
      {wire(sw2X - 20, jy + jh / 2 - 20, jx + jw, jy + jh / 2 - 20, 'sw')}

      <Lamp x={lampX} y={jy + jh / 2} />
      {wire(jx + jw, jy + jh / 2 - 14, lampX - 16, jy + jh / 2 - 14, 'sw')}
      {wire(jx + jw, jy + jh / 2, lampX - 16, jy + jh / 2, 'n')}
      {wire(jx + jw, jy + jh / 2 + 14, lampX - 16, jy + jh / 2 + 14, 'pe')}

      <Wago x={jx + 25} y={jy + 20} label="L" color="#ef4444" />
      <Wago x={jx + 55} y={jy + jh / 2} label="N" color="#3b82f6" />
      <Wago x={jx + 85} y={jy + jh / 2 + 15} label="PE" color="#22c55e" />

      <WireLegend x={30} y={355} />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
// 15. ДВУХКЛАВИШНЫЙ ПРОХОДНОЙ С ПЕРЕКРЁСТНЫМ
// ══════════════════════════════════════════════════════════
export const SvgDualCrossPass: React.FC = () => {
  const jx = 220, jy = 75, jw = 180, jh = 150, sw1X = 30, crossX = 300, sw2X = 460
  const lamp1X = 600, lamp2X = 600, lamp1Y = jy + jh / 2 - 35, lamp2Y = jy + jh / 2 + 35
  const feedY = 310
  return (
    <svg viewBox="0 0 700 400" className="w-full h-auto" fill="none" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
      <CommonDefs />
      {wire(310, feedY, 310, jy + jh, 'l')}
      {wire(330, feedY, 330, jy + jh, 'n')}
      {wire(350, feedY, 350, jy + jh, 'pe')}

      <JBox x={jx} y={jy} w={jw} h={jh} />
      <PassSwitch x={sw1X} y={lamp1Y} label="S1A" />
      <CrossSwitch x={crossX} y={lamp1Y} label="S2✕A" />
      <PassSwitch x={sw2X} y={lamp1Y} label="S3A" />
      <PassSwitch x={sw1X} y={lamp2Y} label="S1B" />
      <CrossSwitch x={crossX} y={lamp2Y} label="S2✕B" />
      <PassSwitch x={sw2X} y={lamp2Y} label="S3B" />

      <Lamp x={lamp1X} y={lamp1Y} />
      <Lamp x={lamp2X} y={lamp2Y} />

      {/* Коробка */}
      <Wago x={jx + 25} y={jy + 20} label="L" color="#ef4444" />
      <Wago x={jx + 55} y={jy + jh / 2} label="N" color="#3b82f6" />
      <Wago x={jx + 85} y={jy + jh / 2 + 30} label="PE" color="#22c55e" />

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
    connections: [
      "В коробке: N(щиток) → N(лампа)",
      "В коробке: PE(щиток) → PE(лампа)",
      "В коробке: L(щиток) → L(выключатель)",
      "В коробке: SW(выключатель) → L(лампа)",
    ],
    Svg: SvgSingleSwitch,
  },
  {
    id: "two-key-switch",
    title: "Двухклавишный выключатель",
    description: "Управление двумя группами ламп (люстра: 2×60Вт).",
    category: "Обычные",
    cableInfo: "4×1.5мм² (L+L1+L2+N+PE)",
    devices: "Выключатель 2кл, 2 лампы",
    connections: [
      "В коробке: N(щиток) → N(лампа1) + N(лампа2)",
      "В коробке: PE(щиток) → PE(лампа1) + PE(лампа2)",
      "В коробке: L(щиток) → L(выключатель)",
      "В коробке: SW1(выключатель) → L(лампа1)",
      "В коробке: SW2(выключатель) → L(лампа2)",
    ],
    Svg: SvgTwoKeySwitch,
  },
  {
    id: "three-key-switch",
    title: "Трёхклавишный выключатель",
    description: "Управление тремя группами освещения.",
    category: "Обычные",
    cableInfo: "5×1.5мм² (L+L1+L2+L3+N+PE)",
    devices: "Выключатель 3кл, 3 лампы",
    connections: [
      "В коробке: N(щиток) → N(лампа1) + N(лампа2) + N(лампа3)",
      "В коробке: PE(щиток) → PE(лампа1) + PE(лампа2) + PE(лампа3)",
      "В коробке: L(щиток) → L(выключатель)",
      "В коробке: SW1(выключатель) → L(лампа1)",
      "В коробке: SW2(выключатель) → L(лампа2)",
      "В коробке: SW3(выключатель) → L(лампа3)",
    ],
    Svg: SvgThreeKeySwitch,
  },
  {
    id: "pass-through-2",
    title: "Проходной выключатель — 2 точки",
    description: "Управление освещением из двух мест (коридор, спальня).",
    category: "Проходные",
    cableInfo: "5×1.5мм² (L+P1+P2+N+PE)",
    devices: "2 проходных выключателя, лампа",
    connections: [
      "В коробке: L(щиток) → COM(S1)",
      "Между S1 и S2: P1 ↔ P1",
      "Между S1 и S2: P2 ↔ P2",
      "В коробке: COM(S2) → L(лампа)",
      "В коробке: N(щиток) → N(лампа)",
      "В коробке: PE(щиток) → PE(лампа)",
    ],
    Svg: SvgPassThrough2,
  },
  {
    id: "pass-through-3",
    title: "Проходной + перекрёстный — 3 точки",
    description: "Управление из трёх мест: длинный коридор, лестница.",
    category: "Проходные",
    cableInfo: "5×1.5мм² (L+P1+P2+N+PE)",
    devices: "2 проходных + перекрёстный, лампа",
    connections: [
      "В коробке: L(щиток) → COM(S1)",
      "S1 → S2✕: P1/P2 (две жилы путешественники)",
      "S2✕ → S3: P1/P2 (две жилы путешественники)",
      "В коробке: COM(S3) → L(лампа)",
      "В коробке: N(щиток) → N(лампа)",
      "В коробке: PE(щиток) → PE(лампа)",
    ],
    Svg: SvgPassThrough3,
  },
  {
    id: "pass-through-4",
    title: "Два перекрёстных — 4 точки",
    description: "Управление из четырёх мест: офис, зал.",
    category: "Проходные",
    cableInfo: "5×1.5мм² (L+P1+P2+N+PE)",
    devices: "2 проходных + 2 перекрёстных, лампа",
    connections: [
      "В коробке: L(щиток) → COM(S1)",
      "S1 → S2✕: P1/P2",
      "S2✕ → S3✕: P1/P2",
      "S3✕ → S4: P1/P2",
      "В коробке: COM(S4) → L(лампа)",
      "В коробке: N(щиток) → N(лампа)",
      "В коробке: PE(щиток) → PE(лампа)",
    ],
    Svg: SvgPassThrough4,
  },
  {
    id: "dual-pass-through",
    title: "Двухклавишный проходной — 2 группы",
    description: "Две независимые группы проходного света (2×2 точки).",
    category: "Проходные",
    cableInfo: "7×1.5мм² (2×L+2×P1+2×P2+N+PE)",
    devices: "2 двухкл. проходных, 2 лампы",
    connections: [
      "Группа A: L(щиток) → COM(S1A)",
      "Группа A: P1/P2 между S1A и S2A",
      "Группа A: COM(S2A) → L(лампаA)",
      "Группа B: L(щиток) → COM(S1B)",
      "Группа B: P1/P2 между S1B и S2B",
      "Группа B: COM(S2B) → L(лампаB)",
      "В коробке: N(щиток) → N(лампаA) + N(лампаB)",
      "В коробке: PE(щиток) → PE(лампаA) + PE(лампаB)",
    ],
    Svg: SvgDualPassThrough,
  },
  {
    id: "pass-through-5",
    title: "Проходной — 5+ точек",
    description: "Управление из пяти и более мест: длинные коридоры, тоннели.",
    category: "Проходные",
    cableInfo: "5×1.5мм² (L+P1+P2+N+PE)",
    devices: "2 проходных + 3 перекрёстных, лампа",
    connections: [
      "В коробке: L(щиток) → COM(S1)",
      "S1 → S2✕: P1/P2",
      "S2✕ → S3✕: P1/P2",
      "S3✕ → S4✕: P1/P2",
      "S4✕ → S5: P1/P2",
      "В коробке: COM(S5) → L(лампа)",
      "В коробке: N(щиток) → N(лампа)",
      "В коробке: PE(щиток) → PE(лампа)",
    ],
    Svg: SvgPassThrough5,
  },
  {
    id: "dual-cross-pass",
    title: "Двухклавишный проходной с перекрёстным",
    description: "Две группы проходного света с доп. точками управления.",
    category: "Проходные",
    cableInfo: "7×1.5мм² (2×L+2×P1+2×P2+N+PE)",
    devices: "2 двухкл. проходных + 2 перекрёстных, 2 лампы",
    connections: [
      "Группа A: L(щиток) → COM(S1A)",
      "Группа A: P1/P2 между S1A и S2✕A, затем между S2✕A и S3A",
      "Группа A: COM(S3A) → L(лампаA)",
      "Группа B: L(щиток) → COM(S1B)",
      "Группа B: P1/P2 между S1B и S2✕B, затем между S2✕B и S3B",
      "Группа B: COM(S3B) → L(лампаB)",
      "В коробке: N(щиток) → N(лампаA) + N(лампаB)",
      "В коробке: PE(щиток) → PE(лампаA) + PE(лампаB)",
    ],
    Svg: SvgDualCrossPass,
  },
  {
    id: "impulse-relay",
    title: "Импульсное реле (бистабильное)",
    description: "Управление с неограниченного числа мест. Сигнал импульсом.",
    category: "Специальные",
    cableInfo: "3×1.5мм² (L+N+PE) + витая пара",
    devices: "Импульсное реле, кнопки, лампа",
    connections: [
      "В коробке: L(щиток) → клемма 1 реле (вход силовой)",
      "В коробке: клемма 2 реле (выход) → L(лампа)",
      "В коробке: N(щиток) → N(лампа) + A2(катушка реле)",
      "Кнопка: L(щиток) → кнопка → A1(катушка реле)",
      "В коробке: PE(щиток) → PE(лампа)",
    ],
    Svg: SvgImpulseRelay,
  },
  {
    id: "dimmer",
    title: "Диммер (регулятор яркости)",
    description: "Плавная регулировка яркости лампы.",
    category: "Специальные",
    cableInfo: "3×1.5мм² (L+N+PE)",
    devices: "Диммер, лампа",
    connections: [
      "В коробке: N(щиток) → N(лампа)",
      "В коробке: PE(щиток) → PE(лампа)",
      "В коробке: L(щиток) → L(диммер)",
      "В коробке: выход диммера (SW) → L(лампа)",
    ],
    Svg: SvgDimmer,
  },
  {
    id: "switch-with-indicator",
    title: "Выключатель с подсветкой",
    description: "Подсветка неонкой для поиска в темноте.",
    category: "Специальные",
    cableInfo: "3×1.5мм² (L+N+PE)",
    devices: "Выключатель с неонкой, лампа",
    connections: [
      "В коробке: N(щиток) → N(лампа) (и на подсветку, если требуется по модели)",
      "В коробке: PE(щиток) → PE(лампа)",
      "В коробке: L(щиток) → L(выключатель)",
      "В коробке: SW(выключатель) → L(лампа)",
    ],
    Svg: SvgSwitchWithIndicator,
  },
  {
    id: "motion-sensor",
    title: "Датчик движения",
    description: "Автоматическое включение при обнаружении движения.",
    category: "Автоматика",
    cableInfo: "3×1.5мм² (L+N+PE)",
    devices: "Датчик движения, лампа",
    connections: [
      "В коробке: L(щиток) → L(датчик)",
      "В коробке: N(щиток) → N(датчик) + N(лампа)",
      "В коробке: выход датчика (SW) → L(лампа)",
      "В коробке: PE(щиток) → PE(лампа)",
    ],
    Svg: SvgMotionSensor,
  },
  {
    id: "twilight-switch",
    title: "Сумеречный выключатель (фотореле)",
    description: "Автоматическое включение по уровню освещённости.",
    category: "Автоматика",
    cableInfo: "3×1.5мм² (L+N+PE)",
    devices: "Фотореле, лампа",
    connections: [
      "В коробке: L(щиток) → L(фотореле)",
      "В коробке: N(щиток) → N(лампа) (и на фотореле, если оно 3-проводное)",
      "В коробке: выход фотореле (SW) → L(лампа)",
      "В коробке: PE(щиток) → PE(лампа)",
    ],
    Svg: SvgTwilightSwitch,
  },
  {
    id: "socket-switch",
    title: "Розетка + выключатель",
    description: "Комбинированный блок: розетка и выключатель в одном месте.",
    category: "Комбинированные",
    cableInfo: "3×2.5мм² + 3×1.5мм²",
    devices: "Блок розетка+выключатель, лампа",
    connections: [
      "В коробке: L(щиток) → L(розетка) + L(выключатель)",
      "В коробке: N(щиток) → N(розетка) + N(лампа)",
      "В коробке: PE(щиток) → PE(розетка) + PE(лампа)",
      "В коробке: SW(выключатель) → L(лампа)",
    ],
    Svg: SvgSocketSwitch,
  },
]
