const PresenceBar = ({ users, current }) => {
  const uniqueUsers = Array.from(new Map(users.map((u) => [u.userId, u])).values());
  if (uniqueUsers.length === 0) return null;

  const isDark = current?.primary === '#0a0a0a' || current?.text === '#f0f0f0';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
      {uniqueUsers.map((u) => (
        <div
          key={u.userId}
          title={`${u.name} is online`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.8rem',
            fontWeight: 500,
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            color: isDark ? '#c0c0c0' : '#555555',
            padding: '0.3rem 0.7rem',
            borderRadius: '20px',
            border: `1px solid ${isDark ? 'rgba(192,192,192,0.12)' : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#4ade80',
            display: 'inline-block',
            boxShadow: '0 0 6px rgba(74,222,128,0.7)',
            flexShrink: 0,
          }} />
          {u.name}
        </div>
      ))}
    </div>
  );
};

export default PresenceBar;
