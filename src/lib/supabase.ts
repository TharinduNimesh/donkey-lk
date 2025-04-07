import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

export type AuthError = {
  message: string
  status: number
}

export type AuthResponse = {
  data: {
    hasProfile: boolean
  } | null
  error: AuthError | null
}

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (authError) throw authError

    // Check if user has a profile
    const { data: profile } = await supabase
      .from('profile')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    return { 
      data: { hasProfile: !!profile },
      error: null 
    }
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