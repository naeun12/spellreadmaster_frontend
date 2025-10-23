import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, GripVertical, Eye, EyeOff, Zap, BookOpen, Target, Award, TrendingUp, TrendingDown, Gamepad2 } from 'lucide-react';

export default function LevelBasedLearningMode() {
  const [editingLevel, setEditingLevel] = useState(null);
  const [showAddLevel, setShowAddLevel] = useState(false);

  // Level data
  const [levels, setLevels] = useState([
    { id: 1, level: 1, theme: 'Short Vowels', icon: '🔤', color: 'from-blue-400 to-cyan-400', expRequired: 0, expReward: 50, wordCount: 20, active: true, difficulty: 'Easy', completionRate: 85 },
    { id: 2, level: 2, theme: 'Long Vowels', icon: '📝', color: 'from-green-400 to-emerald-400', expRequired: 50, expReward: 75, wordCount: 25, active: true, difficulty: 'Easy', completionRate: 78 },
    { id: 3, level: 3, theme: 'Consonant Blends', icon: '🎯', color: 'from-purple-400 to-pink-400', expRequired: 125, expReward: 100, wordCount: 30, active: true, difficulty: 'Medium', completionRate: 62 },
    { id: 4, level: 4, theme: 'Sight Words', icon: '👀', color: 'from-orange-400 to-red-400', expRequired: 225, expReward: 125, wordCount: 40, active: true, difficulty: 'Medium', completionRate: 71 },
    { id: 5, level: 5, theme: 'Rhyming Words', icon: '🎵', color: 'from-yellow-400 to-amber-400', expRequired: 350, expReward: 150, wordCount: 35, active: true, difficulty: 'Medium', completionRate: 68 },
    { id: 6, level: 6, theme: 'Word Families', icon: '👨‍👩‍👧', color: 'from-rose-400 to-pink-400', expRequired: 500, expReward: 175, wordCount: 45, active: true, difficulty: 'Hard', completionRate: 54 },
    { id: 7, level: 7, theme: 'Challenge Words', icon: '🏆', color: 'from-violet-400 to-purple-400', expRequired: 675, expReward: 200, wordCount: 50, active: false, difficulty: 'Hard', completionRate: 45 }
  ]);

  const colorOptions = [
    { name: 'Blue', value: 'from-blue-400 to-cyan-400' },
    { name: 'Green', value: 'from-green-400 to-emerald-400' },
    { name: 'Purple', value: 'from-purple-400 to-pink-400' },
    { name: 'Orange', value: 'from-orange-400 to-red-400' },
    { name: 'Yellow', value: 'from-yellow-400 to-amber-400' },
    { name: 'Rose', value: 'from-rose-400 to-pink-400' },
    { name: 'Violet', value: 'from-violet-400 to-purple-400' },
    { name: 'Indigo', value: 'from-indigo-400 to-blue-400' },
    { name: 'Teal', value: 'from-teal-400 to-cyan-400' }
  ];

  const handleEditLevel = (level) => {
    setEditingLevel({ ...level });
  };

  const handleSaveLevel = () => {
    setLevels(levels.map(l => l.id === editingLevel.id ? editingLevel : l));
    setEditingLevel(null);
  };

  const handleDeleteLevel = (id) => {
    if (confirm('Are you sure you want to delete this level? This action cannot be undone.')) {
      setLevels(levels.filter(l => l.id !== id));
    }
  };

  const handleToggleActive = (id) => {
    setLevels(levels.map(l => l.id === id ? { ...l, active: !l.active } : l));
  };

  const handleAddLevel = () => {
    const newLevel = {
      id: Math.max(...levels.map(l => l.id)) + 1,
      level: levels.length + 1,
      theme: 'New Theme',
      icon: '📚',
      color: 'from-gray-400 to-gray-600',
      expRequired: levels[levels.length - 1].expRequired + 150,
      expReward: levels[levels.length - 1].expReward + 25,
      wordCount: 20,
      active: true,
      difficulty: 'Medium',
      completionRate: 0
    };
    setLevels([...levels, newLevel]);
    setShowAddLevel(false);
  };

  const totalLevels = levels.length;
  const activeLevels = levels.filter(l => l.active).length;
  const avgCompletionRate = Math.round(levels.reduce((acc, l) => acc + l.completionRate, 0) / levels.length);
  const totalExpNeeded = levels[levels.length - 1]?.expRequired || 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-16 rounded-3xl overflow-hidden mt-14 shadow-sm">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Level-Based Mode Management</h1>
              </div>
              <p className="text-gray-600">Create and manage level-based learning quizzes</p>
            </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-10 h-10 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{totalLevels}</p>
            <p className="text-sm text-gray-600">Total Levels</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-10 h-10 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{activeLevels}</p>
            <p className="text-sm text-gray-600">Active Levels</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-10 h-10 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{avgCompletionRate}%</p>
            <p className="text-sm text-gray-600">Avg Completion</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-10 h-10 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{totalExpNeeded}</p>
            <p className="text-sm text-gray-600">Total EXP Needed</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-6 flex items-center justify-between border-2 border-orange-200">
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview Student View
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all">
              Export Configuration
            </button>
          </div>
          <button
            onClick={() => setShowAddLevel(true)}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Level
          </button>
        </div>

        {/* Levels List */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-orange-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-400 to-yellow-400 px-6 py-4">
            <h2 className="text-xl font-bold text-white">All Levels ({totalLevels})</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {levels.map((level) => (
              <div
                key={level.id}
                className={`p-6 hover:bg-orange-50 transition-all ${!level.active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-6">
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-6 h-6 text-gray-400" />
                  </div>

                  {/* Level Icon & Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-20 h-20 bg-gradient-to-br ${level.color} rounded-2xl flex items-center justify-center text-4xl shadow-lg`}>
                      {level.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">Level {level.level}</h3>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                          {level.theme}
                        </span>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          level.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                          level.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {level.difficulty}
                        </span>
                        {!level.active && (
                          <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded-full">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-4 gap-6 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">EXP Required</p>
                          <p className="font-bold text-gray-800 flex items-center gap-1">
                            <Zap className="w-4 h-4 text-purple-500" />
                            {level.expRequired}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">EXP Reward</p>
                          <p className="font-bold text-gray-800 flex items-center gap-1">
                            <Award className="w-4 h-4 text-green-500" />
                            +{level.expReward}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Word Count</p>
                          <p className="font-bold text-gray-800">{level.wordCount} words</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Completion Rate</p>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-800">{level.completionRate}%</p>
                            {level.completionRate >= 70 ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(level.id)}
                      className={`p-3 rounded-lg transition-all ${
                        level.active 
                          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={level.active ? 'Deactivate' : 'Activate'}
                    >
                      {level.active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleEditLevel(level)}
                      className="p-3 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-all"
                      title="Edit Level"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLevel(level.id)}
                      className="p-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-all"
                      title="Delete Level"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Level Modal */}
        {editingLevel && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-orange-400 to-yellow-400 px-8 py-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Edit Level {editingLevel.level}</h2>
                <button
                  onClick={() => setEditingLevel(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-6">
                {/* Theme & Icon */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Theme Name</label>
                    <input
                      type="text"
                      value={editingLevel.theme}
                      onChange={(e) => setEditingLevel({ ...editingLevel, theme: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Icon (Emoji)</label>
                    <input
                      type="text"
                      value={editingLevel.icon}
                      onChange={(e) => setEditingLevel({ ...editingLevel, icon: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-2xl text-center"
                    />
                  </div>
                </div>

                {/* Color Theme */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Color Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {colorOptions.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setEditingLevel({ ...editingLevel, color: color.value })}
                        className={`h-16 bg-gradient-to-br ${color.value} rounded-lg transition-all ${
                          editingLevel.color === color.value 
                            ? 'ring-4 ring-orange-400 scale-105' 
                            : 'hover:scale-105'
                        }`}
                      >
                        <span className="text-white font-bold text-sm">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* EXP Settings */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">EXP Required to Unlock</label>
                    <input
                      type="number"
                      value={editingLevel.expRequired}
                      onChange={(e) => setEditingLevel({ ...editingLevel, expRequired: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">EXP Reward on Completion</label>
                    <input
                      type="number"
                      value={editingLevel.expReward}
                      onChange={(e) => setEditingLevel({ ...editingLevel, expReward: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Content Settings */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Word Count</label>
                    <input
                      type="number"
                      value={editingLevel.wordCount}
                      onChange={(e) => setEditingLevel({ ...editingLevel, wordCount: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty</label>
                    <select
                      value={editingLevel.difficulty}
                      onChange={(e) => setEditingLevel({ ...editingLevel, difficulty: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                  <input
                    type="checkbox"
                    id="active"
                    checked={editingLevel.active}
                    onChange={(e) => setEditingLevel({ ...editingLevel, active: e.target.checked })}
                    className="w-5 h-5 text-orange-600 rounded"
                  />
                  <label htmlFor="active" className="text-sm font-bold text-gray-700">
                    Level is active and visible to students
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                  <button
                    onClick={handleSaveLevel}
                    className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingLevel(null)}
                    className="px-8 py-4 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Level Confirmation */}
        {showAddLevel && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Add New Level?</h3>
              <p className="text-gray-600 mb-6">
                This will create a new level at the end of the progression. You can edit its details after creation.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleAddLevel}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
                >
                  Create Level
                </button>
                <button
                  onClick={() => setShowAddLevel(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}