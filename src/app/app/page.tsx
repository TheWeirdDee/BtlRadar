import { Suspense } from 'react';
import RadarDashboard from './RadarDashboard';

export default function AppPage() {
  return (
    <Suspense fallback={null}>
      <RadarDashboard />
    </Suspense>
  );
}
