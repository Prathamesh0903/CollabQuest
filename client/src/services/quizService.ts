import { API_BASE } from '../utils/api';
import { ServerQuiz, QuizConfig } from '../components/quiz/types';

export interface QuizFilters {
  page?: number;
  limit?: number;
  category?: string;
  difficulty?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QuizResponse {
  success: boolean;
  quizzes: ServerQuiz[];
  totalPages?: number;
  currentPage?: number;
  total?: number;
}

export interface SingleQuizResponse {
  success: boolean;
  quiz: ServerQuiz;
}

class QuizService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE}/quizzes`;
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

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

    const url = `${API_BASE}/advanced-quizzes${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest<QuizResponse>(url);
  }

  async getQuizById(id: string): Promise<SingleQuizResponse> {
    const url = `${this.baseUrl}/${id}`;
    return this.makeRequest<SingleQuizResponse>(url);
  }

  async getAdvancedQuizById(id: string): Promise<SingleQuizResponse> {
    const url = `${API_BASE}/advanced-quizzes/${id}`;
    return this.makeRequest<SingleQuizResponse>(url);
  }

  async createQuiz(quizData: Partial<ServerQuiz>): Promise<SingleQuizResponse> {
    return this.makeRequest<SingleQuizResponse>(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(quizData)
    });
  }

  async updateQuiz(id: string, quizData: Partial<ServerQuiz>): Promise<SingleQuizResponse> {
    const url = `${this.baseUrl}/${id}`;
    return this.makeRequest<SingleQuizResponse>(url, {
      method: 'PUT',
      body: JSON.stringify(quizData)
    });
  }

  async deleteQuiz(id: string): Promise<{ success: boolean }> {
    const url = `${this.baseUrl}/${id}`;
    return this.makeRequest<{ success: boolean }>(url, {
      method: 'DELETE'
    });
  }

  async submitQuizAttempt(quizId: string, answers: any[], timeSpent: number): Promise<{ success: boolean; score: number; totalQuestions: number }> {
    const url = `${this.baseUrl}/${quizId}/attempt`;
    return this.makeRequest<{ success: boolean; score: number; totalQuestions: number }>(url, {
      method: 'POST',
      body: JSON.stringify({ answers, timeSpent })
    });
  }

  // Get quizzes by category
  async getQuizzesByCategory(category: string, difficulty?: string): Promise<QuizResponse> {
    const filters: QuizFilters = { category };
    if (difficulty) {
      filters.difficulty = difficulty;
    }
    return this.getAdvancedQuizzes(filters);
  }

  // Get JavaScript quizzes specifically
  async getJavaScriptQuizzes(): Promise<QuizResponse> {
    return this.getQuizzesByCategory('JavaScript Fundamentals');
  }
}

export const quizService = new QuizService();
export default quizService;
