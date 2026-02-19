'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export default function MarksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marks Entry</h1>
        <p className="text-muted-foreground">Enter and manage student marks</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Marks</CardTitle>
          <CardDescription>Record student assessment scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <ClipboardList className="h-12 w-12 mx-auto mb-4" />
              <p>Marks entry interface coming soon...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
