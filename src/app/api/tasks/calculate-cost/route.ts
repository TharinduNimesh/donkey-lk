import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { parseViewCount } from '@/lib/utils/views'

const PLATFORM_RATES = {
  'YOUTUBE': 5,
  'FACEBOOK': 3,
  'TIKTOK': 4,
  'INSTAGRAM': 6
} as const;

// Using type assertion to prevent TypeScript from narrowing the type
const DEADLINE_MULTIPLIERS = {
  '3d': 2,
  '1w': 1.5,
  '2w': 1.2,
  '1m': 1,
  '2m': 0.9,
  '3m': 0.85,
  '6m': 0.8,
  'flexible': 0.75
} satisfies Record<string, number>;

const SERVICE_FEE_PERCENTAGE = 0.1; // 10% service fee

type DeadlineMultiplier = typeof DEADLINE_MULTIPLIERS[keyof typeof DEADLINE_MULTIPLIERS];

// Initialize admin client for privileged operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { taskId } = await request.json()
    
    // Get authenticated user client - fixed to use proper cookie handling
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify task ownership using the database function
    const { data: isMyTask, error: ownershipError } = await supabase
      .rpc('is_it_my_task', { task_id_input: taskId })

    if (ownershipError || !isMyTask) {
      return NextResponse.json(
        { error: 'Task not found or unauthorized' }, 
        { status: 403 }
      )
    }

    // Fetch task targets
    const { data: targets, error: targetsError } = await supabase
      .from('task_targets')
      .select('*')
      .eq('task_id', taskId)

    if (targetsError) {
      return NextResponse.json(
        { error: 'Failed to fetch task targets' }, 
        { status: 500 }
      )
    }

    // Calculate total cost
    let totalBaseCost = 0
    for (const target of targets) {
      const views = typeof target.views === 'string' ? 
        parseViewCount(target.views) : 
        target.views
        
      const platform = target.platform
      const deadlineDate = new Date(target.due_date || '')
      const today = new Date()
      const daysDiff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      // Determine deadline multiplier based on days difference
      let deadlineMultiplier: DeadlineMultiplier = DEADLINE_MULTIPLIERS.flexible
      if (daysDiff <= 3) {
        deadlineMultiplier = DEADLINE_MULTIPLIERS['3d']
      } else if (daysDiff <= 7) {
        deadlineMultiplier = DEADLINE_MULTIPLIERS['1w']
      } else if (daysDiff <= 14) {
        deadlineMultiplier = DEADLINE_MULTIPLIERS['2w']
      } else if (daysDiff <= 30) {
        deadlineMultiplier = DEADLINE_MULTIPLIERS['1m']
      } else if (daysDiff <= 60) {
        deadlineMultiplier = DEADLINE_MULTIPLIERS['2m']
      } else if (daysDiff <= 90) {
        deadlineMultiplier = DEADLINE_MULTIPLIERS['3m']
      } else if (daysDiff <= 180) {
        deadlineMultiplier = DEADLINE_MULTIPLIERS['6m']
      }
      
      const baseRate = PLATFORM_RATES[platform]
      const viewsInThousands = views / 1000
      
      // Calculate cost for this target
      const targetCost = Math.round(viewsInThousands * baseRate * deadlineMultiplier)
      totalBaseCost += targetCost
    }

    const serviceFee = Math.round(totalBaseCost * SERVICE_FEE_PERCENTAGE);
    const totalCost = totalBaseCost + serviceFee;

    // Store cost using admin client for security
    const { error: costError } = await supabaseAdmin
      .from('task_cost')
      .upsert({
        task_id: taskId,
        amount: totalCost, // Store total cost including service fee
        payment_method: 'BANK_TRANSFER', // Default to bank transfer, can be updated later
        is_paid: false
      })

    if (costError) {
      return NextResponse.json(
        { error: 'Failed to store task cost' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      baseCost: totalBaseCost,
      serviceFee,
      totalCost
    })
  } catch (error) {
    console.error('Error calculating task cost:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}