import { useState } from 'react';
import { updateTask, deleteTask } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['Todo', 'In Progress', 'Done'];

const priorityColor = { Low: 'info', Medium: 'warning', High: 'danger' };
const statusColor = { 'Todo': 'secondary', 'In Progress': 'warning', 'Done': 'success' };

const TaskCard = ({ task, onUpdate }) => {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);

  const isOverdue =
    task.status !== 'Done' && new Date(task.dueDate) < new Date();

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await updateTask(task._id, { status: newStatus });
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(task._id);
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const canDelete =
    user?.role === 'admin' && task.createdBy?._id === user._id;

  return (
    <div className={`card mb-2 border-0 shadow-sm ${isOverdue ? 'border-start border-danger border-3' : ''}`}>
      <div className="card-body p-3">
        <div className="d-flex align-items-start justify-content-between mb-1">
          <h6 className="mb-0 fw-semibold" style={{ fontSize: 13 }}>{task.title}</h6>
          {canDelete && (
            <button
              className="btn btn-link text-muted p-0 ms-1"
              style={{ fontSize: 12 }}
              onClick={handleDelete}
              title="Delete task"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>

        {task.description && (
          <p className="text-muted mb-2" style={{ fontSize: 12 }}>{task.description}</p>
        )}

        <div className="d-flex align-items-center gap-1 mb-2 flex-wrap">
          <span className={`badge bg-${priorityColor[task.priority] || 'secondary'} bg-opacity-75`} style={{ fontSize: 10 }}>
            {task.priority}
          </span>
          {isOverdue && (
            <span className="badge bg-danger" style={{ fontSize: 10 }}>
              <i className="bi bi-exclamation-circle me-1"></i>Overdue
            </span>
          )}
        </div>

        <div className="d-flex align-items-center justify-content-between">
          <small className="text-muted">
            <i className="bi bi-person-circle me-1"></i>
            {task.assignedTo?.name}
          </small>
          <small className={`text-${isOverdue ? 'danger' : 'muted'}`}>
            <i className="bi bi-calendar me-1"></i>
            {new Date(task.dueDate).toLocaleDateString()}
          </small>
        </div>

        {/* Status changer */}
        <div className="mt-2">
          <select
            className={`form-select form-select-sm border-${statusColor[task.status]}`}
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
            style={{ fontSize: 11 }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
