import React, { useState, useEffect } from 'react';
import { BookOpen, Play, Sparkles } from 'lucide-react';
import { db, collection, getDocs } from '../../firebase';

const StudentSM = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChaptersModal, setShowChaptersModal] = useState(false);
  const [selectedStoryChapters, setSelectedStoryChapters] = useState([]);
  const [selectedStoryName, setSelectedStoryName] = useState('');

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuizStory, setCurrentQuizStory] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizFinished, setQuizFinished] = useState(false);

  const handleQuizAnswer = (answerIndex) => {
  const newAnswers = [...userAnswers];
  newAnswers[currentQuestionIndex] = answerIndex;
  setUserAnswers(newAnswers);

  // Move to next question or finish
  if (currentQuestionIndex < currentQuizStory.questions.length - 1) {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  } else {
    setQuizFinished(true);
  }
};

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

  // Function to open the Chapters Modal
  const openChaptersModal = (chapters, storyName) => {
    setSelectedStoryChapters(chapters);
    setSelectedStoryName(storyName);
    setShowChaptersModal(true);
  };

  // Helper Functions
  const getYoutubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;

  // Try multiple patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
    if (match && match[7]?.length === 11) {
      return match[7];
    }
  }
  
  return null;
};

  const getYoutubeAutoplayCaptionLink = (url) => {
    const videoId = getYoutubeVideoId(url);
    return videoId
      ? `https://www.youtube.com/watch?v=${videoId}&autoplay=1&cc_load_policy=1`
      : '#';
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
    <div className="min-h-screen bg-[#FDFBF7] p-16 rounded-3xl overflow-hidden mt-20 shadow-sm">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Story Library</h1>
              <p className="text-gray-600 text-lg">Choose a story to watch and enjoy!</p>
            </div>
          </div>
        </div>

        {/* Stories Grid */}
        {stories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stories.map((story) => {
              const videoId = story.videoLink
                ? getYoutubeVideoId(story.videoLink)
                : story.chapters?.[0]?.videoLink
                ? getYoutubeVideoId(story.chapters[0].videoLink)
                : null;

              // ADD THESE DEBUG LOGS
              console.log('Story:', story.storyName);
              console.log('Has videoLink?', story.videoLink);
              console.log('Has chapters?', story.chapters);
              console.log('Extracted videoId:', videoId);

              const thumbnailUrl = videoId
                ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                : null;

              console.log('Thumbnail URL:', thumbnailUrl);

              return (
                <div
                  key={story.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col"
                >
                  {/* Thumbnail */}
                  {thumbnailUrl ? (
                    <div className="relative group">
                      <img
                        src={thumbnailUrl}
                        alt={story.storyName}
                        className="w-full object-cover aspect-video"  // Remove h-48, add aspect-video
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/480x360?text=No+Thumbnail';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                        <Play className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-purple-400" />
                    </div>
                  )}

                  {/* Story Info */}
                  <div className="p-5 flex-grow flex flex-col">
                    <h3 className="font-bold text-xl mb-3 text-gray-900 line-clamp-2">
                      {story.storyName}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-gray-600 mb-4 flex-grow">
                      {story.writtenBy && (
                        <p>
                          <span className="font-semibold">Written by:</span> {story.writtenBy}
                        </p>
                      )}
                      {story.illustratedBy && (
                        <p>
                          <span className="font-semibold">Illustrated by:</span> {story.illustratedBy}
                        </p>
                      )}
                      {story.narratedBy && (
                        <p>
                          <span className="font-semibold">Narrated by:</span> {story.narratedBy}
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    {story.chapters && story.chapters.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => openChaptersModal(story.chapters, story.storyName)}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl py-3 px-4 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <BookOpen className="w-5 h-5" />
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
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl py-3 px-4 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <Play className="w-5 h-5" />
                          Watch Story
                        </button>
                      </a>
                    ) : null}
                    {/* Take Quiz Button */}
                    {story.questions && story.questions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentQuizStory(story);
                          setUserAnswers(Array(story.questions.length).fill(null));
                          setCurrentQuestionIndex(0);
                          setQuizFinished(false);
                          setShowQuizModal(true);
                        }}
                        className="mt-3 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl py-3 px-4 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-5 h-5" />
                        Take Quiz
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-600 mb-2">No Stories Available</h3>
            <p className="text-gray-500">Check back later for new stories!</p>
          </div>
        )}

        {/* Chapters Display Modal */}
        {showChaptersModal && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowChaptersModal(false)}
            ></div>

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
                  <h2 className="text-2xl font-bold text-white">{selectedStoryName}</h2>
                  <p className="text-purple-100 mt-1">Choose a chapter to watch</p>
                </div>

                {/* Chapters List */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                  {selectedStoryChapters.length > 0 ? (
                    <div className="space-y-4">
                      {selectedStoryChapters.map((chapter, index) => {
                        const chapterVideoId = getYoutubeVideoId(chapter.videoLink);
                        console.log('Video Link:', chapter.videoLink); // Debug
                        console.log('Extracted Video ID:', chapterVideoId); // Debug

                        const chapterThumbnailUrl = chapterVideoId
                          ? `https://img.youtube.com/vi/${chapterVideoId}/hqdefault.jpg`
                          : null;

                        return (
                          <div
                            key={index}
                            className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 hover:border-purple-400 transition-all duration-300 hover:shadow-md"
                          >
                            <div className="flex flex-col md:flex-row gap-4 items-center">
                              {/* Chapter Thumbnail */}
                              {chapterThumbnailUrl && (
                                <div className="w-full md:w-48 flex-shrink-0">
                                  <img
                                    src={chapterThumbnailUrl}
                                    alt={chapter.title}
                                    className="w-full h-auto rounded-lg object-cover aspect-video"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/480x360?text=Chapter+' + (index + 1);
                                    }}
                                  />
                                </div>
                              )}

                              {/* Chapter Info and Button */}
                              <div className="flex-grow text-center md:text-left">
                                <h3 className="font-bold text-xl mb-3 text-gray-900">
                                  {chapter.title}
                                </h3>
                                <a
                                  href={getYoutubeAutoplayCaptionLink(chapter.videoLink)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block"
                                >
                                  <button
                                    type="button"
                                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-lg py-2 px-6 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                                  >
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
                    <p className="text-gray-600 text-center py-8">No chapters found for this story.</p>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="border-t border-gray-200 p-4 flex justify-end bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setShowChaptersModal(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg px-6 py-2 transition-all duration-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        {/* Quiz Modal */}
        {showQuizModal && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowQuizModal(false)}
            ></div>

            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {!quizFinished ? (
                  <>
                    {/* Quiz Header */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5">
                      <h2 className="text-xl font-bold text-white">
                        {currentQuizStory?.storyName}
                      </h2>
                      <p className="text-green-100 mt-1">
                        Question {currentQuestionIndex + 1} of {currentQuizStory?.questions.length}
                      </p>
                    </div>

                    {/* Question */}
                    <div className="p-6 text-center">
                      <p className="text-lg font-semibold text-gray-900 mb-6">
                        {currentQuizStory?.questions[currentQuestionIndex]?.question}
                      </p>

                      {/* Balloon Answers */}
                      <div className="space-y-4">
                        {currentQuizStory?.questions[currentQuestionIndex]?.options.map(
                          (option, idx) => {
                            const letter = String.fromCharCode(65 + idx); // A, B, C, D
                            return (
                              <button
                                key={idx}
                                onClick={() => handleQuizAnswer(idx)}
                                disabled={userAnswers[currentQuestionIndex] !== null}
                                className={`w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 ${
                                  idx === 0
                                    ? 'bg-red-400 hover:bg-red-500'
                                    : idx === 1
                                    ? 'bg-blue-400 hover:bg-blue-500'
                                    : idx === 2
                                    ? 'bg-green-400 hover:bg-green-500'
                                    : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                                }`}
                              >
                                <span className="text-2xl mr-2">🎈</span>
                                {letter}. {option}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Results Screen */
                  <>
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-5">
                      <h2 className="text-xl font-bold text-white">Quiz Complete!</h2>
                    </div>
                    <div className="p-6 text-center">
                      {(() => {
                        const total = currentQuizStory.questions.length;
                        const score = userAnswers.reduce((acc, ans, i) => {
                          return ans === currentQuizStory.questions[i].correctAnswer ? acc + 1 : acc;
                        }, 0);
                        return (
                          <div className="mb-6">
                            <div className="text-5xl mb-3">🎉</div>
                            <p className="text-2xl font-bold text-gray-900">
                              {score} / {total}
                            </p>
                            <p className="text-gray-600">Great job!</p>
                          </div>
                        );
                      })()}

                      <div className="space-y-4 max-h-64 overflow-y-auto">
                        {currentQuizStory.questions.map((q, i) => {
                          const isCorrect = userAnswers[i] === q.correctAnswer;
                          return (
                            <div
                              key={i}
                              className={`p-3 rounded-lg border ${
                                isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
                              }`}
                            >
                              <p className="font-medium text-gray-800">{q.question}</p>
                              <p className="text-sm mt-1">
                                <span className="font-semibold text-gray-900">Your answer:</span>{' '}
                                <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                                  {userAnswers[i] !== null ? q.options[userAnswers[i]] : 'Skipped'}
                                </span>
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold text-green-600">Correct:</span> {q.options[q.correctAnswer]}
                              </p>
                            </div>
                          );
                        })}
                      </div>

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
      </div>
    </div>
    
  );
};

export default StudentSM;