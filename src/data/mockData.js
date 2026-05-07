// ─────────────────────────────────────────────────────────────
// Active players display logic
// active_players_now: null = no data yet today
// crowd_report_last_updated: null or ISO timestamp
// ─────────────────────────────────────────────────────────────
export function getActivePlayers(field) {
  const { active_players_now, crowd_report_count, crowd_report_last_updated } = field
  const now = Date.now()

  if (active_players_now == null) {
    return { type: 'none', text: 'No reports yet today' }
  }

  if (crowd_report_last_updated) {
    const updatedMs = new Date(crowd_report_last_updated).getTime()
    const ageMs = now - updatedMs
    const ageHours = ageMs / (1000 * 60 * 60)
    const ageMins = Math.round(ageMs / (1000 * 60))

    if (ageHours >= 2) {
      const hDisplay = Math.floor(ageHours)
      return { type: 'stale', text: `Last reported ${hDisplay}h ago` }
    }

    return {
      type: 'fresh',
      text: `~${active_players_now} players on-site · ${crowd_report_count} report${crowd_report_count !== 1 ? 's' : ''} · Updated ${ageMins}m ago`,
      count: active_players_now,
    }
  }

  return { type: 'none', text: 'No reports yet today' }
}

// For mock data we simulate different crowd states
const NOW = new Date().toISOString()
const FRESH_45M_AGO = new Date(Date.now() - 45 * 60 * 1000).toISOString()
const STALE_3H_AGO = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()

export const FIELDS = [
  {
    id: '1',
    name: "Sgt. Splatter's Project Paintball",
    address: '54 Wingold Avenue',
    city: 'Toronto',
    province: 'ON',
    lat: 43.6934,
    lng: -79.4445,
    phone: '(416) 781-0991',
    website: 'sgtsplatters.com',
    description:
      "Canada's largest indoor paintball facility — a 35,000 sq ft two-storey urban war zone of buildings and abandoned vehicles in the heart of Toronto. Designed by a Hollywood set designer. 20 different game scenarios. Walk-ins welcome.",
    field_types: ['Indoor', 'Speedball'],
    num_fields: 4,
    typical_capacity: 80,
    active_players_now: 43,
    crowd_report_count: 7,
    crowd_report_last_updated: FRESH_45M_AGO,
    rentals_available: true,
    rental_pricing: 'Marker, mask and coverall included in session fee',
    pricing: '$35–60 per session',
    hours: {
      Mon: '12pm–10pm',
      Tue: '12pm–10pm',
      Wed: '12pm–10pm',
      Thu: '12pm–10pm',
      Fri: '9am–12am',
      Sat: '9am–12am',
      Sun: '9am–12am',
    },
    seasonal_start: null,
    seasonal_end: null,
    weather_status: 'open',
    listing_status: 'published',
    rating: 4.7,
    review_count: 312,
    distance_km: 4.2,
    walk_ins: true,
    today_hours: '9am–12am',
    events: [
      {
        id: 'e1',
        title: 'Big Game: Urban Assault',
        event_type: 'big_game',
        date: '2026-06-14',
        display_date: 'Sun Jun 14',
        start_time: '10am',
        end_time: '4pm',
        price: 55,
        capacity: 80,
        spots_remaining: 43,
      },
      {
        id: 'e2',
        title: 'Walk-on Saturday',
        event_type: 'walk_on',
        date: '2026-06-21',
        display_date: 'Sat Jun 21',
        start_time: '9am',
        end_time: '5pm',
        price: 40,
        capacity: 60,
        spots_remaining: 60,
      },
    ],
  },
  {
    id: '2',
    name: 'Flag Raiders Paintball',
    address: '1450 Bishop St N',
    city: 'Cambridge',
    province: 'ON',
    lat: 43.4041,
    lng: -80.3467,
    phone: null,
    website: 'flagraiders.com',
    description:
      "A woodball destination with 14 playable fields across wooded terrain. Ontario's most field-diverse paintball park. Bring your own gear or rent on-site.",
    field_types: ['Woodball', 'Scenario', 'Speedball'],
    num_fields: 14,
    typical_capacity: 200,
    active_players_now: 87,
    crowd_report_count: 12,
    crowd_report_last_updated: FRESH_45M_AGO,
    rentals_available: true,
    rental_pricing: 'Full rental package available',
    pricing: '$30–55 per session',
    hours: {
      Mon: 'Closed',
      Tue: 'Closed',
      Wed: 'Closed',
      Thu: 'Closed',
      Fri: 'Closed',
      Sat: '9am–5pm',
      Sun: '9am–5pm',
    },
    seasonal_start: '2026-04-01',
    seasonal_end: '2026-10-31',
    weather_status: 'open',
    listing_status: 'published',
    rating: 4.5,
    review_count: 201,
    distance_km: 88.3,
    walk_ins: false,
    today_hours: '9am–5pm',
    events: [
      {
        id: 'e3',
        title: 'Operation Overlord — Big Game',
        event_type: 'big_game',
        date: '2026-06-14',
        display_date: 'Sun Jun 14',
        start_time: '9am',
        end_time: '5pm',
        price: 50,
        capacity: 200,
        spots_remaining: 87,
      },
    ],
  },
  {
    id: '3',
    name: 'Survival Tactics Outdoor Paintball',
    address: '5638 King Street',
    city: 'Caledon East',
    province: 'ON',
    lat: 43.8728,
    lng: -79.8599,
    phone: null,
    website: 'survivaltacticsinc.com',
    description:
      'Over 20 acres of play space — walk, crawl and run through forest and obstacle fields for a real battle experience. Ideal for birthday parties, bachelor parties and corporate events.',
    field_types: ['Woodball', 'Scenario'],
    num_fields: 6,
    typical_capacity: 120,
    active_players_now: null,
    crowd_report_count: 0,
    crowd_report_last_updated: null,
    rentals_available: true,
    rental_pricing: 'Full rental packages available',
    pricing: '$40–65 per session',
    hours: {
      Mon: 'Closed',
      Tue: 'Closed',
      Wed: 'Closed',
      Thu: 'Closed',
      Fri: 'Closed',
      Sat: '9am–5pm',
      Sun: '9am–5pm',
    },
    seasonal_start: '2026-05-01',
    seasonal_end: '2026-10-31',
    weather_status: 'open',
    listing_status: 'published',
    rating: 4.3,
    review_count: 88,
    distance_km: 41.6,
    walk_ins: false,
    today_hours: '9am–5pm',
    events: [],
  },
  {
    id: '4',
    name: 'Combat Pursuit Outdoor Paintball',
    address: '3765 North Road',
    city: 'Pickering',
    province: 'ON',
    lat: 43.8563,
    lng: -79.1875,
    phone: null,
    website: 'combatpursuit.com',
    description:
      "GTA's closest outdoor paintball park — only 15 minutes from Toronto city limits. Separate beginner and advanced games. Multiple unique outdoor playing fields. Also offers MicroBall low-impact and Airsoft.",
    field_types: ['Woodball', 'Scenario', 'Speedball'],
    num_fields: 8,
    typical_capacity: 150,
    active_players_now: 22,
    crowd_report_count: 3,
    crowd_report_last_updated: STALE_3H_AGO,
    rentals_available: true,
    rental_pricing: 'Full gear rental included in packages',
    pricing: '$45–70 per session',
    hours: {
      Mon: 'Closed',
      Tue: 'Closed',
      Wed: 'Closed',
      Thu: 'Closed',
      Fri: 'Closed',
      Sat: '9am–5pm',
      Sun: '9am–5pm',
    },
    seasonal_start: '2026-03-15',
    seasonal_end: '2026-11-15',
    weather_status: 'open',
    listing_status: 'published',
    rating: 4.4,
    review_count: 143,
    distance_km: 33.9,
    walk_ins: false,
    today_hours: '9am–5pm',
    events: [],
  },
  {
    id: '5',
    name: 'DMZ Paintball & Airsoft',
    address: '12 Export Rd Unit 3',
    city: 'St. Catharines',
    province: 'ON',
    lat: 43.1594,
    lng: -79.2469,
    phone: null,
    website: 'dmzpaintball.com',
    description:
      'Central to Niagara, located in St. Catharines. Open all year with both indoor and outdoor fields. Best pro shop in Niagara with over 300 paintball and airsoft guns in stock. Great for birthday parties and bachelor parties.',
    field_types: ['Woodball', 'Speedball', 'Scenario'],
    num_fields: 5,
    typical_capacity: 100,
    active_players_now: null,
    crowd_report_count: 0,
    crowd_report_last_updated: null,
    rentals_available: true,
    rental_pricing: 'Full rental packages and pro shop on site',
    pricing: '$35–55 per session',
    hours: {
      Mon: 'Closed',
      Tue: 'Closed',
      Wed: 'Closed',
      Thu: 'Closed',
      Fri: 'Closed',
      Sat: '9am–5pm',
      Sun: '9am–5pm',
    },
    seasonal_start: null,
    seasonal_end: null,
    weather_status: 'rain_delay',
    listing_status: 'published',
    rating: 4.1,
    review_count: 67,
    distance_km: 120.4,
    walk_ins: false,
    today_hours: null,
    events: [],
  },
]

// Mock owner field — Sgt. Splatter's (field id '1')
export const MOCK_OWNER = {
  id: 'owner-1',
  email: 'owner@sgtsplatters.com',
  role: 'owner',
  display_name: 'SS',
  field: FIELDS[0],
}

export const PENDING_FIELDS = [
  {
    id: 'p1',
    name: 'Hero Combat Zone',
    address: '123 Field Rd, Woodstock, ON',
    city: 'Woodstock',
    province: 'ON',
    phone: '(519) 555-0134',
    website: 'combatzone.ca',
    email: 'owner@combatzone.ca',
    field_types: ['Woodball', 'Scenario'],
    num_fields: 5,
    typical_capacity: 60,
    rentals_available: true,
    listing_status: 'pending',
    created_at: '2 hours ago',
    verifications: {
      address_geocoded: true,
      website_responds: true,
      photos_uploaded: false,
      hours_provided: true,
    },
  },
  {
    id: 'p2',
    name: 'Thunder Ridge Paintball',
    address: null,
    city: 'Barrie',
    province: 'ON',
    phone: null,
    website: null,
    email: 'info@thunderridge.ca',
    field_types: ['Speedball', 'Hyperball'],
    num_fields: 3,
    typical_capacity: null,
    rentals_available: false,
    listing_status: 'pending',
    created_at: '1 day ago',
    verifications: {
      address_geocoded: false,
      website_responds: false,
      photos_uploaded: false,
      hours_provided: false,
    },
  },
]

export const FILTER_CHIPS = ['All', 'Woodball', 'Speedball', 'Scenario', 'Hyperball', 'Indoor']

export const MOCK_OWNER_DASHBOARD = {
  display_name: 'CZ',
  field: {
    id: 'cz1',
    name: 'Combat Zone Paintball',
    address: '220 Industrial Pkwy',
    city: 'Aurora',
    province: 'ON',
    phone: '(905) 555-0220',
    website: 'combatzonepaintball.ca',
    field_types: ['Woodball', 'Scenario', 'Speedball'],
    num_fields: 7,
    rentals_available: true,
    rental_pricing: 'Markers + masks included in session fee',
    pricing: '$40–65 per session',
    weather_status: 'open',
    listing_number: '00018',
    approved_date: 'Apr 12, 2026',
    walk_ins: true,
    today_hours: '9am–5pm',
    active_players_now: null,
    crowd_report_count: 0,
    crowd_report_last_updated: null,
  },
  events: [
    { id: 'cz-e1', title: 'Operation Overlord — Big Game', date: '2026-06-14', day_label: 'Sat', start_time: '9am', end_time: '4pm', spots_remaining: 87 },
    { id: 'cz-e2', title: "Beginner's Day", date: '2026-06-21', day_label: 'Sat', start_time: '10am', end_time: '2pm', spots_remaining: 24 },
    { id: 'cz-e3', title: 'League Night #4', date: '2026-06-28', day_label: 'Wed', start_time: '7pm', end_time: null, spots_remaining: 12 },
  ],
  stats: {
    views: { value: 284, delta: '22%', up: true, label: 'Profile views this week' },
    saves: { value: 46, delta: '11%', up: true, label: 'Times saved' },
    calls: { value: 18, delta: '3', up: false, label: 'Calls to book' },
  },
}
