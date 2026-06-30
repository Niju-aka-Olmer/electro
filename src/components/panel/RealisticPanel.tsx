'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CalculationResult, CircuitBreaker, RCD, PhaseId } from '@/types/electrical'

// ─── КОНСТАНТЫ ───
const MOD_W = 52   // ширина 1 модуля (крупнее)
const DEV_H = 62   // высота карточки устройства
const TOP_H = 120  // высота верхней части (ввод + шины + спуски)
const BOT_H = 60   // высота нижней части (выходы)

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
    case 'main_breaker':     return { stripe: 'bg-red-500',    bg: 'bg-red-50',    text: 'text-red-700',    label: 'ВВОД' }
    case 'load_break_switch':return { stripe: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', label: 'РУБ' }
    case 'rcd':              return { stripe: 'bg-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700',   label: 'УЗО' }
    case 'diff_breaker':     return { stripe: 'bg-cyan-500',   bg: 'bg-cyan-50',   text: 'text-cyan-700',   label: 'ДИФ' }
    case 'panel_equipment':  return { stripe: 'bg-gray-300',   bg: 'bg-gray-100',  text: 'text-gray-500',   label: 'ОБ' }
    default:                 return { stripe: 'bg-gray-400',   bg: 'bg-gray-50',   text: 'text-gray-700',   label: 'АВ' }
  }
}

// Цвета групп для сегментов шин (чередуются)
const GROUP_COLORS = ['#f97316', '#8b5cf6', '#06b6d4', '#84cc16']

// ─── КАРТОЧКА УСТРОЙСТВА ───
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
      {/* Верхняя клемма */}
      <div className="flex justify-center -mb-0.5">
        <div className={`w-3 h-3 rounded-full border-2 border-gray-400 ${isEq ? 'bg-gray-200' : 'bg-gray-300'}`} />
      </div>

      {/* Карточка */}
      <div
        className="relative h-full rounded-sm bg-white overflow-hidden"
        style={{
          border: '1.5px solid #d0d0d0',
          boxShadow: isDragging ? '0 4px 20px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.06)',
          height: DEV_H - 10,
        }}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-2 ${c.stripe}`} />

        <div className="absolute inset-x-0 top-2 bottom-2 flex flex-col items-center justify-center">
          {isEq ? (
            <>
              <span className="text-[10px] font-bold text-gray-500 text-center leading-tight px-1">{item.label}</span>
              <span className="text-[8px] text-gray-400">{item.sublabel}</span>
            </>
          ) : (
            <>
              <span className={`text-[15px] font-bold leading-none ${c.text}`}>{item.rating}{item.rating > 0 ? 'A' : ''}</span>
              {item.character && <span className="text-[11px] font-bold text-gray-400 leading-none">{item.character}</span>}
              <span className={`text-[8px] font-extrabold leading-none mt-0.5 ${c.text} opacity-60 tracking-wider`}>{c.label}</span>
              {(item.type === 'rcd' || item.type === 'diff_breaker') && (
                <span className="text-[7px] text-gray-400 leading-none mt-0.5">{item.sublabel}</span>
              )}
            </>
          )}
        </div>

        <span className="absolute top-0.5 right-1.5 text-[8px] font-mono text-gray-400 font-bold">{item.ref}</span>
        {item.phase && <span className="absolute top-0.5 left-3 text-[7px] font-mono text-gray-400">{item.phase}</span>}
      </div>

      {/* Нижняя клемма */}
      <div className="flex justify-center -mt-0.5">
        <div className={`w-3 h-3 rounded-full border-2 border-gray-400 ${isEq ? 'bg-gray-200' : 'bg-gray-300'}`} />
      </div>
    </div>
  )
}

// ─── ГРУППА: УЗО/диф + его автоматы ───
interface BusGroup {
  parentId: string          // id УЗО или '' (группа без защиты)
  label: string             // метка группы
  color: string             // цвет сегмента
  startX: number
  endX: number
  items: { item: PanelItem; cx: number }[]
}

function buildGroups(items: PanelItem[], totalWidth: number): BusGroup[] {
  const groups: BusGroup[] = []
  let currentParentId = ''
  let currentLabel = 'Ввод'
  let currentColor = '#e74c3c' // красный для вводной группы
  let groupItems: { item: PanelItem; cx: number }[] = []
  let colorIdx = 0

  let curX = 0
  for (const item of items) {
    const cx = curX + (item.modules * MOD_W) / 2
    const isParent = item.protectedGroupIds.length > 0

    if (isParent) {
      // Сохраняем предыдущую группу
      if (groupItems.length > 0) {
        groups.push({
          parentId: currentParentId,
          label: currentLabel,
          color: currentColor,
          startX: groupItems[0].cx - (groupItems[0].item.modules * MOD_W) / 2,
          endX: groupItems[groupItems.length - 1].cx + (groupItems[groupItems.length - 1].item.modules * MOD_W) / 2,
          items: groupItems,
        })
      }
      // Начинаем новую группу
      currentParentId = item.id
      currentLabel = `${item.ref} ${item.type === 'rcd' ? 'УЗО' : 'Диф'}`
      currentColor = GROUP_COLORS[colorIdx % GROUP_COLORS.length]
      colorIdx++
      groupItems = [{ item, cx }]
    } else {
      groupItems.push({ item, cx })
    }
    curX += item.modules * MOD_W
  }

  // Последняя группа
  if (groupItems.length > 0) {
    groups.push({
      parentId: currentParentId,
      label: currentLabel,
      color: currentColor,
      startX: groupItems[0].cx - (groupItems[0].item.modules * MOD_W) / 2,
      endX: groupItems[groupItems.length - 1].cx + (groupItems[groupItems.length - 1].item.modules * MOD_W) / 2,
      items: groupItems,
    })
  }

  return groups
}

// ─── ВВОДНОЙ КАБЕЛЬ ───
function InputCable() {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center">
      <span className="text-[10px] font-bold text-gray-600 mb-1">~220В</span>
      <div className="flex flex-col items-center" style={{ width: 18 }}>
        <div className="w-full h-3 bg-gray-500 rounded-t-sm" />
        <div className="flex justify-between px-0.5" style={{ width: 18 }}>
          <div className="w-1.5 h-14 rounded-b-sm" style={{ background: '#e74c3c' }} />
          <div className="w-1.5 h-11 rounded-b-sm" style={{ background: '#3498db' }} />
          <div className="w-1.5 h-8 rounded-b-sm" style={{ background: '#27ae60' }} />
        </div>
      </div>
    </div>
  )
}

// ─── СЕГМЕНТИРОВАННЫЕ ШИНЫ С РАЗВОДКОЙ ───
function BusTopology({
  items,
  totalWidth,
  isFirst,
}: {
  items: PanelItem[]
  totalWidth: number
  isFirst: boolean
}) {
  const groups = buildGroups(items, totalWidth)
  const midX = totalWidth / 2

  // Позиции Y
  const PE_Y = 8
  const MAIN_L_Y = 24
  const N_Y = 40
  const DROP_Y = 48

  // N-провод после RCD для каждой группы
  const nAfterRcdY = 56

  return (
    <div className="relative" style={{ width: totalWidth, height: TOP_H }}>
      {/* Фоновые области групп */}
      {groups.filter(g => g.parentId !== '').map((g, gi) => (
        <div
          key={`bg-${gi}`}
          className="absolute rounded-sm"
          style={{
            left: g.startX - 2,
            width: g.endX - g.startX + 4,
            top: 4,
            height: TOP_H - 8,
            background: g.color,
            opacity: 0.04,
            border: `1px solid ${g.color}22`,
            borderRadius: 4,
          }}
        />
      ))}

      {isFirst && <InputCable />}

      {/* PE шина — общая, всегда сплошная */}
      <div
        className="absolute inset-x-0 rounded-full flex items-center"
        style={{ top: PE_Y, height: 4, background: '#27ae60', opacity: 0.95 }}
      >
        <span className="text-[8px] font-bold text-white ml-2">PE</span>
      </div>

      {/* Главная L шина на всю ширину */}
      <div
        className="absolute inset-x-0 rounded-full flex items-center"
        style={{ top: MAIN_L_Y, height: 5, background: '#e74c3c', opacity: 0.95 }}
      >
        <span className="text-[9px] font-bold text-white ml-2 mr-1">L</span>
      </div>

      {/* N шина (общая) */}
      <div
        className="absolute inset-x-0 rounded-full flex items-center"
        style={{ top: N_Y, height: 4, background: '#3498db', opacity: 0.95 }}
      >
        <span className="text-[8px] font-bold text-white ml-2">N</span>
      </div>

      {/* ── Групповые L-сегменты (выход УЗО/дифа → его автоматы) ── */}
      {groups.filter(g => g.parentId !== '').map((g, gi) => {
        const parentItem = g.items.find(it => it.item.id === g.parentId)
        if (!parentItem) return null
        const childItems = g.items.filter(it => it.item.id !== g.parentId)
        if (childItems.length === 0) return null
        const parentCx = parentItem.cx
        const groupL_Y = MAIN_L_Y + 16
        const startX = g.items[1]?.cx ? (g.items[1].cx - (g.items[1].item.modules * MOD_W) / 2) : g.startX
        const endX2 = g.items[g.items.length - 1].cx + (g.items[g.items.length - 1].item.modules * MOD_W) / 2

        return (
          <React.Fragment key={`lseg-${gi}`}>
            {/* L спуск от главной шины к УЗО, затем перемычка к групповому сегменту */}
            <div className="absolute" style={{ left: parentCx - 1, top: MAIN_L_Y + 5, width: 2, height: groupL_Y - MAIN_L_Y - 5, background: g.color, opacity: 0.6 }} />
            {/* Горизонтальная перемычка L от УЗО к первому автомату */}
            <div className="absolute rounded-full" style={{ left: parentCx, top: groupL_Y - 1, width: (startX + (childItems[0]?.item.modules ?? 1) * MOD_W / 2) - parentCx, height: 2, background: g.color, opacity: 0.4 }} />
            {/* L сегмент для дочерних автоматов */}
            <div
              className="absolute rounded-full flex items-center"
              style={{ left: startX, width: endX2 - startX, top: groupL_Y, height: 4, background: g.color, opacity: 0.25 }}
            >
              <span className="text-[6px] font-bold ml-1 whitespace-nowrap" style={{ color: g.color, opacity: 0.8 }}>{g.label}</span>
            </div>

            {/* L спуски от группового сегмента к автоматам */}
            {childItems.map(({ cx }, i) => (
              <div key={`ls-${i}`} className="absolute" style={{ left: cx - 0.5, top: groupL_Y + 4, width: 1, height: DROP_Y - groupL_Y - 4, background: g.color, opacity: 0.35 }} />
            ))}
          </React.Fragment>
        )
      })}

      {/* Устройства без УЗО — L спуски напрямую от главной шины */}
      {(() => {
        let curX = 0
        return items.map((item, i) => {
          const cx = curX + (item.modules * MOD_W) / 2
          curX += item.modules * MOD_W
          const isEq = item.type === 'panel_equipment'
          const isParent = item.protectedGroupIds.length > 0
          // Если это родитель (УЗО/диф) — спуск уже сделан в групповых сегментах
          // Но родитель тоже подключается к главной L шине!
          if (isParent) {
            return (
              <div key={`ml-${i}`} className="absolute" style={{ left: cx - 1, top: MAIN_L_Y + 5, width: 2, height: DROP_Y - MAIN_L_Y - 5, background: '#e74c3c', opacity: 0.6 }} />
            )
          }
          // Проверяем, принадлежит ли устройство какой-то группе
          const inGroup = groups.some(g => g.parentId !== '' && g.items.some(gi => gi.item.id === item.id && gi.item.id !== g.parentId))
          if (inGroup || isEq) return null
          return (
            <div key={`ml-${i}`} className="absolute" style={{ left: cx - 0.5, top: MAIN_L_Y + 5, width: 1, height: DROP_Y - MAIN_L_Y - 5, background: '#e74c3c', opacity: 0.5 }} />
          )
        })
      })()}

      {/* ── N спуски ── */}
      {(() => {
        let curX = 0
        return items.map((item, i) => {
          const cx = curX + (item.modules * MOD_W) / 2
          curX += item.modules * MOD_W
          const isEq = item.type === 'panel_equipment'
          if (isEq) return null
          const needN = item.poles >= 2
          if (!needN) return null
          return (
            <div key={`nd-${i}`} className="absolute" style={{ left: cx + 3, top: N_Y + 4, width: 1, height: DROP_Y - N_Y - 4, background: '#3498db', opacity: 0.5 }} />
          )
        })
      })()}

      {/* ── PE спуски ── */}
      {(() => {
        let curX = 0
        return items.map((item, i) => {
          const cx = curX + (item.modules * MOD_W) / 2
          curX += item.modules * MOD_W
          if (item.type === 'panel_equipment') return null
          return (
            <div key={`ped-${i}`} className="absolute" style={{ left: cx + 6, top: PE_Y + 4, width: 1, height: DROP_Y - PE_Y - 4, background: '#27ae60', opacity: 0.4 }} />
          )
        })
      })()}

      {/* ── Точки подключения кабеля к шинам ── */}
      {isFirst && (
        <>
          <div className="absolute rounded-full" style={{ left: midX - 3, top: MAIN_L_Y - 1.5, width: 6, height: 8, background: '#e74c3c' }} />
          <div className="absolute rounded-full" style={{ left: midX + 1, top: N_Y - 1, width: 5, height: 6, background: '#3498db' }} />
          <div className="absolute rounded-full" style={{ left: midX + 5, top: PE_Y - 1, width: 5, height: 6, background: '#27ae60' }} />
        </>
      )}
    </div>
  )
}

// ─── DIN-РЕЙКА ───
function DinRail({ width }: { width: number }) {
  return (
    <div className="relative" style={{ width, height: 8 }}>
      <div className="absolute inset-x-0 rounded-sm" style={{ height: 8, background: 'linear-gradient(180deg, #b0b0b0 0%, #d5d5d5 30%, #e8e8e8 70%, #b8b8b8 100%)' }} />
      <div className="absolute top-0 inset-x-0 h-2 bg-gray-400 rounded-t-sm" />
      <div className="absolute bottom-0 inset-x-0 h-2 bg-gray-400 rounded-b-sm" />
    </div>
  )
}

// ─── СОЕДИНИТЕЛЬНЫЕ ЛИНИИ МЕЖДУ ГРУППАМИ ───
function GroupLinks({ items }: { items: PanelItem[] }) {
  const parents = items.filter(it => it.protectedGroupIds.length > 0)
  if (parents.length === 0) return null

  const totalWidth = items.reduce((s, i) => s + i.modules * MOD_W, 0)
  let curX = 0
  const posMap = new Map<string, { x: number; w: number }>()
  for (const it of items) {
    posMap.set(it.id, { x: curX, w: it.modules * MOD_W })
    curX += it.modules * MOD_W
  }

  const brackets: { left: number; right: number; color: string; ref: string }[] = []

  for (const parent of parents) {
    const pp = posMap.get(parent.id)!
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
    <div className="relative" style={{ width: totalWidth, height: 12, marginBottom: 2 }}>
      {brackets.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-sm flex flex-col items-center"
          style={{ left: b.left, width: b.right - b.left, top: 0 }}
        >
          {/* Линия связи */}
          <div className="w-full h-0.5 mt-1" style={{ background: b.color, opacity: 0.5 }} />
          {/* Вертикальные отводы к устройствам */}
          {(() => {
            const parent = parents.find(p => p.id === parents[i]?.id)
            if (!parent) return null
            const pp = posMap.get(parent.id)!
            const childItems = items.filter(c =>
              c.id !== parent.id &&
              c.protectedGroupIds.length === 0 &&
              parent.protectedGroupIds.some(gname => c.label.includes(gname) || gname.includes(c.label))
            )
            return (
              <>
                {/* К родителю */}
                <div className="absolute" style={{ left: pp.x + pp.w / 2 - b.left, top: 0, width: 0.5, height: 5, background: b.color, opacity: 0.5 }} />
                {/* К детям */}
                {childItems.map((ch, ci) => {
                  const cp = posMap.get(ch.id)!
                  return (
                    <div key={ci} className="absolute" style={{ left: cp.x + cp.w / 2 - b.left, top: 0, width: 0.5, height: 5, background: b.color, opacity: 0.35 }} />
                  )
                })}
              </>
            )
          })()}
          <span className="text-[7px] font-bold mt-1 whitespace-nowrap" style={{ color: b.color, opacity: 0.7 }}>{b.ref}</span>
        </div>
      ))}
    </div>
  )
}

// ─── ВЫХОДЫ ───
function OutputStrip({ items, totalWidth }: { items: PanelItem[]; totalWidth: number }) {
  let curX = 0
  const cells: { item: PanelItem; cx: number }[] = []
  for (const it of items) {
    cells.push({ item: it, cx: curX + (it.modules * MOD_W) / 2 })
    curX += it.modules * MOD_W
  }
  return (
    <div className="relative" style={{ width: totalWidth, height: BOT_H }}>
      {/* N шина (выходная) */}
      <div className="absolute inset-x-0 rounded-full" style={{ top: 0, height: 4, background: '#3498db', opacity: 0.9 }} />
      {/* PE шина (выходная) */}
      <div className="absolute inset-x-0 rounded-full" style={{ top: 10, height: 4, background: '#27ae60', opacity: 0.9 }} />

      {cells.map(({ item, cx }, i) => {
        const isEq = item.type === 'panel_equipment'
        const loadName = item.label.length > 14 ? item.label.substring(0, 14) + '…' : item.label
        if (isEq) {
          return (
            <div key={i} className="absolute flex flex-col items-center" style={{ left: cx - 35, width: 70, top: 18 }}>
              <span className="text-[7px] text-gray-400">{loadName}</span>
            </div>
          )
        }
        return (
          <div key={i} className="absolute flex flex-col items-center" style={{ left: cx - 45, width: 90, top: 18 }}>
            <div className="flex gap-1">
              <span className="text-[6px] font-bold text-[#e74c3c]">L</span>
              <span className="text-[6px] font-bold text-[#3498db]">N</span>
              <span className="text-[6px] font-bold text-[#27ae60]">PE</span>
            </div>
            <div className="text-[8px] font-semibold text-gray-600 mt-0.5 text-center leading-tight">{loadName}</div>
            <div className="text-[6px] text-gray-400">3×2.5</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── РЯД ───
function PanelRow({
  row,
  rowIndex,
  supplyPhases,
}: {
  row: PanelItem[]
  rowIndex: number
  supplyPhases: 1 | 3
}) {
  const totalWidth = row.reduce((s, i) => s + i.modules * MOD_W, 0)
  const isFirst = rowIndex === 0

  return (
    <div className="flex flex-col items-center" style={{ gap: 1 }}>
      <span className="text-[10px] text-gray-400 font-mono self-start ml-1">Ряд {rowIndex + 1}</span>

      {/* Шины и разводка */}
      <BusTopology items={row} totalWidth={totalWidth} isFirst={isFirst} />

      {/* Устройства */}
      <div className="flex" style={{ paddingTop: 2, paddingBottom: 4 }}>
        {row.map(item => (
          <DeviceCard key={item.id} item={item} />
        ))}
      </div>

      {/* DIN-рейка */}
      <DinRail width={totalWidth} />

      {/* Логические связи */}
      <GroupLinks items={row} />

      {/* Выходы */}
      <OutputStrip items={row} totalWidth={totalWidth} />
    </div>
  )
}

// ─── КОРПУС ───
function PanelEnclosure({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-gray-100 rounded-lg p-4" style={{ border: '3px solid #999', minWidth: 400 }}>
      <div className="absolute -left-0.5 top-4 w-2 h-4 rounded-full bg-gray-400 border border-gray-500" />
      <div className="absolute -left-0.5 bottom-4 w-2 h-4 rounded-full bg-gray-400 border border-gray-500" />
      {['top-1.5 right-1.5', 'bottom-1.5 right-1.5', 'top-1.5 left-4', 'bottom-1.5 left-4'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-1.5 h-1.5 rounded-full bg-gray-400 border border-gray-500`} />
      ))}
      <div className="bg-gray-50 rounded-sm p-4 border border-gray-200">
        {children}
      </div>
      <div className="mt-3 flex gap-4 text-[10px] text-gray-500 font-mono">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />N</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" />PE</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />L</span>
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
        ref: isRcd ? ((d as RCD).type === 'diff_breaker' ? 'AD1' : 'F1') : `QF${qfCounter++}`,
        label: isRcd ? (d as RCD).protectedGroups.join(', ') : (d as CircuitBreaker).group,
        sublabel: isRcd ? `${(d as RCD).ratingAmps}А/${(d as RCD).leakageMA}мА` : `${(d as CircuitBreaker).characteristic}${(d as CircuitBreaker).rating}`,
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
            <div className="flex flex-col" style={{ gap: 32 }}>
              {rows.map((row, ri) => (
                <PanelRow
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
