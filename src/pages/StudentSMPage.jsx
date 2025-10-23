import React from 'react';
import StudentLayout from '../components/StudentDashboard/StudentLayout';
import StudentSM from '../components/StudentDashboard/StudentSM';

function StudentSMPage() {
  return (
    <StudentLayout>
      <StudentSM></StudentSM>
    </StudentLayout>
  );
}

export default StudentSMPage;