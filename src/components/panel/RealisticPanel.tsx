'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CalculationResult, CircuitBreaker, RCD, PhaseId } from '@/types/electrical'

// ─── КОНСТАНТЫ ───
const MOD_W = 44
const DEV_H = 52

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
  protectedGroupIds: string[]
}

// ─── ЦВЕТА ПО ТИПУ ───
function devColor(type: string): { stripe: string; bg: string; text: string; label: string } {
  switch (type) {
    case 'main_breaker':    return { stripe: 'bg-red-500',    bg: 'bg-red-50',    text: 'text-red-700',    label: 'ВВОД' }
    case 'load_break_switch':return { stripe: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', label: 'РУБ' }
    case 'rcd':             return { stripe: 'bg-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700',   label: 'УЗО' }
    case 'diff_breaker':    return { stripe: 'bg-cyan-500',   bg: 'bg-cyan-50',   text: 'text-cyan-700',   label: 'ДИФ' }
    case 'panel_equipment': return { stripe: 'bg-gray-300',   bg: 'bg-gray-100',  text: 'text-gray-500',   label: 'ОБ' }
    default:                return { stripe: 'bg-gray-400',   bg: 'bg-gray-50',   text: 'text-gray-700',   label: 'АВ' }
  }
}

// ─── КАРТОЧКА УСТРОЙСТВА (ЧИСТЫЙ CSS) ───
function DeviceCard({ item }: { item: PanelItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const w = item.modules * MOD_W
  const c = devColor(item.type)
  const isEq = item.type === 'panel_equipment'

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
        width: w,
        height: DEV_H,
        opacity: isDragging ? 0.9 : 1,
      }}
    >
      {/* Верхняя клемма (точка подключения к шине) */}
      <div className="flex justify-center -mb-0.5">
        <div className={`w-2.5 h-2.5 rounded-full border border-gray-400 ${isEq ? 'bg-gray-200' : 'bg-gray-300'}`} />
      </div>

      {/* Карточка */}
      <div
        className="relative h-full rounded-sm bg-white overflow-hidden"
        style={{
          border: '1.5px solid #d0d0d0',
          boxShadow: isDragging ? '0 4px 20px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.06)',
          height: DEV_H - 8,
        }}
      >
        {/* Цветная полоса слева */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${c.stripe}`} />

        {/* Тело */}
        <div className="absolute inset-x-0 top-1.5 bottom-1.5 flex flex-col items-center justify-center">
          {isEq ? (
            <>
              <span className="text-[9px] font-bold text-gray-500 text-center leading-tight px-1">
                {item.label}
              </span>
              <span className="text-[7px] text-gray-400">{item.sublabel}</span>
            </>
          ) : (
            <>
              <span className={`text-[13px] font-bold leading-none ${c.text}`}>{item.rating}{item.rating > 0 ? 'A' : ''}</span>
              {item.character && <span className="text-[10px] font-bold text-gray-400 leading-none">{item.character}</span>}
              <span className={`text-[7.5px] font-extrabold leading-none mt-0.5 ${c.text} opacity-60 tracking-wider`}>{c.label}</span>
              {(item.type === 'rcd' || item.type === 'diff_breaker') && (
                <span className="text-[6.5px] text-gray-400 leading-none mt-0.5">{item.sublabel}</span>
              )}
            </>
          )}
        </div>

        {/* Реф */}
        <span className="absolute top-0.5 right-1 text-[7px] font-mono text-gray-400 font-bold">{item.ref}</span>

        {/* Фаза */}
        {item.phase && <span className="absolute top-0.5 left-2.5 text-[6px] font-mono text-gray-400">{item.phase}</span>}
      </div>

      {/* Нижняя клемма (точка выхода) */}
      <div className="flex justify-center -mt-0.5">
        <div className={`w-2.5 h-2.5 rounded-full border border-gray-400 ${isEq ? 'bg-gray-200' : 'bg-gray-300'}`} />
      </div>
    </div>
  )
}

// ─── ШИНА (цветная полоса) ───
function BusBar({ color, label, height, width }: { color: string; label: string; height: number; width: number }) {
  return (
    <div className="relative flex items-center" style={{ width, height }}>
      <div className="absolute inset-x-0 rounded-full" style={{ height, background: color, opacity: 0.9 }} />
      <span className="absolute left-0 text-[7px] font-bold text-white px-1" style={{ lineHeight: `${height}px` }}>
        {label}
      </span>
    </div>
  )
}

// ─── ВВОДНОЙ КАБЕЛЬ (только первый ряд) ───
function InputCable({ totalWidth }: { totalWidth: number }) {
  const cx = totalWidth / 2
  return (
    <div className="relative" style={{ width: totalWidth, height: 24 }}>
      {/* Кабель */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0" style={{ width: 14, height: 20 }}>
        <div className="w-full h-3 bg-gray-600 rounded-t-sm" />
        {/* Жилы */}
        <div className="flex justify-between px-0.5">
          <div className="w-1 h-9 bg-[#e74c3c] rounded-b" />
          <div className="w-1 h-7 bg-[#3498db] rounded-b" />
          <div className="w-1 h-5 bg-[#27ae60] rounded-b" />
        </div>
      </div>
      <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[8px] font-bold text-gray-600">~220В</span>
    </div>
  )
}

// ─── ПОЛОСА ПОДКЛЮЧЕНИЙ К ШИНАМ ───
function BusConnectors({ items, totalWidth }: { items: PanelItem[]; totalWidth: number }) {
  // Вычисляем позиции центров устройств
  let curX = 0
  const centers: { cx: number; needN: boolean; needPE: boolean }[] = []
  for (const it of items) {
    const cx = curX + (it.modules * MOD_W) / 2
    const isEq = it.type === 'panel_equipment'
    const needN = !isEq && (it.poles >= 2 || it.type === 'rcd' || it.type === 'diff_breaker')
    centers.push({ cx, needN, needPE: !isEq })
    curX += it.modules * MOD_W
  }
  return (
    <div className="relative" style={{ width: totalWidth, height: 10 }}>
      {centers.map((c, i) => (
        <React.Fragment key={i}>
          {/* L спуск (красный) */}
          <div className="absolute top-0" style={{ left: c.cx - 0.5, width: 1, height: 10, background: '#e74c3c' }} />
          {c.needN && (
            <div className="absolute top-0" style={{ left: c.cx + 2, width: 1, height: 10, background: '#3498db' }} />
          )}
          {c.needPE && (
            <div className="absolute top-0" style={{ left: c.cx + 4, width: 1, height: 10, background: '#27ae60' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── DIN-РЕЙКА ───
function DinRail({ width }: { width: number }) {
  return (
    <div className="relative" style={{ width, height: 7 }}>
      <div
        className="absolute inset-x-0 rounded-sm"
        style={{ height: 7, background: 'linear-gradient(180deg, #b0b0b0 0%, #d5d5d5 30%, #e8e8e8 70%, #b8b8b8 100%)' }}
      />
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gray-400 rounded-t-sm" />
      <div className="absolute bottom-0 inset-x-0 h-1.5 bg-gray-400 rounded-b-sm" />
    </div>
  )
}

// ─── ВЫХОДЫ К НАГРУЗКАМ ───
function OutputStrip({ items, totalWidth }: { items: PanelItem[]; totalWidth: number }) {
  let curX = 0
  const cells: { item: PanelItem; cx: number }[] = []
  for (const it of items) {
    cells.push({ item: it, cx: curX + (it.modules * MOD_W) / 2 })
    curX += it.modules * MOD_W
  }
  return (
    <div className="relative" style={{ width: totalWidth, height: 30 }}>
      {/* N шина */}
      <div className="absolute inset-x-0 top-0 rounded-full" style={{ height: 3, background: '#3498db', opacity: 0.9 }} />
      {/* PE шина */}
      <div className="absolute inset-x-0 rounded-full" style={{ top: 7, height: 3, background: '#27ae60', opacity: 0.9 }} />

      {cells.map(({ item, cx }, i) => {
        const isEq = item.type === 'panel_equipment'
        const loadName = item.label.length > 14 ? item.label.substring(0, 14) + '…' : item.label

        if (isEq) {
          return (
            <div key={i} className="absolute flex flex-col items-center" style={{ left: cx - 30, width: 60, top: 12 }}>
              <span className="text-[6px] text-gray-400">{loadName}</span>
              <span className="text-[5px] text-gray-300">оборудование</span>
            </div>
          )
        }

        return (
          <div key={i} className="absolute flex flex-col items-center" style={{ left: cx - 40, width: 80, top: 2 }}>
            {/* L/N/PE жилы от клемм к шинам и вниз */}
            <div style={{ width: 0, borderLeft: '1.5px solid #e74c3c', height: 10 }} />
            <div className="flex gap-0.5 mt-0.5">
              <span className="text-[5px] font-bold text-[#e74c3c]">L</span>
              <span className="text-[5px] font-bold text-[#3498db]">N</span>
              <span className="text-[5px] font-bold text-[#27ae60]">PE</span>
            </div>
            {/* Метка нагрузки */}
            <div className="text-[7px] font-semibold text-gray-600 mt-0.5 text-center leading-tight">{loadName}</div>
            <div className="text-[5px] text-gray-400">3×2.5</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── ГРУППИРУЮЩИЕ СКОБКИ (УЗО/диф → автоматы) ───
function GroupBrackets({ items }: { items: PanelItem[] }) {
  const parents = items.filter(it => it.protectedGroupIds.length > 0)
  if (parents.length === 0) return null

  const totalWidth = items.reduce((s, i) => s + i.modules * MOD_W, 0)

  // Позиции
  let curX = 0
  const posMap = new Map<string, { x: number; w: number }>()
  for (const it of items) {
    posMap.set(it.id, { x: curX, w: it.modules * MOD_W })
    curX += it.modules * MOD_W
  }

  const brackets: { left: number; right: number; color: string; ref: string }[] = []

  for (const parent of parents) {
    const pp = posMap.get(parent.id)!
    // Ищем детей в том же ряду
    const children = items.filter(c =>
      c.id !== parent.id &&
      c.protectedGroupIds.length === 0 &&
      parent.protectedGroupIds.some(gname => c.label.includes(gname) || gname.includes(c.label))
    )
    if (children.length === 0) continue

    const childLefts = children.map(c => posMap.get(c.id)!.x)
    const childRights = children.map(c => posMap.get(c.id)!.x + posMap.get(c.id)!.w)
    const left = Math.min(pp.x, ...childLefts)
    const right = Math.max(pp.x + pp.w, ...childRights)
    const color = parent.type === 'rcd' ? '#1976d2' : '#00838f'

    brackets.push({ left, right, color, ref: parent.ref })
  }

  if (brackets.length === 0) return null

  return (
    <div className="relative" style={{ width: totalWidth, height: 8, marginBottom: 2 }}>
      {brackets.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-sm"
          style={{
            left: b.left,
            width: b.right - b.left,
            top: 6,
            height: 2,
            background: b.color,
            opacity: 0.35,
          }}
        >
          <span
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[6px]"
            style={{ top: 3, color: b.color, opacity: 0.6 }}
          >
            {b.ref}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── РЯД УСТРОЙСТВ ───
function PanelRow({
  row,
  rowIndex,
  isFirst,
  supplyPhases,
}: {
  row: PanelItem[]
  rowIndex: number
  isFirst: boolean
  supplyPhases: 1 | 3
}) {
  const totalWidth = row.reduce((s, i) => s + i.modules * MOD_W, 0)

  return (
    <div className="flex flex-col items-center" style={{ gap: 2 }}>
      {/* Метка ряда */}
      <span className="text-[9px] text-gray-400 font-mono self-start ml-1">Ряд {rowIndex + 1}</span>

      {/* Вводной кабель (первый ряд) */}
      {isFirst && <InputCable totalWidth={totalWidth} />}

      {/* Шины (PE сверху, N, L снизу — ближе к устройствам) */}
      <div className="flex flex-col" style={{ gap: 1.5 }}>
        <BusBar color="#27ae60" label="PE" height={3} width={totalWidth} />
        <BusBar color="#3498db" label="N"  height={3} width={totalWidth} />
        <BusBar color="#e74c3c" label="L"  height={4} width={totalWidth} />
      </div>

      {/* Спуски от шин к устройствам */}
      <BusConnectors items={row} totalWidth={totalWidth} />

      {/* Устройства */}
      <div className="flex" style={{ paddingBottom: 4 }}>
        {row.map(item => (
          <DeviceCard key={item.id} item={item} />
        ))}
      </div>

      {/* DIN-рейка */}
      <DinRail width={totalWidth} />

      {/* Логические связи */}
      <GroupBrackets items={row} />

      {/* Выходы */}
      <OutputStrip items={row} totalWidth={totalWidth} />
    </div>
  )
}

// ─── КОРПУС ───
function PanelEnclosure({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-gray-100 rounded-lg p-4" style={{ border: '3px solid #999', minWidth: 380 }}>
      {/* Петли */}
      <div className="absolute -left-0.5 top-4 w-2 h-4 rounded-full bg-gray-400 border border-gray-500" />
      <div className="absolute -left-0.5 bottom-4 w-2 h-4 rounded-full bg-gray-400 border border-gray-500" />
      {/* Винты */}
      {['top-1.5 right-1.5', 'bottom-1.5 right-1.5', 'top-1.5 left-4', 'bottom-1.5 left-4'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-1.5 h-1.5 rounded-full bg-gray-400 border border-gray-500`} />
      ))}

      <div className="bg-gray-50 rounded-sm p-4 border border-gray-200">
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

    if (result.panelEquipment) {
      for (const eq of result.panelEquipment) {
        newItems.push({
          id: `eq_${eq.id}`, type: 'panel_equipment', ref: '—',
          label: eq.name, sublabel: `${eq.modules} мод.`,
          modules: eq.modules, phase: undefined, rating: 0,
          character: '', poles: 1, protectedGroupIds: [],
        })
      }
    }

    for (const d of result.devices) {
      if (d.id === 'main' || d.id === 'load_break') continue
      const isRcd = d.type === 'rcd' || d.type === 'diff_breaker'
      newItems.push({
        id: d.id, type: d.type,
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

      <PanelEnclosure>
        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
            <div className="flex flex-col" style={{ gap: 28 }}>
              {rows.map((row, ri) => (
                <PanelRow
                  key={ri}
                  row={row}
                  rowIndex={ri}
                  isFirst={ri === 0}
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
