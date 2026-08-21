export default function LiveStats({ stats }) {
  const { totalRegistered = 0, present = 0, remaining = 0, percentage = 0 } = stats || {};

  const items = [
    { label: 'Registered', value: totalRegistered },
    { label: 'Present', value: present, accent: true },
    { label: 'Remaining', value: remaining },
    { label: 'Turnout', value: `${percentage}%` },
  ];

  return (
    <div className="live-stats">
      {items.map((item) => (
        <div className="live-stats__item" key={item.label}>
          <span className={`live-stats__value ${item.accent ? 'live-stats__value--accent' : ''}`}>
            {item.value}
          </span>
          <span className="eyebrow">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
