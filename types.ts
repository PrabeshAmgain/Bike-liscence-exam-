
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
  imageDescription?: string; // Description of the image from the PDF
  imageUrl?: string;        // The generated/recreated image URL
}

export enum QuizStatus {
  LANDING = 'LANDING',
  LOADING = 'LOADING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  REVIEW = 'REVIEW'
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  userAnswers: Record<number, number>;
  status: QuizStatus;
  timeLeft: number; // in seconds
  score: number;
  loadingStep: string;
}
