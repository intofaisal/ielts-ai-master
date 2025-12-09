import React, { useState, useEffect } from 'react';
import { WritingTopic, WritingSubmission } from '../types';
import { gradeWritingEssay } from '../services/geminiService';
import { Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface WritingTestProps {
  topic: WritingTopic;
  onClose: () => void;
}

export const WritingTest: React.FC<WritingTestProps> = ({ topic, onClose }) => {
  const [essay, setEssay] = useState('');
  const [timeLeft, setTimeLeft] = useState(40 * 60); // 40 minutes in seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [result, setResult] = useState<WritingSubmission['feedback'] & { score: number } | null>(null);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    setIsGrading(true);
    try {
      const feedback = await gradeWritingEssay(essay, topic.questionText);
      setResult(feedback);
    } catch (e) {
      alert("Error grading essay");
    } finally {
      setIsGrading(false);
    }
  };

  if (isGrading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <RefreshCw className="animate-spin text-indigo-600 mb-4 h-12 w-12" />
        <h2 className="text-2xl font-bold text-gray-800">AI Examiner is Grading...</h2>
        <p className="text-gray-500 mt-2">Analyzing coherence, lexical resource, and task response.</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="h-full overflow-y-auto p-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <button onClick={onClose} className="mb-4 text-indigo-600 hover:underline">← Back to Dashboard</button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1">
              <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Overall Band</h2>
              <div className="text-5xl font-extrabold text-indigo-600 mb-4">{result.score}</div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Task Response</span>
                  <span className="font-bold">{result.taskResponse}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Coherence</span>
                  <span className="font-bold">{result.coherence}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Lexical Resource</span>
                  <span className="font-bold">{result.lexical}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Grammar</span>
                  <span className="font-bold">{result.grammar}</span>
                </div>
              </div>
            </div>

            {/* Feedback & Comparison */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-2 space-y-6">
              <div>
                <h3 className="flex items-center font-bold text-lg text-gray-800 mb-3">
                  <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                  Key Improvements
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  {result.critiquePoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 <div>
                    <h4 className="font-semibold text-gray-600 mb-2">Your Essay</h4>
                    <div className="p-4 bg-gray-50 rounded text-sm text-gray-700 whitespace-pre-wrap h-64 overflow-y-auto border">
                        {essay}
                    </div>
                 </div>
                 <div>
                    <h4 className="font-semibold text-green-600 mb-2">Band 8.5+ Rewrite</h4>
                    <div className="p-4 bg-green-50 rounded text-sm text-gray-800 whitespace-pre-wrap h-64 overflow-y-auto border border-green-100">
                        {result.rewrittenEssay}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
           <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold uppercase">{topic.topicCategory}</span>
           <h2 className="text-xl font-bold text-gray-800 mt-1">Writing Task 2</h2>
        </div>
        <div className={`flex items-center space-x-2 text-xl font-mono font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-700'}`}>
          <Clock size={24} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
        <h3 className="font-bold text-blue-900 mb-1">Prompt:</h3>
        <p className="text-blue-800">{topic.questionText}</p>
      </div>

      <textarea
        className="flex-1 w-full border border-gray-300 rounded-lg p-6 text-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-serif leading-relaxed"
        placeholder="Start typing your essay here..."
        value={essay}
        onChange={(e) => setEssay(e.target.value)}
        spellCheck={false}
      />

      <div className="mt-4 flex justify-between items-center">
        <span className="text-gray-500 text-sm">Word Count: {essay.trim().split(/\s+/).filter(w => w.length > 0).length}</span>
        <button
          onClick={handleSubmit}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition flex items-center"
        >
          <CheckCircle className="mr-2" size={20} />
          Submit for Grading
        </button>
      </div>
    </div>
  );
};
