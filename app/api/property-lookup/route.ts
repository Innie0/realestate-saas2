// @ts-nocheck
// Property Lookup API route
// Step 1: Rentcast → verified owner name + property details (from county records)
// Step 2: BatchData skip trace → phone numbers & emails (using verified name for accuracy)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { checkUsageLimit, incrementUsage, usageLimitError } from '@/lib/usage';
import {
  getResearchCache,
  setResearchCache,
  normalizeAddressKey,
} from '@/lib/property-research-cache';
import {
  isDemoMarketingAddress,
  getDemoPropertyLookupResponse,
} from '@/lib/demo-property-research';

/**
 * Step 1: Call Rentcast to get verified owner name and property details.
 * Rentcast pulls directly from county assessor/recorder offices.
 */
async function fetchRentcastProperty(street: string, city: string, state: string, zip: string) {
  const rentcastKey = process.env.RENTCAST_API_KEY;
  if (!rentcastKey) {
    console.warn('RENTCAST_API_KEY not set');
    return null;
  }

  // Build full address string: "Street, City, State, Zip"
  const addressParts = [street];
  if (city) addressParts.push(city);
  addressParts.push(state);
  if (zip) addressParts.push(zip);
  const fullAddress = addressParts.join(', ');

  try {
    const params = new URLSearchParams({ address: fullAddress, limit: '1' });
    const url = `https://api.rentcast.io/v1/properties?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': rentcastKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`Rentcast returned ${response.status}: ${errText.slice(0, 300)}`);
      return null;
    }

    const data = await response.json();
    // Rentcast returns an array; we want the first (best) match
    const property = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (property) {
      console.log('Rentcast found property:', property.formattedAddress, '| Owner:', property.owner?.names?.[0]);
    }
    return property;
  } catch (err) {
    console.warn('Rentcast call failed (non-fatal):', err);
    return null;
  }
}

/**
 * Check Rentcast sale listings for an active or recent listing at this address.
 * Non-fatal — returns null if not found or API unavailable.
 */
async function fetchRentcastListing(street: string, city: string, state: string, zip: string) {
  const rentcastKey = process.env.RENTCAST_API_KEY;
  if (!rentcastKey) return null;

  const addressParts = [street];
  if (city) addressParts.push(city);
  addressParts.push(state);
  if (zip) addressParts.push(zip);
  const fullAddress = addressParts.join(', ');

  try {
    // Check for active listing first
    const params = new URLSearchParams({ address: fullAddress, status: 'Active', limit: '1' });
    const url = `https://api.rentcast.io/v1/listings/sale?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'X-Api-Key': rentcastKey, 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const listing = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (listing) {
      console.log('Rentcast active listing found:', listing.formattedAddress, '| Price:', listing.price);
    }
    return listing;
  } catch (err) {
    console.warn('Rentcast listing check failed (non-fatal):', err);
    return null;
  }
}

/**
 * Check Rentcast inactive listings to see if the property recently sold on MLS.
 * Non-fatal — returns null if not found or API unavailable.
 */
async function fetchRentcastRecentlySold(street: string, city: string, state: string, zip: string) {
  const rentcastKey = process.env.RENTCAST_API_KEY;
  if (!rentcastKey) return null;

  const addressParts = [street];
  if (city) addressParts.push(city);
  addressParts.push(state);
  if (zip) addressParts.push(zip);
  const fullAddress = addressParts.join(', ');

  try {
    const params = new URLSearchParams({ address: fullAddress, status: 'Inactive', limit: '1' });
    const url = `https://api.rentcast.io/v1/listings/sale?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'X-Api-Key': rentcastKey, 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const listing = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (listing) {
      console.log('Rentcast recently sold listing found:', listing.formattedAddress, '| Price:', listing.price);
    }
    return listing;
  } catch (err) {
    console.warn('Rentcast recently sold check failed (non-fatal):', err);
    return null;
  }
}

/**
 * Step 2: Call BatchData skip trace with a verified owner name + address.
 * Providing the name dramatically improves contact match accuracy.
 */
async function fetchBatchDataSkipTrace(
  propertyAddress: Record<string, string>,
  firstName?: string,
  lastName?: string
) {
  const batchDataApiKey = process.env.BATCH_SKIP_TRACING_API_KEY;
  if (!batchDataApiKey) return null;

  const requestPayload: any = { propertyAddress };
  if (firstName) requestPayload.firstName = firstName;
  if (lastName) requestPayload.lastName = lastName;

  const response = await fetch('https://api.batchdata.com/api/v1/property/skip-trace', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${batchDataApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      requests: [requestPayload],
      options: {
        includeTCPABlacklistedPhones: true,
        prioritizeMobilePhones: true,
      },
    }),
  });

  return response;
}

/**
 * Parse "First Last" or "FIRST LAST" into { firstName, lastName }.
 * Handles names like "JOHN DOE", "Mary Jane Watson", "LLC / CORP" names, etc.
 */
function parseOwnerName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: '', lastName: '' };

  // Skip corporate/LLC names — they won't match in skip trace
  const corporateKeywords = ['LLC', 'INC', 'CORP', 'TRUST', 'LP ', 'L.P', 'LTD', 'HOLDINGS', 'PROPERTIES', 'INVESTMENTS', 'REALTY', 'GROUP'];
  const upperName = fullName.toUpperCase();
  if (corporateKeywords.some(kw => upperName.includes(kw))) {
    return { firstName: '', lastName: fullName };
  }

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: '', lastName: parts[0] };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };
  // For 3+ part names, treat first word as first name, rest as last name
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * POST handler - Look up property owner and contact info by address
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { street, city, state, zip, forceRefresh } = body;

    if (!street) {
      return NextResponse.json({ success: false, error: 'Street address is required' }, { status: 400 });
    }
    if (!state) {
      return NextResponse.json({ success: false, error: 'State is required' }, { status: 400 });
    }

    const addressKey = normalizeAddressKey({ street, city, state, zip });
    const refresh = forceRefresh === true;

    if (isDemoMarketingAddress({ street, city, state, zip })) {
      const demoData = getDemoPropertyLookupResponse({ street, city, state, zip });
      await setResearchCache(supabase, user.id, 'property_lookup', addressKey, demoData);
      return NextResponse.json({ success: true, data: demoData, isDemo: true });
    }

    if (!refresh) {
      const cached = await getResearchCache<{ found: boolean; [key: string]: unknown }>(
        supabase,
        user.id,
        'property_lookup',
        addressKey
      );
      if (cached) {
        return NextResponse.json({ success: true, data: cached, fromCache: true });
      }
    }

    // Check usage limit (increment only after a successful lookup)
    const usage = await checkUsageLimit(supabase, user.id, 'property_lookups');
    if (!usage.allowed) {
      return NextResponse.json(
        { success: false, error: usageLimitError('property_lookups', usage.current, usage.limit, usage.plan) },
        { status: 403 }
      );
    }

    const recordLookupUsage = () => incrementUsage(supabase, user.id, 'property_lookups');

    const respondLookup = async (data: Record<string, unknown>) => {
      await setResearchCache(supabase, user.id, 'property_lookup', addressKey, data);
      return NextResponse.json({ success: true, data });
    };

    // ── STEP 1: Rentcast — property record + active listing + recently sold (in parallel) ─
    const [rentcastProperty, activeListing, recentlySoldListing] = await Promise.all([
      fetchRentcastProperty(street, city, state, zip),
      fetchRentcastListing(street, city, state, zip),
      fetchRentcastRecentlySold(street, city, state, zip),
    ]);

    // Extract owner name from Rentcast county records
    const rentcastOwnerName = rentcastProperty?.owner?.names?.[0] || null;
    const { firstName: parsedFirst, lastName: parsedLast } = rentcastOwnerName
      ? parseOwnerName(rentcastOwnerName)
      : { firstName: '', lastName: '' };

    // ── STEP 2: BatchData — skip trace using the verified owner name ───────────
    const propertyAddress: Record<string, string> = { street, state };
    if (city) propertyAddress.city = city;
    if (zip) propertyAddress.zip = zip;

    const batchDataApiKey = process.env.BATCH_SKIP_TRACING_API_KEY;
    if (!batchDataApiKey) {
      return NextResponse.json(
        { success: false, error: 'Skip tracing API is not configured' },
        { status: 500 }
      );
    }

    const skipTraceResponse = await fetchBatchDataSkipTrace(
      propertyAddress,
      parsedFirst || undefined,
      parsedLast || undefined
    );

    if (!skipTraceResponse) {
      return NextResponse.json(
        { success: false, error: 'Failed to connect to skip trace API' },
        { status: 500 }
      );
    }

    if (!skipTraceResponse.ok) {
      const errorText = await skipTraceResponse.text();
      console.error('BatchData API error:', skipTraceResponse.status, errorText);

      if (skipTraceResponse.status === 401 || skipTraceResponse.status === 403) {
        return NextResponse.json(
          { success: false, error: 'API authentication failed. Please check your BatchData API key.' },
          { status: 500 }
        );
      }
      if (skipTraceResponse.status === 402) {
        return NextResponse.json(
          { success: false, error: 'Insufficient API credits. Please add credits to your BatchData account.' },
          { status: 402 }
        );
      }
      if (skipTraceResponse.status === 429) {
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Failed to look up property. Please try again.' },
        { status: 500 }
      );
    }

    const skipTraceData = await skipTraceResponse.json();
    const persons = skipTraceData?.results?.persons || [];
    const meta = skipTraceData?.results?.meta || {};

    // If Rentcast found the property but BatchData found nothing,
    // still return property details with what we know from county records
    if (persons.length === 0 || (meta.results && meta.results.matchCount === 0)) {
      if (rentcastProperty) {
        // Return what we know from county records alone
        const ownerMailingAddr = rentcastProperty.owner?.mailingAddress;
        const latestTaxYear = rentcastProperty.taxAssessments
          ? Object.keys(rentcastProperty.taxAssessments).sort().pop()
          : null;
        const latestAssessment = latestTaxYear ? rentcastProperty.taxAssessments[latestTaxYear] : null;

        await recordLookupUsage();
        return respondLookup({
          found: true,
          results: [{
            owner: {
              firstName: parsedFirst,
              lastName: parsedLast,
              fullName: rentcastOwnerName || 'Unknown',
              type: rentcastProperty.owner?.type || 'Unknown',
            },
            propertyAddress: {
              street: rentcastProperty.addressLine1 || street,
              city: rentcastProperty.city || city,
              state: rentcastProperty.state || state,
              zip: rentcastProperty.zipCode || zip,
              county: rentcastProperty.county || '',
              latitude: rentcastProperty.latitude || null,
              longitude: rentcastProperty.longitude || null,
              formatted: rentcastProperty.formattedAddress || `${street}, ${city}, ${state} ${zip}`.trim(),
            },
            mailingAddress: ownerMailingAddr ? {
              street: ownerMailingAddr.addressLine1 || '',
              city: ownerMailingAddr.city || '',
              state: ownerMailingAddr.state || '',
              zip: ownerMailingAddr.zipCode || '',
              formatted: ownerMailingAddr.formattedAddress || '',
            } : { street: '', city: '', state: '', zip: '', formatted: '' },
            occupancyStatus: rentcastProperty.ownerOccupied === true
              ? 'Owner-Occupied'
              : rentcastProperty.ownerOccupied === false
                ? 'Absentee Owner (Likely Rental)'
                : 'Unknown',
            phoneNumbers: [],
            emails: [],
            isLitigator: false,
            bankruptcy: {},
            dnc: {},
            involuntaryLien: {},
            matched: true,
            propertyDetails: buildPropertyDetails(rentcastProperty, latestAssessment),
            activeListing: buildListingInfo(activeListing),
            recentlySold: buildListingInfo(recentlySoldListing),
            dataSource: 'county_records_only',
          }],
          searchedAddress: { street, city, state, zip },
          meta: { requestCount: 1, matchCount: 1 },
        });
      }

      return respondLookup({
        found: false,
        message: 'No records found for this address. Please verify the address and try again.',
        searchedAddress: { street, city, state, zip },
      });
    }

    // ── Build final merged results ─────────────────────────────────────────────
    const latestTaxYear = rentcastProperty?.taxAssessments
      ? Object.keys(rentcastProperty.taxAssessments).sort().pop()
      : null;
    const latestAssessment = latestTaxYear ? rentcastProperty.taxAssessments[latestTaxYear] : null;
    const propertyDetails = rentcastProperty ? buildPropertyDetails(rentcastProperty, latestAssessment) : null;

    const formattedResults = persons.map((person: any) => {
      const batchAddr = person.propertyAddress || person.property?.address || {};
      const batchMailAddr = person.mailingAddress || person.property?.owner?.mailingAddress || {};

      // Owner name comes exclusively from Rentcast (county records).
      // BatchData's guessed name is intentionally ignored.
      const ownerFullName = rentcastOwnerName || 'Not found in county records';
      const ownerFirst = parsedFirst;
      const ownerLast = parsedLast;

      // Prefer Rentcast occupancy (authoritative) over our address-comparison heuristic
      let occupancyStatus: string;
      if (rentcastProperty?.ownerOccupied === true) {
        occupancyStatus = 'Owner-Occupied';
      } else if (rentcastProperty?.ownerOccupied === false) {
        occupancyStatus = 'Absentee Owner (Likely Rental)';
      } else {
        // Fall back to address comparison
        const propStreet = (batchAddr.streetNoUnit || batchAddr.street || '').toLowerCase().trim();
        const mailStreet = (batchMailAddr.streetNoUnit || batchMailAddr.street || '').toLowerCase().trim();
        const propZip = (batchAddr.zip || '').trim();
        const mailZip = (batchMailAddr.zip || '').trim();
        occupancyStatus = (propStreet && mailStreet && propStreet === mailStreet && propZip === mailZip)
          ? 'Owner-Occupied'
          : 'Unknown';
      }

      const phoneNumbers = (person.phoneNumbers || []).map((phone: any) => ({
        number: phone.number ? phone.number.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : phone.number,
        rawNumber: phone.number,
        type: phone.type || 'Unknown',
        carrier: phone.carrier || 'Unknown',
        tested: phone.tested || false,
        reachable: phone.reachable || false,
        score: phone.score || '0',
        tcpa: phone.tcpa || false,
        dnc: phone.dnc || false,
      }));

      const emails = (person.emails || []).map((email: any) => ({
        email: email.email || email,
      }));

      // Use Rentcast address as the canonical property address
      const canonicalAddr = rentcastProperty ? {
        street: rentcastProperty.addressLine1 || batchAddr.street || street,
        city: rentcastProperty.city || batchAddr.city || city,
        state: rentcastProperty.state || batchAddr.state || state,
        zip: rentcastProperty.zipCode || batchAddr.zip || zip,
        county: rentcastProperty.county || batchAddr.county || '',
        latitude: rentcastProperty.latitude || batchAddr.latitude || null,
        longitude: rentcastProperty.longitude || batchAddr.longitude || null,
        formatted: rentcastProperty.formattedAddress || batchAddr.street || '',
      } : {
        street: batchAddr.street || batchAddr.streetNoUnit || '',
        city: batchAddr.city || '',
        state: batchAddr.state || '',
        zip: batchAddr.zip || '',
        county: batchAddr.county || '',
        latitude: batchAddr.latitude || null,
        longitude: batchAddr.longitude || null,
        formatted: [batchAddr.street || batchAddr.streetNoUnit || '', batchAddr.city || '', `${batchAddr.state || ''} ${batchAddr.zip || ''}`.trim()].filter(Boolean).join(', '),
      };

      const ownerMailingAddr = rentcastProperty?.owner?.mailingAddress;
      const canonicalMailAddr = ownerMailingAddr ? {
        street: ownerMailingAddr.addressLine1 || '',
        city: ownerMailingAddr.city || '',
        state: ownerMailingAddr.state || '',
        zip: ownerMailingAddr.zipCode || '',
        formatted: ownerMailingAddr.formattedAddress || '',
      } : {
        street: batchMailAddr.street || batchMailAddr.streetNoUnit || '',
        city: batchMailAddr.city || '',
        state: batchMailAddr.state || '',
        zip: batchMailAddr.zip || '',
        formatted: [batchMailAddr.street || batchMailAddr.streetNoUnit || '', batchMailAddr.city || '', `${batchMailAddr.state || ''} ${batchMailAddr.zip || ''}`.trim()].filter(Boolean).join(', '),
      };

      return {
        owner: {
          firstName: ownerFirst,
          lastName: ownerLast,
          fullName: ownerFullName,
          type: rentcastProperty?.owner?.type || 'Unknown',
        },
        propertyAddress: canonicalAddr,
        mailingAddress: canonicalMailAddr,
        occupancyStatus,
        phoneNumbers,
        emails,
        isLitigator: person.litigator || false,
        bankruptcy: person.bankruptcy || {},
        dnc: person.dnc || {},
        involuntaryLien: person.involuntaryLien || {},
        matched: person.meta?.matched || false,
        propertyDetails,
        activeListing: buildListingInfo(activeListing),
        recentlySold: buildListingInfo(recentlySoldListing),
        dataSource: 'county_records_and_skip_trace',
      };
    });

    await recordLookupUsage();
    return respondLookup({
      found: true,
      results: formattedResults,
      searchedAddress: { street, city, state, zip },
      meta: {
        requestCount: meta.results?.requestCount || 1,
        matchCount: meta.results?.matchCount || formattedResults.length,
      },
    });

  } catch (error) {
    console.error('Property lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Build a clean propertyDetails object from a Rentcast property record.
 */
function buildPropertyDetails(property: any, latestAssessment: any) {
  // Build sale history from the property's history object
  const saleHistory = property.history
    ? Object.values(property.history)
        .filter((entry: any) => entry.event === 'Sale')
        .map((entry: any) => ({
          date: entry.date
            ? new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : null,
          price: entry.price || null,
        }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return {
    yearBuilt: property.yearBuilt || null,
    squareFootage: property.squareFootage || null,
    bedrooms: property.bedrooms || null,
    bathrooms: property.bathrooms || null,
    lotSize: property.lotSize || null,
    assessedValue: latestAssessment?.value || null,
    landValue: latestAssessment?.land || null,
    improvementValue: latestAssessment?.improvements || null,
    lastSaleDate: property.lastSaleDate
      ? new Date(property.lastSaleDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : null,
    lastSalePrice: property.lastSalePrice || null,
    legalDescription: property.legalDescription || null,
    ownerName: property.owner?.names?.[0] || null,
    ownerAddress: property.owner?.mailingAddress?.formattedAddress || null,
    propertyType: property.propertyType || null,
    subdivision: property.subdivision || null,
    zoning: property.zoning || null,
    hoaFee: property.hoa?.fee || null,
    features: property.features || null,
    saleHistory,
  };
}

/**
 * Build a clean listing info object from a Rentcast active listing record.
 */
function buildListingInfo(listing: any) {
  if (!listing) return null;

  return {
    status: listing.status || 'Active',
    price: listing.price || null,
    listedDate: listing.listedDate
      ? new Date(listing.listedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : null,
    daysOnMarket: listing.daysOnMarket || null,
    listingType: listing.listingType || null,
    mlsNumber: listing.mlsNumber || null,
    listingAgent: listing.listingAgent
      ? {
          name: listing.listingAgent.name || null,
          phone: listing.listingAgent.phone
            ? listing.listingAgent.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
            : null,
          email: listing.listingAgent.email || null,
          website: listing.listingAgent.website || null,
        }
      : null,
    listingOffice: listing.listingOffice
      ? {
          name: listing.listingOffice.name || null,
          phone: listing.listingOffice.phone
            ? listing.listingOffice.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
            : null,
          email: listing.listingOffice.email || null,
        }
      : null,
  };
}
