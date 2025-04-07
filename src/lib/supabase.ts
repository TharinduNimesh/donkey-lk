import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

export type AuthError = {
  message: string
  status: number
}

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: (error as any).message,
        status: (error as any).status,
      } as AuthError,
    }
  }
}

export const signUp = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: (error as any).message,
        status: (error as any).status,
      } as AuthError,
    }
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    return {
      error: {
        message: (error as any).message,
        status: (error as any).status,
      } as AuthError,
    }
  }
}

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: (error as any).message,
        status: (error as any).status,
      } as AuthError,
    }
  }
}