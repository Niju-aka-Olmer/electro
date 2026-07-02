// src/store/calculatorStore.ts
// Zustand хранилище состояния калькулятора

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CalculationInput, CalculationResult, RoomConfig } from '@/types/electrical'
import { calculateAll } from '@/lib/calculate'
import type { Manufacturer } from '@/lib/catalog'

interface CalculatorStore {
  // Входные данные
  input: Partial<CalculationInput>
  
  // Результат расчёта
  result: CalculationResult | null
  
  // UI состояние
  currentStep: 1 | 2 | 3
  isCalculating: boolean
  error: string | null

  // Выбор производителя
  manufacturer: Manufacturer
  setManufacturer: (m: Manufacturer) => void

  // Actions
  setInput: (input: Partial<CalculationInput>) => void
  addRoom: (room: RoomConfig) => void
  updateRoom: (id: string, updates: Partial<RoomConfig>) => void
  removeRoom: (id: string) => void
  calculate: () => void
  setResult: (result: CalculationResult | null) => void
  setStep: (step: 1 | 2 | 3) => void
  setCalculating: (v: boolean) => void
  setError: (e: string | null) => void
  reset: () => void
}

const DEFAULT_INPUT: Partial<CalculationInput> = {
  installationType: 'apartment',
  totalAreaM2: 60,
  floors: 1,
  grounding: 'TN-C-S',
  supplyPhases: 1,
  meterAmps: 25,
  rooms: [],
  bathroomStrategy: 'economy',
}

export const useCalculatorStore = create<CalculatorStore>()(
  persist(
    (set) => ({
      input: DEFAULT_INPUT,
      result: null,
      currentStep: 1,
      isCalculating: false,
      error: null,
      manufacturer: 'abb',

      setManufacturer: (manufacturer) => set({ manufacturer }),

      setInput: (updates) =>
        set((state) => ({ input: { ...state.input, ...updates } })),

      addRoom: (room) =>
        set((state) => ({
          input: {
            ...state.input,
            rooms: [...(state.input.rooms ?? []), room],
          },
        })),

      updateRoom: (id, updates) =>
        set((state) => ({
          input: {
            ...state.input,
            rooms: (state.input.rooms ?? []).map((r) =>
              r.id === id ? { ...r, ...updates } : r
            ),
          },
        })),

      removeRoom: (id) =>
        set((state) => ({
          input: {
            ...state.input,
            rooms: (state.input.rooms ?? []).filter((r) => r.id !== id),
          },
        })),

      setResult: (result) => set({ result }),
      setStep: (currentStep) => set({ currentStep }),
      setCalculating: (isCalculating) => set({ isCalculating }),
      setError: (error) => set({ error }),

      calculate: () =>
        set((state) => {
          try {
            const input = state.input as CalculationInput
            if (!input.rooms || input.rooms.length === 0) {
              return { error: 'Добавьте хотя бы одно помещение', result: null }
            }
            const result = calculateAll(input)
            return { result, error: null, currentStep: 3 as const }
          } catch (e) {
            return { error: e instanceof Error ? e.message : 'Ошибка расчёта', result: null }
          }
        }),

      reset: () =>
        set({
          input: DEFAULT_INPUT,
          result: null,
          currentStep: 1,
          isCalculating: false,
          error: null,
          manufacturer: 'abb',
        }),
    }),
    {
      name: 'electroplan-calculator',
      // Не сохраняем результат — только входные данные
      partialize: (state) => ({ input: state.input }),
    }
  )
)
