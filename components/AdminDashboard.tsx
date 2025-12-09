import React, { useState } from 'react';
import { parseReadingTestPDF } from '../services/geminiService';
import { ReadingTest, WritingTopic } from '../types';
import { FileText, Loader, Plus, Save, CheckCircle } from 'lucide-react';

interface AdminDashboardProps {
  onAddReadingTest: (test: ReadingTest) => Promise<void>;
  onAddWritingTopic: (topic: WritingTopic) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onAddReadingTest, onAddWritingTopic }) => {
  const [activeTab, setActiveTab] = useState<'writing' | 'reading'>('writing');
  
  // Writing State
  const [topicCategory, setTopicCategory] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reading State
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfBase64, setPdfBase64] = useState('');
  const [fileName, setFileName] = useState('');

  const handleSaveWriting = async () => {
    if (!topicCategory || !questionText) return;
    setIsSaving(true);
    try {
      const newTopic: WritingTopic = {
        id: Date.now().toString(), // Temp ID, will be replaced by Firestore
        topicCategory,
        questionText,
        createdAt: Date.now(),
      };
      await onAddWritingTopic(newTopic);
      setTopicCategory('');
      setQuestionText('');
      alert('Writing Topic Saved to Database!');
    } catch (error) {
      console.error(error);
      alert('Failed to save topic.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    setFileName(file.name);

    // Read file as base64 for Gemini
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      // Extract base64 part (remove "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      setPdfBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessReading = async () => {
    if (!pdfBase64) return;
    setIsProcessing(true);
    try {
      const readingTest = await parseReadingTestPDF(pdfBase64);
      await onAddReadingTest(readingTest);
      setPdfBase64('');
      setFileName('');
      alert('Reading Test Processed & Saved to Database!');
    } catch (error) {
      console.error(error);
      alert('Failed to parse reading test. Ensure the PDF is a valid IELTS exam.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Content Dashboard</h1>
      
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('writing')}
          className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'writing' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}
        >
          Add Writing Topic
        </button>
        <button
          onClick={() => setActiveTab('reading')}
          className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'reading' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}
        >
          Upload Reading Test
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        {activeTab === 'writing' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Topic Category</label>
              <input
                type="text"
                value={topicCategory}
                onChange={(e) => setTopicCategory(e.target.value)}
                placeholder="e.g., Environment, Education, Technology"
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Question Prompt</label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Paste the full Task 2 question here..."
                rows={5}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button
              onClick={handleSaveWriting}
              disabled={isSaving}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              {isSaving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
              <span>{isSaving ? 'Saving...' : 'Save Topic'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition ${fileName ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
              {fileName ? (
                <div className="flex flex-col items-center text-green-700">
                  <CheckCircle className="h-12 w-12 mb-3" />
                  <p className="font-semibold text-lg">{fileName}</p>
                  <p className="text-sm mt-1">Ready for AI Processing</p>
                </div>
              ) : (
                <>
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-2">Select an IELTS Reading Exam PDF</p>
                </>
              )}
              
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mt-4 mx-auto max-w-xs"
              />
            </div>

            <button
              onClick={handleProcessReading}
              disabled={!pdfBase64 || isProcessing}
              className={`flex items-center justify-center w-full space-x-2 px-6 py-3 rounded-lg font-medium text-white transition ${!pdfBase64 || isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isProcessing ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>AI Extracting Passages & Questions...</span>
                </>
              ) : (
                <>
                  <Plus size={20} />
                  <span>Parse & Save Reading Test</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 text-center">
              Uses Gemini 2.5 Flash Multimodal to read your PDF and structure the test.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};