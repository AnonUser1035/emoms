import { useCallback, useEffect, useState } from 'react';

import { fetchHeatmap, postCheckin, type HeatmapDay } from './heatmap/api';
import Heatmap from './heatmap/Heatmap';
import WorkoutPlayer from './timer/WorkoutPlayer';

export default function App() {
  const [heatmap, setHeatmap] = useState<HeatmapDay[] | null>(null);

  const loadHeatmap = useCallback(() => {
    void fetchHeatmap().then(setHeatmap);
  }, []);

  useEffect(() => {
    loadHeatmap();
  }, [loadHeatmap]);

  const handleComplete = useCallback(() => {
    void postCheckin().then(loadHeatmap);
  }, [loadHeatmap]);

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-10 px-4 py-10">
      <header className="text-center">
        <h1 className="text-xl font-bold tracking-tight">
          David Rosen's EMOMs
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Every minute on the minute. Leave your phone across the room and
          follow the beeps.
        </p>
      </header>

      <WorkoutPlayer onComplete={handleComplete} />

      {heatmap && heatmap.length > 0 && <Heatmap days={heatmap} />}
    </div>
  );
}
