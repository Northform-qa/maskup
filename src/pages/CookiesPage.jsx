import { Link } from 'react-router-dom'

const ESSENTIAL_COOKIES = [
  {
    name: '__cf_bm',
    purpose: 'Cloudflare places this cookie on devices that access sites protected by Bot Management or Bot Fight Mode.',
    provider: '.supabase.co',
    type: 'Server cookie',
    expires: '30 minutes',
  },
  {
    name: 'sb-*-auth-token',
    purpose: 'Supabase Auth session token. Keeps you logged in across page loads.',
    provider: '.maskup.gg',
    type: 'HTTP cookie',
    expires: 'Session',
  },
]

const BROWSERS = [
  { label: 'Chrome', href: 'https://support.google.com/chrome/answer/95647' },
  { label: 'Internet Explorer', href: 'https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d' },
  { label: 'Firefox', href: 'https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop' },
  { label: 'Safari', href: 'https://support.apple.com/en-gb/guide/safari/sfri11471/mac' },
  { label: 'Edge', href: 'https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09' },
  { label: 'Opera', href: 'https://help.opera.com/en/latest/web-preferences/' },
]

const SECTIONS = [
  {
    id: 'what-are-cookies',
    number: '01',
    title: 'What Are Cookies?',
    content: (
      <>
        <p className="text-gray-700 mb-3">Cookies are small data files placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners to make their websites work, work more efficiently, and to provide reporting information.</p>
        <p className="text-gray-700">Cookies set by the website owner (Northform QA) are called <strong>first-party cookies</strong>. Cookies set by parties other than the website owner are called <strong>third-party cookies</strong>. Third-party cookies enable third-party features or functionality to be provided on or through the website — such as analytics. The parties that set these third-party cookies can recognize your computer both when it visits our website and when it visits certain other websites.</p>
      </>
    ),
  },
  {
    id: 'why-we-use-cookies',
    number: '02',
    title: 'Why Do We Use Cookies?',
    content: (
      <p className="text-gray-700">We use first- and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our website to operate — we refer to these as <strong>essential</strong> or <strong>strictly necessary</strong> cookies. Other cookies help us track and target user interests to enhance the experience on our platform.</p>
    ),
  },
  {
    id: 'what-cookies-we-use',
    number: '03',
    title: 'What Cookies Do We Use?',
    content: (
      <>
        <p className="font-semibold text-gray-900 mb-2">Essential website cookies</p>
        <div className="bg-gray-50 border-l-4 border-brand rounded-r-xl px-4 py-3 mb-4 text-sm text-gray-600 italic">
          These cookies are strictly necessary to provide you with services available through our website and to use some of its features, such as access to secure areas.
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-brand text-white">
                <th className="text-left py-2 px-3 font-medium text-xs tracking-wide">Name</th>
                <th className="text-left py-2 px-3 font-medium text-xs tracking-wide">Purpose</th>
                <th className="text-left py-2 px-3 font-medium text-xs tracking-wide">Provider</th>
                <th className="text-left py-2 px-3 font-medium text-xs tracking-wide">Type</th>
                <th className="text-left py-2 px-3 font-medium text-xs tracking-wide">Expires</th>
              </tr>
            </thead>
            <tbody>
              {ESSENTIAL_COOKIES.map((c, i) => (
                <tr key={c.name} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2.5 px-3 font-mono text-xs text-gray-900 align-top whitespace-nowrap">{c.name}</td>
                  <td className="py-2.5 px-3 text-gray-600 align-top text-xs">{c.purpose}</td>
                  <td className="py-2.5 px-3 text-gray-600 align-top font-mono text-xs whitespace-nowrap">{c.provider}</td>
                  <td className="py-2.5 px-3 text-gray-600 align-top text-xs whitespace-nowrap">{c.type}</td>
                  <td className="py-2.5 px-3 text-gray-500 align-top text-xs whitespace-nowrap">{c.expires}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: 'control-cookies',
    number: '04',
    title: 'How Can I Control Cookies?',
    content: (
      <>
        <p className="text-gray-700 mb-3">You have the right to decide whether to accept or reject cookies. Essential cookies cannot be rejected as they are strictly necessary to provide our Services. If you choose to reject non-essential cookies, you may still use our website, though some functionality may be restricted.</p>
        <p className="text-gray-700 mb-3">You may also set or amend your web browser controls to accept or refuse cookies. Since the means to refuse cookies varies by browser, visit your browser's help menu for more information:</p>
        <div className="flex flex-wrap gap-2">
          {BROWSERS.map((b) => (
            <a
              key={b.label}
              href={b.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-brand hover:bg-green-50 hover:border-brand transition-colors"
            >
              {b.label}
            </a>
          ))}
        </div>
      </>
    ),
  },
  {
    id: 'other-tracking',
    number: '05',
    title: 'What About Other Tracking Technologies?',
    content: (
      <p className="text-gray-700">Cookies are not the only way to recognize or track visitors to a website. We may use other similar technologies from time to time, like web beacons (sometimes called "tracking pixels" or "clear gifs"). These are tiny graphics files containing a unique identifier that enable us to recognize when someone has visited our website or opened an email. In many instances, these technologies are reliant on cookies to function properly, so declining cookies will impair their functioning.</p>
    ),
  },
  {
    id: 'flash-cookies',
    number: '06',
    title: 'Do You Use Flash Cookies or Local Shared Objects?',
    content: (
      <p className="text-gray-700">Websites may use so-called "Flash Cookies" (also known as Local Shared Objects or "LSOs") to collect and store information about your use of our services and for fraud prevention. If you do not want Flash Cookies stored on your computer, you can adjust the settings of your Flash player using the tools contained in the{' '}
        <a href="http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager07.html" target="_blank" rel="noopener noreferrer" className="text-brand underline">Website Storage Settings Panel</a>.
      </p>
    ),
  },
  {
    id: 'targeted-advertising',
    number: '07',
    title: 'Do You Serve Targeted Advertising?',
    content: (
      <>
        <p className="text-gray-700 mb-3">MaskUp.gg does not serve targeted advertising and is committed to remaining ad-free. We do not use cookies or web beacons to serve advertisements. If this changes in the future, this Cookie Policy will be updated accordingly.</p>
        <p className="text-gray-700 mb-2">For general information about opting out of targeted advertising from third-party networks, you may visit:</p>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li><a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-brand underline">Digital Advertising Alliance</a></li>
          <li><a href="https://youradchoices.ca/" target="_blank" rel="noopener noreferrer" className="text-brand underline">Digital Advertising Alliance of Canada</a></li>
          <li><a href="https://www.edaa.eu/" target="_blank" rel="noopener noreferrer" className="text-brand underline">European Interactive Digital Advertising Alliance</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'updates',
    number: '08',
    title: 'How Often Will You Update This Cookie Policy?',
    content: (
      <p className="text-gray-700">We may update this Cookie Policy from time to time to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. Please revisit this Cookie Policy regularly to stay informed. The date at the top of this page indicates when it was last updated.</p>
    ),
  },
  {
    id: 'contact',
    number: '09',
    title: 'Where Can I Get Further Information?',
    content: (
      <>
        <p className="text-gray-700 mb-4">If you have any questions about our use of cookies or other technologies, please contact us:</p>
        <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5">
          <p className="font-semibold text-gray-900 mb-3">Northform QA (doing business as MaskUp.gg)</p>
          <address className="not-italic text-sm text-gray-700 space-y-0.5">
            <p>PO BOX 99900 YE 904 630</p>
            <p>RPO Rossland Garden</p>
            <p>Whitby, Ontario L1R 0M1</p>
            <p>Canada</p>
          </address>
          <p className="mt-3">
            <a href="mailto:support@maskup.gg" className="text-brand font-medium underline text-sm">support@maskup.gg</a>
          </p>
        </div>
      </>
    ),
  },
]

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-cream-100">
      {/* Hero */}
      <div className="bg-brand text-white px-4 py-16 text-center">
        <p className="text-sm font-medium tracking-widest uppercase text-green-200 mb-2">Legal</p>
        <h1 className="text-4xl font-bold mb-3">Cookie Policy</h1>
        <p className="text-green-100 text-sm">Northform QA (doing business as MaskUp.gg) · Last updated May 14, 2026</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Intro */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-gray-700 leading-relaxed mb-3">
            This Cookie Policy explains how <strong>Northform QA</strong> (doing business as <strong>MaskUp.gg</strong>) uses cookies and similar technologies to recognize you when you visit our website at <a href="https://www.maskup.gg" className="text-brand underline">www.maskup.gg</a>. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
          </p>
          <p className="text-gray-700 leading-relaxed">
            In some cases we may use cookies to collect personal information, or information that becomes personal information if we combine it with other information.
          </p>
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <div key={section.id} id={section.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden scroll-mt-20">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-gray-300">{section.number}</span>
                <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
              </div>
            </div>
            <div className="px-6 py-5">
              {section.content}
            </div>
          </div>
        ))}

        {/* Footer links */}
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 pt-2 pb-8">
          <span className="text-xs text-gray-400">© 2026 Northform QA doing business as MaskUp.gg</span>
          <span>·</span>
          <Link to="/privacy" className="hover:text-brand transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-brand transition-colors">Terms of Use</Link>
          <span>·</span>
          <Link to="/cookies" className="hover:text-brand transition-colors font-medium text-gray-700">Cookie Policy</Link>
        </div>
      </div>
    </div>
  )
}
