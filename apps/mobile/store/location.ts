import { create } from 'zustand'

type Location = {
  lat: number
  lng: number
  accuracy?: number
}

type LocationStore = {
  userLocation: Location | null
  setUserLocation: (location: Location) => void
}

export const useLocationStore = create<LocationStore>((set) => ({
  userLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
}))
