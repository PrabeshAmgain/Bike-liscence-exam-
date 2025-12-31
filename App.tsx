
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Question, QuizStatus, QuizState } from './types';
import { generateQuizQuestions } from './geminiService';

const TOTAL_QUESTIONS = 25;
const PASSING_THRESHOLD = 0.75; // 75%
const TIME_LIMIT_SECONDS = 30 * 60; // 30 minutes

const App: React.FC = () => {
  const [state, setState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    userAnswers: {},
    status: QuizStatus.LANDING,
    timeLeft: TIME_LIMIT_SECONDS,
    score: 0,
  });

  // Use ReturnType<typeof setInterval> to avoid NodeJS namespace issues in browser environment.
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startQuiz = async () => {
    setState(prev => ({ ...prev, status: QuizStatus.LOADING }));
    const questions = await generateQuizQuestions();
    setState(prev => ({
      ...prev,
      questions,
      status: QuizStatus.IN_PROGRESS,
      timeLeft: TIME_LIMIT_SECONDS,
      currentIndex: 0,
      userAnswers: {},
    }));
  };

  const finishQuiz = useCallback(() => {
    setState(prev => {
      let correct = 0;
      prev.questions.forEach((q, idx) => {
        if (prev.userAnswers[idx] === q.correctIndex) {
          correct++;
        }
      });
      const score = (correct / prev.questions.length) * 100;
      return { ...prev, status: QuizStatus.FINISHED, score };
    });
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (state.status === QuizStatus.IN_PROGRESS) {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.timeLeft <= 1) {
            finishQuiz();
            return { ...prev, timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.status, finishQuiz]);

  const handleAnswerSelect = (optionIndex: number) => {
    setState(prev => ({
      ...prev,
      userAnswers: { ...prev.userAnswers, [prev.currentIndex]: optionIndex }
    }));
  };

  const goToNext = () => {
    if (state.currentIndex < state.questions.length - 1) {
      setState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    } else {
      finishQuiz();
    }
  };

  const goToPrev = () => {
    if (state.currentIndex > 0) {
      setState(prev => ({ ...prev, currentIndex: prev.currentIndex - 1 }));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (state.status === QuizStatus.LANDING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-600 text-white p-6">
        <div className="max-w-2xl w-full bg-white text-gray-800 rounded-3xl shadow-2xl p-8 text-center animate-fadeIn">
          <div className="mb-6">
            <i className="fa-solid fa-motorcycle text-6xl text-blue-600"></i>
          </div>
          <h1 className="text-4xl font-black mb-4 text-blue-900 leading-tight">
            नेपाल सवारी चालक लिखित परीक्षा
          </h1>
          <p className="text-xl mb-8 text-gray-600 font-medium">
            Category A/K (Motorcycle & Scooter) Quiz
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-10 text-left">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-500 font-bold uppercase tracking-wider">Total Questions</p>
              <p className="text-2xl font-bold text-blue-900">25</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-500 font-bold uppercase tracking-wider">Time Limit</p>
              <p className="text-2xl font-bold text-blue-900">30 Min</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-500 font-bold uppercase tracking-wider">Pass Mark</p>
              <p className="text-2xl font-bold text-blue-900">75%</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-500 font-bold uppercase tracking-wider">Full Marks</p>
              <p className="text-2xl font-bold text-blue-900">100</p>
            </div>
          </div>

          <button 
            onClick={startQuiz}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl text-xl transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-3"
          >
            <span>परीक्षा सुरु गर्नुहोस्</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
          
          <p className="mt-6 text-sm text-gray-400 font-semibold italic">
            Official question bank-based knowledge test
          </p>
        </div>
      </div>
    );
  }

  if (state.status === QuizStatus.LOADING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="relative">
          <div className="w-24 h-24 border-8 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fa-solid fa-file-lines text-2xl text-blue-600"></i>
          </div>
        </div>
        <h2 className="text-2xl font-bold mt-8 text-blue-900 animate-pulse">
          प्रश्नहरू तयार गर्दैछ...
        </h2>
        <p className="text-gray-500 mt-2">Loading Official Question Bank...</p>
      </div>
    );
  }

  if (state.status === QuizStatus.IN_PROGRESS) {
    const currentQuestion = state.questions[state.currentIndex];
    const isAnswered = state.userAnswers[state.currentIndex] !== undefined;
    const progress = ((state.currentIndex + 1) / state.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <i className="fa-solid fa-motorcycle text-white"></i>
              </div>
              <div>
                <h1 className="font-black text-blue-900 text-lg leading-tight">License Quiz</h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Question {state.currentIndex + 1} of {state.questions.length}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-black ${state.timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
              <i className="fa-regular fa-clock"></i>
              <span>{formatTime(state.timeLeft)}</span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-gray-100">
            <div 
              className="h-full bg-blue-600 transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </header>

        <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-8 animate-fadeIn">
            <div className="bg-blue-50 px-8 py-4 border-b border-blue-100 flex justify-between items-center">
              <span className="text-xs font-black text-blue-500 uppercase tracking-widest">{currentQuestion.category}</span>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">4 Marks</span>
            </div>
            
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
                {currentQuestion.question}
              </h2>

              <div className="space-y-4">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                      state.userAnswers[state.currentIndex] === idx
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md transform translate-x-1'
                        : 'border-gray-100 hover:border-gray-300 text-gray-600 bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 flex-shrink-0 rounded-full border-2 flex items-center justify-center font-black ${
                      state.userAnswers[state.currentIndex] === idx
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 text-gray-400'
                    }`}>
                      {String.fromCharCode(2325 + idx)}
                    </div>
                    <span className="font-bold text-lg">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={goToPrev}
              disabled={state.currentIndex === 0}
              className={`flex-1 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                state.currentIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95'
              }`}
            >
              <i className="fa-solid fa-chevron-left"></i>
              <span>अघिल्लो</span>
            </button>
            <button
              onClick={goToNext}
              className={`flex-1 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 text-white shadow-lg active:scale-95 ${
                !isAnswered ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <span>{state.currentIndex === state.questions.length - 1 ? 'सबमिट गर्नुहोस्' : 'अर्को'}</span>
              <i className={`fa-solid ${state.currentIndex === state.questions.length - 1 ? 'fa-check' : 'fa-chevron-right'}`}></i>
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (state.status === QuizStatus.FINISHED) {
    const isPassed = state.score >= (PASSING_THRESHOLD * 100);
    const correctCount = Math.round((state.score / 100) * state.questions.length);

    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-10 text-center animate-fadeIn">
          <div className="mb-6">
            {isPassed ? (
              <div className="inline-block p-6 bg-green-100 rounded-full">
                <i className="fa-solid fa-trophy text-6xl text-green-600"></i>
              </div>
            ) : (
              <div className="inline-block p-6 bg-red-100 rounded-full">
                <i className="fa-solid fa-circle-exclamation text-6xl text-red-600"></i>
              </div>
            )}
          </div>
          
          <h2 className="text-4xl font-black mb-2 text-gray-900">
            {isPassed ? 'बधाई छ!' : 'पुनः प्रयास गर्नुहोस्'}
          </h2>
          <p className="text-xl text-gray-500 mb-8 font-bold">
            तपाईंको नतिजा (Results Summary)
          </p>

          <div className="bg-gray-50 rounded-3xl p-8 mb-8 border border-gray-100">
            <div className="text-6xl font-black text-blue-900 mb-2">
              {state.score}%
            </div>
            <div className="flex justify-center gap-8 text-left mt-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Correct Answers</p>
                <p className="text-2xl font-bold text-green-600">{correctCount} / {state.questions.length}</p>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</p>
                <p className={`text-2xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                  {isPassed ? 'PASS (सफल)' : 'FAIL (असफल)'}
                </p>
              </div>
            </div>
          </div>

          <p className="mb-10 text-gray-600 font-medium leading-relaxed">
            {isPassed 
              ? `तपाईंले ७५% भन्दा बढी अंक ल्याएर परीक्षा उत्तीर्ण गर्नुभएको छ। अब तपाईं लिखित परीक्षाको लागि पूर्ण रूपमा तयार हुनुहुन्छ।`
              : `उत्तीर्ण हुनको लागि कम्तिमा ७५% अंक आवश्यक छ। कृपया फेरि तयारी गरेर परीक्षा दिनुहोस्।`}
          </p>

          <button
            onClick={() => setState(prev => ({ ...prev, status: QuizStatus.LANDING }))}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl text-xl transition-all shadow-xl flex items-center justify-center gap-3"
          >
            <i className="fa-solid fa-rotate-left"></i>
            <span>फेरि परीक्षा दिनुहोस्</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default App;
