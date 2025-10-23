import React from 'react';
import TeacherLayout from '../components/TeacherDashboard/TeacherLayout';
import DashboardCards from '../components/TeacherDashboard/DashboardCards';
import RecentAccountsTable from '../components/TeacherDashboard/StudentsTable';
import RecentActivities from '../components/TeacherDashboard/RecentActivities'; // New import

function TeacherPage() {
  return (
    <TeacherLayout>
      <h1 className="text-2xl font-bold mb-4 text-black">Dashboard</h1>
      <DashboardCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 p-4 gap-4">
        <RecentAccountsTable />
        <RecentActivities /> {/* Add here */}
      </div>
    </TeacherLayout>
  );
}

export default TeacherPage;