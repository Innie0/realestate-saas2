'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

/**
 * Auth Testing Page
 * Helps debug authentication issues
 */
export default function TestAuthPage() {
  const [clientAuth, setClientAuth] = useState<any>(null);
  const [serverAuth, setServerAuth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    
    // Check client-side auth
    const clientCheck = await fetch('/api/debug-auth').then(r => r.json());
    setServerAuth(clientCheck);
    
    // Check local storage
    const localStorageKeys = Object.keys(localStorage).filter(k => k.includes('supabase'));
    
    setClientAuth({
      localStorageKeys,
      cookies: document.cookie,
    });
    
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Authentication Test</h1>

      <div className="space-y-6">
        {/* Client-Side Check */}
        <Card>
          <h2 className="text-xl font-bold text-white mb-4">Client-Side</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-2 text-sm font-mono">
              <div>
                <strong>LocalStorage Keys:</strong>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                  {JSON.stringify(clientAuth?.localStorageKeys, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Cookies:</strong>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                  {clientAuth?.cookies || 'No cookies'}
                </pre>
              </div>
            </div>
          )}
        </Card>

        {/* Server-Side Check */}
        <Card>
          <h2 className="text-xl font-bold text-white mb-4">Server-Side (API Routes)</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-2 text-sm font-mono">
              <div>
                <strong>Authenticated:</strong>{' '}
                <span className={serverAuth?.debug?.authenticated ? 'text-green-600' : 'text-red-600'}>
                  {serverAuth?.debug?.authenticated ? '✅ YES' : '❌ NO'}
                </span>
              </div>
              {serverAuth?.debug?.user && (
                <div>
                  <strong>User:</strong>
                  <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                    {JSON.stringify(serverAuth.debug.user, null, 2)}
                  </pre>
                </div>
              )}
              {serverAuth?.debug?.authError && (
                <div>
                  <strong className="text-red-600">Error:</strong>
                  <pre className="mt-2 p-2 bg-red-50 rounded overflow-x-auto">
                    {serverAuth.debug.authError}
                  </pre>
                </div>
              )}
              <div>
                <strong>Supabase Cookies Found:</strong> {serverAuth?.debug?.supabaseCookies?.length || 0}
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                  {JSON.stringify(serverAuth?.debug?.supabaseCookies, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </Card>

        {/* Test API Call */}
        <Card>
          <h2 className="text-xl font-bold text-white mb-4">Test Client Creation</h2>
          <Button onClick={async () => {
            const result = await fetch('/api/clients', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: 'Test Client', email: 'test@test.com', phone: '555-1234' }),
            }).then(r => r.json());
            alert(JSON.stringify(result, null, 2));
          }}>
            Try Creating Test Client
          </Button>
        </Card>

        <div className="flex gap-4">
          <Button onClick={checkAuth} variant="outline">
            Refresh Check
          </Button>
          <Button onClick={() => {
            localStorage.clear();
            alert('LocalStorage cleared! Please sign out and sign in again.');
          }} variant="danger">
            Clear LocalStorage
          </Button>
        </div>
      </div>
    </div>
  );
}










