// CsvUploadForm.jsx
import React, { useState } from 'react';
import Papa from 'papaparse';
import { auth, createUserWithEmailAndPassword } from '../../firebase';
import { db, doc, setDoc } from '../../firebase';

const UploadForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccessCount(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const students = results.data;
        let count = 0;

        for (const student of students) {
          const { studentId, name, parentEmail, role, section } = student;

          const cleanParentEmail = parentEmail.trim().toLowerCase();
          const password = `SRM-${studentId}`;

          try {
            // Create Firebase user with parent's email
            const userCredential = await createUserWithEmailAndPassword(auth, cleanParentEmail, password);
            const user = userCredential.user;

            // Save extra info to Firestore
            await setDoc(doc(db, 'students', user.uid), {
              studentId,
              name: name.trim(),
              parentEmail: cleanParentEmail,
              role,
              teacherId: auth.currentUser.uid,
              createdAt: new Date(),
              section
            });

            count++;
          } catch (err) {
            console.error('Error creating student:', err);
          }
        }

                setSuccessCount(count);
                setLoading(false);
              },
              error: () => {
                setError('Error parsing CSV');
                setLoading(false);
              },
            });
          };

  return (
    <div className="bg-[#FCB436] rounded-md p-12 max-w-6xl mx-auto w-full">
      <h2 className="text-2xl text-white font-bold mb-4">Manage Student Accounts</h2>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
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
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Success:</strong> {successCount} students successfully imported.
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded relative" role="alert">
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
          className="relative cursor-pointer bg-white rounded-md font-medium text-black hover:text-[#FCC636] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#FCC636]"
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
        <p className="pl-1">or drag and drop</p>
      </div>
      <p className="text-xs text-gray-500">CSV files only (.csv)</p>
    </div>
  </div>
</div>
    </div>
  );
};

export default UploadForm;