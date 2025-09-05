// Create this as src/app/components/ColorTest.tsx
'use client';

export default function ColorTest() {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Tailwind Color Test</h2>
      
      {/* Standard Tailwind colors (should work) */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Standard Colors (should work):</h3>
        <div className="w-20 h-10 bg-blue-500 text-white flex items-center justify-center">Blue</div>
        <div className="w-20 h-10 bg-green-500 text-white flex items-center justify-center">Green</div>
        <div className="w-20 h-10 bg-red-500 text-white flex items-center justify-center">Red</div>
      </div>

      {/* Custom brand colors (testing) */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Brand Colors (testing):</h3>
        <div className="w-20 h-10 bg-brand-green text-white flex items-center justify-center">Brand Green</div>
        <div className="w-20 h-10 bg-brand-blue text-white flex items-center justify-center">Brand Blue</div>
        <div className="w-20 h-10 bg-brand-green-dark text-white flex items-center justify-center">Green Dark</div>
      </div>

      {/* Text colors */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Text Colors (testing):</h3>
        <p className="text-brand-blue">This should be brand blue text</p>
        <p className="text-brand-green">This should be brand green text</p>
        <p className="text-brand-blue-dark">This should be brand blue dark text</p>
      </div>

      {/* CSS Variables as fallback */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">CSS Variable Fallback:</h3>
        <div 
          className="w-20 h-10 text-white flex items-center justify-center"
          style={{ backgroundColor: 'var(--brand-green)' }}
        >
          CSS Green
        </div>
        <div 
          className="w-20 h-10 text-white flex items-center justify-center"
          style={{ backgroundColor: 'var(--brand-blue)' }}
        >
          CSS Blue
        </div>
        <p style={{ color: 'var(--brand-blue)' }}>CSS variable blue text</p>
      </div>
    </div>
  );
}