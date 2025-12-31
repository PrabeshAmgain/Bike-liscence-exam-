
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Question, QuizStatus, QuizState } from './types';
import { generateQuizQuestionsFromPDF } from './geminiService';

const PASSING_THRESHOLD = 0.75; // 75%
const TOTAL_QUESTIONS = 25;
const DEFAULT_TIME_LIMIT = 30 * 60; // 30 minutes

const App: React.FC = () => {
  const [state, setState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    userAnswers: {},
    status: QuizStatus.LANDING,
    timeLeft: DEFAULT_TIME_LIMIT,
    score: 0,
    loadingStep: '',
  });

  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setPdfBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const startQuiz = async () => {
    setState(prev => ({ 
      ...prev, 
      status: QuizStatus.LOADING, 
      loadingStep: 'PDF विश्लेषण गर्दै...' 
    }));
    
    const questions = await generateQuizQuestionsFromPDF(pdfBase64 || undefined);
    
    if (questions.length === 0) {
      alert("प्रश्नहरू तयार गर्न सकिएन। कृपया फेरि प्रयास गर्नुहोस्।");
      setState(prev => ({ ...prev, status: QuizStatus.LANDING }));
      return;
    }

    setState(prev => ({
      ...prev,
      questions,
      status: QuizStatus.IN_PROGRESS,
      timeLeft: DEFAULT_TIME_LIMIT,
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
          <div className="mb-6 flex justify-center gap-4">
            <i className="fa-solid fa-file-pdf text-6xl text-red-500"></i>
            <i className="fa-solid fa-graduation-cap text-6xl text-blue-600"></i>
          </div>
          <h1 className="text-4xl font-black mb-4 text-blue-900 leading-tight">
            नेपाल सवारी चालक लिखित परीक्षा
          </h1>
          <p className="text-xl mb-8 text-gray-600 font-medium">
            तपाईंको आधिकारिक PDF बाट २५ प्रश्नहरूको परीक्षा दिनुहोस्
          </p>
          
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 mb-8 transition-colors hover:border-blue-400">
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            {pdfBase64 ? (
              <div className="flex flex-col items-center">
                <i className="fa-solid fa-circle-check text-4xl text-green-500 mb-2"></i>
                <p className="text-green-600 font-bold">PDF सफलतापूर्वक लोड भयो</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                >
                  अर्को फाइल रोज्नुहोस्
                </button>
              </div>
            ) : (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-upload text-2xl text-blue-600"></i>
                </div>
                <span className="font-bold text-gray-500 uppercase tracking-wider text-sm">PDF फाइल अपलोड गर्नुहोस्</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 text-left">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-500 font-bold uppercase tracking-wider">कुल प्रश्नहरू</p>
              <p className="text-2xl font-bold text-blue-900">{TOTAL_QUESTIONS}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-500 font-bold uppercase tracking-wider">समय सीमा</p>
              <p className="text-2xl font-bold text-blue-900">३० मिनेट</p>
            </div>
          </div>

          <button 
            onClick={startQuiz}
            className={`w-full font-black py-5 rounded-2xl text-xl transition-all shadow-xl flex items-center justify-center gap-3 ${
              pdfBase64 ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!pdfBase64}
          >
            <span>परीक्षा सुरु गर्नुहोस्</span>
            <i className="fa-solid fa-play"></i>
          </button>
          
          <p className="mt-6 text-xs text-gray-400 font-semibold italic">
            * AI will strictly follow questions and images from your PDF.
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
            <i className="fa-solid fa-wand-magic-sparkles text-2xl text-blue-600"></i>
          </div>
        </div>
        <h2 className="text-2xl font-bold mt-8 text-blue-900 animate-pulse">
          {state.loadingStep}
        </h2>
        <p className="text-gray-500 mt-2 text-center max-w-xs">
          हामी PDF बाट प्रश्नहरू र चित्रहरू तयार गर्दैछौं...
        </p>
      </div>
    );
  }

  if (state.status === QuizStatus.IN_PROGRESS) {
    const currentQuestion = state.questions[state.currentIndex];
    const isAnswered = state.userAnswers[state.currentIndex] !== undefined;
    const progress = ((state.currentIndex + 1) / state.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <i className="fa-solid fa-motorcycle text-white"></i>
              </div>
              <div>
                <h1 className="font-black text-blue-900 text-lg leading-tight">License Quiz</h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Q {state.currentIndex + 1} / {state.questions.length}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-black ${state.timeLeft < 180 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
              <i className="fa-regular fa-clock"></i>
              <span>{formatTime(state.timeLeft)}</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-gray-100">
            <div className="h-full bg-blue-600 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </header>

        <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-8 animate-fadeIn">
            <div className="bg-blue-50 px-8 py-4 border-b border-blue-100 flex justify-between items-center">
              <span className="text-xs font-black text-blue-500 uppercase tracking-widest">{currentQuestion.category}</span>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Exact Extract</span>
            </div>
            
            <div className="p-8">
              {currentQuestion.imageUrl && (
                <div className="mb-8 flex justify-center">
                  <div className="bg-gray-100 p-4 rounded-3xl border border-gray-200">
                    <img src={currentQuestion.imageUrl} alt="Question Visual" className="max-h-64 object-contain rounded-xl" />
                  </div>
                </div>
              )}

              <h2 className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
                {currentQuestion.question}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                      state.userAnswers[state.currentIndex] === idx
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
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
                    <span className="font-bold">{option}</span>
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
                state.currentIndex === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <i className="fa-solid fa-chevron-left"></i>
              <span>अघिल्लो</span>
            </button>
            <button
              onClick={goToNext}
              className={`flex-1 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 text-white shadow-lg ${
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
            <div className={`inline-block p-6 rounded-full ${isPassed ? 'bg-green-100' : 'bg-red-100'}`}>
              <i className={`fa-solid ${isPassed ? 'fa-trophy text-green-600' : 'fa-circle-exclamation text-red-600'} text-6xl`}></i>
            </div>
          </div>
          <h2 className="text-4xl font-black mb-2 text-gray-900">{isPassed ? 'बधाई छ!' : 'पुनः प्रयास गर्नुहोस्'}</h2>
          <div className="bg-gray-50 rounded-3xl p-8 mb-8 mt-6">
            <div className="text-6xl font-black text-blue-900 mb-2">{state.score}%</div>
            <p className={`font-black uppercase tracking-widest ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
              {isPassed ? 'PASS (सफल)' : 'FAIL (असफल)'}
            </p>
            <div className="flex justify-center gap-8 text-left mt-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Correct</p>
                <p className="text-xl font-bold text-green-600">{correctCount}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Qs</p>
                <p className="text-xl font-bold text-blue-600">{state.questions.length}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <button onClick={() => setState(prev => ({ ...prev, status: QuizStatus.REVIEW }))} className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-black py-4 rounded-2xl text-lg flex items-center justify-center gap-3 border-2 border-blue-200">
              <i className="fa-solid fa-magnifying-glass"></i><span>Review Answers</span>
            </button>
            <button onClick={() => setState(prev => ({ ...prev, status: QuizStatus.LANDING }))} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-lg flex items-center justify-center gap-3 shadow-xl">
              <i className="fa-solid fa-rotate-left"></i><span>फेरि परीक्षा दिनुहोस्</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === QuizStatus.REVIEW) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={() => setState(prev => ({ ...prev, status: QuizStatus.FINISHED }))} className="text-gray-500 hover:text-blue-600 font-bold flex items-center gap-2">
              <i className="fa-solid fa-arrow-left"></i><span>Back</span>
            </button>
            <h1 className="font-black text-blue-900">Review Answers</h1>
            <div className="w-20"></div>
          </div>
        </header>
        <main className="max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
          {state.questions.map((q, idx) => {
            const userAnswer = state.userAnswers[idx];
            const isCorrect = userAnswer === q.correctIndex;
            return (
              <div key={q.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <div className={`px-6 py-3 flex justify-between items-center ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <span className="text-xs font-black uppercase tracking-widest">Q {idx + 1} - {q.category}</span>
                  <span className="font-black text-xs uppercase">{isCorrect ? 'CORRECT' : 'INCORRECT'}</span>
                </div>
                <div className="p-6">
                  {q.imageUrl && <img src={q.imageUrl} className="max-h-40 mx-auto mb-4 rounded-lg border shadow-sm" />}
                  <h3 className="text-lg font-bold mb-4">{q.question}</h3>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className={`p-3 rounded-xl border-2 text-sm font-semibold flex items-center gap-3 ${
                        optIdx === q.correctIndex ? 'bg-green-50 border-green-500 text-green-700' : 
                        optIdx === userAnswer ? 'bg-red-50 border-red-500 text-red-700' : 'bg-gray-50 border-transparent text-gray-500'
                      }`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          optIdx === q.correctIndex ? 'bg-green-500 text-white' : 
                          optIdx === userAnswer ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {String.fromCharCode(2325 + optIdx)}
                        </span>
                        <span>{opt}</span>
                        {optIdx === q.correctIndex && <i className="fa-solid fa-check ml-auto"></i>}
                        {optIdx === userAnswer && !isCorrect && <i className="fa-solid fa-xmark ml-auto"></i>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="pt-8 pb-12 text-center">
            <button onClick={() => setState(prev => ({ ...prev, status: QuizStatus.LANDING }))} className="bg-blue-600 text-white font-black px-12 py-4 rounded-2xl shadow-xl hover:bg-blue-700 transition-all">
              Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  return null;
};

export default App;
