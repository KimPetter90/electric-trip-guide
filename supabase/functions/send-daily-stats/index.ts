import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Hent nye registreringer i dag
    const { data: newUsers, error: usersError } = await supabase
      .from('profiles')
      .select('email, created_at')
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', todayEnd.toISOString());

    if (usersError) {
      console.error('Error fetching new users:', usersError);
      throw usersError;
    }

    // Hent API-bruk i dag
    const { data: apiUsage, error: apiError } = await supabase
      .from('api_usage_log')
      .select('endpoint, created_at')
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', todayEnd.toISOString());

    if (apiError) {
      console.error('Error fetching API usage:', apiError);
      throw apiError;
    }

    // Tell totalt antall brukere
    const { count: totalUsers, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting total users:', countError);
      throw countError;
    }

    // Grupper API-bruk etter endpoint
    const endpointUsage = apiUsage?.reduce((acc: Record<string, number>, log) => {
      acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
      return acc;
    }, {}) || {};

    const usageList = Object.entries(endpointUsage)
      .map(([endpoint, count]) => `<li>${endpoint}: ${count} kall</li>`)
      .join('');

    const newUsersList = newUsers?.map(user => 
      `<li>${user.email} - ${new Date(user.created_at).toLocaleString('no-NO')}</li>`
    ).join('') || '<li>Ingen nye brukere i dag</li>';

    const emailResponse = await resend.emails.send({
      from: "ElRoute Stats <onboarding@resend.dev>",
      to: ["ElRoute@gmail.com"],
      subject: `ElRoute daglig statistikk - ${today.toLocaleDateString('no-NO')}`,
      html: `
        <h2>ElRoute daglig statistikk</h2>
        <p><strong>Dato:</strong> ${today.toLocaleDateString('no-NO')}</p>
        
        <h3>📊 Oversikt</h3>
        <ul>
          <li><strong>Totalt antall brukere:</strong> ${totalUsers || 0}</li>
          <li><strong>Nye brukere i dag:</strong> ${newUsers?.length || 0}</li>
          <li><strong>API-kall i dag:</strong> ${apiUsage?.length || 0}</li>
        </ul>

        <h3>👥 Nye registreringer i dag</h3>
        <ul>
          ${newUsersList}
        </ul>

        <h3>🔧 API-bruk per endpoint</h3>
        <ul>
          ${usageList || '<li>Ingen API-kall registrert</li>'}
        </ul>

        <hr>
        <p><em>Denne rapporten ble generert automatisk klokka 22:00.</em></p>
      `,
    });

    console.log("Daily stats email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      stats: {
        totalUsers: totalUsers || 0,
        newUsersToday: newUsers?.length || 0,
        apiCallsToday: apiUsage?.length || 0
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-daily-stats:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);