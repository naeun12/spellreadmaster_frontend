import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, Eye } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  db,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from '../../firebase';

const StoryMode = () => {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [isMultipleChapters, setIsMultipleChapters] = useState(false);
  const [showChaptersModal, setShowChaptersModal] = useState(false);
  const [selectedStoryChapters, setSelectedStoryChapters] = useState([]);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedStoryQuestions, setSelectedStoryQuestions] = useState([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(null);

  const [formData, setFormData] = useState({
    storyName: '',
    writtenBy: '',
    illustratedBy: '',
    narratedBy: '',
    videoLink: '',
    chapters: [
      { title: 'Chapter 1', videoLink: '' },
      { title: 'Chapter 2', videoLink: '' },
    ],
  });

  const [stories, setStories] = useState([]);

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
      } catch (error) {
        console.error('Error fetching stories:', error);
      }
    };
    fetchStories();
  }, []);

  // Generate questions using AI
  const generateQuestionsForStory = async (story) => {
  setGeneratingQuestions(story.id);

  try {
    const prompt = `Generate 5 simple comprehension questions about a children's story.
    
    The story video is available at this link: ${story.videoLink || 'No video link provided.'}
        
    Story Title: ${story.storyName}
    Written by: ${story.writtenBy}
    Illustrated by: ${story.illustratedBy || 'Unknown'}
    Narrated by: ${story.narratedBy || 'Unknown'}

    ***
        
    INSTRUCTIONS:
    1. **Critically analyze the content of the video at the provided YouTube link** to ensure accuracy.
    2. Create age-appropriate multiple-choice questions that test basic understanding of characters, plot, setting, and themes from the video.
    3. Respond ONLY with a valid JSON array in this exact format:
    [
      {
        "question": "Question text?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0
      }
    ]
    Do not include any other text, explanation, or markdown.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    let questions;
    try {
      questions = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Gemini response is not valid JSON');
      }
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format from Gemini');
    }

    const storyRef = doc(db, 'stories', story.id);
    await updateDoc(storyRef, {
      questions: questions,
      questionsGeneratedAt: new Date().toISOString(),
    });

    setStories((prev) =>
      prev.map((s) =>
        s.id === story.id
          ? { ...s, questions, questionsGeneratedAt: new Date().toISOString() }
          : s
      )
    );

    alert(`Successfully generated ${questions.length} questions!`);
  } catch (error) {
    console.error('Error generating questions with Gemini:', error);
    alert('Failed to generate questions. Please try again.\nError: ' + (error.message || error));
  } finally {
    setGeneratingQuestions(null);
  }
};

  // View questions modal
  const openQuestionsModal = (questions) => {
    setSelectedStoryQuestions(questions || []);
    setShowQuestionsModal(true);
  };

  // Handle form submit (add or edit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const finalData = isMultipleChapters
        ? {
            ...formData,
            videoLink: null,
          }
        : {
            ...formData,
            chapters: [],
          };

      let docRef;
      if (isEditing && editingStory) {
        docRef = doc(db, 'stories', editingStory.id);
        await updateDoc(docRef, finalData);
        setStories(
          stories.map((s) =>
            s.id === editingStory.id ? { ...finalData, id: s.id, questions: s.questions } : s
          )
        );
      } else {
        const newDoc = await addDoc(collection(db, 'stories'), finalData);
        setStories([...stories, { ...finalData, id: newDoc.id }]);
      }

      setFormData({
        storyName: '',
        writtenBy: '',
        illustratedBy: '',
        narratedBy: '',
        videoLink: '',
        chapters: [
          { title: 'Chapter 1', videoLink: '' },
          { title: 'Chapter 2', videoLink: '' },
        ],
      });
      setIsMultipleChapters(false);
      setShowModal(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving story:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChapterChange = (index, field, value) => {
    const updatedChapters = [...formData.chapters];
    updatedChapters[index][field] = value;
    setFormData({ ...formData, chapters: updatedChapters });
  };

  const handleAddChapter = () => {
    const newChapter = {
      title: `Chapter ${formData.chapters.length + 1}`,
      videoLink: '',
    };
    setFormData({
      ...formData,
      chapters: [...formData.chapters, newChapter],
    });
  };

  const handleEditStory = (story) => {
    const hasChapters = story.chapters && story.chapters.length > 0;

    setIsEditing(true);
    setEditingStory(story);
    setIsMultipleChapters(hasChapters);

    setFormData({
      storyName: story.storyName || '',
      writtenBy: story.writtenBy || '',
      illustratedBy: story.illustratedBy || '',
      narratedBy: story.narratedBy || '',
      videoLink: story.videoLink || '',
      chapters: hasChapters
        ? story.chapters
        : [
            { title: 'Chapter 1', videoLink: '' },
            { title: 'Chapter 2', videoLink: '' },
          ],
    });

    setShowModal(true);
  };

  const handleDeleteStory = async (story) => {
    if (window.confirm(`Are you sure you want to delete "${story.storyName}"?`)) {
      try {
        await deleteDoc(doc(db, 'stories', story.id));
        setStories(stories.filter((s) => s.id !== story.id));
      } catch (error) {
        console.error('Error deleting story:', error);
      }
    }
  };

  const openChaptersModal = (chapters) => {
    setSelectedStoryChapters(chapters);
    setShowChaptersModal(true);
  };

  const getYoutubeVideoId = (url) => {
    if (!url || typeof url !== 'string') return null;
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7]?.length === 11 ? match[7] : null;
  };

  const getYoutubeAutoplayCaptionLink = (url) => {
    const videoId = getYoutubeVideoId(url);
    return videoId
      ? `https://www.youtube.com/watch?v=${videoId}&autoplay=1&cc_load_policy=1`
      : '#';
  };

  return (
    <div className="min-h-screen text-black p-16 bg-[#FDFBF7] rounded-3xl overflow-hidden mt-14 shadow-sm">
      <div className="mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Story Mode Management</h1>
          </div>
          <p className="text-gray-600">Manage stories and quizzes</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="mt-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-md p-3 px-6 text-base font-medium hover:bg-[#e0a12e] transition-colors duration-300 shadow-md"
        >
          Add New Story
        </button>
      </div>

      {stories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stories.map((story, index) => {
            const videoId = story.videoLink
              ? getYoutubeVideoId(story.videoLink)
              : story.chapters?.[0]?.videoLink
              ? getYoutubeVideoId(story.chapters[0].videoLink)
              : null;

            const thumbnailUrl = videoId
              ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
              : null;

            return (
              <div
                key={index}
                className="bg-gray-100 border border-gray-300 rounded-md shadow-sm p-4 hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 flex flex-col h-full"
              >
                {thumbnailUrl && (
                  <a
                    href={
                      story.chapters && story.chapters.length > 0
                        ? '#'
                        : getYoutubeAutoplayCaptionLink(story.videoLink)
                    }
                    target={story.chapters && story.chapters.length > 0 ? '_self' : '_blank'}
                    rel="noopener noreferrer"
                    className="block mb-3"
                    onClick={() => {
                      if (story.chapters && story.chapters.length > 0) {
                        openChaptersModal(story.chapters);
                      }
                    }}
                  >
                    <img
                      src={thumbnailUrl}
                      alt="YouTube video thumbnail"
                      className="w-full h-auto rounded-md object-cover aspect-video"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </a>
                )}

                <div className="flex-grow">
                  <h3 className="font-semibold text-lg mb-2">{story.storyName}</h3>
                  <p className="text-sm text-gray-700">
                    <strong>Written:</strong> {story.writtenBy || 'N/A'}
                    <br />
                    <strong>Illustrated:</strong> {story.illustratedBy || 'N/A'}
                    <br />
                    <strong>Narrated:</strong> {story.narratedBy || 'N/A'}
                  </p>
                </div>

                {story.chapters && story.chapters.length > 0 ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => openChaptersModal(story.chapters)}
                      className="bg-[#FCB436] hover:bg-[#e0a12e] text-white rounded-md py-2 px-4 transition-colors duration-300 text-sm font-medium w-full"
                    >
                      View Chapters ({story.chapters.length})
                    </button>
                  </div>
                ) : story.videoLink ? (
                  <a
                    href={getYoutubeAutoplayCaptionLink(story.videoLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-3"
                  >
                    <button
                      type="button"
                      className="bg-[#FCB436] hover:bg-[#e0a12e] text-white rounded-md py-2 px-4 transition-colors duration-300 text-sm font-medium w-full"
                    >
                      Watch on YouTube
                    </button>
                  </a>
                ) : null}

                {/* AI Question Generation Button */}
                <button
                  type="button"
                  onClick={() => generateQuestionsForStory(story)}
                  disabled={generatingQuestions === story.id}
                  className="mt-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-md py-2 px-4 transition-colors duration-300 text-sm font-medium w-full flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {generatingQuestions === story.id ? 'Generating...' : 'Generate Questions'}
                </button>

                {/* View Questions Button */}
                {story.questions && story.questions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => openQuestionsModal(story.questions)}
                    className="mt-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md py-2 px-4 transition-colors duration-300 text-sm font-medium w-full flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Questions ({story.questions.length})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleEditStory(story)}
                  className="mt-3 bg-green-500 hover:bg-green-600 text-white rounded-md py-2 px-4 transition-colors duration-300 text-sm font-medium w-full"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteStory(story)}
                  className="mt-2 bg-red-500 hover:bg-red-600 text-white rounded-md py-2 px-4 transition-colors duration-300 text-sm font-medium w-full"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Story Add/Edit Modal */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 backdrop-blur-sm bg-black/30 z-40"
            onClick={() => setShowModal(false)}
          ></div>

          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div
              className="bg-white bg-opacity-90 backdrop-blur-md rounded-lg shadow-lg w-full max-w-md p-6 relative transform transition-all duration-300 ease-out scale-100 opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">
                {isEditing ? 'Edit Story' : isMultipleChapters ? 'Add Chapters Story' : 'Add New Story'}
              </h2>

              <div className="mb-4 flex justify-between items-center">
                <span className="text-sm font-medium">
                  {isMultipleChapters ? 'Multi-Chapter Mode' : 'Single Video Mode'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMultipleChapters((prev) => !prev)}
                  className="text-[#FCB436] hover:text-[#e0a12e] text-sm font-medium"
                >
                  {isMultipleChapters ? 'Switch to Single Video' : 'Add Chapters'}
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto pr-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Story Name</label>
                    <input
                      type="text"
                      name="storyName"
                      value={formData.storyName}
                      onChange={handleChange}
                      placeholder="Enter story title"
                      className="w-full border border-gray-300 rounded-md p-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Written By</label>
                    <input
                      type="text"
                      name="writtenBy"
                      value={formData.writtenBy}
                      onChange={handleChange}
                      placeholder="Author's name"
                      className="w-full border border-gray-300 rounded-md p-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Illustrated By</label>
                    <input
                      type="text"
                      name="illustratedBy"
                      value={formData.illustratedBy}
                      onChange={handleChange}
                      placeholder="Illustrator's name"
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Narrated By</label>
                    <input
                      type="text"
                      name="narratedBy"
                      value={formData.narratedBy}
                      onChange={handleChange}
                      placeholder="Narrator's name"
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>

                  {!isMultipleChapters && (
                    <div>
                      <label className="block text-sm font-medium mb-1">YouTube Video Link</label>
                      <input
                        type="url"
                        name="videoLink"
                        value={formData.videoLink}
                        onChange={handleChange}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full border border-gray-300 rounded-md p-2"
                        required={!isEditing}
                      />
                    </div>
                  )}

                  {isMultipleChapters && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Story Chapters</h3>
                      {formData.chapters.map((chapter, index) => (
                        <div key={index} className="mb-3 space-y-2">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              {chapter.title}
                            </label>
                            <input
                              type="url"
                              value={chapter.videoLink}
                              onChange={(e) =>
                                handleChapterChange(index, 'videoLink', e.target.value)
                              }
                              placeholder="https://youtube.com/watch?v=..."
                              className="w-full border border-gray-300 rounded-md p-2"
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleAddChapter}
                        className="bg-[#FCB436] hover:bg-[#e0a12e] text-white rounded-md px-4 py-2 transition w-full"
                      >
                        Add Chapter
                      </button>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="submit"
                      className="bg-green-500 hover:bg-green-600 text-white rounded-md px-4 py-2 transition w-full"
                    >
                      {isEditing ? 'Update Story' : 'Submit Story'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setIsEditing(false);
                        setEditingStory(null);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-md px-4 py-2 transition w-full"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Chapters Display Modal */}
      {showChaptersModal && (
        <>
          <div
            className="fixed inset-0 backdrop-blur-sm bg-black/30 z-40"
            onClick={() => setShowChaptersModal(false)}
          ></div>

          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div
              className="bg-white bg-opacity-90 backdrop-blur-md rounded-lg shadow-lg w-full max-w-md p-6 relative transform transition-all duration-300 ease-out scale-100 opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Story Chapters</h2>
              <div className="max-h-[70vh] overflow-y-auto pr-2">
                {selectedStoryChapters.length > 0 ? (
                  <div className="space-y-4">
                    {selectedStoryChapters.map((chapter, index) => {
                      const chapterVideoId = getYoutubeVideoId(chapter.videoLink);
                      const chapterThumbnailUrl = chapterVideoId
                        ? `https://img.youtube.com/vi/${chapterVideoId}/hqdefault.jpg`
                        : null;

                      return (
                        <div
                          key={index}
                          className="bg-gray-50 border border-gray-200 rounded-md p-3 flex flex-col items-center text-center"
                        >
                          <h3 className="font-semibold text-lg mb-2">{chapter.title}</h3>
                          {chapterThumbnailUrl && (
                            <img
                              src={chapterThumbnailUrl}
                              alt={`Thumbnail for ${chapter.title}`}
                              className="w-full h-auto rounded-md object-cover aspect-video mb-3"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <a
                            href={getYoutubeAutoplayCaptionLink(chapter.videoLink)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full"
                          >
                            <button
                              type="button"
                              className="bg-[#FCB436] hover:bg-[#e0a12e] text-white rounded-md py-2 px-4 transition-colors duration-300 text-sm font-medium w-full"
                            >
                              Watch on YouTube
                            </button>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-600">No chapters found for this story.</p>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowChaptersModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md px-4 py-2 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Questions Display Modal */}
      {showQuestionsModal && (
        <>
          <div
            className="fixed inset-0 backdrop-blur-sm bg-black/30 z-40"
            onClick={() => setShowQuestionsModal(false)}
          ></div>

          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div
              className="bg-white bg-opacity-90 backdrop-blur-md rounded-lg shadow-lg w-full max-w-2xl p-6 relative transform transition-all duration-300 ease-out scale-100 opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Story Questions</h2>
              <div className="max-h-[70vh] overflow-y-auto pr-2">
                {selectedStoryQuestions.length > 0 ? (
                  <div className="space-y-6">
                    {selectedStoryQuestions.map((q, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 border border-gray-200 rounded-md p-4"
                      >
                        <h3 className="font-semibold text-lg mb-3">
                          {index + 1}. {q.question}
                        </h3>
                        <div className="space-y-2">
                          {q.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-md ${
                                optIndex === q.correctAnswer
                                  ? 'bg-green-100 border-2 border-green-500'
                                  : 'bg-white border border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                <span>{option}</span>
                                {optIndex === q.correctAnswer && (
                                  <span className="ml-auto text-green-600 font-semibold text-sm">
                                    ✓ Correct Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No questions found. Generate questions first!</p>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowQuestionsModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md px-4 py-2 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StoryMode;