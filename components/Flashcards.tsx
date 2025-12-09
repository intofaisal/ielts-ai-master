import React, { useState } from 'react';
import { Flashcard } from '../types';
import { RefreshCcw, Check, Brain } from 'lucide-react';

interface FlashcardsProps {
  cards: Flashcard[];
}

export const Flashcards: React.FC<FlashcardsProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Brain size={48} className="mb-4 text-indigo-200" />
        <p>No flashcards yet. Start a Reading Test and highlight words to add them!</p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 h-full flex flex-col justify-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Vocabulary Review</h2>
      
      <div className="relative h-96 w-full perspective-1000 group">
        <div 
          className={`relative w-full h-full text-center transition-all duration-500 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front */}
          <div 
            className="absolute w-full h-full backface-hidden bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 border-t-4 border-indigo-500"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-8">Word</span>
            <h3 className="text-4xl font-serif font-bold text-gray-800 mb-6">{currentCard.word}</h3>
            <div className="bg-indigo-50 p-4 rounded-lg text-indigo-800 italic text-lg">
              "{currentCard.originalSentence}"
            </div>
            <p className="absolute bottom-6 text-xs text-gray-400">Click to flip</p>
          </div>

          {/* Back */}
          <div 
            className="absolute w-full h-full backface-hidden bg-indigo-600 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 text-white rotate-y-180"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-sm text-indigo-200 uppercase tracking-widest font-bold mb-4">Definition</span>
            <p className="text-2xl font-medium leading-relaxed">{currentCard.definition}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center space-x-4">
        <button 
          onClick={handleNext}
          className="flex items-center px-6 py-3 bg-white border border-gray-200 shadow-sm rounded-full text-gray-600 hover:bg-gray-50 font-medium transition"
        >
          <RefreshCcw size={18} className="mr-2" />
          Skip
        </button>
        <button 
          onClick={handleNext}
          className="flex items-center px-8 py-3 bg-indigo-600 shadow-lg rounded-full text-white hover:bg-indigo-700 font-bold transition transform hover:scale-105"
        >
          <Check size={18} className="mr-2" />
          Got it
        </button>
      </div>
      
      <p className="text-center text-gray-400 mt-6 text-sm">
        Card {currentIndex + 1} of {cards.length}
      </p>
    </div>
  );
};
