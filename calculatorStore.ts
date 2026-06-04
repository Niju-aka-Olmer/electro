// src/store/calculatorStore.ts
// Zustand хранилище состояния калькулятора

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CalculationInput, CalculationResult, RoomConfig } from '@/types/electrical'

interface CalculatorStore {
  // Входные данные
  input: Partial<CalculationInput>
  
  // Результат расчёта
  result: CalculationResult | null
  
  // UI состояние
  currentStep: 1 | 2 | 3
  isCalculating: boolean
  error: string | null

  // Actions
  setInput: (input: Partial<CalculationInput>) => void
  addRoom: (room: RoomConfig) => void
  updateRoom: (id: string, updates: Partial<RoomConfig>) => void
  removeRoom: (id: string) => void
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
}

export const useCalculatorStore = create<CalculatorStore>()(
  persist(
    (set) => ({
      input: DEFAULT_INPUT,
      result: null,
      currentStep: 1,
      isCalculating: false,
      error: null,

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

      reset: () =>
        set({
          input: DEFAULT_INPUT,
          result: null,
          currentStep: 1,
          isCalculating: false,
          error: null,
        }),
    }),
    {
      name: 'electroplan-calculator',
      // Не сохраняем результат — только входные данные
      partialize: (state) => ({ input: state.input }),
    }
  )
)
