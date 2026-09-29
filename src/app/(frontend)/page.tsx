export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px',
        background: '#071c62',
        color: '#ffffff',
        textAlign: 'center',
        fontFamily: '"Segoe UI", Arial, sans-serif',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 'clamp(32px, 7vw, 72px)',
          lineHeight: 1.05,
          letterSpacing: '0.04em',
        }}
      >
        САЙТ НА РЕКОНСТРУКЦИИ
      </h1>
    </main>
  )
}
