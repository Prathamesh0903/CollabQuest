// Quiz Service - Provides quiz data from local datasets instead of database
// This service replaces database queries with static quiz data for better performance

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
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/quizzes';
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getQuizzes(filters: QuizFilters = {}): Promise<QuizResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const url = `${this.baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest<QuizResponse>(url);
  }

  async getAdvancedQuizzes(filters: QuizFilters = {}): Promise<QuizResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const url = `/api/advanced-quizzes${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest<QuizResponse>(url);
  }

  async getQuizById(id: string): Promise<QuizResponse> {
    const url = `/api/advanced-quizzes/${id}`;
    return this.makeRequest<QuizResponse>(url);
  }

  async createQuiz(quizData: Partial<Quiz>): Promise<QuizResponse> {
    const url = this.baseUrl;
    return this.makeRequest<QuizResponse>(url, {
      method: 'POST',
      body: JSON.stringify(quizData),
    });
  }

  async updateQuiz(id: string, quizData: Partial<Quiz>): Promise<QuizResponse> {
    const url = `/api/advanced-quizzes/${id}`;
    return this.makeRequest<QuizResponse>(url, {
      method: 'PUT',
      body: JSON.stringify(quizData),
    });
  }

  async deleteQuiz(id: string): Promise<QuizResponse> {
    const url = `/api/advanced-quizzes/${id}`;
    return this.makeRequest<QuizResponse>(url, {
      method: 'DELETE',
    });
  }

  async submitQuizAttempt(quizId: string, answers: any[]): Promise<QuizResponse> {
    const url = `/api/advanced-quizzes/${quizId}/attempt`;
    return this.makeRequest<QuizResponse>(url, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }
}

export default new QuizService();
