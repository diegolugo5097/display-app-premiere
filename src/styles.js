const styles = {
  screen: {
    width: "100vw",
    height: "100vh",
    backgroundColor: "#000",
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
    position: "relative",
    overflow: "hidden",
  },

  fullImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "brightness(0.9) contrast(1.05)",
  },

  placeholder: {
    position: "absolute",
    inset: 0,
    color: "#888",
    fontSize: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  /* HUD ROOT: tamaño base 1920x1080 */
  hudRoot: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "1920px",
    height: "1080px",
    pointerEvents: "none",
    color: "#fff",
  },

  /* ================= BIO PANEL (arriba izquierda) ================= */
  bioPanelCombined: {
    position: "absolute",
    left: "32px",
    top: "32px",
    width: "360px",
    backgroundColor: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "10px",
    padding: "16px 16px 20px",
    backdropFilter: "blur(6px)",
    boxShadow: "0 0 40px rgba(0,0,0,.8)",
    textTransform: "uppercase",
    letterSpacing: ".12em",
    lineHeight: 1.4,
    fontSize: "12px",
    pointerEvents: "none",
  },

  bioHeader: {
    marginBottom: "12px",
    display: "grid",
    rowGap: "8px",
    fontWeight: 700,
  },

  bioTitleTop: {
    display: "grid",
    rowGap: "4px",
    lineHeight: 1.2,
  },

  bioName: {
    color: "#fff",
    textShadow: "0 0 8px rgba(255,255,255,.4)",
    fontSize: "16px",
    fontWeight: 700,
    letterSpacing: ".1em",
  },

  bioTitleSection: {
    fontWeight: 700,
    color: "#fff",
    textShadow: "0 0 8px rgba(255,255,255,.3)",
    fontSize: "11px",
    letterSpacing: ".2em",
  },

  bioGrid: {
    display: "grid",
    rowGap: "8px",
  },

  bioRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    columnGap: "12px",
    alignItems: "start",
  },

  bioLabel: {
    color: "#94a3b8",
    fontWeight: 600,
    fontSize: "11px",
    letterSpacing: ".12em",
    lineHeight: 1.3,
  },

  bioValue: {
    fontWeight: 700,
    fontSize: "12px",
    textAlign: "right",
    color: "#fff",
    lineHeight: 1.3,
    textShadow: "0 0 8px rgba(255,255,255,.4)",
    letterSpacing: ".08em",
  },

  /* ================= TOP RIGHT GRAPH PANEL ================= */
  topRightBlock: {
    position: "absolute",
    top: "32px",
    right: "32px",
    width: "300px",
    backgroundColor: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "10px",
    padding: "16px",
    backdropFilter: "blur(6px)",
    boxShadow: "0 0 40px rgba(0,0,0,.8)",
    textTransform: "uppercase",
    letterSpacing: ".12em",
    lineHeight: 1.4,
    fontWeight: 600,
    fontSize: "12px",
    color: "#fff",
    pointerEvents: "none",
  },

  radiationGraphBox: {
    position: "relative",
    backgroundColor: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: "8px",
    padding: "12px 12px 20px",
    overflow: "hidden",
    minHeight: "100px",
    boxShadow: "0 0 30px rgba(0,0,0,.7)",
  },

  radiationTrack: {
    width: "200%",
    height: "40px",
    display: "flex",
    animation: "radMove 2s linear infinite",
  },

  radiationWave: {
    width: "50%",
    height: "40px",
  },

  radiationLegend: {
    position: "absolute",
    right: "12px",
    bottom: "12px",
    fontSize: "10px",
    lineHeight: 1.3,
    textAlign: "right",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: ".15em",
    textShadow: "0 0 8px rgba(255,255,255,.45)",
  },

  radRow: {
    display: "flex",
    justifyContent: "flex-end",
    columnGap: "8px",
  },

  radLabel: {
    color: "#94a3b8",
    fontWeight: 600,
  },

  radValue: {
    fontWeight: 700,
  },

  /* ================= ECG PANEL (bottom left) ================= */
  ecgContainer: {
    position: "absolute",
    left: "32px",
    bottom: "32px",
    width: "480px",
    height: "160px",
    background: "rgba(0,0,0,0.45)",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: "10px",
    overflow: "hidden",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "stretch",
    justifyContent: "flex-start",
    padding: "16px",
    boxShadow: "0 0 40px rgba(0,0,0,.8)",
    pointerEvents: "none",
  },

  ecgWaveTrack: {
    width: "200%",
    height: "100%",
    display: "flex",
    animation: "ecgMove 1.2s linear infinite",
  },

  ecgWave: {
    width: "50%",
    height: "100%",
  },

  ecgReadout: {
    position: "absolute",
    right: "16px",
    top: "16px",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: ".12em",
    lineHeight: 1.4,
    textAlign: "right",
    color: "#fff",
    textShadow: "0 0 10px rgba(255,255,255,.4)",
  },

  readoutRow: {
    display: "flex",
    justifyContent: "flex-end",
    columnGap: "8px",
  },

  readoutLabel: {
    color: "#94a3b8",
    fontWeight: 600,
  },

  readoutValue: {
    fontWeight: 700,
  },

  /* ================= RIGHT PANEL (story / notes) ================= */
  rightPanelWrapper: {
    position: "absolute",
    right: "32px",
    bottom: "32px",
    width: "360px",
    maxHeight: "320px",
    transform: "translateY(0)",
    transition: "all .4s ease",
    zIndex: 3,
    pointerEvents: "none",
  },

  rightPanelVisible: {
    opacity: 1,
    transform: "translateY(0)",
  },

  rightPanelHidden: {
    opacity: 0,
    transform: "translateY(30px)",
  },

  rightPanelCard: {
    backgroundColor: "rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: "10px",
    padding: "16px 16px 20px",
    color: "#fff",
    backdropFilter: "blur(6px)",
    boxShadow: "0 0 40px rgba(0,0,0,.8)",
    fontSize: "12px",
    lineHeight: 1.4,
    textTransform: "uppercase",
    letterSpacing: ".12em",
    pointerEvents: "auto",
    overflowY: "auto",
  },

  modalHeader: {
    textAlign: "center",
    marginBottom: "12px",
  },

  modalTitle: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: ".2em",
    textShadow: "0 0 8px rgba(255,255,255,.45)",
  },

  sectionHeader: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: ".2em",
    color: "#4ade80",
    textShadow: "0 0 8px rgba(74,222,128,.6)",
    marginBottom: "8px",
    marginTop: "12px",
  },

  storyTextSmall: {
    fontSize: "11px",
    color: "#d1d5db",
    lineHeight: 1.4,
    whiteSpace: "pre-line",
    textTransform: "none",
    letterSpacing: ".06em",
    textShadow: "0 0 6px rgba(255,255,255,.3)",
  },

  medNotesSmall: {
    fontSize: "11px",
    color: "#fff",
    lineHeight: 1.4,
    whiteSpace: "pre-line",
    textTransform: "none",
    letterSpacing: ".06em",
    textShadow: "0 0 6px rgba(255,255,255,.6)",
  },

  /* SCAN OVERLAY */
  scanOverlay: {
    position: "absolute",
    inset: 0,
    mixBlendMode: "screen",
    pointerEvents: "none",
  },

  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: "160px",
    filter: "blur(8px)",
  },
};

export default styles;
