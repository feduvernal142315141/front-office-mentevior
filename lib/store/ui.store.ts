import { create } from "zustand"

interface UiState {
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  darkMode: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (value: boolean) => void
  setMobileSidebarOpen: (value: boolean) => void
  toggleDarkMode: () => void
  setDarkMode: (value: boolean) => void
}

export const useUi = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  darkMode: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  setMobileSidebarOpen: (value) => set({ mobileSidebarOpen: value }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setDarkMode: (value) => set({ darkMode: value }),
}))
