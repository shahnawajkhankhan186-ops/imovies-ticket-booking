import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      <div className="row g-4">
        {/* Sidebar Column */}
        <div className="col-12 col-lg-3 col-xl-2">
          <div className="sticky-top" style={{ top: '80px', zIndex: 10 }}>
            <AdminSidebar />
          </div>
        </div>

        {/* Content Column */}
        <div className="col-12 col-lg-9 col-xl-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
