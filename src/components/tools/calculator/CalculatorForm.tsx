'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useCalculatorStore } from '@/store/calculatorStore'
import type { RoomConfig, RoomType } from '@/types/electrical'
import { cn } from '@/lib/utils'

const GROUNDING_INFO: Record<string, { label: string; desc: string; when: string; risk?: string }> = {
  'TN-C-S': {
    label: 'TN-C-S',
    desc: 'Современная система: PEN-проводник разделяется на N (ноль) и PE (земля) прямо в щитке. Это стандарт для новостроек и капремонта.',
    when: 'Новостройки, капремонт, частные дома с контуром заземления',
  },
  'TN-C': {
    label: 'TN-C (старый фонд)',
    desc: 'Старая система: N и PE объединены в один провод (PEN) по всей длине. В квартирах старого фонда — без модернизации щитка.',
    when: 'Хрущёвки, старый жилфонд (1960-90гг), где нет отдельного PE',
    risk: '⚠️ Требует реконструкции щитка для установки УЗО. Рекомендуется переход на TN-C-S при капремонте.',
  },
  'TN-S': {
    label: 'TN-S (редко)',
    desc: 'N и PE разделены от подстанции до розетки. Самая безопасная система, но встречается редко — требует 5-жильного кабеля от ТП.',
    when: 'Новые коттеджи, элитные ЖК с 5-жильным вводом',
  },
  'TT': {
    label: 'TT (частные дома)',
    desc: 'N от подстанции, PE — от собственного контура заземления (штыри в земле). Обязателен для домов без качественной линии TN.',
    when: 'Старые частные дома, СНТ, дачи — где нет PEN проводника',
    risk: '⚠️ Обязательно УЗО 300мА на вводе! Без контура заземления — опасно для жизни.',
  },
}

const ROOM_TYPES: { value: RoomType; label: string; icon: string }[] = [
  { value: 'living', label: 'Гостиная', icon: '🛋️' },
  { value: 'bedroom', label: 'Спальня', icon: '🛏️' },
  { value: 'kitchen', label: 'Кухня', icon: '🍳' },
  { value: 'bathroom', label: 'Ванная', icon: '🚿' },
  { value: 'toilet', label: 'Туалет', icon: '🚽' },
  { value: 'hallway', label: 'Коридор', icon: '🚪' },
  { value: 'balcony', label: 'Балкон', icon: '🌿' },
  { value: 'garage', label: 'Гараж', icon: '🔧' },
  { value: 'custom', label: 'Другое', icon: '📌' },
]

const SPECIAL_LOADS = [
  { value: 'cooktop', label: 'Варочная поверхность', typicalW: 7000 },
  { value: 'oven', label: 'Духовой шкаф', typicalW: 3500 },
  { value: 'washer', label: 'Стиральная машина', typicalW: 2500 },
  { value: 'dishwasher', label: 'Посудомоечная машина', typicalW: 2200 },
  { value: 'ac', label: 'Кондиционер', typicalW: 2500 },
  { value: 'boiler', label: 'Водонагреватель', typicalW: 2000 },
  { value: 'electric_floor', label: 'Тёплый пол', typicalW: 1000 },
]

/** Popover с пояснением для систем заземления */
const GroundingInfoPopover = () => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-text-muted text-[10px] text-text-muted hover:border-accent-amber hover:text-accent-amber transition-colors"
        title="Подробнее о системах заземления"
      >
        i
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-50 w-80 rounded-xl border border-border bg-bg-elevated p-4 shadow-2xl">
          <h4 className="mb-3 text-sm font-semibold text-accent-amber">Системы заземления</h4>
          <div className="space-y-3">
            {Object.values(GROUNDING_INFO).map(info => (
              <div key={info.label} className="text-xs leading-relaxed">
                <div className="font-medium text-text-primary">{info.label}</div>
                <div className="mt-0.5 text-text-secondary">{info.desc}</div>
                <div className="mt-0.5 text-text-muted italic">✓ {info.when}</div>
                {info.risk && (
                  <div className="mt-0.5 text-accent-danger">{info.risk}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface RoomFormProps {
  room?: RoomConfig
  onSave: (room: RoomConfig) => void
  onCancel: () => void
}

function RoomForm({ room, onSave, onCancel }: RoomFormProps) {
  const [type, setType] = useState<RoomType>(room?.type ?? 'living')
  const [name, setName] = useState(room?.name ?? '')
  const [socketGroups, setSocketGroups] = useState(room?.socketGroups ?? 2)
  const [lightingPoints, setLightingPoints] = useState(room?.lightingPoints ?? 2)
  const [loads, setLoads] = useState<
    { id: string; name: string; powerW: number; currentA: number; isHighLoad: boolean; hasSeparateGroup: boolean }[]
  >(room?.loads ?? [])

  const selectedRoom = ROOM_TYPES.find(r => r.value === type)

  const toggleLoad = (loadId: string) => {
    const load = SPECIAL_LOADS.find(l => l.value === loadId)
    if (!load) return

    setLoads(prev => {
      const exists = prev.find(l => l.id === loadId)
      if (exists) return prev.filter(l => l.id !== loadId)
      const currentA = +(load.typicalW / 220).toFixed(1)
      return [
        ...prev,
        {
          id: loadId,
          name: load.label,
          powerW: load.typicalW,
          currentA,
          isHighLoad: load.typicalW >= 2000,
          hasSeparateGroup: true,
        },
      ]
    })
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      id: room?.id ?? crypto.randomUUID(),
      type,
      name: name.trim(),
      socketGroups,
      lightingPoints,
      loads,
      requiresRCD: type === 'bathroom' || type === 'toilet',
    })
  }

  return (
    <div className="space-y-5">
      {/* Тип помещения */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">Тип помещения</label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {ROOM_TYPES.map(rt => (
            <button
              key={rt.value}
              onClick={() => { setType(rt.value); setName(rt.label) }}
              className={cn(
                'rounded-lg border p-2 text-center text-xs transition-all',
                type === rt.value
                  ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                  : 'border-border bg-bg-elevated text-text-secondary hover:border-border-accent'
              )}
            >
              <div className="mb-1 text-lg">{rt.icon}</div>
              {rt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Название */}
      <div>
        <label className="mb-1 block text-sm text-text-secondary">Название</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-amber"
          placeholder="Гостиная 18м²"
        />
      </div>

      {/* Параметры */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-text-secondary">Розеточные группы</label>
          <input
            type="number"
            min={0}
            max={10}
            value={socketGroups}
            onChange={e => setSocketGroups(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-amber"
          />
          <p className="mt-0.5 text-[11px] text-text-muted">
            Обычно 1-3 группы на комнату
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-secondary">Точки освещения</label>
          <input
            type="number"
            min={0}
            max={20}
            value={lightingPoints}
            onChange={e => setLightingPoints(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-amber"
          />
          <p className="mt-0.5 text-[11px] text-text-muted">
            1 точка = 1 выключатель + лампа
          </p>
        </div>
      </div>

      {/* Спецнагрузки */}
      <div>
        <label className="mb-2 block text-sm text-text-secondary">
          Мощные потребители (отдельная группа)
        </label>
        <div className="flex flex-wrap gap-2">
          {SPECIAL_LOADS.map(load => (
            <button
              key={load.value}
              onClick={() => toggleLoad(load.value)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs transition-all',
                loads.find(l => l.id === load.value)
                  ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                  : 'border-border bg-bg-elevated text-text-secondary hover:border-border-accent'
              )}
            >
              {load.label} ({load.typicalW / 1000}кВт)
            </button>
          ))}
        </div>
      </div>

      {type === 'bathroom' || type === 'toilet' ? (
        <div className="rounded-lg border border-accent-amber/30 bg-accent-amber/5 p-3 text-xs text-text-secondary">
          ⚡ Для влажных помещений будет применено УЗО 10мА (ПУЭ 7.1.83)
        </div>
      ) : null}

      {/* Кнопки */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="rounded-lg bg-accent-amber px-5 py-2 text-sm font-semibold text-bg-base transition-all hover:shadow-amber disabled:opacity-50"
        >
          {room ? 'Сохранить' : 'Добавить помещение'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-border px-5 py-2 text-sm text-text-secondary transition-all hover:border-border-accent"
        >
          Отмена
        </button>
      </div>
    </div>
  )
}

export default function CalculatorForm() {
  const { input, addRoom, removeRoom, updateRoom, setInput, calculate } =
    useCalculatorStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const existingRooms = input.rooms ?? []

  const handleAddRoom = (room: RoomConfig) => {
    if (editingId) {
      updateRoom(editingId, room)
      setEditingId(null)
    } else {
      addRoom(room)
    }
    setShowForm(false)
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* ШАГ 1: Параметры квартиры */}
      <section className="mb-10">
        <h2 className="mb-1 text-lg font-semibold font-display text-accent-amber">
          Шаг 1. Параметры подключения
        </h2>
        <p className="mb-6 text-sm text-text-muted">
          Укажите общие параметры электроустановки. Это влияет на выбор вводного автомата.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Тип установки</label>
            <select
              value={input.installationType}
              onChange={e => setInput({ installationType: e.target.value as 'apartment' | 'house' })}
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-amber"
            >
              <option value="apartment">Квартира</option>
              <option value="house">Частный дом</option>
            </select>
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm text-text-secondary">
              Система заземления
              <GroundingInfoPopover />
            </label>
            <select
              value={input.grounding}
              onChange={e => setInput({ grounding: e.target.value as any })}
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-amber"
            >
              <option value="TN-C-S">TN-C-S (рекомендуется)</option>
              <option value="TN-C">TN-C (старый фонд)</option>
              <option value="TN-S">TN-S (редко)</option>
              <option value="TT">TT (частные дома)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Фазы</label>
            <select
              value={input.supplyPhases}
              onChange={e => setInput({ supplyPhases: Number(e.target.value) as 1 | 3 })}
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-amber"
            >
              <option value={1}>1 фаза (220В)</option>
              <option value={3}>3 фазы (380В)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Вводной автомат (А)</label>
            <select
              value={input.meterAmps}
              onChange={e => setInput({ meterAmps: Number(e.target.value) as any })}
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-amber"
            >
              <option value={25}>25 А (5.5 кВт)</option>
              <option value={32}>32 А (7 кВт)</option>
              <option value={40}>40 А (8.8 кВт)</option>
              <option value={50}>50 А (11 кВт)</option>
              <option value={63}>63 А (13.9 кВт)</option>
            </select>
          </div>
        </div>
      </section>

      {/* ШАГ 2: Помещения */}
      <section className="mb-10">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold font-display text-accent-amber">
            Шаг 2. Добавьте помещения
          </h2>
          <button
            onClick={() => { setShowForm(true); setEditingId(null) }}
            className="rounded-lg border border-accent-amber/50 px-4 py-1.5 text-xs font-medium text-accent-amber transition-all hover:bg-accent-amber/10"
          >
            + Добавить комнату
          </button>
        </div>
        <p className="mb-6 text-sm text-text-muted">
          Добавьте каждое помещение. Укажите количество розеток, точек света и мощные приборы.
          Калькулятор подберёт автоматы, УЗО и размер щитка.
        </p>

        {existingRooms.length === 0 && !showForm && (
          <div className="rounded-xl border border-dashed border-border bg-bg-elevated p-8 text-center text-sm text-text-muted">
            Нажмите «+ Добавить комнату» и опишите первое помещение.
            <br />
            Например: <strong>Кухня</strong> — 3 розетки, 2 светильника, варочная панель + духовка.
          </div>
        )}

        {showForm && (
          <div className="mb-6 rounded-xl border border-border bg-bg-surface p-6">
            <RoomForm
              room={editingId ? (existingRooms.find(r => r.id === editingId) ?? undefined) : undefined}
              onSave={handleAddRoom}
              onCancel={() => { setShowForm(false); setEditingId(null) }}
            />
          </div>
        )}

        {/* Список комнат */}
        {existingRooms.length > 0 && (
          <div className="space-y-3">
            {existingRooms.map(room => {
              const roomType = ROOM_TYPES.find(r => r.value === room.type)
              return (
                <div
                  key={room.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{roomType?.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{room.name}</div>
                      <div className="text-xs text-text-muted">
                        {room.socketGroups} розеточных гр. · {room.lightingPoints} св.
                        {room.loads.length > 0 &&
                          ` · ${room.loads.map(l => l.name).join(', ')}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(room.id)
                        setShowForm(true)
                      }}
                      className="rounded px-2 py-1 text-xs text-text-secondary hover:text-accent-amber"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => removeRoom(room.id)}
                      className="rounded px-2 py-1 text-xs text-text-secondary hover:text-accent-danger"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Выбор стратегии защиты влажных помещений */}
        {existingRooms.some(r => r.type === 'bathroom' || r.type === 'toilet') && (
          <div className="mt-8 rounded-xl border border-border bg-bg-elevated p-5">
            <h3 className="mb-1 text-sm font-semibold text-accent-amber">
              🚿 Защита влажных помещений
            </h3>
            <p className="mb-4 text-xs text-text-muted">
              Для ванной и туалета обязательно УЗО 10мА (ПУЭ 7.1.83). Выберите схему:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setInput({ bathroomStrategy: 'economy' })}
                className={`rounded-xl border p-4 text-left transition-all ${
                  (input.bathroomStrategy ?? 'economy') === 'economy'
                    ? 'border-accent-amber bg-accent-amber/5'
                    : 'border-border bg-bg-surface hover:border-border-accent'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text-primary">🔸 Эконом</span>
                  {input.bathroomStrategy !== 'separate' && (
                    <span className="rounded bg-accent-amber/20 px-2 py-0.5 text-[10px] text-accent-amber">рекомендуется</span>
                  )}
                </div>
                <div className="space-y-1 text-xs text-text-secondary">
                  <p><strong>1 дифавтомат</strong> на всё помещение: розетки, свет и техника — через один диф 10мА.</p>
                  <p className="text-green-400">✓ Дешевле — экономия ≈ 1500₽ на комнату</p>
                  <p className="text-text-muted">✗ При срабатывании отключается и свет, и розетки</p>
                  <p className="text-text-muted">✗ Остаётесь в тёмной ванной</p>
                </div>
              </button>
              <button
                onClick={() => setInput({ bathroomStrategy: 'separate' })}
                className={`rounded-xl border p-4 text-left transition-all ${
                  input.bathroomStrategy === 'separate'
                    ? 'border-accent-amber bg-accent-amber/5'
                    : 'border-border bg-bg-surface hover:border-border-accent'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text-primary">🔹 Раздельный</span>
                </div>
                <div className="space-y-1 text-xs text-text-secondary">
                  <p><strong>2 дифавтомата</strong>: отдельно на розетки/технику, отдельно на свет.</p>
                  <p className="text-green-400">✓ Сработал диф розеток — свет горит, не темно</p>
                  <p className="text-green-400">✓ Точная диагностика: сразу понятно, где проблема</p>
                  <p className="text-text-muted">✗ Дороже — требуется 2 дифа вместо 1</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Управление снизу */}
      {existingRooms.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-bg-base/95 backdrop-blur-lg p-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <div className="text-sm text-text-muted">
              Добавлено помещений: <strong className="text-accent-amber">{existingRooms.length}</strong>
            </div>
            <button
              onClick={calculate}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-amber px-8 py-3 font-semibold text-bg-base transition-all hover:shadow-amber"
            >
              Рассчитать ⚡
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
