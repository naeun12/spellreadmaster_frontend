import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import {
  Users,
  UserPlus,
  BookOpen,
  FileText,
} from 'lucide-react';
import {
  collection,
  getDocs,
} from 'firebase/firestore';

const DashboardCards = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    newAccountsThisWeek: 0,
    totalThemes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      // --- Total Students ---
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const totalStudents = studentsSnapshot.size;

      // --- Total Teachers ---
      const teachersSnapshot = await getDocs(collection(db, 'teachers'));
      const totalTeachers = teachersSnapshot.size;

      // --- New Accounts This Week (Students + Teachers) ---
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let newStudents = 0;
      studentsSnapshot.docs.forEach(doc => {
        const createdAt = doc.data().createdAt;
        if (createdAt && createdAt.toDate && createdAt.toDate() >= sevenDaysAgo) {
          newStudents++;
        }
      });

      let newTeachers = 0;
      teachersSnapshot.docs.forEach(doc => {
        const createdAt = doc.data().createdAt;
        if (createdAt && createdAt.toDate && createdAt.toDate() >= sevenDaysAgo) {
          newTeachers++;
        }
      });

      const newAccountsThisWeek = newStudents + newTeachers;

      // --- Total Themes ---
      const themesSnapshot = await getDocs(collection(db, 'themes'));
      const totalThemes = themesSnapshot.size;

      setStats({
        totalStudents,
        totalTeachers,
        newAccountsThisWeek,
        totalThemes,
      });
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
      setStats({
        totalStudents: 0,
        totalTeachers: 0,
        newAccountsThisWeek: 0,
        totalThemes: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const { totalStudents, totalTeachers, newAccountsThisWeek, totalThemes } = stats;

  const cards = [
    {
      title: 'Total Students',
      value: totalStudents,
      icon: Users,
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Total Teachers',
      value: totalTeachers,
      icon: FileText, // or use a different icon if preferred (e.g., GraduationCap)
      bgLight: 'bg-green-50',
      textColor: 'text-green-600',
      gradient: 'from-green-500 to-green-600',
    },
    {
      title: 'New Accounts (7 Days)',
      value: newAccountsThisWeek,
      icon: UserPlus,
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Themes Created',
      value: totalThemes,
      icon: BookOpen,
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      gradient: 'from-amber-500 to-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="relative bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {card.value}
                </h3>
              </div>
              <div
                className={`${card.bgLight} p-3 rounded-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className={`h-6 w-6 ${card.textColor}`} />
              </div>
            </div>

            {/* Decorative gradient border on hover */}
            <div
              className={`absolute inset-0 rounded-xl bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
            ></div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardCards;