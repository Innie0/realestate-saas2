// @ts-nocheck
// Property Lookup API route - Search for property owners and contact information
// POST: Look up a property by address using BatchData Skip Trace API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * POST handler - Look up property owner and contact info by address
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

    if (!city && !zip) {
      return NextResponse.json(
        { success: false, error: 'Either city or ZIP code is required' },
        { status: 400 }
      );
    }

    // Build the property address object for BatchData
    const propertyAddress: Record<string, string> = { street, state };
    if (city) propertyAddress.city = city;
    if (zip) propertyAddress.zip = zip;

    // Call BatchData Skip Trace API
    const batchDataApiKey = process.env.BATCH_SKIP_TRACING_API_KEY;
    if (!batchDataApiKey) {
      return NextResponse.json(
        { success: false, error: 'Skip tracing API key is not configured' },
        { status: 500 }
      );
    }

    const skipTraceResponse = await fetch('https://api.batchdata.com/api/v1/property/skip-trace', {
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
    });

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

    // Check if we got results
    const persons = skipTraceData?.results?.persons || [];
    const meta = skipTraceData?.results?.meta || {};

    if (persons.length === 0 || (meta.results && meta.results.matchCount === 0)) {
      return NextResponse.json({
        success: true,
        data: {
          found: false,
          message: 'No records found for this address. Please verify the address and try again.',
          searchedAddress: { street, city, state, zip },
        },
      });
    }

    // Format the results
    const formattedResults = persons.map((person: any) => {
      const propertyAddr = person.propertyAddress || person.property?.address || {};
      const ownerAddr = person.mailingAddress || person.property?.owner?.mailingAddress || {};
      const ownerName = person.name || person.property?.owner?.name || {};

      // Determine if the property is owner-occupied or rental
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

      return {
        // Owner info
        owner: {
          firstName: ownerName.first || '',
          lastName: ownerName.last || '',
          fullName: `${ownerName.first || ''} ${ownerName.last || ''}`.trim() || 'Unknown',
        },
        // Property address
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
        // Owner mailing address
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
        // Occupancy status
        occupancyStatus,
        // Contact info
        phoneNumbers,
        emails,
        // Flags
        isLitigator: person.litigator || false,
        bankruptcy: person.bankruptcy || {},
        dnc: person.dnc || {},
        involuntaryLien: person.involuntaryLien || {},
        // Match status
        matched: person.meta?.matched || false,
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
