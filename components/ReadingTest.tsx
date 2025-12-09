import React, { useState, useEffect, useRef } from 'react';
import { ReadingTest as ReadingTestType, Question, Flashcard } from '../types';
import { explainReadingAnswer, generateFlashcardDefinition } from '../services/geminiService';
import { Clock, BookOpen, HelpCircle, BookmarkPlus, X, Lightbulb } from 'lucide-react';

interface ReadingTestProps {
  test: ReadingTestType;
  userId: string;
  onSaveFlashcard: (card: Flashcard) => void;
  onClose: () => void;
}

export const ReadingTest: React.FC<ReadingTestProps> = ({ test, userId, onSaveFlashcard, onClose }) => {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 mins
  
  // Selection / Flashcard State
  const [selectionPopup, setSelectionPopup] = useState<{ x: number; y: number; word: string; sentence: string } | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  // Explainer State
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  // Handle Text Selection for Contextual Flashcards
  const handleTextMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !textContainerRef.current) {
      setSelectionPopup(null);
      return;
    }

    const text = selection.toString().trim();
    // Only allow single words or short phrases for flashcards
    if (text.split(' ').length > 3 || text.length === 0) {
      setSelectionPopup(null);
      return;
    }

    // Find full sentence context (naive split by period)
    const fullText = textContainerRef.current.innerText;
    // This is a simplified sentence extraction. Robust version needs regex.
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Attempt to find sentence context from the full text is tricky with selection range
    // We will use the paragraph text content from the common ancestor
    let contextSentence = text;
    if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
       const wholeText = range.commonAncestorContainer.textContent || "";
       // Regex to find the sentence containing the selection
       // Matches . ? ! followed by space or end of string
       const sentences = wholeText.match(/[^\.!\?]+[\.!\?]+/g) || [wholeText];
       contextSentence = sentences.find(s => s.includes(text)) || text;
    }

    setSelectionPopup({
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 40,
      word: text,
      sentence: contextSentence.trim()
    });
  };

  const handleSaveFlashcard = async () => {
    if (!selectionPopup) return;
    
    // Optimistic UI update or wait for definition? Let's wait for better UX
    const definition = await generateFlashcardDefinition(selectionPopup.word, selectionPopup.sentence);
    
    const newCard: Flashcard = {
      id: Date.now().toString(),
      word: selectionPopup.word,
      originalSentence: selectionPopup.sentence,
      definition,
      nextReview: Date.now(),
      masteryLevel: 0
    };
    
    onSaveFlashcard(newCard);
    setSelectionPopup(null);
    window.getSelection()?.removeAllRanges();
    alert(`Saved "${selectionPopup.word}" to Flashcards!`);
  };

  const handleAnswer = (qId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    setSelectionPopup(null);
  };

  const handleExplain = async (q: Question) => {
    setExplainingId(q.id);
    const exp = await explainReadingAnswer(
      q.text,
      answers[q.id] || "(No Answer)",
      q.correctAnswer,
      test.sections[activeSectionIndex].passageText.substring(0, 500) // snippet
    );
    setExplanations(prev => ({ ...prev, [q.id]: exp }));
    setExplainingId(null);
  };

  const currentSection = test.sections[activeSectionIndex];

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-3 flex justify-between items-center z-10 h-16 shrink-0">
        <h2 className="font-bold text-gray-800 text-lg truncate w-1/3">{test.title}</h2>
        <div className="flex space-x-2">
          {test.sections.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSectionIndex(idx)}
              className={`px-4 py-1 rounded-full text-sm font-medium transition ${activeSectionIndex === idx ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            >
              Passage {idx + 1}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center font-mono font-bold text-indigo-600">
            <Clock size={18} className="mr-2" />
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          {!isSubmitted ? (
             <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 font-medium">Submit</button>
          ) : (
             <button onClick={onClose} className="text-gray-500 hover:text-gray-800">Close</button>
          )}
        </div>
      </div>

      {/* Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Passage Text */}
        <div 
          className="w-1/2 p-8 overflow-y-auto border-r border-gray-200 bg-white leading-loose text-lg text-gray-800 font-serif relative"
          ref={textContainerRef}
          onMouseUp={handleTextMouseUp}
        >
          <h3 className="text-xl font-sans font-bold mb-4 text-gray-900">{currentSection.title}</h3>
          <p className="whitespace-pre-wrap">{currentSection.passageText}</p>

          {/* Contextual Flashcard Popup */}
          {selectionPopup && (
            <div 
              className="fixed z-50 bg-indigo-900 text-white px-3 py-2 rounded-lg shadow-xl flex items-center space-x-2 cursor-pointer transform -translate-x-1/2 transition hover:bg-indigo-800"
              style={{ top: selectionPopup.y, left: selectionPopup.x }}
              onClick={handleSaveFlashcard}
              onMouseDown={(e) => e.stopPropagation()} // Prevent selection clear
            >
              <BookmarkPlus size={16} />
              <span className="text-sm font-semibold">Save to Flashcards</span>
            </div>
          )}
        </div>

        {/* Right: Questions */}
        <div className="w-1/2 bg-gray-50 overflow-y-auto p-8">
          <h3 className="text-lg font-bold text-gray-700 mb-6 sticky top-0 bg-gray-50 py-2">Questions</h3>
          
          <div className="space-y-8">
            {currentSection.questions.map((q) => {
              const isCorrect = answers[q.id] === q.correctAnswer;
              
              return (
                <div key={q.id} className={`p-4 rounded-lg border ${isSubmitted ? (isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50') : 'border-gray-200 bg-white'}`}>
                  <p className="font-medium text-gray-900 mb-3"><span className="font-bold text-gray-500 mr-2">{q.id}.</span>{q.text}</p>
                  
                  {q.type === 'MCQ' && q.options && (
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <label key={opt} className="flex items-center space-x-3 cursor-pointer">
                          <input 
                            type="radio" 
                            name={q.id} 
                            value={opt} 
                            checked={answers[q.id] === opt}
                            onChange={() => !isSubmitted && handleAnswer(q.id, opt)}
                            disabled={isSubmitted}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={`${isSubmitted && opt === q.correctAnswer ? 'font-bold text-green-700' : ''}`}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type !== 'MCQ' && (
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded p-2 mt-2"
                      value={answers[q.id] || ''}
                      onChange={(e) => !isSubmitted && handleAnswer(q.id, e.target.value)}
                      disabled={isSubmitted}
                      placeholder="Type answer here..."
                    />
                  )}

                  {isSubmitted && !isCorrect && (
                    <div className="mt-4 pt-3 border-t border-red-100">
                      <div className="flex items-center text-sm text-red-700 mb-2">
                        <X size={16} className="mr-1" />
                        <span>Correct Answer: <strong>{q.correctAnswer}</strong></span>
                      </div>
                      
                      {explanations[q.id] ? (
                        <div className="bg-white p-3 rounded border border-indigo-100 text-sm text-indigo-800 mt-2">
                          <div className="flex items-center font-bold mb-1"><Lightbulb size={14} className="mr-1"/> AI Explanation:</div>
                          {explanations[q.id]}
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleExplain(q)}
                          disabled={explainingId === q.id}
                          className="text-xs flex items-center text-indigo-600 font-semibold hover:underline"
                        >
                          {explainingId === q.id ? 'Thinking...' : 'Why is this wrong? (Smart Explainer)'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};