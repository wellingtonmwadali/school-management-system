'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { StatsCard } from '@/components/StatsCard';
import { ClockInOutButton } from '@/components/ClockInOutButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import {
  Users, GraduationCap, UserCheck, DollarSign, AlertTriangle,
  TrendingUp, Clock, Megaphone, Calendar, Cake, Award, Cloud, CloudRain, Sun, Trophy, Star, Sparkles
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'principal' || user?.role === 'super_admin' || user?.role === 'deputy_principal';
  const isTeacher = user?.role === 'class_teacher' || user?.role === 'subject_teacher';
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['dashboard', user?.role],
    queryFn: async () => {
      const endpoint = user?.role === 'finance_officer' ? '/dashboard/finance' : '/dashboard/principal';
      const res = await api.get(endpoint);
      return res.data.data;
    },
    enabled: !!user,
  });

  const { data: upcomingClasses } = useQuery({
    queryKey: ['upcoming-classes', user?.id],
    queryFn: async () => {
      const res = await api.get('/timetable/upcoming');
      return res.data.data;
    },
    enabled: isTeacher,
  });

  const { data: staffBirthdays } = useQuery({
    queryKey: ['staff-birthdays'],
    queryFn: async () => {
      const res = await api.get('/staff/upcoming-events');
      return res.data.data;
    },
  });

  const { data: topStudents } = useQuery({
    queryKey: ['top-students', selectedClass],
    queryFn: async () => {
      const classParam = selectedClass !== 'all' ? `&class=${selectedClass}` : '';
      const res = await api.get(`/dashboard/top-students?limit=20${classParam}`);
      return res.data.data;
    },
    enabled: isAdmin,
  });

  const { data: topClasses } = useQuery({
    queryKey: ['top-classes'],
    queryFn: async () => {
      const res = await api.get('/dashboard/top-classes');
      return res.data.data;
    },
    enabled: isAdmin,
  });

  const { data: dailyQuote } = useQuery({
    queryKey: ['daily-quote'],
    queryFn: async () => {
      const res = await api.get('/quotes/daily');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours (daily quote)
  });

  const metrics = dashData?.metrics;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  // Attendance chart data
  const attendanceData = [
    { day: 'Mon', rate: 96 }, { day: 'Tue', rate: 94 }, { day: 'Wed', rate: 91 },
    { day: 'Thu', rate: 97 }, { day: 'Fri', rate: 89 }, { day: 'Mon', rate: 95 },
    { day: 'Tue', rate: 93 },
  ];

  const feeData = [
    { class: 'Form 1', collected: 85 }, { class: 'Form 2', collected: 72 },
    { class: 'Form 3', collected: 91 }, { class: 'Form 4', collected: 68 },
  ];

  const genderData = [
    { name: 'Male', value: 55 }, { name: 'Female', value: 45 },
  ];

  // Get current day and weather
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dayOfMonth = today.getDate();
  
  // Simple weather determination (based on day for demo - in production use weather API)
  const weatherType = dayOfMonth % 3 === 0 ? 'rainy' : dayOfMonth % 2 === 0 ? 'cloudy' : 'sunny';
  const weatherConfig = {
    sunny: { icon: Sun, text: 'Sunny', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    cloudy: { icon: Cloud, text: 'Cloudy', color: 'text-gray-600', bgColor: 'bg-gray-50' },
    rainy: { icon: CloudRain, text: 'Rainy', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  };
  const weather = weatherConfig[weatherType];
  const WeatherIcon = weather.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {user?.firstName}. Here's what's happening today.</p>
        </div>
        <ClockInOutButton />
      </div>

      {/* Daily Quote & Weather Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quote Section */}
        {dailyQuote && (
          <Card className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 border-indigo-200 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Daily Inspiration</span>
              </div>
              <blockquote className="space-y-4">
                <p className="text-2xl font-serif italic text-gray-800 leading-relaxed">
                  "{dailyQuote.text}"
                </p>
                <footer className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />
                  <p className="text-sm font-medium text-indigo-700">— {dailyQuote.author}</p>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />
                </footer>
              </blockquote>
            </CardContent>
          </Card>
        )}

        {/* Weather & Date Card */}
        <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 shadow-lg">
          <CardContent className="p-8 h-full flex flex-col justify-center">
            <div className="text-center space-y-6">
              {/* Weather Animation */}
              <div className="relative h-32 flex items-center justify-center">
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
                  weatherType === 'sunny' ? 'animate-bounce' : 
                  weatherType === 'rainy' ? 'animate-pulse' : 'animate-pulse'
                }`}>
                  <WeatherIcon className={`h-24 w-24 ${weather.color} drop-shadow-lg`} />
                </div>
              </div>
              
              {/* Weather Status */}
              <div className="space-y-2">
                <h3 className={`text-4xl font-bold ${weather.color}`}>
                  {weather.text}
                </h3>
                <p className="text-sm text-gray-600 font-medium">Current Weather</p>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

              {/* Date & Day */}
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900">
                  {dayName}
                </p>
                <p className="text-lg text-gray-600">
                  {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Quote */}
      {false && dailyQuote && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-medium text-gray-800 italic mb-2">"{dailyQuote.text}"</p>
                  <p className="text-sm text-muted-foreground">— {dailyQuote.author}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${weather.bgColor}`}>
                  <WeatherIcon className={`h-5 w-5 ${weather.color}`} />
                  <span className={`text-sm font-semibold ${weather.color}`}>{weather.text}</span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{dayName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin ? (
          <>
            <StatsCard
              title="Total Students" value={metrics?.totalStudents || 0}
              subtitle="Active enrollment" icon={GraduationCap} iconColor="text-blue-600"
            />
            <StatsCard
              title="Today's Attendance" value={`${metrics?.todayAttendanceRate || 0}%`}
              subtitle={`${metrics?.todayPresent || 0} present`}
              icon={UserCheck} iconColor="text-green-600"
            />
            <StatsCard
              title="Total Staff" value={metrics?.totalStaff || 0}
              subtitle="Active employees" icon={Users} iconColor="text-purple-600"
            />
            <StatsCard
              title="Active Classes" value={metrics?.activeClasses || 0}
              subtitle="Current semester" icon={GraduationCap} iconColor="text-orange-600"
            />
          </>
        ) : (
          <>
            <StatsCard
              title="My Classes" value={upcomingClasses?.totalClasses || 0}
              subtitle="This week" icon={GraduationCap} iconColor="text-blue-600"
            />
            <StatsCard
              title="Today's Schedule" value={upcomingClasses?.todayClasses || 0}
              subtitle="Classes today" icon={Clock} iconColor="text-green-600"
            />
            <StatsCard
              title="Students" value={metrics?.myStudents || 0}
              subtitle="Under your classes" icon={Users} iconColor="text-purple-600"
            />
            <StatsCard
              title="This Week" value={new Date().toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
              subtitle="Academic calendar" icon={Calendar} iconColor="text-orange-600"
            />
          </>
        )}
      </div>

      {/* Teacher-specific: Upcoming Classes */}
      {isTeacher && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock size={16} /> Upcoming Classes Today
            </CardTitle>
            <CardDescription>Your teaching schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingClasses?.today && upcomingClasses.today.length > 0 ? (
              <div className="space-y-2">
                {upcomingClasses.today.map((cls: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-2 min-w-[60px]">
                        <span className="text-xs text-muted-foreground">{cls.period}</span>
                        <span className="text-sm font-semibold text-primary">{cls.time}</span>
                      </div>
                      <div>
                        <p className="font-medium">{cls.subject}</p>
                        <p className="text-sm text-muted-foreground">{cls.class} {cls.stream} • Room {cls.room}</p>
                      </div>
                    </div>
                    <Badge variant={cls.isNext ? 'default' : 'secondary'}>
                      {cls.isNext ? 'Next' : cls.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No classes scheduled for today</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Section - Split View */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Students (Left Half) */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-4 border-b border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Top Performing Students</CardTitle>
                    <CardDescription className="text-sm mt-1">Academic excellence leaders</CardDescription>
                  </div>
                </div>
              </div>

              {/* Class Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={selectedClass === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedClass('all')}
                  className={selectedClass === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  All Classes
                </Button>
                {['Form 1', 'Form 2', 'Form 3', 'Form 4'].map((cls) => (
                  <Button
                    key={cls}
                    size="sm"
                    variant={selectedClass === cls ? 'default' : 'outline'}
                    onClick={() => setSelectedClass(cls)}
                    className={selectedClass === cls ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    {cls}
                  </Button>
                ))}
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {topStudents && topStudents.length > 0 ? (
                <div className="divide-y divide-blue-100 max-h-[600px] overflow-y-auto">
                  {topStudents.map((student: any, idx: number) => (
                    <div 
                      key={student._id}
                      className="p-4 hover:bg-blue-50/50 transition-colors flex items-center gap-4"
                    >
                      {/* Rank Badge */}
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                        idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 ring-4 ring-yellow-200' :
                        idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 ring-4 ring-gray-200' :
                        idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 ring-4 ring-orange-200' :
                        'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}>
                        {idx + 1}
                      </div>

                      {/* Student Photo */}
                      {student.photo ? (
                        <img 
                          src={student.photo} 
                          alt={`${student.firstName} ${student.lastName}`}
                          className="h-14 w-14 rounded-full object-cover border-3 border-white shadow-md flex-shrink-0"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md border-3 border-white flex-shrink-0">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                      )}

                      {/* Student Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {student.currentClass} {student.currentStream} • {student.admissionNumber}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {student.subjects} {student.subjects === 1 ? 'subject' : 'subjects'}
                        </p>
                      </div>

                      {/* Performance Badge */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-2xl font-bold text-blue-700">
                          {student.avgPercentage}%
                        </div>
                        <Badge 
                          className={`text-xs font-semibold mt-1 ${
                            student.grade === 'A' ? 'bg-green-600 hover:bg-green-700' :
                            student.grade === 'B' ? 'bg-blue-600 hover:bg-blue-700' :
                            student.grade === 'C' ? 'bg-yellow-600 hover:bg-yellow-700' :
                            'bg-gray-600 hover:bg-gray-700'
                          }`}
                        >
                          Grade {student.grade}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4">
                  <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-10 w-10 text-blue-600" />
                  </div>
                  <p className="text-gray-700 font-semibold mb-2">No Performance Data Yet</p>
                  <p className="text-sm text-gray-600 max-w-md mx-auto mb-4">
                    {selectedClass !== 'all' 
                      ? `No students found in ${selectedClass} with exam marks.`
                      : 'Top performing students will appear here once exam marks are entered.'}
                  </p>
                  <a 
                    href="/academics/exams" 
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors"
                  >
                    Enter Exam Marks
                    <TrendingUp size={16} />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performing Classes (Right Half) */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-green-50">
            <CardHeader className="pb-4 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">Top Performing Classes</CardTitle>
                  <CardDescription className="text-sm mt-1">Classes excelling academically</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {topClasses && topClasses.length > 0 ? (
                <div className="divide-y divide-emerald-100 max-h-[600px] overflow-y-auto">
                  {topClasses.map((classData: any, idx: number) => (
                    <div 
                      key={idx}
                      className="p-4 hover:bg-emerald-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank Badge */}
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                          idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 ring-4 ring-yellow-200' :
                          idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 ring-4 ring-gray-200' :
                          idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 ring-4 ring-orange-200' :
                          'bg-gradient-to-br from-emerald-500 to-green-600'
                        }`}>
                          {idx + 1}
                        </div>

                        {/* Class Info */}
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <h3 className="font-bold text-lg text-gray-900">
                              {classData.class} {classData.stream}
                            </h3>
                            <span className="text-sm text-gray-600">
                              ({classData.studentCount} students)
                            </span>
                          </div>
                          
                          {/* Teacher Info */}
                          {classData.teacher ? (
                            <div className="flex items-center gap-2 mt-2">
                              {classData.teacher.photo ? (
                                <img 
                                  src={classData.teacher.photo} 
                                  alt={classData.teacher.name}
                                  className="h-8 w-8 rounded-full object-cover border-2 border-white shadow-sm"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                                  {classData.teacher.name.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                              )}
                              <div className="text-sm">
                                <p className="font-medium text-gray-700">{classData.teacher.name}</p>
                                <p className="text-xs text-gray-500">Class Teacher</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mt-2">No class teacher assigned</p>
                          )}
                        </div>

                        {/* Average Score */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-3xl font-bold text-emerald-700">
                            {classData.avgPercentage}%
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Class Average</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4">
                  <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <Star className="h-10 w-10 text-emerald-600" />
                  </div>
                  <p className="text-gray-700 font-semibold mb-2">No Class Performance Data</p>
                  <p className="text-sm text-gray-600 max-w-md mx-auto mb-4">
                    Class rankings will appear once students' exam marks are recorded in the system.
                  </p>
                  <a 
                    href="/academics/exams" 
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                  >
                    Enter Exam Marks
                    <TrendingUp size={16} />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Old Top Performing Students Section - Hidden */}
      {false && isAdmin && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">Top Performing Students</CardTitle>
                  <CardDescription className="text-sm mt-1">Our academic stars based on overall performance</CardDescription>
                </div>
              </div>
              <Badge className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 font-semibold px-3 py-1">
                Excellence Board
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {topStudents && topStudents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {topStudents.map((student: any, idx: number) => (
                <div 
                  key={student._id}
                  className="relative bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-yellow-400 group"
                >
                  {/* Rank Badge */}
                  <div className={`absolute -top-3 -right-3 h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                    idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 ring-4 ring-yellow-200' :
                    idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 ring-4 ring-gray-200' :
                    idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 ring-4 ring-orange-200' :
                    'bg-gradient-to-br from-blue-400 to-blue-600'
                  }`}>
                    {idx + 1}
                  </div>

                  {/* Student Photo */}
                  <div className="flex flex-col items-center text-center">
                    {student.photo ? (
                      <img 
                        src={student.photo} 
                        alt={`${student.firstName} ${student.lastName}`}
                        className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md mb-3"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl mb-3 shadow-md border-4 border-white">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                    )}

                    {/* Student Name */}
                    <h3 className="font-bold text-sm text-gray-900 mb-1">
                      {student.firstName} {student.lastName}
                    </h3>
                    
                    {/* Class & Stream */}
                    <p className="text-xs text-gray-600 mb-3">
                      {student.currentClass} {student.currentStream}
                    </p>

                    {/* Performance Stats */}
                    <div className="w-full bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-2.5 border border-yellow-200">
                      <div className="flex items-baseline justify-center gap-1 mb-1">
                        <span className="text-2xl font-bold text-gray-900">
                          {student.avgPercentage}
                        </span>
                        <span className="text-xs text-gray-600">%</span>
                      </div>
                      <Badge 
                        className={`text-xs font-semibold ${
                          student.grade === 'A' ? 'bg-green-600 hover:bg-green-700' :
                          student.grade === 'B' ? 'bg-blue-600 hover:bg-blue-700' :
                          student.grade === 'C' ? 'bg-yellow-600 hover:bg-yellow-700' :
                          'bg-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        Grade {student.grade}
                      </Badge>
                    </div>

                    {/* Subject Count */}
                    <p className="text-xs text-gray-500 mt-2">
                      {student.subjects} {student.subjects === 1 ? 'subject' : 'subjects'}
                    </p>
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                  <Award className="h-10 w-10 text-yellow-600" />
                </div>
                <p className="text-gray-600 font-medium mb-2">No Performance Data Yet</p>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Top performing students will appear here once exam marks are entered into the system.
                </p>
                <a 
                  href="/academics/exams" 
                  className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-orange-700 hover:text-orange-800 transition-colors"
                >
                  Enter Exam Marks
                  <TrendingUp size={16} />
                </a>
              </div>
            )}

            {/* View All Link */}
            {topStudents && topStudents.length > 0 && (
              <div className="mt-6 text-center">
                <a 
                  href="/students" 
                  className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-800 transition-colors"
                >
                  View All Students
                  <TrendingUp size={16} />
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Staff Birthdays & Work Anniversaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cake size={16} /> Upcoming Birthdays
            </CardTitle>
            <CardDescription>Staff birthdays this month</CardDescription>
          </CardHeader>
          <CardContent>
            {staffBirthdays?.birthdays && staffBirthdays.birthdays.length > 0 ? (
              <ul className="space-y-3">
                {staffBirthdays.birthdays.map((staff: any) => (
                  <li key={staff._id} className="flex items-center justify-between p-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      {staff.photo ? (
                        <img src={staff.photo} alt={`${staff.firstName} ${staff.lastName}`} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                          <Cake size={18} className="text-pink-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{staff.firstName} {staff.lastName}</p>
                        <p className="text-xs text-muted-foreground">{staff.department}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-pink-600">
                      {new Date(staff.dateOfBirth).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No birthdays this month</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award size={16} /> Work Anniversaries
            </CardTitle>
            <CardDescription>Celebrating service milestones</CardDescription>
          </CardHeader>
          <CardContent>
            {staffBirthdays?.anniversaries && staffBirthdays.anniversaries.length > 0 ? (
              <ul className="space-y-3">
                {staffBirthdays.anniversaries.map((staff: any) => (
                  <li key={staff._id} className="flex items-center justify-between p-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      {staff.photo ? (
                        <img src={staff.photo} alt={`${staff.firstName} ${staff.lastName}`} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Award size={18} className="text-blue-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{staff.firstName} {staff.lastName}</p>
                        <p className="text-xs text-muted-foreground">{staff.department}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-blue-600">
                      {staff.yearsOfService} {staff.yearsOfService === 1 ? 'year' : 'years'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No anniversaries this month</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Information Cards - Admin Only */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-full p-2 bg-blue-100">
                <GraduationCap size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{metrics?.activeClasses || 4}</p>
                <p className="text-sm text-blue-600">Active Classes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-full p-2 bg-green-100">
                <UserCheck size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{metrics?.avgAttendanceRate || 0}%</p>
                <p className="text-sm text-green-600">Average Attendance (This Week)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-full p-2 bg-purple-100">
                <Users size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">{metrics?.teachingStaff || 0}</p>
                <p className="text-sm text-purple-600">Teaching Staff</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row - Admin Only */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Attendance Trend (Last 7 Days)</CardTitle>
              <CardDescription>Daily school-wide attendance rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip formatter={(v) => [`${v}%`, 'Attendance Rate']} />
                  <Area type="monotone" dataKey="rate" stroke="#3b82f6" fill="url(#attGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gender Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student Distribution</CardTitle>
              <CardDescription>Gender breakdown</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {genderData.map((_, idx) => <Cell key={idx} fill={COLORS[idx]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}%`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                {genderData.map((g, idx) => (
                  <div key={g.name} className="flex items-center gap-1.5 text-sm">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    <span className="text-muted-foreground">{g.name}: {g.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity and Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone size={16} /> School Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashData?.recentAnnouncements?.length ? (
              <ul className="space-y-3">
                {dashData.recentAnnouncements.slice(0, 5).map((ann: { _id: string; title: string; createdAt: string; audience: string[]; isPinned: boolean }) => (
                  <li key={ann._id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ann.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(ann.createdAt)}</p>
                    </div>
                    {ann.isPinned && <Badge variant="secondary" className="text-xs shrink-0">Pinned</Badge>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No announcements yet</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <a href="/attendance" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <UserCheck size={20} className="text-green-600 mb-2" />
                <p className="text-sm font-medium">Mark Attendance</p>
              </a>
              <a href="/students" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <GraduationCap size={20} className="text-blue-600 mb-2" />
                <p className="text-sm font-medium">View Students</p>
              </a>
              <a href="/library" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <Users size={20} className="text-purple-600 mb-2" />
                <p className="text-sm font-medium">Library</p>
              </a>
              <a href="/academics/timetable" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                <Clock size={20} className="text-orange-600 mb-2" />
                <p className="text-sm font-medium">Timetable</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
