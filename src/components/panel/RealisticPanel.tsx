'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CalculationResult, CircuitBreaker, RCD, LoadBreakSwitch, PhaseId } from '@/types/electrical'

// ─── КОНСТАНТЫ ───
const MOD_W = 34 // 1 модуль = 34px

interface PanelItem {
  id: string
  type: string
  label: string
  sublabel: string
  modules: number
  phase?: PhaseId
  color: string
}

// ─── РЕАЛИСТИЧНЫЙ КОМПОНЕНТ АВТОМАТА (HTML/CSS) ───
function RealisticBreaker({ item }: { item: PanelItem }) {
  const width = item.modules * MOD_W

  // Цветовая маркировка рычажков (как у реальных автоматов)
  let toggleColor = 'bg-gray-800' // обычный автомат (черный)
  if (item.type === 'load_break_switch') toggleColor = 'bg-red-600' // рубильник
  if (item.type === 'rcd' || item.type === 'diff_breaker') toggleColor = 'bg-blue-600' // УЗО/Диф

  return (
    <div
      className="relative flex flex-col items-center justify-between border-b-2 border-r-2 border-gray-400 bg-gradient-to-b from-gray-100 via-gray-50 to-gray-200 shadow-md cursor-grab active:cursor-grabbing hover:brightness-95 transition-all"
      style={{ width, height: 140, borderRadius: '4px' }}
    >
      {/* Верхняя клемма */}
      <div className="w-full h-4 bg-gray-300 border-b border-gray-400 flex justify-center items-center">
        {Array.from({ length: item.modules }).map((_, i) => (
          <div key={i} className="w-full flex justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 shadow-inner border border-gray-600"></div>
          </div>
        ))}
      </div>

      {/* Маркировка фазы (если есть) */}
      {item.phase && (
        <div className="absolute top-5 left-1 text-[8px] font-bold text-gray-400">
          {item.phase}
        </div>
      )}

      {/* Бренд / Тип */}
      <div className="mt-2 text-[9px] font-black text-gray-500 tracking-widest uppercase">
        {item.type === 'rcd' ? 'RCD' : item.type === 'diff_breaker' ? 'RCBO' : 'MCB'}
      </div>

      {/* Рычажок (Toggle) */}
      <div className="flex-1 flex items-center justify-center w-full">
        {Array.from({ length: item.modules }).map((_, i) => (
          <div key={i} className="w-full flex justify-center">
            <div className={`w-5 h-8 ${toggleColor} rounded-sm border-b-4 border-gray-900 shadow-lg relative`}>
              <div className="absolute top-1 left-1 w-3 h-1 bg-white/20 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Номинал и Группа */}
      <div className="mb-2 text-center w-full px-1">
        <div className="text-[10px] font-bold text-gray-800 leading-tight">
          {item.sublabel}
        </div>
        <div className="text-[8px] text-gray-600 leading-tight overflow-hidden text-ellipsis whitespace-nowrap">
          {item.label}
        </div>
      </div>

      {/* Нижняя клемма */}
      <div className="w-full h-4 bg-gray-300 border-t border-gray-400 flex justify-center items-center">
        {Array.from({ length: item.modules }).map((_, i) => (
          <div key={i} className="w-full flex justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 shadow-inner border border-gray-600"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── СОРТИРУЕМЫЙ ЭЛЕМЕНТ (ОБЕРТКА DND-KIT) ───
function SortableBreaker({ item }: { item: PanelItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 10 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <RealisticBreaker item={item} />
    </div>
  )
}

// ─── ГЛАВНЫЙ КОМПОНЕНТ ЩИТКА ───
export function RealisticPanel({ result }: { result: CalculationResult }) {
  // Инициализация элементов
  const [items, setItems] = useState<PanelItem[]>([])

  useEffect(() => {
    const newItems: PanelItem[] = []
    if (result.loadBreakSwitch) {
      newItems.push({
        id: result.loadBreakSwitch.id,
        type: 'load_break_switch',
        label: 'Рубильник',
        sublabel: `${result.loadBreakSwitch.rating}А`,
        modules: result.loadBreakSwitch.modules,
        phase: result.loadBreakSwitch.phase,
        color: 'yellow'
      })
    }
    newItems.push({
      id: result.mainBreaker.id,
      type: 'main_breaker',
      label: 'Вводной',
      sublabel: `${result.mainBreaker.characteristic}${result.mainBreaker.rating}`,
      modules: result.mainBreaker.modules,
      phase: result.mainBreaker.phase,
      color: 'pink'
    })
    for (const d of result.devices) {
      if (d.id === 'main') continue
      newItems.push({
        id: d.id,
        type: d.type,
        label: d.type === 'rcd' || d.type === 'diff_breaker' ? 'УЗО/Диф' : (d as CircuitBreaker).group,
        sublabel: d.type === 'circuit_breaker' ? `${(d as CircuitBreaker).characteristic}${(d as CircuitBreaker).rating}` : `${(d as RCD).ratingAmps}А / ${(d as RCD).leakageMA}mA`,
        modules: d.modules,
        phase: d.phase,
        color: d.type === 'rcd' ? 'orange' : 'blue'
      })
    }
    setItems(newItems)
  }, [result])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Разбиваем items на DIN-рейки (по 12 модулей максимум)
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

  return (
    <div className="p-8 bg-[#d1d5db] rounded-lg border-4 border-gray-400 shadow-2xl max-w-[600px] mx-auto">
      <div className="text-center text-gray-500 font-bold mb-6 tracking-widest">
        РАСПРЕДЕЛИТЕЛЬНЫЙ ЩИТ ({result.recommendedPanelModules} МОД)
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-10">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="relative w-full h-[140px] flex items-center justify-center">
              
              {/* Реалистичная DIN-рейка (фон) */}
              <div className="absolute w-full h-8 bg-gradient-to-b from-gray-400 via-gray-200 to-gray-400 border border-gray-500 shadow-sm z-0">
                {/* Перфорация DIN-рейки */}
                <div className="w-full h-full flex justify-between items-center px-4 opacity-30">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="w-2 h-4 bg-gray-600 rounded-sm"></div>
                  ))}
                </div>
              </div>

              {/* Контейнер автоматов */}
              <div className="relative z-10 flex w-full max-w-[408px] justify-start items-center">
                <SortableContext items={row.map(i => i.id)} strategy={horizontalListSortingStrategy}>
                  {row.map(item => (
                    <SortableBreaker key={item.id} item={item} />
                  ))}
                </SortableContext>
              </div>

            </div>
          ))}
        </div>
      </DndContext>
    </div>
  )
}
