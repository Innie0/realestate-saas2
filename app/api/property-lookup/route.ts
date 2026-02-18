// @ts-nocheck
// Property Lookup API route - Search for property owners and contact information
// Calls both RapidAPI (property details) and BatchData (skip trace/contact info) in parallel

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * Call RapidAPI Property Records Search to get property details by address.
 * Non-fatal — if it fails, BatchData results are still returned.
 */
async function fetchPropertyByAddress(street: string, city: string, state: string, zip: string) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_PROPERTY_HOST;

  if (!rapidApiKey || !rapidApiHost) {
    console.warn('RapidAPI credentials not set, skipping property detail lookup');
    return null;
  }

  // Try two common endpoint patterns for property records APIs on RapidAPI
  const buildParams = () => {
    const params = new URLSearchParams({ address: street });
    if (city) params.append('city', city);
    if (state) params.append('state', state);
    if (zip) params.append('zip', zip);
    return params.toString();
  };

  const endpoints = [
    `https://${rapidApiHost}/search?${buildParams()}`,
    `https://${rapidApiHost}/SearchProperties?${buildParams()}`,
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': rapidApiHost,
          'x-rapidapi-key': rapidApiKey,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('RapidAPI success | url:', url, '| top-level keys:', Object.keys(data || {}));
        return data;
      } else {
        const errText = await response.text().catch(() => '');
        console.warn(`RapidAPI ${url} → ${response.status}: ${errText.slice(0, 200)}`);
      }
    } catch (err) {
      console.warn(`RapidAPI ${url} threw:`, err);
    }
  }

  return null;
}

/**
 * Extract structured property details from RapidAPI response.
 * Handles various field naming conventions across providers.
 */
function extractPropertyDetails(rapidApiData: any) {
  if (!rapidApiData) return null;

  try {
    // Handle array responses or nested result objects
    const results =
      rapidApiData?.results ||
      rapidApiData?.data ||
      rapidApiData?.persons ||
      rapidApiData?.records ||
      rapidApiData?.properties ||
      [];

    const firstResult = Array.isArray(results) && results.length > 0 ? results[0] : rapidApiData;

    if (!firstResult || typeof firstResult !== 'object') return null;

    const pick = (...keys: string[]) => {
      for (const k of keys) {
        const val = firstResult[k];
        if (val !== undefined && val !== null && val !== '') return val;
      }
      return null;
    };

    return {
      yearBuilt:        pick('yearBuilt', 'year_built', 'YearBuilt', 'built_year'),
      squareFootage:    pick('squareFootage', 'square_feet', 'SquareFootage', 'sqft', 'living_sqft'),
      bedrooms:         pick('bedrooms', 'beds', 'Bedrooms', 'bed_count'),
      bathrooms:        pick('bathrooms', 'baths', 'Bathrooms', 'bath_count'),
      lotSize:          pick('lotSize', 'lot_size', 'LotSize', 'acres', 'lot_acres', 'lot_sqft'),
      assessedValue:    pick('assessedValue', 'assessed_value', 'AssessedValue', 'total_assessed_value'),
      landValue:        pick('landValue', 'land_value', 'LandValue', 'assessed_land_value'),
      improvementValue: pick('improvementValue', 'improvement_value', 'ImprovementValue', 'assessed_improvement_value'),
      lastSaleDate:     pick('lastSaleDate', 'last_sale_date', 'SaleDate', 'saleDate', 'sale_date'),
      lastSalePrice:    pick('lastSalePrice', 'last_sale_price', 'SalePrice', 'salePrice', 'sale_price'),
      legalDescription: pick('legalDescription', 'legal_description', 'LegalDescription', 'legal_desc'),
      ownerName:        pick('ownerName', 'owner_name', 'Owner', 'owner', 'owner1_name'),
      ownerAddress:     pick('ownerAddress', 'owner_address', 'OwnerAddress', 'owner_mailing_address'),
      propertyType:     pick('propertyType', 'property_type', 'PropertyType', 'land_use', 'use_code'),
    };
  } catch {
    return null;
  }
}

/**
 * POST handler - Look up property owner and contact info by address
 * Calls BatchData (skip trace/contacts) and RapidAPI (property details) in parallel
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { street, city, state, zip } = body;

    if (!street) {
      return NextResponse.json(
        { success: false, error: 'Street address is required' },
        { status: 400 }
      );
    }

    if (!state) {
      return NextResponse.json(
        { success: false, error: 'State is required' },
        { status: 400 }
      );
    }

    // Build the property address object for BatchData
    const propertyAddress: Record<string, string> = { street, state };
    if (city) propertyAddress.city = city;
    if (zip) propertyAddress.zip = zip;

    const batchDataApiKey = process.env.BATCH_SKIP_TRACING_API_KEY;
    if (!batchDataApiKey) {
      return NextResponse.json(
        { success: false, error: 'Skip tracing API key is not configured' },
        { status: 500 }
      );
    }

    // Call BatchData and RapidAPI simultaneously for speed
    const [skipTraceResponse, rapidApiData] = await Promise.all([
      fetch('https://api.batchdata.com/api/v1/property/skip-trace', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${batchDataApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ propertyAddress }],
          options: {
            includeTCPABlacklistedPhones: true,
            prioritizeMobilePhones: true,
          },
        }),
      }),
      fetchPropertyByAddress(street, city, state, zip),
    ]);

    // Handle BatchData errors
    if (!skipTraceResponse.ok) {
      const errorText = await skipTraceResponse.text();
      console.error('BatchData API error:', skipTraceResponse.status, errorText);

      if (skipTraceResponse.status === 401 || skipTraceResponse.status === 403) {
        return NextResponse.json(
          { success: false, error: 'API authentication failed. Please check your API key.' },
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

    // Extract property details from RapidAPI (may be null if API unavailable)
    const propertyDetails = extractPropertyDetails(rapidApiData);
    console.log('RapidAPI property details extracted:', propertyDetails ? 'yes' : 'none');

    if (persons.length === 0 || (meta.results && meta.results.matchCount === 0)) {
      return NextResponse.json({
        success: true,
        data: {
          found: false,
          message: 'No records found for this address. Please verify the address and try again.',
          searchedAddress: { street, city, state, zip },
          propertyDetails,
        },
      });
    }

    // Format the results — merge BatchData (contacts) + RapidAPI (property details)
    const formattedResults = persons.map((person: any) => {
      const propertyAddr = person.propertyAddress || person.property?.address || {};
      const ownerAddr = person.mailingAddress || person.property?.owner?.mailingAddress || {};
      const ownerName = person.name || person.property?.owner?.name || {};

      // Determine occupancy status
      const propertyStreet = (propertyAddr.streetNoUnit || propertyAddr.street || '').toLowerCase().trim();
      const mailingStreet = (ownerAddr.streetNoUnit || ownerAddr.street || '').toLowerCase().trim();
      const propertyZip = (propertyAddr.zip || '').trim();
      const mailingZip = (ownerAddr.zip || '').trim();

      let occupancyStatus = 'Unknown';
      if (propertyStreet && mailingStreet) {
        if (propertyStreet === mailingStreet && propertyZip === mailingZip) {
          occupancyStatus = 'Owner-Occupied';
        } else {
          occupancyStatus = 'Absentee Owner (Likely Rental)';
        }
      }

      // Format phone numbers
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

      // Format emails
      const emails = (person.emails || []).map((email: any) => ({
        email: email.email || email,
      }));

      // Use RapidAPI owner name to fill in if BatchData name is missing
      let ownerFullName = `${ownerName.first || ''} ${ownerName.last || ''}`.trim();
      if (!ownerFullName && propertyDetails?.ownerName) {
        ownerFullName = String(propertyDetails.ownerName);
      }

      return {
        owner: {
          firstName: ownerName.first || '',
          lastName: ownerName.last || '',
          fullName: ownerFullName || 'Unknown',
        },
        propertyAddress: {
          street: propertyAddr.street || propertyAddr.streetNoUnit || '',
          city: propertyAddr.city || '',
          state: propertyAddr.state || '',
          zip: propertyAddr.zip || '',
          county: propertyAddr.county || '',
          latitude: propertyAddr.latitude || null,
          longitude: propertyAddr.longitude || null,
          formatted: [
            propertyAddr.street || propertyAddr.streetNoUnit || '',
            propertyAddr.city || '',
            `${propertyAddr.state || ''} ${propertyAddr.zip || ''}`.trim(),
          ].filter(Boolean).join(', '),
        },
        mailingAddress: {
          street: ownerAddr.street || ownerAddr.streetNoUnit || '',
          city: ownerAddr.city || '',
          state: ownerAddr.state || '',
          zip: ownerAddr.zip || '',
          formatted: [
            ownerAddr.street || ownerAddr.streetNoUnit || '',
            ownerAddr.city || '',
            `${ownerAddr.state || ''} ${ownerAddr.zip || ''}`.trim(),
          ].filter(Boolean).join(', '),
        },
        occupancyStatus,
        phoneNumbers,
        emails,
        isLitigator: person.litigator || false,
        bankruptcy: person.bankruptcy || {},
        dnc: person.dnc || {},
        involuntaryLien: person.involuntaryLien || {},
        matched: person.meta?.matched || false,
        // Property details from RapidAPI (null if unavailable)
        propertyDetails: propertyDetails || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        found: true,
        results: formattedResults,
        searchedAddress: { street, city, state, zip },
        meta: {
          requestCount: meta.results?.requestCount || 1,
          matchCount: meta.results?.matchCount || formattedResults.length,
        },
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
