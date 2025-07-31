'use client'

// Client Component for the CTA Section
export default function CTASection() {
  return (
    <section className="py-12 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Updated section with green-to-blue gradient - Simplified */}
        <div className="bg-gradient-to-br from-green-200 to-blue-200 p-12 lg:p-16 rounded-3xl shadow-lg relative overflow-hidden">
          {/* Main content - just the impact line */}
          <div className="text-center max-w-4xl mx-auto relative z-10 mb-12">
            {/* Subtle background accents */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#60A875]/10 to-[#59B1E3]/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-br from-[#59B1E3]/10 to-purple-400/10 rounded-full blur-xl"></div>
            
            {/* Impact line - larger and bold */}
            <p className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight relative z-10 mb-12" style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}>
              Simple ideas. Real results. For real people.
            </p>
          </div>

          {/* New 3-Button CTA Layout */}
          <div className="text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-6">
              {/* Today's Tidbit Button */}
              <button 
                onClick={() => window.location.href = '/day/today'}
                className="bg-[#60A875] text-white px-6 py-5 rounded-xl hover:bg-green-600 hover:scale-105 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center gap-2 font-semibold shadow-lg group min-h-[120px]"
              >
                <div className="text-3xl mb-1 group-hover:scale-110 group-hover:animate-pulse transition-all duration-300 drop-shadow-sm">🌺</div>
                <div className="text-lg font-bold">Today's Tidbit</div>
                <div className="text-sm opacity-90 flex items-center gap-2">
                  Jump into today's AI tip
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </div>
              </button>
              
              {/* Tidbit Library Button */}
              <button 
                onClick={() => window.location.href = '/TidbitLibrary'}
                className="bg-[#59B1E3] text-white px-6 py-5 rounded-xl hover:bg-blue-600 hover:scale-105 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center gap-2 font-semibold shadow-lg group min-h-[120px]"
              >
                <div className="text-3xl mb-1 group-hover:scale-110 group-hover:animate-pulse transition-all duration-300 drop-shadow-sm">🐚</div>
                <div className="text-lg font-bold">Tidbit Library</div>
                <div className="text-sm opacity-90 flex items-center gap-2">
                  Explore all past tips
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </div>
              </button>
              
              {/* BitBoard Button */}
              <button 
                onClick={() => window.location.href = '/bitboard'}
                className="bg-[#F5C26B] text-gray-800 px-6 py-5 rounded-xl hover:bg-yellow-500 hover:scale-105 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center gap-2 font-semibold shadow-lg group min-h-[120px]"
              >
                <div className="text-3xl mb-1 group-hover:scale-110 group-hover:animate-pulse transition-all duration-300 drop-shadow-sm">🌴</div>
                <div className="text-lg font-bold">BitBoard</div>
                <div className="text-sm opacity-80 flex items-center gap-2">
                  See what people are making
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </div>
              </button>
            </div>
            
            {/* New italic tagline */}
            <p className="text-gray-700 italic text-lg" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
              Feel the rhythm. Hit the keys.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}