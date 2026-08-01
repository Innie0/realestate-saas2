'use client';

import { useEffect, useState } from 'react';

/** True only after the component has mounted — avoids SSR/client hydration mismatches. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
