'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SettingsTabRedirect() {
  const params = useParams();
  const router = useRouter();
  
  useEffect(() => {
    const tab = params.tab as string;
    if (tab) {
      // Redirect to /settings with tab query parameter
      router.replace(`/settings?tab=${tab}`);
    } else {
      router.replace('/settings');
    }
  }, [params, router]);

  return (
    <div className="flex items-center justify-center h-48">
      <div className="text-muted-foreground">Redirecting...</div>
    </div>
  );
}
