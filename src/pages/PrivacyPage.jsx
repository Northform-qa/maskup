import { Link } from 'react-router-dom'

const SECTIONS = [
  {
    id: 'information-we-collect',
    number: '01',
    title: 'Information We Collect',
    short: 'We collect only what we need to run the platform — account info you give us, and basic usage data we generate automatically.',
    content: (
      <>
        <p className="text-gray-700 mb-3">We collect information to provide and improve MaskUp.gg. This falls into two categories:</p>
        <p className="font-semibold text-gray-900 mb-1">Information you provide</p>
        <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
          <li>Account registration: name, email address, password (hashed — never stored in plain text)</li>
          <li>Profile information: display name, role (player or field owner)</li>
          <li>Field listings: business name, address, contact details, operating hours</li>
          <li>User-generated content: crowd reports, RSVP check-ins, any future reviews</li>
        </ul>
        <p className="font-semibold text-gray-900 mb-1">Information generated automatically</p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Log data: IP address, browser type, pages visited, timestamps</li>
          <li>Device information: screen size, operating system, browser version</li>
          <li>Usage patterns: features used, session duration</li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use',
    number: '02',
    title: 'How We Use Your Information',
    short: 'Your data runs the platform. We use it to show you fields, power community features, and keep the service secure — nothing else.',
    content: (
      <>
        <p className="text-gray-700 mb-3">We use collected information to:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Create and manage your account</li>
          <li>Display and maintain field listings</li>
          <li>Power community features (crowd reports, RSVPs, going-today counts)</li>
          <li>Send transactional emails (account confirmation, password reset)</li>
          <li>Detect and prevent fraud or abuse</li>
          <li>Analyse aggregate usage to improve the platform</li>
          <li>Comply with legal obligations</li>
        </ul>
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>We do not sell your personal information.</strong> We do not use your data for targeted advertising. We do not share it with third parties for their marketing purposes.
        </div>
      </>
    ),
  },
  {
    id: 'information-sharing',
    number: '03',
    title: 'Information Sharing',
    short: "We share data only when you've chosen to make it public, when our service providers need it to operate, or when the law requires it.",
    content: (
      <>
        <p className="text-gray-700 mb-3">We share information only in these limited circumstances:</p>
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-gray-900 mb-1">Public information you choose to share</p>
            <p className="text-gray-700 text-sm">Field listings, crowd reports, and RSVP counts are visible to all visitors. Your display name may appear alongside contributions you make.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Service providers</p>
            <p className="text-gray-700 text-sm">We use Supabase (database and authentication), Vercel (hosting), and OpenWeatherMap (weather data). These providers access data only as needed to deliver their services and are bound by confidentiality obligations.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Legal requirements</p>
            <p className="text-gray-700 text-sm">We may disclose information if required by law, court order, or to protect the rights, property, or safety of MaskUp.gg, its users, or the public.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Business transfers</p>
            <p className="text-gray-700 text-sm">If MaskUp.gg is acquired or merges with another entity, your information may transfer. You will be notified before that happens.</p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'data-security',
    number: '04',
    title: 'Data Security',
    short: 'We use industry-standard encryption and access controls. No system is perfect — report security issues to us directly.',
    content: (
      <>
        <p className="text-gray-700 mb-3">We implement reasonable technical and organisational measures to protect your information:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
          <li>All data transmitted over HTTPS (TLS encryption)</li>
          <li>Passwords hashed using bcrypt — never stored in plain text</li>
          <li>Database access restricted by row-level security policies</li>
          <li>Authentication tokens stored in secure, httpOnly cookies</li>
          <li>Regular security reviews of dependencies and access controls</li>
        </ul>
        <p className="text-gray-700 text-sm">No method of transmission or storage is 100% secure. If you discover a security vulnerability, please report it to <a href="mailto:privacy@maskup.gg" className="text-brand underline">privacy@maskup.gg</a> rather than disclosing it publicly.</p>
      </>
    ),
  },
  {
    id: 'your-rights',
    number: '05',
    title: 'Your Rights (PIPEDA)',
    short: 'Under Canadian privacy law you can access, correct, or request deletion of your data. Just ask.',
    content: (
      <>
        <p className="text-gray-700 mb-3">Under Canada's <em>Personal Information Protection and Electronic Documents Act</em> (PIPEDA) and applicable provincial laws, you have the right to:</p>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          {[
            { title: 'Access', desc: 'Request a copy of the personal information we hold about you.' },
            { title: 'Correction', desc: 'Ask us to correct inaccurate or incomplete information.' },
            { title: 'Deletion', desc: 'Request deletion of your account and associated personal data.' },
            { title: 'Withdrawal', desc: 'Withdraw consent for processing where consent is the legal basis.' },
            { title: 'Portability', desc: 'Receive your data in a structured, machine-readable format.' },
            { title: 'Complaint', desc: 'Lodge a complaint with the Office of the Privacy Commissioner of Canada.' },
          ].map((r) => (
            <div key={r.title} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="font-semibold text-gray-900 text-sm mb-0.5">{r.title}</p>
              <p className="text-xs text-gray-600">{r.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-700 text-sm">To exercise any of these rights, email <a href="mailto:privacy@maskup.gg" className="text-brand underline">privacy@maskup.gg</a>. We will respond within 30 days.</p>
      </>
    ),
  },
  {
    id: 'cookies',
    number: '06',
    title: 'Cookies & Tracking',
    short: 'We use essential cookies for authentication and session management. No advertising trackers.',
    content: (
      <>
        <p className="text-gray-700 mb-3">MaskUp.gg uses cookies and similar technologies for core functionality:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-2 px-3 text-gray-500 font-medium border-b border-gray-200">Cookie</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium border-b border-gray-200">Purpose</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium border-b border-gray-200">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { name: 'sb-access-token', purpose: 'Supabase authentication session', duration: '1 hour' },
                { name: 'sb-refresh-token', purpose: 'Session renewal without re-login', duration: '30 days' },
                { name: 'maskup-prefs', purpose: 'UI preferences (filter state, map zoom)', duration: '1 year' },
              ].map((c) => (
                <tr key={c.name}>
                  <td className="py-2 px-3 font-mono text-xs text-gray-700">{c.name}</td>
                  <td className="py-2 px-3 text-gray-700">{c.purpose}</td>
                  <td className="py-2 px-3 text-gray-500">{c.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-gray-600 text-sm mt-3">We do not use advertising, analytics, or tracking cookies from third parties. See our full <Link to="/cookies" className="text-brand underline">Cookie Policy</Link> for more detail.</p>
      </>
    ),
  },
  {
    id: 'data-retention',
    number: '07',
    title: 'Data Retention',
    short: 'We keep your data while your account is active and delete it within 90 days of a deletion request.',
    content: (
      <>
        <p className="text-gray-700 mb-3">We retain personal information for as long as necessary to provide the service and meet legal obligations:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-1 mb-3">
          <li><strong>Active accounts:</strong> retained while your account exists</li>
          <li><strong>Deleted accounts:</strong> personal data purged within 90 days of deletion request</li>
          <li><strong>Anonymised usage data:</strong> may be retained indefinitely for aggregate analytics</li>
          <li><strong>Legal holds:</strong> data subject to a legal process may be retained longer</li>
        </ul>
        <p className="text-gray-700 text-sm">Field listings submitted by owners are retained for the life of the listing. Owners may request removal at any time through the owner dashboard or by contacting us.</p>
      </>
    ),
  },
  {
    id: 'children',
    number: '08',
    title: "Children's Privacy",
    short: 'MaskUp.gg is not intended for children under 13. We do not knowingly collect their data.',
    content: (
      <p className="text-gray-700">MaskUp.gg is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, contact us at <a href="mailto:privacy@maskup.gg" className="text-brand underline">privacy@maskup.gg</a> and we will delete it promptly.</p>
    ),
  },
  {
    id: 'changes',
    number: '09',
    title: 'Changes to This Policy',
    short: "We'll notify you of material changes by email or in-app notice before they take effect.",
    content: (
      <>
        <p className="text-gray-700 mb-3">We may update this Privacy Policy from time to time. When we make material changes:</p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>We will update the "Last updated" date at the top of this page</li>
          <li>We will notify registered users by email at least 14 days before changes take effect</li>
          <li>We will display a notice on the platform</li>
        </ul>
        <p className="text-gray-700 mt-3 text-sm">Continued use of MaskUp.gg after the effective date constitutes acceptance of the updated policy. If you disagree with material changes, you may close your account before they take effect.</p>
      </>
    ),
  },
]

const TOC = SECTIONS.map((s) => ({ id: s.id, title: s.title }))

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream-100">
      {/* Hero */}
      <div className="bg-brand text-white px-4 py-16 text-center">
        <p className="text-sm font-medium tracking-widest uppercase text-green-200 mb-2">Legal</p>
        <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-green-100 text-sm">MaskUp.gg · Last updated: May 8, 2026</p>
        <p className="text-green-100 text-sm mt-1">Effective date: May 8, 2026</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Intro */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <p className="text-gray-700 leading-relaxed">
            MaskUp.gg ("we", "us", "our") is operated by Northform QA, a company based in Ontario, Canada. This Privacy Policy explains how we collect, use, and protect personal information when you use our paintball and airsoft field directory. We are committed to the responsible handling of your information in accordance with Canada's <em>Personal Information Protection and Electronic Documents Act</em> (PIPEDA) and applicable provincial privacy laws.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            By using MaskUp.gg you agree to the collection and use of information as described here. If you do not agree, please do not use the platform.
          </p>
        </div>

        {/* Summary card */}
        <div className="bg-brand text-white rounded-2xl p-6 mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-200 mb-3">The short version</p>
          <div className="space-y-2">
            {[
              'We collect only what we need to run the platform.',
              'We never sell your data or use it for advertising.',
              'You can access, correct, or delete your data at any time.',
              'We use industry-standard security practices.',
              'We comply with Canadian privacy law (PIPEDA).',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm">
                <span className="text-green-300 mt-0.5 flex-shrink-0">✓</span>
                <span className="text-green-50">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table of contents */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Contents</p>
          <ol className="space-y-1.5">
            {TOC.map((item, i) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand transition-colors">
                  <span className="text-gray-300 font-mono text-xs w-5">{String(i + 1).padStart(2, '0')}</span>
                  {item.title}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <div key={section.id} id={section.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden scroll-mt-20">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs text-gray-300">{section.number}</span>
                  <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                </div>
                <p className="text-sm text-gray-500 italic">{section.short}</p>
              </div>
              <div className="px-6 py-5">
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-10 bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Contact our Privacy Officer</p>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-gray-900 mb-1">By email</p>
              <a href="mailto:privacy@maskup.gg" className="text-brand underline">privacy@maskup.gg</a>
              <p className="text-gray-500 text-xs mt-0.5">Response within 30 days</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">By mail</p>
              <p>Northform QA<br />Privacy Officer<br />Ontario, Canada</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
            You also have the right to contact the <a href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer" className="text-brand underline">Office of the Privacy Commissioner of Canada</a> if you have concerns about how we handle your information.
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-gray-500 pb-10">
          <Link to="/privacy" className="hover:text-brand transition-colors font-medium text-gray-700">Privacy Policy</Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-brand transition-colors">Terms of Use</Link>
          <span>·</span>
          <Link to="/cookies" className="hover:text-brand transition-colors">Cookie Policy</Link>
        </div>
      </div>
    </div>
  )
}
