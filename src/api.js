// src/api.js
import { auth } from './firebase'; // Import the correctly initialized auth instance
import { getIdToken } from 'firebase/auth'; // Import getIdToken function

// Backend URL - Change this to your production URL when deploying
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

  // Log the token for debugging (optional, can remove in production)
  console.log("Token being sent:", token);

  const authenticatedOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': options.headers?.['Content-Type'] || 'application/json',
    },
  };

  const response = await fetch(url, authenticatedOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// =======================
// Specific API functions
// =======================

/**
 * Add a new word to the backend WordBank
 * @param {Object} wordData - Word details
 */
export async function addWord(wordData) {
  return authenticatedFetch(`${BACKEND_URL}/word/add-word`, {
    method: 'POST',
    body: JSON.stringify(wordData),
  });
}

/**
 * Fetch student dashboard data (example)
 */
export async function getStudentDashboard() {
  return authenticatedFetch(`${BACKEND_URL}/api/student/dashboard`, {
    method: 'GET',
  });
}

/**
 * Create multiple students via backend (for CSV upload)
 * @param {string} teacherId - The teacher's Firebase UID
 * @param {Array} students - Array of student objects
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

// You can add more functions here as needed, following the same pattern.