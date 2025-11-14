import React from 'react'
import TeacherLayout from '../components/TeacherDashboard/TeacherLayout';
import MonitorStudentProgress from '../components/TeacherDashboard/MonitorStudentProgress';

const MonitorStudents = () => {
  return (
    <TeacherLayout>
        <MonitorStudentProgress></MonitorStudentProgress>
    </TeacherLayout>
  )
}

export default MonitorStudents