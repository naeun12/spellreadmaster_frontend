// src/components/AdminSettings.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';

// 🔑 Cloudinary config for admins
const CLOUDINARY_CLOUD_NAME = 'dleug1joa';
const CLOUDINARY_UPLOAD_PRESET = 'admin_profile_preset'; // unsigned preset

export default function Profile() {
  const [name, setName] = useState(''); // ← renamed from fullName to name
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const loadProfile = async () => {
      try {
        const adminDoc = doc(db, 'admins', currentUser.uid);
        const docSnap = await getDoc(adminDoc);

        const data = docSnap.exists() ? docSnap.data() : {};
        setName(data.name || currentUser.displayName || ''); // ← use 'name'
        setPhotoPreview(data.photoURL || currentUser.photoURL || '');
      } catch (err) {
        console.error('Failed to load admin profile:', err);
        setMessage({ type: 'error', text: 'Failed to load profile.' });
      }
    };

    loadProfile();
  }, [currentUser]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

    setUploading(true);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    setUploading(false);

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'Image upload failed');
    }

    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let finalPhotoURL = photoPreview;

      if (photoFile) {
        finalPhotoURL = await uploadToCloudinary(photoFile);
      }

      const adminRef = doc(db, 'admins', currentUser.uid);

      await updateProfile(currentUser, {
        displayName: name, // sync with Auth
        photoURL: finalPhotoURL || null,
      });

      await updateDoc(adminRef, {
        name: name,        // ← Save as 'name' in Firestore
        photoURL: finalPhotoURL || null,
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => {
        navigate('/AdminPage');
      }, 1000);
    } catch (err) {
      console.error('Update error:', err);
      setMessage({
        type: 'error',
        text: err.message || 'Failed to update profile. Please try again.',
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
    <div className="min-h-screen text-black p-16 bg-[#FDFBF7] rounded-3xl overflow-hidden shadow-sm">
      {/* Back Button */}
      <button
        onClick={() => navigate('/AdminPage')}
        className="mb-6 flex items-center gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-md px-6 py-3 transition-all shadow-md"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Update your name and profile picture</p>
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
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Profile Picture Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">No photo</span>
                  </div>
                )}
                <div>
                  <label className="cursor-pointer inline-block bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {photoFile && (
                    <p className="text-xs text-gray-600 mt-1 truncate max-w-xs">
                      {photoFile.name}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Upload JPG, PNG, or GIF. Your image will be saved securely on Cloudinary.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || uploading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${
                loading || uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {uploading
                ? 'Uploading image...'
                : loading
                ? 'Saving profile...'
                : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}