import { create } from 'zustand'

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

export const useSetupStore = create<SetupStore>((set) => ({
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
}))