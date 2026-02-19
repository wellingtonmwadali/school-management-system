'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  MapPin, 
  LogIn, 
  LogOut, 
  Users, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface StaffAttendance {
  _id: string;
  staffId: string;
  clockInTime: string;
  clockOutTime?: string;
  clockInLocation: Location;
  clockOutLocation?: Location;
  status: 'on-time' | 'late' | 'absent';
  date: string;
  workingHours?: number;
}

export default function StaffAttendancePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError(error.message);
          toast({
            title: 'Location Error',
            description: 'Unable to get your location. Please enable location services.',
            variant: 'destructive',
          });
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
    }
  }, [toast]);

  // Get today's attendance for current user
  const { data: todayAttendance, isLoading: loadingToday } = useQuery({
    queryKey: ['my-attendance-today', user?.id],
    queryFn: async () => {
      const res = await api.get('/staff-attendance/today');
      return res.data.data as StaffAttendance | null;
    },
    enabled: !!user,
  });

  // Get all staff attendance for selected date (admin view)
  const { data: allAttendance, isLoading: loadingAll } = useQuery({
    queryKey: ['all-staff-attendance', selectedDate],
    queryFn: async () => {
      const res = await api.get(`/staff-attendance?date=${selectedDate}`);
      return res.data.data as StaffAttendance[];
    },
    enabled: user?.role === 'principal' || user?.role === 'super_admin' || user?.role === 'deputy_principal',
  });

  // Get attendance summary/stats
  const { data: stats } = useQuery({
    queryKey: ['staff-attendance-stats'],
    queryFn: async () => {
      const res = await api.get('/staff-attendance/stats');
      return res.data.data;
    },
  });

  // Clock In Mutation
  const clockInMutation = useMutation({
    mutationFn: async () => {
      if (!currentLocation) throw new Error('Location not available');
      return api.post('/staff-attendance/clock-in', {
        clockInLocation: currentLocation,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Clocked In',
        description: `Clocked in at ${new Date().toLocaleTimeString()}`,
      });
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Clock In Failed',
        description: error.response?.data?.message || 'Failed to clock in',
        variant: 'destructive',
      });
    },
  });

  // Clock Out Mutation
  const clockOutMutation = useMutation({
    mutationFn: async () => {
      if (!currentLocation) throw new Error('Location not available');
      return api.post('/staff-attendance/clock-out', {
        clockOutLocation: currentLocation,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Clocked Out',
        description: `Clocked out at ${new Date().toLocaleTimeString()}`,
      });
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Clock Out Failed',
        description: error.response?.data?.message || 'Failed to clock out',
        variant: 'destructive',
      });
    },
  });

  const handleClockIn = () => {
    if (!currentLocation) {
      toast({
        title: 'Location Required',
        description: 'Please enable location services to clock in',
        variant: 'destructive',
      });
      return;
    }
    clockInMutation.mutate();
  };

  const handleClockOut = () => {
    if (!currentLocation) {
      toast({
        title: 'Location Required',
        description: 'Please enable location services to clock out',
        variant: 'destructive',
      });
      return;
    }
    clockOutMutation.mutate();
  };

  const isAdmin = user?.role === 'principal' || user?.role === 'super_admin' || user?.role === 'deputy_principal';
  const isClockedIn = todayAttendance && !todayAttendance.clockOutTime;
  const isClockedOut = todayAttendance && todayAttendance.clockOutTime;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Attendance</h1>
          <p className="text-muted-foreground">Track teacher and staff attendance with location</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.present || 0}</p>
                <p className="text-sm text-muted-foreground">Present Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.absent || 0}</p>
                <p className="text-sm text-muted-foreground">Absent Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.late || 0}</p>
                <p className="text-sm text-muted-foreground">Late Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clock In/Out Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            My Attendance
          </CardTitle>
          <CardDescription>Clock in and out with location tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              {currentLocation ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Location detected</p>
                  <p className="text-xs text-muted-foreground">
                    Lat: {currentLocation.latitude.toFixed(6)}, Long: {currentLocation.longitude.toFixed(6)}
                  </p>
                </div>
              ) : locationError ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-600">Location unavailable</p>
                  <p className="text-xs text-muted-foreground">{locationError}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Getting location...</p>
              )}
            </div>
          </div>

          {todayAttendance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Clock In</p>
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">
                    {new Date(todayAttendance.clockInTime).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              {todayAttendance.clockOutTime && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Clock Out</p>
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-red-600" />
                    <span className="font-semibold">
                      {new Date(todayAttendance.clockOutTime).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}
              {todayAttendance.workingHours !== undefined && isClockedOut && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Total Hours</p>
                  <span className="font-semibold">{todayAttendance.workingHours.toFixed(2)} hours</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            {!isClockedIn && !isClockedOut && (
              <Button
                onClick={handleClockIn}
                disabled={!currentLocation || clockInMutation.isPending}
                className="flex-1"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {clockInMutation.isPending ? 'Clocking In...' : 'Clock In'}
              </Button>
            )}
            {isClockedIn && (
              <Button
                onClick={handleClockOut}
                disabled={!currentLocation || clockOutMutation.isPending}
                variant="destructive"
                className="flex-1"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {clockOutMutation.isPending ? 'Clocking Out...' : 'Clock Out'}
              </Button>
            )}
            {isClockedOut && (
              <div className="flex-1 text-center p-3 bg-green-100 text-green-700 rounded-md font-medium">
                Attendance completed for today
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Staff Attendance (Admin View) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                All Staff Attendance
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              />
            </CardTitle>
            <CardDescription>View attendance records for all staff members</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAll ? (
              <div className="text-center py-8 text-muted-foreground">Loading attendance...</div>
            ) : allAttendance && allAttendance.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allAttendance.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell className="font-medium">
                        {/* This would ideally include staff name from populated data */}
                        Staff ID: {record.staffId}
                      </TableCell>
                      <TableCell>
                        {new Date(record.clockInTime).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        {record.clockOutTime 
                          ? new Date(record.clockOutTime).toLocaleTimeString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {record.workingHours 
                          ? `${record.workingHours.toFixed(2)}h`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.status === 'on-time' 
                              ? 'default' 
                              : record.status === 'late' 
                              ? 'secondary' 
                              : 'destructive'
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://www.google.com/maps?q=${record.clockInLocation.latitude},${record.clockInLocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                        >
                          <MapPin className="h-3 w-3" />
                          View
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records for this date
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
