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
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading class progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 p-6">
      {/* Back Button */}
      <button
        onClick={() => window.location.href = '/TeacherPage'}
        className="mb-6 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-full px-6 py-3 transition-all backdrop-blur-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
            📊 Class Progress Monitor
          </h1>
          <p className="text-purple-200">Track your students performance and identify areas for improvement</p>
        </div>

        {/* Class Overview */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 backdrop-blur-md rounded-xl border border-blue-500/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-blue-200 text-sm">Total Students</p>
                <p className="text-4xl font-bold text-white">{classData.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-md rounded-xl border border-green-500/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-green-200 text-sm">Students Improved</p>
                <p className="text-4xl font-bold text-white">{classData.studentsImproved}</p>
              </div>
            </div>
            <p className="text-green-200 text-xs">+5% or more this week</p>
          </div>

          <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 backdrop-blur-md rounded-xl border border-orange-500/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingDown className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-orange-200 text-sm">Falling Behind</p>
                <p className="text-4xl font-bold text-white">{classData.studentsFallingBehind}</p>
              </div>
            </div>
            <p className="text-orange-200 text-xs">-5% or more this week</p>
          </div>
        </div>

        {/* Class Performance Reports */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Score Statistics */}
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-md rounded-xl border border-purple-500/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Class Performance</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <Award className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-yellow-400">{classData.classAverageScore}%</p>
                <p className="text-sm text-purple-200">Class Average</p>
              </div>

              <div className="bg-white/10 rounded-lg p-4 text-center">
                <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-400">{classData.medianScore}%</p>
                <p className="text-sm text-purple-200">Median Score</p>
              </div>

              <div className="bg-white/10 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-400">{classData.highestScore}%</p>
                <p className="text-sm text-purple-200">Highest Score</p>
              </div>

              <div className="bg-white/10 rounded-lg p-4 text-center">
                <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-red-400">{classData.lowestScore}%</p>
                <p className="text-sm text-purple-200">Lowest Score</p>
              </div>
            </div>
          </div>

          {/* Difficulty Areas */}
          <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 backdrop-blur-md rounded-xl border border-orange-500/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-400" />
              <h3 className="text-xl font-bold text-white">Class Difficulty Areas</h3>
            </div>

            {classData.difficultyAreas.length > 0 ? (
              <div className="space-y-3">
                {classData.difficultyAreas.map((area, i) => (
                  <div key={i} className="bg-white/10 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">{area.area}</span>
                      <span className="text-orange-400 font-bold text-lg">{area.count}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
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
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                <p className="text-white font-bold">No difficulty areas identified!</p>
                <p className="text-sm text-gray-300">Class is performing well</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Over Time Charts */}
        <div className="space-y-6">
          {/* Weekly Improvement Graph */}
          <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 backdrop-blur-md rounded-xl border border-cyan-500/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-bold text-white">Weekly Progress</h3>
            </div>

            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="day" stroke="#fff" />
                  <YAxis stroke="#fff" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="avgScore" fill="#22d3ee" name="Average Score %" />
                  <Bar dataKey="quizzes" fill="#a78bfa" name="Quiz Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-white">No weekly data available</div>
            )}
          </div>

          {/* Quiz Score Trendline */}
          <div className="bg-gradient-to-br from-pink-900/50 to-purple-900/50 backdrop-blur-md rounded-xl border border-pink-500/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-pink-400" />
              <h3 className="text-xl font-bold text-white">Score Trend (Last 30 Days)</h3>
            </div>

            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="#fff" />
                  <YAxis stroke="#fff" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
                    labelStyle={{ color: '#fff' }}
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
              <div className="text-center py-12 text-white">No trend data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}