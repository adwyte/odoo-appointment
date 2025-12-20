import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  Edit,
  X,
  Search,
  UserCog,
  Shield,
  User as UserIcon,
} from "lucide-react";
import DataTable from "../../components/ui/DataTable";
import Badge from "../../components/ui/Badge";
import { api } from "../../services/api";
import type { User } from "../../services/api";

interface UserFormData {
  email: string;
  password: string;
  full_name: string;
  role: "customer" | "admin" | "organiser";
}

const initialFormData: UserFormData = {
  email: "",
  password: "",
  full_name: "",
  role: "customer",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [resourceCount, setResourceCount] = useState(0);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getUsers();
      setUsers(response.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users by search
  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Add User
  const handleAddUser = async () => {
    if (!formData.email || !formData.password || !formData.full_name) {
      setError("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await api.createUser({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
      } as any);
      setShowAddModal(false);
      setFormData(initialFormData);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit User (Change Role)
  const handleEditUser = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      await api.updateUser(selectedUser.id, {
        role: formData.role,
        full_name: formData.full_name,
        email: formData.email,
      });
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData(initialFormData);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      // Use force=true to delete user along with their appointments
      await api.deleteUser(selectedUser.id, true);
      setShowDeleteModal(false);
      setSelectedUser(null);
      setAppointmentCount(0);
      setResourceCount(0);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: "",
      full_name: user.full_name,
      role: user.role,
    });
    setShowEditModal(true);
  };

  // Open Delete Modal - fetch appointment count first
  const openDeleteModal = async (user: User) => {
    setSelectedUser(user);
    setLoadingAppointments(true);
    setShowDeleteModal(true);
    
    try {
      const result = await api.getUserAppointmentCount(user.id);
      setAppointmentCount(result.appointment_count);
      setResourceCount(result.resource_count || 0);
    } catch {
      setAppointmentCount(0);
      setResourceCount(0);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4" />;
      case "organiser":
        return <UserCog className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "error";
      case "organiser":
        return "warning";
      default:
        return "default";
    }
  };

  const userColumns = [
    {
      key: "full_name",
      header: "Name",
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <div className="user-avatar">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium">{user.full_name}</span>
        </div>
      ),
    },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (user: User) => (
        <Badge variant={getRoleBadgeVariant(user.role) as any}>
          <span className="flex items-center gap-1">
            {getRoleIcon(user.role)}
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
        </Badge>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (user: User) => (
        <Badge variant={user.is_active ? "success" : "warning"}>
          {user.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Joined",
      render: (user: User) =>
        user.created_at
          ? new Date(user.created_at).toLocaleDateString()
          : "N/A",
    },
    {
      key: "actions",
      header: "Actions",
      render: (user: User) => (
        <div className="action-buttons">
          <button
            className="btn-icon btn-icon-edit"
            onClick={() => openEditModal(user)}
            title="Edit User"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            className="btn-icon btn-icon-delete"
            onClick={() => openDeleteModal(user)}
            title="Delete User"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2>User Management</h2>
          <p>Manage all users, their roles and permissions</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <p>Error: {error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Search and Stats */}
      <div className="users-toolbar">
        <div className="search-box">
          <Search className="w-4 h-4 search-icon" />
          <input
            type="text"
            placeholder="Search users by name, email or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="users-stats">
          <span className="stat-item">
            <Users className="w-4 h-4" />
            {users.length} Total Users
          </span>
          <span className="stat-item">
            <UserCog className="w-4 h-4" />
            {users.filter((u) => u.role === "organiser").length} Organisers
          </span>
          <span className="stat-item">
            <UserIcon className="w-4 h-4" />
            {users.filter((u) => u.role === "customer").length} Customers
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="dashboard-card">
        {loading ? (
          <div className="loading-state">Loading users...</div>
        ) : filteredUsers.length > 0 ? (
          <DataTable columns={userColumns} data={filteredUsers} />
        ) : (
          <div className="empty-state">
            <Users className="w-12 h-12 text-gray-400" />
            <p>No users found</p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button
                className="btn-icon"
                onClick={() => setShowAddModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Enter full name"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter password"
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "customer" | "admin" | "organiser",
                    })
                  }
                >
                  <option value="customer">Customer</option>
                  <option value="organiser">Organiser (Service Provider)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddUser}
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User</h3>
              <button
                className="btn-icon"
                onClick={() => setShowEditModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Change Role</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "customer" | "admin" | "organiser",
                    })
                  }
                >
                  <option value="customer">Customer</option>
                  <option value="organiser">Organiser (Service Provider)</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="form-hint">
                  Changing role to "Organiser" allows this user to create and
                  manage their own services and appointments.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEditUser}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete User</h3>
              <button
                className="btn-icon"
                onClick={() => setShowDeleteModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              {loadingAppointments ? (
                <div className="loading-state">Checking appointments...</div>
              ) : (
                <div className="delete-warning">
                  <Trash2 className="w-12 h-12 text-red-500" />
                  <p>
                    Are you sure you want to delete{" "}
                    <strong>{selectedUser.full_name}</strong>?
                  </p>
                  {appointmentCount > 0 && (
                    <div className="appointment-warning" style={{
                      background: "#fef3c7",
                      border: "1px solid #f59e0b",
                      borderRadius: "8px",
                      padding: "12px",
                      marginTop: "12px",
                      marginBottom: "12px"
                    }}>
                      <p style={{ color: "#92400e", fontWeight: 600, marginBottom: "4px" }}>
                        ⚠️ Warning: This user has {appointmentCount} appointment(s)
                      </p>
                      <p style={{ color: "#92400e", fontSize: "14px" }}>
                        Deleting this user will also delete all their appointments permanently.
                      </p>
                    </div>
                  )}
                  {resourceCount > 0 && (
                    <div className="resource-warning" style={{
                      background: "#dbeafe",
                      border: "1px solid #3b82f6",
                      borderRadius: "8px",
                      padding: "12px",
                      marginTop: "12px",
                      marginBottom: "12px"
                    }}>
                      <p style={{ color: "#1e40af", fontWeight: 600, marginBottom: "4px" }}>
                        ℹ️ Note: This user is linked to {resourceCount} resource(s)
                      </p>
                      <p style={{ color: "#1e40af", fontSize: "14px" }}>
                        These resources will be unlinked but not deleted.
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    This action cannot be undone. All data associated with this
                    user will be permanently removed.
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteUser}
                disabled={submitting || loadingAppointments}
              >
                {submitting ? "Deleting..." : (appointmentCount > 0 || resourceCount > 0) ? "Delete User & Data" : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
