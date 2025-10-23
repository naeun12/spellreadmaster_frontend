// UploadStudents.jsx
import React from 'react';
import TeacherLayout from '../components/TeacherDashboard/TeacherLayout';
import UploadForm from '../components/TeacherDashboard/UploadForm';

const UploadStudents = () => {
  return (
    <TeacherLayout>
         <UploadForm></UploadForm>
    </TeacherLayout>
  );
};

export default UploadStudents;