'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, MapPin, LogIn, LogOut, CheckCircle, AlertCircle } from 'lucide-react';

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface AttendanceStatus {
  attendanceId?: string;
  clockInTime?: string;
  clockOutTime?: string;
  status?: 'present' | 'late' | 'half_day';
  workingHours?: number;
}

export function ClockInOutButton() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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
        }
      );
    }
  }, []);

  // Get today's attendance status
  const { data: todayStatus, isLoading } = useQuery({
    queryKey: ['attendance-today-status', user?.id],
    queryFn: async () => {
      const res = await api.get('/staff-attendance/today');
      return res.data.data as AttendanceStatus | null;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });

  // Clock In Mutation
  const clockInMutation = useMutation({
    mutationFn: async () => {
      if (!currentLocation) throw new Error('Location not available');
      return api.post('/staff-attendance/clock-in', {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
      });
    },
    onSuccess: (response) => {
      const data = response.data.data;
      toast({
        title: data.status === 'late' ? '⏰ Clocked In (Late)' : '✅ Clocked In',
        description: `Time: ${new Date(data.clockInTime).toLocaleTimeString()}`,
      });
      queryClient.invalidateQueries({ queryKey: ['attendance-today-status'] });
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
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
      });
    },
    onSuccess: (response) => {
      const data = response.data.data;
      toast({
        title: '👋 Clocked Out',
        description: `Working hours: ${data.workingHours?.toFixed(1)} hrs`,
      });
      queryClient.invalidateQueries({ queryKey: ['attendance-today-status'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Clock Out Failed',
        description: error.response?.data?.message || 'Failed to clock out',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-10 w-24 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isClockedIn = todayStatus?.clockInTime && !todayStatus?.clockOutTime;
  const isClockedOut = todayStatus?.clockInTime && todayStatus?.clockOutTime;
  const notClockedIn = !todayStatus?.clockInTime;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {notClockedIn && (
              <Badge variant="outline" className="text-xs">
                Not Clocked In
              </Badge>
            )}
            {isClockedIn && (
              <Badge variant="default" className="text-xs bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Clocked In
              </Badge>
            )}
            {isClockedOut && (
              <Badge variant="secondary" className="text-xs">
                Clocked Out
              </Badge>
            )}
          </div>

          {/* Time Display */}
          {todayStatus?.clockInTime && (
            <div className="text-xs text-muted-foreground">
              {new Date(todayStatus.clockInTime).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
              {todayStatus.clockOutTime && (
                <> - {new Date(todayStatus.clockOutTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</>
              )}
            </div>
          )}

          {/* Action Button */}
          {!locationError && currentLocation && (
            <>
              {notClockedIn && (
                <Button
                  size="sm"
                  onClick={() => clockInMutation.mutate()}
                  disabled={clockInMutation.isPending}
                  className="ml-auto"
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  Clock In
                </Button>
              )}
              {isClockedIn && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => clockOutMutation.mutate()}
                  disabled={clockOutMutation.isPending}
                  className="ml-auto"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Clock Out
                </Button>
              )}
              {isClockedOut && (
                <div className="ml-auto flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Complete
                </div>
              )}
            </>
          )}

          {locationError && (
            <div className="ml-auto flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3" />
              <span>Enable location</span>
            </div>
          )}
        </div>

        {/* Status indicator */}
        {todayStatus?.status === 'late' && (
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
            <AlertCircle className="h-3 w-3" />
            <span>Marked as late</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
