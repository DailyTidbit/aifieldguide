// src/app/debug-cookies/page.tsx
'use client'

import React, { useState, useEffect } from 'react';

interface DiagnosticsState {
  mounted: boolean;
  localStorage: string | null;
  cookieConsent: string | null;
  timestamp: string | null;
  isExpired: boolean;
  needsConsent: boolean;
  browserType: string;
  consentKey: string;
  timestampKey: string;
}

interface TestResult {
  test: string;
  result: string;
  status: 'pass' | 'fail' | 'warn' | 'info';
}

const CookieDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState>({
    mounted: false,
    localStorage: null,
    cookieConsent: null,
    timestamp: null,
    isExpired: false,
    needsConsent: false,
    browserType: 'unknown',
    consentKey: 'dt_cookie_consent',
    timestampKey: 'dt_cookie_consent_ts'
  });

  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    setDiagnostics(prev => ({ ...prev, mounted: true }));
    runDiagnostics();
  }, []);

  const runDiagnostics = () => {
    const results: TestResult[] = [];
    
    try {
      // Check browser environment
      let isIncognito = false;
      try {
        isIncognito = !window.localStorage || !window.indexedDB;
      } catch (e) {
        isIncognito = true;
      }
      
      const browserType = isIncognito ? 'incognito/private' : 'normal';
      
      results.push({
        test: 'Browser Detection',
        result: browserType,
        status: 'info'
      });

      // Check localStorage availability
      let localStorageAvailable = false;
      try {
        const testKey = 'test_' + Date.now();
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        localStorageAvailable = true;
        results.push({
          test: 'localStorage Access',
          result: 'Available',
          status: 'pass'
        });
      } catch (e) {
        results.push({
          test: 'localStorage Access',
          result: `Blocked: ${e instanceof Error ? e.message : 'Unknown error'}`,
          status: 'fail'
        });
      }

      // Check current consent values
      if (localStorageAvailable) {
        const consent = localStorage.getItem('dt_cookie_consent');
        const timestamp = localStorage.getItem('dt_cookie_consent_ts');
        
        results.push({
          test: 'Consent Value',
          result: consent || 'null',
          status: consent ? 'info' : 'warn'
        });

        results.push({
          test: 'Consent Timestamp',
          result: timestamp ? new Date(parseInt(timestamp)).toLocaleString() : 'null',
          status: timestamp ? 'info' : 'warn'
        });

        // Check expiry
        if (timestamp) {
          const age = Date.now() - parseInt(timestamp);
          const maxAge = 180 * 24 * 60 * 60 * 1000; // 180 days
          const isExpired = age > maxAge;
          
          results.push({
            test: 'Consent Expired',
            result: isExpired ? 'Yes' : 'No',
            status: isExpired ? 'warn' : 'pass'
          });
        }

        // Update diagnostics state
        setDiagnostics(prev => ({
          ...prev,
          localStorage: consent,
          timestamp: timestamp,
          browserType: browserType,
          isExpired: timestamp ? (Date.now() - parseInt(timestamp)) > (180 * 24 * 60 * 60 * 1000) : true,
          needsConsent: !consent || (timestamp ? (Date.now() - parseInt(timestamp)) > (180 * 24 * 60 * 60 * 1000) : true)
        }));
      }

      // Check for gtag
      const gtagAvailable = typeof window !== 'undefined' && typeof (window as any).gtag === 'function';
      results.push({
        test: 'Google Analytics (gtag)',
        result: gtagAvailable ? 'Available' : 'Not loaded',
        status: gtagAvailable ? 'pass' : 'warn'
      });

      // Check for dataLayer
      const dataLayerAvailable = typeof window !== 'undefined' && Array.isArray((window as any).dataLayer);
      results.push({
        test: 'Google dataLayer',
        result: dataLayerAvailable ? `${(window as any).dataLayer?.length || 0} items` : 'Not available',
        status: dataLayerAvailable ? 'pass' : 'warn'
      });

      setTestResults(results);

    } catch (error) {
      results.push({
        test: 'Diagnostic Error',
        result: error instanceof Error ? error.message : 'Unknown error',
        status: 'fail'
      });
      setTestResults(results);
    }
  };

  const simulateConsent = (consentType: 'accept' | 'decline') => {
    try {
      const consentValue = consentType === 'accept' ? 'accepted' : 'declined';
      localStorage.setItem('dt_cookie_consent', consentValue);
      localStorage.setItem('dt_cookie_consent_ts', Date.now().toString());
      
      // Update gtag if available
      if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
        (window as any).gtag('consent', 'update', {
          analytics_storage: consentType === 'accept' ? 'granted' : 'denied'
        });
      }
      
      runDiagnostics();
    } catch (error) {
      alert(`Error setting consent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearConsent = () => {
    try {
      localStorage.removeItem('dt_cookie_consent');
      localStorage.removeItem('dt_cookie_consent_ts');
      runDiagnostics();
    } catch (error) {
      alert(`Error clearing consent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600';
      case 'fail': return 'text-red-600';
      case 'warn': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'warn': return '⚠️';
      default: return 'ℹ️';
    }
  };

  if (!diagnostics.mounted) {
    return <div className="p-6">Loading diagnostics...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cookie Consent Diagnostics</h1>
        <p className="text-gray-600">Debug your cookie consent system issues</p>
      </div>

      {/* Quick Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Browser Mode</div>
          <div className="text-xl font-semibold">{diagnostics.browserType}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Consent Status</div>
          <div className="text-xl font-semibold">{diagnostics.localStorage || 'None'}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Needs Banner</div>
          <div className="text-xl font-semibold">{diagnostics.needsConsent ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* Test Results */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Diagnostic Tests</h2>
        <div className="space-y-2">
          {testResults.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getStatusIcon(test.status)}</span>
                <span className="font-medium">{test.test}</span>
              </div>
              <span className={`font-mono text-sm ${getStatusColor(test.status)}`}>
                {test.result}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Controls</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => simulateConsent('accept')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Simulate Accept
          </button>
          <button
            onClick={() => simulateConsent('decline')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Simulate Decline
          </button>
          <button
            onClick={clearConsent}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Clear Consent
          </button>
          <button
            onClick={runDiagnostics}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Refresh Tests
          </button>
        </div>
      </div>

      {/* Common Issues */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-yellow-800 mb-3">Common Issues & Solutions</h3>
        <div className="space-y-3 text-sm">
          <div>
            <strong className="text-yellow-800">Incognito/Private Mode:</strong> localStorage may be blocked or cleared on page refresh. This is normal browser behavior.
          </div>
          <div>
            <strong className="text-yellow-800">Buttons Not Appearing:</strong> Check if CookieConsent component is properly mounted and consent state is correctly detected.
          </div>
          <div>
            <strong className="text-yellow-800">Essential Only Not Working:</strong> Verify the setConsent function is properly updating localStorage and triggering re-renders.
          </div>
          <div>
            <strong className="text-yellow-800">Hydration Mismatch:</strong> Server-side render assumes no consent, client-side finds existing consent. Use proper mount checks.
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DebugCookiesPage() {
  return <CookieDiagnostics />;
}