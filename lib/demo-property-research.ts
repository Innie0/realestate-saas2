/**
 * Sanitized demo data for marketing addresses (e.g. 123 Main St, Austin, TX).
 * Never calls Rentcast/BatchData — no real owner PII is returned.
 */

import { calculateCma, type CompRecord, type SubjectProperty } from '@/lib/cma';

const DEMO_OWNER = {
  firstName: 'James',
  lastName: 'Mitchell',
  fullName: 'James R. Mitchell',
  email: 'james.mitchell@example.com',
  phone: '(555) 555-0101',
  rawPhone: '5555550101',
};

const DEMO_SUBJECT: SubjectProperty = {
  bedrooms: 4,
  bathrooms: 3,
  squareFootage: 3500,
  lotSize: 18295,
  yearBuilt: 2008,
  condition: 'average',
  hasPool: false,
  garageSpaces: 2,
};

const DEMO_SUBJECT_COORDS = { latitude: 30.2672, longitude: -97.7431 };

const DEMO_COMPS: CompRecord[] = [
  {
    address: '118 W Main St, Austin, TX 78701',
    propertyType: 'Single Family',
    price: 498_000,
    bedrooms: 4,
    bathrooms: 3,
    squareFootage: 3420,
    pricePerSqft: 146,
    daysOnMarket: 28,
    soldDate: new Date(Date.now() - 120 * 86_400_000).toISOString().slice(0, 10),
    distance: 0.2,
    latitude: 30.2684,
    longitude: -97.7448,
  },
  {
    address: '131 Oak Ln, Austin, TX 78701',
    propertyType: 'Single Family',
    price: 512_000,
    bedrooms: 4,
    bathrooms: 3,
    squareFootage: 3680,
    pricePerSqft: 139,
    daysOnMarket: 19,
    soldDate: new Date(Date.now() - 95 * 86_400_000).toISOString().slice(0, 10),
    distance: 0.4,
    latitude: 30.2651,
    longitude: -97.7408,
  },
  {
    address: '99 Elm Ct, Austin, TX 78701',
    propertyType: 'Single Family',
    price: 475_000,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 3290,
    pricePerSqft: 144,
    daysOnMarket: 41,
    soldDate: new Date(Date.now() - 200 * 86_400_000).toISOString().slice(0, 10),
    distance: 0.5,
    latitude: 30.2692,
    longitude: -97.7462,
  },
];

function normalizeStreet(street: string): string {
  return street
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True for the marketing demo address (123 Main/W Main, Austin TX). */
export function isDemoMarketingAddress(parts: {
  street: string;
  city?: string;
  state: string;
  zip?: string;
}): boolean {
  const street = normalizeStreet(parts.street);
  const city = (parts.city ?? '').toLowerCase().trim();
  const state = parts.state.toLowerCase().replace(/\./g, '').trim();

  const is123Main =
    /\b123\b/.test(street) &&
    (/\bmain\b/.test(street) || street.includes('main'));

  const isAustin = !city || city.includes('austin');
  const isTexas = state === 'tx' || state === 'texas';

  return is123Main && isAustin && isTexas;
}

function formattedAddress(street: string, city: string, state: string, zip: string) {
  const line = [street, city, state].filter(Boolean).join(', ');
  return zip ? `${line} ${zip}` : line;
}

export function getDemoPropertyLookupResponse(parts: {
  street: string;
  city?: string;
  state: string;
  zip?: string;
}) {
  const city = parts.city?.trim() || 'Austin';
  const zip = parts.zip?.trim() || '78701';
  const formatted = formattedAddress(parts.street, city, parts.state, zip);

  return {
    found: true,
    isDemo: true,
    results: [
      {
        owner: {
          firstName: DEMO_OWNER.firstName,
          lastName: DEMO_OWNER.lastName,
          fullName: DEMO_OWNER.fullName,
          type: 'Individual',
        },
        propertyAddress: {
          street: parts.street,
          city,
          state: parts.state,
          zip,
          county: 'Travis',
          latitude: 30.2672,
          longitude: -97.7431,
          formatted,
        },
        mailingAddress: {
          street: '456 Demo Lane',
          city: 'Austin',
          state: 'TX',
          zip: '78704',
          formatted: '456 Demo Lane, Austin, TX 78704',
        },
        occupancyStatus: 'Owner-Occupied',
        phoneNumbers: [
          {
            number: DEMO_OWNER.phone,
            rawNumber: DEMO_OWNER.rawPhone,
            type: 'Mobile',
            carrier: 'Demo Carrier',
            tested: true,
            reachable: true,
            score: '100',
            tcpa: false,
            dnc: false,
          },
        ],
        emails: [{ email: DEMO_OWNER.email }],
        isLitigator: false,
        bankruptcy: {},
        dnc: {},
        involuntaryLien: {},
        matched: true,
        propertyDetails: {
          yearBuilt: DEMO_SUBJECT.yearBuilt,
          squareFootage: DEMO_SUBJECT.squareFootage,
          bedrooms: DEMO_SUBJECT.bedrooms,
          bathrooms: DEMO_SUBJECT.bathrooms,
          lotSize: '0.42 ac',
          assessedValue: 1_425_000,
          landValue: 520_000,
          improvementValue: 905_000,
          lastSaleDate: '2019-06-14',
          lastSalePrice: 1_280_000,
          legalDescription: 'LOT 12 BLK A DEMO SUBDIVISION (SAMPLE DATA)',
          ownerName: DEMO_OWNER.fullName,
          ownerAddress: '456 Demo Lane, Austin, TX 78704',
          propertyType: 'Single Family',
          subdivision: 'Demo Heights',
          zoning: 'SF-3',
          hoaFee: null,
          features: { garageSpaces: 2, pool: false },
          saleHistory: [
            { date: '2019-06-14', price: 1_280_000 },
            { date: '2012-03-02', price: 895_000 },
          ],
        },
        activeListing: null,
        recentlySold: null,
        dataSource: 'demo_marketing',
      },
    ],
    searchedAddress: { street: parts.street, city, state: parts.state, zip },
    meta: { requestCount: 1, matchCount: 1, demo: true },
  };
}

export function getDemoMarketPrefillResponse(parts: {
  street: string;
  city?: string;
  state: string;
  zip?: string;
}) {
  const city = parts.city?.trim() || 'Austin';
  const zip = parts.zip?.trim() || '78701';
  const address = formattedAddress(parts.street, city, parts.state, zip);

  return {
    address,
    subject: { ...DEMO_SUBJECT },
    subjectEnrichment: {
      hasPool: 'default' as const,
      garageSpaces: 'default' as const,
      condition: 'default' as const,
    },
    propertyType: 'Single Family',
    formattedAddress: address,
    isDemo: true,
  };
}

export function getDemoMarketAnalysisResponse(
  parts: {
    street: string;
    city?: string;
    state: string;
    zip?: string;
  },
  options: { radius?: number; yearsBack?: number; propertyType?: string } = {}
) {
  const city = parts.city?.trim() || 'Austin';
  const zip = parts.zip?.trim() || '78701';
  const address = formattedAddress(parts.street, city, parts.state, zip);
  const radius = options.radius ?? 0.5;
  const yearsBack = options.yearsBack ?? 1;

  const { scoredComps, valuation } = calculateCma(DEMO_SUBJECT, DEMO_COMPS);

  const summary =
    'Based on three recent sales within a half mile, comparable properties suggest a market range of ' +
    `$${(valuation.priceLow ?? 475_000).toLocaleString()}–$${(valuation.priceHigh ?? 512_000).toLocaleString()} ` +
    'for this subject. The demo subject is 3,500 sq ft with 4 beds and 3 baths; comps were adjusted for size and bed/bath differences. ' +
    '(Sample marketing data — not a live county or MLS pull.)';

  return {
    address,
    propertyType: options.propertyType || 'Single Family',
    radius,
    yearsBack,
    subject: { ...DEMO_SUBJECT },
    subjectLocation: { ...DEMO_SUBJECT_COORDS },
    subjectEnrichment: {
      hasPool: 'default' as const,
      garageSpaces: 'default' as const,
      condition: 'default' as const,
    },
    valuation,
    activeListing: null,
    compsFiltered: 0,
    avm: {
      estimatedValue: 1_500_000,
      valueLow: 1_420_000,
      valueHigh: 1_580_000,
      confidence: 12,
    },
    rentEstimate: {
      monthlyRent: 4_200,
      rentLow: 3_900,
      rentHigh: 4_500,
    },
    comps: scoredComps,
    summary,
    queriedAt: new Date().toISOString(),
    isDemo: true,
  };
}
