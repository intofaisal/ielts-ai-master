import React, { useState, useEffect } from 'react';
import { User, UserRole, WritingTopic, ReadingTest as ReadingTestType, Flashcard } from './types';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile, logOut } from './services/auth';
import { 
  subscribeToWritingTopics, 
  subscribeToReadingTests, 
  subscribeToFlashcards,
  addWritingTopic,
  addReadingTest,
  addFlashcard
} from './services/db';

import { AdminDashboard } from './components/AdminDashboard';
import { WritingTest } from './components/WritingTest';
import { ReadingTest } from './components/ReadingTest';
import { Flashcards } from './components/Flashcards';
import { Login } from './components/Login';
import { PenTool, LayoutDashboard, Brain, LogOut, Book, Loader } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'writing' | 'reading' | 'flashcards' | 'admin'>('dashboard');
  
  // Real Data State
  const [writingTopics, setWritingTopics] = useState<WritingTopic[]>([]);
  const [readingTests, setReadingTests] = useState<ReadingTestType[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  
  // Selection State
  const [selectedTopic, setSelectedTopic] = useState<WritingTopic | null>(null);
  const [selectedTest, setSelectedTest] = useState<ReadingTestType | null>(null);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch custom user profile (role) from Firestore
        const profile = await getUserProfile(firebaseUser.uid);
        setUser(profile || { 
            uid: firebaseUser.uid, 
            email: firebaseUser.email || "", 
            name: firebaseUser.displayName || "", 
            role: UserRole.STUDENT 
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Data Listeners (Only when logged in)
  useEffect(() => {
    if (!user) return;

    // Subscribe to public content
    const unsubTopics = subscribeToWritingTopics(setWritingTopics);
    const unsubTests = subscribeToReadingTests(setReadingTests);
    
    // Subscribe to private content (Flashcards)
    const unsubCards = subscribeToFlashcards(user.uid, setFlashcards);

    return () => {
      unsubTopics();
      unsubTests();
      unsubCards();
    };
  }, [user]);

  // Handlers
  const handleSignOut = async () => {
    await logOut();
    setUser(null);
  };

  const handleSaveFlashcard = async (card: Flashcard) => {
    if (!user) return;
    await addFlashcard(card, user.uid);
    // Note: No need to setFlashcards here, the onSnapshot listener will do it automatically!
  };

  const handleAddReadingTest = async (test: ReadingTestType) => {
    await addReadingTest(test);
  };

  const handleAddWritingTopic = async (topic: WritingTopic) => {
    await addWritingTopic(topic);
  };

  // --- RENDER HELPERS ---

  const renderSidebar = () => (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold tracking-tight text-indigo-400">IELTS AI</h1>
        <p className="text-xs text-gray-400 mt-1">Mastery Platform</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <button 
          onClick={() => setView('dashboard')}
          className={`flex items-center w-full px-4 py-3 rounded-lg transition ${view === 'dashboard' ? 'bg-indigo-600' : 'hover:bg-gray-800'}`}
        >
          <LayoutDashboard size={20} className="mr-3" />
          Dashboard
        </button>
        
        {user?.role === UserRole.STUDENT && (
          <button 
              onClick={() => setView('flashcards')}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition ${view === 'flashcards' ? 'bg-indigo-600' : 'hover:bg-gray-800'}`}
          >
              <Brain size={20} className="mr-3" />
              Flashcards ({flashcards.length})
          </button>
        )}

        {user?.role === UserRole.ADMIN && (
          <button 
             onClick={() => setView('admin')}
             className={`flex items-center w-full px-4 py-3 rounded-lg transition ${view === 'admin' ? 'bg-indigo-600' : 'hover:bg-gray-800'}`}
          >
             <PenTool size={20} className="mr-3" />
             Content Admin
          </button>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm">
                {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium truncate w-32">{user?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
        </div>
        <button onClick={handleSignOut} className="flex items-center text-xs text-gray-400 hover:text-white transition w-full">
            <LogOut size={14} className="mr-2" />
            Sign Out
        </button>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Welcome back, {user?.name}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Writing Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center mb-4 text-indigo-600">
            <PenTool className="mr-2" />
            <h3 className="text-xl font-bold">Writing Practice (Task 2)</h3>
          </div>
          <p className="text-gray-500 mb-6">Take a timed essay test and get instant AI grading.</p>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {writingTopics.length === 0 && <p className="text-sm text-gray-400">No topics available yet.</p>}
            {writingTopics.map(topic => (
              <div key={topic.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                 <span className="text-sm font-medium text-gray-700 truncate w-2/3">{topic.topicCategory}</span>
                 <button 
                    onClick={() => { setSelectedTopic(topic); setView('writing'); }}
                    className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                 >
                    Start
                 </button>
              </div>
            ))}
          </div>
        </div>

        {/* Reading Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center mb-4 text-green-600">
            <Book className="mr-2" />
            <h3 className="text-xl font-bold">Reading Mock Tests</h3>
          </div>
          <p className="text-gray-500 mb-6">Full length interactive reading exams.</p>
          <div className="space-y-3 max-h-60 overflow-y-auto">
             {readingTests.length === 0 && <p className="text-sm text-gray-400">No tests available yet.</p>}
            {readingTests.map(test => (
              <div key={test.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                 <span className="text-sm font-medium text-gray-700 truncate w-2/3">{test.title}</span>
                 <button 
                    onClick={() => { setSelectedTest(test); setView('reading'); }}
                    className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                 >
                    Start
                 </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <Loader className="animate-spin text-indigo-600 w-12 h-12" />
          </div>
      )
  }

  if (!user) {
    return <Login />;
  }

  // --- MAIN RENDER ---

  // Full Screen Modes (No Sidebar)
  if (view === 'writing' && selectedTopic) {
    return <WritingTest topic={selectedTopic} onClose={() => setView('dashboard')} />;
  }
  if (view === 'reading' && selectedTest) {
    return <ReadingTest 
        test={selectedTest} 
        userId={user.uid} 
        onClose={() => setView('dashboard')}
        onSaveFlashcard={handleSaveFlashcard}
    />;
  }

  // Dashboard Modes
  return (
    <div className="bg-gray-50 min-h-screen flex font-sans text-gray-900">
      {renderSidebar()}
      <div className="flex-1 ml-64">
        {view === 'dashboard' && renderDashboard()}
        
        {view === 'flashcards' && (
             <Flashcards cards={flashcards} />
        )}
        
        {view === 'admin' && user.role === UserRole.ADMIN && (
          <AdminDashboard 
            onAddReadingTest={handleAddReadingTest}
            onAddWritingTopic={handleAddWritingTopic}
          />
        )}
      </div>
    </div>
  );
}

export default App;