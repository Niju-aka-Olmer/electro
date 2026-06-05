'use client'

import React, { useMemo } from 'react'
import type { CalculationResult, CircuitBreaker, RCD, LoadBreakSwitch, PhaseId } from '@/types/electrical'

// ─── КОНСТАНТЫ ───
const MOD_W = 18             // ширина 1 модуля в px
const MOD_H = 52             // высота устройства
const ROW_GAP = 8            // отступ между DIN-рейками
const PANEL_PAD = 14         // отступ внутри корпуса
const DIN_H = 6               // DIN-рейка высота
const ROW_MODS = 12          // модулей на ряд
const ROW_W = ROW_MODS * MOD_W
const BUS_W = ROW_W + 60     // ширина шин справа

// ─── ЦВЕТА (профессиональный CAD-стиль) ───
const COLORS = {
  panelBrd: '#1e293b',
  panelBg:  '#f8fafc',
  dinRail:  '#94a3b8',
  txt:      '#1e293b',
  txtDim:   '#64748b',
  l1:       '#ef4444',
  l2:       '#f59e0b',
  l3:       '#8b5cf6',
  n:        '#3b82f6',
  pe:       '#22c55e',

  // Типы устройств
  loadSwitch:   '#fef3c7',  // рубильник — жёлтый
  mainBkr:      '#fce7f3',  // вводной — розовый
  rcd:          '#fff7ed',  // УЗО — оранжевый
  diff:         '#fef2f2',  // диф — красноватый
  group:        '#eff6ff',  // группа — голубой
  groupLight:   '#f0f9ff',
}

interface DeviceCell {
  id: string
  type: string
  label: string
  sublabel: string
  modules: number
  row: number
  col: number // offset in modules from row start
  phase?: PhaseId
  color: string
}

// ─── УТИЛИТА РАСКЛАДКИ ───
function layoutDevices(result: CalculationResult): { cells: DeviceCell[]; rows: number } {
  const cells: DeviceCell[] = []

  // Собираем все устройства в порядке монтажа
  const items: { id: string; type: string; label: string; sublabel: string; modules: number; phase?: PhaseId }[] = []

  // 1. Рубильник
  if (result.loadBreakSwitch) {
    const lbs = result.loadBreakSwitch
    items.push({ id: lbs.id, type: 'load_break_switch', label: 'Рубильник', sublabel: `${lbs.rating}А / ${lbs.poles}P`, modules: lbs.modules, phase: lbs.phase })
  }

  // 2. Вводной автомат
  const mb = result.mainBreaker
  items.push({ id: mb.id, type: 'main_breaker', label: 'Вводной', sublabel: `${mb.rating}А ${mb.characteristic} / ${mb.poles}P`, modules: mb.modules, phase: mb.phase })

  // 3. УЗО и дифы
  for (const d of result.devices) {
    if (d.type === 'rcd' || d.type === 'diff_breaker') {
      const rcd = d as RCD
      const label = rcd.type === 'diff_breaker' ? 'Диф.автомат' : 'УЗО'
      items.push({ id: rcd.id, type: rcd.type, label, sublabel: `${rcd.ratingAmps}А / ${rcd.leakageMA}мА / ${rcd.poles}P`, modules: rcd.modules, phase: rcd.phase })
    }
  }

  // 4. Групповые автоматы
  for (const d of result.devices) {
    if (d.type === 'circuit_breaker' || d.type === 'main_breaker') {
      const cb = d as CircuitBreaker
      if (cb.id === 'main') continue // уже добавили
      items.push({ id: cb.id, type: 'circuit_breaker', label: cb.group.length > 18 ? cb.group.slice(0, 16) + '…' : cb.group, sublabel: `${cb.rating}А ${cb.characteristic} / ${cb.poles}P`, modules: cb.modules, phase: cb.phase })
    }
  }

  // Раскладываем по рядам (жадный алгоритм)
  const rowCapacity = ROW_MODS
  let currentRow = 0
  let currentCol = 0

  for (const item of items) {
    if (currentCol + item.modules > rowCapacity) {
      currentRow++
      currentCol = 0
    }
    const colorMap: Record<string, string> = {
      load_break_switch: COLORS.loadSwitch,
      main_breaker: COLORS.mainBkr,
      rcd: COLORS.rcd,
      diff_breaker: COLORS.diff,
      circuit_breaker: item.modules >= 3 ? COLORS.rcd : COLORS.group,
    }
    cells.push({
      ...item,
      row: currentRow,
      col: currentCol,
      color: colorMap[item.type] || COLORS.group,
    })
    currentCol += item.modules
  }

  return { cells, rows: currentRow + 1 }
}

// ─── КОМПОНЕНТ УСТРОЙСТВА ───
function DeviceBlock({ cell, x, y }: { cell: DeviceCell; x: number; y: number }) {
  const w = cell.modules * MOD_W - 2
  const h = MOD_H
  const phaseColor = cell.phase
    ? cell.phase === 'L1'
      ? COLORS.l1
      : cell.phase === 'L2'
        ? COLORS.l2
        : cell.phase === 'L3'
          ? COLORS.l3
          : COLORS.txt
    : COLORS.txt

  return (
    <g>
      {/* Корпус */}
      <rect x={x} y={y} width={w} height={h} rx={3} fill={cell.color} stroke={COLORS.txt} strokeWidth={1.5} />
      {/* Верхняя полоса (тип) */}
      <rect x={x} y={y} width={w} height={3} rx={1.5} fill={phaseColor} />
      {/* Маркировка фазы */}
      {cell.phase && cell.phase.match(/^L[123]/) && (
        <text x={x + 4} y={y + 4} fontSize={7} fill={COLORS.txtDim} fontFamily="monospace" fontWeight="bold">
          {cell.phase}
        </text>
      )}
      {/* Основная подпись */}
      <text x={x + w / 2} y={y + h / 2 - 3} textAnchor="middle" fontSize={10} fill={COLORS.txt} fontWeight="bold" fontFamily="monospace">
        {cell.label}
      </text>
      {/* Подпись номинала */}
      <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fontSize={9} fill={COLORS.txtDim} fontFamily="monospace">
        {cell.sublabel}
      </text>
    </g>
  )
}

// ─── ШИНА ФАЗЫ ───
function PhaseBusbar({ x, y, width, phase, label }: { x: number; y: number; width: number; phase: string; label: string }) {
  const color = phase === 'L1' ? COLORS.l1 : phase === 'L2' ? COLORS.l2 : phase === 'L3' ? COLORS.l3 : phase === 'N' ? COLORS.n : COLORS.pe
  return (
    <g>
      <rect x={x} y={y} width={width} height={12} rx={2} fill={color} opacity={0.85} />
      <text x={x + width + 4} y={y + 10} fontSize={9} fill={COLORS.txt} fontFamily="monospace" fontWeight="bold">{label}</text>
    </g>
  )
}

// ─── ГЛАВНЫЙ КОМПОНЕНТ ───
export const PanelSvg: React.FC<{ result: CalculationResult }> = ({ result }) => {
  const { cells, rows } = useMemo(() => layoutDevices(result), [result])

  const panelW = ROW_W + 2 * PANEL_PAD
  const panelH = rows * (MOD_H + ROW_GAP + DIN_H) + 2 * PANEL_PAD + 40 // +40 для шин
  const busX = PANEL_PAD
  const busY = rows * (MOD_H + ROW_GAP + DIN_H) + PANEL_PAD + 16

  return (
    <svg viewBox={`0 0 ${panelW} ${panelH}`} className="w-full h-auto" fill="none" style={{ maxWidth: panelW }}>
      {/* Корпус щитка */}
      <rect x={2} y={2} width={panelW - 4} height={panelH - 4} rx={6} fill={COLORS.panelBg} stroke={COLORS.panelBrd} strokeWidth={2} />

      {/* DIN-рейки и устройства */}
      {Array.from({ length: rows }).map((_, rowIdx) => {
        const dinY = PANEL_PAD + rowIdx * (MOD_H + ROW_GAP + DIN_H) + (DIN_H + 4)
        const rowCells = cells.filter(c => c.row === rowIdx)

        return (
          <g key={`row-${rowIdx}`}>
            {/* DIN-рейка */}
            <rect
              x={PANEL_PAD}
              y={dinY - 3}
              width={ROW_W}
              height={DIN_H}
              rx={2}
              fill={COLORS.dinRail}
              opacity={0.3}
            />
            {/* Устройства на рейке */}
            {rowCells.map(cell => (
              <DeviceBlock
                key={cell.id}
                cell={cell}
                x={PANEL_PAD + cell.col * MOD_W}
                y={dinY - MOD_H + DIN_H / 2 + 2}
              />
            ))}
            {/* Гребёнка (шина под автоматами) */}
            <line
              x1={PANEL_PAD}
              y1={dinY - 2}
              x2={PANEL_PAD + ROW_W}
              y2={dinY - 2}
              stroke={COLORS.txtDim}
              strokeWidth={1}
              strokeDasharray="4 3"
              opacity={0.5}
            />
          </g>
        )
      })}

      {/* Шины фаз (внизу щитка) */}
      {result.supplyPhases === 3 ? (
        <>
          <PhaseBusbar x={busX} y={busY} width={ROW_W} phase="L1" label="L1" />
          <PhaseBusbar x={busX} y={busY + 16} width={ROW_W} phase="L2" label="L2" />
          <PhaseBusbar x={busX} y={busY + 32} width={ROW_W} phase="L3" label="L3" />
        </>
      ) : (
        <PhaseBusbar x={busX} y={busY} width={ROW_W} phase="L1" label="L" />
      )}
      <PhaseBusbar x={busX} y={busY + (result.supplyPhases === 3 ? 48 : 16)} width={ROW_W} phase="N" label="N" />

      {/* Подписи */}
      <text x={PANEL_PAD} y={PANEL_PAD + 8} fontSize={11} fill={COLORS.txt} fontWeight="bold" fontFamily="monospace">
        Щит: {result.recommendedPanelModules} модулей / {rows} ряда
      </text>
    </svg>
  )
}
