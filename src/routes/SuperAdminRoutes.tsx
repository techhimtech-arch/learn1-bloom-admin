import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SuperAdminDashboard from '@/pages/superadmin/SuperAdminDashboard';
import SchoolManagement from '@/pages/superadmin/SchoolManagement';

const SuperAdminRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<SuperAdminDashboard />} />
      <Route path="schools" element={<SchoolManagement />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default SuperAdminRoutes;
