import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Play, Sparkles, ArrowLeft, X } from 'lucide-react';
import { db, auth, collection, getDocs, addDoc, serverTimestamp } from '../../firebase';

const StudentSM = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookVisible, setBookVisible] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [storiesVisible, setStoriesVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [turnDirection, setTurnDirection] = useState(null);
  
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuizStory, setCurrentQuizStory] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [showChaptersModal, setShowChaptersModal] = useState(false);
  const [selectedStoryChapters, setSelectedStoryChapters] = useState([]);
  const [selectedStoryName, setSelectedStoryName] = useState('');

  const saveCompletedRef = useRef(false);

  // Load stories from Firestore
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'stories'));
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStories(list);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stories:', error);
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  useEffect(() => {
    if (
      quizFinished &&
      currentQuizStory &&
      userAnswers.length > 0 &&
      !saveCompletedRef.current
    ) {
      saveStoryQuizScore(currentQuizStory, userAnswers);
      saveCompletedRef.current = true;
    }
  }, [quizFinished, currentQuizStory, userAnswers]);

  const startMagicSequence = () => {
    setBookVisible(false); // Start fade + blur immediately
    
    // Show welcome page IMMEDIATELY (no delay)
    setShowWelcome(true);
    
    // Show stories after 2.5s on welcome screen
    setTimeout(() => {
      setShowWelcome(false);
      setStoriesVisible(true);
    }, 2500); // Extended welcome duration
  };

  const goToDashboard = () => {
    // Redirect to dashboard (replace with your actual route)
    window.location.href = '/StudentPage'; // or use react-router if you have it
  };

  const turnPage = (direction) => {
    if (isPageTurning) return;
    
    const totalPages = Math.ceil(stories.length / 2);
    const newPage = direction === 'next' 
      ? Math.min(currentPage + 1, totalPages - 1)
      : Math.max(currentPage - 1, 0);
    
    if (newPage !== currentPage) {
      setIsPageTurning(true);
      setTurnDirection(direction);
      setTimeout(() => {
        setCurrentPage(newPage);
        setIsPageTurning(false);
        setTurnDirection(null);
      }, 650);
    }
  };

  const getYoutubeVideoId = (url) => {
    if (!url || typeof url !== 'string') return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
      if (match && match[7]?.length === 11) return match[7];
    }
    return null;
  };

  const getYoutubeAutoplayCaptionLink = (url) => {
    const videoId = getYoutubeVideoId(url);
    return videoId ? `https://www.youtube.com/watch?v=${videoId}&autoplay=1&cc_load_policy=1` : '#';
  };

  const startNewQuiz = (story) => {
    if (!story.questions || story.questions.length === 0) return;
    setCurrentQuizStory(story);
    setUserAnswers(Array(story.questions.length).fill(null));
    setCurrentQuestionIndex(0);
    setQuizFinished(false);
    saveCompletedRef.current = false;
    setShowQuizModal(true);
  };

  const handleQuizAnswer = (answerIndex) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < currentQuizStory.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const openChaptersModal = (chapters, storyName) => {
    setSelectedStoryChapters(chapters);
    setSelectedStoryName(storyName);
    setShowChaptersModal(true);
  };

  const saveStoryQuizScore = async (story, answers) => {
    try {
      if (!auth.currentUser) {
        console.error("❌ Cannot save score: no authenticated user");
        return;
      }

      const studentId = auth.currentUser.uid;
      const total = story?.questions?.length || 0;

      if (total === 0 || !Array.isArray(answers) || answers.length !== total) {
        console.error("❌ Invalid quiz data", { story, answers });
        return;
      }

      const correctCount = answers.reduce((acc, ans, i) => {
        const correctAnswer = story.questions[i]?.correctAnswer;
        return ans === correctAnswer ? acc + 1 : acc;
      }, 0);

      await addDoc(collection(db, 'students', studentId, 'activity'), {
        mode: 'story',
        storyId: story.id || 'unknown',
        storyTitle: story.storyName || 'Untitled Story',
        score: correctCount,
        maxScore: total,
        percentage: total > 0 ? Math.round((correctCount / total) * 100) : 0,
        timestamp: serverTimestamp(),
        completed: true,
        answers: answers.map((selectedOption, i) => ({
          question: story.questions[i]?.question || '',
          selectedOption,
          correct: selectedOption === (story.questions[i]?.correctAnswer ?? -1),
          correctAnswerIndex: story.questions[i]?.correctAnswer ?? -1,
          options: story.questions[i]?.options || []
        }))
      });

      console.log("✅ Story quiz score saved successfully!");
    } catch (error) {
      console.error("💥 Failed to save story quiz score:", error);
    }
  };

  const leftStory = stories[currentPage * 2];
  const rightStory = stories[currentPage * 2 + 1];

  const StoryCard = ({ story, side }) => {
    if (!story) return null;

    const videoId = story.videoLink
      ? getYoutubeVideoId(story.videoLink)
      : story.chapters?.[0]?.videoLink
      ? getYoutubeVideoId(story.chapters[0].videoLink)
      : null;

    const thumbnailUrl = videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null;

    return (
      <div className={`h-full p-8 flex flex-col ${side === 'left' ? 'border-r-2 border-amber-200' : ''}`}>
        <div
        className={`transform transition-all duration-[1000ms] ease-[cubic-bezier(0.45,0,0.55,1)] ${
          isPageTurning
            ? side === 'right' && turnDirection === 'next'
              ? 'opacity-0 translate-x-20 rotate-y-12 scale-95'
              : side === 'left' && turnDirection === 'prev'
              ? 'opacity-0 -translate-x-20 -rotate-y-12 scale-95'
              : 'opacity-100 rotate-y-0 scale-100'
            : 'opacity-100 rotate-y-0 scale-100'
        }`}
        style={{
          transformOrigin: side === 'left' ? 'right center' : 'left center',
          transitionProperty: 'opacity, transform',
        }}
      >

          {/* Thumbnail */}
          {thumbnailUrl ? (
            <div className="relative group mb-4 rounded-xl overflow-hidden shadow-lg">
              <img
                src={thumbnailUrl}
                alt={story.storyName}
                className="w-full object-cover aspect-video"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/480x360?text=No+Thumbnail';
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                <a
                  href={getYoutubeAutoplayCaptionLink(story.videoLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full flex items-center justify-center"
                >
                  <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </a>
              </div>
            </div>
          ) : (
            <div className="w-full aspect-video bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center rounded-xl mb-4 shadow-lg">
              <BookOpen className="w-12 h-12 text-purple-400" />
            </div>
          )}

          {/* Story Info */}
          <h3 className="font-serif font-bold text-2xl mb-3 text-gray-900">
            {story.storyName}
          </h3>
          
          <div className="space-y-1 text-sm text-gray-700 mb-4 font-serif">
            {story.writtenBy && <p><span className="font-semibold">Written by:</span> {story.writtenBy}</p>}
            {story.illustratedBy && <p><span className="font-semibold">Illustrated by:</span> {story.illustratedBy}</p>}
            {story.narratedBy && <p><span className="font-semibold">Narrated by:</span> {story.narratedBy}</p>}
          </div>

          {/* Action Buttons */}
          <div className="mt-auto space-y-2">
            {story.chapters && story.chapters.length > 0 ? (
              <button
                type="button"
                onClick={() => openChaptersModal(story.chapters, story.storyName)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-lg py-2.5 px-4 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                View {story.chapters.length} Chapters
              </button>
            ) : story.videoLink ? (
              <a
                href={getYoutubeAutoplayCaptionLink(story.videoLink)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <button
                  type="button"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-lg py-2.5 px-4 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Watch Story
                </button>
              </a>
            ) : null}
            
            {story.questions && story.questions.length > 0 && (
              <button
                type="button"
                onClick={() => startNewQuiz(story)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg py-2.5 px-4 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Take Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Loading stories...</p>
      </div>
    </div>
  );
}

return (
  <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8 flex items-center justify-center relative overflow-hidden">
  {/* Animated Background Elements */}
  <div className="fixed inset-0 pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <div
        key={i}
        className="absolute animate-pulse"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${2 + Math.random() * 3}s`
        }}
      >
        <div className="w-1 h-1 bg-yellow-300 rounded-full"></div>
      </div>
    ))}
    
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
    <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
    <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
  </div>

  {/* Back to Dashboard Button — Always Visible */}
  <button
    onClick={goToDashboard}
    className="absolute top-4 left-4 bg-gray-800 hover:bg-gray-900 text-white rounded-full p-2 shadow-lg transition-all duration-300 z-50"
  >
    <ArrowLeft className="w-6 h-6" />
  </button>

  {/* Closed Book — Fades Out with Blur */}
  {bookVisible ? (
    <div 
      className="relative cursor-pointer transform hover:scale-105 transition-all duration-300"
      onClick={startMagicSequence}
    >
      <div 
        className="w-80 h-96 bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 rounded-r-2xl shadow-2xl flex items-center justify-center border-l-8 border-amber-800 relative transition-all duration-1000"
        style={{
          opacity: bookVisible ? 1 : 0,
          filter: bookVisible ? 'blur(0px)' : 'blur(8px)',
          transform: bookVisible ? 'scale(1)' : 'scale(1.05)'
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-amber-900 to-transparent"></div>
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="2" fill="#fff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>
        <div className="text-center p-8 relative z-10">
          <div className="mb-4 relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-md animate-ping opacity-75"></div>
            <BookOpen className="w-20 h-20 text-amber-200 mx-auto relative" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-amber-100 mb-2 drop-shadow-lg">
            Story Library
          </h1>
          <p className="text-amber-300 text-sm font-serif italic drop-shadow">
            Click to begin your adventure
          </p>
          <div className="absolute -top-4 -left-4">
            <div className="w-4 h-4 bg-yellow-300 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
          </div>
          <div className="absolute -bottom-4 -right-4">
            <div className="w-3 h-3 bg-pink-300 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
          </div>
        </div>
        <div className="absolute right-0 top-4 bottom-4 w-1 bg-white opacity-80 rounded-full"></div>
        <div className="absolute right-1 top-6 bottom-6 w-0.5 bg-white opacity-60 rounded-full"></div>
        <div className="absolute right-2 top-8 bottom-8 w-0.5 bg-white opacity-40 rounded-full"></div>
      </div>
    </div>
  ) : null}

  {/* Welcome Screen — Appears INSTANTLY */}
  {showWelcome && (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-amber-50 via-white to-amber-50 transition-opacity duration-300">
      <div className="text-center relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="shine-effect"></div>
        </div>
        <div className="relative z-10">
          <div className="mb-8">
            <BookOpen className="w-32 h-32 text-amber-600 mx-auto animate-float" />
          </div>
          <h2 className="text-5xl font-serif font-bold text-amber-900 mb-4 animate-fade-in">
            Welcome
          </h2>
          <p className="text-2xl font-serif text-amber-700 italic animate-fade-in-delay">
            to your Story Library
          </p>
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-4">
              <Sparkles className="w-8 h-8 text-yellow-400 animate-sparkle" style={{animationDelay: '0s'}} />
              <Sparkles className="w-6 h-6 text-pink-400 animate-sparkle" style={{animationDelay: '0.3s'}} />
              <Sparkles className="w-8 h-8 text-purple-400 animate-sparkle" style={{animationDelay: '0.6s'}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Stories Screen */}
  {storiesVisible && (
    <div className="relative w-full max-w-7xl">
      {/* Book Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ height: '80vh' }}>
        {/* Subtle page texture */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="paper" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 20 L 20 40 L 40 20 Z" fill="#000" opacity="0.1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#paper)" />
          </svg>
        </div>

        {/* Book Pages */}
        <div className="grid grid-cols-2 h-full">
          {/* Left Page */}
          <div className="relative bg-gradient-to-br from-amber-50 to-white">
            {leftStory ? (
              <StoryCard story={leftStory} side="left" />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p className="font-serif text-xl italic">End of stories</p>
              </div>
            )}
          </div>

          {/* Right Page */}
          <div className="relative bg-gradient-to-bl from-amber-50 to-white">
            {rightStory ? (
              <StoryCard story={rightStory} side="right" />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p className="font-serif text-xl italic">More stories coming soon...</p>
              </div>
            )}
          </div>
        </div>

        {/* Page Turn Corners — Tiny Curves (like reference image) */}
        {/* Gray semicircle cutout corners (bottom left & right) */}


        {/* Left side page-turn area */}
        <div
          className={`absolute left-0 top-0 w-4 h-full bg-gray-500/80 hover:bg-gray-400/50 cursor-pointer transition-all duration-300 ${
            currentPage === 0 || isPageTurning ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={() => {
            if (!(currentPage === 0 || isPageTurning)) turnPage('prev');
          }}
          style={{ zIndex: 10 }}
        ></div>

        {/* Right side page-turn area */}
        <div
          className={`absolute right-0 top-0 w-4 h-full bg-gray-500/80 hover:bg-gray-300/60 cursor-pointer transition-all duration-300 ${
            currentPage >= Math.ceil(stories.length / 2) - 1 || isPageTurning
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
          onClick={() => {
            if (!(currentPage >= Math.ceil(stories.length / 2) - 1 || isPageTurning)) turnPage('next');
          }}
          style={{ zIndex: 10 }}
        ></div>

        {/* Page Numbers in Upper Corners */}
        <div className="absolute top-4 left-4 text-gray-600 font-serif text-sm">
          {currentPage * 2 + 1}
        </div>
        <div className="absolute top-4 right-4 text-gray-600 font-serif text-sm">
          {currentPage * 2 + 2}
        </div>
      </div>
    </div>
  )}

  {/* Modals remain unchanged */}
{showQuizModal && (
  <>
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
      onClick={() => setShowQuizModal(false)}
    ></div>
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-95 opacity-0"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'modalAppear 0.3s ease-out forwards'
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => setShowQuizModal(false)}
          className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-gray-800 rounded-full p-1 shadow-lg transition-all duration-300 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {!quizFinished ? (
          <>
            {/* Green Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 rounded-t-2xl"> {/* Added rounded-t-2xl to match modal */}
              <h2 className="text-xl font-bold text-white">{currentQuizStory?.storyName}</h2>
              <p className="text-green-100 mt-1">Question {currentQuestionIndex + 1} of {currentQuizStory?.questions.length}</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-lg font-semibold text-gray-900 mb-6">
                {currentQuizStory?.questions[currentQuestionIndex]?.question}
              </p>
              <div className="space-y-4">
                {currentQuizStory?.questions[currentQuestionIndex]?.options.map((option, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer(idx)}
                      disabled={userAnswers[currentQuestionIndex] !== null}
                      className={`w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 ${
                        idx === 0 ? 'bg-red-400 hover:bg-red-500' :
                        idx === 1 ? 'bg-blue-400 hover:bg-blue-500' :
                        idx === 2 ? 'bg-green-400 hover:bg-green-500' :
                        'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                      }`}
                    >
                      <span className="text-2xl mr-2">🎈</span>
                      {letter}. {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Green Header for Complete Screen */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-5 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Quiz Complete!</h2>
            </div>
            <div className="p-6 text-center">
              {(() => {
                const total = currentQuizStory.questions.length;
                const score = userAnswers.reduce((acc, ans, i) => 
                  ans === currentQuizStory.questions[i].correctAnswer ? acc + 1 : acc, 0);
                return (
                  <div className="mb-6">
                    <div className="text-5xl mb-3">🎉</div>
                    <p className="text-2xl font-bold text-gray-900">{score} / {total}</p>
                    <p className="text-gray-600">Great job!</p>
                  </div>
                );
              })()}
              <button
                onClick={() => setShowQuizModal(false)}
                className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl py-3 px-6"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  </>
)}
  {showChaptersModal && (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={() => setShowChaptersModal(false)}
      ></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-95 opacity-0"
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: 'modalAppear 0.3s ease-out forwards'
          }}
        >
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
            <h2 className="text-2xl font-bold text-white">{selectedStoryName}</h2>
            <p className="text-purple-100 mt-1">Choose a chapter to watch</p>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {selectedStoryChapters.length > 0 ? (
              <div className="space-y-4">
                {selectedStoryChapters.map((chapter, index) => {
                  const chapterVideoId = getYoutubeVideoId(chapter.videoLink);
                  const chapterThumbnailUrl = chapterVideoId
                    ? `https://img.youtube.com/vi/${chapterVideoId}/hqdefault.jpg`
                    : null;
                  return (
                    <div key={index} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 hover:border-purple-400 transition-all duration-300">
                      <div className="flex flex-col md:flex-row gap-4 items-center">
                        {chapterThumbnailUrl && (
                          <div className="w-full md:w-48 flex-shrink-0">
                            <img src={chapterThumbnailUrl} alt={chapter.title} className="w-full h-auto rounded-lg object-cover aspect-video" />
                          </div>
                        )}
                        <div className="flex-grow text-center md:text-left">
                          <h3 className="font-bold text-xl mb-3 text-gray-900">{chapter.title}</h3>
                          <a href={getYoutubeAutoplayCaptionLink(chapter.videoLink)} target="_blank" rel="noopener noreferrer">
                            <button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-lg py-2 px-6 flex items-center gap-2">
                              <Play className="w-4 h-4" />
                              Watch Chapter
                            </button>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No chapters found.</p>
            )}
          </div>
          <div className="border-t border-gray-200 p-4 flex justify-end bg-gray-50">
            <button onClick={() => setShowChaptersModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg px-6 py-2">Close</button>
          </div>
        </div>
      </div>
    </>
  )}

  <style>{`
    @keyframes modalAppear {
      0% {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    @keyframes shine {
      0% {
        transform: translateX(-100%) translateY(-100%) rotate(45deg);
      }
      100% {
        transform: translateX(200%) translateY(200%) rotate(45deg);
      }
    }

    .shine-effect {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.8) 50%,
        rgba(255, 255, 255, 0) 100%
      );
      animation: shine 1.5s ease-in-out;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-20px);
      }
    }

    .animate-float {
      animation: float 3s ease-in-out infinite;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in {
      animation: fadeIn 1s ease-out forwards;
      animation-delay: 0.5s;
      opacity: 0;
    }

    .animate-fade-in-delay {
      animation: fadeIn 1s ease-out forwards;
      animation-delay: 0.8s;
      opacity: 0;
    }

    @keyframes sparkle {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.3;
        transform: scale(0.8);
      }
    }

    .animate-sparkle {
      animation: sparkle 1.5s ease-in-out infinite;
    }
  `}</style>
</div>
);
};

export default StudentSM;