import React from 'react';
import AdminLayout from '../components/AdminDashboard/AdminLayout';
import DashboardCards from '../components/AdminDashboard/DashboardCards';
import RecentAccountsTable from '../components/AdminDashboard/RecentAccountsTable';
import RecentActivities from '../components/AdminDashboard/RecentActivities';
import { LayoutDashboard, Sparkles } from 'lucide-react';

function AdminPage() {
  // Get current greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get current date
  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <AdminLayout>
      {/* Enhanced Header Section – matching TeacherPage style */}
      <div className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-2xl p-8 mt-14 mb-6 ml-6 mr-6 shadow-lg relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                {getGreeting()} <Sparkles className="w-6 h-6" />
              </h1>
              <p className="text-white/90 text-sm font-medium">{getCurrentDate()}</p>
            </div>
          </div>
            <p className="text-white/80 text-sm mt-2 max-w-2xl">{"Welcome back! Here's what's happening with all the users today."}</p>
        </div>
      </div>

      <DashboardCards />

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] p-4 gap-4">
        <RecentAccountsTable />
        <RecentActivities />
      </div>
    </AdminLayout>
  );
}

export default AdminPage;