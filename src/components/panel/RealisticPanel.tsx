'use client'

import React, { useState, useEffect } from 'react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CalculationResult, CircuitBreaker, RCD, PhaseId } from '@/types/electrical'

// ─── КОНСТАНТЫ ───
const MOD_W = 34 // 1 модуль = 34px

interface PanelItem {
  id: string
  type: string
  label: string
  sublabel: string
  modules: number
  phase?: PhaseId
  rating: number
  poles: number
}

// Нумерация устройств: QS = рубильник, QF = автомат, F = УЗО, AD = диф
function getDeviceRef(item: PanelItem, index: number): string {
  if (item.type === 'load_break_switch') return 'QS1'
  if (item.type === 'rcd') return 'F1'
  if (item.type === 'diff_breaker') return 'AD1'
  return `QF${index}` // сквозная нумерация автоматов
}

// ─── РЕАЛИСТИЧНЫЙ АВТОМАТ ───
function RealisticBreaker({ item, index }: { item: PanelItem; index: number }) {
  const width = item.modules * MOD_W
  const ref = getDeviceRef(item, index)

  let typeLabel = 'АВ'
  let toggleColor = 'bg-gray-800'
  let typeColor = 'text-gray-500'

  if (item.type === 'main_breaker') { typeLabel = 'АВ'; toggleColor = 'bg-gray-800'; typeColor = 'text-pink-600' }
  else if (item.type === 'load_break_switch') { typeLabel = 'РУБ'; toggleColor = 'bg-red-600'; typeColor = 'text-red-600' }
  else if (item.type === 'rcd') { typeLabel = 'УЗО'; toggleColor = 'bg-blue-600'; typeColor = 'text-blue-600' }
  else if (item.type === 'diff_breaker') { typeLabel = 'ДИФ'; toggleColor = 'bg-blue-700'; typeColor = 'text-cyan-700' }
  else { typeLabel = 'АВ'; toggleColor = 'bg-gray-800'; typeColor = 'text-gray-500' }

  return (
    <div
      className="relative flex flex-col items-center justify-between border-b-2 border-r-2 border-gray-400 bg-gradient-to-b from-gray-100 via-gray-50 to-gray-200 shadow-md cursor-grab active:cursor-grabbing hover:brightness-95 transition-all select-none"
      style={{ width, height: 150, borderRadius: '3px' }}
    >
      {/* Верхняя клемма */}
      <div className="w-full h-4 bg-gray-300 border-b border-gray-400 flex justify-center items-center">
        {Array.from({ length: item.modules }).map((_, i) => (
          <div key={i} className="w-full flex justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 shadow-inner border border-gray-600 ring-1 ring-inset ring-gray-400/30"></div>
          </div>
        ))}
      </div>

      {/* Номер QF */}
      <div className="absolute top-0 right-0.5 text-[7px] font-bold text-gray-400">
        {ref}
      </div>

      {/* Фаза */}
      {item.phase && (
        <div className="absolute top-5 left-1 text-[7px] font-bold text-gray-400">
          {item.phase}
        </div>
      )}

      {/* Тип (русский) */}
      <div className={`mt-2 text-[9px] font-black tracking-widest uppercase ${typeColor}`}>
        {typeLabel}
      </div>

      {/* Рычажок */}
      <div className="flex-1 flex items-center justify-center w-full">
        {Array.from({ length: item.modules }).map((_, i) => (
          <div key={i} className="w-full flex justify-center">
            <div className={`w-5 h-8 ${toggleColor} rounded-sm border-b-4 border-gray-900 shadow-lg relative`}>
              <div className="absolute top-1 left-1 w-3 h-1 bg-white/20 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Номинал */}
      <div className="mb-1 text-center w-full px-1">
        <div className="text-[10px] font-bold text-gray-800 leading-tight">
          {item.rating}А
        </div>
        <div className="text-[7px] text-gray-500 leading-tight overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
          {item.label}
        </div>
      </div>

      {/* Нижняя клемма */}
      <div className="w-full h-4 bg-gray-300 border-t border-gray-400 flex justify-center items-center">
        {Array.from({ length: item.modules }).map((_, i) => (
          <div key={i} className="w-full flex justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 shadow-inner border border-gray-600 ring-1 ring-inset ring-gray-400/30"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── СОРТИРУЕМЫЙ ЭЛЕМЕНТ ───
function SortableBreaker({ item, index }: { item: PanelItem; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 10 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <RealisticBreaker item={item} index={index} />
    </div>
  )
}

// ─── СОЕДИНИТЕЛЬНЫЕ ПРОВОДА + ШИНЫ ───
function BusBars({ items, supplyPhases }: { items: PanelItem[]; supplyPhases: 1 | 3 }) {
  const totalWidth = items.reduce((sum, item) => sum + item.modules * MOD_W, 0)
  const is3Phase = supplyPhases === 3

  const phaseColors: Record<string, string> = {
    L1: '#e74c3c',
    L2: '#f39c12',
    L3: '#9b59b6',
    N: '#3498db',
    PE: '#f1c40f'
  }

  // Для каждого модуля определяем цвет фазы
  function getPhaseColor(item: PanelItem): string {
    if (item.phase?.includes('L1')) return phaseColors.L1
    if (item.phase?.includes('L2')) return phaseColors.L2
    if (item.phase?.includes('L3')) return phaseColors.L3
    return '#e74c3c' // default L
  }

  return (
    <div className="relative" style={{ width: totalWidth, height: 70 }}>
      <svg width={totalWidth} height={70} className="absolute inset-0">
        {/* Вертикальные соединительные провода от каждого модуля */}
        {items.map((item, itemIdx) => {
          const xStart = items.slice(0, itemIdx).reduce((s, i) => s + i.modules * MOD_W, 0)
          const phaseColor = getPhaseColor(item)

          // Для каждого полюса модуля — вертикальная линия
          const wires: React.ReactNode[] = []
          for (let pole = 0; pole < item.modules; pole++) {
            const x = xStart + pole * MOD_W + MOD_W / 2
            wires.push(
              <g key={`${item.id}-wires-${pole}`}>
                {/* Фазный провод L — от модуля к шине */}
                {(item.modules === 1 || pole === 0) && (
                  <line x1={x} y1={2} x2={x} y2={12} stroke={phaseColor} strokeWidth={1.5} strokeLinecap="round" />
                )}
                {/* N (нулевой) провод — если устройство 2P+ */}
                {item.modules >= 2 && pole === 1 && (
                  <line x1={x} y1={2} x2={x} y2={12} stroke={phaseColors.N} strokeWidth={1.5} strokeLinecap="round" />
                )}
                {/* PE провод — всегда в первом полюсе */}
                {pole === 0 && (
                  <line x1={x + 3} y1={2} x2={x + 3} y2={12} stroke={phaseColors.PE} strokeWidth={1} strokeLinecap="round" strokeDasharray="2,1" />
                )}
              </g>
            )
          }
          return wires
        })}

        {/* Горизонтальные шины (гребёнка) */}
        {(() => {
          const rowW = totalWidth
          const L_y = 14
          const N_y = 20
          const PE_y = 26

          // Для каждой позиции под модулем рисуем цветной сегмент
          let pos = 0
          const segments: { x: number; w: number; color: string; y: number }[] = []
          for (const item of items) {
            const phaseColor = getPhaseColor(item)
            // L-шина под каждым модулем
            segments.push({ x: pos, w: item.modules * MOD_W, color: phaseColor, y: L_y })
            segments.push({ x: pos, w: item.modules * MOD_W, color: phaseColors.N, y: N_y })
            segments.push({ x: pos, w: item.modules * MOD_W, color: phaseColors.PE, y: PE_y })
            pos += item.modules * MOD_W
          }
          return segments.map((seg, i) => (
            <rect key={`seg-${i}`} x={seg.x} y={seg.y} width={seg.w} height={4} fill={seg.color} rx={1} opacity={0.85} />
          ))
        })()}

        {/* Горизонтальные линии по всей длине (главная магистраль) */}
        <line x1={0} x2={totalWidth} y1={16} y2={16} stroke={is3Phase ? '#e74c3c' : '#e74c3c'} strokeWidth={1} opacity={0.3} />
        <line x1={0} x2={totalWidth} y1={22} y2={22} stroke="#3498db" strokeWidth={1} opacity={0.3} />
        <line x1={0} x2={totalWidth} y1={28} y2={28} stroke="#f1c40f" strokeWidth={1} opacity={0.3} />
      </svg>

      {/* Подписи шин */}
      <div className="absolute bottom-0 left-0 flex gap-3 text-[8px]">
        {is3Phase ? (
          <>
            <span className="text-[#e74c3c] font-bold">L1</span>
            <span className="text-[#f39c12] font-bold">L2</span>
            <span className="text-[#9b59b6] font-bold">L3</span>
          </>
        ) : (
          <span className="text-[#e74c3c] font-bold">L</span>
        )}
        <span className="text-[#3498db] font-bold">N</span>
        <span className="text-[#f1c40f] font-bold">PE</span>
      </div>
    </div>
  )
}

// ─── ГЛАВНЫЙ КОМПОНЕНТ ЩИТКА ───
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

    // Рубильник
    if (result.loadBreakSwitch) {
      newItems.push({
        id: result.loadBreakSwitch.id,
        type: 'load_break_switch',
        label: result.loadBreakSwitch.group,
        sublabel: `${result.loadBreakSwitch.rating}А`,
        modules: result.loadBreakSwitch.modules,
        phase: result.loadBreakSwitch.phase,
        rating: result.loadBreakSwitch.rating,
        poles: result.loadBreakSwitch.poles,
      })
    }

    // Вводной
    newItems.push({
      id: result.mainBreaker.id,
      type: 'main_breaker',
      label: result.mainBreaker.group,
      sublabel: `${result.mainBreaker.characteristic}${result.mainBreaker.rating}`,
      modules: result.mainBreaker.modules,
      phase: result.mainBreaker.phase,
      rating: result.mainBreaker.rating,
      poles: result.mainBreaker.poles,
    })

    // УЗО + автоматы
    for (const d of result.devices) {
      if (d.id === 'main' || d.id === 'load_break') continue
      const isRcd = d.type === 'rcd' || d.type === 'diff_breaker'
      newItems.push({
        id: d.id,
        type: d.type,
        label: isRcd ? (d as RCD).protectedGroups.join(', ') : (d as CircuitBreaker).group,
        sublabel: isRcd
          ? `${(d as RCD).ratingAmps}А/${(d as RCD).leakageMA}мА`
          : `${(d as CircuitBreaker).characteristic}${(d as CircuitBreaker).rating}`,
        modules: d.modules,
        phase: d.phase,
        rating: isRcd ? (d as RCD).ratingAmps : (d as CircuitBreaker).rating,
        poles: d.poles,
      })
    }

    setItems(newItems)
    // Уведомить родителя о начальном порядке
    onOrderChange?.(newItems.map(i => i.id))
  }, [result])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over?.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        // Уведомить родителя о новом порядке
        onOrderChange?.(newItems.map(i => i.id))
        return newItems
      })
    }
  }

  // Разбивка по DIN-рейкам (12 модулей)
  const rows: PanelItem[][] = []
  let currentRow: PanelItem[] = []
  let currentMods = 0
  for (const item of items) {
    if (currentMods + item.modules > 12) {
      rows.push(currentRow)
      currentRow = []
      currentMods = 0
    }
    currentRow.push(item)
    currentMods += item.modules
  }
  if (currentRow.length > 0) rows.push(currentRow)

  const actualModules = items.reduce((sum, i) => sum + i.modules, 0)

  // Сквозной индекс для нумерации QF
  let qfIndex = 1
  const getIndex = (item: PanelItem): number => {
    if (item.type === 'load_break_switch') return 0
    if (item.type === 'rcd') return 0
    if (item.type === 'diff_breaker') return 0
    return qfIndex++
  }

  return (
    <div className="p-8 bg-[#9098a0] rounded-lg border-4 border-gray-500 shadow-2xl max-w-[700px] mx-auto">
      {/* Заголовок щитка */}
      <div className="text-center font-bold mb-2 tracking-widest">
        <div className="text-white text-xs bg-gray-700 inline-block px-4 py-0.5 rounded">РАСПРЕДЕЛИТЕЛЬНЫЙ ЩИТ</div>
        <div className="text-gray-200 text-[10px] font-normal tracking-normal mt-1">
          {result.supplyPhases === 3 ? '3 фазы' : '1 фаза'} · {actualModules} модулей · щит {result.recommendedPanelModules} мест ({result.panelRows} ряда)
        </div>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-10">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="relative w-full flex flex-col items-center">

              {/* DIN-рейка */}
              <div className="absolute top-[30px] w-[calc(100%-10px)] h-7 bg-gradient-to-b from-gray-400 via-gray-200 to-gray-400 border border-gray-500 shadow-sm z-0">
                <div className="w-full h-full flex justify-between items-center px-2 opacity-25">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div key={i} className="w-1.5 h-3 bg-gray-600 rounded-sm"></div>
                  ))}
                </div>
              </div>

              {/* Автоматы */}
              <div className="relative z-10 flex w-full max-w-[408px] justify-start items-center">
                <SortableContext items={row.map(i => i.id)} strategy={horizontalListSortingStrategy}>
                  {row.map(item => {
                    const idx = getIndex(item)
                    return <SortableBreaker key={item.id} item={item} index={idx} />
                  })}
                </SortableContext>
              </div>

              {/* Шины + соединения */}
              <div className="relative z-10 mt-0 flex w-full max-w-[408px] justify-start">
                <BusBars items={row} supplyPhases={result.supplyPhases} />
              </div>

            </div>
          ))}
        </div>
      </DndContext>
    </div>
  )
}
