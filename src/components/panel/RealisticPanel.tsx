'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CalculationResult, CircuitBreaker, RCD, PhaseId } from '@/types/electrical'

// ─── КОНСТАНТЫ ───
const MOD = 56          // px на 1 DIN-модуль
const CARD_H = 68       // высота карточки устройства
const BUS_H = 6         // высота полосы шины
const DROP_H = 32       // высота спусков
const OUT_H = 56        // высота выходов
const ROW_GAP = 12      // зазор между рядами
const C = {
  L:  '#e74c3c',
  N:  '#3498db',
  PE: '#27ae60',
  OUT:'#666',
  EQ: '#bbb',
}

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

// ─── ЦВЕТА КАРТОЧЕК ───
function cardStyle(type: string) {
  const s: Record<string, { stripe: string; label: string }> = {
    main_breaker:      { stripe: '#e53e3e', label: 'ВВОД' },
    load_break_switch: { stripe: '#dd6b20', label: 'РУБ' },
    rcd:               { stripe: '#3182ce', label: 'УЗО' },
    diff_breaker:      { stripe: '#00a3c4', label: 'ДИФ' },
    panel_equipment:   { stripe: '#aaa',    label: 'ОБ' },
  }
  return s[type] || { stripe: '#888', label: 'АВ' }
}

// ─── КАРТОЧКА УСТРОЙСТВА ───
function DeviceCard({ item }: { item: PanelItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const w = item.modules * MOD
  const cs = cardStyle(item.type)
  const isEq = item.type === 'panel_equipment'

  return (
    <div
      ref={setNodeRef} {...attributes} {...listeners}
      className="flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
        width: w,
        height: CARD_H,
        opacity: isDragging ? 0.9 : 1,
      }}
    >
      {/* Верхняя клемма */}
      <div className="flex justify-center">
        <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-400 bg-gray-300 -mb-px" />
      </div>
      {/* Карточка */}
      <div className="relative bg-white rounded-sm border-2 border-gray-300 flex flex-col items-center justify-center" style={{ height: CARD_H - 10 }}>
        <div className="absolute left-0 top-0 bottom-0 rounded-l-sm" style={{ width: 3, background: cs.stripe }} />
        {isEq ? (
          <>
            <span className="text-[10px] font-bold text-gray-500 text-center px-1 leading-tight">{item.label}</span>
            <span className="text-[7px] text-gray-400">{item.sublabel}</span>
          </>
        ) : (
          <>
            <span className="text-[16px] font-extrabold text-gray-700 leading-none">{item.rating}{item.rating > 0 ? 'A' : ''}</span>
            {item.character && <span className="text-[11px] font-bold text-gray-400 leading-none">{item.character}</span>}
            <span className="text-[7px] font-black text-gray-400 tracking-widest mt-0.5">{cs.label}</span>
            {(item.type === 'rcd' || item.type === 'diff_breaker') && (
              <span className="text-[6px] text-gray-400 leading-none mt-0.5">{item.sublabel}</span>
            )}
          </>
        )}
        <span className="absolute top-0.5 right-1.5 text-[7px] font-mono text-gray-400 font-bold">{item.ref}</span>
      </div>
      {/* Нижняя клемма */}
      <div className="flex justify-center">
        <div className={`w-2.5 h-2.5 rounded-full border-2 border-gray-400 -mt-px ${isEq ? 'bg-gray-200' : 'bg-gray-300'}`} />
      </div>
    </div>
  )
}

// ─── ГРУППИРУЮЩИЕ СКОБКИ ───
function GroupBrackets({ items }: { items: PanelItem[] }) {
  const parents = items.filter(it => it.protectedGroupIds.length > 0)
  if (parents.length === 0) return null

  // Позиции
  let curX = 0
  const pos = new Map<string, { x: number; w: number }>()
  for (const it of items) { pos.set(it.id, { x: curX, w: it.modules * MOD }); curX += it.modules * MOD }

  const totalW = curX
  const brackets: { left: number; right: number; color: string; ref: string }[] = []

  for (const p of parents) {
    const pp = pos.get(p.id)!
    const kids = items.filter(c =>
      c.id !== p.id && c.protectedGroupIds.length === 0 &&
      p.protectedGroupIds.some(g => c.label.includes(g) || g.includes(c.label))
    )
    if (kids.length === 0) continue
    const left = Math.min(pp.x, ...kids.map(k => pos.get(k.id)!.x))
    const right = Math.max(pp.x + pp.w, ...kids.map(k => pos.get(k.id)!.x + pos.get(k.id)!.w))
    brackets.push({ left, right, color: p.type === 'rcd' ? '#3182ce' : '#00a3c4', ref: p.ref })
  }

  return (
    <div className="relative" style={{ width: totalW, height: 12, marginBottom: 2 }}>
      {brackets.map((b, i) => (
        <div key={i} className="absolute flex flex-col items-center" style={{ left: b.left, width: b.right - b.left }}>
          <div className="w-full h-px" style={{ background: b.color, opacity: 0.5 }} />
          <span className="text-[7px] font-bold mt-0.5" style={{ color: b.color, opacity: 0.7 }}>{b.ref}</span>
        </div>
      ))}
    </div>
  )
}

// ─── РЯД УСТРОЙСТВ ───
function PanelRow({ row, isFirst }: { row: PanelItem[]; isFirst: boolean }) {
  const totalW = row.reduce((s, it) => s + it.modules, 0) * MOD

  // Собираем спуски L/N/PE
  const drops: { cx: number; needL: boolean; needN: boolean; needPE: boolean }[] = []
  let cx = 0
  for (const it of row) {
    const mid = cx + (it.modules * MOD) / 2
    const eq = it.type === 'panel_equipment'
    drops.push({
      cx: mid,
      needL: !eq,
      needN: !eq && it.poles >= 2,
      needPE: !eq,
    })
    cx += it.modules * MOD
  }

  return (
    <div style={{ width: totalW }}>
      {/* Вводной кабель (первый ряд) */}
      {isFirst && (
        <div className="relative" style={{ height: 48 }}>
          <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center">
            <span className="text-[10px] font-bold text-gray-600">~220В</span>
            <div className="flex mt-1" style={{ gap: 3 }}>
              <div className="w-1.5 h-16 rounded-b-sm" style={{ background: C.L }} />
              <div className="w-1.5 h-12 rounded-b-sm" style={{ background: C.N }} />
              <div className="w-1.5 h-8 rounded-b-sm" style={{ background: C.PE }} />
            </div>
          </div>
        </div>
      )}

      {/* Шины */}
      <div className="flex flex-col" style={{ gap: 2 }}>
        <div className="flex items-center rounded-full" style={{ height: BUS_H, background: C.PE, opacity: 0.95 }}>
          <span className="text-[8px] font-bold text-white ml-2">PE</span>
        </div>
        <div className="flex items-center rounded-full" style={{ height: BUS_H, background: C.N, opacity: 0.95 }}>
          <span className="text-[8px] font-bold text-white ml-2">N</span>
        </div>
        <div className="flex items-center rounded-full" style={{ height: BUS_H + 1, background: C.L, opacity: 0.95 }}>
          <span className="text-[8px] font-bold text-white ml-2">L</span>
        </div>
      </div>

      {/* Спуски L/N/PE от шин к устройствам */}
      <div className="relative" style={{ height: DROP_H }}>
        {drops.map((d, i) => (
          <React.Fragment key={i}>
            {d.needPE && <div className="absolute top-0" style={{ left: d.cx - 0.5 + 8, width: 1, height: DROP_H, background: C.PE, opacity: 0.5 }} />}
            {d.needN && <div className="absolute top-0" style={{ left: d.cx - 0.5 + 4, width: 1, height: DROP_H, background: C.N, opacity: 0.5 }} />}
            {d.needL && <div className="absolute top-0" style={{ left: d.cx - 0.5, width: 1, height: DROP_H, background: C.L, opacity: 0.6 }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Устройства (drag-and-drop) */}
      <DndContext onDragEnd={() => {}}>
        <SortableContext items={row.map(it => it.id)} strategy={rectSortingStrategy}>
          <div className="flex" style={{ paddingBottom: 4 }}>
            {row.map(item => <DeviceCard key={item.id} item={item} />)}
          </div>
        </SortableContext>
      </DndContext>

      {/* DIN-рейка */}
      <div className="h-2 rounded-sm" style={{ background: 'linear-gradient(180deg, #bbb 0%, #ddd 40%, #eee 60%, #bbb 100%)' }} />

      {/* Скобки группировки */}
      <GroupBrackets items={row} />

      {/* Выходы к нагрузкам */}
      <div className="relative" style={{ height: OUT_H }}>
        {/* N/PE шины выходные */}
        <div className="absolute inset-x-0 rounded-full" style={{ top: 0, height: 3, background: C.N, opacity: 0.9 }} />
        <div className="absolute inset-x-0 rounded-full" style={{ top: 8, height: 3, background: C.PE, opacity: 0.9 }} />

        {(() => {
          let x = 0
          return row.map((it, i) => {
            const mid = x + (it.modules * MOD) / 2
            x += it.modules * MOD
            const name = it.label.length > 14 ? it.label.substring(0, 14) + '…' : it.label
            const eq = it.type === 'panel_equipment'

            if (eq) return (
              <div key={i} className="absolute flex flex-col items-center" style={{ left: mid - MOD, width: MOD * 2, top: 18 }}>
                <span className="text-[7px] text-gray-400 text-center">{name}</span>
              </div>
            )

            return (
              <div key={i} className="absolute flex flex-col items-center" style={{ left: mid - MOD * 1.5, width: MOD * 3, top: 16 }}>
                {/* Линии L/N/PE */}
                <div className="flex gap-1 mb-0.5">
                  <div className="w-px h-5" style={{ background: C.L }} />
                  <div className="w-px h-5" style={{ background: C.N }} />
                  <div className="w-px h-5" style={{ background: C.PE }} />
                </div>
                <span className="text-[7px] font-semibold text-gray-600 text-center leading-tight">{name}</span>
                <span className="text-[6px] text-gray-400">L·N·PE 3×2.5</span>
              </div>
            )
          })
        })()}
      </div>
    </div>
  )
}

// ─── КОРПУС ЩИТА ───
function Enclosure({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-gray-100 rounded-lg p-5 print:border-0 print:bg-white" style={{ border: '3px solid #999' }}>
      <div className="absolute -left-0.5 top-6 w-2.5 h-5 rounded-full bg-gray-400 border border-gray-500" />
      <div className="absolute -left-0.5 bottom-6 w-2.5 h-5 rounded-full bg-gray-400 border border-gray-500" />
      <div className="bg-gray-50 rounded-sm p-4 border border-gray-200">
        {children}
      </div>
      <div className="mt-3 flex gap-4 text-[9px] text-gray-500 font-mono">
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
    const ni: PanelItem[] = []
    let q = 2
    if (result.loadBreakSwitch) {
      const ls = result.loadBreakSwitch
      ni.push({ id: ls.id, type: 'load_break_switch', ref: 'QS1', label: 'Мастер-выкл.', sublabel: `${ls.rating}А`, modules: ls.modules, phase: ls.phase, rating: ls.rating, character: '', poles: ls.poles, protectedGroupIds: [] })
    }
    const mb = result.mainBreaker
    ni.push({ id: mb.id, type: 'main_breaker', ref: 'QF1', label: mb.group, sublabel: `${mb.rating}А`, modules: mb.modules, phase: mb.phase, rating: mb.rating, character: mb.characteristic, poles: mb.poles, protectedGroupIds: [] })
    if (result.panelEquipment) {
      for (const eq of result.panelEquipment) {
        ni.push({ id: `eq_${eq.id}`, type: 'panel_equipment', ref: '—', label: eq.name, sublabel: `${eq.modules} мод.`, modules: eq.modules, phase: undefined, rating: 0, character: '', poles: 1, protectedGroupIds: [] })
      }
    }
    for (const d of result.devices) {
      if (d.id === 'main' || d.id === 'load_break') continue
      const rcd = d.type === 'rcd' || d.type === 'diff_breaker'
      ni.push({
        id: d.id, type: d.type,
        ref: rcd ? ((d as RCD).type === 'diff_breaker' ? 'AD1' : 'F1') : `QF${q++}`,
        label: rcd ? (d as RCD).protectedGroups.join(', ') : (d as CircuitBreaker).group,
        sublabel: rcd ? `${(d as RCD).ratingAmps}А/${(d as RCD).leakageMA}мА` : `${(d as CircuitBreaker).characteristic}${(d as CircuitBreaker).rating}`,
        modules: d.modules, phase: d.phase,
        rating: rcd ? (d as RCD).ratingAmps : (d as CircuitBreaker).rating,
        character: rcd ? '' : (d as CircuitBreaker).characteristic,
        poles: d.poles,
        protectedGroupIds: rcd ? (d as RCD).protectedGroups : [],
      })
    }
    setItems(ni)
    onOrderChange?.(ni.map(i => i.id))
  }, [result])

  const rows = useMemo(() => {
    const r: PanelItem[][] = []
    let cr: PanelItem[] = []; let cm = 0
    for (const it of items) {
      if (cm + it.modules > 12 && cr.length > 0) { r.push(cr); cr = []; cm = 0 }
      cr.push(it); cm += it.modules
    }
    if (cr.length > 0) r.push(cr)
    return r
  }, [items])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setItems(prev => {
        const oi = prev.findIndex(i => i.id === active.id)
        const ni = prev.findIndex(i => i.id === over?.id)
        const up = arrayMove(prev, oi, ni)
        onOrderChange?.(up.map(i => i.id))
        return up
      })
    }
  }

  const totalMods = items.reduce((s, i) => s + i.modules, 0)

  return (
    <div className="flex flex-col items-center gap-4 py-2 select-none print:w-full">
      <div className="text-center no-print">
        <div className="text-sm font-bold tracking-[0.1em] text-gray-500 bg-gray-200 inline-block px-5 py-1 rounded-sm">РАСПРЕДЕЛИТЕЛЬНЫЙ ЩИТ</div>
        <div className="text-[11px] text-gray-400 mt-1 font-mono">
          {result.supplyPhases === 3 ? '3 фазы (380В)' : '1 фаза (220В)'} · {totalMods} модулей · щит {result.recommendedPanelModules} мест ({result.panelRows} ряда)
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
          <Enclosure>
            <div className="flex flex-col" style={{ gap: 28 + ROW_GAP }}>
              {rows.map((row, ri) => (
                <PanelRow key={ri} row={row} isFirst={ri === 0} />
              ))}
            </div>
          </Enclosure>
        </SortableContext>
      </DndContext>

      <span className="text-[10px] text-gray-400 font-mono no-print">Перетаскивайте устройства для изменения порядка между рядами</span>
    </div>
  )
}
