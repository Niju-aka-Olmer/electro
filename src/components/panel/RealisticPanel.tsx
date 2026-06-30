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
  BackgroundVariant,
  type NodeProps,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { CalculationResult, CircuitBreaker, RCD, PhaseId } from '@/types/electrical'

// ─── КОНСТАНТЫ (крупнее) ───
const MOD_W = 80
const DEV_H = 88
const BUS_H = 8
const ROW_GAP = 320

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
function devColor(type: string): { stripe: string; text: string; label: string } {
  switch (type) {
    case 'main_breaker':     return { stripe: 'bg-red-500',    text: 'text-red-700',    label: 'ВВОД' }
    case 'load_break_switch':return { stripe: 'bg-orange-500', text: 'text-orange-700', label: 'РУБ' }
    case 'rcd':              return { stripe: 'bg-blue-400',   text: 'text-blue-700',   label: 'УЗО' }
    case 'diff_breaker':     return { stripe: 'bg-cyan-500',   text: 'text-cyan-700',   label: 'ДИФ' }
    case 'panel_equipment':  return { stripe: 'bg-gray-300',   text: 'text-gray-500',   label: 'ОБ' }
    default:                 return { stripe: 'bg-gray-400',   text: 'text-gray-700',   label: 'АВ' }
  }
}

// ─── КАСТОМНЫЙ УЗЕЛ: УСТРОЙСТВО ───
function DeviceNode({ data }: NodeProps) {
  const item = data.item as PanelItem
  if (!item) return null
  const w = item.modules * MOD_W
  const c = devColor(item.type)
  const isEq = item.type === 'panel_equipment'

  // Позиции хендлов: L слева, N центр, PE справа
  const handlePositions = {
    L: { left: '25%' },
    N: { left: '50%' },
    PE: { left: '75%' },
  }

  return (
    <div
      className="relative rounded-sm bg-white overflow-hidden"
      style={{ width: w, height: DEV_H, border: '2px solid #d0d0d0', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
    >
      {/* Три отдельных хендла сверху — L/N/PE не сливаются */}
      {!isEq && (
        <>
          <Handle type="target" position={Position.Top} id="L"
            className="!w-3 !h-3 !border-2 !border-red-300 !bg-red-100 !-top-1.5"
            style={{ left: handlePositions.L.left }}
          />
          <Handle type="target" position={Position.Top} id="N"
            className="!w-3 !h-3 !border-2 !border-blue-300 !bg-blue-100 !-top-1.5"
            style={{ left: handlePositions.N.left }}
          />
          <Handle type="target" position={Position.Top} id="PE"
            className="!w-3 !h-3 !border-2 !border-green-300 !bg-green-100 !-top-1.5"
            style={{ left: handlePositions.PE.left }}
          />
        </>
      )}
      {isEq && (
        <Handle type="target" position={Position.Top} id="top"
          className="!w-3 !h-3 !border-2 !border-gray-300 !bg-gray-100 !-top-1.5"
        />
      )}

      {/* Цветная полоса слева */}
      <div className={`absolute left-0 top-0 bottom-0 w-2.5 ${c.stripe}`} />

      {/* Тело */}
      <div className="absolute inset-x-0 top-3 bottom-3 flex flex-col items-center justify-center">
        {isEq ? (
          <>
            <span className="text-[12px] font-bold text-gray-500 text-center leading-tight px-2">{item.label}</span>
            <span className="text-[9px] text-gray-400">{item.sublabel}</span>
          </>
        ) : (
          <>
            <span className={`text-[19px] font-bold leading-none ${c.text}`}>{item.rating}{item.rating > 0 ? 'A' : ''}</span>
            {item.character && <span className="text-[13px] font-bold text-gray-400 leading-none">{item.character}</span>}
            <span className={`text-[10px] font-extrabold leading-none mt-0.5 ${c.text} opacity-60 tracking-wider`}>{c.label}</span>
            {(item.type === 'rcd' || item.type === 'diff_breaker') && (
              <span className="text-[8px] text-gray-400 leading-none mt-0.5">{item.sublabel}</span>
            )}
          </>
        )}
      </div>

      {/* Реф */}
      <span className="absolute top-1 right-2 text-[10px] font-mono text-gray-400 font-bold">{item.ref}</span>
      {item.phase && <span className="absolute top-1 left-3.5 text-[8px] font-mono text-gray-400">{item.phase}</span>}

      {/* Хендл снизу — выход к нагрузке */}
      {!isEq && (
        <Handle type="source" position={Position.Bottom} id="out"
          className="!w-3 !h-3 !border-2 !border-gray-400 !bg-gray-300 !-bottom-1.5"
        />
      )}
    </div>
  )
}

// ─── КАСТОМНЫЙ УЗЕЛ: ШИНА (чисто визуальная) ───
function BusNode({ data }: NodeProps) {
  const info = data.busInfo as { color: string; label: string; width: number }
  return (
    <div
      className="relative rounded-full flex items-center overflow-visible"
      style={{ width: info.width, height: BUS_H, background: info.color, opacity: 0.95 }}
    >
      <span className="text-[10px] font-bold text-white ml-2 mr-2">{info.label}</span>
      {/* Шина имеет хендлы снизу — по одному на каждый отвод */}
      {((data as any).handles as { id: string; left: number }[] | undefined)?.map(h => (
        <Handle key={h.id} type="source" position={Position.Bottom} id={h.id}
          className="!w-2 !h-2 !border-2 !bg-white !-bottom-1"
          style={{ position: 'absolute', left: h.left }}
        />
      ))}
    </div>
  )
}

// ─── КАСТОМНЫЙ УЗЕЛ: МЕТКА НАГРУЗКИ ───
function LoadLabelNode({ data }: NodeProps) {
  const lbl = data.label as string
  return (
    <div className="flex flex-col items-center justify-center" style={{ width: MOD_W * 2.5, height: 40 }}>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !border !border-gray-400 !bg-gray-200 !-top-1" />
      <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight mt-1">{lbl}</span>
      <span className="text-[8px] text-gray-400">L·N·PE 3×2.5</span>
    </div>
  )
}

// ─── КАСТОМНЫЙ УЗЕЛ: ВВОДНОЙ КАБЕЛЬ ───
function InputCableNode({ data }: NodeProps) {
  return (
    <div className="flex flex-col items-center" style={{ width: 100, height: 70 }}>
      <span className="text-[13px] font-bold text-gray-600">~220В</span>
      <div className="flex flex-col items-center mt-1" style={{ width: 24 }}>
        <div className="w-full h-4 bg-gray-500 rounded-t-sm" />
        <div className="flex justify-between px-1" style={{ width: 24 }}>
          <div className="w-2 h-14 rounded-b-sm bg-[#e74c3c]" />
          <div className="w-2 h-11 rounded-b-sm bg-[#3498db]" />
          <div className="w-2 h-8 rounded-b-sm bg-[#27ae60]" />
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="L"  className="!w-3 !h-3 !bg-red-500 !-bottom-1.5 !border-2 !border-red-300" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="N"  className="!w-3 !h-3 !bg-blue-500 !-bottom-1.5 !border-2 !border-blue-300" style={{ left: '50%' }} />
      <Handle type="source" position={Position.Bottom} id="PE" className="!w-3 !h-3 !bg-green-500 !-bottom-1.5 !border-2 !border-green-300" style={{ left: '70%' }} />
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

  const rows = useMemo(() => {
    const r: PanelItem[][] = []
    let cr: PanelItem[] = []
    let cm = 0
    for (const it of items) {
      if (cm + it.modules > 12 && cr.length > 0) { r.push(cr); cr = []; cm = 0 }
      cr.push(it); cm += it.modules
    }
    if (cr.length > 0) r.push(cr)
    return r
  }, [items])

  const { nodes, edges } = useMemo(() => {
    const ns: Node[] = []
    const es: Edge[] = []
    const M = 24 // margin

    rows.forEach((row, ri) => {
      const totalW = row.reduce((s, it) => s + it.modules, 0) * MOD_W
      const rowY = ri * (DEV_H + ROW_GAP)
      const busPE_Y = rowY - 85
      const busN_Y  = rowY - 63
      const busL_Y  = rowY - 41
      const loadY   = rowY + DEV_H + 20

      // Вводной кабель (первый ряд)
      if (ri === 0) {
        ns.push({
          id: 'input-cable', type: 'input',
          position: { x: M + totalW / 2 - 50, y: rowY - 175 },
          data: {}, draggable: false,
        })
      }

      // Центры устройств
      let curX = 0
      const dcs: { id: string; cx: number; w: number }[] = []
      for (const it of row) {
        const w = it.modules * MOD_W
        dcs.push({ id: it.id, cx: curX + w / 2, w })
        curX += w
      }

      // Хендлы на шинах — позиции отводов
      const busHandles = dcs.filter(dc => {
        const it = row.find(r => r.id === dc.id)!
        return it.type !== 'panel_equipment'
      }).map(dc => ({ id: dc.id, left: dc.cx }))

      // PE шина
      ns.push({
        id: `bus-pe-${ri}`, type: 'bus',
        position: { x: M, y: busPE_Y },
        data: { busInfo: { color: '#27ae60', label: 'PE', width: totalW }, handles: busHandles },
        draggable: false, selectable: false,
        style: { width: totalW },
      })

      // N шина (только 2P+ устройства)
      const nHandles = dcs.filter(dc => {
        const it = row.find(r => r.id === dc.id)!
        return it.type !== 'panel_equipment' && it.poles >= 2
      }).map(dc => ({ id: dc.id, left: dc.cx }))
      ns.push({
        id: `bus-n-${ri}`, type: 'bus',
        position: { x: M, y: busN_Y },
        data: { busInfo: { color: '#3498db', label: 'N', width: totalW }, handles: nHandles },
        draggable: false, selectable: false,
        style: { width: totalW },
      })

      // L шина (все)
      const lHandles = dcs.filter(dc => {
        const it = row.find(r => r.id === dc.id)!
        return it.type !== 'panel_equipment'
      }).map(dc => ({ id: dc.id, left: dc.cx }))
      ns.push({
        id: `bus-l-${ri}`, type: 'bus',
        position: { x: M, y: busL_Y },
        data: { busInfo: { color: '#e74c3c', label: 'L', width: totalW }, handles: lHandles },
        draggable: false, selectable: false,
        style: { width: totalW },
      })

      // Устройства
      row.forEach(it => {
        const dc = dcs.find(d => d.id === it.id)!
        ns.push({
          id: it.id, type: 'device',
          position: { x: M + dc.cx - dc.w / 2, y: rowY },
          data: { item: it },
          draggable: true,
          style: { width: dc.w, height: DEV_H },
        })
      })

      // Рёбра: шина → устройство (L/N/PE раздельно)
      row.forEach(it => {
        if (it.type === 'panel_equipment') return

        es.push({
          id: `e-l-${it.id}`, source: `bus-l-${ri}`, target: it.id,
          sourceHandle: it.id, targetHandle: 'L',
          type: 'smoothstep',
          style: { stroke: '#e74c3c', strokeWidth: 2.5 },
        })

        if (it.poles >= 2) {
          es.push({
            id: `e-n-${it.id}`, source: `bus-n-${ri}`, target: it.id,
            sourceHandle: it.id, targetHandle: 'N',
            type: 'smoothstep',
            style: { stroke: '#3498db', strokeWidth: 2 },
          })
        }

        es.push({
          id: `e-pe-${it.id}`, source: `bus-pe-${ri}`, target: it.id,
          sourceHandle: it.id, targetHandle: 'PE',
          type: 'smoothstep',
          style: { stroke: '#27ae60', strokeWidth: 2 },
        })

        // Выход к нагрузке
        const lid = `load-${it.id}`
        const lname = it.label.length > 18 ? it.label.substring(0, 18) + '…' : it.label
        es.push({
          id: `e-out-${it.id}`, source: it.id, target: lid,
          sourceHandle: 'out', type: 'smoothstep',
          style: { stroke: '#555', strokeWidth: 2.5 },
        })

        const dc = dcs.find(d => d.id === it.id)!
        ns.push({
          id: lid, type: 'load',
          position: { x: M + dc.cx - MOD_W * 1.25, y: loadY },
          data: { label: lname },
          draggable: false, selectable: false,
        })
      })

      // Вводной кабель → шины
      if (ri === 0) {
        es.push({ id: 'e-in-L',  source: 'input-cable', target: 'bus-l-0',  sourceHandle: 'L',  type: 'smoothstep', style: { stroke: '#e74c3c', strokeWidth: 3 } })
        es.push({ id: 'e-in-N',  source: 'input-cable', target: 'bus-n-0',  sourceHandle: 'N',  type: 'smoothstep', style: { stroke: '#3498db', strokeWidth: 3 } })
        es.push({ id: 'e-in-PE', source: 'input-cable', target: 'bus-pe-0', sourceHandle: 'PE', type: 'smoothstep', style: { stroke: '#27ae60', strokeWidth: 3 } })
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
    const rowNodes = rfNodes.filter(n => n.type === 'device' && Math.abs(n.position.y - node.position.y) < DEV_H * 2)
    rowNodes.sort((a, b) => a.position.x - b.position.x)
    const newOrder = rowNodes.map(n => n.id)
    const updated = [...items].sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id))
    if (JSON.stringify(updated.map(i => i.id)) !== JSON.stringify(items.map(i => i.id))) {
      setItems(updated)
      onOrderChange?.(updated.map(i => i.id))
    }
  }, [rfNodes, items, onOrderChange])

  return (
    <div className="flex flex-col items-center gap-4 py-2 select-none print:w-full">
      <div className="text-center no-print">
        <div className="text-sm font-bold tracking-[0.1em] text-gray-500 bg-gray-200 inline-block px-5 py-1 rounded-sm">
          РАСПРЕДЕЛИТЕЛЬНЫЙ ЩИТ
        </div>
        <div className="text-[11px] text-gray-400 mt-1 font-mono">
          {result.supplyPhases === 3 ? '3 фазы (380В)' : '1 фаза (220В)'} · {items.reduce((s, i) => s + i.modules, 0)} модулей · щит {result.recommendedPanelModules} мест ({result.panelRows} ряда)
        </div>
      </div>

      <div className="relative bg-gray-100 rounded-lg p-4 print:border-0 print:bg-white" style={{ border: '3px solid #999', width: '100%', maxWidth: 1100 }}>
        {/* Петли корпуса */}
        <div className="absolute -left-0.5 top-4 w-2 h-4 rounded-full bg-gray-400 border border-gray-500 no-print" />
        <div className="absolute -left-0.5 bottom-4 w-2 h-4 rounded-full bg-gray-400 border border-gray-500 no-print" />

        <div className="bg-gray-50 rounded-sm border border-gray-200 overflow-hidden" style={{ width: '100%', height: Math.max(500, rows.length * (DEV_H + ROW_GAP) + 120) }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeDragStop={handleNodeDragStop}
              nodeTypes={nodeTypes}
              defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
              nodesDraggable={true}
              nodesConnectable={false}
              elementsSelectable={true}
              minZoom={0.2}
              maxZoom={2}
              deleteKeyCode={null}
              proOptions={{ hideAttribution: true }}
              fitView={false}
            >
              <Background variant={BackgroundVariant.Dots} color="#ccc" gap={30} size={1.5} />
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

      <span className="text-[10px] text-gray-400 font-mono no-print">Перетаскивайте устройства для изменения порядка · колёсико — зум</span>
    </div>
  )
}
