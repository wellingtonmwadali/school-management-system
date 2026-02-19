'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function TimetablePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Timetable</h1>
        <p className="text-muted-foreground">View and manage class timetables</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Timetable</CardTitle>
          <CardDescription>Weekly schedule for classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4" />
              <p>Timetable view coming soon...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
