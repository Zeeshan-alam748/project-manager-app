import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const blankProject = { name: '', description: '', dueDate: '', memberIds: [] };
const blankTask = { title: '', details: '', status: 'TODO', dueDate: '', projectId: '', assigneeId: '' };

function App() {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('pm_auth');
    return saved ? JSON.parse(saved) : null;
  });
  const [mode, setMode] = useState('login');

  function saveAuth(nextAuth) {
    setAuth(nextAuth);
    localStorage.setItem('pm_auth', JSON.stringify(nextAuth));
  }

  function logout() {
    localStorage.removeItem('pm_auth');
    setAuth(null);
  }

  return auth ? (
    <Workspace auth={auth} onLogout={logout} />
  ) : (
    <AuthPage mode={mode} onMode={setMode} onAuth={saveAuth} />
  );
}

function AuthPage({ mode, onMode, onAuth }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'DEVELOPER' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setErrors({});
    setBusy(true);
    try {
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : form;
      const data = await request(`/auth/${mode}`, { method: 'POST', body: payload });
      onAuth(data);
    } catch (error) {
      setErrors(error.details || { message: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">Project Manager</p>
          <h1>Plan small team work without losing track.</h1>
          <p className="muted">A simple full-stack app with JWT login, projects, tasks, roles, and a dashboard.</p>
        </div>
        <form className="form-card" onSubmit={submit}>
          <div className="switcher">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => onMode('login')}>Login</button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => onMode('register')}>Register</button>
          </div>
          {mode === 'register' && (
            <>
              <Field label="Name" error={errors.name}>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
              </Field>
              <Field label="Role" error={errors.role}>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="DEVELOPER">Developer</option>
                  <option value="PROJECT_MANAGER">Project manager</option>
                </select>
              </Field>
            </>
          )}
          <Field label="Email" error={errors.email}>
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </Field>
          <Field label="Password" error={errors.password}>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
          </Field>
          {errors.message && <p className="error-banner">{errors.message}</p>}
          <button className="primary" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}</button>
        </form>
      </section>
    </main>
  );
}

function Workspace({ auth, onLogout }) {
  const isManager = auth.role === 'ADMIN';
  const [dashboard, setDashboard] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [projectForm, setProjectForm] = useState(blankProject);
  const [taskForm, setTaskForm] = useState(blankTask);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const requests = [
        request('/dashboard', {}, auth.token),
        request('/projects', {}, auth.token),
        request('/tasks', {}, auth.token)
      ];
      if (isManager) {
        requests.push(request('/users', {}, auth.token));
      }
      const [dash, projectList, taskList, userList = []] = await Promise.all(requests);
      setDashboard(dash);
      setProjects(projectList);
      setTasks(taskList);
      setUsers(isManager ? userList : [auth]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const visibleMembers = useMemo(() => {
    if (!isManager) return [];
    return users.filter(user => user.id !== auth.id);
  }, [users, auth.id, isManager]);

  const assignableUsers = useMemo(() => {
    if (isManager) return users;
    const byId = new Map([[auth.id, auth]]);
    projects.forEach(project => {
      project.members.forEach(member => byId.set(member.id, member));
      byId.set(project.owner.id, project.owner);
    });
    return Array.from(byId.values());
  }, [auth, isManager, projects, users]);

  const dashboardTasks = useMemo(() => {
    if (isManager) return tasks;
    return tasks.filter(task => task.assignee?.id === auth.id);
  }, [auth.id, isManager, tasks]);

  async function createProject(event) {
    event.preventDefault();
    setNotice('');
    setError('');
    try {
      await request('/projects', { method: 'POST', body: { ...projectForm, memberIds: projectForm.memberIds.map(Number) } }, auth.token);
      setProjectForm(blankProject);
      setNotice('Project added');
      loadData();
    } catch (err) {
      setError(readError(err));
    }
  }

  async function createTask(event) {
    event.preventDefault();
    setNotice('');
    setError('');
    try {
      const body = { ...taskForm, projectId: Number(taskForm.projectId), assigneeId: taskForm.assigneeId ? Number(taskForm.assigneeId) : null };
      await request('/tasks', { method: 'POST', body }, auth.token);
      setTaskForm(blankTask);
      setNotice('Task added');
      loadData();
    } catch (err) {
      setError(readError(err));
    }
  }

  async function updateTaskStatus(task, status) {
    setError('');
    try {
      await request(`/tasks/${task.id}`, {
        method: 'PUT',
        body: { title: task.title, details: task.details, status, dueDate: task.dueDate, projectId: task.projectId, assigneeId: task.assignee?.id || null }
      }, auth.token);
      loadData();
    } catch (err) {
      setError(readError(err));
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Simple Project Manager</p>
          <h1>Work board</h1>
        </div>
        <div className="user-chip">
          <span>{auth.name}</span>
          <RoleBadge role={auth.role} />
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>

      {error && <p className="error-banner">{error}</p>}
      {notice && <p className="success-banner">{notice}</p>}
      {loading ? <Loading /> : (
        <>
          <Dashboard dashboard={dashboard} tasks={dashboardTasks} auth={auth} onStatus={updateTaskStatus} />
          <section className="grid">
            <ProjectForm form={projectForm} setForm={setProjectForm} users={visibleMembers} isManager={isManager} onSubmit={createProject} />
            <TaskForm form={taskForm} setForm={setTaskForm} projects={projects} users={assignableUsers} onSubmit={createTask} />
          </section>
          <section className="content-grid">
            <ProjectList projects={projects} />
            <TaskList tasks={tasks} onStatus={updateTaskStatus} />
          </section>
          {isManager && <AdminUsers users={users} />}
        </>
      )}
    </main>
  );
}

function Dashboard({ dashboard, tasks, auth, onStatus }) {
  const statusCounts = ['TODO', 'IN_PROGRESS', 'DONE'].map(status => ({
    status,
    value: tasks.filter(task => task.status === status).length
  }));
  const maxValue = Math.max(1, ...statusCounts.map(item => item.value));
  const doneCount = statusCounts.find(item => item.status === 'DONE')?.value || 0;
  const inProgressCount = statusCounts.find(item => item.status === 'IN_PROGRESS')?.value || 0;
  const stats = [
    ['My Tasks', tasks.length],
    ['In Progress', inProgressCount],
    ['Done', doneCount],
    ['Projects', dashboard.projects]
  ];
  return (
    <section className="task-dashboard">
      <div className="section-heading dashboard-title">
        <div>
          <p className="eyebrow">{auth.role === 'MEMBER' ? 'My task dashboard' : 'Team task dashboard'}</p>
          <h2>{auth.role === 'MEMBER' ? `${auth.name}'s task management` : 'All assigned work'}</h2>
        </div>
        <span>{tasks.length} tasks</span>
      </div>

      <div className="stats compact-stats">
        {stats.map(([label, value]) => (
          <article className="stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <article className="panel graph-panel">
          <div className="section-heading">
            <h2>Status graph</h2>
            <span>By task state</span>
          </div>
          <div className="bar-chart" aria-label="Task status graph">
            {statusCounts.map(item => {
              const height = Math.max(8, Math.round((item.value / maxValue) * 160));
              return (
                <div className="chart-column" key={item.status}>
                  <div className="chart-bar-wrap">
                    <span className={`chart-bar ${item.status.toLowerCase()}`} style={{ height: `${height}px` }} />
                  </div>
                  <strong>{item.value}</strong>
                  <span>{prettyStatus(item.status)}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel dashboard-tasks">
          <div className="section-heading">
            <h2>Task management</h2>
            <span>Quick update</span>
          </div>
          {!tasks.length && <Empty text="No tasks assigned yet." />}
          {tasks.slice(0, 6).map(task => (
            <div className="dashboard-task" key={task.id}>
              <div>
                <h3>{task.title}</h3>
                <p>{task.projectName} - Due {task.dueDate}</p>
              </div>
              <select value={task.status} onChange={e => onStatus(task, e.target.value)}>
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}

function ProjectForm({ form, setForm, users, isManager, onSubmit }) {
  function toggleMember(id) {
    setForm({
      ...form,
      memberIds: form.memberIds.includes(id) ? form.memberIds.filter(item => item !== id) : [...form.memberIds, id]
    });
  }
  return (
    <form className="panel" onSubmit={onSubmit}>
      <h2>New project</h2>
      <Field label="Project name"><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Description"><textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
      <Field label="Due date"><input required type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></Field>
      {isManager && (
        <div className="member-list">
          {users.map(user => (
            <label key={user.id}>
              <input type="checkbox" checked={form.memberIds.includes(user.id)} onChange={() => toggleMember(user.id)} />
              <span>{user.name}</span>
              <RoleBadge role={user.role} small />
            </label>
          ))}
          {!users.length && <p className="helper-text">No other users are available yet.</p>}
        </div>
      )}
      <button className="primary">Add project</button>
    </form>
  );
}

function TaskForm({ form, setForm, projects, users, onSubmit }) {
  return (
    <form className="panel" onSubmit={onSubmit}>
      <h2>New task</h2>
      <Field label="Title"><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
      <Field label="Details"><textarea required value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} /></Field>
      <div className="two-col">
        <Field label="Project">
          <select required value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
            <option value="">Select</option>
            {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </Field>
        <Field label="Assignee">
          <select value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })}>
            <option value="">Unassigned</option>
            {users.map(user => <option key={user.id} value={user.id}>{user.name} - {user.role}</option>)}
          </select>
        </Field>
      </div>
      <div className="two-col">
        <Field label="Status">
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="DONE">Done</option>
          </select>
        </Field>
        <Field label="Due date"><input required type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></Field>
      </div>
      <button className="primary" disabled={!projects.length}>Add task</button>
    </form>
  );
}

function ProjectList({ projects }) {
  return (
    <section className="panel list-panel">
      <h2>Projects</h2>
      {!projects.length && <Empty text="No projects yet." />}
      {projects.map(project => (
        <article className="item-card" key={project.id}>
          <div>
            <h3>{project.name}</h3>
            <p>{project.description}</p>
          </div>
          <div className="meta-row">
            <span>Due {project.dueDate}</span>
            <span>{project.members.length} members</span>
          </div>
        </article>
      ))}
    </section>
  );
}

function TaskList({ tasks, onStatus }) {
  return (
    <section className="panel list-panel">
      <h2>Tasks</h2>
      {!tasks.length && <Empty text="No tasks yet." />}
      {tasks.map(task => (
        <article className="item-card" key={task.id}>
          <div className="task-title">
            <h3>{task.title}</h3>
            <span className={`badge ${task.status.toLowerCase()}`}>{prettyStatus(task.status)}</span>
          </div>
          <p>{task.details}</p>
          <div className="meta-row">
            <span>{task.projectName}</span>
            <span>{task.assignee ? task.assignee.name : 'Unassigned'}</span>
            <span>Due {task.dueDate}</span>
          </div>
          <select value={task.status} onChange={e => onStatus(task, e.target.value)}>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="DONE">Done</option>
          </select>
        </article>
      ))}
    </section>
  );
}

function AdminUsers({ users }) {
  return (
    <section className="panel admin-panel">
      <div className="section-heading">
        <h2>Admin user access</h2>
        <span>Manager-only URL: /api/users</span>
      </div>
      <div className="user-table">
        {users.map(user => (
          <div className="user-row" key={user.id}>
            <span>{user.name}</span>
            <span>{user.email}</span>
            <RoleBadge role={user.role} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}

function Loading() {
  return <section className="loading"><span /> Loading workspace...</section>;
}

function Empty({ text }) {
  return <p className="empty">{text}</p>;
}

function RoleBadge({ role, small = false }) {
  return <small className={`role-badge ${role?.toLowerCase()} ${small ? 'small' : ''}`}>{prettyRole(role)}</small>;
}

async function request(path, options = {}, token) {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;
  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed');
    error.details = data;
    throw error;
  }
  return data;
}

function readError(error) {
  if (!error.details) return error.message;
  if (error.details.message) return error.details.message;
  return Object.values(error.details).join(', ');
}

function prettyStatus(status) {
  return status.replace('_', ' ').toLowerCase();
}

function prettyRole(role) {
  if (role === 'ADMIN') return 'project manager';
  if (role === 'MEMBER') return 'developer';
  return role?.replace('_', ' ').toLowerCase() || '';
}

createRoot(document.getElementById('root')).render(<App />);
