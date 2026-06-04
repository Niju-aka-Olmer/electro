const fs = require('fs');
const path = './src/data/wiring-schemes.tsx';
let code = fs.readFileSync(path, 'utf8');

const startMarker = '// ─── ЦВЕТА (через CSS-переменные для тёмной/светлой темы) ───';
const endMarker = '// ══════════════════════════════════════════════════════════\n//  1. ОДНОКЛАВИШНЫЙ ВЫКЛЮЧАТЕЛЬ';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found!');
  console.error('start:', startIndex, 'end:', endIndex);
  process.exit(1);
}

const newPrimitives = `// ─── ЦВЕТА (ЧИСТЫЙ ПРОФЕССИОНАЛЬНЫЙ CAD-СТИЛЬ ГОСТ) ───
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
      <path d={\`M\${x - 10} \${y - 10} L\${x + 10} \${y + 10} M\${x - 10} \${y + 10} L\${x + 10} \${y - 10}\`} stroke="#1e293b" strokeWidth="2" />
      <text x={x} y={y + 26} textAnchor="middle" fontSize="11" fill="#1e293b" fontFamily="monospace" fontWeight="bold">HL</text>
    </g>
  )
}

function SwitchBase({ x, y, keys = 1, label }: { x: number; y: number; keys?: 1 | 2 | 3; label?: string }) {
  return (
    <g>
      <circle cx={x - 12} cy={y} r="3" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
      <path d={\`M\${x - 10} \${y - 2} L\${x + 12} \${y - 16}\`} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      {keys > 1 && <path d={\`M\${x - 2} \${y - 6} L\${x + 10} \${y - 10}\`} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />}
      {keys > 2 && <path d={\`M\${x + 4} \${y - 10} L\${x + 14} \${y - 13}\`} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />}
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
      <path d={\`M\${x - 10} \${y - 2} L\${x + 12} \${y - 16}\`} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      <path d={\`M\${x - 10} \${y + 2} L\${x + 12} \${y + 16}\`} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
      {label && <text x={x} y={y + 24} textAnchor="middle" fontSize="11" fill="#1e293b" fontFamily="monospace">{label}</text>}
    </g>
  )
}

function CrossSwitch({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g>
      <circle cx={x - 12} cy={y - 8} r="3" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
      <circle cx={x - 12} cy={y + 8} r="3" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
      <path d={\`M\${x - 10} \${y - 8} L\${x + 12} \${y + 8}\`} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      <path d={\`M\${x - 10} \${y + 8} L\${x + 12} \${y - 8}\`} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      {label && <text x={x} y={y + 24} textAnchor="middle" fontSize="11" fill="#1e293b" fontFamily="monospace">{label}</text>}
    </g>
  )
}

function Socket({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g>
      <path d={\`M\${x - 12} \${y} A 12 12 0 0 0 \${x + 12} \${y}\`} fill="none" stroke="#1e293b" strokeWidth="2" />
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

`;

code = code.substring(0, startIndex) + newPrimitives + code.substring(endIndex);
code = code.replace(/style={{ background: 'var\(--bg-surface\)' }}/g, 'style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}');

fs.writeFileSync(path, code);
console.log('Successfully patched primitives.');
