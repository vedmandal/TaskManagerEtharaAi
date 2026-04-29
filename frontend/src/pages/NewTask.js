import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createTask, getProjects, getProjectById } from '../utils/api';
import Layout from '../components/Layout';

const NewTask = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProject = searchParams.get('project');

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'Todo',
    priority: 'Medium',
    dueDate: '',
    project: preselectedProject || '',
    assignedTo: '',
  });

  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getProjects()
      .then(({ data }) => setProjects(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (form.project) {
      getProjectById(form.project)
        .then(({ data }) => setMembers(data.members))
        .catch(() => setMembers([]));
    } else {
      setMembers([]);
    }
    setForm((prev) => ({ ...prev, assignedTo: '' }));
  }, [form.project]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.project) return setError('Please select a project');
    if (!form.assignedTo) return setError('Please select an assignee');
    if (!form.dueDate) return setError('Please set a due date');
    setSubmitting(true);
    try {
      await createTask(form);
      navigate(preselectedProject ? `/projects/${preselectedProject}` : '/tasks');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="row justify-content-center">
        <div className="col-xl-7 col-lg-9">
          <nav aria-label="breadcrumb" className="mb-2">
            <ol className="breadcrumb small">
              <li className="breadcrumb-item"><Link to="/tasks">Tasks</Link></li>
              <li className="breadcrumb-item active">New Task</li>
            </ol>
          </nav>
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 pt-4 pb-0">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-plus-circle me-2 text-primary"></i>Create New Task
              </h5>
            </div>
            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger py-2 small">
                  <i className="bi bi-exclamation-circle me-2"></i>{error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Title *</label>
                  <input
                    className="form-control"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Design login page"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Task details..."
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Project *</label>
                    <select
                      className="form-select"
                      name="project"
                      value={form.project}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select project...</option>
                      {projects.map((p) => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Assign To *</label>
                    <select
                      className="form-select"
                      name="assignedTo"
                      value={form.assignedTo}
                      onChange={handleChange}
                      required
                      disabled={!form.project}
                    >
                      <option value="">
                        {form.project ? 'Select member...' : 'Select project first'}
                      </option>
                      {members.map((m) => (
                        <option key={m._id} value={m._id}>{m.name} ({m.role})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Status</label>
                    <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                      <option>Todo</option>
                      <option>In Progress</option>
                      <option>Done</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Priority</label>
                    <select className="form-select" name="priority" value={form.priority} onChange={handleChange}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Due Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      name="dueDate"
                      value={form.dueDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</>
                      : <><i className="bi bi-check-lg me-2"></i>Create Task</>}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewTask;
