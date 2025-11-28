import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Users, TrendingUp, Activity, Trophy } from 'lucide-react';

const DashboardCards = () => {
  const [stats, setStats] = useState({
    studentCount: 0,
    averageProgress: 0,
    activeStudents: 0,
    topScorerName: '—',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const q = query(collection(db, 'students'), where('teacherId', '==', user.uid));
      const snapshot = await getDocs(q);
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (students.length === 0) {
        setStats({ studentCount: 0, averageProgress: 0, activeStudents: 0, topScorerName: '—' });
        setLoading(false);
        return;
      }

      // 1. Total students
      const studentCount = students.length;

      // 2. Top scorer (by totalExp or completedLevels)
      const topScorer = students.reduce((prev, current) =>
        (current.totalExp || 0) > (prev.totalExp || 0) ? current : prev
      );
      const topScorerName = topScorer.name || 'Anonymous';

      // 3. Average progress: use completedLevels * 3 as totalPoints (since Level 3 max → max 9 points)
      // Progress % = (totalPoints / 9) * 100 → but capped per student
      const progressValues = students.map(s => {
        const completedLevels = s.completedLevels?.length || 0;
        const totalPoints = completedLevels * 3; // as per your spec
        const maxPoints = 9; // Level 3 × 3 = 9
        return Math.min(100, (totalPoints / maxPoints) * 100);
      });
      const averageProgress = progressValues.length
        ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
        : 0;

      // 4. Active students: had activity in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let activeCount = 0;
      for (const student of students) {
        const activityRef = collection(db, 'students', student.id, 'activity');
        const activityQuery = query(activityRef, orderBy('timestamp', 'desc'), where('timestamp', '>=', sevenDaysAgo));
        const activitySnap = await getDocs(activityQuery);
        if (!activitySnap.empty) {
          activeCount++;
        }
      }

      setStats({
        studentCount,
        averageProgress,
        activeStudents: activeCount,
        topScorerName,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats({ studentCount: 0, averageProgress: 0, activeStudents: 0, topScorerName: '—' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
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

  const { studentCount, averageProgress, activeStudents, topScorerName } = stats;

  const cards = [
    {
      title: 'Total Students',
      value: studentCount,
      icon: Users,
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Average Progress',
      value: `${averageProgress}%`,
      icon: TrendingUp,
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      gradient: 'from-emerald-500 to-emerald-600',
      showProgress: true,
    },
    {
      title: 'Active Students',
      value: activeStudents,
      icon: Activity,
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Top Scorer',
      value: topScorerName,
      icon: Trophy,
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      gradient: 'from-amber-500 to-amber-600',
      isName: true,
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
                <h3 className={`text-3xl font-bold ${card.isName ? 'text-lg' : ''} text-gray-900 truncate`}>
                  {card.value}
                </h3>
              </div>
              <div className={`${card.bgLight} p-3 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`h-6 w-6 ${card.textColor}`} />
              </div>
            </div>
            
            {/* Progress bar for Average Progress card */}
            {card.showProgress && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-gradient-to-r ${card.gradient} h-2 rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${averageProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Decorative gradient border on hover */}
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardCards;