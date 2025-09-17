import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const { sessionId, pagePath, referrer, userAgent } = await req.json()
      
      // Get client IP
      const clientIP = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown'

      // Get user if authenticated
      const authHeader = req.headers.get('authorization')
      let userId = null
      
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        userId = user?.id || null
      }

      // Insert page view
      const { error } = await supabase
        .from('page_views')
        .insert({
          session_id: sessionId,
          page_path: pagePath,
          referrer: referrer,
          user_agent: userAgent,
          ip_address: clientIP,
          user_id: userId
        })

      if (error) {
        console.error('Error inserting page view:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to track page view' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'GET') {
      // Get analytics data
      const url = new URL(req.url)
      const days = parseInt(url.searchParams.get('days') || '30')
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Check if user is authorized (admin)
      const authHeader = req.headers.get('authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      
      if (!user || user.email !== 'kpkopperstad@gmail.com') {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get daily statistics
      const { data: dailyStats, error: dailyError } = await supabase
        .rpc('get_daily_analytics', { days_back: days })

      if (dailyError) {
        console.error('Error getting daily stats:', dailyError)
      }

      // Get total unique visitors
      const { count: totalUniqueVisitors, error: uniqueError } = await supabase
        .from('page_views')
        .select('session_id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())

      // Get total logged in users
      const { count: totalLoggedInUsers, error: loggedError } = await supabase
        .from('page_views')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .not('user_id', 'is', null)

      // Get total page views
      const { count: totalPageviews, error: pageError } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())

      if (uniqueError || loggedError || pageError) {
        console.error('Error getting analytics:', { uniqueError, loggedError, pageError })
        return new Response(
          JSON.stringify({ error: 'Failed to get analytics' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const analyticsData = {
        totalUniqueVisitors: totalUniqueVisitors || 0,
        totalLoggedInUsers: totalLoggedInUsers || 0,
        totalPageviews: totalPageviews || 0,
        dailyStats: dailyStats || []
      }

      return new Response(
        JSON.stringify(analyticsData),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in track-analytics function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})