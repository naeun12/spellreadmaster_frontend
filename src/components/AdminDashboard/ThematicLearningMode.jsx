import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { Puzzle, Plus, Edit2, Trash2, Save, X, Search, Filter, ChevronDown, ChevronUp, Upload, Wand2, Sparkles } from 'lucide-react';

export default function ThematicLearningMode() {
  const [themes, setThemes] = useState([]);
  const [loadingThemes, setLoadingThemes] = useState(true);
  // Firestore CRUD functions
  const fetchThemes = async () => {
    setLoadingThemes(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'themes'));
      const themeList = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setThemes(themeList);
    } catch {
      alert('Failed to fetch themes from database.');
    } finally {
      setLoadingThemes(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const createTheme = async (theme) => {
    try {
      const docRef = await addDoc(collection(db, 'themes'), theme);
      setThemes(prev => [...prev, { ...theme, id: docRef.id }]);
    } catch {
      alert('Failed to create theme.');
    }
  };

  const updateTheme = async (id, theme) => {
    try {
      await updateDoc(doc(db, 'themes', id), theme);
      setThemes(prev => prev.map(t => t.id === id ? { ...theme, id } : t));
    } catch {
      alert('Failed to update theme.');
    }
  };

  const deleteTheme = async (id) => {
    try {
      await deleteDoc(doc(db, 'themes', id));
      setThemes(prev => prev.filter(t => t.id !== id));
    } catch {
      alert('Failed to delete theme.');
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [expandedTheme, setExpandedTheme] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [bulkInput, setBulkInput] = useState('');
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'Easy',
    gradient: 'from-blue-500 to-indigo-500',
    icon: '📚',
    description: '',
    words: []
  });

  const [wordInput, setWordInput] = useState({ word: '', definition: '', image: '' });

  // AI Generation state
  const [aiCount, setAiCount] = useState(15);
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');

  const gradientOptions = [
    { value: 'from-blue-500 to-indigo-500', label: 'Blue', preview: 'bg-gradient-to-r from-blue-500 to-indigo-500' },
    { value: 'from-purple-500 to-pink-500', label: 'Purple', preview: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { value: 'from-green-500 to-emerald-500', label: 'Green', preview: 'bg-gradient-to-r from-green-500 to-emerald-500' },
    { value: 'from-orange-500 to-red-500', label: 'Orange', preview: 'bg-gradient-to-r from-orange-500 to-red-500' },
    { value: 'from-cyan-500 to-teal-500', label: 'Cyan', preview: 'bg-gradient-to-r from-cyan-500 to-teal-500' },
    { value: 'from-pink-500 to-rose-500', label: 'Pink', preview: 'bg-gradient-to-r from-pink-500 to-rose-500' }
  ];

  const difficultyOptions = ['Easy', 'Medium', 'Hard'];

  const handleOpenModal = (theme = null) => {
    if (theme) {
      setEditingTheme(theme);
      setFormData({
        title: theme.title,
        difficulty: theme.difficulty,
        gradient: theme.gradient,
        icon: theme.icon,
        description: theme.description,
        words: [...theme.words]
      });
    } else {
      setEditingTheme(null);
      setFormData({
        title: '',
        difficulty: 'Easy',
        gradient: 'from-blue-500 to-indigo-500',
        icon: '📚',
        description: '',
        words: []
      });
    }
    setBulkInput('');
    setShowAIGenerator(false);
    setAiError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTheme(null);
    setWordInput({ word: '', definition: '' });
    setBulkInput('');
    setShowAIGenerator(false);
    setAiError('');
  };

  const handleAddWord = () => {
    if (wordInput.word.trim() && wordInput.definition.trim()) {
      setFormData({
        ...formData,
        words: [...formData.words, { ...wordInput }]
      });
      setWordInput({ word: '', definition: '', image: '' });
    }
  };

  const handleRemoveWord = (index) => {
    setFormData({
      ...formData,
      words: formData.words.filter((_, i) => i !== index)
    });
  };

  const handleWordChange = (index, field, value) => {
    setFormData(prev => {
      const newWords = prev.words.map((w, i) => i === index ? { ...w, [field]: value } : w);
      return { ...prev, words: newWords };
    });
  };

  const handleBulkImport = () => {
    if (!bulkInput.trim()) return;

    const lines = bulkInput.trim().split('\n');
    const newWords = lines
      .map(line => {
        const parts = line.split(/[,|\t]/).map(p => p.trim());
        if (parts.length >= 2) {
          return {
            word: parts[0],
            definition: parts[1],
            image: parts[2] || ''
          };
        }
        return null;
      })
      .filter(w => w !== null);

    if (newWords.length > 0) {
      setFormData(prev => ({ ...prev, words: [...prev.words, ...newWords] }));
      setBulkInput('');
      alert(`Successfully imported ${newWords.length} words!`);
    }
  };

  const handleCSVImport = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      
      const startIndex = lines[0].toLowerCase().includes('word') || 
                        lines[0].toLowerCase().includes('definition') ? 1 : 0;
      
      const newWords = [];
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current.trim());

        const cleanParts = parts.map(p => p.replace(/^["']|["']$/g, ''));

        if (cleanParts.length >= 2 && cleanParts[0] && cleanParts[1]) {
          newWords.push({
            word: cleanParts[0],
            definition: cleanParts[1]
          });
        }
      }

      if (newWords.length > 0) {
        setFormData(prev => ({ ...prev, words: [...prev.words, ...newWords] }));
        alert(`Successfully imported ${newWords.length} words from CSV!`);
      } else {
        alert('No valid words found in CSV file.');
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const generateWithAI = async (customPrompt = '') => {
    setAiLoading(true);
    setAiError('');
    
    const API_KEY = import.meta.env.VITE_OPENAI_KEY;
    const BASE_URL = "https://openrouter.ai/api/v1";

    const themeContext = formData.title || formData.description || 'general vocabulary';

    const prompt = customPrompt || 
      `Generate ${aiCount} simple words suitable for Grade 1 students related to the theme "${themeContext}". For each word, provide a very simple definition that a 6-year-old can understand. Format as: word, definition (one per line). Only return the word list, no additional text.`;
    
    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Theme Management App',
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices[0].message.content;

      const newWords = parseAIResponse(text);

      if (newWords.length > 0) {
        setFormData(prev => ({ ...prev, words: [...prev.words, ...newWords] }));
        setShowAIGenerator(false);
        alert(`Successfully generated ${newWords.length} words with AI!`);
      } else {
        throw new Error('Could not parse AI response into word list');
      }
    } catch (err) {
      setAiError(`Error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const parseAIResponse = (text) => {
    const lines = text.trim().split('\n');
    return lines
      .map(line => {
        const match = line.match(/^[0-9.)\s-]*(.+?)[,:-]\s*(.+)$/);
        if (match) {
          return {
            word: match[1].trim(),
            definition: match[2].trim()
          };
        }

        const parts = line.split(/[,|\t]/).map(p => p.trim());
        if (parts.length >= 2) {
          return {
            word: parts[0].replace(/^[0-9.)\s-]+/, '').trim(),
            definition: parts[1].trim()
          };
        }
        return null;
      })
      .filter(item => item && item.word && item.definition);
  };


  const handleSaveTheme = async () => {
    if (!formData.title.trim() || formData.words.length === 0) {
      alert('Please fill in all required fields and add at least one word.');
      return;
    }
    if (editingTheme) {
      await updateTheme(editingTheme.id, formData);
    } else {
      await createTheme(formData);
    }
    handleCloseModal();
  };

  const handleDeleteTheme = async (id) => {
    if (window.confirm('Are you sure you want to delete this theme?')) {
      await deleteTheme(id);
    }
  };

  const filteredThemes = themes.filter(theme => {
    const matchesSearch = theme.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         theme.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'All' || theme.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-16 rounded-3xl overflow-hidden mt-14 shadow-sm">
      <div className="max-w-7xl mx-auto">
        {loadingThemes && (
          <div className="text-center py-8 text-lg text-gray-500">Loading themes from database...</div>
        )}
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Puzzle className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Theme Management</h1>
              </div>
              <p className="text-gray-600">Create and manage thematic learning collections</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Create Theme
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search themes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900"
              >
                <option value="All" className="text-gray-900">All Difficulties</option>
                {difficultyOptions.map(diff => (
                  <option key={diff} value={diff} className="text-gray-900">{diff}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Themes List */}
        <div className="space-y-4">
          {filteredThemes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <p className="text-gray-500">No themes found. Create your first theme to get started!</p>
            </div>
          ) : (
            filteredThemes.map(theme => (
              <div key={theme.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                {/* Theme Header */}
                <div className={`bg-gradient-to-r ${theme.gradient} p-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-3xl">
                        {theme.icon}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{theme.title}</h3>
                        <p className="text-white/90 text-sm">{theme.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(theme)}
                        className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg transition-all"
                      >
                        <Edit2 className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={() => handleDeleteTheme(theme.id)}
                        className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Theme Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                        {theme.difficulty}
                      </span>
                      <span className="text-gray-600 text-sm">
                        {theme.words.length} words
                      </span>
                    </div>
                    <button
                      onClick={() => setExpandedTheme(expandedTheme === theme.id ? null : theme.id)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      {expandedTheme === theme.id ? (
                        <>Hide Words <ChevronUp className="w-4 h-4" /></>
                      ) : (
                        <>View Words <ChevronDown className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>

                  {/* Word List */}
                  {expandedTheme === theme.id && (
                    <div className="mt-4 space-y-2 border-t pt-4">
                      {theme.words.map((word, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{word.word}</div>
                            <div className="text-sm text-gray-600">{word.definition}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTheme ? 'Edit Theme' : 'Create New Theme'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Theme Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Science, Mathematics"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the theme"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Difficulty *
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900"
                    >
                      {difficultyOptions.map(diff => (
                        <option key={diff} value={diff} className="text-gray-900">{diff}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Icon Emoji
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="📚"
                      maxLength={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Color Gradient
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {gradientOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setFormData({ ...formData, gradient: option.value })}
                        className={`h-12 rounded-lg ${option.preview} transition-all ${
                          formData.gradient === option.value 
                            ? 'ring-4 ring-blue-500 ring-offset-2' 
                            : 'hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Word Management */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Words ({formData.words.length})</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAIGenerator(!showAIGenerator)}
                      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all text-sm"
                    >
                      <Wand2 className="w-4 h-4" />
                      AI Generate
                    </button>
                  </div>
                </div>

                {/* AI Generator Section */}
                {showAIGenerator && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-purple-900 mb-2">
                      <Sparkles className="w-5 h-5" />
                      <h4 className="font-semibold">AI Word Generator for Grade 1</h4>
                    </div>
                    
                    <div className="p-3 bg-purple-100 border border-purple-300 rounded-lg">
                      <p className="text-sm text-purple-900">
                        <strong>Theme:</strong> {formData.title || 'Not set yet'}
                      </p>
                      <p className="text-xs text-purple-700 mt-1">
                        AI will generate words based on your theme title above. Make sure to fill in the theme title first!
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Word Count</label>
                      <input 
                        type="text" 
                        value={aiCount} 
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          const num = parseInt(val) || 0;
                          if (num >= 0 && num <= 30) {
                            setAiCount(num);
                          }
                        }}
                        placeholder="Enter number (5-30)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter a number between 5 and 30</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Custom Prompt (Optional)</label>
                      <textarea
                        value={aiCustomPrompt}
                        onChange={(e) => setAiCustomPrompt(e.target.value)}
                        placeholder="e.g., Generate science vocabulary for beginners with simple definitions"
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none text-sm"
                      />
                    </div>

                    {aiError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {aiError}
                      </div>
                    )}

                    <button
                      onClick={() => generateWithAI(aiCustomPrompt)}
                      disabled={aiLoading || !formData.title.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
                    >
                      {aiLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          {!formData.title.trim() ? 'Set Theme Title First' : 'Generate with AI'}
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {/* Bulk Import Section */}
                <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Bulk Import Words</h4>
                  <p className="text-xs text-blue-700 mb-3">
                    Format: <code className="bg-blue-100 px-1 py-0.5 rounded">word, definition</code> (one per line)
                  </p>
                  <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder="Example:&#10;apple, A round fruit&#10;ball, A round toy&#10;cat, A furry pet"
                    rows="4"
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none text-sm font-mono"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handleBulkImport}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Import Words
                    </button>
                    <input
                      type="file"
                      accept=".csv"
                      id="csv-import-theme"
                      className="hidden"
                      onChange={handleCSVImport}
                    />
                    <button
                      type="button"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-1"
                      onClick={() => document.getElementById('csv-import-theme').click()}
                    >
                      <Upload className="w-4 h-4" /> Import CSV
                    </button>
                  </div>
                </div>

                {/* Add/Edit Word Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={wordInput.word}
                      onChange={(e) => setWordInput({ ...wordInput, word: e.target.value })}
                      placeholder="Word"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      value={wordInput.definition}
                      onChange={(e) => setWordInput({ ...wordInput, definition: e.target.value })}
                      placeholder="Definition"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      value={wordInput.image}
                      onChange={(e) => setWordInput({ ...wordInput, image: e.target.value })}
                      placeholder="Image URL (optional)"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleAddWord}
                    disabled={!wordInput.word.trim() || !wordInput.definition.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Add Word
                  </button>
                </div>

                {/* Word List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {formData.words.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No words added yet</p>
                  ) : (
                    formData.words.map((word, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{word.word}</div>
                          <div className="text-sm text-gray-600">{word.definition}</div>
                          {word.image && (
                            <img src={word.image} alt={word.word} className="mt-2 w-16 h-16 object-contain rounded border" />
                          )}
                          <input
                            type="text"
                            value={word.image || ''}
                            onChange={e => handleWordChange(index, 'image', e.target.value)}
                            placeholder="Image URL (optional)"
                            className="mt-2 w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveWord(index)}
                          className="p-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTheme}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                <Save className="w-4 h-4" />
                {editingTheme ? 'Update Theme' : 'Create Theme'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}