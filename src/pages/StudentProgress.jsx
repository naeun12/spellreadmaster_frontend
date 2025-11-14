import React from 'react'
import StudentLayout from '../components/StudentDashboard/StudentLayout';
import MonitorStudentProgress from '../components/StudentDashboard/MonitorStudentProgress';

const MonitorStudents = () => {
  return (
    <StudentLayout>
        <MonitorStudentProgress></MonitorStudentProgress>
    </StudentLayout>
  )
}

export default MonitorStudents