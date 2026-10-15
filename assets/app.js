'use strict';
(() => {
  const allowedEvents = new Set(['timer_start', 'plan_download', 'checklist_complete']);
  // No user text, persistent event history, external requests or provider API guesses.
  function track(name) {
    if (allowedEvents.has(name)) window.dispatchEvent(new CustomEvent('afterclass:analytics', { detail: { name, page: location.pathname } }));
  }
  window.afterClassTrack = track;
  let storageFailed = false;
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { storageFailed = true; return fallback; } }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { storageFailed = true; return false; } }
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    document.querySelectorAll('[data-category]').forEach(article => { article.hidden = button.dataset.filter !== 'all' && article.dataset.category !== button.dataset.filter; if (!article.hidden) count++; });
    document.getElementById('filter-status').textContent = `Показано заметок: ${count}`;
  }));
  if (document.getElementById('clock')) {
    let duration = 25 * 60, remaining = duration, end = 0, running = false, tick = null;
    const clock = document.getElementById('clock'), toggle = document.getElementById('timer-toggle'), status = document.getElementById('timer-status');
    function render() { const minutes = Math.floor(remaining / 60), seconds = remaining % 60; clock.textContent = `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`; clock.setAttribute('aria-label', `Осталось: ${minutes} минут ${seconds} секунд`); document.title = `${clock.textContent} — После пар`; }
    function stop() { running = false; clearInterval(tick); tick = null; }
    function update() { remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000)); render(); if (remaining === 0) { stop(); toggle.textContent = 'Ещё раз'; status.textContent = 'Отрезок завершён. Сохрани результат и выбери следующий шаг.'; } }
    toggle.addEventListener('click', () => {
      if (running) { update(); stop(); toggle.textContent = remaining ? 'Продолжить' : 'Ещё раз'; status.textContent = 'Пауза. Возвращайся, когда будешь готов.'; }
      else { if (!remaining) remaining = duration; end = Date.now() + remaining * 1000; running = true; toggle.textContent = 'Пауза'; status.textContent = duration === 25 * 60 ? 'Время для одной задачи.' : 'Небольшой перерыв. Дай себе отдохнуть.'; track('timer_start'); tick = setInterval(update, 250); render(); }
    });
    function reset() { stop(); remaining = duration; toggle.textContent = 'Начать'; status.textContent = 'Можно начинать. Всё получится постепенно.'; render(); }
    document.getElementById('timer-reset').addEventListener('click', reset);
    document.querySelectorAll('[data-minutes]').forEach(button => button.addEventListener('click', () => { duration = Number(button.dataset.minutes) * 60; document.querySelectorAll('[data-minutes]').forEach(item => item.setAttribute('aria-pressed', String(item === button))); reset(); }));
    document.addEventListener('visibilitychange', () => { if (running) update(); });
    render();
  }
  if (document.getElementById('task-form')) {
    const key = 'afterclass.plan.v1', list = document.getElementById('task-list'), status = document.getElementById('plan-status');
    let tasks = read(key, []);
    if (!Array.isArray(tasks)) tasks = [];
    tasks = tasks.filter(t => t && typeof t.text === 'string' && typeof t.done === 'boolean').map(t => ({text:t.text.slice(0,160),done:t.done}));
    function render() {
      list.replaceChildren();
      tasks.forEach((task,index) => {
        const row = document.createElement('li'), label = document.createElement('label'), check = document.createElement('input'), text = document.createElement('span'), remove = document.createElement('button');
        check.type = 'checkbox'; check.checked = task.done; text.textContent = task.text; remove.type = 'button'; remove.className = 'delete-task'; remove.textContent = '×'; remove.setAttribute('aria-label', `Удалить задачу: ${task.text}`);
        check.addEventListener('change', () => { tasks[index].done = check.checked; persist(); });
        remove.addEventListener('click', () => { tasks.splice(index,1); persist(); render(); const next = list.querySelectorAll('.delete-task')[Math.min(index,tasks.length-1)]; (next || document.getElementById('task-input')).focus(); });
        label.append(check,text); row.append(label,remove); list.append(row);
      });
      document.getElementById('empty-plan').hidden = tasks.length > 0;
      document.getElementById('download-plan').disabled = tasks.length === 0;
    }
    function message() { status.textContent = storageFailed ? 'Браузер не разрешает сохранение. Скачай план до закрытия страницы.' : `Выполнено ${tasks.filter(t=>t.done).length} из ${tasks.length}. План сохраняется в этом браузере.`; }
    function persist() { save(key,tasks); message(); }
    document.getElementById('task-form').addEventListener('submit', event => { event.preventDefault(); const input = document.getElementById('task-input'), text = input.value.trim(); if (!text) { input.setCustomValidity('Напиши задачу, а не только пробелы.'); input.reportValidity(); return; } tasks.push({text,done:false}); input.value = ''; persist(); render(); input.focus(); });
    document.getElementById('task-input').addEventListener('input', event => event.target.setCustomValidity(''));
    document.getElementById('download-plan').addEventListener('click', () => { if (!tasks.length) return; const text = `ПОСЛЕ ПАР — МОЙ ПЛАН\n\n${tasks.map(t=>`${t.done?'[x]':'[ ]'} ${t.text}`).join('\n')}\n`; const url = URL.createObjectURL(new Blob(['\uFEFF',text],{type:'text/plain;charset=utf-8'})), anchor = document.createElement('a'); anchor.href=url; anchor.download='posle-par-plan.txt'; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000); track('plan_download'); });
    // Probe write access too: some browsers allow reads but reject writes.
    save(key,tasks); render(); message();
  }
  if (document.getElementById('check-progress')) {
    const key = 'afterclass.checklist.v1', boxes = [...document.querySelectorAll('[data-check]')], saved = read(key,[]);
    boxes.forEach((box,i) => { box.checked = Array.isArray(saved) && saved[i] === true; });
    let wasComplete = boxes.every(box=>box.checked);
    function update(emit) { const count = boxes.filter(box=>box.checked).length; document.getElementById('check-count').textContent=`${count} из ${boxes.length}`; document.getElementById('check-progress').value=count; if (emit) save(key,boxes.map(box=>box.checked)); document.getElementById('check-status').textContent = (count===boxes.length ? 'Всё проверено. Можно выдохнуть.' : 'Не спеши: каждый проверенный пункт делает сдачу спокойнее.') + (storageFailed ? ' Отметки не сохранятся после закрытия страницы.' : ''); if (emit && count===boxes.length && !wasComplete) track('checklist_complete'); wasComplete=count===boxes.length; }
    boxes.forEach(box=>box.addEventListener('change',()=>update(true)));
    document.getElementById('reset-checks').addEventListener('click',()=>{ boxes.forEach(box=>box.checked=false); update(true); });
    save(key,boxes.map(box=>box.checked)); update(false);
  }
})();
