import type { WiringScheme } from '@/data/wiring-schemes'
import type { WirePath } from '@/components/schemes/SchemeDiagram'

interface DiagramData {
  source: string
  jbox: string
  devices: { name: string; wires: WirePath[] }[]
}

const WIRES: Record<string, WirePath['kind']> = {
  'L': 'l', 'L(щиток)': 'l', 'фаза': 'l',
  'N': 'n', 'N(щиток)': 'n', 'ноль': 'n',
  'PE': 'pe', 'PE(щиток)': 'pe', 'земля': 'pe',
  'SW': 'sw', 'управляющий': 'sw', 'L(упр)': 'sw',
}

function detectKind(text: string): WirePath['kind'] | null {
  const upper = text.toUpperCase()
  for (const [key, kind] of Object.entries(WIRES)) {
    if (upper.includes(key.toUpperCase())) return kind
  }
  return null
}

function extractDevices(connections: string[]): string[] {
  const names = new Set<string>()
  for (const c of connections) {
    // Extract device names from: "N(щиток) → N(лампа)", "L(щиток) → L(выключатель)", "SW(выключатель) → L(лампа)"
    const matches = c.match(/[→↔]\s*(\w+)\(([^)]+)\)/g)
    if (matches) {
      for (const m of matches) {
        const name = m.replace(/[→↔]\s*\w+\(/, '').replace(')', '').trim()
        if (name && !['щиток', 'щит', 'распредкоробка', 'коробка'].includes(name.toLowerCase())) {
          names.add(name)
        }
      }
    }
    // Also extract from left side: "N(щиток) →", "L(выключатель) →"
    const leftMatch = c.match(/^[^→↔]*\(([^)]+)\)/)
    if (leftMatch) {
      const name = leftMatch[1].trim()
      if (name && !['щиток', 'щит', 'распредкоробка', 'коробка'].includes(name.toLowerCase())) {
        names.add(name)
      }
    }
  }
  return Array.from(names)
}

function getWiresForDevice(connections: string[], deviceName: string): WirePath[] {
  const wires: WirePath[] = []
  const seen = new Set<string>()

  for (const c of connections) {
    // Lines like: "В коробке: N(щиток) → N(лампа)" or "В коробке: SW(выключатель) → L(лампа)"
    // We want wires going TO this device
    const toMatch = c.match(new RegExp(`→\\s*(\\w+)\\(${deviceName}\\)`, 'i'))
    if (toMatch) {
      const kind = detectKind(toMatch[1])
      if (kind && !seen.has(kind)) {
        seen.add(kind)
        wires.push({ kind, from: 'Распредкоробка', to: deviceName })
      }
    }

    // Also get wires FROM this device
    const fromMatch = c.match(new RegExp(`(\\w+)\\(${deviceName}\\)\\s*→`, 'i'))
    if (fromMatch) {
      const kind = detectKind(fromMatch[1])
      if (kind && !seen.has(kind)) {
        seen.add(kind)
        wires.push({ kind, from: deviceName, to: 'Распредкоробка' })
      }
    }

    // Arrow from device: "Между выключателем и лампой: SW(выключатель) → L(лампа)"
    const midFrom = c.match(new RegExp(`(\\w+)\\(${deviceName}\\)`, 'i'))
    if (midFrom && !c.match(new RegExp(`→\\s*\\w+\\(${deviceName}\\)`, 'i'))) {
      const kind = detectKind(midFrom[1])
      if (kind && !seen.has(kind)) {
        seen.add(kind)
        wires.push({ kind, from: deviceName, to: 'Распредкоробка' })
      }
    }
  }

  return wires
}

export function buildDiagramData(scheme: WiringScheme): DiagramData {
  const deviceNames = extractDevices(scheme.connections)

  // Collect wires from source (щиток) to junction box
  const sourceWires: WirePath['kind'][] = []
  for (const c of scheme.connections) {
    if (c.includes('щиток') || c.includes('щит')) {
      const kind = detectKind(c)
      if (kind && !sourceWires.includes(kind)) {
        sourceWires.push(kind)
      }
    }
  }

  // Default: L, N, PE from source
  if (sourceWires.length === 0) {
    sourceWires.push('l', 'n', 'pe')
  }

  const devices = deviceNames.map(name => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    wires: getWiresForDevice(scheme.connections, name),
  }))

  // If no devices detected, create generic ones from cableInfo
  if (devices.length === 0) {
    const dList = scheme.devices.split(',').map(s => s.trim()).filter(Boolean)
    for (const d of dList) {
      if (!['щиток', 'щит', 'распредкоробка'].includes(d.toLowerCase())) {
        devices.push({
          name: d,
          wires: sourceWires.map(k => ({ kind: k, from: 'Распредкоробка', to: d })),
        })
      }
    }
  }

  return {
    source: 'Щиток',
    jbox: 'Распредкоробка',
    devices,
  }
}
