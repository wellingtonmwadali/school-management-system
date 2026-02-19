'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';

export default function CounselingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Counseling</h1>
        <p className="text-muted-foreground">Manage student counseling sessions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Counseling Records</CardTitle>
          <CardDescription>Track students receiving counseling support</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Heart className="h-12 w-12 mx-auto mb-4" />
              <p>Counseling management interface coming soon...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
