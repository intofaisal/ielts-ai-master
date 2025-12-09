export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
}

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
}

// --- Writing Module ---

export interface WritingTopic {
  id: string;
  topicCategory: string;
  questionText: string;
  createdAt: number;
}

export interface WritingSubmission {
  id: string;
  topicId: string;
  studentEssay: string;
  score: number; // Overall band score
  feedback: {
    taskResponse: number;
    coherence: number;
    lexical: number;
    grammar: number;
    critiquePoints: string[];
    rewrittenEssay: string;
  };
  submittedAt: number;
}

// --- Reading Module ---

export enum QuestionType {
  MULTIPLE_CHOICE = 'MCQ',
  TRUE_FALSE_NOT_GIVEN = 'TFNG',
  FILL_IN_THE_BLANKS = 'FIB',
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // For MCQ
  correctAnswer: string;
}

export interface ReadingSection {
  sectionId: string;
  title: string;
  passageText: string;
  questions: Question[];
}

export interface ReadingTest {
  id: string;
  title: string;
  sections: ReadingSection[]; // Should be exactly 3
}

export interface ReadingResult {
  testId: string;
  score: number;
  totalQuestions: number;
  userAnswers: Record<string, string>; // questionId -> answer
}

// --- Flashcards ---

export interface Flashcard {
  id: string;
  word: string;
  originalSentence: string;
  definition: string;
  nextReview: number;
  masteryLevel: number; // 0-5
}
