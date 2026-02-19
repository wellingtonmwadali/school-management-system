'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileBarChart } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Academic Reports</h1>
        <p className="text-muted-foreground">Generate and view student reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Generation</CardTitle>
          <CardDescription>Create comprehensive student reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <FileBarChart className="h-12 w-12 mx-auto mb-4" />
              <p>Report generation interface coming soon...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
