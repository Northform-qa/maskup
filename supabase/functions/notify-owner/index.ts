// notify-owner — Supabase Edge Function
// Sends transactional email to field owners on listing approval or rejection.
// Called from AdminDashboard after a successful DB update.
// RESEND_API_KEY must be set in Supabase secrets — never exposed to the frontend.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM = 'MaskUp.gg <no-reply@maskup.gg>'
const LOGO_URL = 'https://www.maskup.gg/Full%20Horizontal%20Lockup-01.png'

// ── Shared email wrapper ──────────────────────────────────────
function emailWrapper(body: string): string {
  return `
<html>
  <body style="background:#F5F2EB;font-family:Inter,system-ui,sans-serif;margin:0;padding:40px 16px;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:40px 32px;">
      <img src="${LOGO_URL}" alt="MaskUp.gg" style="height:80px;width:auto;display:block;margin:0 auto 28px;">
      ${body}
      <p style="font-size:12px;color:#9CA3AF;text-align:center;margin:28px 0 0;">
        MaskUp.gg — Ontario's paintball &amp; airsoft community
      </p>
    </div>
  </body>
</html>`
}

// ── Approved template ─────────────────────────────────────────
function approvedEmail(fieldName: string): { subject: string; html: string } {
  return {
    subject: 'Your MaskUp.gg listing has been approved!',
    html: emailWrapper(`
      <h1 style="font-size:20px;font-weight:700;color:#111827;text-align:center;margin:0 0 12px;">
        You're live! 🎉
      </h1>
      <p style="font-size:15px;color:#4B5563;text-align:center;line-height:1.6;margin:0 0 20px;">
        Great news — <strong>${fieldName}</strong> is now live on MaskUp.gg and visible to players across Ontario.
      </p>
      <p style="font-size:15px;color:#4B5563;text-align:center;line-height:1.6;margin:0 0 28px;">
        Sign in to your owner dashboard to manage your listing, update your hours, and post events.
      </p>
      <a href="https://www.maskup.gg/owner-dashboard"
         style="display:block;background:#3B6D11;color:#ffffff;text-align:center;text-decoration:none;font-weight:600;font-size:15px;padding:14px 24px;border-radius:8px;margin:0 0 28px;">
        Go to Owner Dashboard
      </a>
      <p style="font-size:13px;color:#9CA3AF;text-align:center;margin:0;">
        Questions? Email us at
        <a href="mailto:support@maskup.gg" style="color:#3B6D11;">support@maskup.gg</a>
      </p>
    `),
  }
}

// ── Rejected template ─────────────────────────────────────────
function rejectedEmail(fieldName: string, rejectionReason: string): { subject: string; html: string } {
  return {
    subject: 'Update needed on your MaskUp.gg listing',
    html: emailWrapper(`
      <h1 style="font-size:20px;font-weight:700;color:#111827;text-align:center;margin:0 0 12px;">
        Update needed
      </h1>
      <p style="font-size:15px;color:#4B5563;text-align:center;line-height:1.6;margin:0 0 20px;">
        Thanks for submitting <strong>${fieldName}</strong> to MaskUp.gg. After review, we need a few updates before we can approve your listing.
      </p>
      <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:16px;margin:0 0 24px;">
        <p style="font-size:13px;font-weight:600;color:#92400E;margin:0 0 6px;">Reason for review:</p>
        <p style="font-size:14px;color:#78350F;margin:0;line-height:1.5;">${rejectionReason}</p>
      </div>
      <a href="https://www.maskup.gg/register"
         style="display:block;background:#3B6D11;color:#ffffff;text-align:center;text-decoration:none;font-weight:600;font-size:15px;padding:14px 24px;border-radius:8px;margin:0 0 24px;">
        Edit your listing
      </a>
      <p style="font-size:13px;color:#9CA3AF;text-align:center;margin:0;">
        Questions? Email us at
        <a href="mailto:support@maskup.gg" style="color:#3B6D11;">support@maskup.gg</a>
      </p>
    `),
  }
}

// ── Handler ───────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!resendKey || !supabaseUrl || !supabaseServiceKey) {
    console.error('notify-owner: missing required env vars')
    return new Response('Server configuration error', { status: 500 })
  }

  // Verify the caller is an authenticated admin
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 })
  }

  const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data: callerProfile } = await callerClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return new Response('Forbidden', { status: 403 })
  }

  let body: { fieldId: string; action: 'approved' | 'rejected' }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { fieldId, action } = body
  if (!fieldId || !['approved', 'rejected'].includes(action)) {
    return new Response('Invalid request body', { status: 400 })
  }

  // Fetch field + owner using service role (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: field, error: fieldErr } = await supabase
    .from('fields')
    .select('name, rejection_reason, owner_id')
    .eq('id', fieldId)
    .single()

  if (fieldErr || !field) {
    console.error('notify-owner: field fetch failed', fieldErr)
    return new Response('Field not found', { status: 404 })
  }

  const { data: owner, error: ownerErr } = await supabase
    .from('users')
    .select('email')
    .eq('id', field.owner_id)
    .single()

  if (ownerErr || !owner) {
    console.error('notify-owner: owner fetch failed', ownerErr)
    return new Response('Owner not found', { status: 404 })
  }

  const template = action === 'approved'
    ? approvedEmail(field.name)
    : rejectedEmail(field.name, field.rejection_reason ?? 'Please contact support@maskup.gg for details.')

  const emailRes = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: owner.email,
      subject: template.subject,
      html: template.html,
    }),
  })

  if (!emailRes.ok) {
    const errText = await emailRes.text()
    console.error(`notify-owner: Resend error ${emailRes.status}`, errText)
    return new Response('Email send failed', { status: 500 })
  }

  console.log(`notify-owner: sent ${action} email for field ${fieldId} to ${owner.email}`)
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
