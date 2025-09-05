'use client';

import { useMounted } from '../lib/clientUtils';

function ColorTestSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="flex gap-4">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="w-20 h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ColorTestClient() {
  const mounted = useMounted();

  // MANDATORY: Show skeleton until mounted
  if (!mounted) {
    return <ColorTestSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Tailwind v4 Color Test</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          This page tests whether your custom brand colors are working with Tailwind v4. 
          If the brand colors don't show up, we'll know there's a configuration issue.
        </p>
      </div>

      {/* Standard Tailwind colors (should always work) */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Standard Tailwind Colors</h2>
        <p className="text-gray-600">These should always work - they're built into Tailwind:</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="w-full h-16 bg-blue-500 rounded-lg flex items-center justify-center text-white font-medium">
              Blue 500
            </div>
            <p className="text-sm text-center">bg-blue-500</p>
          </div>
          
          <div className="space-y-2">
            <div className="w-full h-16 bg-green-500 rounded-lg flex items-center justify-center text-white font-medium">
              Green 500
            </div>
            <p className="text-sm text-center">bg-green-500</p>
          </div>
          
          <div className="space-y-2">
            <div className="w-full h-16 bg-red-500 rounded-lg flex items-center justify-center text-white font-medium">
              Red 500
            </div>
            <p className="text-sm text-center">bg-red-500</p>
          </div>
          
          <div className="space-y-2">
            <div className="w-full h-16 bg-purple-500 rounded-lg flex items-center justify-center text-white font-medium">
              Purple 500
            </div>
            <p className="text-sm text-center">bg-purple-500</p>
          </div>
        </div>
      </section>

      {/* Custom brand colors (testing) */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Custom Brand Colors (Testing)</h2>
        <p className="text-gray-600">
          These are your custom brand colors. If they show up as the correct colors, Tailwind is working. 
          If they're gray or the wrong color, there's a config issue:
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="w-full h-16 bg-brand-green rounded-lg flex items-center justify-center text-white font-medium">
              Brand Green
            </div>
            <p className="text-sm text-center">
              bg-brand-green<br />
              <span className="text-xs text-gray-500">(Should be #60A875)</span>
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="w-full h-16 bg-brand-blue rounded-lg flex items-center justify-center text-white font-medium">
              Brand Blue
            </div>
            <p className="text-sm text-center">
              bg-brand-blue<br />
              <span className="text-xs text-gray-500">(Should be #59B1E3)</span>
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="w-full h-16 bg-brand-green-dark rounded-lg flex items-center justify-center text-white font-medium">
              Green Dark
            </div>
            <p className="text-sm text-center">
              bg-brand-green-dark<br />
              <span className="text-xs text-gray-500">(Should be #4e8e61)</span>
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="w-full h-16 bg-brand-blue-dark rounded-lg flex items-center justify-center text-white font-medium">
              Blue Dark
            </div>
            <p className="text-sm text-center">
              bg-brand-blue-dark<br />
              <span className="text-xs text-gray-500">(Should be #4791bf)</span>
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="w-full h-16 bg-brand-green-light rounded-lg flex items-center justify-center text-white font-medium">
              Green Light
            </div>
            <p className="text-sm text-center">
              bg-brand-green-light<br />
              <span className="text-xs text-gray-500">(Should be #7bc190)</span>
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="w-full h-16 bg-brand-blue-light rounded-lg flex items-center justify-center text-white font-medium">
              Blue Light
            </div>
            <p className="text-sm text-center">
              bg-brand-blue-light<br />
              <span className="text-xs text-gray-500">(Should be #7cc4eb)</span>
            </p>
          </div>
        </div>
      </section>

      {/* Text colors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Text Colors</h2>
        <p className="text-gray-600">Testing text color classes:</p>
        
        <div className="space-y-3 text-lg">
          <p className="text-brand-blue font-medium">
            This text should be brand blue (#59B1E3) - class: text-brand-blue
          </p>
          <p className="text-brand-green font-medium">
            This text should be brand green (#60A875) - class: text-brand-green
          </p>
          <p className="text-brand-blue-dark font-medium">
            This text should be dark blue (#4791bf) - class: text-brand-blue-dark
          </p>
          <p className="text-brand-green-dark font-medium">
            This text should be dark green (#4e8e61) - class: text-brand-green-dark
          </p>
        </div>
      </section>

      {/* Border colors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Border Colors</h2>
        <p className="text-gray-600">Testing border color classes:</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border-2 border-brand-green rounded-lg">
            <p className="font-medium">Border Brand Green</p>
            <p className="text-sm text-gray-600">border-brand-green</p>
          </div>
          <div className="p-4 border-2 border-brand-blue rounded-lg">
            <p className="font-medium">Border Brand Blue</p>
            <p className="text-sm text-gray-600">border-brand-blue</p>
          </div>
        </div>
      </section>

      {/* CSS Variables Fallback */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">CSS Variables Fallback</h2>
        <p className="text-gray-600">
          These use CSS variables directly and should always work since they're defined in globals.css:
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <div 
            className="w-full h-16 rounded-lg flex items-center justify-center text-white font-medium"
            style={{ backgroundColor: 'var(--brand-green)' }}
          >
            CSS Var Green
          </div>
          <div 
            className="w-full h-16 rounded-lg flex items-center justify-center text-white font-medium"
            style={{ backgroundColor: 'var(--brand-blue)' }}
          >
            CSS Var Blue
          </div>
        </div>
        
        <div className="space-y-2">
          <p style={{ color: 'var(--brand-blue)' }} className="text-lg font-medium">
            CSS variable blue text (should always work)
          </p>
          <p style={{ color: 'var(--brand-green)' }} className="text-lg font-medium">
            CSS variable green text (should always work)
          </p>
        </div>
      </section>

      {/* Hover effects */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Hover Effects</h2>
        <p className="text-gray-600">Testing hover state classes:</p>
        
        <div className="grid grid-cols-2 gap-4">
          <button className="p-4 bg-gray-200 hover:bg-brand-green hover:text-white rounded-lg transition-colors font-medium">
            Hover for Brand Green
            <span className="block text-sm opacity-75">hover:bg-brand-green</span>
          </button>
          <button className="p-4 bg-gray-200 hover:bg-brand-blue hover:text-white rounded-lg transition-colors font-medium">
            Hover for Brand Blue
            <span className="block text-sm opacity-75">hover:bg-brand-blue</span>
          </button>
        </div>
      </section>

      {/* Results summary */}
      <section className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">What This Tells Us</h2>
        <div className="space-y-2 text-gray-700">
          <p><strong>If standard colors work but brand colors don't:</strong> There's an issue with your tailwind.config.js or Tailwind isn't reading your custom colors.</p>
          <p><strong>If CSS variables work but Tailwind classes don't:</strong> The config isn't properly connected to Tailwind's class generation.</p>
          <p><strong>If nothing works:</strong> There might be a fundamental build or PostCSS issue.</p>
          <p><strong>If everything works:</strong> Your Tailwind v4 setup is perfect!</p>
        </div>
      </section>
    </div>
  );
}