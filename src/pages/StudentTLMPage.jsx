import React from 'react';
import StudentLayout from '../components/StudentDashboard/StudentLayout';
import StudentTLM from '../components/StudentDashboard/StudentTLM';

function StudentTLMPage() {
  return (
    <StudentLayout>
      <StudentTLM></StudentTLM>
    </StudentLayout>
  );
}

export default StudentTLMPage;