/* Options complémentaires : réinitialisation et timer configurable. */
(function () {
  const SETTINGS_KEY = 'ssiap3_timer_settings';
  let timerId = null;
  let remaining = 0;
  let running = false;

  const byId = id => document.getElementById(id);
  const readSettings = () => {
    try { return Object.assign({ enabled: false, minutes: 60 }, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); }
    catch (_) { return { enabled: false, minutes: 60 }; }
  };
  const writeSettings = s => localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  const format = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  function addControls() {
    const homeActions = document.querySelector('#home .actions');
    if (homeActions && !byId('resetAll')) {
      const reset = document.createElement('button');
      reset.id = 'resetAll'; reset.className = 'secondary'; reset.textContent = 'Réinitialiser le QCM';
      homeActions.appendChild(reset);
      reset.onclick = () => {
        if (confirm('Effacer toutes les réponses et recommencer depuis le début ?')) {
          localStorage.removeItem('ssiap3_answers'); localStorage.removeItem(SETTINGS_KEY);
          window.location.reload();
        }
      };
    }
    const home = byId('home');
    if (home && !byId('timerConfig')) {
      const box = document.createElement('div');
      box.id = 'timerConfig'; box.className = 'timer-config';
      const s = readSettings();
      box.innerHTML = `<label><input id="timerEnabled" type="checkbox" ${s.enabled ? 'checked' : ''}> Activer le timer</label>
        <label>Durée (minutes) <input id="timerMinutes" type="number" min="1" max="240" value="${s.minutes}"></label>
        <small>Le compte à rebours démarre au lancement et s’arrête automatiquement à la fin.</small>`;
      home.querySelector('.actions').after(box);
      byId('timerEnabled').onchange = saveConfig;
      byId('timerMinutes').onchange = saveConfig;
    }
    const toolbar = document.querySelector('#quiz .toolbar');
    if (toolbar && !byId('timerDisplay')) {
      const timer = document.createElement('span'); timer.id = 'timerDisplay'; timer.className = 'pill';
      timer.textContent = 'Timer désactivé'; toolbar.appendChild(timer);
      const pause = document.createElement('button'); pause.id = 'timerPause'; pause.className = 'secondary'; pause.textContent = 'Pause';
      toolbar.appendChild(pause); pause.onclick = () => { running ? pauseTimer() : resumeTimer(); };
    }
  }
  function saveConfig() {
    const minutes = Math.max(1, Math.min(240, Number(byId('timerMinutes').value) || 60));
    byId('timerMinutes').value = minutes;
    writeSettings({ enabled: byId('timerEnabled').checked, minutes });
  }
  function stopTimer() { clearInterval(timerId); timerId = null; running = false; }
  function draw() {
    const el = byId('timerDisplay'); if (!el) return;
    const s = readSettings();
    el.textContent = s.enabled ? `${running ? '⏱' : '⏸'} ${format(Math.max(0, remaining))}` : 'Timer désactivé';
    el.style.color = s.enabled && remaining <= 60 ? 'var(--red)' : '';
    const p = byId('timerPause'); if (p) p.textContent = running ? 'Pause' : 'Reprendre';
  }
  function startTimer() {
    addControls(); stopTimer();
    const s = readSettings(); if (!s.enabled) { draw(); return; }
    remaining = Math.max(60, Number(s.minutes) * 60); running = true; draw();
    timerId = setInterval(() => {
      if (!running) return;
      remaining--; draw();
      if (remaining <= 0) { stopTimer(); alert('Temps écoulé. Le QCM va être corrigé.'); if (typeof window.finish === 'function') window.finish(); }
    }, 1000);
  }
  function pauseTimer() { running = false; draw(); }
  function resumeTimer() { if (remaining > 0) { running = true; draw(); } }

  addControls();
  const start = byId('start'), resume = byId('resume'), restart = byId('restart'), quit = byId('quit'), next = byId('next');
  [start, resume, restart].forEach(btn => btn && btn.addEventListener('click', () => setTimeout(startTimer, 0)));
  quit && quit.addEventListener('click', stopTimer);
  next && next.addEventListener('click', () => setTimeout(() => { if (byId('result') && getComputedStyle(byId('result')).display !== 'none') stopTimer(); }, 0));
})();
