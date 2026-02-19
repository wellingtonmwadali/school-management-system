'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function TeachersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teachers</h1>
        <p className="text-muted-foreground">Manage teacher information and assignments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Directory</CardTitle>
          <CardDescription>View all teacher information and manage library book assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <p>Teacher management interface coming soon...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
