// src/components/StudentProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, RefreshCw, Check } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';

const DICEBEAR_STYLE = 'fun-emoji';
const DICEBEAR_SVG_URL = (seed) =>
  `https://api.dicebear.com/7.x/${DICEBEAR_STYLE}/svg?seed=${encodeURIComponent(seed)}`;

const generateRandomSeed = () => Math.random().toString(36).substring(2, 10);

export default function StudentProfileSettings() {
  const [nickname, setNickname] = useState(''); // ✅ Changed to nickname
  const [selectedSeed, setSelectedSeed] = useState('');
  const [currentAvatars, setCurrentAvatars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingAvatars, setFetchingAvatars] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  const generateAvatarBatch = async () => {
    setFetchingAvatars(true);
    const seeds = Array.from({ length: 8 }, generateRandomSeed);
    const avatars = [];

    for (const seed of seeds) {
      try {
        const res = await fetch(DICEBEAR_SVG_URL(seed));
        const svg = await res.text();
        avatars.push({ seed, svg });
      } catch {
        console.warn('Failed to load avatar for seed:', seed);
      }
    }

    setCurrentAvatars(avatars);
    if (!selectedSeed && avatars.length > 0) {
      setSelectedSeed(avatars[0].seed);
    }
    setFetchingAvatars(false);
  };

  useEffect(() => {
    if (!currentUser) return;

    const loadProfile = async () => {
      try {
        const studentDoc = doc(db, 'students', currentUser.uid);
        const docSnap = await getDoc(studentDoc);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // ✅ Load existing nickname (if any)
          setNickname(data.nickname || '');
        }
        await generateAvatarBatch();
      } catch (err) {
        console.error('Failed to load profile:', err);
        setMessage({ type: 'error', text: 'Failed to load profile.' });
        await generateAvatarBatch();
      }
    };

    loadProfile();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !nickname.trim() || !selectedSeed) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const selectedAvatar = currentAvatars.find(a => a.seed === selectedSeed);
      if (!selectedAvatar) throw new Error('Selected avatar not found');

      const studentRef = doc(db, 'students', currentUser.uid);

      // Optional: sync nickname to Auth displayName (for consistency)
      await updateProfile(currentUser, {
        displayName: nickname,
        photoURL: DICEBEAR_SVG_URL(selectedSeed),
      });

      // ✅ Save nickname + raw SVG
      await updateDoc(studentRef, {
        nickname: nickname.trim(), // ← new field
        avatar: selectedAvatar.svg,
        seed: selectedSeed,
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => {
        navigate('/StudentPage');
      }, 1000);
    } catch (err) {
      console.error('Update error:', err);
      setMessage({
        type: 'error',
        text: err.message || 'Failed to update profile.',
      });
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-red-600 text-xl">You must be logged in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black p-16 bg-[#FDFBF7] mt-22 rounded-3xl overflow-hidden shadow-sm">
      <button
        onClick={() => navigate('/StudentPage')}
        className="mb-6 flex items-center gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-md px-6 py-3 transition-all shadow-md"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Pick Your Avatar</h1>
          <p className="text-gray-600">Choose a fun emoji and set your nickname!</p>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
          {message.text && (
            <div
              className={`p-3 mb-5 rounded-lg flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nickname Field */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                Nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g., Sparky, Luna, Max"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                This is how you will appear in the game!
              </p>
            </div>

            {/* Avatar Gallery */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Choose Your Avatar
                </label>
                <button
                  type="button"
                  onClick={generateAvatarBatch}
                  disabled={fetchingAvatars}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${fetchingAvatars ? 'animate-spin' : ''}`} />
                  New Set
                </button>
              </div>

              {fetchingAvatars ? (
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 mx-auto rounded-full bg-gray-200 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                  {currentAvatars.map(({ seed, svg }) => {
                    const isSelected = selectedSeed === seed;
                    return (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => setSelectedSeed(seed)}
                        className={`rounded-lg p-2 transition-all ${
                          isSelected
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:bg-gray-100'
                        }`}
                        aria-label={`Select avatar ${seed}`}
                      >
                        <div className="relative w-12 h-12 mx-auto">
                          <div
                            dangerouslySetInnerHTML={{ __html: svg }}
                            className="w-full h-full"
                          />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="mt-3 text-xs text-gray-500 text-center">
                Click an avatar to select it
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !nickname.trim() || !selectedSeed}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${
                loading || !nickname.trim() || !selectedSeed
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {loading ? 'Saving profile...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}