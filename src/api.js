// src/api.js
import { auth } from './firebase';
import { getIdToken } from 'firebase/auth';

// ✅ FIXED: Use localhost:5000 for development
const BACKEND_URL = 'http://localhost:5000';

/**
 * Makes an authenticated API call to your backend.
 * Automatically gets the current user's ID token.
 */
export async function authenticatedFetch(url, options = {}) {
  if (!auth.currentUser) {
    throw new Error('User not authenticated. Please log in first.');
  }

  // getIdToken handles token refresh automatically
  const token = await getIdToken(auth.currentUser);

  console.log("🔑 Sending request to:", url);

  const authenticatedOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': options.headers?.['Content-Type'] || 'application/json',
    },
  };

  try {
    const response = await fetch(url, authenticatedOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Response error:', errorData);
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Response received:', data);
    return data;
  } catch (error) {
    console.error('❌ Fetch error:', error);
    throw error;
  }
}

// =======================
// Specific API functions
// =======================

/**
 * Add a new word to the backend WordBank
 */
export async function addWord(wordData) {
  return authenticatedFetch(`${BACKEND_URL}/word/add-word`, {
    method: 'POST',
    body: JSON.stringify(wordData),
  });
}

/**
 * Edit an existing word
 */
export async function editWord(wordId, wordData) {
  return authenticatedFetch(`${BACKEND_URL}/word/edit-word/${wordId}`, {
    method: 'PUT',
    body: JSON.stringify(wordData),
  });
}

/**
 * Get quiz for a specific level
 */
export async function getQuiz(level) {
  return authenticatedFetch(`${BACKEND_URL}/quiz/get-quiz/${level}`, {
    method: 'GET',
  });
}

/**
 * Submit quiz results
 */
export async function submitQuiz(level, submissionData) {
  return authenticatedFetch(`${BACKEND_URL}/quiz/submit-quiz/${level}`, {
    method: 'POST',
    body: JSON.stringify(submissionData),
  });
}

/**
 * Generate levels
 */
export async function generateLevels(data) {
  return authenticatedFetch(`${BACKEND_URL}/quiz/generate-levels`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Create multiple students via backend (for CSV upload)
 */
export async function createStudents(teacherId, students) {
  return authenticatedFetch(`${BACKEND_URL}/api/admin/create-batch-students`, {
    method: 'POST',
    body: JSON.stringify({
      teacherId,
      students
    }),
  });
}