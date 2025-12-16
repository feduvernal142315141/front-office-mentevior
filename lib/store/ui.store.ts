import { create } from "zustand"

interface UiState {
  sidebarCollapsed: boolean
  darkMode: boolean
  toggleSidebar: () => void
  toggleDarkMode: () => void
  setDarkMode: (value: boolean) => void
}

export const useUi = create<UiState>((set) => ({
  sidebarCollapsed: false,
  darkMode: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setDarkMode: (value) => set({ darkMode: value }),
}))
