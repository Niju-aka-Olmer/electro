import React from 'react'

// ─── ЦВЕТА ───
const C = {
  l: '#ef4444',
  n: '#3b82f6',
  pe: '#22c55e',
  sw: '#a855f7',
  bg: 'var(--bg-surface)',
  txt: 'var(--text-primary)',
}

function HLine({ y, color, label }: { y: number, color: string, label: string }) {
  return (
    <g>
      <line x1={50} y1={y} x2={650} y2={y} stroke={color} strokeWidth={3} />
      <text x={30} y={y + 4} fontSize={14} fill={color} fontWeight="bold">{label}</text>
    </g>
  )
}

function VLine({ x, y1, y2, color }: { x: number, y1: number, y2: number, color: string }) {
  return <line x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth={3} />
}

function Dot({ x, y, color }: { x: number, y: number, color: string }) {
  return <circle cx={x} cy={y} r={4} fill={color} />
}

function SchematicSwitch({ x, y, label }: { x: number, y: number, label: string }) {
  return (
    <g>
      <circle cx={x} cy={y - 20} r={4} fill="none" stroke={C.txt} strokeWidth={2} />
      <circle cx={x} cy={y + 20} r={4} fill="none" stroke={C.txt} strokeWidth={2} />
      <line x1={x} y1={y - 16} x2={x + 15} y2={y + 15} stroke={C.txt} strokeWidth={2} />
      <text x={x + 25} y={y + 5} fontSize={12} fill={C.txt}>{label}</text>
    </g>
  )
}

function SchematicLamp({ x, y, label }: { x: number, y: number, label: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={20} fill="none" stroke={C.txt} strokeWidth={2} />
      <line x1={x - 14} y1={y - 14} x2={x + 14} y2={y + 14} stroke={C.txt} strokeWidth={2} />
      <line x1={x - 14} y1={y + 14} x2={x + 14} y2={y - 14} stroke={C.txt} strokeWidth={2} />
      <text x={x + 30} y={y + 5} fontSize={12} fill={C.txt}>{label}</text>
    </g>
  )
}

export const SvgSingleSwitch: React.FC = () => {
  return (
    <svg viewBox="0 0 700 400" className="w-full h-auto" fill="none" style={{ background: C.bg }}>
      {/* Главные шины */}
      <HLine y={50} color={C.l} label="L" />
      <HLine y={100} color={C.n} label="N" />
      <HLine y={150} color={C.pe} label="PE" />

      {/* Опуск L к выключателю */}
      <VLine x={200} y1={50} y2={250} color={C.l} />
      <Dot x={200} y={50} color={C.l} />
      <SchematicSwitch x={200} y={270} label="S1" />

      {/* Линия от выключателя к лампе */}
      <VLine x={200} y1={290} y2={320} color={C.sw} />
      <line x1={200} y1={320} x2={400} y2={320} stroke={C.sw} strokeWidth={3} />
      <VLine x={400} y1={290} y2={320} color={C.sw} />

      <SchematicLamp x={400} y={270} label="HL1" />

      {/* Подъем от лампы к N и PE */}
      <VLine x={400} y1={100} y2={250} color={C.n} />
      <Dot x={400} y={100} color={C.n} />

      <VLine x={420} y1={150} y2={250} color={C.pe} />
      <Dot x={420} y={150} color={C.pe} />
    </svg>
  )
}
