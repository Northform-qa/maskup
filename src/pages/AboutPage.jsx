import { Link } from 'react-router-dom'

const PLAYER_FEATURES = [
  'Search fields by location, postal code, or name',
  'See live open, closed, and rain delay status',
  "Check today's weather at outdoor fields before you leave the house",
  'See roughly how many players are on-site right now via community crowd reports',
  "Tap I'm going today to signal to other players you're heading out — and see who else is going",
  'Find upcoming events, big games, walk-on days, and tournaments all in one place',
]

const OWNER_FEATURES = [
  'One free listing that players can actually find',
  'Control your hours, status, rental info, pricing, and events from your dashboard',
  "Update your status the morning of a walk-on so players know you're open",
  'Post last-minute events and reach players who are actively looking for somewhere to play',
]

const COMMITMENTS = [
  {
    label: 'No random ads. Ever.',
    body: 'The only promotions on MaskUp come from fields in the paintball and airsoft ecosystem.',
  },
  {
    label: 'Admin-approved listings.',
    body: 'Every new field is reviewed before going live. No spam, no fake listings, no stale data.',
  },
  {
    label: 'Free for players, free to list.',
    body: 'The basic listing is always free.',
  },
  {
    label: 'Airsoft is equal.',
    body: 'MaskUp serves both paintball and airsoft communities equally. Both sports, one home.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream-100">

      {/* Hero */}
      <div className="bg-brand text-white px-4 py-16 text-center">
        <p className="text-sm font-medium tracking-widest uppercase text-green-200 mb-2">About</p>
        <h1 className="text-4xl font-bold mb-3">MaskUp.gg</h1>
        <p className="text-green-100 text-lg max-w-lg mx-auto">
          The directory Ontario paintball and airsoft actually needed.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

        {/* The Problem — editorial treatment */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">The Problem</h2>
          <div className="space-y-4">
            <p className="text-lg text-gray-700 leading-relaxed">
              If you've ever tried to find a paintball or airsoft field in Ontario, you already know the frustration.
            </p>
            <p className="text-gray-600 leading-relaxed">
              There's no central place to look. Fields are scattered across Facebook pages, Instagram profiles, outdated websites, and Google listings that haven't been touched in years. You might find a phone number that rings out. A website with hours from 2019. A Facebook page with a post from eight months ago that may or may not mean they're still operating.
            </p>
            <p className="text-gray-600 leading-relaxed">
              You want to know one thing: is this field open this weekend, and is it worth the drive?
            </p>
            <p className="text-gray-600 leading-relaxed font-medium text-gray-700">
              There's no good answer to that question right now. You end up in three different browser tabs, a Facebook group, and a text to a friend who might know someone who played there last summer.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Every field in Ontario runs some form of social media. The problem is there are dozens of them, all in different places, all updated on different schedules, with no consistent format and no way to compare them side by side. A player shouldn't need to follow fifteen Instagram accounts just to figure out where to play on Sunday.
            </p>
            <p className="text-lg font-semibold text-brand">MaskUp fixes that.</p>
          </div>
        </div>

        {/* What MaskUp Does */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">What MaskUp Does</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            MaskUp.gg is a centralized field directory for Ontario paintball and airsoft. One place to find every field, see their real-time status, check the weather, browse upcoming events, and know whether other players are already there.
          </p>

          {/* Two-card grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Players card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">For players</p>
              <ul className="space-y-2.5">
                {PLAYER_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-brand mt-0.5 flex-shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Owners card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">For field owners</p>
              <ul className="space-y-2.5">
                {OWNER_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-brand mt-0.5 flex-shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Built From Inside the Community */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Built From Inside the Community</h2>
          <div className="space-y-3 text-gray-600 leading-relaxed">
            <p>MaskUp wasn't built by a tech company that discovered paintball was a market opportunity.</p>
            <p>
              The founder has 26 years of experience in the Ontario paintball community — as a player and as someone who has managed fields. The problem of discoverability isn't theoretical. It was lived, repeatedly, on both sides of the gate.
            </p>
            <p className="font-medium text-gray-700">
              This platform exists because it was genuinely missing. Not because an algorithm said so.
            </p>
          </div>
        </div>

        {/* Support MaskUp — warm card */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Support MaskUp</h2>
          <div className="space-y-3 text-gray-700 leading-relaxed mb-6">
            <p>
              MaskUp is free to use and free to list — and right now, it's funded entirely out of pocket.
            </p>
            <p>
              There are real costs to keeping the lights on: hosting, database, mapping, and the hours that go into building and maintaining the platform. If MaskUp has helped you find a field, plan a game, or just saved you a frustrating Sunday of dead Facebook links — consider buying the founder a coffee.
            </p>
            <p className="font-medium">Every contribution goes directly back into the platform.</p>
          </div>

          <a
            href="https://buymeacoffee.com/maskupgg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-brand text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors text-sm"
          >
            ☕ Buy Me a Coffee
          </a>

          <p className="text-sm text-gray-500 mt-4">
            MaskUp will eventually sustain itself through optional paid features for field owners. Until then, community support keeps it running.
          </p>
        </div>

        {/* Our Commitment — 2×2 grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">Our Commitment</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {COMMITMENTS.map((c) => (
              <div key={c.label} className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="font-semibold text-gray-900 mb-1">{c.label}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Get in Touch */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Get in Touch</h2>
          <p className="text-gray-600">
            Questions, feedback, or want to list your field? Email us at{' '}
            <a href="mailto:support@maskup.gg" className="text-brand underline font-medium">
              support@maskup.gg
            </a>
          </p>
        </div>

        {/* Page footer */}
        <div className="pt-2 pb-10 border-t border-gray-200 text-center space-y-3">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-brand transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-brand transition-colors">Terms of Use</Link>
            <span>·</span>
            <Link to="/cookies" className="hover:text-brand transition-colors">Cookie Policy</Link>
          </div>
          <p className="text-xs text-gray-400">
            MaskUp.gg is operated by Northform QA, Whitby, Ontario, Canada.
          </p>
        </div>

      </div>
    </div>
  )
}
