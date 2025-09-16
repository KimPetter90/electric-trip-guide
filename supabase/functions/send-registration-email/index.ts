import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegistrationRequest {
  userEmail: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName }: RegistrationRequest = await req.json();

    console.log("Sending registration notification for:", userEmail);

    const emailResponse = await resend.emails.send({
      from: "ElRoute <onboarding@resend.dev>",
      to: ["ElRoute@gmail.com"],
      subject: "Ny bruker registrert på ElRoute",
      html: `
        <h2>Ny bruker registrert</h2>
        <p><strong>E-post:</strong> ${userEmail}</p>
        <p><strong>Navn:</strong> ${userName || 'Ikke oppgitt'}</p>
        <p><strong>Registrert:</strong> ${new Date().toLocaleString('no-NO')}</p>
        <hr>
        <p>Dette er en automatisk e-post fra ElRoute-systemet.</p>
      `,
    });

    console.log("Registration email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-registration-email:", error);
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