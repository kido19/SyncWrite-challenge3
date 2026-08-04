const Toolbar = ({ editor, current }) => {
  if (!editor) return null;

  const isDarkBg = current?.primary === '#0a0a0a' || !current?.primary?.includes('fff');
  const activeBg = isDarkBg ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
  const inactiveBg = isDarkBg ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
  const activeColor = isDarkBg ? '#f0f0f0' : '#111111';
  const inactiveColor = current?.textSecondary || '#888888';
  const borderActive = isDarkBg ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const borderInactive = current?.border || 'rgba(192,192,192,0.15)';

  const btn = (isActive) => ({
    padding: '0.4rem 0.7rem',
    border: `1px solid ${isActive ? borderActive : borderInactive}`,
    borderRadius: '7px',
    background: isActive ? activeBg : inactiveBg,
    color: isActive ? activeColor : inactiveColor,
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 600,
    transition: 'all 0.15s ease',
    minWidth: '34px',
    textAlign: 'center',
  });

  const tools = [
    { label: 'H1', active: editor.isActive('heading', { level: 1 }), action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'H2', active: editor.isActive('heading', { level: 2 }), action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'B', active: editor.isActive('bold'), action: () => editor.chain().focus().toggleBold().run(), style: { fontWeight: 900 } },
    { label: 'I', active: editor.isActive('italic'), action: () => editor.chain().focus().toggleItalic().run(), style: { fontStyle: 'italic' } },
    { label: 'U', active: editor.isActive('underline'), action: () => editor.chain().focus().toggleUnderline().run(), style: { textDecoration: 'underline' } },
  ];

  const listTools = [
    { label: '≡ List', active: editor.isActive('bulletList'), action: () => editor.chain().focus().toggleBulletList().run() },
    { label: '1. List', active: editor.isActive('orderedList'), action: () => editor.chain().focus().toggleOrderedList().run() },
  ];

  const alignTools = [
    { label: '⟵', active: editor.isActive({ textAlign: 'left' }), action: () => editor.chain().focus().setTextAlign('left').run(), title: 'Align left' },
    { label: '≡', active: editor.isActive({ textAlign: 'center' }), action: () => editor.chain().focus().setTextAlign('center').run(), title: 'Align center' },
    { label: '⟶', active: editor.isActive({ textAlign: 'right' }), action: () => editor.chain().focus().setTextAlign('right').run(), title: 'Align right' },
  ];

  const divider = (
    <div style={{ width: '1px', height: '20px', background: borderInactive, margin: '0 0.25rem', alignSelf: 'center', flexShrink: 0 }} />
  );

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
      {tools.map((t) => (
        <button key={t.label} style={{ ...btn(t.active), ...(t.style || {}) }} onClick={t.action}>{t.label}</button>
      ))}
      {divider}
      {listTools.map((t) => (
        <button key={t.label} style={btn(t.active)} onClick={t.action}>{t.label}</button>
      ))}
      {divider}
      {alignTools.map((t) => (
        <button key={t.label} style={btn(t.active)} onClick={t.action} title={t.title}>{t.label}</button>
      ))}
      {divider}
      <button
        style={btn(editor.isActive('link'))}
        onClick={() => {
          const url = window.prompt('Enter URL:');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
      >
        Link
      </button>
    </div>
  );
};

export default Toolbar;
