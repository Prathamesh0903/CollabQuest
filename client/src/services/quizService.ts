// Quiz Service - Provides quiz data from local datasets instead of database
// This service replaces database queries with static quiz data for better performance

import javascriptQuizData from '../data/javascriptQuizData.json';
import pythonQuizData from '../data/pythonQuizData.json';
import dataStructuresQuizData from '../data/dataStructuresQuizData.json';
import algorithmsQuizData from '../data/algorithmsQuizData.json';
import webDevelopmentQuizData from '../data/webDevelopmentQuizData.json';
import systemDesignQuizData from '../data/systemDesignQuizData.json';

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'matching' | 'coding' | 'predict-output';
  question: string;
  options?: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  correctAnswer?: string;
  explanation?: string;
  points: number;
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  codeSnippet?: string;
  language?: string;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    description: string;
    isHidden?: boolean;
  }>;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tags: string[];
  settings: {
    isPublic: boolean;
    allowRetakes: boolean;
    maxAttempts: number;
    showResults: boolean;
    showCorrectAnswers: boolean;
    randomizeQuestions: boolean;
    timeLimit: number;
  };
  stats: {
    totalAttempts: number;
    totalParticipants: number;
    averageScore: number;
    averageTime: number;
    completionRate: number;
  };
}

export interface QuizFilters {
  category?: string;
  difficulty?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
}

export interface QuizResponse {
  success: boolean;
  quizzes?: Quiz[];
  quiz?: Quiz;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: {
    totalQuizzes: number;
    avgQuestions: number;
    avgScore: number;
    totalAttempts: number;
  };
  error?: string;
  message?: string;
}

class QuizService {
  private quizData: Map<string, Quiz>;

  constructor() {
    console.log('🚀 QuizService constructor called at:', new Date().toISOString());
    
    this.quizData = new Map();
    
    // CRITICAL FIX: Ensure correct mapping
    console.log('🔧 Setting up quiz mappings...');
    console.log('📁 JavaScript data ID:', javascriptQuizData.quiz.id);
    console.log('📁 JavaScript data title:', javascriptQuizData.quiz.title);
    console.log('📁 JavaScript data category:', javascriptQuizData.quiz.category);
    // Register available datasets
    
    this.quizData.set('javascript-fundamentals-quiz', javascriptQuizData.quiz as Quiz);
    this.quizData.set('python-essentials-quiz', pythonQuizData.quiz as Quiz);
    this.quizData.set('data-structures', dataStructuresQuizData.quiz as Quiz);
    this.quizData.set('algorithms', algorithmsQuizData.quiz as Quiz);
    this.quizData.set('web-development', webDevelopmentQuizData.quiz as Quiz);
    this.quizData.set('system-design', systemDesignQuizData.quiz as Quiz);
    
    // Debug: Log the loaded data with more detail
    console.log('🔧 QuizService initialized with quizzes:');
    console.log('- JavaScript Quiz:', this.quizData.get('javascript-fundamentals-quiz')?.title);
    console.log('- JavaScript ID in data:', this.quizData.get('javascript-fundamentals-quiz')?.id);
    console.log('- JavaScript First Question:', this.quizData.get('javascript-fundamentals-quiz')?.questions[0]?.question);
    // Datasets registered: javascript-fundamentals-quiz, python-essentials-quiz, data-structures, algorithms, web-development, system-design
    
    // Verify the mapping is correct
    const jsQuiz = this.quizData.get('javascript-fundamentals-quiz');
    const pyQuiz = this.quizData.get('python-essentials-quiz');
    
    if (jsQuiz?.id === 'javascript-fundamentals-quiz' && jsQuiz?.questions[0]?.question.includes('JavaScript')) {
      console.log('✅ JavaScript quiz mapping is correct');
    } else {
      console.log('❌ JavaScript quiz mapping is WRONG');
    }
    
    if (pyQuiz?.id === 'python-essentials-quiz') {
      console.log('✅ Python quiz mapping is active with', pyQuiz.questions.length, 'questions');
    }
  }

  // Utility: expose available quiz IDs for UI to know what's selectable
  getAvailableQuizIds(): string[] {
    return Array.from(this.quizData.keys());
  }

  // Utility: quick check if a quiz is available
  isQuizAvailable(id: string): boolean {
    return this.quizData.has(id);
  }

  private filterQuestions(quizId: string, filters: QuizFilters): QuizQuestion[] {
    const quiz = this.quizData.get(quizId);
    if (!quiz) return [];
    
    let questions = [...quiz.questions];

    // Filter by difficulty
    if (filters.difficulty) {
      questions = questions.filter(q => q.difficulty === filters.difficulty);
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      questions = questions.filter(q => 
        q.question.toLowerCase().includes(searchTerm) ||
        q.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Randomize if requested
    if (quiz.settings.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    return questions;
  }

  private paginateItems<T>(items: T[], page: number = 1, limit: number = 10): { items: T[], pagination: any } {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit)
      }
    };
  }

  async getQuizzes(filters: QuizFilters = {}): Promise<QuizResponse> {
    try {
      // Get all available quizzes
      let quizzes = Array.from(this.quizData.values());
      
      // Filter by category
      if (filters.category) {
        quizzes = quizzes.filter(quiz => quiz.category === filters.category);
      }

      // Filter by difficulty
      if (filters.difficulty) {
        quizzes = quizzes.filter(quiz => quiz.difficulty === filters.difficulty);
      }

      // Filter by search term
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        quizzes = quizzes.filter(quiz => 
          quiz.title.toLowerCase().includes(searchTerm) ||
          quiz.description.toLowerCase().includes(searchTerm) ||
          quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Paginate results
      const { items: paginatedQuizzes, pagination } = this.paginateItems(
        quizzes, 
        filters.page || 1, 
        filters.limit || 10
      );

      return {
        success: true,
        quizzes: paginatedQuizzes,
        pagination
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getAdvancedQuizzes(filters: QuizFilters = {}): Promise<QuizResponse> {
    // Same as getQuizzes for now since we only have one quiz
    return this.getQuizzes(filters);
  }

  async getQuizById(id: string): Promise<QuizResponse> {
    try {
      console.log('🔍 QuizService.getQuizById called with ID:', id);
      console.log('📋 Available quiz IDs:', Array.from(this.quizData.keys()));
      
      // Enforce category-specific datasets
      if (id === 'javascript-fundamentals-quiz') {
        const quiz = javascriptQuizData.quiz as Quiz;
        return { success: true, quiz };
      }

      if (id === 'python-essentials-quiz') {
        const quiz = pythonQuizData.quiz as Quiz;
        // Safety: ensure content looks like Python, not JavaScript
        const firstQuestion = quiz.questions[0]?.question || '';
        if (/javascript/i.test(firstQuestion)) {
          return { success: false, error: 'Quiz content mismatch detected for Python dataset' };
        }
        return { success: true, quiz };
      }

      const quiz = this.quizData.get(id);
      if (quiz) {
        console.log('✅ Found quiz:', quiz.title);
        console.log('📝 First question:', quiz.questions[0]?.question);
        console.log('🆔 Quiz ID in data:', quiz.id);
        console.log('🆔 Requested ID:', id);
        console.log('📂 Quiz category:', quiz.category);
        console.log('📊 Total questions:', quiz.questions.length);
        
        // CRITICAL CHECK: Verify the quiz ID matches the requested ID
        if (quiz.id !== id) {
          console.log('🚨 CRITICAL ERROR: Quiz ID mismatch!');
          console.log('🚨 Requested:', id, 'Got:', quiz.id);
          console.log('🚨 This means the wrong quiz data is being returned!');
        }
        
        // Double-check the question content
        const firstQuestion = quiz.questions[0]?.question;
        if (id === 'python-essentials-quiz' && firstQuestion?.includes('JavaScript')) {
          console.log('🚨 CRITICAL ERROR: Python quiz contains JavaScript question!');
          console.log('🔍 Expected Python question, got:', firstQuestion);
        } else if (id === 'javascript-fundamentals-quiz' && firstQuestion?.includes('Python')) {
          console.log('🚨 CRITICAL ERROR: JavaScript quiz contains Python question!');
          console.log('🔍 Expected JavaScript question, got:', firstQuestion);
        }
        
        return {
          success: true,
          quiz: quiz
        };
      }

      console.log('❌ Quiz not found for ID:', id);
      return {
        success: false,
        error: 'Quiz not found'
      };
    } catch (error) {
      console.error('💥 Error in getQuizById:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async createQuiz(quizData: Partial<Quiz>): Promise<QuizResponse> {
    // Since we're using static data, we can't actually create new quizzes
    // This method is kept for API compatibility
    return {
      success: false,
      error: 'Quiz creation is not supported with static data. Use the provided JavaScript Fundamentals Quiz.'
    };
  }

  async updateQuiz(id: string, quizData: Partial<Quiz>): Promise<QuizResponse> {
    // Since we're using static data, we can't actually update quizzes
    // This method is kept for API compatibility
    return {
      success: false,
      error: 'Quiz updates are not supported with static data.'
    };
  }

  async deleteQuiz(id: string): Promise<QuizResponse> {
    // Since we're using static data, we can't actually delete quizzes
    // This method is kept for API compatibility
    return {
      success: false,
      error: 'Quiz deletion is not supported with static data.'
    };
  }

  async submitQuizAttempt(quizId: string, answers: any[]): Promise<QuizResponse> {
    try {
      const quiz = this.quizData.get(quizId);
      if (!quiz) {
        return {
          success: false,
          error: 'Quiz not found'
        };
      }

      // Calculate score based on answers
      let totalScore = 0;
      let correctAnswers = 0;
      const results = answers.map((answer, index) => {
        const question = quiz.questions[index];
        if (!question) return { correct: false, score: 0 };

        let isCorrect = false;
        
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
          const selectedOption = question.options?.find(opt => opt.text === answer);
          isCorrect = selectedOption?.isCorrect || false;
        } else if (question.type === 'coding') {
          // For coding questions, we'll assume they're correct for now
          // In a real implementation, you'd run the code against test cases
          isCorrect = true;
        }

        if (isCorrect) {
          totalScore += question.points;
          correctAnswers++;
        }

        return {
          questionId: question.id,
          correct: isCorrect,
          score: isCorrect ? question.points : 0,
          explanation: question.explanation
        };
      });

      const percentage = (correctAnswers / quiz.questions.length) * 100;

      return {
        success: true,
        message: 'Quiz submitted successfully',
        stats: {
          totalQuizzes: this.quizData.size,
          avgQuestions: quiz.questions.length,
          avgScore: Math.round(percentage * 100) / 100,
          totalAttempts: 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export default new QuizService();