import React, { useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';

// MISMO servidor socket del panel
const socket = io('https://panel-server-premire.onrender.com', {
  transports: ['websocket'],
});


const AudioContextClass = window.AudioContext || window.webkitAudioContext;
export const globalAudioCtx = new AudioContextClass();



/* ================== ASSETS por proxy /media (sin CORS) ================== */
/**
 * Normaliza cualquier url recibida por socket:
 * - Quita "public/" o "/public/" si viene así.
 * - Si llega absoluta (http/https), solo conserva la ruta (/ALIEN.mp4).
 * - Asegura "/" inicial y la monta sobre el prefijo /media (proxy dev/prod).
 * - Codifica espacios/tildes sin romper la ruta.
 */
function normalizeAssetUrl(raw) {
  let url = (raw || '').trim();
  if (!url) return '';

  // Limpia prefijo "public/"
  url = url.replace(/^\/?public\//i, '');

  // Si viene absoluta (http/https), extrae solo la ruta (/ALIEN.mp4)
  const abs = url.match(/^https?:\/\/[^/]+(\/.*)$/i);
  if (abs) url = abs[1];

  // Asegura slash inicial y antepone el prefijo del proxy
  if (!url.startsWith('/')) url = `/${url}`;
  return `/media${encodeURI(url)}`;
}

function App() {
  // Estado que llega desde control-app
  const [hero, setHero] = useState({
    imageUrl: '',
    videoUrl: '',
    name: '',
    debutYear: '',
    currentAge: '',
    story: '',
    powers: '',
    mediaHistory: '',
    medical: {
      status: '',
      heartRate: '',
      radiationLevel: '',
      threatLevel: '',
      notes: ''
    }
  });

  const [infoVisible, setInfoVisible] = useState(false);
  const [animateInfo, setAnimateInfo] = useState(false);

  // dangerMode = UI roja si amenaza es EXTREMO
  const dangerMode = useMemo(() => {
    return (hero.medical.threatLevel || '').toUpperCase() === 'EXTREMO';
  }, [hero.medical.threatLevel]);

  const accentColor = dangerMode ? '#ef4444' : '#4ade80';
  const accentGlow = dangerMode ? 'rgba(239,68,68,.5)' : 'rgba(74,222,128,.5)';


  useEffect(() => {
    const unlockAudio = () => {
      if (globalAudioCtx.state === "suspended") {
        globalAudioCtx.resume().then(() => {
          console.log("🔊 Audio global desbloqueado.");
        });
      }
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    };

    document.addEventListener("click", unlockAudio);
    document.addEventListener("keydown", unlockAudio);

    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    };
  }, []);


  useEffect(() => {
    const onSetHero = ({ hero: h }) => {
      const imageUrl = normalizeAssetUrl(h?.imageUrl || '');
      const videoUrl = normalizeAssetUrl(h?.videoUrl || '');

      setHero({
        imageUrl,
        videoUrl,
        name: h?.name || '',
        debutYear: h?.debutYear || '',
        currentAge: h?.currentAge || '',
        story: h?.story || '',
        powers: h?.powers || '',
        mediaHistory: h?.mediaHistory || '',
        medical: {
          status: h?.medical?.status || '',
          heartRate: h?.medical?.heartRate || '',
          radiationLevel: h?.medical?.radiationLevel || '',
          threatLevel: h?.medical?.threatLevel || '',
          notes: h?.medical?.notes || ''
        }
      });

      // ✅ Pide al Service Worker que precachee video + imagen
      if ('serviceWorker' in navigator) {
        const urls = [];
        if (h?.videoUrl) urls.push(normalizeAssetUrl(h.videoUrl));
        if (h?.imageUrl) urls.push(normalizeAssetUrl(h.imageUrl));
        if (urls.length) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.active?.postMessage({
              type: 'CACHE_URLS',
              payload: urls,
            });
          });
        }
      }
    };

    const onShowInfo = () => {
      setInfoVisible(true);
      setAnimateInfo(false);
      setTimeout(() => setAnimateInfo(true), 10);
    };

    const onHideInfo = () => {
      setAnimateInfo(false);
      setTimeout(() => setInfoVisible(false), 300);
    };

    socket.on('set_hero', onSetHero);
    socket.on('show_info', onShowInfo);
    socket.on('hide_info', onHideInfo);

    return () => {
      socket.off('set_hero', onSetHero);
      socket.off('show_info', onShowInfo);
      socket.off('hide_info', onHideInfo);
    };
  }, []);


  useEffect(() => {
    const onPlaySound = async ({ type }) => {
      let file = "";
      if (type === "modal_open") file = "/modal-open.mp3";
      else if (type === "modal_close") file = "/modal-close.mp3";
      else return;

      try {
        // Usa el contexto global (ya desbloqueado)
        const res = await fetch(file);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = await globalAudioCtx.decodeAudioData(arrayBuffer);

        const source = globalAudioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(globalAudioCtx.destination);
        source.start(0);
      } catch (err) {
        console.warn("No se pudo reproducir sonido:", err);
      }
    };

    socket.on("play_sound", onPlaySound);
    return () => socket.off("play_sound", onPlaySound);
  }, []);


  useEffect(() => {
    const ambientSound = document.getElementById("ambientSound");
    const pulseSound = document.getElementById("pulseSound");

    // Intenta reproducir automáticamente
    const playAll = async () => {
      try {
        await ambientSound.play();
        await pulseSound.play();

        // 🔊 Activa volumen gradualmente
        setTimeout(() => {
          ambientSound.muted = false;
          pulseSound.muted = false;

          let v = 0;
          const fade = setInterval(() => {
            v += 0.02;
            ambientSound.volume = Math.min(v, 0.4);
            pulseSound.volume = Math.min(v * 0.6, 0.25);
            if (v >= 0.4) clearInterval(fade);
          }, 100);
        }, 800);
      } catch (err) {
        console.warn("El navegador bloqueó el autoplay, intentando fallback...");
        // Si lo bloquea, lo activa en el primer clic o toque
        const unlock = () => {
          ambientSound.play();
          pulseSound.play();
          document.removeEventListener("click", unlock);
        };
        document.addEventListener("click", unlock);
      }
    };

    playAll();

    return () => {
      ambientSound.pause();
      pulseSound.pause();
    };
  }, []);


  return (
    <div style={styles.screen}>
      {/* Animaciones globales de HUD con color dinámico */}
      <style>
        {`
        @keyframes hologramIn {
          0% { opacity: 0; transform: scale(0.8) translateY(40px); filter: blur(10px); }
          60% { opacity: 1; transform: scale(1.05) translateY(-4px); filter: blur(2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }

        @keyframes ecgMove { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px ${accentGlow}, 0 0 60px ${accentGlow}; }
          50% { box-shadow: 0 0 40px ${accentGlow}, 0 0 100px ${accentGlow}; }
        }

        @keyframes scanLine {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: .4; }
          50% { transform: translateY(100%); opacity: .15; }
          100% { transform: translateY(100%); opacity: 0; }
        }

        @keyframes radMove { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        `}
      </style>

      {/* Media fondo */}
      <HeroBackgroundMedia
        imageUrl={hero.imageUrl}
        videoUrl={hero.videoUrl}
        name={hero.name}
      />

      {/* HUD */}
      <HUDOverlay hero={hero} dangerMode={dangerMode} accentColor={accentColor} />

      {/* Panel derecho */}
      {infoVisible && (
        <RightInfoPanel hero={hero} accentColor={accentColor} animateIn={animateInfo} />
      )}

      {/* ECG */}
      <ECGPanel heartRate={hero.medical.heartRate} status={hero.medical.status} accentColor={accentColor} />
    </div>
  );
}




/* ---------------- MEDIA DE FONDO ---------------- */
function HeroBackgroundMedia({ imageUrl, videoUrl, name }) {
  if (videoUrl) {
    return (
      <video
        style={styles.fullVideo}
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        onError={(e) => console.warn('Video no cargó:', videoUrl, e)}
      />
    );
  }

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        style={styles.fullImage}
        crossOrigin="anonymous"
        onError={(e) => console.warn('Imagen no cargó:', imageUrl, e)}
      />
    );
  }

  return <div style={styles.placeholder}>Esperando héroe...</div>;
}

/* ---------------- SUBCOMPONENTES (HUD / ECG / PANEL) ---------------- */

function RadiationMiniGraph({ color }) {
  return (
    <div style={styles.radiationGraphBox}>
      <div style={styles.radiationTrack}>
        <svg style={styles.radiationWave} viewBox="0 0 200 40" preserveAspectRatio="none">
          <polyline fill="none" stroke={color} strokeWidth="2" points="
            0,30 10,28 20,32 30,18 40,22 50,10 60,12 70,8
            80,20 90,15 100,30 110,26 120,32 130,18 140,14
            150,20 160,9 170,12 180,8 190,15 200,12" />
        </svg>
        <svg style={styles.radiationWave} viewBox="0 0 200 40" preserveAspectRatio="none">
          <polyline fill="none" stroke={color} strokeWidth="2" points="
            0,30 10,28 20,32 30,18 40,22 50,10 60,12 70,8
            80,20 90,15 100,30 110,26 120,32 130,18 140,14
            150,20 160,9 170,12 180,8 190,15 200,12" />
        </svg>
      </div>
      <div style={styles.radiationLegend}>
        <div style={styles.radRow}><span style={styles.radLabel}>RAD LVL</span><span style={{ ...styles.radValue, color }}>VIVO</span></div>
        <div style={styles.radRow}><span style={styles.radLabel}>ESTADO</span><span style={{ ...styles.radValue, color }}>ESTABLE</span></div>
      </div>
    </div>
  );
}

function HUDOverlay({ hero, dangerMode, accentColor }) {
  return (
    <div style={styles.hudOverlay}>
      <div style={styles.scanOverlay}>
        <div
          style={{
            ...styles.scanLine,
            background: dangerMode
              ? 'linear-gradient(to bottom, rgba(239,68,68,0) 0%, rgba(239,68,68,.4) 50%, rgba(239,68,68,0) 100%)'
              : 'linear-gradient(to bottom, rgba(74,222,128,0) 0%, rgba(74,222,128,.4) 50%, rgba(74,222,128,0) 100%)',
            animation: 'scanLine 2.5s linear infinite',
          }}
        />
      </div>

      <audio id="ambientSound" src="/fondo-ambiental.mp3" loop />
      <audio id="pulseSound" src="/pulso-electronico.mp3" loop />

      <div style={{ ...styles.topRightBlock, boxShadow: `0 0 25px ${accentColor}44` }}>
        <div style={styles.hudLineRow}>
          <div style={styles.hudLabel}>AMENAZA</div>
          <div style={{ ...styles.hudValue, color: accentColor, textShadow: `0 0 8px ${accentColor}aa` }}>
            {hero.medical.threatLevel || '—'}
          </div>
        </div>
        <div style={styles.hudLineRow}>
          <div style={styles.hudLabel}>RADIACIÓN</div>
          <div style={styles.hudValue}>{hero.medical.radiationLevel || '—'}</div>
        </div>
        <div style={styles.hudLineRow}>
          <div style={styles.hudLabel}>ESTADO</div>
          <div style={styles.hudValue}>{hero.medical.status || '—'}</div>
        </div>
        <RadiationMiniGraph color={accentColor} />
      </div>

      <div style={{ ...styles.bioPanelCombined, boxShadow: `0 0 25px ${accentColor}44` }}>
        <div style={styles.bioHeader}>
          <div style={styles.bioTitleTop}>
            <div style={{ color: accentColor, textShadow: `0 0 8px ${accentColor}aa` }}>SUJETO</div>
            <div style={styles.bioName}>{hero.name || '—'}</div>
          </div>
          <div style={styles.bioTitleSection}>PERFIL / BIO</div>
        </div>

        <div style={styles.bioGrid}>
          <BioRow label="AMENAZA" value={hero.medical.threatLevel} accentColor={accentColor} />
          <BioRow label="RADIACIÓN" value={hero.medical.radiationLevel} />
          <BioRow label="CONDICIÓN" value={hero.medical.status} accentColor={accentColor} />
        </div>
      </div>
    </div>
  );
}

function ECGPanel({ heartRate, status, accentColor }) {
  return (
    <div style={{ ...styles.ecgContainer, border: `1px solid ${accentColor}55`, boxShadow: `0 0 20px ${accentColor}55 inset` }}>
      <div style={styles.ecgWaveTrack}>
        <ECGLine color={accentColor} />
        <ECGLine color={accentColor} />
      </div>
      <div style={styles.ecgReadout}>
        <div style={styles.readoutRow}><span style={styles.readoutLabel}>HR</span><span style={styles.readoutValue}>{heartRate || '—'}</span></div>
        <div style={styles.readoutRow}>
          <span style={styles.readoutLabel}>ESTADO</span>
          <span style={{ ...styles.readoutValue, color: accentColor, textShadow: `0 0 8px ${accentColor}aa` }}>{status || '—'}</span>
        </div>
      </div>
    </div>
  );
}

function RightInfoPanel({ hero, accentColor, animateIn }) {
  return (
    <div style={{ ...styles.rightPanelWrapper, ...(animateIn ? styles.rightPanelVisible : styles.rightPanelHidden) }}>
      <div style={{ ...styles.rightPanelCard, borderColor: `${accentColor}66`, boxShadow: `0 0 30px ${accentColor}66, 0 0 100px ${accentColor}22`, animation: 'hologramIn 0.8s ease-out, pulseGlow 2s infinite' }}>
        <div style={styles.modalHeader}>
          <span style={{ ...styles.modalTitle, color: accentColor, textShadow: `0 0 10px ${accentColor}aa` }}>FICHA MÉDICA</span>
        </div>

        <div style={{ ...styles.sectionHeader, color: accentColor, textShadow: `0 0 8px ${accentColor}aa` }}>HISTORIA CLÍNICA</div>
        <div style={styles.storyTextSmall}>{hero.story || 'Sin registros disponibles.'}</div>

        <div style={{ ...styles.sectionHeader, color: accentColor, textShadow: `0 0 8px ${accentColor}aa` }}>FICHA DE ARCHIVO</div>
        <InfoRowMini label="PRIMERA APARICIÓN" value={hero.debutYear ? `${hero.debutYear}` : '—'} />
        <InfoRowMini label="EDAD / ESTADO" value={hero.currentAge ? `${hero.currentAge} AÑOS` : '—'} />
        <InfoRowMini label="PODERES / HABILIDADES" value={hero.powers || '—'} />
        <InfoRowMini label="CINE / TV" value={hero.mediaHistory || '—'} />

        <div style={{ ...styles.sectionHeader, color: accentColor, textShadow: `0 0 8px ${accentColor}aa` }}>OBSERVACIONES</div>
        <div style={styles.medNotesSmall}>{hero.medical.notes || 'Sin observaciones.'}</div>
      </div>
    </div>
  );
}

/* ---------------- BLOQUES DE TEXTO ---------------- */

function InfoRowMini({ label, value }) {
  return (
    <div style={miniStyles.row}>
      <div style={miniStyles.label}>{label}:</div>
      <div style={miniStyles.value}>{value}</div>
    </div>
  );
}

const miniStyles = {
  row: { marginBottom: '.6rem', display: 'grid', gridTemplateColumns: '1fr', rowGap: '.25rem', textTransform: 'uppercase', letterSpacing: '.15em' },
  label: { fontSize: '.55rem', fontWeight: 700, color: '#94a3b8', lineHeight: 1.4 },
  value: { fontSize: '.6rem', fontWeight: 600, color: '#fff', lineHeight: 1.4, textShadow: '0 0 8px rgba(255,255,255,.3)', whiteSpace: 'pre-line' },
};

function BioRow({ label, value, accentColor }) {
  return (
    <div style={styles.bioRow}>
      <div style={styles.bioLabel}>{label}:</div>
      <div style={{ ...styles.bioValue, color: accentColor && value ? accentColor : '#fff', textShadow: accentColor && value ? `0 0 8px ${accentColor}aa` : '0 0 8px rgba(255,255,255,.2)' }}>
        {value || '—'}
      </div>
    </div>
  );
}

function ECGLine({ color }) {
  return (
    <svg style={styles.ecgWave} viewBox="0 0 200 40" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" points="
        0,20 20,20 30,5 40,35 50,20 70,20 80,10 90,30
        100,20 120,20 130,5 140,35 150,20 170,20 180,10 190,30 200,20" />
    </svg>
  );
}

/* ---------------- ESTILOS ---------------- */

const styles = {
  screen: { width: '100vw', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif', position: 'relative', overflow: 'hidden' },
  fullImage: { width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, filter: 'brightness(0.9) contrast(1.05)' },
  fullVideo: { width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, filter: 'brightness(0.9) contrast(1.05)', backgroundColor: '#000' },
  placeholder: { color: '#888', fontSize: '1rem', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  hudOverlay: { position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', color: '#fff' },
  scanOverlay: { position: 'absolute', inset: 0, mixBlendMode: 'screen', pointerEvents: 'none' },
  scanLine: { position: 'absolute', left: 0, right: 0, height: '15vh', filter: 'blur(8px)' },

  topRightBlock: { position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '.5rem', padding: '.6rem .8rem .8rem', minWidth: '200px', maxWidth: '220px', backdropFilter: 'blur(4px)', textTransform: 'uppercase', letterSpacing: '.12em', fontSize: '.6rem', lineHeight: 1.4, fontWeight: 600, boxShadow: '0 0 25px rgba(0,0,0,.8)' },

  hudLineRow: { display: 'flex', justifyContent: 'space-between', gap: '.5rem', marginBottom: '.4rem' },
  hudLabel: { color: '#94a3b8' },
  hudValue: { fontWeight: 700, color: '#fff', textShadow: '0 0 8px rgba(255,255,255,.3)' },

  radiationGraphBox: { position: 'relative', backgroundColor: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '.4rem', padding: '.5rem .5rem .75rem', overflow: 'hidden', boxShadow: '0 0 15px rgba(0,0,0,.8)' },
  radiationTrack: { width: '200%', height: '32px', display: 'flex', animation: 'radMove 2s linear infinite' },
  radiationWave: { width: '50%', height: '32px' },
  radiationLegend: { position: 'absolute', right: '.4rem', bottom: '.4rem', fontSize: '.5rem', lineHeight: 1.3, textAlign: 'right', color: '#fff', textTransform: 'uppercase', letterSpacing: '.15em', textShadow: '0 0 8px rgba(255,255,255,.4)' },
  radRow: { display: 'flex', justifyContent: 'flex-end', gap: '.4rem' },
  radLabel: { color: '#94a3b8', fontWeight: 600 },
  radValue: { fontWeight: 700 },

  bioPanelCombined: { position: 'absolute', top: '1rem', left: '1rem', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '.6rem', width: '240px', maxWidth: '60vw', padding: '.6rem .8rem .8rem', fontSize: '.6rem', lineHeight: 1.4, textTransform: 'uppercase', letterSpacing: '.12em', color: '#fff', backdropFilter: 'blur(4px)', boxShadow: '0 0 30px rgba(0,0,0,.8)' },
  bioHeader: { marginBottom: '.5rem', display: 'grid', gap: '.5rem' },
  bioTitleTop: { display: 'grid', gap: '.25rem', fontWeight: 700, lineHeight: 1.3 },
  bioName: { color: '#fff', textShadow: '0 0 8px rgba(255,255,255,.3)', fontSize: '.7rem' },
  bioTitleSection: { fontWeight: 700, color: '#fff', textShadow: '0 0 8px rgba(255,255,255,.2)', fontSize: '.6rem', letterSpacing: '.2em' },
  bioGrid: { display: 'grid', gap: '.5rem' },
  bioRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '.75rem', alignItems: 'start' },
  bioLabel: { color: '#94a3b8', fontWeight: 600, fontSize: '.6rem', letterSpacing: '.12em' },
  bioValue: { fontWeight: 700, fontSize: '.7rem', textAlign: 'right', color: '#fff', textShadow: '0 0 8px rgba(255,255,255,.2)' },

  ecgContainer: { position: 'absolute', bottom: '1rem', left: '1rem', width: '280px', height: '60px', background: 'rgba(0,0,0,0.45)', borderRadius: '.6rem', overflow: 'hidden', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start', padding: '.5rem .75rem', boxShadow: '0 0 30px rgba(0,0,0,.8)', pointerEvents: 'none' },
  ecgWaveTrack: { width: '200%', height: '100%', display: 'flex', animation: 'ecgMove 1.2s linear infinite' },
  ecgWave: { width: '50%', height: '100%' },
  ecgReadout: { position: 'absolute', right: '.5rem', top: '.5rem', fontSize: '.55rem', textTransform: 'uppercase', letterSpacing: '.12em', lineHeight: 1.3, textAlign: 'right', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,.4)' },
  readoutRow: { display: 'flex', justifyContent: 'flex-end', gap: '.4rem' },
  readoutLabel: { color: '#94a3b8', fontWeight: 600 },
  readoutValue: { fontWeight: 700, color: '#fff', textShadow: '0 0 8px rgba(255,255,255,.3)' },

  rightPanelWrapper: { position: 'absolute', right: '1rem', bottom: '1rem', width: '260px', maxHeight: '70vh', transform: 'translateY(0)', transition: 'all .4s ease', zIndex: 3, pointerEvents: 'none' },
  rightPanelVisible: { opacity: 1, transform: 'translateY(0)' },
  rightPanelHidden: { opacity: 0, transform: 'translateY(40px)' },
  rightPanelCard: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '.6rem', border: '1px solid rgba(255,255,255,0.2)', padding: '.8rem .9rem 1rem', color: '#fff', backdropFilter: 'blur(6px)', boxShadow: '0 0 30px rgba(0,0,0,.8)', fontSize: '.6rem', lineHeight: 1.4, textTransform: 'uppercase', letterSpacing: '.12em', pointerEvents: 'auto', overflowY: 'auto' },

  modalHeader: { textAlign: 'center', marginBottom: '.75rem' },
  modalTitle: { fontSize: '.6rem', fontWeight: 700, letterSpacing: '.2em' },
  sectionHeader: { fontSize: '.6rem', fontWeight: 700, letterSpacing: '.2em', color: '#4ade80', textShadow: '0 0 8px rgba(74,222,128,.6)', marginBottom: '.4rem', marginTop: '.5rem' },
  storyTextSmall: { fontSize: '.6rem', color: '#d1d5db', lineHeight: 1.4, whiteSpace: 'pre-line' },
  medNotesSmall: { fontSize: '.6rem', color: '#fff', lineHeight: 1.4, whiteSpace: 'pre-line' },
};

export default App;
