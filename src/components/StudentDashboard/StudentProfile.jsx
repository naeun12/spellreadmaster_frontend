import React, { useState } from 'react';
import { User, BookOpen, Award, Calendar, Mail, GraduationCap, TrendingUp, Target, Clock } from 'lucide-react';

export default function StudentProfile() {
  const [studentData] = useState({
    name: "Danny Tianco",
    parentEmail: "tianco@gmail.com",
    role: "student",
    section: "1A",
    skillLevel: "developing",
    startingLevel: 3,
    currentLevel: 3,
    studentId: "100023",
    teacherId: "4xVxKPU6YDUZHqBusO0zbBioBJD3",
    completedLevels: [1, 2],
    weakAreas: ["phonics_level_1", "phonics_level_2", "phonics_level_3"],
    firstLogin: true,
    createdAt: "June 14, 2025 at 8:37:48 AM UTC+8",
    lastUpdated: "November 14, 2025 at 12:32:22 PM UTC+8"
  });

  const progressPercentage = (studentData.completedLevels.length / 10) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Student Profile</h1>
              <p className="text-sm text-slate-500 mt-1">Academic Year 2025-2026</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                ID: {studentData.studentId}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Main Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-start gap-6">
              <div className="bg-white rounded-full p-4 shadow-lg">
                <User className="w-12 h-12 text-slate-700" />
              </div>
              
              <div className="flex-1 text-white">
                <h2 className="text-3xl font-bold mb-2">{studentData.name}</h2>
                <div className="flex items-center gap-6 text-slate-200">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{studentData.parentEmail}</span>
                  </div>
                  <div className="h-4 w-px bg-slate-500"></div>
                  <span className="text-sm font-medium">Section {studentData.section}</span>
                </div>
              </div>

              <div>
                <div className="px-5 py-2.5 rounded-lg border-2 bg-slate-100 text-slate-700 border-slate-300 font-semibold text-sm capitalize mb-2">
                  {studentData.role}
                </div>
                <div className="px-5 py-2.5 rounded-lg border-2 bg-amber-50 text-amber-700 border-amber-200 font-semibold text-sm capitalize">
                  {studentData.skillLevel}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 border-t border-slate-200">
            <div className="px-6 py-5 border-r border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Starting Level</p>
                  <p className="text-2xl font-bold text-slate-900">{studentData.startingLevel}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-r border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Current Level</p>
                  <p className="text-2xl font-bold text-slate-900">{studentData.currentLevel}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-r border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Completed</p>
                  <p className="text-2xl font-bold text-slate-900">{studentData.completedLevels.length}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Focus Areas</p>
                  <p className="text-2xl font-bold text-slate-900">{studentData.weakAreas.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Learning Progress</h3>
                <span className="text-sm font-medium text-slate-500">{progressPercentage}% Complete</span>
              </div>

              <div className="mb-6">
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700 mb-3">Completed Levels</p>
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
                    const isCompleted = studentData.completedLevels.includes(level);
                    const isCurrent = level === studentData.currentLevel;
                    return (
                      <div
                        key={level}
                        className={`
                          relative aspect-square rounded-lg border-2 flex items-center justify-center font-bold text-sm
                          ${isCompleted ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 
                            isCurrent ? 'bg-blue-50 border-blue-500 text-blue-700' :
                            'bg-slate-50 border-slate-200 text-slate-400'}
                        `}
                      >
                        {level}
                        {isCompleted && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Focus Areas */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Areas for Improvement</h3>
              </div>
              
              <div className="space-y-3">
                {studentData.weakAreas.map((area, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">
                        {area.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 px-3 py-1 bg-white rounded-full border border-slate-200">
                      In Progress
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Activity Log */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Activity Log</h3>
              </div>
              
              <div className="space-y-4">
                <div className="relative pl-6 pb-4 border-l-2 border-slate-200">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                  <p className="text-xs font-medium text-slate-500 mb-1">MOST RECENT</p>
                  <p className="text-sm font-semibold text-slate-900 mb-1">Profile Updated</p>
                  <p className="text-xs text-slate-600">{studentData.lastUpdated}</p>
                </div>
                
                <div className="relative pl-6">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                  <p className="text-xs font-medium text-slate-500 mb-1">ENROLLED</p>
                  <p className="text-sm font-semibold text-slate-900 mb-1">Account Created</p>
                  <p className="text-xs text-slate-600">{studentData.createdAt}</p>
                  {studentData.firstLogin && (
                    <span className="inline-block mt-2 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200">
                      First Login Complete
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Teacher Assignment */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Teacher</h3>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Assigned Teacher ID</p>
                <p className="font-mono text-xs text-slate-700 break-all">{studentData.teacherId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}