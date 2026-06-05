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
  rating: number // номинал в амперах
  poles: number
}

// ─── РЕАЛИСТИЧНЫЙ КОМПОНЕНТ АВТОМАТА (HTML/CSS) ───
function RealisticBreaker({ item }: { item: PanelItem }) {
  const width = item.modules * MOD_W

  // Русская маркировка типа
  let typeLabel = 'АВ'
  let toggleColor = 'bg-gray-800'
  let typeColor = 'text-gray-500'

  if (item.type === 'main_breaker') {
    typeLabel = 'АВ'
    toggleColor = 'bg-gray-800'
    typeColor = 'text-pink-600'
  } else if (item.type === 'load_break_switch') {
    typeLabel = 'РУБ'
    toggleColor = 'bg-red-600'
    typeColor = 'text-red-600'
  } else if (item.type === 'rcd') {
    typeLabel = 'УЗО'
    toggleColor = 'bg-blue-600'
    typeColor = 'text-blue-600'
  } else if (item.type === 'diff_breaker') {
    typeLabel = 'ДИФ'
    toggleColor = 'bg-blue-700'
    typeColor = 'text-blue-700'
  } else {
    typeLabel = 'АВ'
    toggleColor = 'bg-gray-800'
    typeColor = 'text-gray-500'
  }

  return (
    <div
      className="relative flex flex-col items-center justify-between border-b-2 border-r-2 border-gray-400 bg-gradient-to-b from-gray-100 via-gray-50 to-gray-200 shadow-md cursor-grab active:cursor-grabbing hover:brightness-95 transition-all select-none"
      style={{ width, height: 150, borderRadius: '3px' }}
    >
      {/* Верхняя клемма (вход — приходит от шины/вышестоящего аппарата) */}
      <div className="w-full h-4 bg-gray-300 border-b border-gray-400 flex justify-center items-center">
        {Array.from({ length: item.modules }).map((_, i) => (
          <div key={i} className="w-full flex justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 shadow-inner border border-gray-600 ring-1 ring-inset ring-gray-400/30"></div>
          </div>
        ))}
      </div>

      {/* Маркировка фазы */}
      {item.phase && (
        <div className="absolute top-5 left-1 text-[7px] font-bold text-gray-400">
          {item.phase}
        </div>
      )}

      {/* Тип устройства (русский) */}
      <div className={`mt-2 text-[9px] font-black tracking-widest uppercase ${typeColor}`}>
        {typeLabel}
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

      {/* Номинал */}
      <div className="mb-1 text-center w-full px-1">
        <div className="text-[10px] font-bold text-gray-800 leading-tight">
          {item.rating}А
        </div>
        <div className="text-[7px] text-gray-500 leading-tight overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
          {item.label}
        </div>
      </div>

      {/* Нижняя клемма (выход — к нагрузке) */}
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

// ─── ШИНЫ L/N/PE ПОД РЯДОМ АВТОМАТОВ ───
function BusBars({ items, supplyPhases }: { items: PanelItem[]; supplyPhases: 1 | 3 }) {
  const totalWidth = items.reduce((sum, item) => sum + item.modules * MOD_W, 0)

  // Определяем, какие фазы присутствуют
  const is3Phase = supplyPhases === 3
  const phaseColors = {
    L1: 'bg-red-500',
    L2: 'bg-amber-500',
    L3: 'bg-purple-500',
    N: 'bg-sky-500',
    PE: 'bg-yellow-500'
  }

  return (
    <div className="relative" style={{ width: totalWidth, height: 36 }}>
      {/* Фазные шины L1/L2/L3 */}
      <div className="flex gap-[1px] w-full">
        {items.map(item => {
          const w = item.modules * MOD_W
          let phaseColor = 'bg-gray-300'
          if (item.phase?.includes('L1')) phaseColor = phaseColors.L1
          else if (item.phase?.includes('L2')) phaseColor = phaseColors.L2
          else if (item.phase?.includes('L3')) phaseColor = phaseColors.L3
          
          return (
            <div
              key={item.id + '-L'}
              className={`h-2 ${phaseColor} border-l border-r border-gray-400`}
              style={{ width: w }}
            />
          )
        })}
      </div>

      {/* Нулевая шина (N) — под фазной */}
      <div className="flex gap-[1px] w-full mt-[2px]">
        {items.map(item => (
          <div
            key={item.id + '-N'}
            className={`h-2 ${phaseColors.N} border-l border-r border-gray-400`}
            style={{ width: item.modules * MOD_W }}
          />
        ))}
      </div>

      {/* PE шина (заземление) — отдельный ряд */}
      <div className="flex gap-[1px] w-full mt-[2px]">
        {items.map(item => (
          <div
            key={item.id + '-PE'}
            className={`h-2 ${phaseColors.PE} border-l border-r border-gray-400`}
            style={{ width: item.modules * MOD_W }}
          />
        ))}
      </div>

      {/* Подписи шин */}
      <div className="flex justify-between mt-1 w-full">
        <div className="flex gap-2 text-[7px] text-gray-500">
          {is3Phase ? (
            <>
              <span className="text-red-600 font-bold">L1</span>
              <span className="text-amber-600 font-bold">L2</span>
              <span className="text-purple-600 font-bold">L3</span>
            </>
          ) : (
            <span className="text-red-600 font-bold">L</span>
          )}
          <span className="text-sky-600 font-bold">N</span>
          <span className="text-yellow-600 font-bold">PE</span>
        </div>
      </div>
    </div>
  )
}

// ─── ГЛАВНЫЙ КОМПОНЕНТ ЩИТКА ───
export function RealisticPanel({ result }: { result: CalculationResult }) {
  // Инициализация элементов
  const [items, setItems] = useState<PanelItem[]>([])

  useEffect(() => {
    const newItems: PanelItem[] = []

    // Рубильник (если есть)
    if (result.loadBreakSwitch) {
      newItems.push({
        id: result.loadBreakSwitch.id,
        type: 'load_break_switch',
        label: 'Рубильник',
        sublabel: `${result.loadBreakSwitch.rating}А`,
        modules: result.loadBreakSwitch.modules,
        phase: result.loadBreakSwitch.phase,
        rating: result.loadBreakSwitch.rating,
        poles: result.loadBreakSwitch.poles,
      })
    }

    // Вводной автомат
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

    // Остальные устройства (УЗО + автоматы)
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

  const actualModules = items.reduce((sum, i) => sum + i.modules, 0)

  return (
    <div className="p-8 bg-[#d1d5db] rounded-lg border-4 border-gray-400 shadow-2xl max-w-[600px] mx-auto">
      <div className="text-center font-bold mb-2 tracking-widest">
        <div className="text-gray-600 text-xs">РАСПРЕДЕЛИТЕЛЬНЫЙ ЩИТ</div>
        <div className="text-gray-500 text-[10px] font-normal tracking-normal">
          {result.supplyPhases === 3 ? '3 фазы' : '1 фаза'} · {actualModules} модулей · щит {result.recommendedPanelModules} мест ({result.panelRows} ряда)
        </div>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-12">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="relative w-full flex flex-col items-center">
              
              {/* Реалистичная DIN-рейка (фон) */}
              <div className="absolute top-[30px] w-[calc(100%-20px)] h-8 bg-gradient-to-b from-gray-400 via-gray-200 to-gray-400 border border-gray-500 shadow-sm z-0">
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

              {/* Шины L/N/PE под автоматами */}
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
