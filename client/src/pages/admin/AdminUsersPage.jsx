import React, { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Users, UserX, UserCheck, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status toggle confirm
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async () => {
    if (!toggleTarget) return;
    const newStatus = toggleTarget.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setToggling(true);
    try {
      await api.patch(`/admin/users/${toggleTarget._id}`, { status: newStatus });
      toast.success(`User status updated to ${newStatus}`);
      setToggleTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to update user status');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold m-0">User Accounts & RBAC</h2>
        <p className="text-secondary small m-0">Directory of registered patrons, account states, and role allocations.</p>
      </div>

      <div className="im-glass p-4 rounded-4">
        {loading ? (
          <div className="text-center py-5">
            <LoadingSpinner message="Loading user directory..." />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-5 text-secondary">No users found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0" style={{ background: 'transparent' }}>
              <thead>
                <tr className="text-secondary small text-uppercase">
                  <th>User Profile</th>
                  <th>Contact Phone</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Joined Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u._id === currentUser?._id;
                  const isActive = u.status === 'ACTIVE';

                  return (
                    <tr key={u._id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow"
                            style={{
                              width: '36px',
                              height: '36px',
                              background: u.role === 'ADMIN' ? 'var(--primary-gradient)' : '#1e293b',
                            }}
                          >
                            {u.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="fw-bold text-light d-flex align-items-center gap-2">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-secondary small">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-secondary small">{u.phone || '—'}</td>
                      <td>
                        <span
                          className={`badge ${u.role === 'ADMIN' ? 'bg-danger' : 'bg-secondary'} text-uppercase`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="text-secondary small">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-end">
                        {!isSelf && (
                          <button
                            className={`btn btn-sm ${isActive ? 'btn-outline-danger' : 'btn-outline-success'} d-inline-flex align-items-center gap-1`}
                            onClick={() => setToggleTarget(u)}
                          >
                            {isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                            <span>{isActive ? 'Suspend' : 'Activate'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(toggleTarget)}
        title={toggleTarget?.status === 'ACTIVE' ? 'Suspend User Account' : 'Reactivate User Account'}
        message={
          toggleTarget
            ? `Are you sure you want to ${
                toggleTarget.status === 'ACTIVE' ? 'suspend' : 'reactivate'
              } account "${toggleTarget.name}" (${toggleTarget.email})? ${
                toggleTarget.status === 'ACTIVE'
                  ? 'They will not be able to log in or book tickets.'
                  : 'Their access will be immediately restored.'
              }`
            : ''
        }
        confirmText={toggleTarget?.status === 'ACTIVE' ? 'Yes, Suspend Account' : 'Yes, Reactivate'}
        variant={toggleTarget?.status === 'ACTIVE' ? 'danger' : 'primary'}
        loading={toggling}
        onConfirm={handleToggleStatus}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
}
