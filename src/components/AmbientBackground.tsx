export default function AmbientBackground() {
  return (
    <>
      <div id="c-dot" aria-hidden="true" />
      <div id="c-ring" aria-hidden="true" />

      <div
        id="glow"
        aria-hidden="true"
        style={{ transform: 'translate(calc(50vw - 450px),calc(50vh - 450px))' }}
      />

      <div id="grid-bg" aria-hidden="true" />

      <div
        className="blob"
        aria-hidden="true"
        style={{
          width: 750, height: 750,
          background: 'rgba(46,220,168,.07)',
          top: -220, right: -180,
          animation: 'blob1 24s ease-in-out infinite',
        }}
      />
      <div
        className="blob"
        aria-hidden="true"
        style={{
          width: 550, height: 550,
          background: 'rgba(240,145,90,.055)',
          bottom: '8%', left: -160,
          animation: 'blob2 30s ease-in-out infinite',
        }}
      />

      <canvas id="pts" aria-hidden="true" />
    </>
  );
}
