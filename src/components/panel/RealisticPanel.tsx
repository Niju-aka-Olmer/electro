'use client'

import React, { useCallback, useState, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  type NodeProps,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { CalculationResult, CircuitBreaker, RCD, PhaseId } from '@/types/electrical'

// ─── КОНСТАНТЫ ───
const MOD_W = 64   // ширина модуля на canvas
const DEV_W = (m: number) => m * MOD_W
const DEV_H = 72
const BUS_H = 6    // высота шины
const ROW_GAP = 220 // между рядами
const BUS_Y_OFFSET = -80  // смещение шин над устройствами

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

// ─── ЦВЕТА ───
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

// ─── КАСТОМНЫЙ УЗЕЛ: УСТРОЙСТВО ───
function DeviceNode({ data }: NodeProps) {
  const item = data.item as PanelItem
  if (!item) return null
  const w = item.modules * MOD_W
  const c = devColor(item.type)
  const isEq = item.type === 'panel_equipment'

  return (
    <div
      className="relative rounded-sm bg-white overflow-hidden"
      style={{
        width: w,
        height: DEV_H,
        border: '2px solid #d0d0d0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* Handle сверху (принимает L/N/PE) */}
      <Handle type="target" position={Position.Top} id="top"
        className="!w-3 !h-3 !border-2 !border-gray-400 !bg-gray-300 !-top-1.5"
      />

      {/* Цветная полоса слева */}
      <div className={`absolute left-0 top-0 bottom-0 w-2 ${c.stripe}`} />

      {/* Тело */}
      <div className="absolute inset-x-0 top-3 bottom-3 flex flex-col items-center justify-center">
        {isEq ? (
          <>
            <span className="text-[11px] font-bold text-gray-500 text-center leading-tight px-1">{item.label}</span>
            <span className="text-[8px] text-gray-400">{item.sublabel}</span>
          </>
        ) : (
          <>
            <span className={`text-[17px] font-bold leading-none ${c.text}`}>{item.rating}{item.rating > 0 ? 'A' : ''}</span>
            {item.character && <span className="text-[12px] font-bold text-gray-400 leading-none">{item.character}</span>}
            <span className={`text-[9px] font-extrabold leading-none mt-0.5 ${c.text} opacity-60 tracking-wider`}>{c.label}</span>
            {(item.type === 'rcd' || item.type === 'diff_breaker') && (
              <span className="text-[7px] text-gray-400 leading-none mt-0.5">{item.sublabel}</span>
            )}
          </>
        )}
      </div>

      {/* Реф */}
      <span className="absolute top-0.5 right-1.5 text-[9px] font-mono text-gray-400 font-bold">{item.ref}</span>
      {item.phase && <span className="absolute top-0.5 left-3 text-[7px] font-mono text-gray-400">{item.phase}</span>}

      {/* Handle снизу (выход к нагрузке) */}
      {!isEq && (
        <Handle type="source" position={Position.Bottom} id="out"
          className="!w-3 !h-3 !border-2 !border-gray-400 !bg-gray-300 !-bottom-1.5"
        />
      )}
    </div>
  )
}

// ─── КАСТОМНЫЙ УЗЕЛ: ШИНА ───
function BusNode({ data }: NodeProps) {
  const info = data.busInfo as { color: string; label: string; width: number; devices: { id: string; cx: number; connected: boolean }[] } | undefined
  if (!info) return null

  return (
    <div className="relative rounded-full flex items-center" style={{ width: info.width, height: BUS_H, background: info.color, opacity: 0.95 }}>
      <span className="text-[9px] font-bold text-white ml-2 mr-2">{info.label}</span>
      {info.devices.map((d, i) => (
        d.connected && (
          <Handle
            key={i}
            type="source"
            position={Position.Bottom}
            id={d.id}
            className="!w-2 !h-2 !border-2 !bg-white !-bottom-1"
            style={{ position: 'absolute', left: d.cx }}
          />
        )
      ))}
    </div>
  )
}

// ─── КАСТОМНЫЙ УЗЕЛ: МЕТКА НАГРУЗКИ ───
function LoadLabelNode({ data }: NodeProps) {
  const lbl = data.label as string
  return (
    <div className="flex flex-col items-center justify-center" style={{ width: DEV_W(2), height: 36 }}>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !border !border-gray-400 !bg-gray-200 !-top-1" />
      <span className="text-[9px] font-semibold text-gray-600 text-center leading-tight mt-1">{lbl}</span>
      <span className="text-[7px] text-gray-400">L·N·PE 3×2.5</span>
    </div>
  )
}

// ─── КАСТОМНЫЙ УЗЕЛ: ВВОДНОЙ КАБЕЛЬ ───
function InputCableNode({ data }: NodeProps) {
  return (
    <div className="flex flex-col items-center" style={{ width: 80, height: 60 }}>
      <span className="text-[11px] font-bold text-gray-600">~220В</span>
      <div className="flex flex-col items-center mt-1" style={{ width: 20 }}>
        <div className="w-full h-3 bg-gray-500 rounded-t-sm" />
        <div className="flex justify-between px-0.5" style={{ width: 20 }}>
          <div className="w-1.5 h-10 rounded-b-sm bg-[#e74c3c]" />
          <div className="w-1.5 h-8 rounded-b-sm bg-[#3498db]" />
          <div className="w-1.5 h-6 rounded-b-sm bg-[#27ae60]" />
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="L" className="!w-2 !h-2 !bg-red-500 !-bottom-1" />
      <Handle type="source" position={Position.Bottom} id="N" className="!w-2 !h-2 !bg-blue-500 !-bottom-1" style={{ left: '55%' }} />
      <Handle type="source" position={Position.Bottom} id="PE" className="!w-2 !h-2 !bg-green-500 !-bottom-1" style={{ left: '70%' }} />
    </div>
  )
}

const nodeTypes = { device: DeviceNode, bus: BusNode, load: LoadLabelNode, input: InputCableNode }

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

  // Строим ряды
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

  // Строим узлы и рёбра
  const { nodes, edges } = useMemo(() => {
    const ns: Node[] = []
    const es: Edge[] = []
    const X_MARGIN = 20

    rows.forEach((row, ri) => {
      const totalWidth = row.reduce((s, it) => s + it.modules, 0) * MOD_W
      const rowY = ri * (DEV_H + ROW_GAP)
      const busPE_Y = rowY - 70
      const busN_Y = rowY - 56
      const busL_Y = rowY - 42
      const devY = rowY
      const loadY = rowY + DEV_H + 16

      // Вводной кабель (первый ряд)
      if (ri === 0) {
        ns.push({
          id: 'input-cable',
          type: 'input',
          position: { x: X_MARGIN + totalWidth / 2 - 40, y: rowY - 130 },
          data: {},
          draggable: false,
        })
      }

      // Вычисляем центры устройств
      let curX = 0
      const devCenters: { id: string; cx: number; w: number }[] = []
      for (const it of row) {
        const w = it.modules * MOD_W
        devCenters.push({ id: it.id, cx: curX + w / 2, w })
        curX += w
      }

      // Ищем RCD/дифы (родительские узлы с protectedGroupIds)
      const parents = row.filter(it => it.protectedGroupIds.length > 0)

      // PE шина (все устройства)
      ns.push({
        id: `bus-pe-${ri}`,
        type: 'bus',
        position: { x: X_MARGIN, y: busPE_Y },
        data: { busInfo: { color: '#27ae60', label: 'PE', width: totalWidth, devices: devCenters.map(dc => ({ ...dc, connected: row.find(r => r.id === dc.id)?.type !== 'panel_equipment' })) } },
        draggable: false, selectable: false,
        style: { width: totalWidth },
      })

      // N шина (только 2P устройства и RCD/дифы)
      ns.push({
        id: `bus-n-${ri}`,
        type: 'bus',
        position: { x: X_MARGIN, y: busN_Y },
        data: { busInfo: { color: '#3498db', label: 'N', width: totalWidth, devices: devCenters.map(dc => {
          const it = row.find(r => r.id === dc.id)
          return { ...dc, connected: it ? (it.poles >= 2) : false }
        }) } },
        draggable: false, selectable: false,
        style: { width: totalWidth },
      })

      // L шина — главная (все устройства)
      ns.push({
        id: `bus-l-${ri}`,
        type: 'bus',
        position: { x: X_MARGIN, y: busL_Y },
        data: { busInfo: { color: '#e74c3c', label: 'L', width: totalWidth, devices: devCenters.map(dc => ({ ...dc, connected: true })) } },
        draggable: false, selectable: false,
        style: { width: totalWidth },
      })

      // Устройства
      row.forEach(it => {
        const dc = devCenters.find(d => d.id === it.id)!
        ns.push({
          id: it.id,
          type: 'device',
          position: { x: X_MARGIN + dc.cx - dc.w / 2, y: devY },
          data: { item: it },
          draggable: true,
          style: { width: dc.w, height: DEV_H },
        })
      })

      // Рёбра от шин к устройствам (L)
      row.forEach(it => {
        if (it.type === 'panel_equipment') return
        es.push({
          id: `e-l-${it.id}`,
          source: `bus-l-${ri}`,
          target: it.id,
          sourceHandle: it.id,
          targetHandle: 'top',
          type: 'smoothstep',
          style: { stroke: '#e74c3c', strokeWidth: 2 },
          animated: false,
        })
        // N
        if (it.poles >= 2) {
          es.push({
            id: `e-n-${it.id}`,
            source: `bus-n-${ri}`,
            target: it.id,
            sourceHandle: it.id,
            targetHandle: 'top',
            type: 'smoothstep',
            style: { stroke: '#3498db', strokeWidth: 1.5 },
          })
        }
        // PE
        es.push({
          id: `e-pe-${it.id}`,
          source: `bus-pe-${ri}`,
          target: it.id,
          sourceHandle: it.id,
          targetHandle: 'top',
          type: 'smoothstep',
          style: { stroke: '#27ae60', strokeWidth: 1.5 },
        })

        // Выход к нагрузке
        const loadId = `load-${it.id}`
        const loadName = it.label.length > 18 ? it.label.substring(0, 18) + '…' : it.label

        es.push({
          id: `e-out-${it.id}`,
          source: it.id,
          target: loadId,
          sourceHandle: 'out',
          targetHandle: undefined,
          type: 'smoothstep',
          style: { stroke: '#555', strokeWidth: 2 },
        })

        // Узел нагрузки
        const dc = devCenters.find(d => d.id === it.id)!
        ns.push({
          id: loadId,
          type: 'load',
          position: { x: X_MARGIN + dc.cx - MOD_W, y: loadY },
          data: { label: loadName },
          draggable: false,
          selectable: false,
        })
      })

      // L кабель от ввода к главной L шине (первый ряд)
      if (ri === 0) {
        es.push({
          id: 'e-input-L',
          source: 'input-cable',
          target: `bus-l-0`,
          sourceHandle: 'L',
          type: 'smoothstep',
          style: { stroke: '#e74c3c', strokeWidth: 2.5 },
        })
        es.push({
          id: 'e-input-N',
          source: 'input-cable',
          target: `bus-n-0`,
          sourceHandle: 'N',
          type: 'smoothstep',
          style: { stroke: '#3498db', strokeWidth: 2.5 },
        })
        es.push({
          id: 'e-input-PE',
          source: 'input-cable',
          target: `bus-pe-0`,
          sourceHandle: 'PE',
          type: 'smoothstep',
          style: { stroke: '#27ae60', strokeWidth: 2.5 },
        })
      }
    })

    return { nodes: ns, edges: es }
  }, [rows])

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(nodes)
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(edges)

  useEffect(() => {
    setRfNodes(nodes)
    setRfEdges(edges)
  }, [nodes, edges])

  const handleNodeDragStop = useCallback((_event: unknown, node: Node) => {
    // Находим все device-узлы в том же ряду
    const rowNodes = rfNodes.filter(n => n.type === 'device' && Math.abs(n.position.y - node.position.y) < DEV_H)

    // Сортируем по X
    rowNodes.sort((a, b) => a.position.x - b.position.x)

    // Обновляем порядок items
    const newOrder = rowNodes.map(n => n.id)
    const updated = [...items].sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id))

    if (JSON.stringify(updated.map(i => i.id)) !== JSON.stringify(items.map(i => i.id))) {
      setItems(updated)
      onOrderChange?.(updated.map(i => i.id))
    }
  }, [rfNodes, items, onOrderChange])

  return (
    <div className="flex flex-col items-center gap-4 py-2 select-none">
      <div className="text-center">
        <div className="text-sm font-bold tracking-[0.1em] text-gray-500 bg-gray-200 inline-block px-5 py-1 rounded-sm">
          РАСПРЕДЕЛИТЕЛЬНЫЙ ЩИТ
        </div>
        <div className="text-[11px] text-gray-400 mt-1 font-mono">
          {result.supplyPhases === 3 ? '3 фазы (380В)' : '1 фаза (220В)'} · {items.reduce((s, i) => s + i.modules, 0)} модулей · щит {result.recommendedPanelModules} мест ({result.panelRows} ряда)
        </div>
      </div>

      <div className="relative bg-gray-100 rounded-lg p-4" style={{ border: '3px solid #999', minWidth: 400 }}>
        {/* Корпус */}
        <div className="absolute -left-0.5 top-4 w-2 h-4 rounded-full bg-gray-400 border border-gray-500" />
        <div className="absolute -left-0.5 bottom-4 w-2 h-4 rounded-full bg-gray-400 border border-gray-500" />
        <div className="bg-gray-50 rounded-sm border border-gray-200 overflow-hidden" style={{ width: '100%', minHeight: 200 }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeDragStop={handleNodeDragStop}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              nodesDraggable={true}
              nodesConnectable={false}
              elementsSelectable={true}
              minZoom={0.3}
              maxZoom={1.5}
              deleteKeyCode={null}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#e0e0e0" gap={20} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
        <div className="mt-3 flex gap-4 text-[10px] text-gray-500 font-mono">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />N</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" />PE</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />L</span>
        </div>
      </div>

      <span className="text-[10px] text-gray-400 font-mono">Перетаскивайте устройства для изменения порядка · колёсико — зум</span>
    </div>
  )
}
