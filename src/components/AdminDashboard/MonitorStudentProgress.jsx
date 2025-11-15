import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, BookOpen, Clock, Award, Target, AlertCircle, BarChart3, Download, FileText, Table, FileSpreadsheet, Activity, Zap } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';

export default function MonitorStudentProgress() {
  const [loading, setLoading] = useState(true);
  const [platformData, setPlatformData] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    mostActiveTime: '',
    mostUsedFeature: '',
    featureUsage: []
  });
  const [learningData, setLearningData] = useState({
    averageScore: 0,
    mostFailedLevel: '',
    mostCompletedLevel: '',
    commonWeakAreas: [],
    levelStats: []
  });
  const [timeDistribution, setTimeDistribution] = useState([]);
  const [exportData, setExportData] = useState([]);

  useEffect(() => {
    loadPlatformAnalytics();
  }, []);

  const loadPlatformAnalytics = async () => {
    try {
      // Load students
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const totalStudents = studentsSnapshot.size;

      // Load teachers
      const teachersSnapshot = await getDocs(collection(db, 'teachers'));
      const totalTeachers = teachersSnapshot.size;

      // Analyze activity data
      const timeMap = {};
      const featureMap = {};
      const levelCompletionMap = {};
      const levelFailureMap = {};
      const weakAreaMap = {};
      let totalScore = 0;
      let totalQuizzes = 0;
      const allExportData = [];

      for (const studentDoc of studentsSnapshot.docs) {
        const studentId = studentDoc.id;
        const studentData = studentDoc.data();

        // Get all activity
        const activitySnapshot = await getDocs(
          collection(db, 'students', studentId, 'activity')
        );

        activitySnapshot.docs.forEach(doc => {
          const activity = doc.data();
          const timestamp = activity.timestamp?.toDate();

          if (timestamp) {
            // Track time of day
            const hour = timestamp.getHours();
            const timeSlot = hour < 6 ? 'Night (12AM-6AM)' :
                           hour < 12 ? 'Morning (6AM-12PM)' :
                           hour < 18 ? 'Afternoon (12PM-6PM)' :
                           'Evening (6PM-12AM)';
            timeMap[timeSlot] = (timeMap[timeSlot] || 0) + 1;
          }

          // Track feature usage
          const feature = activity.mode || 'General';
          featureMap[feature] = (featureMap[feature] || 0) + 1;

          // Track scores
          if (activity.percentage !== undefined) {
            totalScore += activity.percentage;
            totalQuizzes++;

            // Track level completion/failure
            const level = `Level ${studentData.currentLevel || 1}`;
            if (activity.percentage >= 60) {
              levelCompletionMap[level] = (levelCompletionMap[level] || 0) + 1;
            } else {
              levelFailureMap[level] = (levelFailureMap[level] || 0) + 1;
            }
          }

          // Analyze weak areas
          if (activity.answers && Array.isArray(activity.answers)) {
            activity.answers.forEach(answer => {
              if (!answer.correct) {
                const area = activity.mode || 'General';
                weakAreaMap[area] = (weakAreaMap[area] || 0) + 1;
              }
            });
          }

          // Prepare export data
          allExportData.push({
            studentId,
            studentName: studentData.name || 'Unknown',
            date: timestamp ? timestamp.toLocaleDateString() : 'N/A',
            time: timestamp ? timestamp.toLocaleTimeString() : 'N/A',
            mode: activity.mode || 'General',
            theme: activity.themeTitle || activity.storyTitle || 'N/A',
            score: activity.score || 0,
            maxScore: activity.maxScore || 0,
            percentage: activity.percentage || 0,
            level: studentData.currentLevel || 1,
            totalExp: studentData.totalExp || 0
          });
        });
      }

      // Calculate most active time
      const mostActiveTime = Object.entries(timeMap)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      // Calculate most used feature
      const mostUsedFeature = Object.entries(featureMap)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      // Prepare feature usage data
      const featureUsage = Object.entries(featureMap)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));

      // Prepare time distribution
      const timeOrder = ['Morning (6AM-12PM)', 'Afternoon (12PM-6PM)', 'Evening (6PM-12AM)', 'Night (12AM-6AM)'];
      const timeDistribution = timeOrder
        .filter(time => timeMap[time])
        .map(time => ({ time, activities: timeMap[time] }));

      // Calculate average score
      const averageScore = totalQuizzes > 0 
        ? Math.round(totalScore / totalQuizzes)
        : 0;

      // Find most failed and completed levels
      const mostFailedLevel = Object.entries(levelFailureMap)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      const mostCompletedLevel = Object.entries(levelCompletionMap)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      // Common weak areas
      const commonWeakAreas = Object.entries(weakAreaMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([area, count]) => ({ area, count }));

      // Level stats for chart
      const allLevels = new Set([
        ...Object.keys(levelCompletionMap),
        ...Object.keys(levelFailureMap)
      ]);
      const levelStats = Array.from(allLevels).map(level => ({
        level,
        completed: levelCompletionMap[level] || 0,
        failed: levelFailureMap[level] || 0
      })).sort((a, b) => {
        const levelA = parseInt(a.level.replace('Level ', ''));
        const levelB = parseInt(b.level.replace('Level ', ''));
        return levelA - levelB;
      });

      setPlatformData({
        totalStudents,
        totalTeachers,
        mostActiveTime,
        mostUsedFeature,
        featureUsage
      });

      setLearningData({
        averageScore,
        mostFailedLevel,
        mostCompletedLevel,
        commonWeakAreas,
        levelStats
      });

      setTimeDistribution(timeDistribution);
      setExportData(allExportData);

    } catch (error) {
      console.error('Error loading platform analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Student ID', 'Student Name', 'Date', 'Time', 'Mode', 'Theme', 'Score', 'Max Score', 'Percentage', 'Level', 'Total EXP'],
      ...exportData.map(row => [
        row.studentId,
        row.studentName,
        row.date,
        row.time,
        row.mode,
        row.theme,
        row.score,
        row.maxScore,
        row.percentage,
        row.level,
        row.totalExp
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportData.map(row => ({
      'Student ID': row.studentId,
      'Student Name': row.studentName,
      'Date': row.date,
      'Time': row.time,
      'Mode': row.mode,
      'Theme': row.theme,
      'Score': row.score,
      'Max Score': row.maxScore,
      'Percentage': row.percentage,
      'Level': row.level,
      'Total EXP': row.totalExp
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Analytics');
    XLSX.writeFile(workbook, `platform_analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Platform Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #059669; }
          h2 { color: #10b981; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #059669; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .stat-box { display: inline-block; margin: 10px; padding: 15px; background: #f0f0f0; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>📊 Platform Analytics Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        
        <h2>Platform Usage</h2>
        <div class="stat-box">
          <strong>Total Students:</strong> ${platformData.totalStudents}
        </div>
        <div class="stat-box">
          <strong>Total Teachers:</strong> ${platformData.totalTeachers}
        </div>
        <div class="stat-box">
          <strong>Most Active Time:</strong> ${platformData.mostActiveTime}
        </div>
        <div class="stat-box">
          <strong>Most Used Feature:</strong> ${platformData.mostUsedFeature}
        </div>
        
        <h2>Learning Analytics</h2>
        <div class="stat-box">
          <strong>Average Score:</strong> ${learningData.averageScore}%
        </div>
        <div class="stat-box">
          <strong>Most Failed Level:</strong> ${learningData.mostFailedLevel}
        </div>
        <div class="stat-box">
          <strong>Most Completed Level:</strong> ${learningData.mostCompletedLevel}
        </div>
        
        <h2>Detailed Activity Data</h2>
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Date</th>
              <th>Mode</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Level</th>
            </tr>
          </thead>
          <tbody>
            ${exportData.map(row => `
              <tr>
                <td>${row.studentName}</td>
                <td>${row.date}</td>
                <td>${row.mode}</td>
                <td>${row.score}/${row.maxScore}</td>
                <td>${row.percentage}%</td>
                <td>${row.level}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <script>window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-800 text-xl">Loading platform analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black p-16 bg-[#FDFBF7] rounded-3xl overflow-hidden mt-14 shadow-sm">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Analytics Dashboard</h1>
          </div>
          <p className="text-gray-600">Complete platform insights and performance metrics</p>
        </div>

        {/* Platform Usage */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-7 h-7 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Platform Usage</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-center hover:shadow-md transition-all">
              <Users className="w-10 h-10 text-blue-600 mx-auto mb-2" />
              <p className="text-4xl font-bold text-gray-900">{platformData.totalStudents}</p>
              <p className="text-sm text-gray-600">Total Students</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-center hover:shadow-md transition-all">
              <BookOpen className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <p className="text-4xl font-bold text-gray-900">{platformData.totalTeachers}</p>
              <p className="text-sm text-gray-600">Total Teachers</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-center hover:shadow-md transition-all">
              <Clock className="w-10 h-10 text-yellow-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-900">{platformData.mostActiveTime}</p>
              <p className="text-sm text-gray-600">Most Active Time</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-center hover:shadow-md transition-all">
              <Zap className="w-10 h-10 text-orange-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-gray-900">{platformData.mostUsedFeature}</p>
              <p className="text-sm text-gray-600">Most Used Feature</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Feature Usage Pie Chart */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Feature Usage Distribution</h3>
              {platformData.featureUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={platformData.featureUsage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {platformData.featureUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-600">No data available</div>
              )}
            </div>

            {/* Time Distribution Bar Chart */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Activity by Time of Day</h3>
              {timeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={timeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#374151" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#374151" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="activities" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-600">No data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Learning Analytics */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Learning Analytics</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-center hover:shadow-md transition-all">
              <Award className="w-10 h-10 text-yellow-600 mx-auto mb-2" />
              <p className="text-4xl font-bold text-gray-900">{learningData.averageScore}%</p>
              <p className="text-sm text-gray-600">Average Score (All Students)</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-center hover:shadow-md transition-all">
              <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{learningData.mostFailedLevel}</p>
              <p className="text-sm text-gray-600">Most Failed Level</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-center hover:shadow-md transition-all">
              <Target className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{learningData.mostCompletedLevel}</p>
              <p className="text-sm text-gray-600">Most Completed Level</p>
            </div>
          </div>

          {/* Level Statistics Chart */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Level Completion vs Failure</h3>
            {learningData.levelStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={learningData.levelStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="level" stroke="#374151" />
                  <YAxis stroke="#374151" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-600">No level data available</div>
            )}
          </div>

          {/* Common Weak Areas */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Common Weak Areas Across Platform</h3>
            {learningData.commonWeakAreas.length > 0 ? (
              <div className="space-y-3">
                {learningData.commonWeakAreas.map((area, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-900 font-medium">{area.area}</span>
                      <span className="text-red-600 font-bold text-lg">{area.count} errors</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                        style={{ 
                          width: `${Math.min((area.count / Math.max(...learningData.commonWeakAreas.map(a => a.count))) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">No weak areas identified</div>
            )}
          </div>
        </div>

        {/* Export Reports */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-7 h-7 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Export Reports</h2>
          </div>

          <p className="text-gray-600 mb-6">Download comprehensive analytics in your preferred format</p>

          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={exportToCSV}
              className="bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:shadow-md text-gray-900 rounded-lg p-6 transition-all flex flex-col items-center gap-3 group"
            >
              <Table className="w-12 h-12 text-green-600 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <p className="font-bold text-lg">Export as CSV</p>
                <p className="text-sm text-gray-600">Spreadsheet compatible</p>
              </div>
            </button>

            <button
              onClick={exportToExcel}
              className="bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:shadow-md text-gray-900 rounded-lg p-6 transition-all flex flex-col items-center gap-3 group"
            >
              <FileSpreadsheet className="w-12 h-12 text-blue-600 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <p className="font-bold text-lg">Export as Excel</p>
                <p className="text-sm text-gray-600">Full Excel workbook</p>
              </div>
            </button>

            <button
              onClick={exportToPDF}
              className="bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:shadow-md text-gray-900 rounded-lg p-6 transition-all flex flex-col items-center gap-3 group"
            >
              <FileText className="w-12 h-12 text-red-600 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <p className="font-bold text-lg">Export as PDF</p>
                <p className="text-sm text-gray-600">Printable report</p>
              </div>
            </button>
          </div>

          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 text-center">
              📊 Total Records: <span className="font-bold text-gray-900">{exportData.length}</span> activities ready for export
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}