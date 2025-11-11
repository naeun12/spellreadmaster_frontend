import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Volume2, HelpCircle, CheckCircle, XCircle, Trophy, Star, RotateCcw, Home, Sparkles, Pin } from 'lucide-react'; // Added Pin
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

export default function StudentTLM() {
  const navigate = useNavigate(); // Initialize navigate function

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

        // 5. Fetch student's activity history to determine last attempt for each theme
        const activitySnapshot = await getDocs(collection(db, 'students', studentId, 'activity'));
        const lastAttemptMap = {};

        activitySnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.mode === 'TLM') { // Filter for TLM mode activities
            const themeId = data.themeId;
            const attemptTime = data.timestamp?.toDate(); // Convert Firestore timestamp to JS Date
            
            // Store the most recent attempt time for each theme
            if (!lastAttemptMap[themeId] || (attemptTime && attemptTime > lastAttemptMap[themeId])) {
              lastAttemptMap[themeId] = attemptTime;
            }
          }
        });

        // 6. Attach last attempt info to themes
        const enrichedThemes = uniqueThemes.map(theme => ({
          ...theme,
          lastAttempt: lastAttemptMap[theme.id] || null // Will be a Date object or null
        }));

        setThemes(enrichedThemes);
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
        timestamp: serverTimestamp(), // This creates a new record with a new timestamp each time
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

  // Removed the unused restartGame function
  // const restartGame = () => {
  //   setGameState('theme-select');
  //   setSelectedTheme(null);
  // };

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

        const newAnswer = { question: currentQuestion, userAnswer, correct };
        setAnswers(prev => [...prev, newAnswer]);

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

  // Cork board texture background
  const corkPattern = `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <defs>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix"
            values="0 0 0 0 0.62
                    0 0 0 0 0.44
                    0 0 0 0 0.29
                    0 0 0 1 0" />
        </filter>
      </defs>
      <rect width="200" height="200" fill="#9E6F4A" filter="url(#noise)"/>
    </svg>
  `)}`;
  // Navigation function
  const handleBack = () => {
    navigate('/StudentPage'); // Navigate to /StudentPage
  };

  // Theme Selection Screen (With Bulletin Board and Post-it Notes)
  if (gameState === 'theme-select') {
    return (
      <div 
        className="min-h-screen"
        style={{
          backgroundColor: '#F5F5F5', // Wall color
        }}
      >
        {/* Main Bulletin Board Container - Now Full Screen */}
        <div 
          className="relative overflow-auto rounded-none" // Remove rounded corners, allow vertical scrolling
          style={{
            width: '100vw', // Full viewport width
            height: '100vh', // Full viewport height
            maxHeight: '100vh',
            border: '15px solid #8B4513', // Wooden frame
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            backgroundImage: `url("${corkPattern}")`,
            backgroundSize: '200px 200px',
            display: 'flex',
            flexDirection: 'column', // Stack children vertically
            alignItems: 'center',
            paddingTop: '4rem', // Space from top of frame for content
            paddingBottom: '2rem', // Space at bottom
            paddingLeft: '1rem',
            paddingRight: '1rem',
            boxSizing: 'border-box'
          }}
        >
          {/* Back Button - Positioned at the top-left corner */}
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 z-20 p-3 bg-yellow-200 rounded-full shadow-lg hover:bg-yellow-300 transition-all text-lg font-bold flex items-center gap-1"
            style={{
              transform: 'rotate(-10deg)', // Slight tilt for visual interest
            }}
          >
            <Home className="w-6 h-6 text-black" />
            Back
          </button>

          <div className="max-w-6xl mx-auto">
            {/* Title Post-it */}
            <div className="relative mx-auto w-fit mb-12 animate-bounce">
              <Pin className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 text-red-600 z-10" />
              <div className="bg-yellow-200 p-8 shadow-2xl transform rotate-1" style={{
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              }}>
                <Sparkles className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-2 font-['Caveat',cursive]">
                  Spelling Fun! 🎉
                </h1>
                <p className="text-xl md:text-2xl text-gray-800 font-['Caveat',cursive]">
                  Choose a topic to practice!
                </p>
              </div>
            </div>

            {loading && (
              <div className="text-center text-lg text-gray-700 py-8 font-['Caveat',cursive]">
                Loading themes...
              </div>
            )}
            {error && (
              <div className="text-center text-red-500 py-8">{error}</div>
            )}

            {/* Theme Post-its */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {themes.map((theme, index) => {
                const rotations = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-3'];
                const colors = ['bg-pink-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200', 'bg-purple-200'];
                
                return (
                  <div key={theme.id} className="relative group">
                    <Pin className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 text-red-600 z-10 group-hover:scale-110 transition-transform" />
                    <button
                      onClick={() => startGame(theme)}
                      className={`w-full ${colors[index % colors.length]} p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform ${rotations[index % rotations.length]} hover:scale-105 hover:rotate-0`}
                      style={{
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                      }}
                    >
                      <div className="text-7xl mb-4">{theme.icon}</div>
                      <h3 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 font-['Caveat',cursive]">
                        {theme.title}
                      </h3>
                      <p className="text-xl text-gray-700 mb-4 font-['Caveat',cursive]">
                        {theme.words?.length || 0} words
                      </p>
                      {/* Conditional UI based on lastAttempt */}
                      {theme.lastAttempt ? (
                        <div className="flex flex-col items-center gap-1"> {/* Stack items vertically */}
                          <div className="flex items-center justify-center gap-1 text-xl font-bold text-gray-800 font-['Caveat',cursive]">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" /> {/* Filled star */}
                            Played!
                          </div>
                          <span className="text-xs text-gray-600 font-['Caveat',cursive]">
                            {formatDistanceToNow(theme.lastAttempt, { addSuffix: true })} {/* e.g., "2 days ago" */}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-800 font-['Caveat',cursive]">
                          Lets Play! 
                          <Star className="w-6 h-6 text-yellow-500" />
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game Playing Screen (Maintains Post-it style for game elements)
  if (gameState === 'playing' && currentQuestion) {
    return (
      <div 
        className="min-h-screen"
        style={{
          backgroundColor: '#F5F5F5', // Wall color
        }}
      >
        {/* Main Bulletin Board Container - Now Full Screen */}
        <div 
          className="relative overflow-auto rounded-none" // Remove rounded corners, allow vertical scrolling
          style={{
            width: '100vw', // Full viewport width
            height: '100vh', // Full viewport height
            maxHeight: '100vh',
            border: '15px solid #8B4513', // Wooden frame
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            backgroundImage: `url("${corkPattern}")`,
            backgroundSize: '200px 200px',
            display: 'flex',
            flexDirection: 'column', // Stack children vertically
            alignItems: 'center',
            paddingTop: '4rem', // Space from top of frame for content
            paddingBottom: '2rem', // Space at bottom
            paddingLeft: '1rem',
            paddingRight: '1rem',
            boxSizing: 'border-box'
          }}
        >
          {/* Back Button - Positioned at the top-left corner (Navigates to /StudentPage) */}
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 z-20 p-3 bg-yellow-200 rounded-full shadow-lg hover:bg-yellow-300 transition-all text-lg font-bold flex items-center gap-1"
            style={{
              transform: 'rotate(-10deg)', // Slight tilt for visual interest
            }}
          >
            <Home className="w-6 h-6 text-black" />
            Back
          </button>

          <div className="max-w-4xl mx-auto">
            {/* Header Buttons */}
            <div className="flex items-center justify-between mb-6">
              {/* New "Exit to Themes" Button */}
              <div className="relative">
                <Pin className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 text-red-600 z-10" />
                <button
                  onClick={() => setGameState('theme-select')}
                  className="px-4 py-3 bg-pink-200 shadow-lg hover:shadow-xl transition-all text-lg font-bold text-gray-900 transform rotate-1 font-['Caveat',cursive]"
                >
                  Exit Quiz
                </button>
              </div>
              
              {/* Word Count and Score remain on the right */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Pin className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 text-red-600 z-10" />
                  <div className="px-4 py-3 bg-blue-200 shadow-lg transform rotate-1 font-['Caveat',cursive]">
                    <span className="text-lg text-gray-800">Word </span>
                    <span className="text-xl font-bold text-gray-900">
                      {currentQuestionIndex + 1}/{selectedTheme.words.length}
                    </span>
                  </div>
                </div>
                
                <div className="relative">
                  <Pin className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 text-red-600 z-10" />
                  <div className="px-4 py-3 bg-green-200 shadow-lg transform -rotate-2 font-['Caveat',cursive]">
                    <span className="text-lg text-gray-800">⭐ </span>
                    <span className="text-xl font-bold text-yellow-700">{score}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Game Post-it */}
            <div className="relative">
              <Pin className="absolute -top-6 left-1/2 -translate-x-1/2 w-10 h-10 text-red-600 z-10" />
              <div className="bg-yellow-100 p-6 shadow-2xl transform rotate-0" style={{
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              }}>
                {/* Image Section */}
                <div className="relative h-48 md:h-64 rounded-lg overflow-hidden mb-4 shadow-lg">
                  <img
                    src={currentQuestion.image}
                    alt="Word to spell"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  
                  {/* Sound Button */}
                  <button
                    onClick={() => speakWord(currentQuestion.word)}
                    className="absolute top-3 right-3 p-3 bg-blue-500 rounded-full shadow-xl hover:bg-blue-600 transition-all transform hover:scale-110"
                  >
                    <Volume2 className="w-6 h-6 text-white" />
                  </button>

                  {/* Hint Button */}
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="absolute top-3 left-3 p-3 bg-yellow-400 rounded-full shadow-xl hover:bg-yellow-500 transition-all transform hover:scale-110"
                  >
                    <HelpCircle className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* Hint */}
                {showHint && (
                  <div className="mb-4 p-4 bg-pink-200 border-2 border-pink-400 rounded-lg shadow-md">
                    <p className="text-lg md:text-xl text-center text-gray-900 font-['Caveat',cursive]">
                      💡 {currentQuestion.hint}
                    </p>
                  </div>
                )}

                {/* Letter Slots */}
                <div className="mb-4">
                  <p className="text-xl md:text-2xl font-bold text-center text-gray-900 mb-3 font-['Caveat',cursive]">
                    Spell the word:
                  </p>
                  <div className="flex justify-center gap-2 mb-3" onDragOver={handleDragOver}>
                    {Array.from({ length: currentQuestion.word.length }).map((_, index) => (
                      <div
                        key={index}
                        onDrop={(e) => handleDropOnSlot(e, index)}
                        onDragOver={handleDragOver}
                        onClick={() => placedLetters[index] && handleRemoveLetter(index)}
                        className={`w-14 h-16 md:w-16 md:h-20 rounded-lg border-4 flex items-center justify-center text-3xl font-bold cursor-pointer transition-all ${
                          feedback
                            ? feedback.correct
                              ? 'border-green-600 bg-green-200 text-green-800'
                              : 'border-red-600 bg-red-200 text-red-800'
                            : placedLetters[index]
                            ? 'border-blue-600 bg-blue-100 text-blue-800 hover:bg-blue-200'
                            : 'border-dashed border-gray-400 bg-white'
                        }`}
                        draggable={placedLetters[index] && !feedback}
                        onDragStart={(e) => placedLetters[index] && handleDragStart(e, placedLetters[index].id)}
                      >
                        {placedLetters[index]?.letter || ''}
                      </div>
                    ))}
                  </div>

                  {placedLetters.length > 0 && !feedback && (
                    <div className="text-center">
                      <button
                        onClick={resetWord}
                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg font-bold text-gray-900 transition-all text-sm font-['Caveat',cursive]"
                      >
                        <RotateCcw className="w-4 h-4 inline mr-1" />
                        Start Over
                      </button>
                    </div>
                  )}
                </div>

                {/* Feedback */}
                {feedback && (
                  <div className={`mb-4 p-4 rounded-lg shadow-lg ${
                    feedback.correct ? 'bg-green-200 border-2 border-green-500' : 'bg-red-200 border-2 border-red-500'
                  }`}>
                    {/* This is the correct opening tag for the div being closed below */}
                    <div className="flex flex-col items-center gap-2">
                      {feedback.correct ? (
                        <div> {/* Wrap content in a div instead of <></> */}
                          <CheckCircle className="w-16 h-16 text-green-700" />
                          <p className="text-3xl font-bold text-green-800 font-['Caveat',cursive]">Amazing! 🎉</p>
                        </div>
                      ) : (
                        <div> {/* Wrap content in a div instead of <></> */}
                          <XCircle className="w-16 h-16 text-red-700" />
                          <p className="text-3xl font-bold text-red-800 font-['Caveat',cursive]">Try next time! 💪</p>
                          <p className="text-xl text-gray-900 font-['Caveat',cursive]">
                            The word is: <span className="font-bold">{currentQuestion.word}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Available Letters */}
                {!feedback && (
                  <div
                    onDrop={handleDropBack}
                    onDragOver={handleDragOver}
                    className="p-4 bg-purple-200 border-2 border-purple-400 border-dashed rounded-lg shadow-md"
                  >
                    <p className="text-lg md:text-xl font-bold text-center text-gray-900 mb-3 font-['Caveat',cursive]">
                      Choose letters:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {availableLetters.map((letterObj) => (
                        <button
                          key={letterObj.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, letterObj.id)}
                          onClick={() => handleLetterClick(letterObj.id)}
                          className="w-14 h-16 md:w-16 md:h-18 bg-gradient-to-br from-purple-400 to-pink-400 text-white rounded-lg text-3xl font-bold shadow-lg hover:shadow-xl transform hover:scale-110 transition-all cursor-move active:scale-95"
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
      </div>
    );
  }

  // Results Screen (Maintains Post-it style)
  if (gameState === 'results') {
    const percentage = Math.round((score / selectedTheme.words.length) * 100);
    
    return (
      <div 
        className="min-h-screen"
        style={{
          backgroundColor: '#F5F5F5', // Wall color
        }}
      >
        {/* Main Bulletin Board Container - Now Full Screen */}
        <div 
          className="relative overflow-auto rounded-none" // Remove rounded corners, allow vertical scrolling
          style={{
            width: '100vw', // Full viewport width
            height: '100vh', // Full viewport height
            maxHeight: '100vh',
            border: '15px solid #8B4513', // Wooden frame
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            backgroundImage: `url("${corkPattern}")`,
            backgroundSize: '200px 200px',
            display: 'flex',
            flexDirection: 'column', // Stack children vertically
            alignItems: 'center',
            paddingTop: '4rem', // Space from top of frame for content
            paddingBottom: '2rem', // Space at bottom
            paddingLeft: '1rem',
            paddingRight: '1rem',
            boxSizing: 'border-box'
          }}
        >
          {/* Back Button - Positioned at the top-left corner */}
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 z-20 p-3 bg-yellow-200 rounded-full shadow-lg hover:bg-yellow-300 transition-all text-lg font-bold flex items-center gap-1"
            style={{
              transform: 'rotate(-10deg)', // Slight tilt for visual interest
            }}
          >
            <Home className="w-6 h-6 text-black" />
            Back
          </button>

          <div className="max-w-4xl mx-auto pt-12">
            <div className="relative">
              <Pin className="absolute -top-8 left-1/2 -translate-x-1/2 w-12 h-12 text-red-600 z-10" />
              <div className="bg-yellow-100 p-12 shadow-2xl transform rotate-1" style={{
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}>
                <div className="text-center">
                  <div className="inline-block p-6 bg-yellow-300 rounded-full mb-6 animate-bounce">
                    <Trophy className="w-20 h-20 text-yellow-700" />
                  </div>
                  
                  <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 font-['Caveat',cursive]">
                    {percentage >= 80 ? 'Superstar! ⭐' : percentage >= 60 ? 'Great Job! 🎉' : 'Keep Practicing! 💪'}
                  </h1>
                  
                  <div className="mb-8">
                    <p className="text-8xl font-bold text-blue-600 mb-4">{score}</p>
                    <p className="text-3xl text-gray-800 font-['Caveat',cursive]">
                      out of {selectedTheme.words.length} words!
                    </p>
                  </div>

                  {/* Answer Review */}
                  <div className="mb-8 space-y-4 max-h-96 overflow-y-auto">
                    {answers.map((answer, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-lg text-lg shadow-md ${
                          answer.correct ? 'bg-green-200 border-2 border-green-500' : 'bg-red-200 border-2 border-red-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {answer.correct ? (
                            <CheckCircle className="w-8 h-8 text-green-700" />
                          ) : (
                            <XCircle className="w-8 h-8 text-red-700" />
                          )}
                          <span className="font-bold text-2xl text-gray-900 font-['Caveat',cursive]">
                            {answer.question.word}
                          </span>
                        </div>
                        {!answer.correct && (
                          <span className="text-lg text-gray-800 font-['Caveat',cursive]">
                            You spelled: <span className="font-bold">{answer.userAnswer}</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-6 justify-center flex-wrap">
                    <button
                      onClick={() => startGame(selectedTheme)}
                      className="flex items-center gap-2 px-8 py-4 bg-blue-300 text-gray-900 rounded-lg font-bold hover:bg-blue-400 transition-all shadow-xl text-xl transform hover:scale-105 font-['Caveat',cursive]"
                    >
                      <RotateCcw className="w-6 h-6" />
                      Play Again
                    </button>
                    {/* Removed the old Home button */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}