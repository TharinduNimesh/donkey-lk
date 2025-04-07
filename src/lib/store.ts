import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SetupStore {
  userType: 'brand' | 'influencer' | null
  personalInfo: {
    name: string
    mobile: string
  } | null
  connectedPlatforms: {
    youtube: boolean
    facebook: boolean
    tiktok: boolean
  }
  setUserType: (type: 'brand' | 'influencer') => void
  setPersonalInfo: (info: { name: string; mobile: string }) => void
  connectPlatform: (platform: 'youtube' | 'facebook' | 'tiktok') => void
  reset: () => void
}

export const useSetupStore = create<SetupStore>()(
  persist(
    (set) => ({
      userType: null,
      personalInfo: null,
      connectedPlatforms: {
        youtube: false,
        facebook: false,
        tiktok: false,
      },
      setUserType: (type) => set({ userType: type }),
      setPersonalInfo: (info) => set({ personalInfo: info }),
      connectPlatform: (platform) =>
        set((state) => ({
          connectedPlatforms: {
            ...state.connectedPlatforms,
            [platform]: true,
          },
        })),
      reset: () =>
        set({
          userType: null,
          personalInfo: null,
          connectedPlatforms: {
            youtube: false,
            facebook: false,
            tiktok: false,
          },
        }),
    }),
    {
      name: 'setup-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: false, // Set to false since we're handling hydration in StoreProvider
    }
  )
)