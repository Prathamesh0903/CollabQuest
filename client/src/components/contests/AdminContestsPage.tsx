import React from 'react';
import AdminContestPanel from './AdminContestPanel';

export const AdminContestsPage: React.FC = () => {
  // Demo mode: always render admin page without role checks so UI is visible offline
  return (
    <div className="app" style={{ padding: 16 }}>
      <h2>Admin: Weekly Contests</h2>
      <AdminContestPanel />
    </div>
  );
};

export default AdminContestsPage;


