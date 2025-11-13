import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, GripVertical, Eye, EyeOff, Zap, BookOpen, Target, Award, TrendingUp, TrendingDown, Gamepad2, Upload, Search, Download } from 'lucide-react';
import { db } from '../../firebase'; // adjust path as needed
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function LevelBasedLearningMode() {
  const [editingWord, setEditingWord] = useState(null);
  const [addingWord, setAddingWord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // WordBank data
  const [words, setWords] = useState([]);

  // Load words from Firestore on component mount
  useEffect(() => {
    const loadWords = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'wordBank'));
        const wordList = [];
        querySnapshot.forEach((doc) => {
          wordList.push({ id: doc.id, ...doc.data() });
        });
        setWords(wordList);
      } catch (error) {
        console.error("Error loading words:", error);
        alert("Failed to load word bank. Check connection.");
      }
      setLoading(false);
    };

    loadWords();
  }, []);

  // Filter words based on search term
  const filteredWords = words.filter(word => 
    word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.phonicsPattern.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.difficulty.includes(searchTerm.toLowerCase())
  );

  const handleEditWord = (word) => {
    setEditingWord({ ...word });
  };

  const handleSaveWord = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'wordBank', editingWord.word), editingWord);
      setWords(words.map(w => w.id === editingWord.id ? editingWord : w));
      setEditingWord(null);
      alert("✅ Word updated successfully!");
    } catch (error) {
      console.error("Error updating word:", error);
      alert("Failed to update word. Please try again.");
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
      type: 'CVC',
      emoji: '📝',
      exampleSentence: '',
      phonicsPattern: 'CVC',
      addedBy: 'admin',
      expValue: 10
    });
  };

  const handleSaveNewWord = async () => {
    if (!addingWord.word.trim()) {
      alert("❌ Word field cannot be empty!");
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, 'wordBank', addingWord.word), addingWord);
      setWords([...words, { ...addingWord, id: Date.now() }]);
      setAddingWord(null);
      alert("✅ New word added successfully!");
    } catch (error) {
      console.error("Error adding word:", error);
      alert("Failed to add word. Please try again.");
    }
    setLoading(false);
  };

  // Handle CSV Upload and Save to Firebase
  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      
      const csvWords = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= 7 && values[0]) { // Ensure all fields exist
          const word = {
            word: values[0],
            difficulty: values[1],
            type: values[2],
            emoji: values[3],
            exampleSentence: values[4],
            phonicsPattern: values[5],
            addedBy: values[6] || 'admin',
            expValue: 10 // Default EXP value
          };
          csvWords.push(word);

          // 🔥 Save each word to Firestore in wordBank collection
          try {
            await setDoc(doc(db, 'wordBank', values[0]), word);
          } catch (error) {
            console.error(`❌ Failed to save ${values[0]} to Firestore:`, error);
          }
        }
      }

      // ✅ Update local state to show instantly
      setWords(csvWords);
      setLoading(false);
      alert(`✅ Successfully imported and saved ${csvWords.length} words to Firebase!`);
    };
    reader.readAsText(file);
  };

  // Generate and download CSV template
  const downloadTemplate = () => {
    const header = "word,difficulty,type,emoji,exampleSentence,phonicsPattern,addedBy\n";
    const templateRows = [
      "cat,easy,CVC,🐱,The cat sat on the mat.,CVC,admin",
      "dog,easy,CVC,🐕,The dog ran fast.,CVC,admin",
      "sun,easy,CVC,☀️,The sun is bright.,CVC,admin",
      "fish,medium,digraph,🐟,The fish swims in the sea.,sh,admin",
      "cake,hard,silent_e,🎂,She ate a big cake.,silent_e,admin"
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
                          {word.type}
                        </span>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          word.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          word.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {word.difficulty}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-6 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Phonics Pattern</p>
                          <p className="font-bold text-gray-800">{word.phonicsPattern}</p>
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
                          <p className="font-bold text-gray-800">{word.addedBy}</p>
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

                {/* Type & Difficulty */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                    <select
                      value={editingWord.type}
                      onChange={(e) => setEditingWord({ ...editingWord, type: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-800"
                    >
                      <option value="CVC">CVC</option>
                      <option value="digraph">Digraph</option>
                      <option value="blend">Blend</option>
                      <option value="silent_e">Silent E</option>
                      <option value="vowel_team">Vowel Team</option>
                      <option value="sight_word">Sight Word</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty</label>
                    <select
                      value={editingWord.difficulty}
                      onChange={(e) => setEditingWord({ ...editingWord, difficulty: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-800"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Phonics Pattern & EXP Value */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phonics Pattern</label>
                    <input
                      type="text"
                      value={editingWord.phonicsPattern}
                      onChange={(e) => setEditingWord({ ...editingWord, phonicsPattern: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">EXP Value</label>
                    <input
                      type="number"
                      value={editingWord.expValue}
                      onChange={(e) => setEditingWord({ ...editingWord, expValue: parseInt(e.target.value) || 10 })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-800"
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

                {/* Type & Difficulty */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                    <select
                      value={addingWord.type}
                      onChange={(e) => setAddingWord({ ...addingWord, type: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-gray-800"
                    >
                      <option value="CVC">CVC</option>
                      <option value="digraph">Digraph</option>
                      <option value="blend">Blend</option>
                      <option value="silent_e">Silent E</option>
                      <option value="vowel_team">Vowel Team</option>
                      <option value="sight_word">Sight Word</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty</label>
                    <select
                      value={addingWord.difficulty}
                      onChange={(e) => setAddingWord({ ...addingWord, difficulty: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-gray-800"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Phonics Pattern & EXP Value */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phonics Pattern</label>
                    <input
                      type="text"
                      value={addingWord.phonicsPattern}
                      onChange={(e) => setAddingWord({ ...addingWord, phonicsPattern: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">EXP Value</label>
                    <input
                      type="number"
                      value={addingWord.expValue}
                      onChange={(e) => setAddingWord({ ...addingWord, expValue: parseInt(e.target.value) || 10 })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-gray-800"
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