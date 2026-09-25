import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import {
  HomePage,
  CatalogPage,
  CentreDetailPage,
  MyBookingsPage,
  WebhookTestingPage,
  LoginPage,
  SignupPage,
  NotFoundPage,
} from '../pages';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="centres/:id" element={<CentreDetailPage />} />
        <Route path="webhook-sandbox" element={<WebhookTestingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />

        {/* Protected Routes (Require Authentication) */}
        <Route
          path="bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
};
