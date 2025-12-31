
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
}

export enum QuizStatus {
  LANDING = 'LANDING',
  LOADING = 'LOADING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED'
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  userAnswers: Record<number, number>;
  status: QuizStatus;
  timeLeft: number; // in seconds
  score: number;
}
