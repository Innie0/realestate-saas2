'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { META_PIXEL_ID, NEW_SIGNUP_COOKIE, trackMetaEvent } from '@/lib/meta-pixel';

/**
 * Agents' public pages (lead forms, profiles, booking, open house sign-in) are
 * visited by the agent's own clients, not Oikaro's customers — they stay out
 * of Oikaro's ad tracking.
 */
const AGENT_PUBLIC_PREFIXES = ['/lead/', '/agent/', '/book/', '/open-house/'];

function isAgentPublicPage(pathname: string | null): boolean {
  return !!pathname && AGENT_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** PageView on client-side navigation (the base code already sends the first one). */
function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!isAgentPublicPage(pathname)) trackMetaEvent('PageView');
  }, [pathname, searchParams]);

  // Google sign-ups finish on the server, which leaves this cookie for us to report once
  useEffect(() => {
    if (!document.cookie.split('; ').some((c) => c.startsWith(`${NEW_SIGNUP_COOKIE}=`))) return;
    document.cookie = `${NEW_SIGNUP_COOKIE}=; Max-Age=0; path=/`;
    trackMetaEvent('CompleteRegistration');
  }, [pathname]);

  return null;
}

export default function MetaPixel() {
  const pathname = usePathname();
  // Decided in the browser: honors Global Privacy Control (a browser "don't track me" signal)
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
    if (!gpc && !isAgentPublicPage(pathname)) setAllowed(true);
    // Only the first page decides whether the pixel loads at all
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!META_PIXEL_ID || !allowed) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
      <Suspense fallback={null}>
        <RouteChangeTracker />
      </Suspense>
    </>
  );
}
