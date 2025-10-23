import React, { useState } from 'react';
import Papa from 'papaparse';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, runTransaction } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const CsvUploadForm = () => {
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [teacherPassword, setTeacherPassword] = useState(sessionStorage.getItem('teacherPassword') || '');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingTeacherEmail, setPendingTeacherEmail] = useState(null);
  //const [selectedFilename, setSelectedFilename] = useState('');
  //const [parsedFieldsPreview, setParsedFieldsPreview] = useState([]);
  const navigate = useNavigate();

  // Confirm password modal
  const handlePasswordConfirm = async () => {
    if (!teacherPassword) {
      setError('Please enter your password to continue.');
      return;
    }
    setShowPasswordModal(false);
    if (pendingFile) {
      const currentUser = auth.currentUser;
      const teacherEmail = pendingTeacherEmail || currentUser?.email;
      await processFile(pendingFile, teacherEmail, teacherPassword);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPendingFile(null);
    setTeacherPassword('');
    setError('Upload cancelled.');
    setLoadingOverlay(false);
  };

  // Process CSV File
  const processFile = async (file, teacherEmail, teacherPw) => {
    setLoading(true);
    setError('');
    setSuccessCount(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rawRows = results.data || [];
        let count = 0;

        // Header detection
        const fields = results.meta?.fields?.map(f => String(f).trim()) || Object.keys(rawRows[0] || {});
        const normalize = (s) => String(s || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
        const findField = (candidates) => fields.find(f => candidates.some(c => normalize(f).includes(c))) || null;

        const studentIdField = findField(['studentid', 'id']);
        const nameField = findField(['name', 'studentname', 'fullname']);
        const parentEmailField = findField(['parentemail', 'parent_email', 'email']);
        const roleField = findField(['role']);
        const sectionField = findField(['section', 'class']);

        const missing = [];
        if (!nameField) missing.push('name');
        if (!parentEmailField) missing.push('parentEmail');
        if (!roleField) missing.push('role');
        if (!sectionField) missing.push('section');

        if (missing.length) {
          setError(`CSV missing required columns: ${missing.join(', ')}. Found: ${fields.join(', ')}`);
          setLoading(false);
          setLoadingOverlay(false);
          return; // stays on the same page
        }

        // Normalize student data
        const students = rawRows.map((r, idx) => ({
          studentId: studentIdField ? (r[studentIdField] || '') : '',
          name: r[nameField] || '',
          parentEmail: r[parentEmailField] || '',
          role: r[roleField] || '',
          section: r[sectionField] || '',
          __rowIndex: idx + 2,
        }));

        const rowsNeedingId = students.filter(s => !s.studentId?.trim());
        let nextIdStart = null;

        // Reserve new IDs if needed
        if (rowsNeedingId.length > 0) {
          try {
            nextIdStart = await runTransaction(db, async (tx) => {
              const counterRef = doc(db, 'counters', 'students');
              const counterSnap = await tx.get(counterRef);
              let lastId = 1000;

              if (counterSnap.exists()) {
                const parsed = Number(counterSnap.data().lastId);
                if (!Number.isNaN(parsed)) lastId = parsed;
              } else {
                tx.set(counterRef, { lastId });
              }

              const newLast = lastId + rowsNeedingId.length;
              tx.update(counterRef, { lastId: newLast });
              return lastId + 1;
            });
          } catch (err) {
            console.error('Failed to reserve IDs:', err);
            setError('Failed to reserve student IDs. Try again.');
            setLoading(false);
            setLoadingOverlay(false);
            return;
          }
        }

        let autoIdCounter = 0;
        const rowErrors = [];

        // 🔁 MODIFIED LOOP: Create student → re-auth as teacher → save doc
        for (const student of students) {
          let assignedId = student.studentId || (nextIdStart ? String(nextIdStart + autoIdCounter++) : '');
          const cleanParentEmail = (student.parentEmail || '').trim().toLowerCase();

          if (!cleanParentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanParentEmail)) {
            rowErrors.push({ row: student.__rowIndex, message: 'Invalid or missing parentEmail' });
            continue;
          }

          const finalStudentId = assignedId || (student.studentId || '').toString();
          const password = `SRM-${finalStudentId}`;

          try {
            // 1. Create student account (this signs you in as the student)
            const userCredential = await createUserWithEmailAndPassword(auth, cleanParentEmail, password);

            // 2. IMMEDIATELY sign back in as the teacher
            await signInWithEmailAndPassword(auth, teacherEmail, teacherPw);

            // 3. Now write the student document (auth state is teacher again)
            await setDoc(doc(db, 'students', userCredential.user.uid), {
              studentId: finalStudentId,
              name: student.name ? String(student.name).trim() : '',
              parentEmail: cleanParentEmail,
              role: student.role || 'student',
              teacherId: auth.currentUser?.uid || null, // ✅ now correctly the teacher's UID
              createdAt: new Date(),
              section: student.section || ''
            });

            count++;
          } catch (err) {
            console.error(`Error creating student (row ${student.__rowIndex || 'unknown'}):`, err);
            rowErrors.push({ row: student.__rowIndex, message: err?.message || String(err) });

            // Optional: try to recover auth state even after error
            try {
              await signInWithEmailAndPassword(auth, teacherEmail, teacherPw);
            } catch (reauthErr) {
              console.error('Failed to re-authenticate after error:', reauthErr);
              setError('Session lost. Please log in again.');
              setLoading(false);
              setLoadingOverlay(false);
              return;
            }
          }
        }

        // Final re-authentication to ensure teacher is signed in
        try {
          await signInWithEmailAndPassword(auth, teacherEmail, teacherPw);
        } catch (err) {
          console.error('Final re-login failed:', err);
          setError('Failed to restore teacher session. Please log in again.');
          setLoading(false);
          setLoadingOverlay(false);
          return;
        }

        if (rowErrors.length) {
          console.warn('Row errors:', rowErrors);
          setError(`Some rows failed. Example: Row ${rowErrors[0].row} - ${rowErrors[0].message}`);
        }

        // Handle success / stay on page if errors
        if (count > 0) {
          setSuccessCount(count);
          setLoading(false);
          setLoadingOverlay(true);
          setTimeout(() => {
            setLoadingOverlay(false);
            navigate('/TeacherPage');
          }, 2000);
        } else {
          setError('No valid student entries processed. Please check your CSV and try again.');
          setLoading(false);
          setLoadingOverlay(false);
        }
      },
      error: () => {
        setError('Error parsing CSV file.');
        setLoading(false);
        setLoadingOverlay(false);
      },
    });
  };

  // Handle file input
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const currentUser = auth.currentUser;
    const teacherEmail = currentUser?.email;
    const pwToUse = teacherPassword || sessionStorage.getItem('teacherPassword') || '';

    if (!teacherEmail) {
      setError('Teacher not authenticated. Please log in again.');
      return;
    }

    if (!pwToUse) {
      setPendingFile(file);
      setPendingTeacherEmail(teacherEmail);
      setShowPasswordModal(true);
      return;
    }

    await processFile(file, teacherEmail, pwToUse);
  };

  return (
    <div className="relative bg-[#FCB436] rounded-md p-12 max-w-6xl mx-auto w-full">
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Enter your password to continue</h3>
            {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
            <input
              type="password"
              value={teacherPassword}
              onChange={(e) => setTeacherPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-4"
              placeholder="Password"
            />
            <div className="flex justify-end gap-2">
              <button onClick={handlePasswordCancel} className="px-3 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={handlePasswordConfirm} className="px-3 py-2 bg-blue-600 text-white rounded">Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay Loader */}
      {loadingOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-amber-100 bg-opacity-80 z-50">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-700 font-semibold">Loading, please wait...</p>
          </div>
        </div>
      )}

      <h2 className="text-2xl text-white font-bold mb-4">Manage Student Accounts</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-3">
          <strong className="font-bold">Error:</strong> {error}
        </div>
      )}

      {successCount > 0 && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-3">
          <strong className="font-bold">Success:</strong> {successCount} students successfully imported.
        </div>
      )}

      {loading && (
        <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded relative mb-3">
          <strong className="font-bold">Uploading...</strong> Please wait while we process your CSV file.
        </div>
      )}

      {/* File Input */}
      <div className="mt-6">
        <label htmlFor="csvFile" className="block text-sm font-medium text-white mb-2">
          Upload CSV File
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-white border-dashed rounded-lg hover:border-[#C28A29] transition-colors">
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-white" stroke="currentColor" fill="none" viewBox="0 0 48 48">
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
                className="relative cursor-pointer bg-white rounded-md font-medium text-black hover:text-[#FCC636]"
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

export default CsvUploadForm;