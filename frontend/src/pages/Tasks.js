import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTasks, updateTask, deleteTask } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const STATUSES = ['All', 'Todo', 'In Progress', 'Done'];
const statusColor = { 'Todo': 'secondary', 'In Progress': 'warning', 'Done': 'success' };
const priorityColor = { Low: 'info', Medium: 'warning', High: 'danger' };

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    let result = tasks;
    if (statusFilter !== 'All') {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.project?.name?.toLowerCase().includes(q) ||
          t.assignedTo?.name?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [tasks, statusFilter, search]);

  const fetchTasks = async () => {
    try {
      const { data } = await getTasks();
      setTasks(data);
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  return (
    <Layout>
      <div className="d-flex align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-0"><i className="bi bi-check2-square me-2 text-primary"></i>Tasks</h4>
          <p className="text-muted small mb-0">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {user?.role === 'admin' && (
          <Link to="/tasks/new" className="btn btn-primary ms-auto btn-sm">
            <i className="bi bi-plus-lg me-2"></i>New Task
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-2 px-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search tasks, projects, assignees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-7">
              <div className="d-flex gap-1 flex-wrap">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
          <p className="text-muted">No tasks found</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-3">Title</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => {
                  const isOverdue = task.status !== 'Done' && new Date(task.dueDate) < new Date();
                  const canDelete = user?.role === 'admin' && task.createdBy?._id === user._id;
                  return (
                    <tr key={task._id} className={isOverdue ? 'table-danger' : ''}>
                      <td className="ps-3">
                        <div className="fw-semibold">{task.title}</div>
                        {task.description && (
                          <small className="text-muted">{task.description.slice(0, 60)}{task.description.length > 60 ? '…' : ''}</small>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/projects/${task.project?._id}`}
                          className="text-decoration-none small text-primary"
                        >
                          <i className="bi bi-folder me-1"></i>{task.project?.name}
                        </Link>
                      </td>
                      <td className="small">
                        <i className="bi bi-person-circle me-1 text-muted"></i>
                        {task.assignedTo?.name}
                      </td>
                      <td>
                        <span className={`badge bg-${priorityColor[task.priority] || 'secondary'}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className={`small ${isOverdue ? 'text-danger fw-semibold' : 'text-muted'}`}>
                        <i className="bi bi-calendar me-1"></i>
                        {new Date(task.dueDate).toLocaleDateString()}
                        {isOverdue && <span className="badge bg-danger ms-1">Overdue</span>}
                      </td>
                      <td>
                        <select
                          className={`form-select form-select-sm border-${statusColor[task.status]}`}
                          value={task.status}
                          onChange={(e) => handleStatusChange(task._id, e.target.value)}
                          style={{ minWidth: 110, fontSize: 12 }}
                        >
                          {['Todo', 'In Progress', 'Done'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {canDelete && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(task._id)}
                            title="Delete task"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Tasks;
