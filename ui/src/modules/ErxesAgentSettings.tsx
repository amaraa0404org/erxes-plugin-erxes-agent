import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';

import '../styles.css';

const SettingsConnectionPage = lazy(() =>
  import('~/pages/settings/SettingsConnectionPage').then((module) => ({
    default: module.SettingsConnectionPage,
  })),
);

const SettingsCodeModePage = lazy(() =>
  import('~/pages/settings/SettingsCodeModePage').then((module) => ({
    default: module.SettingsCodeModePage,
  })),
);

/**
 * Settings router for the plugin, mounted by the host at
 * `/settings/erxes-agent/*` via the `./erxes_agentSettings` expose. Same
 * convention as the main router: relative index redirect and no catch-all
 * route.
 */
export const ErxesAgentSettings = () => {
  return (
    <Suspense fallback={<div />}>
      <Routes>
        <Route index element={<Navigate to="connection" replace />} />
        <Route path="connection" element={<SettingsConnectionPage />} />
        <Route path="code-mode" element={<SettingsCodeModePage />} />
      </Routes>
    </Suspense>
  );
};
