import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Target,
  AlertCircle,
  BarChart3,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Mail,
  Send,
  Trophy,
  Calendar
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

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
    difficultyAreas: [],
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [studentRankings, setStudentRankings] = useState([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    loadClassProgress();
  }, []);

  // ===== EMAIL TEMPLATE =====
  const generateStudentEmailHTML = ({
    studentName,
    currentLevel,
    totalExp,
    stats,
    weakAreas,
    recentActivities,
  }) => {
    const { totalQuizzes, averageScore, highestScore, passedQuizzes, failedQuizzes } = stats;
    return `
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📊 Progress Report</h1>
            <p style="color: #e9d5ff; margin: 10px 0 0 0; font-size: 16px;">${studentName}'s Spelling Journey</p>
          </div>
          <div style="padding: 30px 20px;">
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">Dear Parent,</p>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Here's a summary of <strong>${studentName}</strong>'s progress in SpellRead Master!
            </p>

            <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
              <div style="color: #ffffff; font-size: 18px; margin-bottom: 10px;">Current Level</div>
              <div style="color: #ffffff; font-size: 48px; font-weight: bold;">⭐ ${currentLevel}</div>
              <div style="color: #fef3c7; font-size: 14px; margin-top: 10px;">Total EXP: ${totalExp}</div>
            </div>

            <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Overall Statistics</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><span style="color: #6b7280; font-size: 14px;">Total Quizzes</span></td><td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong style="color: #1f2937; font-size: 16px;">${totalQuizzes}</strong></td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><span style="color: #6b7280; font-size: 14px;">Average Score</span></td><td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong style="color: #1f2937; font-size: 16px;">${averageScore}%</strong></td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><span style="color: #6b7280; font-size: 14px;">Highest Score</span></td><td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong style="color: #10b981; font-size: 16px;">${highestScore}%</strong></td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><span style="color: #6b7280; font-size: 14px;">Passed Quizzes</span></td><td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong style="color: #10b981; font-size: 16px;">✓ ${passedQuizzes}</strong></td></tr>
                <tr><td style="padding: 10px 0;"><span style="color: #6b7280; font-size: 14px;">Needs Review</span></td><td style="padding: 10px 0; text-align: right;"><strong style="color: #ef4444; font-size: 16px;">✗ ${failedQuizzes}</strong></td></tr>
              </table>
            </div>

            ${
              weakAreas.length > 0
                ? `
              <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h2 style="color: #9a3412; margin: 0 0 15px 0; font-size: 20px;">🎯 Areas to Focus On</h2>
                <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                  ${weakAreas
                    .map(
                      (area) => `<li style="margin: 8px 0; font-size: 14px;"><strong>${area.area}</strong> - ${area.count} incorrect answer${area.count > 1 ? 's' : ''}</li>`
                    )
                    .join('')}
                </ul>
                <p style="color: #78350f; font-size: 14px; margin: 15px 0 0 0; font-style: italic;">💡 Tip: Practice these areas with your child to help them improve!</p>
              </div>
            `
                : `
              <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h2 style="color: #065f46; margin: 0 0 10px 0; font-size: 20px;">🎉 Great Job!</h2>
                <p style="color: #047857; margin: 0; font-size: 14px;">${studentName} is performing well across all areas. Keep up the excellent work!</p>
              </div>
            `
            }

            ${
              recentActivities.length > 0
                ? `
              <div style="margin: 30px 0;">
                <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">📚 Recent Activities</h2>
                ${recentActivities
                  .map((activity) => {
                    const percentage = activity.percentage || 0;
                    const scoreColor = percentage >= 60 ? '#10b981' : '#ef4444';
                    const icon = activity.mode === 'LBLM' ? '🌟' : activity.mode === 'TLM' ? '📚' : activity.mode === 'story' ? '📖' : '✨';
                    return `
                      <div style="background-color: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 3px solid ${scoreColor};">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                          <div>
                            <div style="font-size: 18px; margin-bottom: 5px;">${icon}</div>
                            <div style="color: #1f2937; font-weight: bold; font-size: 14px;">${activity.themeTitle || activity.storyTitle || 'Quiz'}</div>
                            <div style="color: #6b7280; font-size: 12px;">${activity.mode || 'General'}</div>
                          </div>
                          <div style="text-align: right;">
                            <div style="color: ${scoreColor}; font-weight: bold; font-size: 20px;">${percentage}%</div>
                            <div style="color: #6b7280; font-size: 12px;">${activity.score}/${activity.maxScore}</div>
                          </div>
                        </div>
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            `
                : ''
            }

            <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
              <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin: 0;">Keep up the amazing work, ${studentName}! 🌟</p>
              <p style="color: #fae8ff; font-size: 14px; margin: 10px 0 0 0;">Every quiz completed is a step towards becoming a spelling master!</p>
            </div>

            <!-- Consistency Reminder -->
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px;">
              <h3 style="color: #1d4ed8; margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">💡 A Quick Reminder</h3>
              <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.5;">
                Consistent practice makes a big difference! Just 10–15 minutes a day on SpellRead Master can help your child build confidence and master new spelling patterns.
                Encourage your child to log in regularly—even short, frequent sessions lead to great progress! 🌱
              </p>
            </div>

            <p style="font-size: 14px; color: #374151; line-height: 1.6; margin-top: 30px;">Thank you for supporting your child's learning journey!</p>
            <p style="font-size: 14px; color: #374151; line-height: 1.6;">Best regards,<br /><strong>The SpellRead Master Team</strong></p>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">This is an automated progress report from SpellRead Master.</p>
            <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">If you have any questions, please contact us at support@spellingquest.com</p>
          </div>
        </div>
      </body>
    `;
  };

  // ===== LOAD DATA =====
  const loadClassProgress = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const teacherStudents = studentsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(student => student.teacherId === user.uid);

      const totalStudents = teacherStudents.length;
      if (totalStudents === 0) {
        setClassData(prev => ({ ...prev, totalStudents: 0 }));
        setLoading(false);
        return;
      }

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      let allScores = [];
      let studentsImproved = 0;
      let studentsFallingBehind = 0;
      const difficultyMap = {};
      const studentRankingData = [];
      const allQuizzesByDate = [];
      const weeklyProgressMap = {};

      for (const student of teacherStudents) {
        const studentId = student.id;
        const activitySnapshot = await getDocs(collection(db, 'students', studentId, 'activity'));
        const activities = activitySnapshot.docs.map(doc => ({
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
        }));

        const validScores = activities.map(a => a.percentage || 0).filter(s => s > 0);
        const studentAvg = validScores.length ? Math.round(validScores.reduce((a, b) => a + b) / validScores.length) : 0;

        const currentWeekActs = activities.filter(a => a.timestamp >= oneWeekAgo);
        const prevWeekActs = activities.filter(a => a.timestamp >= twoWeeksAgo && a.timestamp < oneWeekAgo);

        let improvement = 0;
        if (currentWeekActs.length > 0) {
          const currentAvg = currentWeekActs.reduce((sum, a) => sum + (a.percentage || 0), 0) / currentWeekActs.length;
          if (prevWeekActs.length > 0) {
            const prevAvg = prevWeekActs.reduce((sum, a) => sum + (a.percentage || 0), 0) / prevWeekActs.length;
            improvement = Math.round(currentAvg - prevAvg);
            if (improvement > 5) studentsImproved++;
            else if (improvement < -5) studentsFallingBehind++;
          }
        }

        if (studentAvg > 0) {
          studentRankingData.push({
            name: student.name || 'Unknown Student',
            avgScore: studentAvg,
            totalQuizzes: activities.length,
            improvement,
            level: student.currentLevel || 1,
            id: studentId,
            parentEmail: student.parentEmail || '',
            section: student.section || 'N/A',
            totalExp: student.totalExp || 0,
          });
        }

        activities.forEach(activity => {
          if (activity.percentage !== undefined) {
            allScores.push(activity.percentage);
            if (activity.timestamp) {
              allQuizzesByDate.push({ date: activity.timestamp, score: activity.percentage });
            }
          }
          if (activity.answers?.length) {
            activity.answers.forEach(ans => {
              if (!ans.correct) {
                const area = activity.mode || 'General';
                difficultyMap[area] = (difficultyMap[area] || 0) + 1;
              }
            });
          }
        });

        currentWeekActs.forEach(act => {
          if (act.timestamp) {
            const day = act.timestamp.toLocaleDateString('en-US', { weekday: 'short' });
            if (!weeklyProgressMap[day]) weeklyProgressMap[day] = { day, totalScore: 0, count: 0 };
            weeklyProgressMap[day].totalScore += act.percentage || 0;
            weeklyProgressMap[day].count += 1;
          }
        });
      }

      const classAverageScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b) / allScores.length) : 0;
      const sortedScores = [...allScores].sort((a, b) => a - b);
      const medianScore = sortedScores.length ? Math.round(sortedScores[Math.floor(sortedScores.length / 2)]) : 0;
      const highestScore = allScores.length ? Math.max(...allScores) : 0;
      const lowestScore = allScores.length ? Math.min(...allScores) : 0;

      const difficultyAreas = Object.entries(difficultyMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([area, count]) => ({ area, count }));

      const weekOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyData = weekOrder
        .map(day => {
          const d = weeklyProgressMap[day];
          return d ? { day, avgScore: Math.round(d.totalScore / d.count), quizzes: d.count } : null;
        })
        .filter(Boolean);

      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentQuizzes = allQuizzesByDate
        .filter(q => q.date >= thirtyDaysAgo)
        .sort((a, b) => a.date - b.date);
      const trendMap = {};
      recentQuizzes.forEach(q => {
        const key = q.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!trendMap[key]) trendMap[key] = { date: key, total: 0, count: 0 };
        trendMap[key].total += q.score;
        trendMap[key].count += 1;
      });
      const trendData = Object.values(trendMap).map(d => ({
        date: d.date,
        avgScore: Math.round(d.total / d.count),
      }));

      const rankedStudents = studentRankingData
        .sort((a, b) => b.avgScore - a.avgScore)
        .map((s, i) => ({ ...s, rank: i + 1 }));

      setClassData({
        totalStudents,
        studentsImproved,
        studentsFallingBehind,
        classAverageScore,
        medianScore,
        highestScore,
        lowestScore,
        difficultyAreas,
      });
      setWeeklyData(weeklyData);
      setTrendData(trendData);
      setStudentRankings(rankedStudents);
    } catch (error) {
      console.error('Error loading class progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===== EMAIL HANDLER =====
  const sendClassReportEmail = async () => {
    setSendingEmail(true);
    setEmailStatus({ show: false, type: '', message: '' });

    try {
      if (studentRankings.length === 0) throw new Error('No students found.');

      let success = 0, failed = 0;
      for (const student of studentRankings) {
        if (!student.parentEmail) {
          failed++;
          continue;
        }

        const activitySnapshot = await getDocs(collection(db, 'students', student.id, 'activity'));
        const activities = activitySnapshot.docs.map(doc => ({
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
        }));
        const valid = activities.filter(a => a.percentage !== undefined);
        const totalQuizzes = valid.length;
        const totalScore = valid.reduce((sum, a) => sum + (a.percentage || 0), 0);
        const averageScore = totalQuizzes ? Math.round(totalScore / totalQuizzes) : 0;
        const highestScore = totalQuizzes ? Math.max(...valid.map(a => a.percentage || 0)) : 0;
        const passedQuizzes = valid.filter(a => (a.percentage || 0) >= 60).length;
        const failedQuizzes = totalQuizzes - passedQuizzes;

        const weakAreaMap = {};
        valid.forEach(act => {
          if (act.answers?.length) {
            act.answers.forEach(ans => {
              if (!ans.correct) {
                const area = act.mode || 'General';
                weakAreaMap[area] = (weakAreaMap[area] || 0) + 1;
              }
            });
          }
        });
        const weakAreas = Object.entries(weakAreaMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([area, count]) => ({ area, count }));

        const recentActivities = [...valid]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5);

        const html = generateStudentEmailHTML({
          studentName: student.name,
          currentLevel: student.level,
          totalExp: student.totalExp || 0,
          stats: { totalQuizzes, averageScore, highestScore, passedQuizzes, failedQuizzes },
          weakAreas,
          recentActivities,
        });

        const res = await fetch('http://localhost:5000/send-progress-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parentEmail: student.parentEmail,
            subject: `SpellRead Master Progress Report - ${student.name}`,
            html,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) success++;
        else failed++;

        await new Promise(r => setTimeout(r, 200));
      }

      setEmailStatus({
        show: true,
        type: 'success',
        message: `✅ Sent to ${success} parent(s)! ${failed > 0 ? `(${failed} skipped)` : ''}`,
      });
      setShowEmailModal(false);
    } catch (error) {
      setEmailStatus({
        show: true,
        type: 'error',
        message: error.message || 'Failed to send emails.',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // ===== LOADING =====
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

  // ===== RENDER =====
  return (
    <div className="min-h-screen text-black p-6 md:p-16 bg-[#FDFBF7] rounded-3xl overflow-hidden mt-2 shadow-sm">
      {/* Back Button */}
      <button
        onClick={() => (window.location.href = '/TeacherPage')}
        className="mb-6 flex items-center gap-2 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-md px-6 py-3 transition-all shadow-md"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      {emailStatus.show && (
        <div className={`max-w-7xl mx-auto mb-4 p-4 rounded-lg border ${emailStatus.type === 'success' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'}`}>
          <div className="flex items-center gap-2">
            {emailStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{emailStatus.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Class Progress Monitor</h1>
                <p className="text-gray-600">You manage {classData.totalStudents} student(s)</p>
              </div>
            </div>
            <button
              onClick={() => setShowEmailModal(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-md px-6 py-3 flex items-center gap-2 transition-all shadow-md"
            >
              <Mail className="w-5 h-5" />
              Email Reports
            </button>
          </div>
        </div>

        {/* Class Overview */}
        <div className="grid md:grid-cols-3 gap-4">
          <OverviewCard Icon={Users} title="Total Students" value={classData.totalStudents} color="text-blue-600" />
          <OverviewCard Icon={TrendingUp} title="Students Improved" value={classData.studentsImproved} color="text-green-600" subtitle="+5% or more this week" />
          <OverviewCard Icon={TrendingDown} title="Falling Behind" value={classData.studentsFallingBehind} color="text-orange-600" subtitle="-5% or more this week" />
        </div>

        {/* Student Rankings */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <h3 className="text-xl font-bold text-gray-900">Your Students ({studentRankings.length})</h3>
          </div>
          {studentRankings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-gray-600 font-semibold py-3 px-2">Rank</th>
                    <th className="text-left text-gray-600 font-semibold py-3 px-2">Student</th>
                    <th className="text-left text-gray-600 font-semibold py-3 px-2">Section</th>
                    <th className="text-center text-gray-600 font-semibold py-3 px-2">Avg Score</th>
                    <th className="text-center text-gray-600 font-semibold py-3 px-2">Quizzes</th>
                    <th className="text-center text-gray-600 font-semibold py-3 px-2">Level</th>
                    <th className="text-center text-gray-600 font-semibold py-3 px-2">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRankings.map(student => (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {student.rank === 1 && <span>🥇</span>}
                          {student.rank === 2 && <span>🥈</span>}
                          {student.rank === 3 && <span>🥉</span>}
                          <span className="font-bold">{student.rank}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">{student.name}</td>
                      <td className="py-3 px-2 font-medium">{student.section}</td>
                      <td className="py-3 px-2 text-center font-bold">{student.avgScore}%</td>
                      <td className="py-3 px-2 text-center">{student.totalQuizzes}</td>
                      <td className="py-3 px-2 text-center">⭐ {student.level}</td>
                      <td className="py-3 px-2 text-center">
                        {student.improvement > 0 ? (
                          <span className="text-green-600 font-bold">↑ {student.improvement}%</span>
                        ) : student.improvement < 0 ? (
                          <span className="text-red-600 font-bold">↓ {Math.abs(student.improvement)}%</span>
                        ) : (
                          <span className="text-gray-500">→ 0%</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 italic">No students assigned to you.</p>
          )}
        </div>

        {/* Class Performance Reports */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Score Statistics */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Class Performance</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={<Award className="w-8 h-8 text-yellow-600" />} label="Class Average" value={`${classData.classAverageScore}%`} />
              <StatCard icon={<Target className="w-8 h-8 text-blue-600" />} label="Median Score" value={`${classData.medianScore}%`} />
              <StatCard icon={<CheckCircle className="w-8 h-8 text-green-600" />} label="Highest Score" value={`${classData.highestScore}%`} />
              <StatCard icon={<XCircle className="w-8 h-8 text-red-600" />} label="Lowest Score" value={`${classData.lowestScore}%`} />
            </div>
          </div>

          {/* Difficulty Areas */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
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

        {/* Charts */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
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
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} labelStyle={{ color: '#111827' }} />
                  <Legend />
                  <Bar dataKey="avgScore" fill="#22d3ee" name="Average Score (%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-600">No weekly data available</div>
            )}
          </div>

          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
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
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} labelStyle={{ color: '#111827' }} />
                  <Legend />
                  <Line type="monotone" dataKey="avgScore" stroke="#f472b6" strokeWidth={3} name="Average Score (%)" dot={{ fill: '#f472b6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-600">No trend data available</div>
            )}
          </div>
        </div>
      </div>

      {/* EMAIL MODAL */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-300">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Send Progress Reports
            </h3>
            <p className="text-gray-700 mb-4">
              {"Individual reports will be sent to each student's parent email."}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg px-4 py-2 transition-colors"
                disabled={sendingEmail}
              >
                Cancel
              </button>
              <button
                onClick={sendClassReportEmail}
                disabled={sendingEmail}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg px-4 py-2 transition-all disabled:opacity-60"
              >
                {sendingEmail ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    Send Reports
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Overview Card
function OverviewCard({ Icon, title, value, color, subtitle }) {
  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`w-8 h-8 ${color}`} />
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-4xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
    </div>
  );
}

// Stat Card for Performance Stats
function StatCard({ icon, label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
      {icon}
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}