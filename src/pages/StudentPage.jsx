import React from 'react';
import StudentLayout from '../components/StudentDashboard/StudentLayout';
import StudentDashboard from '../components/StudentDashboard/StudentDashboard';

function StudentPage() {
  return (
    <StudentLayout>
      <StudentDashboard></StudentDashboard>
    </StudentLayout>
  );
}

export default StudentPage;