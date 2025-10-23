import React from 'react';
import AdminLayout from '../components/AdminDashboard/AdminLayout';
import DashboardCards from '../components/AdminDashboard/dashboardCards';
import RecentAccountsTable from '../components/AdminDashboard/RecentAccountsTable';
import RecentActivities from '../components/AdminDashboard/RecentActivities'; // New import

function AdminPage() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-4 text-black">Admin Dashboard</h1>
      <DashboardCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 p-4 gap-4">
        <RecentAccountsTable />
        <RecentActivities /> {/* Add here */}
      </div>
    </AdminLayout>
  );
}

export default AdminPage;