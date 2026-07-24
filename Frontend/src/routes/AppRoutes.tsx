import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layout
import { AppShell } from '../components/layout/AppShell';

// Pages — each is a thin route-level wrapper; business logic lives in features
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { EditorPage } from '../pages/EditorPage';
import { HistoryPage } from '../pages/HistoryPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';

// ─── Route tree ───────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // ── Public routes (no shell) ─────────────────────────────────────────────
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },

  // ── Authenticated routes (inside AppShell) ───────────────────────────────
  {
    element: <AppShell />,
    children: [
      // Default redirect
      {
        path: '/',
        element: <Navigate to="/editor/ai-paraphraser" replace />,
      },

      // Editor — dynamic tool slug
      {
        path: '/editor/:toolSlug',
        element: <EditorPage />,
      },

      // History
      {
        path: '/history',
        element: <HistoryPage />,
      },
    ],
  },

  // ── Catch-all fallback ────────────────────────────────────────────────────
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
