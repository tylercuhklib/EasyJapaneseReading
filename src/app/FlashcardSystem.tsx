import React, { useState } from "react";

interface Flashcard {
  word: string;
  reading: string;
  meaning: string;
}

interface FlashcardProps {
  cards: Flashcard[];
}

const FlashcardSystem: React.FC<FlashcardProps> = ({ cards }) => {
  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  if (cards.length === 0)
    return (
      <div className="my-8 flex flex-col items-center">
        <div className="bg-white/80 border border-gray-200 rounded-xl shadow p-6 w-80 text-center text-gray-400">
          No flashcards available.
        </div>
      </div>
    );

  const nextCard = () => {
    setShowAnswer(false);
    setCurrent((prev) => (prev + 1) % cards.length);
  };
  const prevCard = () => {
    setShowAnswer(false);
    setCurrent((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const card = cards[current];

  return (
    <div className="flex flex-col items-center my-10">
      <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl shadow-xl p-8 w-80 text-center transition-all duration-300">
        <div className="text-3xl font-extrabold mb-2 text-blue-700 tracking-wide">{card.word}</div>
        <div className="text-lg text-blue-500 mb-3 font-mono">{card.reading}</div>
        {showAnswer ? (
          <div className="text-green-700 font-semibold mb-4 text-lg animate-fade-in">{card.meaning}</div>
        ) : (
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg mb-4 shadow transition" onClick={() => setShowAnswer(true)}>
            Show Meaning
          </button>
        )}
        <div className="flex justify-between items-center mt-2">
          <button className="px-4 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 shadow transition" onClick={prevCard}>
            Previous
          </button>
          <span className="text-xs text-gray-400">{current + 1} / {cards.length}</span>
          <button className="px-4 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 shadow transition" onClick={nextCard}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardSystem;
