'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CalculationResult, CircuitBreaker, RCD, PhaseId } from '@/types/electrical'

// ─── КОНСТАНТЫ ───
const MOD_W = 44   // ширина 1 модуля в px
const DEV_H = 54   // высота карточки устройства
const DIN_H = 6    // высота DIN-рейки
const TOP_H = 28   // высота верхней разводки
const BOT_H = 52   // высота нижней разводки (выходы)

// ─── ТИПЫ ───
interface PanelItem {
  id: string
  type: string
  label: string
  sublabel: string
  modules: number
  phase?: PhaseId
  rating: number
  character: string
  poles: number
  ref: string
  protectedGroupIds: string[] // id защищаемых групп (только для RCD/diff)
}

// ─── ЦВЕТА ПО ТИПУ УСТРОЙСТВА ───
function devColor(type: string): { stripe: string; bg: string; text: string; label: string } {
  switch (type) {
    case 'main_breaker':
      return { stripe: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', label: 'ВВОД' }
    case 'load_break_switch':
      return { stripe: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', label: 'РУБ' }
    case 'rcd':
      return { stripe: 'bg-blue-400', bg: 'bg-blue-50', text: 'text-blue-700', label: 'УЗО' }
    case 'diff_breaker':
      return { stripe: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'ДИФ' }
    case 'panel_equipment':
      return { stripe: 'bg-gray-300', bg: 'bg-gray-100', text: 'text-gray-500', label: 'ОБ' }
    default:
      return { stripe: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-700', label: 'АВ' }
  }
}

// ─── ЦВЕТА ПРОВОДОВ ───
const WIRE: Record<string, string> = { L: '#e74c3c', L1: '#e74c3c', L2: '#f39c12', L3: '#9b59b6', N: '#3498db', PE: '#27ae60' }

function getPole(item: PanelItem, modIdx: number): { label: string; color: string } | null {
  if (item.type === 'rcd' || item.type === 'diff_breaker') {
    if (item.poles >= 2 && modIdx === item.poles - 1) return { label: 'N', color: WIRE.N }
  }
  if (item.poles === 1) return { label: 'L', color: WIRE.L }
  if (item.poles === 2) {
    return modIdx === 0 ? { label: 'L', color: WIRE.L } : { label: 'N', color: WIRE.N }
  }
  if (item.poles === 3) {
    const labels = ['L1', 'L2', 'L3']
    return { label: labels[modIdx], color: WIRE[labels[modIdx]] }
  }
  if (item.poles === 4) {
    if (modIdx < 3) {
      const labels = ['L1', 'L2', 'L3']
      return { label: labels[modIdx], color: WIRE[labels[modIdx]] }
    }
    return { label: 'N', color: WIRE.N }
  }
  return null
}

// Сборка позиций устройств в ряду
function buildPositions(items: PanelItem[]): { x: number; w: number; item: PanelItem }[] {
  const pos: { x: number; w: number; item: PanelItem }[] = []
  let cur = 0
  for (const it of items) {
    pos.push({ x: cur, w: it.modules * MOD_W, item: it })
    cur += it.modules * MOD_W
  }
  return pos
}

// ─── ДРАГАБЕЛЬНАЯ КАРТОЧКА УСТРОЙСТВА ───
function DeviceCard({ item }: { item: PanelItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const w = item.modules * MOD_W
  const c = devColor(item.type)

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    width: w,
    height: DEV_H,
    position: 'relative',
    opacity: isDragging ? 0.9 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex-shrink-0 cursor-grab active:cursor-grabbing select-none">
      <div
        className="relative h-full rounded-sm bg-white overflow-hidden"
        style={{
          border: '1.5px solid #d0d0d0',
          boxShadow: isDragging ? '0 4px 20px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        {/* Цветная полоса слева */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${c.stripe}`} />

        {/* Верхние клеммы */}
        <div className="absolute top-0.5 left-2 right-1 flex" style={{ gap: MOD_W - 6 }}>
          {Array.from({ length: item.modules }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 border border-gray-400" />
          ))}
        </div>

        {/* Тело устройства */}
        <div className="absolute inset-x-0 top-3 bottom-3 flex flex-col items-center justify-center">
          <span className={`text-[13px] font-bold leading-none ${c.text}`}>{item.rating}A</span>
          {item.character && <span className="text-[10px] font-bold text-gray-400 leading-none">{item.character}</span>}
          <span className={`text-[8px] font-extrabold leading-none mt-0.5 ${c.text} opacity-60 tracking-wider`}>{c.label}</span>
          {(item.type === 'rcd' || item.type === 'diff_breaker') && (
            <span className="text-[7px] text-gray-400 leading-none mt-0.5">{item.sublabel}</span>
          )}
        </div>

        {/* Нижние клеммы */}
        <div className="absolute bottom-0.5 left-2 right-1 flex" style={{ gap: MOD_W - 6 }}>
          {Array.from({ length: item.modules }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 border border-gray-400" />
          ))}
        </div>

        {/* Реф (правый верхний угол) */}
        <span className="absolute top-0 right-1 text-[7px] font-mono text-gray-400 font-bold">{item.ref}</span>

        {/* Фаза (левый верхний угол) */}
        {item.phase && <span className="absolute top-0 left-2.5 text-[6px] font-mono text-gray-400">{item.phase}</span>}

        {/* Подпись группы внизу */}
        <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[7px] text-gray-400 whitespace-nowrap truncate" style={{ maxWidth: w - 6 }}>
          {item.label.substring(0, 14)}
        </span>
      </div>
    </div>
  )
}

// ─── ВЕРХНЯЯ РАЗВОДКА (приход) ───
function TopWiring({ items, rowIndex, supplyPhases }: { items: PanelItem[]; rowIndex: number; supplyPhases: 1 | 3 }) {
  const totalWidth = items.reduce((s, i) => s + i.modules * MOD_W, 0)
  const halfW = totalWidth / 2
  const is3 = supplyPhases === 3

  // Позиции шин
  const busY = { PE: 6, N: is3 ? 10 : 14, L3: 14.5, L2: 17.5, L1: 20.5 }

  // Строим проводники от шин к клеммам
  const drops: { key: string; x: number; y1: number; y2: number; color: string; label: string }[] = []
  let curX = 0
  for (const it of items) {
    for (let mi = 0; mi < it.modules; mi++) {
      const pole = getPole(it, mi)
      if (!pole) continue
      const cx = curX + mi * MOD_W + MOD_W / 2
      const key = pole.label as keyof typeof busY
      const yb = busY[key] ?? busY.L1
      drops.push({ key: `tw-${it.id}-${mi}`, x: cx, y1: TOP_H, y2: yb + 1.5, color: pole.color, label: pole.label })
    }
    curX += it.modules * MOD_W
  }

  return (
    <div style={{ width: totalWidth, height: TOP_H }}>
      <svg width={totalWidth} height={TOP_H} viewBox={`0 0 ${totalWidth} ${TOP_H}`}>
        {/* Вводной кабель (только первый ряд) */}
        {rowIndex === 0 && (
          <>
            <rect x={halfW - 3} y={0} width={6} height={12} rx={2} fill="#333" />
            <line x1={halfW - 4} y1={12} x2={halfW - 4} y2={busY.L1 - 1} stroke="#e74c3c" strokeWidth={2} strokeLinecap="round" />
            <line x1={halfW + 1} y1={12} x2={halfW + 1} y2={busY.N - 1} stroke="#3498db" strokeWidth={2} strokeLinecap="round" />
            <line x1={halfW + 5} y1={12} x2={halfW + 5} y2={busY.PE - 1} stroke="#27ae60" strokeWidth={2} strokeLinecap="round" />
          </>
        )}

        {/* Гребёнки */}
        <rect x={0} y={busY.L1} width={totalWidth} height={2.5} rx={1} fill="#e74c3c" opacity={0.85} />
        {is3 && (
          <>
            <rect x={0} y={busY.L3} width={totalWidth} height={2} rx={1} fill="#9b59b6" opacity={0.85} />
            <rect x={0} y={busY.L2} width={totalWidth} height={2} rx={1} fill="#f39c12" opacity={0.85} />
          </>
        )}
        <rect x={0} y={busY.N} width={totalWidth} height={2.5} rx={1} fill="#3498db" opacity={0.85} />
        <rect x={0} y={busY.PE} width={totalWidth} height={2.5} rx={1} fill="#27ae60" opacity={0.85} />

        {/* Проводники от шин к устройствам */}
        {drops.map(d => (
          <line key={d.key} x1={d.x} y1={d.y1} x2={d.x} y2={d.y2} stroke={d.color} strokeWidth={1.2} strokeLinecap="round" />
        ))}
      </svg>
    </div>
  )
}

// ─── НИЖНЯЯ РАЗВОДКА (уход) ───
function BottomWiring({ items }: { items: PanelItem[] }) {
  const totalWidth = items.reduce((s, i) => s + i.modules * MOD_W, 0)
  const positions = buildPositions(items)

  // Шины
  const nY = 24
  const peY = 36

  return (
    <div style={{ width: totalWidth, height: BOT_H }}>
      <svg width={totalWidth} height={BOT_H} viewBox={`0 0 ${totalWidth} ${BOT_H}`}>
        {/* N шина */}
        <rect x={0} y={nY} width={totalWidth} height={4} rx={2} fill="#3498db" opacity={0.75} />
        <text x={totalWidth - 3} y={nY + 3} textAnchor="end" fontSize={5} fill="white" fontWeight="bold">N</text>
        {/* PE шина */}
        <rect x={0} y={peY} width={totalWidth} height={4} rx={2} fill="#27ae60" opacity={0.75} />
        <text x={totalWidth - 3} y={peY + 3} textAnchor="end" fontSize={5} fill="white" fontWeight="bold">PE</text>

        {/* Индивидуальные выходы */}
        {positions.map(dp => {
          const cx = dp.x + dp.w / 2
          const items: React.ReactNode[] = []

          // Фазные провода
          for (let mi = 0; mi < dp.item.modules; mi++) {
            const pole = getPole(dp.item, mi)
            if (!pole || pole.label === 'N') continue
            const px = dp.x + mi * MOD_W + MOD_W / 2
            items.push(
              <g key={`bw-l-${dp.item.id}-${mi}`}>
                <line x1={px} y1={1} x2={px} y2={BOT_H - 12} stroke={pole.color} strokeWidth={1.2} strokeLinecap="round" />
                <text x={px} y={BOT_H - 2} textAnchor="middle" fontSize={5} fill={pole.color} fontWeight="bold">{pole.label}</text>
              </g>
            )
          }

          // N
          const nFrom = dp.item.poles >= 2 ? 1 : nY + 2
          items.push(
            <g key={`bw-n-${dp.item.id}`}>
              <line x1={cx} y1={nFrom} x2={cx} y2={BOT_H - 12} stroke="#3498db" strokeWidth={1.2} strokeLinecap="round" />
              {dp.item.poles < 2 && <circle cx={cx} cy={nY + 2} r={1.5} fill="#3498db" />}
              <text x={cx} y={BOT_H - 2} textAnchor="middle" fontSize={5} fill="#3498db" fontWeight="bold">N</text>
            </g>
          )

          // PE
          items.push(
            <g key={`bw-pe-${dp.item.id}`}>
              <line x1={cx} y1={peY + 2} x2={cx} y2={BOT_H - 12} stroke="#27ae60" strokeWidth={1.2} strokeLinecap="round" />
              <circle cx={cx} cy={peY + 2} r={1.5} fill="#27ae60" />
              <text x={cx} y={BOT_H - 2} textAnchor="middle" fontSize={5} fill="#27ae60" fontWeight="bold">PE</text>
            </g>
          )

          // Метка нагрузки
          items.push(
            <text key={`bwl-${dp.item.id}`} x={cx} y={BOT_H - 20} textAnchor="middle" fontSize={5.5} fill="#999">
              {dp.item.label.substring(0, 14)}
            </text>
          )

          return <g key={`bw-${dp.item.id}`}>{items}</g>
        })}
      </svg>
    </div>
  )
}

// ─── ГРУППИРУЮЩИЕ СКОБКИ (УЗО/диф → автоматы) ───
function GroupBrackets({ items, positions }: { items: PanelItem[]; positions: { x: number; w: number; item: PanelItem }[] }) {
  // Находим все RCD/diff, у которых есть защищаемые группы
  const parents = positions.filter(p => p.item.protectedGroupIds.length > 0)
  if (parents.length === 0) return null

  const totalWidth = items.reduce((s, i) => s + i.modules * MOD_W, 0)

  const groups: { parent: typeof parents[0]; children: typeof positions }[] = []

  for (const parent of parents) {
    // Находим дочерние автоматы в том же ряду, чьи id есть в protectedGroupIds родителя
    const children = positions.filter(p =>
      p.item.id !== parent.item.id &&
      p.item.protectedGroupIds.length === 0 && // только простые автоматы
      parent.item.protectedGroupIds.some(gname => p.item.label.includes(gname) || gname.includes(p.item.label))
    )
    if (children.length > 0) {
      groups.push({ parent, children })
    }
  }

  if (groups.length === 0) return null

  return (
    <div className="relative" style={{ width: totalWidth, height: 14, marginBottom: -2 }}>
      <svg width={totalWidth} height={14} viewBox={`0 0 ${totalWidth} 14`}>
        {groups.map((g, gi) => {
          const parentColor = g.parent.item.type === 'rcd' ? '#1976d2' : '#00838f'
          const startX = g.parent.x
          const endX = g.parent.x + g.parent.w
          const childStartX = Math.min(...g.children.map(c => c.x))
          const childEndX = Math.max(...g.children.map(c => c.x + c.w))
          const bracketLeft = Math.min(startX, childStartX)
          const bracketRight = Math.max(endX, childEndX)
          const bracketW = bracketRight - bracketLeft

          return (
            <g key={`grp-${gi}`}>
              {/* Горизонтальная линия под родителем и детьми */}
              <rect x={bracketLeft} y={8} width={bracketW} height={2} rx={1} fill={parentColor} opacity={0.35} />
              {/* Вертикальные засечки к родителю */}
              <line x1={startX + g.parent.w / 2} y1={4} x2={startX + g.parent.w / 2} y2={9} stroke={parentColor} strokeWidth={1} opacity={0.35} />
              {/* Вертикальные засечки к детям */}
              {g.children.map((ch, ci) => (
                <line key={`ch-${ci}`} x1={ch.x + ch.w / 2} y1={4} x2={ch.x + ch.w / 2} y2={9} stroke={parentColor} strokeWidth={0.7} opacity={0.25} />
              ))}
              {/* Подпись снизу */}
              <text x={bracketLeft + bracketW / 2} y={13} textAnchor="middle" fontSize={6} fill={parentColor} opacity={0.7}>
                {g.parent.item.ref} → {g.parent.item.label.substring(0, 20)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── DIN-РЕЙКА ───
function DinRail({ width }: { width: number }) {
  return (
    <div style={{ width, height: DIN_H + 4 }}>
      <svg width={width} height={DIN_H + 4} viewBox={`0 0 ${width} ${DIN_H + 4}`}>
        <rect x={0} y={0} width={width} height={DIN_H + 4} rx={1} fill="#d0d0d0" />
        <rect x={0} y={0} width={width} height={2.5} fill="#bbb" rx={1} />
        <rect x={0} y={DIN_H + 1.5} width={width} height={2.5} fill="#bbb" rx={1} />
        <line x1={0} y1={2} x2={width} y2={2} stroke="rgba(255,255,255,0.4)" strokeWidth={0.5} />
      </svg>
    </div>
  )
}

// ─── РЯД УСТРОЙСТВ ───
function DeviceRow({
  row,
  rowIndex,
  supplyPhases,
}: {
  row: PanelItem[]
  rowIndex: number
  supplyPhases: 1 | 3
}) {
  const rowWidth = row.reduce((s, i) => s + i.modules * MOD_W, 0)

  return (
    <div className="flex flex-col items-center" style={{ gap: 0 }}>
      <span className="text-[10px] text-gray-400 font-mono self-start ml-1">Ряд {rowIndex + 1}</span>

      {/* Верхняя разводка */}
      <TopWiring items={row} rowIndex={rowIndex} supplyPhases={supplyPhases} />

      {/* DIN-рейка + карточки устройств */}
      <div className="relative flex flex-col items-center" style={{ marginTop: -2 }}>
        <div className="relative">
          <DinRail width={rowWidth} />
          <div style={{ marginTop: -(DIN_H + DEV_H + 7) }}>
            <div className="flex" style={{ paddingBottom: 6 }}>
              {row.map(item => (
                <DeviceCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
        {/* Логические связи УЗО/диф → автоматы */}
        <GroupBrackets items={row} positions={buildPositions(row)} />
      </div>

      {/* Нижняя разводка */}
      <BottomWiring items={row} />
    </div>
  )
}

// ─── КОРПУС ЩИТА ───
function PanelEnclosure({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-gray-100 rounded-lg p-4" style={{ border: '3px solid #888', minWidth: 380 }}>
      {/* Петли */}
      <div className="absolute left-1 top-4 w-1.5 h-3.5 rounded-full bg-gray-400 border border-gray-500" />
      <div className="absolute left-1 bottom-4 w-1.5 h-3.5 rounded-full bg-gray-400 border border-gray-500" />
      {/* Угловые винты */}
      <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 border border-gray-500" />
      <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 border border-gray-500" />
      <div className="absolute top-1.5 left-4 w-1.5 h-1.5 rounded-full bg-gray-400 border border-gray-500" />
      <div className="absolute bottom-1.5 left-4 w-1.5 h-1.5 rounded-full bg-gray-400 border border-gray-500" />

      {/* Монтажная панель */}
      <div className="bg-gray-50 rounded-sm p-3 border border-gray-200">
        {children}
      </div>

      {/* Легенда */}
      <div className="mt-3 flex gap-4 text-[10px] text-gray-500 font-mono">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500" />N</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500" />PE</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" />L</span>
      </div>
    </div>
  )
}

// ─── ГЛАВНЫЙ КОМПОНЕНТ ───
export function RealisticPanel({
  result,
  onOrderChange,
}: {
  result: CalculationResult
  onOrderChange?: (orderedIds: string[]) => void
}) {
  const [items, setItems] = useState<PanelItem[]>([])

  useEffect(() => {
    const newItems: PanelItem[] = []
    let qfCounter = 2

    if (result.loadBreakSwitch) {
      const ls = result.loadBreakSwitch
      newItems.push({
        id: ls.id, type: 'load_break_switch', ref: 'QS1',
        label: 'Мастер-выкл.', sublabel: `${ls.rating}А`,
        modules: ls.modules, phase: ls.phase, rating: ls.rating,
        character: '', poles: ls.poles, protectedGroupIds: [],
      })
    }

    const mb = result.mainBreaker
    newItems.push({
      id: mb.id, type: 'main_breaker', ref: 'QF1',
      label: mb.group, sublabel: `${mb.rating}А`,
      modules: mb.modules, phase: mb.phase, rating: mb.rating,
      character: mb.characteristic, poles: mb.poles, protectedGroupIds: [],
    })

    // Оборудование щитка — сразу после вводного (реле напряжения, DIN-розетка и т.п.)
    if (result.panelEquipment) {
      for (const eq of result.panelEquipment) {
        newItems.push({
          id: `eq_${eq.id}`,
          type: 'panel_equipment',
          ref: '—',
          label: eq.name,
          sublabel: `${eq.modules} модуля`,
          modules: eq.modules,
          phase: undefined,
          rating: 0,
          character: '',
          poles: 1,
          protectedGroupIds: [],
        })
      }
    }

    for (const d of result.devices) {
      if (d.id === 'main' || d.id === 'load_break') continue
      const isRcd = d.type === 'rcd' || d.type === 'diff_breaker'
      newItems.push({
        id: d.id,
        type: d.type,
        ref: isRcd
          ? (d as RCD).type === 'diff_breaker' ? 'AD1' : 'F1'
          : `QF${qfCounter++}`,
        label: isRcd
          ? (d as RCD).protectedGroups.join(', ')
          : (d as CircuitBreaker).group,
        sublabel: isRcd
          ? `${(d as RCD).ratingAmps}А/${(d as RCD).leakageMA}мА`
          : `${(d as CircuitBreaker).characteristic}${(d as CircuitBreaker).rating}`,
        modules: d.modules, phase: d.phase,
        rating: isRcd ? (d as RCD).ratingAmps : (d as CircuitBreaker).rating,
        character: isRcd ? '' : (d as CircuitBreaker).characteristic,
        poles: d.poles,
        protectedGroupIds: isRcd ? (d as RCD).protectedGroups : [],
      })
    }

    setItems(newItems)
    onOrderChange?.(newItems.map(i => i.id))
  }, [result])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id)
        const newIndex = prev.findIndex((i) => i.id === over?.id)
        const updated = arrayMove(prev, oldIndex, newIndex)
        onOrderChange?.(updated.map(i => i.id))
        return updated
      })
    }
  }

  const rows = useMemo(() => {
    const r: PanelItem[][] = []
    let curRow: PanelItem[] = []
    let curMods = 0
    for (const item of items) {
      if (curMods + item.modules > 12 && curRow.length > 0) {
        r.push(curRow)
        curRow = []
        curMods = 0
      }
      curRow.push(item)
      curMods += item.modules
    }
    if (curRow.length > 0) r.push(curRow)
    return r
  }, [items])

  const actualModules = items.reduce((s, i) => s + i.modules, 0)

  return (
    <div className="flex flex-col items-center gap-4 py-2 select-none">
      {/* Заголовок */}
      <div className="text-center">
        <div className="text-sm font-bold tracking-[0.1em] text-gray-500 bg-gray-200 inline-block px-5 py-1 rounded-sm">
          РАСПРЕДЕЛИТЕЛЬНЫЙ ЩИТ
        </div>
        <div className="text-[11px] text-gray-400 mt-1 font-mono">
          {result.supplyPhases === 3 ? '3 фазы (380В)' : '1 фаза (220В)'} · {actualModules} модулей · щит {result.recommendedPanelModules} мест ({result.panelRows} ряда)
        </div>
      </div>

      {/* Корпус */}
      <PanelEnclosure>
        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
            <div className="flex flex-col" style={{ gap: 36 }}>
              {rows.map((row, ri) => (
                <DeviceRow
                  key={ri}
                  row={row}
                  rowIndex={ri}
                  supplyPhases={result.supplyPhases}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </PanelEnclosure>

      <span className="text-[10px] text-gray-400 font-mono">Перетаскивайте устройства для изменения порядка</span>
    </div>
  )
}
