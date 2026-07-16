import type { WiringScheme } from '@/data/wiring-schemes'
import type { WagoGroup } from '@/components/schemes/SchemeDiagram'

const KIND_MAP: Record<string, WagoGroup['kind']> = {
  'L': 'l', 'N': 'n', 'PE': 'pe', 'SW': 'sw',
}

function detectKind(label: string): WagoGroup['kind'] | null {
  // label is like "L", "N", "PE", "SW", "L(щиток)", "L(лампа)", "SW(выключатель)", etc.
  const clean = label.replace(/\(.*\)/, '').trim().toUpperCase()
  return KIND_MAP[clean] || null
}

// "N(щиток)" → "Щиток"
function extractDevice(text: string): string {
  const match = text.match(/\(([^)]+)\)/)
  if (!match) return text.trim()
  const name = match[1].trim()
  const nameMap: Record<string, string> = {
    'щиток': 'Щиток', 'щит': 'Щиток',
    'лампа': 'Лампа', 'светильник': 'Лампа',
    'выключатель': 'Выкл.', 'выключатель 1': 'Выкл.1', 'выключатель 2': 'Выкл.2',
    'выключатель 3': 'Выкл.3',
    'переключатель': 'Перекл.', 'переключатель 1': 'Перекл.1', 'переключатель 2': 'Перекл.2',
  }
  return nameMap[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1)
}

export function buildWagoGroups(scheme: WiringScheme): WagoGroup[] {
  const groups: WagoGroup[] = []

  for (const c of scheme.connections) {
    // Parse: "В коробке: N(щиток) → N(лампа)"
    // Or: "Между выключателем и лампой: SW → L"
    // Or: "В коробке: SW(выключатель) → L(лампа)"

    // Extract the part after the scope prefix
    let body = c
    body = body.replace(/^В коробке:\s*/i, '')
    body = body.replace(/^Между [^:]+:\s*/i, '')

    // Split by arrows
    const parts = body.split(/[→↔]/).map(p => p.trim()).filter(Boolean)
    if (parts.length < 2) continue

    // Parse each side
    // Left side: "N(щиток)" or "L"
    const leftParts = parts[0].split(/\s+/)
    const rightParts = parts[parts.length - 1].split(/\s+/)

    // For simple case: "N(щиток) → N(лампа)"
    const leftKind = detectKind(leftParts[0] || '')
    const rightKind = detectKind(rightParts[0] || '')

    if (!leftKind) continue

    const from = extractDevice(leftParts[0] || '')
    // Use right side's device name, but left side's wire color (kind)
    const to = rightParts.length > 0 ? extractDevice(rightParts[0] || '') : ''
    const kind = leftKind

    if (from && to) {
      groups.push({ kind, from, to })
    }
  }

  return groups
}
