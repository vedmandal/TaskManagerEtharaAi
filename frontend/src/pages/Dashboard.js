import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const StatCard = ({ title, value, icon, color, bg }) => (
  <div className="col-xl-3 col-md-6 mb-3">
    <div className={`card border-0 shadow-sm h-100`}>
      <div className="card-body d-flex align-items-center">
        <div className={`rounded-3 p-3 me-3 bg-${bg} bg-opacity-10`}>
          <i className={`bi ${icon} fs-4 text-${color}`}></i>
        </div>
        <div>
          <div className="text-muted small fw-semibold text-uppercase">{title}</div>
          <div className="fs-3 fw-bold">{value}</div>
        </div>
      </div>
    </div>
  </div>
);

const statusBadge = (status) => {
  const map = {
    'Todo': 'secondary',
    'In Progress': 'warning',
    'Done': 'success',
  };
  return <span className={`badge bg-${map[status] || 'secondary'}`}>{status}</span>;
};

const priorityBadge = (priority) => {
  const map = { Low: 'info', Medium: 'warning', High: 'danger' };
  return <span className={`badge bg-${map[priority] || 'secondary'} bg-opacity-75`}>{priority}</span>;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await getDashboardStats();
        setStats(data);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <Layout>
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary"></div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="d-flex align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">
            Good day, {user?.name?.split(' ')[0]}! 👋
          </h4>
          <p className="text-muted small mb-0">Here's what's happening with your tasks.</p>
        </div>
        {user?.role === 'admin' && (
          <div className="ms-auto">
            <Link to="/projects" className="btn btn-primary btn-sm me-2">
              <i className="bi bi-plus-lg me-1"></i>New Project
            </Link>
            <Link to="/tasks/new" className="btn btn-outline-primary btn-sm">
              <i className="bi bi-plus-lg me-1"></i>New Task
            </Link>
          </div>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {stats && (
        <>
          <div className="row g-3 mb-4">
            <StatCard title="Total Tasks" value={stats.total} icon="bi-list-task" color="primary" bg="primary" />
            <StatCard title="Completed" value={stats.completed} icon="bi-check-circle-fill" color="success" bg="success" />
            <StatCard title="In Progress" value={stats.inProgress} icon="bi-clock-fill" color="warning" bg="warning" />
            <StatCard title="Overdue" value={stats.overdue} icon="bi-exclamation-triangle-fill" color="danger" bg="danger" />
          </div>

          {/* Progress bar */}
          {stats.total > 0 && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <span className="fw-semibold">Overall Progress</span>
                  <span className="text-muted small">
                    {stats.completed}/{stats.total} tasks completed
                  </span>
                </div>
                <div className="progress" style={{ height: 10 }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${Math.round((stats.completed / stats.total) * 100)}%` }}
                  ></div>
                </div>
                <div className="d-flex gap-4 mt-2">
                  <small className="text-success"><i className="bi bi-circle-fill me-1"></i>Done ({stats.completed})</small>
                  <small className="text-warning"><i className="bi bi-circle-fill me-1"></i>In Progress ({stats.inProgress})</small>
                  <small className="text-secondary"><i className="bi bi-circle-fill me-1"></i>Todo ({stats.todo})</small>
                </div>
              </div>
            </div>
          )}

          {/* Recent tasks */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 pt-3 pb-0">
              <div className="d-flex align-items-center justify-content-between">
                <h6 className="fw-bold mb-0">Recent Tasks</h6>
                <Link to="/tasks" className="btn btn-link btn-sm text-decoration-none p-0">
                  View all <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>
            <div className="card-body px-0 pb-0">
              {stats.recentTasks?.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                  No tasks yet
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3">Task</th>
                        <th>Project</th>
                        <th>Assignee</th>
                        <th>Priority</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentTasks.map((task) => (
                        <tr key={task._id}>
                          <td className="ps-3 fw-semibold">{task.title}</td>
                          <td className="text-muted small">{task.project?.name}</td>
                          <td className="text-muted small">
                            <i className="bi bi-person-circle me-1"></i>
                            {task.assignedTo?.name}
                          </td>
                          <td>{priorityBadge(task.priority)}</td>
                          <td>{statusBadge(task.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
