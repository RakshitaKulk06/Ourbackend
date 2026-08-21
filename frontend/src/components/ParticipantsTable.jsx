function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ParticipantsTable({ participants, justMarkedId }) {
  if (!participants.length) {
    return <div className="table-empty">No participants match this view.</div>;
  }

  return (
    <table className="manifest-table">
      <thead>
        <tr>
          <th>Student</th>
          <th>USN</th>
          <th>Department</th>
          <th>Status</th>
          <th>Marked at</th>
        </tr>
      </thead>
      <tbody>
        {participants.map((p) => (
          <tr
            key={p.studentId}
            className={p.studentId === justMarkedId ? 'manifest-table__row--flash' : ''}
          >
            <td>{p.name}</td>
            <td className="mono">{p.usn}</td>
            <td>{p.department || '—'}</td>
            <td>
              <span className={`status-dot ${p.status}`} />
              {p.status === 'present' ? 'Present' : 'Absent'}
            </td>
            <td className="mono">{formatTime(p.markedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
