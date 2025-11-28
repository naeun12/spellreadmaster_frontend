import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, orderBy, limit, getDocs, updateDoc, where } from 'firebase/firestore';
import { createAvatar } from '@dicebear/core';
import { funEmoji } from '@dicebear/collection';

const UploadForm = () => {
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [parsedStudents, setParsedStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [newClassName, setNewClassName] = useState('');
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showAssignSection, setShowAssignSection] = useState(false);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [teacherUploadedStudents, setTeacherUploadedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [selectedExistingStudents, setSelectedExistingStudents] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);

  useEffect(() => {
    const fetchTeacherStudents = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('You must be logged in to view students.');
        setLoadingStudents(false);
        return;
      }
      try {
        const studentsRef = collection(db, 'students');
        const q = query(studentsRef, where('teacherId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const studentsList = [];
        const uniqueSections = new Set();
        querySnapshot.forEach((doc) => {
          const studentData = {
            id: doc.id,
            ...doc.data(),
          };
          studentsList.push(studentData);
          if (studentData.section && studentData.section.trim()) {
            uniqueSections.add(studentData.section.trim());
          }
        });
        setTeacherUploadedStudents(studentsList);
        setSections(Array.from(uniqueSections).sort());
      } catch (err) {
        console.error('Error fetching teacher\'s students:', err);
        setError('Failed to load your students. Please try again.');
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchTeacherStudents();
  }, []);

  const getHighestStudentId = async () => {
    try {
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, orderBy('studentId', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const highestDoc = querySnapshot.docs[0];
        const highestId = highestDoc.data().studentId;
        const numericId = parseInt(String(highestId).replace(/\D/g, ''), 10);
        return isNaN(numericId) ? 100000 : numericId;
      }
      return 100000;
    } catch (err) {
      console.error('Error getting highest student ID:', err);
      return 100000;
    }
  };

  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          const headers = jsonData[0].map(h => String(h).trim());
          const rows = jsonData.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] !== undefined ? String(row[index]).trim() : '';
            });
            return obj;
          });
          resolve({ data: rows, meta: { fields: headers } });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError('');
    setParsedStudents([]);
    setSelectedStudentIds(new Set());
    try {
      let results;
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (fileExtension === 'csv') {
        results = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: resolve,
            error: reject,
          });
        });
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        results = await parseExcelFile(file);
      } else {
        setError('Unsupported file format.');
        setLoading(false);
        return;
      }
      const rawRows = results.data || [];
      const fields = results.meta?.fields?.map(f => String(f).trim()) || Object.keys(rawRows[0] || {});
      const normalize = (s) => String(s || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
      const findField = (candidates) => fields.find(f => candidates.some(c => normalize(f).includes(c))) || null;
      const studentIdField = findField(['studentid', 'id', 'studentno', 'student_id']);
      const nameField = findField(['name', 'studentname', 'fullname', 'student_name']);
      const parentEmailField = findField(['parentemail', 'parent_email', 'email', 'parentmail']);
      const sectionField = findField(['section', 'class', 'grade']);
      const missing = [];
      if (!nameField) missing.push('name');
      if (!parentEmailField) missing.push('parentEmail');
      if (!sectionField) missing.push('section');
      if (missing.length) {
        setError(`File missing required columns: ${missing.join(', ')}. Found: ${fields.join(', ')}`);
        setLoading(false);
        return;
      }
      const highestId = await getHighestStudentId();
      let nextId = highestId + 1;
      const students = rawRows
        .filter(r => r[nameField] && r[parentEmailField])
        .map((r, idx) => {
          const assignedId = studentIdField && r[studentIdField] ? String(r[studentIdField]).trim() : String(nextId++);
          return {
            studentId: assignedId,
            name: (r[nameField] || '').trim(),
            parentEmail: (r[parentEmailField] || '').trim().toLowerCase(),
            section: (r[sectionField] || '').trim(),
            __rowIndex: idx + 2,
          };
        });
      if (students.length === 0) {
        setError('No valid student data found.');
        setLoading(false);
        return;
      }
      setParsedStudents(students);
      setError('');
    } catch (err) {
      console.error('Parse error:', err);
      setError('Error parsing file: ' + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const createSelectedStudentAccounts = async () => {
    if (selectedStudentIds.size === 0) {
      setError('Please select at least one student.');
      return;
    }
    const currentUser = auth.currentUser;
    const teacherEmail = currentUser?.email;
    const teacherPassword = localStorage.getItem('teacherPassword');
    if (!teacherEmail || !teacherPassword) {
      setError('Session invalid. Please log in again.');
      return;
    }
    setLoadingOverlay(true);
    setError('');
    setSuccessCount(0);
    const selectedStudents = parsedStudents.filter(s => selectedStudentIds.has(s.studentId));
    const teacherUid = currentUser.uid;
    let count = 0;
    const rowErrors = [];
    try {
      for (const student of selectedStudents) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.parentEmail)) {
          rowErrors.push({ message: 'Invalid email', studentId: student.studentId });
          continue;
        }
        const password = `SRM-${student.studentId}`;
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, student.parentEmail, password);
          await setDoc(doc(db, 'students', userCredential.user.uid), {
            studentId: student.studentId,
            name: student.name,
            parentEmail: student.parentEmail,
            role: 'student',
            teacherId: teacherUid,
            section: newClassName || student.section || '',
            avatar: createAvatar(funEmoji, { seed: student.studentId, size: 128 }).toString(),
            createdAt: new Date(),
            firstLogin: true,
          });
          count++;
        } catch (err) {
          if (err.code === 'auth/email-already-in-use') {
            rowErrors.push({ message: 'Email exists', studentId: student.studentId });
          } else {
            rowErrors.push({ message: err.message || 'Unknown error', studentId: student.studentId });
          }
        }
      }
      setSuccessCount(count);
      if (rowErrors.length) {
        const errorSummary = rowErrors.slice(0, 3).map(e => `Row ${e.row}: ${e.message}`).join('; ');
        setError(`Some failed: ${errorSummary}${rowErrors.length > 3 ? '...' : ''}`);
      }
      try {
        await signInWithEmailAndPassword(auth, teacherEmail, teacherPassword);
        setLoadingOverlay(false);
        setParsedStudents([]);
        setSelectedStudentIds(new Set());
        setNewClassName('');
        await fetchTeacherStudents();
      } catch (err) {
        console.error('Re-login failed:', err);
        setError('Re-login failed. Please log in manually.');
        setLoadingOverlay(false);
      }
    } catch (err) {
      console.error('Account creation error:', err);
      setError('Failed during account creation: ' + (err.message || 'Unknown error'));
      setLoadingOverlay(false);
    }
  };

  const assignUploadedStudentsToSection = async () => {
    if (!selectedSection) {
      setError('Please select a section.');
      return;
    }
    if (selectedStudentIds.size === 0) {
      setError('Please select at least one student.');
      return;
    }
    const currentUser = auth.currentUser;
    const teacherEmail = currentUser?.email;
    const teacherPassword = localStorage.getItem('teacherPassword');
    if (!teacherEmail || !teacherPassword) {
      setError('Session invalid. Please log in again.');
      return;
    }
    setLoadingOverlay(true);
    setError('');
    setSuccessCount(0);
    const selectedStudents = parsedStudents.filter(s => selectedStudentIds.has(s.studentId));
    const teacherUid = currentUser.uid;
    let count = 0;
    const rowErrors = [];
    try {
      for (const student of selectedStudents) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.parentEmail)) {
          rowErrors.push({ message: 'Invalid email', studentId: student.studentId });
          continue;
        }
        const password = `SRM-${student.studentId}`;
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, student.parentEmail, password);
          await setDoc(doc(db, 'students', userCredential.user.uid), {
            studentId: student.studentId,
            name: student.name,
            parentEmail: student.parentEmail,
            role: 'student',
            teacherId: teacherUid,
            section: selectedSection,
            avatar: createAvatar(funEmoji, { seed: student.studentId, size: 128 }).toString(),
            createdAt: new Date(),
            firstLogin: true,
          });
          count++;
        } catch (err) {
          if (err.code === 'auth/email-already-in-use') {
            rowErrors.push({ message: 'Email exists', studentId: student.studentId });
          } else {
            rowErrors.push({ message: err.message || 'Unknown error', studentId: student.studentId });
          }
        }
      }
      setSuccessCount(count);
      if (rowErrors.length) {
        const errorSummary = rowErrors.slice(0, 3).map(e => `${e.studentId}: ${e.message}`).join('; ');
        setError(`Some failed: ${errorSummary}${rowErrors.length > 3 ? '...' : ''}`);
      }
      try {
        await signInWithEmailAndPassword(auth, teacherEmail, teacherPassword);
        setLoadingOverlay(false);
        setParsedStudents(prev => prev.filter(s => !selectedStudentIds.has(s.studentId)));
        setSelectedStudentIds(new Set());
        setSelectedSection('');
        setShowAssignSection(false);
        await fetchTeacherStudents();
      } catch (err) {
        console.error('Re-login failed:', err);
        setError('Re-login failed. Please log in manually.');
        setLoadingOverlay(false);
      }
    } catch (err) {
      console.error('Account creation error:', err);
      setError('Failed during account creation: ' + (err.message || 'Unknown error'));
      setLoadingOverlay(false);
    }
  };

  const fetchTeacherStudents = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('teacherId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const studentsList = [];
      const uniqueSections = new Set();
      querySnapshot.forEach((doc) => {
        const studentData = {
          id: doc.id,
          ...doc.data(),
        };
        studentsList.push(studentData);
        if (studentData.section && studentData.section.trim()) {
          uniqueSections.add(studentData.section.trim());
        }
      });
      setTeacherUploadedStudents(studentsList);
      setSections(Array.from(uniqueSections).sort());
    } catch (err) {
      console.error('Error fetching teacher\'s students:', err);
    }
  };

  const toggleStudentSelection = (studentId) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudentIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === parsedStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(parsedStudents.map(s => s.studentId)));
    }
  };

  const filteredParsedStudents = parsedStudents.filter(student => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.name?.toLowerCase().includes(query) ||
      student.studentId?.toLowerCase().includes(query) ||
      student.parentEmail?.toLowerCase().includes(query) ||
      student.section?.toLowerCase().includes(query)
    );
  });

  const filteredExistingStudents = teacherUploadedStudents.filter(student => {
    if (!modalSearchQuery.trim()) return true;
    const query = modalSearchQuery.toLowerCase();
    return (
      student.name?.toLowerCase().includes(query) ||
      student.studentId?.toLowerCase().includes(query) ||
      student.parentEmail?.toLowerCase().includes(query) ||
      student.section?.toLowerCase().includes(query)
    );
  });

  const filteredYourStudents = teacherUploadedStudents.filter(student => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.name?.toLowerCase().includes(query) ||
      student.studentId?.toLowerCase().includes(query) ||
      student.parentEmail?.toLowerCase().includes(query) ||
      student.section?.toLowerCase().includes(query)
    );
  });

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredYourStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredYourStudents.length / studentsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const toggleExistingStudentSelection = (studentId) => {
    const newSet = new Set(selectedExistingStudents);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedExistingStudents(newSet);
  };

  const toggleSelectAllExisting = () => {
    if (selectedExistingStudents.size === filteredExistingStudents.length) {
      setSelectedExistingStudents(new Set());
    } else {
      setSelectedExistingStudents(new Set(filteredExistingStudents.map(s => s.id)));
    }
  };

  const handleAssignExistingSection = async () => {
    if (!selectedSection) {
      setError('Please select a section.');
      return;
    }
    if (selectedExistingStudents.size === 0) {
      setError('Please select at least one student.');
      return;
    }
    setLoading(true);
    try {
      for (const studentId of selectedExistingStudents) {
        const studentRef = doc(db, 'students', studentId);
        await updateDoc(studentRef, { section: selectedSection });
      }
      setShowAssignSection(false);
      setSelectedSection('');
      setSelectedExistingStudents(new Set());
      setModalSearchQuery('');
      await fetchTeacherStudents();
      setSuccessCount(selectedExistingStudents.size);
    } catch (err) {
      console.error('Error assigning section:', err);
      setError('Failed to assign section. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Overlay Loader */}
      {loadingOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] cursor-wait">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-6"></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {successCount > 0 ? 'Finalizing...' : 'Processing File'}
              </h3>
              <p className="text-gray-600 text-center mb-4">
                {successCount > 0 
                  ? 'Refreshing student list and updating display...'
                  : 'Creating student accounts and setting up their profiles...'
                }
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: successCount > 0 ? '90%' : '60%'}}></div>
              </div>
              <p className="text-sm text-gray-500 mt-4">This may take a few minutes. Please dont close this window.</p>
            </div>
          </div>
        </div>
      )}
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Manage Student Accounts</h2>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-red-800">Error:</p>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-600 hover:text-red-800 ml-4 text-2xl leading-none"
          >
            ×
          </button>
        </div>
      )}
      {successCount > 0 && !loadingOverlay && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-800">
              <span className="font-semibold">Success!</span> {successCount} student{successCount !== 1 ? 's' : ''} successfully processed.
            </p>
          </div>
        </div>
      )}
      {loading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <p className="text-blue-800">
              <span className="font-semibold">Processing...</span> Please wait.
            </p>
          </div>
        </div>
      )}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Upload CSV or Excel File</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            disabled={loading}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-semibold text-blue-600">Upload a file</span>
              <span className="text-gray-500"> or drag and drop</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">CSV or Excel files (.csv, .xlsx, .xls)</p>
          </label>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">File Format:</span> Your file should include columns for: name, parentEmail, and section. Student IDs will be auto-generated if not provided.
        </p>
      </div>
      {parsedStudents.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Uploaded Students</h3>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (sections.length === 0) {
                    setError('No sections available. Please create a section first.');
                    return;
                  }
                  setShowAssignSection(true);
                }}
                disabled={parsedStudents.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Assign Class
              </button>
              <button
                onClick={() => setShowCreateClass(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-md"
              >
                Create Class
              </button>
            </div>
          </div>
          {showCreateClass && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class/Section Name *
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="e.g., Grade 10-A, Math 101"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="flex-1 min-w-[250px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={createSelectedStudentAccounts}
                  disabled={selectedStudentIds.size === 0 || !newClassName.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
                >
                  Create Class & Assign Selected
                </button>
                <button
                  onClick={() => setShowCreateClass(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, student ID, email, or section..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {filteredParsedStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No students found matching {searchQuery}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                    <tr>
                      <th className="py-4 px-6 text-left">
                        <input
                          type="checkbox"
                          onChange={toggleSelectAll}
                          checked={parsedStudents.length > 0 && selectedStudentIds.size === parsedStudents.length}
                          className="w-4 h-4 cursor-pointer accent-blue-600"
                        />
                      </th>
                      <th className="py-4 px-6 text-left text-white font-semibold uppercase text-sm tracking-wider">Student ID</th>
                      <th className="py-4 px-6 text-left text-white font-semibold uppercase text-sm tracking-wider">Name</th>
                      <th className="py-4 px-6 text-left text-white font-semibold uppercase text-sm tracking-wider">Parent Email</th>
                      <th className="py-4 px-6 text-left text-white font-semibold uppercase text-sm tracking-wider">Section</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredParsedStudents.map((student, index) => (
                      <tr key={student.studentId} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                        <td className="py-4 px-6">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.has(student.studentId)}
                            onChange={() => toggleStudentSelection(student.studentId)}
                            className="w-4 h-4 cursor-pointer accent-blue-600"
                          />
                        </td>
                        <td className="py-4 px-6 text-gray-900 font-medium">{student.studentId}</td>
                        <td className="py-4 px-6 text-gray-900">{student.name}</td>
                        <td className="py-4 px-6 text-gray-700">{student.parentEmail}</td>
                        <td className="py-4 px-6 text-gray-700">{student.section}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Your Students</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateSection(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-md"
            >
              Create New Section
            </button>
            <button
              onClick={() => {
                if (teacherUploadedStudents.length === 0) {
                  setError('No students available to assign.');
                  return;
                }
                if (sections.length === 0) {
                  setError('No sections available. Please create a section first.');
                  return;
                }
                setShowAssignSection(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-md"
            >
              Assign Section
            </button>
          </div>
        </div>
        {loadingStudents ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
            <p className="text-gray-600 font-medium">Loading your students...</p>
          </div>
        ) : teacherUploadedStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">You havent uploaded any students yet.</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by name, student ID, email, or section..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {teacherUploadedStudents.filter(student => {
              if (!searchQuery.trim()) return true;
              const query = searchQuery.toLowerCase();
              return (
                student.name?.toLowerCase().includes(query) ||
                student.studentId?.toLowerCase().includes(query) ||
                student.parentEmail?.toLowerCase().includes(query) ||
                student.section?.toLowerCase().includes(query)
              );
            }).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No students found matching {searchQuery}</p>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gradient-to-r from-purple-600 to-purple-700">
                        <tr>
                          <th className="py-4 px-6 text-left text-white font-semibold uppercase text-sm tracking-wider">Student ID</th>
                          <th className="py-4 px-6 text-left text-white font-semibold uppercase text-sm tracking-wider">Name</th>
                          <th className="py-4 px-6 text-left text-white font-semibold uppercase text-sm tracking-wider">Parent Email</th>
                          <th className="py-4 px-6 text-left text-white font-semibold uppercase text-sm tracking-wider">Section</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {currentStudents.map((student, index) => (
                          <tr key={student.id} className={`hover:bg-purple-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                            <td className="py-4 px-6 text-gray-900 font-medium">{student.studentId || '—'}</td>
                            <td className="py-4 px-6 text-gray-900">{student.name || '—'}</td>
                            <td className="py-4 px-6 text-gray-700">{student.parentEmail || '—'}</td>
                            <td className="py-4 px-6 text-gray-700">{student.section || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 px-4">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstStudent + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(indexOfLastStudent, filteredYourStudents.length)}</span> of{' '}
                      <span className="font-medium">{filteredYourStudents.length}</span> students
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => paginate(pageNum)}
                                className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                                  currentPage === pageNum
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                            return <span key={pageNum} className="px-2 py-2 text-gray-500">...</span>;
                          }
                          return null;
                        })}
                      </div>
                      <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      {showCreateSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Create New Section</h3>
                <button
                  onClick={() => {
                    setShowCreateSection(false);
                    setNewClassName('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Name *
              </label>
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="e.g., Grade 10-A, Math 101"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-600">
                Enter the name for your new section. You can assign students to it later using the Assign Section button.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateSection(false);
                  setNewClassName('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newClassName.trim()) {
                    setError('Please enter a section name.');
                    return;
                  }
                  setSections(prev => [...new Set([...prev, newClassName.trim()])].sort());
                  setShowCreateSection(false);
                  setNewClassName('');
                  setSuccessCount(1);
                }}
                disabled={!newClassName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Create Section
              </button>
            </div>
          </div>
        </div>
      )}
      {showAssignSection && parsedStudents.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Assign to Section</h3>
                <button
                  onClick={() => {
                    setShowAssignSection(false);
                    setSelectedSection('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Section *
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                <option value="">-- Select a Section --</option>
                {sections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-600">
                Selected students will be assigned to this section and removed from the uploaded list.
              </p>
              <p className="mt-2 text-sm font-medium text-blue-600">
                {selectedStudentIds.size} student{selectedStudentIds.size !== 1 ? 's' : ''} selected
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignSection(false);
                  setSelectedSection('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={assignUploadedStudentsToSection}
                disabled={!selectedSection || selectedStudentIds.size === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Assign to Section
              </button>
            </div>
          </div>
        </div>
      )}
      {showAssignSection && parsedStudents.length === 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Assign Students to Section</h3>
                <button
                  onClick={() => {
                    setShowAssignSection(false);
                    setSelectedSection('');
                    setSelectedExistingStudents(new Set());
                    setModalSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Section *
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="">-- Select a Section --</option>
                  {sections.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-600">
                  Choose an existing section to assign students to. You can create new sections using the Create New Section button.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Students ({selectedExistingStudents.size} selected)
                </label>
                <div className="mb-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                      placeholder="Search by name, student ID, email, or section..."
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {modalSearchQuery && (
                      <button
                        onClick={() => setModalSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                {teacherUploadedStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border border-gray-300 rounded-lg">
                    <p>No students available. Please upload students first.</p>
                  </div>
                ) : filteredExistingStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border border-gray-300 rounded-lg">
                    <p>No students found matching {modalSearchQuery}</p>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg max-h-80 overflow-y-auto">
                    <div className="flex items-center p-3 bg-gray-100 border-b border-gray-300 sticky top-0">
                      <input
                        type="checkbox"
                        onChange={toggleSelectAllExisting}
                        checked={filteredExistingStudents.length > 0 && selectedExistingStudents.size === filteredExistingStudents.length}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                      <label className="ml-3 font-medium text-gray-700">
                        Select All ({filteredExistingStudents.length})
                      </label>
                    </div>
                    {filteredExistingStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          id={`existing-student-${student.id}`}
                          checked={selectedExistingStudents.has(student.id)}
                          onChange={() => toggleExistingStudentSelection(student.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                        <label
                          htmlFor={`existing-student-${student.id}`}
                          className="ml-3 flex-1 cursor-pointer"
                        >
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">
                            ID: {student.studentId} | Email: {student.parentEmail}
                            {student.section && (
                              <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                Current: {student.section}
                              </span>
                            )}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignSection(false);
                  setSelectedSection('');
                  setSelectedExistingStudents(new Set());
                  setModalSearchQuery('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignExistingSection}
                disabled={loading || !selectedSection || selectedExistingStudents.size === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Assigning...' : 'Assign to Section'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadForm;