import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';

import '../styles.css';

const IndexPage = lazy(() =>
  import('~/pages/agents/IndexPage').then((module) => ({
    default: module.IndexPage,
  })),
);

/**
 * Main router for the plugin, mounted by the host at `/erxes-agent/*` via
 * the `./erxes_agent` expose. The chat page lives at the `chat` sub-route
 * (`/erxes-agent/chat`) and the root redirects there — a deep link so the
 * host's rail click never lands on a plugin root that a stale remote's
 * index redirect could rewrite. No catch-all route.
 */
export const ErxesAgent = () => {
  return (
    <Suspense fallback={<div />}>
      <Routes>
        <Route path="/" element={<Navigate to="chat" replace />} />
        <Route path="chat" element={<IndexPage />} />
      </Routes>
    </Suspense>
  );
};
