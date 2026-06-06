'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CalculationResult, CircuitBreaker, RCD, PhaseId } from '@/types/electrical'

// ─── КОНСТАНТЫ ───
const MOD_W = 38 // ширина 1 модуля в пикселях (18мм DIN * ~2.1)
const DEV_H = 158 // высота устройства
const DIN_H = 7   // высота DIN-рейки

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
}

function getDeviceRef(item: PanelItem, index: number): string {
  if (item.type === 'load_break_switch') return 'QS1'
  if (item.type === 'rcd') return 'F1'
  if (item.type === 'diff_breaker') return 'AD1'
  return `QF${index}`
}

// ─── SVG-ФИЛЬТРЫ (один раз для всех) ───
function SvgDefs() {
  return (
    <defs>
      {/* Тень корпуса */}
      <filter id="body-shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx={1} dy={2} stdDeviation={2} floodOpacity={0.15} />
      </filter>
      {/* Тень рычажка */}
      <filter id="lever-shadow" x="-20%" y="-10%" width="140%" height="120%">
        <feDropShadow dx={1} dy={1} stdDeviation={0.5} floodOpacity={0.25} />
      </filter>
      {/* Внутренняя тень */}
      <filter id="inset-shadow">
        <feOffset dx={0} dy={1} />
        <feGaussianBlur stdDeviation={1} />
        <feComposite operator="out" in="SourceGraphic" />
        <feComponentTransfer><feFuncA type="linear" slope={0.12} /></feComponentTransfer>
        <feBlend in="SourceGraphic" mode="normal" />
      </filter>
      {/* Тень клеммы */}
      <radialGradient id="terminal-grad">
        <stop offset="0%" stopColor="#eee" />
        <stop offset="60%" stopColor="#bbb" />
        <stop offset="100%" stopColor="#888" />
      </radialGradient>
      {/* Металл DIN-рейки */}
      <linearGradient id="din-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#b0b0b0" />
        <stop offset="30%" stopColor="#d4d4d4" />
        <stop offset="50%" stopColor="#e8e8e8" />
        <stop offset="70%" stopColor="#c8c8c8" />
        <stop offset="100%" stopColor="#909090" />
      </linearGradient>
      {/* Градиент корпуса автомата */}
      <linearGradient id="body-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fafafa" />
        <stop offset="50%" stopColor="#f0f0f0" />
        <stop offset="100%" stopColor="#e2e2e2" />
      </linearGradient>
      {/* Градиент корпуса УЗО/Диф */}
      <linearGradient id="body-rcd-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f8f9ff" />
        <stop offset="50%" stopColor="#eef0fa" />
        <stop offset="100%" stopColor="#dee0ec" />
      </linearGradient>
      {/* Градиент корпуса рубильника */}
      <linearGradient id="body-switch-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff8f0" />
        <stop offset="50%" stopColor="#f5ede4" />
        <stop offset="100%" stopColor="#e8ddd2" />
      </linearGradient>
      {/* Ручка автомата */}
      <linearGradient id="handle-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#555" />
        <stop offset="40%" stopColor="#333" />
        <stop offset="100%" stopColor="#1a1a1a" />
      </linearGradient>
      {/* Красная ручка рубильника */}
      <linearGradient id="handle-red-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ff4444" />
        <stop offset="40%" stopColor="#d32f2f" />
        <stop offset="100%" stopColor="#b71c1c" />
      </linearGradient>
      {/* Синяя ручка УЗО */}
      <linearGradient id="handle-blue-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#42a5f5" />
        <stop offset="40%" stopColor="#1976d2" />
        <stop offset="100%" stopColor="#0d47a1" />
      </linearGradient>
      {/* Тёмно-синяя ручка дифа */}
      <linearGradient id="handle-darkblue-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1e88e5" />
        <stop offset="40%" stopColor="#0d47a1" />
        <stop offset="100%" stopColor="#002171" />
      </linearGradient>
      {/* Вентиляция */}
      <pattern id="vents" width="4" height="8" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="3" height="6" rx="1" fill="#ccc" />
      </pattern>
      {/* Гребёнка фазы */}
      <linearGradient id="comb-L" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e74c3c" />
        <stop offset="100%" stopColor="#c0392b" />
      </linearGradient>
      <linearGradient id="comb-N" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3498db" />
        <stop offset="100%" stopColor="#2980b9" />
      </linearGradient>
      <linearGradient id="comb-PE" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f1c40f" />
        <stop offset="100%" stopColor="#d4ac0d" />
      </linearGradient>
    </defs>
  )
}

// ─── КЛЕММА ───
function Terminal({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="url(#terminal-grad)" stroke="#999" strokeWidth={0.5} />
      <line x1={cx - 2.5} y1={cy} x2={cx + 2.5} y2={cy} stroke="#666" strokeWidth={0.8} />
    </g>
  )
}

// ─── РЫЧАЖОК АВТОМАТА ───
function BreakerLever({ cx, up, color, angle = 12 }: { cx: number; up: boolean; color: string; angle?: number }) {
  const leverW = 7
  const leverH = 38
  const slotH = 32
  const slotY = 32
  const dir = up ? -angle : angle

  return (
    <g>
      {/* Прорезь */}
      <rect x={cx - leverW - 1} y={slotY - 2} width={leverW * 2 + 2} height={slotH + 4} rx={3} fill="#444" stroke="#333" strokeWidth={0.5} />
      <rect x={cx - leverW} y={slotY - 1} width={leverW * 2} height={slotH + 2} rx={2} fill="#222" />
      {/* Рычажок */}
      <g filter="url(#lever-shadow)" transform={`rotate(${dir}, ${cx}, ${slotY + slotH / 2})`}>
        <rect
          x={cx - leverW / 2}
          y={up ? slotY - leverH + slotH : slotY}
          width={leverW}
          height={leverH}
          rx={3}
          fill={color}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={0.5}
        />
        {/* Блик на рычажке */}
        <rect
          x={cx - leverW / 2 + 1.5}
          y={up ? slotY - leverH + slotH + 2 : slotY + 2}
          width={2}
          height={leverH - 8}
          rx={1}
          fill="rgba(255,255,255,0.15)"
        />
      </g>
    </g>
  )
}

// ─── КНОПКА ТЕСТ УЗО ───
function TestButton({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#e0e0e0" stroke="#999" strokeWidth={0.5} />
      <circle cx={cx} cy={cy} r={3.5} fill="#4caf50" />
      <text x={cx} y={cy + 1} textAnchor="middle" fontSize={5} fill="white" fontWeight="bold">T</text>
    </g>
  )
}

// ─── ИНДИКАТОР УЗО ───
function StatusWindow({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 5} y={cy - 4} width={10} height={8} rx={1} fill="#fff" stroke="#bbb" strokeWidth={0.5} />
      <rect x={cx - 4} y={cy - 3} width={8} height={6} rx={0.5} fill="#4caf50" opacity={0.7} />
    </g>
  )
}

// ─── ВЕНТИЛЯЦИЯ ───
function Vents({ x, y, height }: { x: number; y: number; height: number }) {
  const slots = Math.floor(height / 10)
  return (
    <g>
      {Array.from({ length: slots }).map((_, i) => (
        <rect
          key={i}
          x={x}
          y={y + i * 10 + 2}
          width={3}
          height={6}
          rx={1}
          fill="none"
          stroke="#ccc"
          strokeWidth={0.8}
        />
      ))}
    </g>
  )
}

// ─── КОМПОНЕНТ УСТРОЙСТВА ───
function DeviceSVG({ item, index }: { item: PanelItem; index: number }) {
  const w = item.modules * MOD_W
  const h = DEV_H
  const cx = w / 2
  const ref = getDeviceRef(item, index)

  // Настройки в зависимости от типа
  let config: {
    bodyGrad: string
    handleGrad: string
    accentFill: string
    typeText: string
    showTestBtn: boolean
    showIndicator: boolean
    handleUp: boolean
    bodyColor: string
    labelColor: string
  }

  switch (item.type) {
    case 'main_breaker':
      config = {
        bodyGrad: 'url(#body-grad)',
        handleGrad: 'url(#handle-grad)',
        accentFill: '#d32f2f',
        typeText: 'АВ',
        showTestBtn: false,
        showIndicator: false,
        handleUp: true,
        bodyColor: '#f5f5f5',
        labelColor: '#d32f2f',
      }
      break
    case 'load_break_switch':
      config = {
        bodyGrad: 'url(#body-switch-grad)',
        handleGrad: 'url(#handle-red-grad)',
        accentFill: '#e65100',
        typeText: 'РУБ',
        showTestBtn: false,
        showIndicator: false,
        handleUp: true,
        bodyColor: '#fff3e0',
        labelColor: '#e65100',
      }
      break
    case 'rcd':
      config = {
        bodyGrad: 'url(#body-rcd-grad)',
        handleGrad: 'url(#handle-blue-grad)',
        accentFill: '#1976d2',
        typeText: 'УЗО',
        showTestBtn: true,
        showIndicator: true,
        handleUp: true,
        bodyColor: '#eef0fa',
        labelColor: '#1976d2',
      }
      break
    case 'diff_breaker':
      config = {
        bodyGrad: 'url(#body-rcd-grad)',
        handleGrad: 'url(#handle-darkblue-grad)',
        accentFill: '#00838f',
        typeText: 'ДИФ',
        showTestBtn: true,
        showIndicator: true,
        handleUp: true,
        bodyColor: '#eef0fa',
        labelColor: '#00838f',
      }
      break
    default:
      config = {
        bodyGrad: 'url(#body-grad)',
        handleGrad: 'url(#handle-grad)',
        accentFill: '#555',
        typeText: 'АВ',
        showTestBtn: false,
        showIndicator: false,
        handleUp: true,
        bodyColor: '#f5f5f5',
        labelColor: '#555',
      }
  }

  const moduleCenters = Array.from({ length: item.modules }).map((_, i) => i * MOD_W + MOD_W / 2)

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      {/* Корпус */}
      <rect
        x={1.5}
        y={4}
        width={w - 3}
        height={h - 8}
        rx={4}
        ry={4}
        fill={config.bodyGrad}
        stroke="#bbb"
        strokeWidth={0.8}
        filter="url(#body-shadow)"
      />

      {/* Верхняя кромка корпуса */}
      <rect x={1.5} y={4} width={w - 3} height={8} rx={4} ry={4} fill="rgba(0,0,0,0.03)" />

      {/* Вентиляционные щели (по бокам корпуса) */}
      <Vents x={5} y={50} height={50} />
      {item.modules > 1 && <Vents x={w - 9} y={50} height={50} />}

      {/* ===== ВЕРХНИЕ КЛЕММЫ ===== */}
      {/* Линия клемм */}
      <rect x={4} y={6} width={w - 8} height={12} rx={2} fill="rgba(0,0,0,0.04)" />
      {moduleCenters.map((x, i) => (
        <Terminal key={`top-term-${i}`} cx={x} cy={12} />
      ))}

      {/* Зажимные винты сверху (прямоугольные рамки) */}
      {moduleCenters.map((x, i) => (
        <rect
          key={`clamp-${i}`}
          x={x - 5} y={8}
          width={10} height={8}
          rx={1}
          fill="none"
          stroke="#aaa"
          strokeWidth={0.5}
          opacity={0.5}
        />
      ))}

      {/* ===== ЦОКОЛЬ С МАРКИРОВКОЙ ===== */}
      {/* Рейтинг на корпусе */}
      <text
        x={cx}
        y={56}
        textAnchor="middle"
        fontSize={item.modules >= 2 ? 14 : 10}
        fontWeight="bold"
        fill={config.accentFill}
      >
        {item.rating}A
      </text>

      {/* Характеристика (C/D/B) */}
      <text
        x={cx}
        y={68}
        textAnchor="middle"
        fontSize={9}
        fontWeight="bold"
        fill="#666"
      >
        {item.character}
      </text>

      {/* Тип устройства */}
      <text
        x={cx}
        y={80}
        textAnchor="middle"
        fontSize={item.modules >= 2 ? 10 : 8}
        fontWeight="900"
        fill={config.accentFill}
        letterSpacing="1"
      >
        {config.typeText}
      </text>

      {/* ===== РЫЧАЖОК ===== */}
      <BreakerLever cx={cx} up={config.handleUp} color={config.handleGrad} angle={12} />

      {/* ===== КНОПКА ТЕСТ (УЗО/ДИФ) ===== */}
      {config.showTestBtn && (
        <TestButton cx={cx - 6} cy={46} />
      )}

      {/* ===== ИНДИКАТОР (УЗО/ДИФ) ===== */}
      {config.showIndicator && (
        <StatusWindow cx={cx + 6} cy={47} />
      )}

      {/* ===== НИЖНИЕ КЛЕММЫ ===== */}
      <rect x={4} y={h - 20} width={w - 8} height={12} rx={2} fill="rgba(0,0,0,0.04)" />
      {moduleCenters.map((x, i) => (
        <Terminal key={`bot-term-${i}`} cx={x} cy={h - 14} />
      ))}

      {/* Зажимные винты снизу */}
      {moduleCenters.map((x, i) => (
        <rect
          key={`bot-clamp-${i}`}
          x={x - 5} y={h - 18}
          width={10} height={8}
          rx={1}
          fill="none"
          stroke="#aaa"
          strokeWidth={0.5}
          opacity={0.5}
        />
      ))}

      {/* ===== ЗАЦЕПЫ НА DIN-РЕЙКУ ===== */}
      <rect x={cx - 6} y={h - 6} width={12} height={4} rx={1} fill="#999" />

      {/* ===== НОМЕР (QF1 и т.д.) ===== */}
      <text
        x={w - 4}
        y={11}
        textAnchor="end"
        fontSize={7}
        fill="#999"
        fontWeight="bold"
      >
        {ref}
      </text>

      {/* ===== ФАЗА ===== */}
      {item.phase && (
        <text
          x={4}
          y={28}
          textAnchor="start"
          fontSize={6.5}
          fill="#777"
          fontWeight="bold"
        >
          {item.phase}
        </text>
      )}

      {/* ===== ПОДПИСЬ ГРУППЫ (снизу корпуса) ===== */}
      <text
        x={cx}
        y={h - 24}
        textAnchor="middle"
        fontSize={6}
        fill="#888"
      >
        {item.label.substring(0, 18)}
      </text>

      {/* ===== ПОЛЮСНАЯ МАРКИРОВКА ===== */}
      {item.poles === 2 && (
        <>
          <text x={moduleCenters[0]} y={h - 30} textAnchor="middle" fontSize={5.5} fill="#e74c3c" fontWeight="bold">L</text>
          <text x={moduleCenters[1]} y={h - 30} textAnchor="middle" fontSize={5.5} fill="#3498db" fontWeight="bold">N</text>
        </>
      )}
      {item.poles === 1 && (
        <text x={moduleCenters[0]} y={h - 30} textAnchor="middle" fontSize={5.5} fill="#e74c3c" fontWeight="bold">L</text>
      )}
      {item.poles === 3 && (
        <>
          <text x={moduleCenters[0]} y={h - 30} textAnchor="middle" fontSize={4.5} fill="#e74c3c" fontWeight="bold">L1</text>
          <text x={moduleCenters[1]} y={h - 30} textAnchor="middle" fontSize={4.5} fill="#f39c12" fontWeight="bold">L2</text>
          <text x={moduleCenters[2]} y={h - 30} textAnchor="middle" fontSize={4.5} fill="#9b59b6" fontWeight="bold">L3</text>
        </>
      )}
    </svg>
  )
}

// ─── КОМПОНЕНТ ДЛЯ DND-СОРТИРОВКИ ───
function SortableDevice({ item, index }: { item: PanelItem; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const w = item.modules * MOD_W

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    width: w,
    height: DEV_H,
    position: 'relative' as const,
    opacity: isDragging ? 0.85 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <DeviceSVG item={item} index={index} />
    </div>
  )
}

// ─── DIN-РЕЙКА ───
function DinRail({ width }: { width: number }) {
  return (
    <svg width={width} height={DIN_H + 6} viewBox={`0 0 ${width} ${DIN_H + 6}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="din-surface" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c0c0c0" />
          <stop offset="20%" stopColor="#d8d8d8" />
          <stop offset="40%" stopColor="#e8e8e8" />
          <stop offset="60%" stopColor="#d0d0d0" />
          <stop offset="100%" stopColor="#a0a0a0" />
        </linearGradient>
      </defs>
      {/* Профиль DIN-рейки (симметричный z-образный профиль) */}
      <rect x={0} y={0} width={width} height={DIN_H + 6} fill="url(#din-surface)" rx={1} />
      {/* Верхняя губа */}
      <rect x={0} y={0} width={width} height={3} fill="#b0b0b0" rx={1} />
      {/* Нижняя губа */}
      <rect x={0} y={DIN_H + 3} width={width} height={3} fill="#b0b0b0" rx={1} />
      {/* Отверстия для винтов */}
      {Array.from({ length: Math.floor(width / 40) }).map((_, i) => (
        i % 3 === 0 && (
          <circle key={i} cx={i * 40 + 20} cy={(DIN_H + 6) / 2} r={2.5} fill="#999" opacity={0.5} />
        )
      ))}
      {/* Блик */}
      <rect x={0} y={1} width={width} height={2} fill="rgba(255,255,255,0.3)" rx={0.5} />
    </svg>
  )
}

// ─── НИЖНЯЯ РАЗВОДКА (уход) — индивидуальные выходы на нагрузку ───
function BottomWiring({ items, supplyPhases }: { items: PanelItem[]; supplyPhases: 1 | 3 }) {
  const totalWidth = items.reduce((s, i) => s + i.modules * MOD_W, 0)
  const is3Phase = supplyPhases === 3
  const boxH = 100

  // Позиции устройств
  const devicePositions: { x: number; width: number; item: PanelItem }[] = []
  let pos = 0
  for (const item of items) {
    devicePositions.push({ x: pos, width: item.modules * MOD_W, item })
    pos += item.modules * MOD_W
  }

  function getModuleSignal(item: PanelItem, modIdx: number): { label: string; color: string } | null {
    if (item.type === 'rcd' || item.type === 'diff_breaker') {
      if (item.poles >= 2 && modIdx === item.poles - 1) return { label: 'N', color: '#3498db' }
    }
    if (item.poles === 1) return { label: 'L', color: '#e74c3c' }
    if (item.poles === 2) {
      if (modIdx === 0) return { label: 'L', color: '#e74c3c' }
      return { label: 'N', color: '#3498db' }
    }
    if (item.poles === 3) {
      const colors = ['#e74c3c', '#f39c12', '#9b59b6']
      return { label: `L${modIdx + 1}`, color: colors[modIdx] }
    }
    if (item.poles === 4) {
      if (modIdx < 3) {
        const colors = ['#e74c3c', '#f39c12', '#9b59b6']
        return { label: `L${modIdx + 1}`, color: colors[modIdx] }
      }
      return { label: 'N', color: '#3498db' }
    }
    return null
  }

  // Есть ли N у устройства (2P, 4P, или RCD с 2P+)
  function hasN(item: PanelItem): boolean {
    if (item.type === 'rcd' || item.type === 'diff_breaker') return item.poles >= 2
    return item.poles === 2 || item.poles === 4
  }

  // Есть ли фазные полюса у устройства
  function phaseCount(item: PanelItem): number {
    if (item.type === 'rcd' || item.type === 'diff_breaker') return item.poles >= 2 ? item.poles - 1 : item.poles
    if (item.poles >= 2) return item.poles - 1
    return item.poles
  }

  // N-шина и PE-шина (общие для всех)
  const nBusY = 60
  const peBusY = 82

  // Центр устройства по X
  function devCenter(dp: { x: number; width: number }): number {
    return dp.x + dp.width / 2
  }

  return (
    <div className="relative" style={{ width: totalWidth, height: boxH }}>
      <svg width={totalWidth} height={boxH} viewBox={`0 0 ${totalWidth} ${boxH}`} xmlns="http://www.w3.org/2000/svg">
        {/* === ФОН === */}
        <rect x={0} y={0} width={totalWidth} height={boxH} fill="rgba(0,0,0,0.01)" rx={2} />

        {/* === N ШИНА (общая нулевая) === */}
        <rect x={0} y={nBusY} width={totalWidth} height={5} rx={2} fill="#3498db" opacity={0.8} />
        <text x={totalWidth - 4} y={nBusY + 4} textAnchor="end" fontSize={7} fill="white" fontWeight="bold">N</text>
        <text x={6} y={nBusY + 4} fontSize={7} fill="white" fontWeight="bold" opacity={0.9}>N</text>

        {/* === PE ШИНА (общая земля) === */}
        <rect x={0} y={peBusY} width={totalWidth} height={5} rx={2} fill="#f1c40f" opacity={0.8} />
        {Array.from({ length: Math.ceil(totalWidth / 16) }).map((_, i) => (
          <rect key={i} x={i * 16} y={peBusY} width={8} height={5} fill="#2ecc71" opacity={0.4} />
        ))}
        <text x={totalWidth - 4} y={peBusY + 4} textAnchor="end" fontSize={7} fill="#333" fontWeight="bold">PE</text>
        <text x={6} y={peBusY + 4} fontSize={7} fill="#333" fontWeight="bold" opacity={0.9}>PE</text>

        {/* === ИНДИВИДУАЛЬНЫЕ ВЫХОДЫ ДЛЯ КАЖДОГО УСТРОЙСТВА === */}
        {devicePositions.map((dp) => {
          const cx = devCenter(dp)
          const phCnt = phaseCount(dp.item)
          const hasNE = hasN(dp.item)
          const signals = Array.from({ length: dp.item.modules }).map((_, mi) => getModuleSignal(dp.item, mi))

          return (
            <g key={`out-${dp.item.id}`}>
              {/* Фазные провода — от модулей устройства вниз */}
              {signals.map((sig, mi) => {
                if (!sig || sig.label === 'N') return null
                const wireX = dp.x + mi * MOD_W + MOD_W / 2
                return (
                  <g key={`lwire-${mi}`}>
                    {/* Провод от клеммы вниз */}
                    <path
                      d={`M ${wireX} 2 L ${wireX} ${boxH - 6}`}
                      fill="none"
                      stroke={sig.color}
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      opacity={0.9}
                    />
                    {/* Изоляция у клеммы */}
                    <line x1={wireX} y1={2} x2={wireX} y2={10} stroke={sig.color} strokeWidth={4} strokeLinecap="round" opacity={0.2} />
                    {/* Метка фазы на конце */}
                    <text x={wireX} y={boxH - 2} textAnchor="middle" fontSize={5} fill={sig.color} fontWeight="bold">{sig.label}</text>
                  </g>
                )
              })}

              {/* N провод: от N шины вниз, или от устройства (если 2P/4P) */}
              <path
                d={`M ${cx} ${hasNE ? 2 : nBusY} L ${cx} ${boxH - 6}`}
                fill="none"
                stroke="#3498db"
                strokeWidth={1.5}
                strokeLinecap="round"
                opacity={0.85}
              />
              {hasNE && (
                <>
                  {/* Если N через устройство — изоляция у клеммы */}
                  <line x1={cx} y1={2} x2={cx} y2={10} stroke="#3498db" strokeWidth={4} strokeLinecap="round" opacity={0.2} />
                  {/* Соединение с N шиной (перемычка) */}
                  <line x1={cx} y1={nBusY - 8} x2={cx} y2={nBusY + 2} stroke="#3498db" strokeWidth={1} strokeDasharray="1,2" opacity={0.35} />
                </>
              )}
              {!hasNE && (
                /* 1P: N берётся прямо с N шины */
                <circle cx={cx} cy={nBusY} r={2} fill="#3498db" opacity={0.8} />
              )}
              <text x={cx} y={boxH - 2} textAnchor="middle" fontSize={5} fill="#3498db" fontWeight="bold">N</text>

              {/* PE провод: от PE шины вниз */}
              <path
                d={`M ${cx} ${peBusY} L ${cx} ${boxH - 6}`}
                fill="none"
                stroke="#f1c40f"
                strokeWidth={1.5}
                strokeLinecap="round"
                opacity={0.85}
              />
              <circle cx={cx} cy={peBusY} r={2} fill="#f1c40f" opacity={0.8} />
              <text x={cx} y={boxH - 2} textAnchor="middle" fontSize={5} fill="#333" fontWeight="bold" dy={0.5}>PE</text>

              {/* Группирующая скобка (показывает, что провода — один кабель на нагрузку) */}
              <path
                d={`M ${cx - phCnt * 6 - 2} ${boxH - 14} L ${cx - phCnt * 6 - 2} ${boxH - 4} L ${cx + phCnt * 6 + 2} ${boxH - 4} L ${cx + phCnt * 6 + 2} ${boxH - 14}`}
                fill="none"
                stroke="#888"
                strokeWidth={0.6}
                opacity={0.4}
              />

              {/* Название линии (нагрузка) */}
              <text
                x={cx}
                y={boxH - 8}
                textAnchor="middle"
                fontSize={5.5}
                fill="#555"
                fontWeight="bold"
              >
                {dp.item.label.length > 18 ? dp.item.label.slice(0, 16) + '..' : dp.item.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── ВЕРХНЯЯ РАЗВОДКА (приход) ───
function TopWiring({
  items,
  supplyPhases,
  rowIndex,
}: {
  items: PanelItem[]
  supplyPhases: 1 | 3
  rowIndex: number
}) {
  const totalWidth = items.reduce((s, i) => s + i.modules * MOD_W, 0)
  const is3Phase = supplyPhases === 3
  const topH = 64

  // Позиции устройств
  const devicePositions: { x: number; width: number; item: PanelItem }[] = []
  let pos = 0
  for (const item of items) {
    devicePositions.push({ x: pos, width: item.modules * MOD_W, item })
    pos += item.modules * MOD_W
  }

  function getModuleSignal(item: PanelItem, modIdx: number): { label: string; color: string } | null {
    if (item.type === 'rcd' || item.type === 'diff_breaker') {
      if (item.poles >= 2 && modIdx === item.poles - 1) return { label: 'N', color: '#3498db' }
    }
    if (item.poles === 1) return { label: 'L', color: '#e74c3c' }
    if (item.poles === 2) {
      if (modIdx === 0) return { label: 'L', color: '#e74c3c' }
      return { label: 'N', color: '#3498db' }
    }
    if (item.poles === 3) {
      const colors = ['#e74c3c', '#f39c12', '#9b59b6']
      return { label: `L${modIdx + 1}`, color: colors[modIdx] }
    }
    if (item.poles === 4) {
      if (modIdx < 3) {
        const colors = ['#e74c3c', '#f39c12', '#9b59b6']
        return { label: `L${modIdx + 1}`, color: colors[modIdx] }
      }
      return { label: 'N', color: '#3498db' }
    }
    return null
  }

  // Позиции верхней гребёнки
  const topY = { L1: 50, L2: 43, L3: 36, N: 28, PE: 20 }

  function getTopY(label: string): number {
    if (is3Phase) {
      if (label === 'L' || label === 'L1') return topY.L1
      if (label === 'L2') return topY.L2
      if (label === 'L3') return topY.L3
      if (label === 'N') return topY.N
      return topY.PE
    }
    if (label === 'L' || label === 'L1') return topY.L1
    if (label === 'N') return topY.N
    return topY.PE
  }

  return (
    <div className="relative" style={{ width: totalWidth, height: topH }}>
      <svg width={totalWidth} height={topH} viewBox={`0 0 ${totalWidth} ${topH}`} xmlns="http://www.w3.org/2000/svg">
        {/* === ПРИХОДЯЩИЙ КАБЕЛЬ (только для первого ряда) === */}
        {rowIndex === 0 && (
          <g>
            {/* Толстый кабель сверху */}
            <rect
              x={totalWidth / 2 - 4}
              y={0}
              width={8}
              height={18}
              rx={3}
              fill="#2c2c2c"
            />
            {/* Разделение на жилы */}
            <path d={`M ${totalWidth / 2} 18 L ${totalWidth / 2 - 8} 30`} stroke="#e74c3c" strokeWidth={3} strokeLinecap="round" />
            <path d={`M ${totalWidth / 2} 18 L ${totalWidth / 2} 36`} stroke="#3498db" strokeWidth={3} strokeLinecap="round" />
            <path d={`M ${totalWidth / 2} 18 L ${totalWidth / 2 + 8} 26`} stroke="#f1c40f" strokeWidth={3} strokeLinecap="round" />
            {/* Жилы на конце: L, N, PE */}
            <line x1={totalWidth / 2 - 8} y1={30} x2={totalWidth / 2 - 8} y2={getTopY('L')} stroke="#e74c3c" strokeWidth={2.5} strokeLinecap="round" />
            <line x1={totalWidth / 2} y1={36} x2={totalWidth / 2} y2={getTopY('N')} stroke="#3498db" strokeWidth={2.5} strokeLinecap="round" />
            <line x1={totalWidth / 2 + 8} y1={26} x2={totalWidth / 2 + 8} y2={getTopY('PE')} stroke="#f1c40f" strokeWidth={2.5} strokeLinecap="round" />
          </g>
        )}

        {/* === ВЕРХНЯЯ ГРЕБЁНКА L === */}
        {rowIndex === 0 && (
          <>
            {/* L шина */}
            <rect x={0} y={topY.L1} width={totalWidth} height={4} rx={2} fill="#e74c3c" opacity={0.85} />
            <text x={totalWidth - 4} y={topY.L1 + 3} textAnchor="end" fontSize={6} fill="white" fontWeight="bold">{is3Phase ? 'L1' : 'L'}</text>
            <text x={6} y={topY.L1 + 3} fontSize={6} fill="white" fontWeight="bold" opacity={0.9}>{is3Phase ? 'L1' : 'L'}</text>

            {/* L2/L3 для 3-фаз */}
            {is3Phase && (
              <>
                <rect x={0} y={topY.L2} width={totalWidth} height={4} rx={2} fill="#f39c12" opacity={0.85} />
                <text x={totalWidth - 4} y={topY.L2 + 3} textAnchor="end" fontSize={6} fill="white" fontWeight="bold">L2</text>
                <text x={6} y={topY.L2 + 3} fontSize={6} fill="white" fontWeight="bold" opacity={0.9}>L2</text>

                <rect x={0} y={topY.L3} width={totalWidth} height={4} rx={2} fill="#9b59b6" opacity={0.85} />
                <text x={totalWidth - 4} y={topY.L3 + 3} textAnchor="end" fontSize={6} fill="white" fontWeight="bold">L3</text>
                <text x={6} y={topY.L3 + 3} fontSize={6} fill="white" fontWeight="bold" opacity={0.9}>L3</text>
              </>
            )}

            {/* N шина */}
            <rect x={0} y={topY.N} width={totalWidth} height={4} rx={2} fill="#3498db" opacity={0.85} />
            <text x={totalWidth - 4} y={topY.N + 3} textAnchor="end" fontSize={6} fill="white" fontWeight="bold">N</text>
            <text x={6} y={topY.N + 3} fontSize={6} fill="white" fontWeight="bold" opacity={0.9}>N</text>

            {/* PE шина */}
            <rect x={0} y={topY.PE} width={totalWidth} height={4} rx={2} fill="#f1c40f" opacity={0.85} />
            <text x={totalWidth - 4} y={topY.PE + 3} textAnchor="end" fontSize={6} fill="#333" fontWeight="bold">PE</text>
            <text x={6} y={topY.PE + 3} fontSize={6} fill="#333" fontWeight="bold" opacity={0.9}>PE</text>
          </>
        )}

        {/* === ПЕРЕМЫЧКИ ПРИХОДА (между входами соседних устройств) === */}
        {devicePositions.slice(0, -1).map((dp, i) => {
          const next = devicePositions[i + 1]
          const fromX = dp.x + dp.width
          const toX = next.x
          const midX = (fromX + toX) / 2
          const gap = toX - fromX
          if (gap > MOD_W * 1.5) return null

          const commonSignals: { label: string; color: string }[] = []
          const fromSignals = Array.from({ length: dp.item.modules }).map((_, mi) => getModuleSignal(dp.item, mi))
          const toSignals = Array.from({ length: next.item.modules }).map((_, mi) => getModuleSignal(next.item, mi))

          const fromL = fromSignals.find(s => s?.label === 'L' || s?.label === 'L1')
          const toL = toSignals.find(s => s?.label === 'L' || s?.label === 'L1')
          if (fromL && toL) commonSignals.push(fromL)

          const fromN = fromSignals.find(s => s?.label === 'N')
          const toN = toSignals.find(s => s?.label === 'N')
          if (fromN && toN) commonSignals.push(fromN)

          return commonSignals.map((sig) => {
            const wireY = topH - 8 - (sig.label === 'N' ? 4 : 0)
            return (
              <g key={`top-jumper-${i}-${sig.label}`}>
                <path
                  d={`M ${fromX} ${wireY} Q ${midX} ${wireY + 5} ${toX} ${wireY}`}
                  fill="none"
                  stroke={sig.color}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  opacity={0.7}
                />
                <circle cx={fromX} cy={wireY} r={1.5} fill={sig.color} opacity={0.8} />
                <circle cx={toX} cy={wireY} r={1.5} fill={sig.color} opacity={0.8} />
              </g>
            )
          })
        })}

        {/* === ВЕРТИКАЛЬНЫЕ ПРОВОДА ОТ ВЕРХНЕЙ ГРЕБЁНКИ К КЛЕММАМ === */}
        {devicePositions.map((dp) =>
          Array.from({ length: dp.item.modules }).map((_, modIdx) => {
            const cx = dp.x + modIdx * MOD_W + MOD_W / 2
            const signal = getModuleSignal(dp.item, modIdx)
            if (!signal) return null
            const sourceY = getTopY(signal.label)

            return (
              <g key={`top-wire-${dp.item.id}-${modIdx}`}>
                <path
                  d={`M ${cx} ${topH - 2} L ${cx} ${sourceY + 6} Q ${cx} ${sourceY} ${cx + 3} ${sourceY}`}
                  fill="none"
                  stroke={signal.color}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  opacity={0.9}
                />
                <circle cx={cx + 3} cy={sourceY} r={2} fill={signal.color} stroke="white" strokeWidth={0.5} />
                {/* Зубец гребёнки */}
                <rect x={cx - 2.5} y={sourceY - 2} width={5} height={6} rx={1} fill={signal.color} opacity={0.85} />
              </g>
            )
          })
        )}
      </svg>
    </div>
  )
}

// ─── РЯД УСТРОЙСТВ ───
function DeviceRow({
  row,
  rowIndex,
  onDragEnd,
  supplyPhases,
}: {
  row: PanelItem[]
  rowIndex: number
  onDragEnd: (event: DragEndEvent) => void
  supplyPhases: 1 | 3
}) {
  const rowWidth = row.reduce((s, i) => s + i.modules * MOD_W, 0)

  return (
    <div className="flex flex-col items-center gap-0 relative">
      {/* Метка ряда */}
      <div className="text-[9px] text-gray-400 font-mono mb-0.5 self-start ml-1">
        Ряд {rowIndex + 1}
      </div>

      {/* Верхняя разводка (приход) */}
      <TopWiring items={row} supplyPhases={supplyPhases} rowIndex={rowIndex} />

      {/* DIN-рейка под устройствами */}
      <div className="relative">
        <DinRail width={rowWidth} />

        {/* Устройства */}
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={row.map(i => i.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex" style={{ marginTop: -DIN_H - 6, marginBottom: -6 }}>
              {row.map((item, idx) => (
                <SortableDevice key={item.id} item={item} index={idx} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Нижняя разводка — индивидуальные выходы */}
      <BottomWiring items={row} supplyPhases={supplyPhases} />
    </div>
  )
}

// ─── КОРПУС ЩИТА ───
function PanelEnclosure({ children, width }: { children: React.ReactNode; width: number }) {
  return (
    <div className="relative" style={{ minWidth: width }}>
      {/* Внешняя рамка корпуса */}
      <div
        className="relative rounded-lg border-4 border-gray-600 shadow-2xl bg-gray-100 overflow-hidden"
        style={{
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.3)',
          borderColor: '#5a5a5a',
          background: 'linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%)',
        }}
      >
        {/* Петля двери (декоративная) */}
        <div className="absolute left-1 top-4 w-3 h-5 rounded-full bg-gray-400 border border-gray-500 shadow-inner" />
        <div className="absolute left-1 bottom-4 w-3 h-5 rounded-full bg-gray-400 border border-gray-500 shadow-inner" />

        {/* Внутреннее пространство */}
        <div
          className="p-5 m-2 rounded-md"
          style={{
            background: 'linear-gradient(180deg, #f8f8f8 0%, #eeeeee 50%, #e8e8e8 100%)',
            boxShadow: 'inset 0 0 8px rgba(0,0,0,0.08)',
          }}
        >
          {children}
        </div>

        {/* Винты по углам */}
        <div className="absolute top-2 right-3 w-2.5 h-2.5 rounded-full bg-gray-400 border border-gray-500 shadow-inner" />
        <div className="absolute bottom-2 right-3 w-2.5 h-2.5 rounded-full bg-gray-400 border border-gray-500 shadow-inner" />
        <div className="absolute top-2 left-5 w-2.5 h-2.5 rounded-full bg-gray-400 border border-gray-500 shadow-inner" />
        <div className="absolute bottom-2 left-5 w-2.5 h-2.5 rounded-full bg-gray-400 border border-gray-500 shadow-inner" />
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

    // Рубильник
    if (result.loadBreakSwitch) {
      const ls = result.loadBreakSwitch
      newItems.push({
        id: ls.id,
        type: 'load_break_switch',
        label: 'Мастер-выключатель',
        sublabel: `${ls.rating}А`,
        modules: ls.modules,
        phase: ls.phase,
        rating: ls.rating,
        character: '',
        poles: ls.poles,
      })
    }

    // Вводной
    const mb = result.mainBreaker
    newItems.push({
      id: mb.id,
      type: 'main_breaker',
      label: mb.group,
      sublabel: `${mb.rating}А`,
      modules: mb.modules,
      phase: mb.phase,
      rating: mb.rating,
      character: mb.characteristic,
      poles: mb.poles,
    })

    // Остальные устройства
    for (const d of result.devices) {
      if (d.id === 'main' || d.id === 'load_break') continue
      const isRcd = d.type === 'rcd' || d.type === 'diff_breaker'
      newItems.push({
        id: d.id,
        type: d.type,
        label: isRcd
          ? (d as RCD).protectedGroups.join(', ')
          : (d as CircuitBreaker).group,
        sublabel: isRcd
          ? `${(d as RCD).ratingAmps}А/${(d as RCD).leakageMA}мА`
          : `${(d as CircuitBreaker).characteristic}${(d as CircuitBreaker).rating}`,
        modules: d.modules,
        phase: d.phase,
        rating: isRcd ? (d as RCD).ratingAmps : (d as CircuitBreaker).rating,
        character: isRcd ? '' : (d as CircuitBreaker).characteristic,
        poles: d.poles,
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
    const result: PanelItem[][] = []
    let currentRow: PanelItem[] = []
    let currentMods = 0
    for (const item of items) {
      if (currentMods + item.modules > 12 && currentRow.length > 0) {
        result.push(currentRow)
        currentRow = []
        currentMods = 0
      }
      currentRow.push(item)
      currentMods += item.modules
    }
    if (currentRow.length > 0) result.push(currentRow)
    return result
  }, [items])

  const actualModules = items.reduce((s, i) => s + i.modules, 0)
  const maxRowWidth = Math.max(...rows.map(r => r.reduce((s, i) => s + i.modules * MOD_W, 0)), 200)
  const panelWidth = maxRowWidth + 60

  // Сквозной индекс для нумерации QF
  let qfIndex = 1
  const getIndex = (item: PanelItem): number => {
    if (item.type === 'load_break_switch') return 0
    if (item.type === 'rcd') return 0
    if (item.type === 'diff_breaker') return 0
    return qfIndex++
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Заголовок */}
      <div className="text-center">
        <div className="text-sm font-bold tracking-[0.15em] text-gray-700 bg-gray-200 inline-block px-6 py-1 rounded-sm shadow-inner">
          РАСПРЕДЕЛИТЕЛЬНЫЙ ЩИТ
        </div>
        <div className="text-[10px] text-gray-500 mt-1 font-mono">
          {result.supplyPhases === 3 ? '3 фазы (380В)' : '1 фаза (220В)'} · {actualModules} модулей · щит {result.recommendedPanelModules} мест ({result.panelRows} ряда)
        </div>
      </div>

      {/* SVG-фильтры */}
      <svg width={0} height={0} className="absolute">
        <SvgDefs />
      </svg>

      {/* Корпус */}
      <PanelEnclosure width={panelWidth}>
        {/* Ряды устройств */}
        <div className="flex flex-col gap-8">
          {rows.map((row, ri) => (
            <DeviceRow
              key={ri}
              row={row}
              rowIndex={ri}
              onDragEnd={handleDragEnd}
              supplyPhases={result.supplyPhases}
            />
          ))}
        </div>

        {/* N и PE шины внизу корпуса */}
        <div className="mt-6 flex items-center gap-4 px-2">
          {/* N шина */}
          <div className="flex items-center gap-2 bg-[#3498db]/10 border border-[#3498db]/30 rounded px-3 py-1.5">
            <div className="w-3 h-3 rounded-full bg-[#3498db]"></div>
            <span className="text-[10px] font-bold text-[#3498db]">N</span>
            <span className="text-[8px] text-gray-500">— нейтральная шина</span>
          </div>
          {/* PE шина */}
          <div className="flex items-center gap-2 bg-[#f1c40f]/10 border border-[#f1c40f]/30 rounded px-3 py-1.5">
            <div className="w-3 h-3 rounded-full bg-[#f1c40f] border border-[#d4ac0d]"></div>
            <span className="text-[10px] font-bold text-[#d4ac0d]">PE</span>
            <span className="text-[8px] text-gray-500">— заземление</span>
          </div>
          {/* L шина */}
          <div className="flex items-center gap-2 bg-[#e74c3c]/10 border border-[#e74c3c]/30 rounded px-3 py-1.5">
            <div className="w-3 h-3 rounded-full bg-[#e74c3c]"></div>
            <span className="text-[10px] font-bold text-[#e74c3c]">
              {result.supplyPhases === 3 ? 'L1/L2/L3' : 'L'}
            </span>
            <span className="text-[8px] text-gray-500">— фаза</span>
          </div>
        </div>
      </PanelEnclosure>

      {/* Условные обозначения */}
      <div className="flex flex-wrap gap-4 text-[9px] text-gray-400 font-mono mt-1">
        <span>🔄 = перетаскивание</span>
        <span>⏎ = Drag & Drop сортировка</span>
      </div>
    </div>
  )
}
