// LBLearningMode.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, GripVertical, Eye, EyeOff, Zap, BookOpen, Target, Award, TrendingUp, TrendingDown, Gamepad2, Upload, Search, Download } from 'lucide-react';
import { db } from '../../firebase'; // adjust path as needed
import { authenticatedFetch } from '../../api'; // Import the API helper
import { collection, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore'; // Added getDoc for fetching admin profiles

export default function LBLearningMode() {
  const [editingWord, setEditingWord] = useState(null);
  const [addingWord, setAddingWord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // WordBank data
  const [words, setWords] = useState([]);
  // Admin profiles data (cache UID -> role)
  const [adminProfiles, setAdminProfiles] = useState({});

  // Load words and admin profiles from Firestore on component mount
  useEffect(() => {
    const loadWordsAndProfiles = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'wordBank'));
        const wordList = [];
        const uniqueAddedByUids = new Set(); // Keep track of unique UIDs to fetch profiles for

        querySnapshot.forEach((doc) => {
          const wordData = { id: doc.id, ...doc.data() };
          wordList.push(wordData);
          // Collect unique UIDs from addedBy field
          if (wordData.addedBy) {
            uniqueAddedByUids.add(wordData.addedBy);
          }
        });

        // Fetch profiles for unique UIDs from the 'admins' collection
        const profiles = {};
        for (const uid of uniqueAddedByUids) {
          try {
            // Assuming admin profiles are stored in an 'admins' collection with UID as doc ID
            const adminDoc = await getDoc(doc(db, 'admins', uid));
            if (adminDoc.exists) {
              const adminData = adminDoc.data();
              // Use the 'role' field from the admin document, fallback to UID if not found
              profiles[uid] = adminData.role || uid;
            } else {
              // If admin profile doesn't exist in 'admins' collection, just show the UID
              profiles[uid] = uid;
            }
          } catch (profileError) {
            console.error(`Error fetching admin profile for UID ${uid}:`, profileError);
            // On error, show the UID
            profiles[uid] = uid;
          }
        }

        setAdminProfiles(profiles); // Update the state holding the admin profiles
        setWords(wordList); // Update the state holding the words
      } catch (error) {
        console.error("Error loading words or admin profiles:", error);
        alert("Failed to load word bank or admin profiles. Check connection.");
      }
      setLoading(false);
    };

    loadWordsAndProfiles();
  }, []);

  // Filter words based on search term
  const filteredWords = words.filter(word => 
    word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.phonicsPattern?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.difficulty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditWord = (word) => {
    // Ensure the word object from Firestore (with id) is correctly set
    console.log("Setting editingWord:", word); // Debug log
    setEditingWord({ ...word });
  };

  const handleSaveWord = async () => {
    setLoading(true);
    try {
      // Prepare data to send - only include fields the admin can edit
      const wordDataToSend = {
        difficulty: editingWord.difficulty,
        phonicsPattern: editingWord.phonicsPattern,
        emoji: editingWord.emoji,
        exampleSentence: editingWord.exampleSentence,
        // Do NOT include type or expValue here
      };

      console.log("Sending to edit endpoint for ID:", editingWord.id, "Data:", wordDataToSend); // Log data being sent

      // Use the authenticatedFetch helper to call your backend's edit endpoint
      const result = await authenticatedFetch(`https://spellread-master-production.up.railway.app/word/edit-word/${editingWord.id}`, { // Use editingWord.id for the URL
        method: 'PUT',
        body: JSON.stringify(wordDataToSend), // Send only the fields being updated
      });

      console.log("Word updated via backend:", result); // Log result from backend

      // Reload from Firestore to reflect the word as saved by the backend (with new calculated type/expValue)
      const querySnapshot = await getDocs(collection(db, 'wordBank'));
      const wordList = [];
      querySnapshot.forEach((doc) => {
        wordList.push({ id: doc.id, ...doc.data() });
      });
      setWords(wordList);

      setEditingWord(null);
      alert("✅ Word updated successfully via backend!");
    } catch (error) {
      console.error("Error updating word via backend:", error);
      alert("Failed to update word via backend. Please try again. Error: " + error.message);
    }
    setLoading(false);
  };

  const handleDeleteWord = async (id, wordValue) => {
    if (confirm('Are you sure you want to delete this word? This action cannot be undone.')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'wordBank', wordValue));
        setWords(words.filter(w => w.id !== id));
        alert("✅ Word deleted successfully!");
      } catch (error) {
        console.error("Error deleting word:", error);
        alert("Failed to delete word. Please try again.");
      }
      setLoading(false);
    }
  };

  const startAddingWord = () => {
    setAddingWord({
      word: '',
      difficulty: 'easy',
      // Remove initial type and expValue - backend will calculate and provide them
      emoji: '📝',
      exampleSentence: '',
      phonicsPattern: '', // Start with empty phonics pattern
      // addedBy might be set by the backend, remove from initial state if so
      // addedBy: 'admin', // Consider removing if backend handles this
    });
  };

  const handleSaveNewWord = async () => {
    if (!addingWord.word.trim()) {
      alert("❌ Word field cannot be empty!");
      return;
    }

    setLoading(true);
    try {
      // Prepare data to send - only include fields the admin can set
      const wordDataToSend = {
        word: addingWord.word,
        difficulty: addingWord.difficulty,
        phonicsPattern: addingWord.phonicsPattern,
        emoji: addingWord.emoji,
        exampleSentence: addingWord.exampleSentence,
        // Do NOT include type or expValue here
      };

      console.log("Sending to add endpoint:", wordDataToSend);

      // Use the authenticatedFetch helper to call your backend
      const result = await authenticatedFetch('https://spellread-master-production.up.railway.app/word/add-word', {
        method: 'POST',
        body: JSON.stringify(wordDataToSend), // Send only the data the admin provided
      });

      console.log("Word saved via backend:", result);

      // Reload from Firestore to reflect the word as saved by the backend (with calculated type/expValue)
      const querySnapshot = await getDocs(collection(db, 'wordBank'));
      const wordList = [];
      querySnapshot.forEach((doc) => {
        wordList.push({ id: doc.id, ...doc.data() });
      });
      setWords(wordList);

      setAddingWord(null);
      alert("✅ New word added successfully via backend!");
    } catch (error) {
      console.error("Error adding word via backend:", error);
      alert("Failed to add word via backend. Please try again. Error: " + error.message);
    }
    setLoading(false);
  };

  // Handle CSV Upload and Save to Firebase via Backend
  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split('\n');

      // Validate header row (optional but recommended)
      const headerRow = lines[0].split(',').map(col => col.trim().toLowerCase());
      const expectedHeaders = ['word', 'emoji', 'examplesentence', 'difficulty', 'phonicspattern'];
      const missingHeaders = expectedHeaders.filter(header => !headerRow.includes(header));
      if (missingHeaders.length > 0) {
        alert(`❌ Missing required headers: ${missingHeaders.join(', ')}. Please use the template.`);
        setLoading(false);
        return;
      }

      // Map column indices by name
      const colMap = {};
      expectedHeaders.forEach(header => {
        const index = headerRow.indexOf(header);
        colMap[header] = index;
      });

      const csvWords = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === 0 || !values[0]?.trim()) continue; // Skip empty rows

        // Extract values by header name, not position
        const word = values[colMap['word']]?.trim() || '';
        const emoji = values[colMap['emoji']]?.trim() || '📝';
        const exampleSentence = values[colMap['examplesentence']]?.trim() || '';
        let difficulty = values[colMap['difficulty']]?.trim()?.toLowerCase() || 'easy';
        const phonicsPattern = values[colMap['phonicspattern']]?.trim() || 'CVC';

        // Validate required fields
        if (!word) {
          console.warn(`⚠️ Skipping row ${i + 1}: Word is empty`);
          continue;
        }

        // Validate difficulty
        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
          console.warn(`⚠️ Invalid difficulty "${difficulty}" for word "${word}". Defaulting to 'easy'.`);
          difficulty = 'easy';
        }

        const wordData = {
          word,
          emoji,
          exampleSentence,
          difficulty,
          phonicsPattern
        };

        csvWords.push(wordData);

        // 🔥 Send each word to backend for automatic type/expValue calculation using the helper
        try {
          // This call will automatically get the token and add it to the headers
          const result = await authenticatedFetch('https://spellread-master-production.up.railway.app/word/add-word', {
            method: 'POST',
            body: JSON.stringify(wordData) // authenticatedFetch adds Content-Type and Authorization
          });
          console.log(`✅ Successfully added ${wordData.word} via backend:`, result);
        } catch (error) {
          console.error(`❌ Failed to process ${wordData.word} via backend:`, error.message);
          // Optionally, you could add the word to an error list to report later
          // For now, we'll just log the error and continue with the next word.
        }
      }

      // ✅ Reload words from Firestore after ALL backend processes them
      // This ensures the UI shows the most up-to-date list including the newly added words.
      try {
        console.log("Reloading words from Firestore after CSV upload...");
        // Note: Admin profiles might need to be re-fetched if the CSV upload could introduce new 'addedBy' UIDs
        // For now, we just reload words and rely on the existing adminProfiles state
        const querySnapshot = await getDocs(collection(db, 'wordBank'));
        const wordList = [];
        querySnapshot.forEach((doc) => {
          wordList.push({ id: doc.id, ...doc.data() });
        });
        setWords(wordList); // Update the local state
        console.log("Word list reloaded successfully.");
      } catch (err) {
        console.error("Failed to reload words after upload:", err);
        // Consider showing an alert or message to the user that the upload might have succeeded
        // but the UI couldn't update.
        alert("Upload may have completed, but failed to reload the word list. Please refresh the page manually.");
      }


      setLoading(false);
      alert(`✅ Successfully processed ${csvWords.length} words via backend!`);
    };
    reader.readAsText(file);
  };

  // Generate and download CSV template
  const downloadTemplate = () => {
    const header = "word,phonicsPattern,difficulty,emoji,exampleSentence\n";
    const templateRows = [
      "cat,CVC,easy,🐱,The cat sat on the mat.",
      "dog,CVC,easy,🐕,The dog ran fast.",
      "sun,CVC,easy,☀️,The sun is bright.",
      "fish,digraph,medium,🐟,The fish swims in the sea.",
      "cake,silent_e,hard,🎂,She ate a big cake."
    ].join("\n");

    const csvContent = header + templateRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'wordbank_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats based on difficulty distribution
  const totalWords = words.length;
  const easyWords = words.filter(w => w.difficulty === 'easy').length;
  const mediumWords = words.filter(w => w.difficulty === 'medium').length;
  const hardWords = words.filter(w => w.difficulty === 'hard').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FDFBF7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-16 rounded-3xl overflow-hidden mt-14 shadow-sm">
      <div className="max-w-7xl mx-auto">
        {/* Add the datalist for phonics patterns here */}
        <datalist id="phonicsPatternList">
          <option value="CVC" />
          <option value="VC" />
          <option value="CV" />
          <option value="double_consonant" />
          <option value="blends_fl" />
          <option value="blends_st" />
          <option value="digraph_sh" />
          <option value="digraph_ch" />
          <option value="digraph_th" />
          <option value="silent_e" />
          <option value="long_vowel_ai" />
          <option value="vowel_team_oa" />
          <option value="vowel_team_ee" />
          <option value="r_controlled_ar" />
          <option value="r_controlled_er" />
          <option value="diphthong_oi" />
          <option value="diphthong_ou" />
          <option value="multisyllabic" />
          <option value="compound" />
          <option value="sight_word_irregular" />
        </datalist>

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">WordBank Management</h1>
          </div>
          <p className="text-gray-600">Manage vocabulary for AI-generated quizzes</p>
        </div>

        {/* Stats Cards - Updated to show difficulty distribution */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-10 h-10 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{easyWords}</p>
            <p className="text-sm text-gray-600">Easy Words</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-10 h-10 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{mediumWords}</p>
            <p className="text-sm text-gray-600">Medium Words</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-red-200">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-10 h-10 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{hardWords}</p>
            <p className="text-sm text-gray-600">Hard Words</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-10 h-10 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{totalWords}</p>
            <p className="text-sm text-gray-600">Total Words</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-6 flex items-center justify-between border-2 border-orange-200">
          <div className="flex items-center gap-4">
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
            
            <label className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload CSV File
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
            </label>
          </div>
          
          <button
            onClick={startAddingWord}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Word
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search words, types, patterns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-800"
            />
          </div>
        </div>

        {/* Words List */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-orange-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-400 to-yellow-400 px-6 py-4">
            <h2 className="text-xl font-bold text-white">
              All Words ({filteredWords.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredWords.map((word) => (
              <div
                key={word.id}
                className="p-6 hover:bg-orange-50 transition-all"
              >
                <div className="flex items-center gap-6">
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-6 h-6 text-gray-400" />
                  </div>

                  {/* Word Icon & Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                      {word.emoji}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{word.word}</h3>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                          {word.type || 'N/A'}
                        </span>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          word.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          word.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          word.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {word.difficulty || 'N/A'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-6 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Phonics Pattern</p>
                          <p className="font-bold text-gray-800">{word.phonicsPattern || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">EXP Value</p>
                          <p className="font-bold text-gray-800 flex items-center gap-1">
                            <Zap className="w-4 h-4 text-purple-500" />
                            {word.expValue || 10}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Added By</p>
                          {/* Display role from adminProfiles state, fallback to UID */}
                          <p className="font-bold text-gray-800">{adminProfiles[word.addedBy] || word.addedBy}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Example</p>
                          <p className="font-bold text-gray-800 truncate max-w-xs">{word.exampleSentence}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditWord(word)}
                      className="p-3 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-all"
                      title="Edit Word"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteWord(word.id, word.word)}
                      className="p-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-all"
                      title="Delete Word"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Word Modal */}
        {editingWord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-orange-400 to-yellow-400 px-8 py-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Edit Word: {editingWord.word}</h2>
                <button
                  onClick={() => setEditingWord(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-6">
                {/* Word & Emoji */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Word</label>
                    <input
                      type="text"
                      value={editingWord.word}
                      onChange={(e) => setEditingWord({ ...editingWord, word: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-800"
                      readOnly // Consider making word field read-only during edit to prevent ID conflicts
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Emoji</label>
                    <input
                      type="text"
                      value={editingWord.emoji}
                      onChange={(e) => setEditingWord({ ...editingWord, emoji: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-2xl text-center text-gray-800"
                    />
                  </div>
                </div>

                {/* Difficulty & Phonics Pattern — CRITICAL FIELDS */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty</label>
                    <select
                      value={editingWord.difficulty || 'easy'}
                      onChange={(e) => setEditingWord({ ...editingWord, difficulty: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-800"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div> {/* Phonics Pattern Input */}
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phonics Pattern</label>
                    <input
                      type="text"
                      list="phonicsPatternList" // Links to the datalist defined above
                      value={editingWord.phonicsPattern || ''}
                      onChange={(e) => setEditingWord({ ...editingWord, phonicsPattern: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-800"
                      placeholder="Type or select..." // Optional placeholder
                    />
                  </div>
                </div>

                {/* Example Sentence */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Example Sentence</label>
                  <textarea
                    value={editingWord.exampleSentence}
                    onChange={(e) => setEditingWord({ ...editingWord, exampleSentence: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-800"
                    rows="3"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                  <button
                    onClick={handleSaveWord}
                    className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingWord(null)}
                    className="px-8 py-4 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Word Modal */}
        {addingWord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-green-400 to-emerald-500 px-8 py-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Add New Word</h2>
                <button
                  onClick={() => setAddingWord(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-6">
                {/* Word & Emoji */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Word</label>
                    <input
                      type="text"
                      value={addingWord.word}
                      onChange={(e) => setAddingWord({ ...addingWord, word: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Emoji</label>
                    <input
                      type="text"
                      value={addingWord.emoji}
                      onChange={(e) => setAddingWord({ ...addingWord, emoji: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-2xl text-center text-gray-800"
                    />
                  </div>
                </div>

                {/* Difficulty & Phonics Pattern — CRITICAL FIELDS */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty</label>
                    <select
                      value={addingWord.difficulty || 'easy'}
                      onChange={(e) => setAddingWord({ ...addingWord, difficulty: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-gray-800"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div> {/* Phonics Pattern Input */}
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phonics Pattern</label>
                    <input
                      type="text"
                      list="phonicsPatternList" // Links to the datalist defined above
                      value={addingWord.phonicsPattern || ''}
                      onChange={(e) => setAddingWord({ ...addingWord, phonicsPattern: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-gray-800"
                      placeholder="Type or select..." // Optional placeholder
                    />
                  </div>
                </div>

                {/* Example Sentence */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Example Sentence</label>
                  <textarea
                    value={addingWord.exampleSentence}
                    onChange={(e) => setAddingWord({ ...addingWord, exampleSentence: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-gray-800"
                    rows="3"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                  <button
                    onClick={handleSaveNewWord}
                    className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Word
                  </button>
                  <button
                    onClick={() => setAddingWord(null)}
                    className="px-8 py-4 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}