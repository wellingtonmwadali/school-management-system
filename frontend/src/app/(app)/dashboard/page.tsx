'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { StatsCard } from '@/components/StatsCard';
import { ClockInOutButton } from '@/components/ClockInOutButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import {
  Users, GraduationCap, UserCheck, DollarSign, AlertTriangle,
  TrendingUp, Clock, Megaphone, Calendar, Cake, Award
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {user?.firstName}. Here's what's happening today.</p>
        </div>
        <ClockInOutButton />
      </div>

      {/* Daily Quote */}
      {dailyQuote && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-medium text-gray-800 italic mb-2">"{dailyQuote.text}"</p>
                <p className="text-sm text-muted-foreground">— {dailyQuote.author}</p>
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
