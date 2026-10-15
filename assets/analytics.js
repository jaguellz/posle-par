'use strict';
(() => {
  const w = window, d = document, config = w.AFTER_CLASS_ANALYTICS;
  if (!config || w.__afterClassAnalyticsInitialized || location.hostname !== config.hostname || !location.pathname.startsWith(config.pathPrefix)) return;
  w.__afterClassAnalyticsInitialized = true;
  // Isolate providers: an unavailable/blocked SDK must never stop a study tool.
  function safely(action) { try { action(); } catch { /* Analytics is optional. */ } }
  function loadScript(id, src) {
    if (d.getElementById(id)) return;
    const script = d.createElement('script');
    script.id = id; script.async = true; script.src = src;
    d.head.appendChild(script);
  }
  if (config.liveinternet.enabled) safely(() => {
    const image = d.getElementById('licnt17D0');
    if (!image) return;
    const s = w.screen;
    image.src = 'https://counter.yadro.ru/hit?t52.14;r' + escape(d.referrer) +
      ((typeof s === 'undefined') ? '' : ';s' + s.width + '*' + s.height + '*' + (s.colorDepth ? s.colorDepth : s.pixelDepth)) +
      ';u' + escape(d.URL) + ';h' + escape(d.title.substring(0, 150)) + ';' + Math.random();
  });
  const goals = Object.freeze({ timer_start: 'timerStart', plan_download: 'planDownload', checklist_complete: 'checklistComplete' });
  if (config.myTracker.enabled) {
    safely(() => {
      w._tmr = w._tmr || [];
      w._tmr.push({ id: config.myTracker.counterId, type: 'pageView', start: Date.now() });
      loadScript('tmr-code', 'https://top-fwz1.mail.ru/js/code.js');
    });
    w.addEventListener('afterclass:analytics', event => {
      const name = event.detail && event.detail.name;
      if (!Object.prototype.hasOwnProperty.call(goals, name)) return;
      safely(() => {
        w._tmr = w._tmr || [];
        w._tmr.push({ id: config.myTracker.counterId, type: 'reachGoal', goal: goals[name] });
      });
    });
  }
  if (config.sberAds.enabled) safely(() => {
    const pending = [];
    let counter = null;
    w.addEventListener('afterclass:analytics', event => {
      const name = event.detail && event.detail.name;
      if (!Object.prototype.hasOwnProperty.call(goals, name)) return;
      if (counter) safely(() => counter.trackEvent(goals[name]));
      else if (pending.length < 100) pending.push(goals[name]);
    });
    w._top100q = w._top100q || [];
    w._top100q.push(function () {
      safely(() => {
        counter = w.top100Counter = new w.top100({ project: config.sberAds.counterId });
        pending.splice(0).forEach(name => safely(() => counter.trackEvent(name)));
      });
    });
    loadScript('top100-code', 'https://st.top100.ru/top100/top100.js');
  });
})();
