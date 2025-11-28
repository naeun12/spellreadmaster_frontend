// App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Components
import Hero from './components/Hero/Hero';
import Features from './components/Features/Features';
import Banner from './components/Banner/Banner';
import AuthContainer from './components/Login&SignUp/AuthContainer';
import Dashboard from './pages/TeacherPage';
import UploadStudents from './pages/UploadStudents';
import MonitorStudents from './pages/MonitorStudents';
import TeacherPendingPage from './pages/TeacherPendingPage';
import TeacherTLM from './pages/TeacherTLM';
import TeacherProfile from './components/TeacherDashboard/Profile';
import AdminPage from './pages/AdminPage';
import ManageStoryMode from './pages/ManageStoryMode';
import ManageThematicLearningMode from './pages/ManageThematicLearningMode';
import ManageLBLearningMode from './pages/ManageLBLearningMode';
import AdminManageAccounts from './pages/AdminManageAccounts';
import AdminMonitorStudentProgress from './pages/AdminMonitorStudentProgress';
import AdminProfile from './components/AdminDashboard/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import StudentPage from './pages/StudentPage';
import StudentProgress from './pages/StudentProgress';
import StudentPreTest from './pages/StudentPreTest';
import StudentLBLMPage from './pages/StudentLBLMPage';
import StudentTLMPage from './pages/StudentTLMPage';
import StudentSMPage from './pages/StudentSMPage';
import StudentProfile from './components/StudentDashboard/StudentProfile';


// Layouts
import HomeLayout from './components/Layout/HomeLayout';
import MainLayout from './components/Layout/MainLayout';
import TeacherLayout from './components/TeacherDashboard/TeacherLayout';
import AdminLayout from './components/AdminDashboard/AdminLayout';
import StudentLayout from './components/StudentDashboard/StudentLayout';


const App = () => {
  return (
    <Routes>
      {/* Homepage with Navbar, Hero, Features, Banner, Footer */}
      <Route
        path="/"
        element={
          <HomeLayout>
            <Hero onGetStarted={() => {}} onSignInClick={() => {}} />
            <Features />
            <Banner />
          </HomeLayout>
        }
      />

      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <MainLayout>
            <AuthContainer mode="login" />
          </MainLayout>
        }
      />

      <Route
        path="/signup"
        element={
          <MainLayout>
            <AuthContainer mode="signup" />
          </MainLayout>
        }
      />

      {/* Protected Teacher Dashboard */}
      <Route
        path="/TeacherPage"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Teacher TLM Manager */}
      <Route
        path="/TeacherPage/manage-thematic-learning-mode"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <TeacherTLM />
            </MainLayout>
          </ProtectedRoute>
        }
      />

            {/* Protected Teacher TLM Manager */}
      <Route
        path="/TeacherPage/profile"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <TeacherLayout>
                <TeacherProfile />
              </TeacherLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* CSV Upload Page */}
      <Route
        path="/TeacherPage/upload-students"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <UploadStudents />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Monitor Student Page */}
      <Route
        path="/TeacherPage/monitor-students"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <MonitorStudents />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Monitor Student Page */}
      <Route
        path="/TeacherPendingPage"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <TeacherPendingPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Dashboard */}
      <Route
        path="/AdminPage"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AdminPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Story Mode */}
      <Route
        path="/AdminPage/manage-story-mode"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <ManageStoryMode />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Thematic Learning Mode Mode */}
      <Route
        path="/AdminPage/manage-thematic-learning-mode"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <ManageThematicLearningMode />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Level-Based Learning Mode Mode */}
      <Route
        path="/AdminPage/manage-level-based-learning-mode"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <ManageLBLearningMode />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Manage Accounts */}
      <Route
        path="/AdminPage/manage-accounts"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AdminManageAccounts />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Monitor Student Progress */}
      <Route
        path="/AdminPage/profile"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AdminLayout>
                <AdminProfile />
              </AdminLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      /> 

            {/* Protected Admin Monitor Student Progress */}
      <Route
        path="/AdminPage/monitor-student-progress"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AdminMonitorStudentProgress />
            </MainLayout>
          </ProtectedRoute>
        }
      /> 

      {/* Protected Student Page */}
      <Route
        path="/StudentPage"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <MainLayout>
              <StudentPage />
            </MainLayout>
          </ProtectedRoute>
        }
      /> 

            {/* Protected Student Page - Monitor Progress */}
      <Route
        path="/StudentPage/monitor-student-progress"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <MainLayout>
              <StudentProgress />
            </MainLayout>
          </ProtectedRoute>
        }
      /> 

      {/* Protected Student Page */}
      <Route
        path="/StudentPreTest"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <MainLayout>
              <StudentPreTest />
            </MainLayout>
          </ProtectedRoute>
        }
      /> 

        {/* Protected Student Page - Level-Based */}
      <Route
        path="/StudentPage/level-based-learning-mode"
        element={
          <ProtectedRoute allowedRoles={['student']}>            
              <StudentLBLMPage />            
          </ProtectedRoute>
        }
      /> 

      {/* Protected Student Page - Thematic */}
      <Route
        path="/StudentPage/thematic-learning-mode"
        element={
          <ProtectedRoute allowedRoles={['student']}>
              <StudentTLMPage />
          </ProtectedRoute>
        }
      /> 

      {/* Protected Student Page - Story */}
      <Route
        path="/StudentPage/story-mode"
        element={
          <ProtectedRoute allowedRoles={['student']}>
              <StudentSMPage />
          </ProtectedRoute>
        }
      /> 

            {/* Protected Student Page - Profile */}
      <Route
        path="/StudentPage/student-profile"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <MainLayout>
              <StudentLayout>
                <StudentProfile />
              </StudentLayout>
            </MainLayout>
          </ProtectedRoute>
        }
      /> 



      {/* Redirect unknown paths */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>

    
  );
};

export default App;