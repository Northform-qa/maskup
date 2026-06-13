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

// ── Hard rejected template ────────────────────────────────────
function rejectedEmail(fieldName: string, rejectionReason: string): { subject: string; html: string } {
  return {
    subject: 'Your MaskUp.gg listing was not approved',
    html: emailWrapper(`
      <h1 style="font-size:20px;font-weight:700;color:#111827;text-align:center;margin:0 0 12px;">
        Listing not approved
      </h1>
      <p style="font-size:15px;color:#4B5563;text-align:center;line-height:1.6;margin:0 0 20px;">
        Thank you for submitting <strong>${fieldName}</strong> to MaskUp.gg. After review, we're unable to approve this listing.
      </p>
      <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:16px;margin:0 0 24px;">
        <p style="font-size:13px;font-weight:600;color:#991B1B;margin:0 0 6px;">Reason:</p>
        <p style="font-size:14px;color:#7F1D1D;margin:0;line-height:1.5;">${rejectionReason}</p>
      </div>
      <p style="font-size:13px;color:#9CA3AF;text-align:center;margin:0;">
        Questions? Email us at
        <a href="mailto:support@maskup.gg" style="color:#3B6D11;">support@maskup.gg</a>
      </p>
    `),
  }
}

// ── Requires changes template ─────────────────────────────────
function requiresChangesEmail(fieldName: string, rejectionReason: string): { subject: string; html: string } {
  return {
    subject: 'Action required: updates needed for your MaskUp.gg listing',
    html: emailWrapper(`
      <h1 style="font-size:20px;font-weight:700;color:#111827;text-align:center;margin:0 0 12px;">
        Updates needed
      </h1>
      <p style="font-size:15px;color:#4B5563;text-align:center;line-height:1.6;margin:0 0 20px;">
        Thanks for submitting <strong>${fieldName}</strong> to MaskUp.gg. We've reviewed your listing and need a few things updated before we can approve it.
      </p>
      <div style="background:#FFFBEB;border:1px solid #F59E0B;border-radius:8px;padding:16px;margin:0 0 24px;">
        <p style="font-size:13px;font-weight:600;color:#92400E;margin:0 0 6px;">What needs to be updated:</p>
        <p style="font-size:14px;color:#78350F;margin:0;line-height:1.5;">${rejectionReason}</p>
      </div>
      <p style="font-size:15px;color:#4B5563;text-align:center;line-height:1.6;margin:0 0 24px;">
        Sign in to your profile to edit your listing and resubmit it for review.
      </p>
      <a href="https://www.maskup.gg/owner-dashboard/edit"
         style="display:block;background:#3B6D11;color:#ffffff;text-align:center;text-decoration:none;font-weight:600;font-size:15px;padding:14px 24px;border-radius:8px;margin:0 0 24px;">
        Edit my listing
      </a>
      <p style="font-size:13px;color:#9CA3AF;text-align:center;margin:0;">
        Questions? Email us at
        <a href="mailto:support@maskup.gg" style="color:#3B6D11;">support@maskup.gg</a>
      </p>
    `),
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Handler ───────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!resendKey || !supabaseUrl || !supabaseServiceKey) {
    console.error('notify-owner: missing required env vars')
    return new Response('Server configuration error', { status: 500, headers: CORS_HEADERS })
  }

  // Verify the caller is an authenticated admin
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS })
  }

  const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user } } = await callerClient.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS })
  }

  const { data: callerProfile } = await callerClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return new Response('Forbidden', { status: 403, headers: CORS_HEADERS })
  }

  let body: { fieldId: string; action: 'approved' | 'rejected' | 'requires_changes' }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: CORS_HEADERS })
  }

  const { fieldId, action } = body
  if (!fieldId || !['approved', 'rejected', 'requires_changes'].includes(action)) {
    return new Response('Invalid request body', { status: 400, headers: CORS_HEADERS })
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
    return new Response('Field not found', { status: 404, headers: CORS_HEADERS })
  }

  const { data: owner, error: ownerErr } = await supabase
    .from('users')
    .select('email')
    .eq('id', field.owner_id)
    .single()

  if (ownerErr || !owner) {
    console.error('notify-owner: owner fetch failed', ownerErr)
    return new Response('Owner not found', { status: 404, headers: CORS_HEADERS })
  }

  const fallbackReason = 'Please contact support@maskup.gg for details.'
  const template = action === 'approved'
    ? approvedEmail(field.name)
    : action === 'requires_changes'
      ? requiresChangesEmail(field.name, field.rejection_reason ?? fallbackReason)
      : rejectedEmail(field.name, field.rejection_reason ?? fallbackReason)

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
    return new Response('Email send failed', { status: 500, headers: CORS_HEADERS })
  }

  console.log(`notify-owner: sent ${action} email for field ${fieldId} to ${owner.email}`)
  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
})
