// UploadForm.jsx
import React, { useState } from 'react';
import Papa from 'papaparse';
import { auth } from '../../firebase';
//import { createStudents } from '../../api';

const UploadForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccessCount(0);
    setFailedCount(0);
    
    // Get the teacher's UID
    const teacherUid = auth.currentUser ? auth.currentUser.uid : null;
    if (!teacherUid) {
      setError('Authentication error: Teacher session lost.');
      setLoading(false);
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const students = results.data;
        
        try {
          // Get the teacher's ID token for authentication
          const idToken = await auth.currentUser.getIdToken();
          
          // Send the student data to the backend
          const response = await fetch('https://spellreadmasterfrontend-production.up.railway.app/api/admin/create-students', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              teacherId: teacherUid,
              students: students.map(student => ({
                studentId: student.studentId,
                name: student.name.trim(),
                parentEmail: student.parentEmail.trim().toLowerCase(),
                role: student.role,
                section: student.section
              }))
            })
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to create students');
          }

          setSuccessCount(result.successCount || 0);
          setFailedCount(result.failedCount || 0);
          
          if (result.errors && result.errors.length > 0) {
            console.error('Individual errors:', result.errors);
          }
          
        } catch (err) {
          console.error('Error uploading students:', err);
          setError(err.message || 'Failed to upload students');
        } finally {
          setLoading(false);
        }
      },
      error: (parseError) => {
        setError(`Error parsing CSV: ${parseError.errors[0]?.message || 'Unknown error'}`);
        setLoading(false);
      },
    });
  };

  return (
    <div className="bg-[#FCB436] rounded-md p-12 max-w-6xl mx-auto w-full">
      <h2 className="text-2xl text-white font-bold mb-4">Manage Student Accounts</h2>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong> {error}
          <button
            type="button"
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}

      {/* Success Message */}
      {successCount > 0 && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Success:</strong> {successCount} students successfully imported.
          {failedCount > 0 && (
            <div className="mt-2">
              <strong className="font-bold">Warning:</strong> {failedCount} students failed to import.
            </div>
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Uploading...</strong> Please wait while we process your CSV file.
        </div>
      )}

      {/* File Input */}
      <div className="mt-6">
        <label
          htmlFor="csvFile"
          className="block text-sm font-medium text-white mb-2"
        >
          Upload CSV File
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-white border-dashed rounded-lg hover:border-[#C28A29] transition-colors duration-200">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-white"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="csvFile"
                className="relative cursor-pointer bg-white rounded-md font-medium text-black hover:text-[#FCC636] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#FCC636] px-2"
              >
                <span>Upload a file</span>
                <input
                  id="csvFile"
                  name="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={loading}
                  className="sr-only"
                />
              </label>
              <p className="pl-1 text-white">or drag and drop</p>
            </div>
            <p className="text-xs text-white">CSV files only (.csv)</p>
          </div>
        </div>
      </div>

      {/* CSV Format Instructions */}
      <div className="mt-6 bg-white/10 rounded-md p-4">
        <h3 className="text-white font-semibold mb-2">CSV Format Required:</h3>
        <p className="text-white text-sm">
          Your CSV file should have the following columns: 
          <code className="bg-white/20 px-2 py-1 rounded ml-2">studentId, name, parentEmail, role, section</code>
        </p>
      </div>
    </div>
  );
};

export default UploadForm;