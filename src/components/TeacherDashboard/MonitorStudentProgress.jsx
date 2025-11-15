import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, Award, Target, AlertCircle, BarChart3, CheckCircle, XCircle, ArrowLeft, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { db, auth } from '../../firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';

export default function MonitorStudentProgress() {
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState({
    totalStudents: 0,
    studentsImproved: 0,
    studentsFallingBehind: 0,
    classAverageScore: 0,
    medianScore: 0,
    highestScore: 0,
    lowestScore: 0,
    difficultyAreas: []
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    loadClassProgress();
  }, []);

  const loadClassProgress = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      // Get all students
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const totalStudents = studentsSnapshot.size;

      // Calculate date ranges
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      let allScores = [];
      let currentWeekScores = [];
      let previousWeekScores = [];
      let studentsImproved = 0;
      let studentsFallingBehind = 0;
      const difficultyMap = {};
      const weeklyProgressMap = {};
      const allQuizzesByDate = [];

      // Process each student's data
      for (const studentDoc of studentsSnapshot.docs) {
        const studentId = studentDoc.id;
        
        // Get all activity for this student
        const activitySnapshot = await getDocs(
          collection(db, 'students', studentId, 'activity')
        );

        const activities = activitySnapshot.docs.map(doc => ({
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }));

        // Separate activities by week
        const currentWeekActivities = activities.filter(
          a => a.timestamp && a.timestamp >= oneWeekAgo
        );
        const previousWeekActivities = activities.filter(
          a => a.timestamp && a.timestamp >= twoWeeksAgo && a.timestamp < oneWeekAgo
        );

        // Calculate averages
        if (currentWeekActivities.length > 0) {
          const currentAvg = currentWeekActivities.reduce((sum, a) => sum + (a.percentage || 0), 0) / currentWeekActivities.length;
          currentWeekScores.push(currentAvg);

          if (previousWeekActivities.length > 0) {
            const previousAvg = previousWeekActivities.reduce((sum, a) => sum + (a.percentage || 0), 0) / previousWeekActivities.length;
            previousWeekScores.push(previousAvg);

            if (currentAvg > previousAvg + 5) studentsImproved++;
            else if (currentAvg < previousAvg - 5) studentsFallingBehind++;
          }
        }

        // Collect all scores
        activities.forEach(activity => {
          if (activity.percentage !== undefined) {
            allScores.push(activity.percentage);
            
            // Track by date for trend
            if (activity.timestamp) {
              allQuizzesByDate.push({
                date: activity.timestamp,
                score: activity.percentage
              });
            }
          }

          // Analyze difficulty areas
          if (activity.answers && Array.isArray(activity.answers)) {
            activity.answers.forEach(answer => {
              if (!answer.correct) {
                const area = activity.mode || 'General';
                difficultyMap[area] = (difficultyMap[area] || 0) + 1;
              }
            });
          }
        });

        // Track weekly progress
        currentWeekActivities.forEach(activity => {
          if (activity.timestamp) {
            const weekDay = activity.timestamp.toLocaleDateString('en-US', { weekday: 'short' });
            if (!weeklyProgressMap[weekDay]) {
              weeklyProgressMap[weekDay] = { day: weekDay, totalScore: 0, count: 0 };
            }
            weeklyProgressMap[weekDay].totalScore += activity.percentage || 0;
            weeklyProgressMap[weekDay].count += 1;
          }
        });
      }

      // Calculate statistics
      const classAverageScore = allScores.length > 0 
        ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
        : 0;

      const sortedScores = [...allScores].sort((a, b) => a - b);
      const medianScore = sortedScores.length > 0
        ? Math.round(sortedScores[Math.floor(sortedScores.length / 2)])
        : 0;

      const highestScore = allScores.length > 0 ? Math.max(...allScores) : 0;
      const lowestScore = allScores.length > 0 ? Math.min(...allScores) : 0;

      // Process difficulty areas
      const difficultyAreas = Object.entries(difficultyMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([area, count]) => ({ area, count }));

      // Process weekly data
      const weekOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyData = weekOrder.map(day => {
        const data = weeklyProgressMap[day];
        return {
          day,
          avgScore: data ? Math.round(data.totalScore / data.count) : 0,
          quizzes: data ? data.count : 0
        };
      }).filter(d => d.quizzes > 0);

      // Process trend data (last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentQuizzes = allQuizzesByDate
        .filter(q => q.date >= thirtyDaysAgo)
        .sort((a, b) => a.date - b.date);

      const trendMap = {};
      recentQuizzes.forEach(quiz => {
        const dateKey = quiz.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!trendMap[dateKey]) {
          trendMap[dateKey] = { date: dateKey, totalScore: 0, count: 0 };
        }
        trendMap[dateKey].totalScore += quiz.score;
        trendMap[dateKey].count += 1;
      });

      const trendData = Object.values(trendMap).map(d => ({
        date: d.date,
        avgScore: Math.round(d.totalScore / d.count),
        quizzes: d.count
      }));

      setClassData({
        totalStudents,
        studentsImproved,
        studentsFallingBehind,
        classAverageScore,
        medianScore,
        highestScore,
        lowestScore,
        difficultyAreas
      });

      setWeeklyData(weeklyData);
      setTrendData(trendData);

    } catch (error) {
      console.error('Error loading class progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-800 text-xl">Loading class progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black p-16 bg-[#FDFBF7] rounded-3xl overflow-hidden mt-14 shadow-sm">
      {/* Back Button */}
      <button
        onClick={() => window.location.href = '/TeacherPage'}
        className="mb-6 flex items-center gap-2 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-md px-6 py-3 transition-all shadow-md"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Class Progress Monitor</h1>
          </div>
          <p className="text-gray-600">Track your students performance and identify areas for improvement</p>
        </div>

        {/* Class Overview */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-gray-600 text-sm">Total Students</p>
                <p className="text-4xl font-bold text-gray-900">{classData.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-gray-600 text-sm">Students Improved</p>
                <p className="text-4xl font-bold text-gray-900">{classData.studentsImproved}</p>
              </div>
            </div>
            <p className="text-gray-500 text-xs">+5% or more this week</p>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
              <TrendingDown className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-gray-600 text-sm">Falling Behind</p>
                <p className="text-4xl font-bold text-gray-900">{classData.studentsFallingBehind}</p>
              </div>
            </div>
            <p className="text-gray-500 text-xs">-5% or more this week</p>
          </div>
        </div>

        {/* Class Performance Reports */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Score Statistics */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Class Performance</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-yellow-600">{classData.classAverageScore}%</p>
                <p className="text-sm text-gray-600">Class Average</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-600">{classData.medianScore}%</p>
                <p className="text-sm text-gray-600">Median Score</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-600">{classData.highestScore}%</p>
                <p className="text-sm text-gray-600">Highest Score</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-red-600">{classData.lowestScore}%</p>
                <p className="text-sm text-gray-600">Lowest Score</p>
              </div>
            </div>
          </div>

          {/* Difficulty Areas */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-900">Class Difficulty Areas</h3>
            </div>

            {classData.difficultyAreas.length > 0 ? (
              <div className="space-y-3">
                {classData.difficultyAreas.map((area, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-900 font-medium">{area.area}</span>
                      <span className="text-orange-600 font-bold text-lg">{area.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min((area.count / Math.max(...classData.difficultyAreas.map(a => a.count))) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="text-gray-900 font-bold">No difficulty areas identified!</p>
                <p className="text-sm text-gray-600">Class is performing well</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Over Time Charts */}
        <div className="space-y-6">
          {/* Weekly Improvement Graph */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-cyan-600" />
              <h3 className="text-xl font-bold text-gray-900">Weekly Progress</h3>
            </div>

            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#374151" />
                  <YAxis stroke="#374151" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                    labelStyle={{ color: '#111827' }}
                  />
                  <Legend />
                  <Bar dataKey="avgScore" fill="#22d3ee" name="Average Score %" />
                  <Bar dataKey="quizzes" fill="#a78bfa" name="Quiz Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-600">No weekly data available</div>
            )}
          </div>

          {/* Quiz Score Trendline */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-pink-600" />
              <h3 className="text-xl font-bold text-gray-900">Score Trend (Last 30 Days)</h3>
            </div>

            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#374151" />
                  <YAxis stroke="#374151" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                    labelStyle={{ color: '#111827' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avgScore" 
                    stroke="#f472b6" 
                    strokeWidth={3}
                    name="Average Score %"
                    dot={{ fill: '#f472b6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-600">No trend data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}