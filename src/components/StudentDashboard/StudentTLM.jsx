import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Volume2, HelpCircle, CheckCircle, XCircle, Trophy, Star, RotateCcw, Home, Sparkles } from 'lucide-react';

export default function StudentTLM() {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  const fetchThemesForStudent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const studentId = auth.currentUser.uid;
      
      // 1. Get student's assigned theme IDs (from teacher assignments)
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      const assignedThemeIds = studentDoc.exists() 
        ? studentDoc.data().assignedThemeIds || [] 
        : [];

      // 2. Fetch assigned themes
      const assignedThemes = [];
      for (const themeId of assignedThemeIds) {
        const themeDoc = await getDoc(doc(db, 'themes', themeId));
        if (themeDoc.exists()) {
          assignedThemes.push({ id: themeDoc.id, ...themeDoc.data() });
        }
      }

      // 3. Fetch ALL admin-created themes (available to everyone)
      const adminThemesQuery = query(
        collection(db, 'themes'),
        where('creatorRole', '==', 'admin')
      );
      const adminSnapshot = await getDocs(adminThemesQuery);
      const adminThemes = adminSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 4. Combine: admin themes + assigned teacher themes
      const allThemes = [...adminThemes, ...assignedThemes];
      
      // Optional: remove duplicates (if an admin theme was also assigned)
      const uniqueThemes = Array.from(
        new Map(allThemes.map(item => [item.id, item])).values()
      );

      setThemes(uniqueThemes);
    } catch (err) {
      console.error('Error loading themes:', err);
      setError('Failed to load themes.');
    } finally {
      setLoading(false);
    }
  };

  fetchThemesForStudent();
}, []);

  const [selectedTheme, setSelectedTheme] = useState(null);
  const [gameState, setGameState] = useState('theme-select');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [placedLetters, setPlacedLetters] = useState([]);
  const [availableLetters, setAvailableLetters] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [draggedLetter, setDraggedLetter] = useState(null);

  // Speak function for pronouncing the word
  const speakWord = useCallback((text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.7;   // Slower for kids
    utterance.pitch = 1.2;  // Slightly higher pitch
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }
}, []);

  const saveTLMScore = async (theme, allAnswers) => {
    const finalScore = allAnswers.filter(a => a.correct).length;
    const studentId = auth.currentUser.uid;

    try {
      await addDoc(collection(db, 'students', studentId, 'activity'), {
        mode: 'TLM',
        themeId: theme.id,
        themeTitle: theme.title,
        score: finalScore, // ✅ use finalScore, not stale `score`
        maxScore: theme.words.length,
        percentage: Math.round((finalScore / theme.words.length) * 100),
        timestamp: serverTimestamp(),
        completed: true,
        answers: allAnswers.map(a => ({ // ✅ use allAnswers, not stale `answers`
          word: a.question.word,
          userAnswer: a.userAnswer,
          correct: a.correct
        }))
      });
    } catch (error) {
      console.error('Failed to save TLM score:', error);
    }
  };

  const startGame = (theme) => {
    setSelectedTheme(theme);
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers([]);
    setShowHint(false);
    setFeedback(null);
    setupQuestion(theme.words[0]);
  };

  const setupQuestion = useCallback((question) => {
  setPlacedLetters([]);
  setShowHint(false);
  setFeedback(null);
  
  // Create letter pool with extra random letters
  const wordLetters = question.word.toUpperCase().split('');
  const extraLetters = ['A', 'B', 'E', 'I', 'O', 'S', 'T', 'N', 'R'];
  const randomExtras = extraLetters
    .filter(l => !wordLetters.includes(l))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  const allLetters = [...wordLetters, ...randomExtras]
    .map((letter, index) => ({ letter, id: `${letter}-${index}` }))
    .sort(() => Math.random() - 0.5);
  
  setAvailableLetters(allLetters);
  
  // Auto-play the word
  setTimeout(() => speakWord(question.word), 500);
}, [speakWord]);

  const currentQuestion = selectedTheme?.words[currentQuestionIndex];

  const handleLetterClick = (letterId) => {
    if (feedback) return;
    
    const letter = availableLetters.find(l => l.id === letterId);
    if (letter && placedLetters.length < currentQuestion.word.length) {
      setPlacedLetters([...placedLetters, letter]);
      setAvailableLetters(availableLetters.filter(l => l.id !== letterId));
    }
  };

  const handleRemoveLetter = (index) => {
    if (feedback) return;
    
    const letter = placedLetters[index];
    setAvailableLetters([...availableLetters, letter]);
    setPlacedLetters(placedLetters.filter((_, i) => i !== index));
  };

  const handleDragStart = (e, letterId) => {
    setDraggedLetter(letterId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnSlot = (e, slotIndex) => {
    e.preventDefault();
    if (feedback || !draggedLetter) return;
    
    const letter = availableLetters.find(l => l.id === draggedLetter);
    if (letter && placedLetters.length === slotIndex) {
      setPlacedLetters([...placedLetters, letter]);
      setAvailableLetters(availableLetters.filter(l => l.id !== draggedLetter));
    }
    setDraggedLetter(null);
  };

  const handleDropBack = (e) => {
    e.preventDefault();
    if (feedback || !draggedLetter) return;
    
    // Check if dragged letter is from placed letters
    const letterIndex = placedLetters.findIndex(l => l.id === draggedLetter);
    if (letterIndex !== -1) {
      handleRemoveLetter(letterIndex);
    }
    setDraggedLetter(null);
  };

  const resetWord = () => {
    setAvailableLetters([...availableLetters, ...placedLetters].sort(() => Math.random() - 0.5));
    setPlacedLetters([]);
  };

  const restartGame = () => {
    setGameState('theme-select');
    setSelectedTheme(null);
  };

  useEffect(() => {
  if (currentQuestion && placedLetters.length === currentQuestion.word.length && !feedback) {
    const timer = setTimeout(() => {
      const userAnswer = placedLetters.map(l => l.letter).join('');
      const correct = userAnswer.toLowerCase() === currentQuestion.word.toLowerCase();
      
      setFeedback({ correct });

      if (correct) {
        setScore(prev => prev + 1);
        speakWord('Correct! Great job!');
      } else {
        speakWord('Try again!');
      }

      setAnswers(prev => [...prev, {
        question: currentQuestion,
        userAnswer,
        correct
      }]);

      setTimeout(() => {
        if (currentQuestionIndex < selectedTheme.words.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setupQuestion(selectedTheme.words[currentQuestionIndex + 1]); // ✅ now safe
        } else {
          setGameState('results');
          saveTLMScore(selectedTheme, [...answers, { question: currentQuestion, userAnswer, correct }]); // ✅ Save the score here
        }
      }, 2500);
    }, 300);
    return () => clearTimeout(timer);
  }
}, [
  placedLetters,
  currentQuestion,
  feedback,
  currentQuestionIndex,
  selectedTheme,
  setupQuestion, // ✅ now included
  speakWord,
  answers // optional but good practice
]);

  // Theme Selection Screen
  if (gameState === 'theme-select') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] p-16 rounded-3xl overflow-hidden mt-20 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block p-4 rounded-3xl mb-6 animate-bounce">
              <Sparkles className="w-20 h-20 text-yellow-500" />
            </div>
            <h1 className="text-6xl font-bold text-gray-900 mb-4">Spelling Fun! 🎉</h1>
            <p className="text-2xl text-gray-700">Choose a topic to practice spelling!</p>
          </div>

          {loading && (
            <div className="text-center text-lg text-gray-500 py-8">Loading themes...</div>
          )}
          {error && (
            <div className="text-center text-red-500 py-8">{error}</div>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {themes.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => startGame(theme)}
                  className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-105 hover:-rotate-1"
                >
                  <div className={`bg-gradient-to-r ${theme.gradient} p-8 text-white`}>
                    <div className="text-7xl mb-4">{theme.icon}</div>
                    <h3 className="text-3xl font-bold mb-2">{theme.title}</h3>
                    <p className="text-white/90 text-lg">{theme.words?.length || 0} words</p>
                  </div>
                  <div className="p-6 bg-white">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-700">
                      Lets Play! 
                      <Star className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

// Game Playing Screen
if (gameState === 'playing' && currentQuestion) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] p-3 md:p-6 rounded-3xl overflow-hidden mt-14 shadow-sm">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={restartGame}
            className="flex items-center gap-1.5 px-4 py-2 text-black bg-white rounded-xl shadow-lg hover:shadow-xl transition-all text-sm md:text-lg font-bold"
          >
            <Home className="w-5 h-5 text-black" />
            Home
          </button>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="px-4 md:px-6 py-2 md:py-3 bg-white rounded-xl shadow-lg">
              <span className="text-sm md:text-lg text-gray-600">Word </span>
              <span className="text-base md:text-xl font-bold text-gray-900">
                {currentQuestionIndex + 1}/{selectedTheme.words.length}
              </span>
            </div>
            <div className="px-4 md:px-6 py-2 md:py-3 bg-white rounded-xl shadow-lg">
              <span className="text-sm md:text-lg text-gray-600">⭐ </span>
              <span className="text-base md:text-xl font-bold text-yellow-600">{score}</span>
            </div>
          </div>
        </div>

        {/* Main Game Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Image Section */}
          <div className="relative h-40 md:h-56 bg-gradient-to-br from-blue-100 to-purple-100">
            <img
              src={currentQuestion.image}
              alt="Word to spell"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            
            {/* Sound Button */}
            <button
              onClick={() => speakWord(currentQuestion.word)}
              className="absolute top-3 right-3 p-3 md:p-4 bg-blue-500 rounded-full shadow-xl hover:bg-blue-600 transition-all transform hover:scale-110"
            >
              <Volume2 className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </button>

            {/* Hint Button */}
            <button
              onClick={() => setShowHint(!showHint)}
              className="absolute top-3 left-3 p-2.5 md:p-3 bg-yellow-400 rounded-full shadow-xl hover:bg-yellow-500 transition-all transform hover:scale-110"
            >
              <HelpCircle className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </button>
          </div>

          {/* Game Area */}
          <div className="p-4 md:p-6">
            {/* Hint */}
            {showHint && (
              <div className="mb-3 p-3 md:p-4 bg-yellow-50 border-3 border-yellow-300 rounded-xl">
                <p className="text-base md:text-xl text-center text-gray-800">💡 {currentQuestion.hint}</p>
              </div>
            )}

            {/* Letter Slots */}
            <div className="mb-4">
              <p className="text-lg md:text-xl font-bold text-center text-gray-700 mb-3">
                Spell the word:
              </p>
              <div 
                className="flex justify-center gap-2 md:gap-2.5 mb-3"
                onDragOver={handleDragOver}
              >
                {Array.from({ length: currentQuestion.word.length }).map((_, index) => (
                  <div
                    key={index}
                    onDrop={(e) => handleDropOnSlot(e, index)}
                    onDragOver={handleDragOver}
                    onClick={() => placedLetters[index] && handleRemoveLetter(index)}
                    className={`w-14 h-14 md:w-18 md:h-22 rounded-xl border-4 flex items-center justify-center text-2xl md:text-3xl font-bold cursor-pointer transition-all ${
                      feedback
                        ? feedback.correct
                          ? 'border-green-500 bg-green-100 text-green-700'
                          : 'border-red-500 bg-red-100 text-red-700'
                        : placedLetters[index]
                        ? 'border-blue-500 bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'border-dashed border-gray-400 bg-gray-50'
                    }`}
                    draggable={placedLetters[index] && !feedback}
                    onDragStart={(e) => placedLetters[index] && handleDragStart(e, placedLetters[index].id)}
                  >
                    {placedLetters[index]?.letter || ''}
                  </div>
                ))}
              </div>

              {/* Reset Button */}
              {placedLetters.length > 0 && !feedback && (
                <div className="text-center">
                  <button
                    onClick={resetWord}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 transition-all text-sm"
                  >
                    <RotateCcw className="w-4 h-4 inline mr-1" />
                    Start Over
                  </button>
                </div>
              )}
            </div>

            {/* Feedback */}
            {feedback && (
              <div className={`mb-4 p-4 rounded-xl ${
                feedback.correct ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <div className="flex flex-col items-center gap-2">
                  {feedback.correct ? (
                    <>
                      <CheckCircle className="w-14 h-14 md:w-18 md:h-18 text-green-500" />
                      <p className="text-2xl md:text-3xl font-bold text-green-700">Amazing! 🎉</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-14 h-14 md:w-18 md:h-18 text-red-500" />
                      <p className="text-2xl md:text-3xl font-bold text-red-700">Try next time! 💪</p>
                      <p className="text-base md:text-xl text-gray-700">
                        The word is: <span className="font-bold">{currentQuestion.word}</span>
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Available Letters */}
            {!feedback && (
              <div
                onDrop={handleDropBack}
                onDragOver={handleDragOver}
                className="p-3 md:p-4 bg-purple-50 border-3 border-purple-300 border-dashed rounded-xl"
              >
                <p className="text-base md:text-lg font-bold text-center text-gray-700 mb-2">
                  Choose letters:
                </p>
                <div className="flex flex-wrap justify-center gap-2 md:gap-2.5">
                  {availableLetters.map((letterObj) => (
                    <button
                      key={letterObj.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, letterObj.id)}
                      onClick={() => handleLetterClick(letterObj.id)}
                      className="w-14 h-16 md:w-18 md:h-22 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl text-2xl md:text-3xl font-bold shadow-lg hover:shadow-xl transform hover:scale-110 transition-all cursor-move active:scale-95"
                    >
                      {letterObj.letter}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

  // Results Screen
  if (gameState === 'results') {
    const percentage = Math.round((score / selectedTheme.words.length) * 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <div className="inline-block p-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 animate-bounce">
              <Trophy className="w-24 h-24 text-white" />
            </div>
            
            <h1 className="text-6xl font-bold text-gray-900 mb-6">
              {percentage >= 80 ? 'Superstar! ⭐' : percentage >= 60 ? 'Great Job! 🎉' : 'Keep Practicing! 💪'}
            </h1>
            
            <div className="mb-8">
              <p className="text-8xl font-bold text-blue-600 mb-4">{score}</p>
              <p className="text-3xl text-gray-700">
                out of {selectedTheme.words.length} words!
              </p>
            </div>

            {/* Answer Review */}
            <div className="mb-8 space-y-4 max-h-96 overflow-y-auto">
              {answers.map((answer, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-6 rounded-2xl text-xl ${
                    answer.correct ? 'bg-green-50 border-4 border-green-300' : 'bg-red-50 border-4 border-red-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {answer.correct ? (
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    ) : (
                      <XCircle className="w-10 h-10 text-red-500" />
                    )}
                    <span className="font-bold text-2xl text-gray-900">
                      {answer.question.word}
                    </span>
                  </div>
                  {!answer.correct && (
                    <span className="text-lg text-gray-600">
                      You spelled: <span className="font-bold">{answer.userAnswer}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-6 justify-center">
              <button
                onClick={() => startGame(selectedTheme)}
                className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all shadow-xl text-2xl transform hover:scale-105"
              >
                <RotateCcw className="w-7 h-7" />
                Play Again
              </button>
              <button
                onClick={restartGame}
                className="flex items-center gap-3 px-10 py-5 bg-white border-4 border-gray-300 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all text-2xl transform hover:scale-105"
              >
                <Home className="w-7 h-7" />
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}