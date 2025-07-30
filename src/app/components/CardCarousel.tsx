// components/CardCarousel.tsx
'use client'; // This component will handle client-side interactivity

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Import arrow icons

interface CardContent {
  title: string;
  description: string;
  linkText?: string;
  linkHref?: string;
  imageSrc?: string; // Optional image for the card
  imageAlt?: string;
}

interface CardCarouselProps {
  cards: CardContent[];
}

const CardCarousel: React.FC<CardCarouselProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextCard = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
  };

  const prevCard = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + cards.length) % cards.length);
  };

  if (cards.length === 0) {
    return null; // Or a placeholder if no cards are provided
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg shadow-lg bg-white p-6 sm:p-8 border border-gray-200">
      {/* Carousel Content Wrapper */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {cards.map((card, index) => (
          <div key={index} className="w-full flex-shrink-0">
            {/* Card Content */}
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              {card.imageSrc && (
                <div className="flex-shrink-0 w-full md:w-1/3 max-w-xs md:max-w-none">
                  <img
                    src={card.imageSrc}
                    alt={card.imageAlt || card.title}
                    className="w-full h-auto object-cover rounded-md shadow-sm"
                  />
                </div>
              )}
              <div className="flex-grow text-center md:text-left">
                <h2 className="heading-section text-brand-blue mb-2">
                  {card.title}
                </h2>
                <p className="body-medium text-gray-700 mb-4">
                  {card.description}
                </p>
                {card.linkHref && card.linkText && (
                  <a
                    href={card.linkHref}
                    className="inline-flex items-center text-brand-green hover:underline body-bold"
                  >
                    {card.linkText}
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      {cards.length > 1 && (
        <>
          <button
            onClick={prevCard}
            className="absolute top-1/2 left-2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-opacity-75"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={nextCard}
            className="absolute top-1/2 right-2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-opacity-75"
            aria-label="Next card"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </>
      )}

      {/* Pagination Dots (Optional) */}
      {cards.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {cards.map((_, index) => (
            <button
              key={index}
              className={`w-2.5 h-2.5 rounded-full ${
                index === currentIndex ? 'bg-brand-blue' : 'bg-gray-300'
              } hover:bg-brand-blue/70 transition-colors duration-200`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CardCarousel;