'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/badge';
import { getStatusColor, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Clock, UserCheck, Save, AlertCircle, Users, BarChart as BarChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CLASS_OPTIONS = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];
const STREAM_SUFFIX = ['East', 'West', 'North'];

export default function AttendancePage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'principal' || user?.role === 'super_admin' || user?.role === 'deputy_principal';
  const isClassTeacher = user?.role === 'class_teacher';
  const [selectedClass, setSelectedClass] = useState('Form 1');
  const [selectedStream, setSelectedStream] = useState('Form 1 East');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffDate, setStaffDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>({});

  // Get class teacher's assigned class
  const { data: myClass } = useQuery({
    queryKey: ['my-class', user?.id],
    queryFn: async () => {
      const res = await api.get('/settings/my-class-assignment');
      return res.data.data;
    },
    enabled: isClassTeacher,
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ['students-for-att', selectedClass, selectedStream],
    queryFn: async () => {
      const res = await api.get(`/students?class=${selectedClass}&limit=100`);
      return res.data.data.filter((s: { currentStream: string }) => s.currentStream === selectedStream);
    },
  });

  const { data: summaryData } = useQuery({
    queryKey: ['attendance-summary'],
    queryFn: async () => {
      const res = await api.get('/attendance/summary');
      return res.data;
    },
  });

  const { data: absentees } = useQuery({
    queryKey: ['absentees-today'],
    queryFn: async () => {
      const res = await api.get('/attendance/absentees');
      return res.data;
    },
  });

  // Staff attendance query
  const { data: staffAttendance, isLoading: loadingStaff } = useQuery({
    queryKey: ['staff-attendance', staffDate],
    queryFn: async () => {
      const res = await api.get(`/staff-attendance?date=${staffDate}`);
      return res.data.data;
    },
    enabled: user?.role === 'principal' || user?.role === 'super_admin' || user?.role === 'deputy_principal',
  });

  // Get my staff attendance
  const { data: myAttendance } = useQuery({
    queryKey: ['my-staff-attendance'],
    queryFn: async () => {
      const res = await api.get('/staff-attendance/my?limit=30');
      return res.data.data;
    },
  });

  const markMutation = useMutation({
    mutationFn: (records: unknown) => api.post('/attendance', {
      date, class: selectedClass, stream: selectedStream,
      academicYear: '2025', term: 1,
      records,
    }),
    onSuccess: () => {
      toast({ title: 'Attendance Saved', description: `Marked for ${Object.keys(attendanceMap).length} students` });
      qc.invalidateQueries({ queryKey: ['absentees-today'] });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to save attendance', variant: 'destructive' }),
  });

  const setStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: 'present' | 'absent') => {
    const all: Record<string, 'present' | 'absent'> = {};
    (students || []).forEach((s: { _id: string }) => { all[s._id] = status; });
    setAttendanceMap(all);
  };

  const handleSave = () => {
    const records = Object.entries(attendanceMap).map(([studentId, morningStatus]) => ({ studentId, morningStatus }));
    if (!records.length) { toast({ title: 'No attendance marked', variant: 'destructive' }); return; }
    markMutation.mutate(records);
  };

  const summaryStats = summaryData?.dailyStats || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground text-sm">Mark and track attendance</p>
        </div>
      </div>

      <Tabs defaultValue="mark" className="space-y-6">
        <TabsList>
          {(isClassTeacher || isAdmin) && (
            <TabsTrigger value="mark" className="gap-2">
              <UserCheck size={16} />
              Mark Attendance
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="trends" className="gap-2">
              <BarChartIcon size={16} />
              Trends & Reports
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="staff" className="gap-2">
              <Users size={16} />
              Staff Performance
            </TabsTrigger>
          )}
        </TabsList>

        {/* MARK ATTENDANCE TAB */}
        <TabsContent value="mark" className="space-y-6">
          {isClassTeacher && !myClass ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No Class Assigned</p>
                <p className="text-sm text-muted-foreground mt-2">
                  You don't have a class assigned to you. Please contact the administrator.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-full p-2 bg-green-100"><UserCheck size={20} className="text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {absentees ? (students?.length || 0) - (absentees?.count || 0) : '—'}
              </p>
              <p className="text-sm text-muted-foreground">Present Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-full p-2 bg-red-100"><X size={20} className="text-red-600" /></div>
            <div>
              <p className="text-2xl font-bold text-red-700">{absentees?.count || 0}</p>
              <p className="text-sm text-muted-foreground">Absent Today (School-wide)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-full p-2 bg-blue-100"><AlertCircle size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{students?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Students in {selectedStream}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mark Attendance */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mark Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4">
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                {isClassTeacher ? (
                  <>
                    <div className="h-9 px-3 rounded-md border bg-muted flex items-center text-sm">
                      {myClass?.class} {myClass?.stream}
                    </div>
                  </>
                ) : (
                  <>
                    <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedStream(`${v} East`); }}>
                      <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={selectedStream} onValueChange={setSelectedStream}>
                      <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STREAM_SUFFIX.map(s => (
                          <SelectItem key={s} value={`${selectedClass} ${s}`}>{selectedClass} {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => markAll('present')}>Mark All Present</Button>
                <Button variant="outline" size="sm" onClick={() => markAll('absent')}>Mark All Absent</Button>
              </div>

              {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">Loading students...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Adm. No</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(students || []).map((s: { _id: string; firstName: string; lastName: string; admissionNumber: string }, idx: number) => {
                      const status = attendanceMap[s._id];
                      return (
                        <TableRow key={s._id}>
                          <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-sm">{s.firstName} {s.lastName}</TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">{s.admissionNumber}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {(['present', 'absent', 'late', 'excused'] as const).map(st => (
                                <button
                                  key={st}
                                  onClick={() => setStatus(s._id, st)}
                                  className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                                    status === st
                                      ? st === 'present' ? 'bg-green-100 border-green-300 text-green-800'
                                        : st === 'absent' ? 'bg-red-100 border-red-300 text-red-800'
                                        : st === 'late' ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                                        : 'bg-blue-100 border-blue-300 text-blue-800'
                                      : 'border-transparent bg-muted text-muted-foreground hover:bg-accent'
                                  }`}
                                >
                                  {st.charAt(0).toUpperCase() + st.slice(1)}
                                </button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {Object.keys(attendanceMap).length} of {students?.length || 0} marked
                </p>
                <Button onClick={handleSave} disabled={markMutation.isPending}>
                  <Save size={16} className="mr-2" />
                  {markMutation.isPending ? 'Saving...' : 'Save Attendance'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Absentees Today */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Absentees Today</CardTitle>
          </CardHeader>
          <CardContent>
            {!absentees?.data?.length ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No absentees recorded</p>
            ) : (
              <ul className="space-y-3">
                {absentees.data.slice(0, 10).map((a: {
                  _id: string;
                  studentId: { firstName: string; lastName: string; admissionNumber: string; currentClass: string; currentStream: string };
                }) => (
                  <li key={a._id} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600">
                      {a.studentId?.firstName?.[0]}{a.studentId?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.studentId?.firstName} {a.studentId?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{a.studentId?.currentStream}</p>
                    </div>
                  </li>
                ))}
                {absentees.count > 10 && (
                  <p className="text-xs text-center text-muted-foreground">+{absentees.count - 10} more</p>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
            </>
          )}
        </TabsContent>

        {/* ATTENDANCE TRENDS TAB - Admin Only */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Attendance Trend (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={summaryStats.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(val) => new Date(val).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip labelFormatter={(val) => formatDate(val)} />
                    <Bar dataKey="present" fill="#10b981" name="Present" />
                    <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                    <Bar dataKey="late" fill="#f59e0b" name="Late" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Summary Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">This Week Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Attendance</span>
                    <span className="text-lg font-bold text-green-700">
                      {summaryStats.length ? Math.round((summaryStats.reduce((acc: number, s: any) => acc + (s.present || 0), 0) / summaryStats.length)) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Absences</span>
                    <span className="text-lg font-bold text-red-700">
                      {summaryStats.reduce((acc: number, s: any) => acc + (s.absent || 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Late</span>
                    <span className="text-lg font-bold text-yellow-700">
                      {summaryStats.reduce((acc: number, s: any) => acc + (s.late || 0), 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Class Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Today's Class Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {summaryData?.byClass?.length > 0 ? (
                  <div className="space-y-3">
                    {summaryData.byClass.map((c: any) => (
                      <div key={c._id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{c._id}</span>
                          <span className="text-muted-foreground">{c.total} students</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${(c.present / c.total) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {c.present} present, {c.absent} absent, {c.late} late
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground text-sm">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* STAFF ATTENDANCE TAB */}
        <TabsContent value="staff" className="space-y-6">
          <div className="flex gap-3 mb-4">
            <input 
              type="date" 
              value={staffDate} 
              onChange={e => setStaffDate(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm" 
            />
          </div>

          {/* My Attendance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">My Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {!myAttendance?.length ? (
                <p className="text-center py-8 text-muted-foreground text-sm">No attendance records</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myAttendance.slice(0, 10).map((record: any) => (
                      <TableRow key={record._id}>
                        <TableCell className="text-sm">{formatDate(record.date)}</TableCell>
                        <TableCell className="text-sm">
                          {record.clockInTime ? new Date(record.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.clockOutTime ? new Date(record.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.workingHours ? `${record.workingHours.toFixed(1)} hrs` : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            record.status === 'present' ? 'default' :
                            record.status === 'late' ? 'secondary' :
                            record.status === 'half_day' ? 'outline' : 'destructive'
                          }>
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* All Staff Attendance (Admin View) */}
          {(user?.role === 'principal' || user?.role === 'super_admin' || user?.role === 'deputy_principal') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Staff Attendance - {formatDate(staffDate)}</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStaff ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">Loading...</p>
                ) : !staffAttendance?.length ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">No records for this date</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Name</TableHead>
                        <TableHead>Clock In</TableHead>
                        <TableHead>Clock Out</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffAttendance.map((record: any) => (
                        <TableRow key={record._id}>
                          <TableCell className="font-medium text-sm">
                            {record.staffId?.firstName} {record.staffId?.lastName}
                            <div className="text-xs text-muted-foreground">{record.staffId?.designation}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {record.clockInTime ? new Date(record.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {record.clockOutTime ? new Date(record.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {record.workingHours ? `${record.workingHours.toFixed(1)} hrs` : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              record.status === 'present' ? 'default' :
                              record.status === 'late' ? 'secondary' :
                              record.status === 'half_day' ? 'outline' : 'destructive'
                            }>
                              {record.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
