import { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../api/axiosInstance';
import socket from '../api/socket';
import QRPanel from '../components/QRPanel';
import LiveStats from '../components/LiveStats';
import SearchFilterBar from '../components/SearchFilterBar';
import ParticipantsTable from '../components/ParticipantsTable';

export default function AdminDashboard() {
  const [workshops, setWorkshops] = useState([]);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');

  const [session, setSession] = useState(null); // { sessionId, workshopTitle, refreshMs, ... }
  const [sessionEnded, setSessionEnded] = useState(false);

  const [qr, setQr] = useState(null);
  const [stats, setStats] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [justMarkedId, setJustMarkedId] = useState(null);

  const [filters, setFilters] = useState({ search: '', department: '', status: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // -- load workshop list for the selector --
  useEffect(() => {
    api
      .get('/workshops')
      .then((res) => setWorkshops(res.data.workshops || []))
      .catch(() => setError('Could not load workshops. Is the backend running and seeded?'));
  }, []);

  // -- socket wiring, scoped to the active session --
  useEffect(() => {
    if (!session) return undefined;

    socket.connect();
    socket.emit('join:session', { sessionId: session.sessionId });

    const onQrNew = (payload) => {
      if (payload.sessionId !== session.sessionId) return;
      setQr(payload);
    };

    const onAttendanceUpdate = (payload) => {
      if (payload.sessionId !== session.sessionId) return;
      setStats({
        totalRegistered: payload.totalRegistered,
        present: payload.present,
        remaining: payload.remaining,
        percentage: payload.percentage,
      });
      setParticipants((prev) =>
        prev.map((p) =>
          p.studentId === payload.latest.studentId
            ? { ...p, status: 'present', markedAt: payload.latest.markedAt }
            : p
        )
      );
      setJustMarkedId(payload.latest.studentId);
      setTimeout(() => setJustMarkedId(null), 1500);
    };

    const onSessionEnded = (payload) => {
      if (payload.sessionId !== session.sessionId) return;
      setSessionEnded(true);
      setQr(null);
    };

    socket.on('qr:new', onQrNew);
    socket.on('attendance:update', onAttendanceUpdate);
    socket.on('session:ended', onSessionEnded);

    return () => {
      socket.emit('leave:session', { sessionId: session.sessionId });
      socket.off('qr:new', onQrNew);
      socket.off('attendance:update', onAttendanceUpdate);
      socket.off('session:ended', onSessionEnded);
      socket.disconnect();
    };
  }, [session]);

  const loadDashboard = useCallback((sessionId) => {
    return api.get(`/sessions/${sessionId}/dashboard`).then((res) => {
      setStats(res.data.stats);
      setParticipants(res.data.participants);
    });
  }, []);

  async function handleStart() {
    if (!selectedWorkshopId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/sessions/start', { workshopId: selectedWorkshopId });
      setSession(res.data);
      setSessionEnded(false);
      await loadDashboard(res.data.sessionId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start the session');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnd() {
    if (!session) return;
    try {
      await api.post(`/sessions/${session.sessionId}/end`);
      setSessionEnded(true);
      setQr(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not end the session');
    }
  }

  function handleReset() {
    setSession(null);
    setSessionEnded(false);
    setQr(null);
    setStats(null);
    setParticipants([]);
    setFilters({ search: '', department: '', status: '' });
  }

  const departments = useMemo(
    () => [...new Set(participants.map((p) => p.department).filter(Boolean))].sort(),
    [participants]
  );

  const filteredParticipants = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return participants.filter((p) => {
      if (term) {
        const hit =
          p.name?.toLowerCase().includes(term) ||
          p.usn?.toLowerCase().includes(term) ||
          p.email?.toLowerCase().includes(term);
        if (!hit) return false;
      }
      if (filters.department && p.department !== filters.department) return false;
      if (filters.status && p.status !== filters.status) return false;
      return true;
    });
  }, [participants, filters]);

  return (
    <div className="admin-console">
      <header className="admin-console__header">
        <div>
          <p className="eyebrow">Attendance Module</p>
          <h1 className="admin-console__title">Gate Console</h1>
        </div>

        <div className="admin-console__controls">
          {!session || sessionEnded ? (
            <>
              <select
                value={selectedWorkshopId}
                onChange={(e) => setSelectedWorkshopId(e.target.value)}
                disabled={session && !sessionEnded}
              >
                <option value="">Select a workshop…</option>
                {workshops.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.title}
                  </option>
                ))}
              </select>
              {sessionEnded ? (
                <button className="btn" onClick={handleReset}>
                  Start another session
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleStart}
                  disabled={!selectedWorkshopId || loading}
                >
                  {loading ? 'Starting…' : 'Start Attendance'}
                </button>
              )}
            </>
          ) : (
            <>
              <span className="pill live">{session.workshopTitle}</span>
              <button className="btn btn-danger" onClick={handleEnd}>
                End Attendance
              </button>
            </>
          )}
        </div>
      </header>

      {error && <div className="admin-console__error">{error}</div>}

      {session && (
        <div className="admin-console__body">
          <section className="admin-console__qr-column">
            <div className="card">
              <QRPanel qr={qr} sessionEnded={sessionEnded} />
            </div>
            {stats && <LiveStats stats={stats} />}
          </section>

          <section className="admin-console__manifest-column">
            <div className="card">
              <SearchFilterBar filters={filters} onChange={setFilters} departments={departments} />
              <ParticipantsTable participants={filteredParticipants} justMarkedId={justMarkedId} />
            </div>
          </section>
        </div>
      )}

      {!session && !error && (
        <p className="admin-console__hint">
          Select a workshop above and click Start Attendance to open the gate.
        </p>
      )}
    </div>
  );
}
