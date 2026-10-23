// The Assist — site behaviour. Every section renders and reads without this file.
(() => {
  document.documentElement.classList.add('js');
  const reducedQ = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = reducedQ.matches;

  // ---- Menu: a modal dialog (focus moves in, is trapped, and returns to the button) ----
  const menu = document.getElementById('menu');
  const opener = document.querySelector('[data-nav-toggle]');
  const closer = document.querySelector('[data-menu-close]');
  const main = document.getElementById('main');
  const focusables = () => [...menu.querySelectorAll('a[href], button:not([disabled])')];
  const setMenu = (open) => {
    opener.setAttribute('aria-expanded', String(open));
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => { menu.dataset.open = 'true'; });
      document.documentElement.style.overflow = 'hidden';
      main.inert = true; document.querySelector('footer').inert = true;
      setTimeout(() => menu.querySelector('nav a').focus(), reduced ? 0 : 120);
    } else {
      menu.dataset.open = 'false';
      document.documentElement.style.overflow = '';
      main.inert = false; document.querySelector('footer').inert = false;
      setTimeout(() => { if (menu.dataset.open !== 'true') menu.hidden = true; }, reduced ? 0 : 700);
      opener.focus({ preventScroll: true });
    }
  };
  opener.addEventListener('click', () => setMenu(opener.getAttribute('aria-expanded') !== 'true'));
  closer.addEventListener('click', () => setMenu(false));
  menu.addEventListener('click', (e) => { if (e.target.closest('nav a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (menu.dataset.open !== 'true') return;
    if (e.key === 'Escape') { e.preventDefault(); setMenu(false); return; }
    if (e.key === 'Tab') {
      const f = focusables(); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // ---- Brand clip: plays once when seen; reduced motion keeps the still ----
  document.querySelectorAll('[data-motion]').forEach((box) => {
    const video = box.querySelector('video');
    const status = box.querySelector('[data-motion-status]');
    const pause = box.querySelector('[data-motion-pause]');
    const replay = box.querySelector('[data-motion-replay]');
    let started = false, token = 0;
    const say = (t) => { status.textContent = t; };
    const still = (t) => { video.pause(); box.classList.remove('is-playing'); pause.hidden = true; replay.textContent = 'Replay'; say(t); };
    const play = async () => {
      const mine = ++token;
      if (video.preload === 'none') { video.preload = 'auto'; video.load(); }
      try { video.currentTime = 0; } catch {}
      video.muted = true;
      try {
        await video.play();
        if (mine !== token) return;
        box.classList.add('is-playing'); pause.hidden = false; pause.textContent = 'Pause'; say('Playing: six seconds, no sound.');
      } catch { if (mine === token) still('Select Play to watch.'); }
    };
    replay.addEventListener('click', () => { started = true; play(); });
    pause.addEventListener('click', async () => {
      if (video.paused) { try { await video.play(); pause.textContent = 'Pause'; say('Playing.'); } catch { still('Select Play to watch.'); } }
      else { video.pause(); pause.textContent = 'Resume'; say('Paused.'); }
    });
    video.addEventListener('ended', () => still('The Assist. One pass, one assist.'));
    video.addEventListener('error', () => still('Showing the still logo.'));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !started) { started = true; if (reducedQ.matches) still('Reduced motion is on, so the still logo is shown. Select Play to watch.'); else play(); }
        else if (!entry.isIntersecting && !video.paused) still('Select Replay to watch again.');
      }, { threshold: 0.45 }).observe(box);
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden && !video.paused) { token++; still('Select Replay to watch again.'); } });
  });

  // ---- Booking-section clip: loops silently while on screen, still image under reduced motion ----
  document.querySelectorAll('[data-loop-clip]').forEach((v) => {
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !reducedQ.matches) {
        if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
        v.play().catch(() => {});
      } else v.pause();
    }, { threshold: 0.25 }).observe(v);
  });

  // ---- Booking form: sends to Marcus's inbox through Web3Forms ----
  const form = document.querySelector('[data-booking-form]');
  if (form) {
    const out = form.querySelector('[data-form-status]');
    const btn = form.querySelector('button[type="submit"]');
    const key = form.elements.namedItem('access_key').value;
    const connected = key && !key.startsWith('YOUR_');
    const fallback = 'You can also reach Marcus on <a href="https://www.instagram.com/themarcuservin" rel="noopener" target="_blank">Instagram</a> or <a href="https://www.linkedin.com/in/marcuservin/" rel="noopener" target="_blank">LinkedIn</a>.';
    const show = (state, html) => { out.dataset.state = state; out.innerHTML = html; };
    form.addEventListener('input', (e) => { if (e.target.checkValidity()) e.target.removeAttribute('aria-invalid'); });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const invalid = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
      form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
      if (invalid.length) {
        invalid.forEach((el) => el.setAttribute('aria-invalid', 'true'));
        invalid[0].focus();
        const email = form.elements.namedItem('email');
        show('error', invalid.includes(email) && email.value ? 'That email address doesn\u2019t look right. Please check it and try again.' : 'Please add your first name, last name and email so Marcus can reply.');
        return;
      }
      if (!connected) { show('error', 'The booking form isn\u2019t connected yet, so nothing was sent. ' + fallback); return; }
      btn.disabled = true; show('sending', 'Sending\u2026');
      try {
        const res = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) throw new Error(data.message || res.status);
        const first = form.elements.namedItem('first_name').value.trim();
        form.reset();
        show('ok', `Thanks${first ? ', ' + first.replace(/[<>&]/g, '') : ''}. Your request is on its way to Marcus, and he'll be in touch soon.`);
      } catch {
        show('error', 'Something went wrong and your message wasn\u2019t sent. Please try again in a moment. ' + fallback);
      } finally { btn.disabled = false; }
    });
  }

  // "Book this play" picks the package in the form
  document.querySelectorAll('[data-play]').forEach((a) => a.addEventListener('click', () => {
    const sel = document.getElementById('f-play');
    if (sel) sel.value = a.dataset.play;
  }));

  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  const swapImg = (img, src, w, h, alt, pos) => {
    if (img.getAttribute('src') === src) return;
    const go = () => { img.src = src; img.width = w; img.height = h; img.alt = alt; img.style.objectPosition = pos || ''; img.classList.remove('swap'); };
    if (reduced) return go();
    img.classList.add('swap'); setTimeout(go, 380);
  };

  // Meet Marcus: roles swap the large portrait and the text (source wording)
  const roles = [
    { name: 'The coach', cap: 'Style coach', img: ['assets/img/cream-bw-1600.webp', 1440, 1440, 'Marcus Ervin in a cream jacket in front of a shop window'], text: 'I have read many books and taken hours upon hours of instructional classes to build up a wealth of knowledge to assist you. My aim is to pass you the ball and facilitate your success.' },
    { name: 'The trainer', cap: 'Trainer', img: ['assets/img/yellow-wall-1600.webp', 1002, 1394, 'Marcus in a yellow turtleneck against a graffiti wall'], text: "Let's head to a local gym, where we will do a workout together, tailored to your fitness level and goals. I'll share what has helped me grow muscle, stay in shape and eat properly." },
    { name: 'The barber', cap: 'Barber', img: ['assets/img/sky-wall-1600.webp', 1200, 1600, 'Marcus in an all-black outfit against a sky-blue wall'], text: 'Using my decades-long experience as a skilled barber, together we will figure out the cut and style that works perfectly for your head shape, hair type, goals, and lifestyle.' },
    { name: 'The speaker', cap: 'Public speaker', img: ['assets/img/black-suit-1600.webp', 1600, 1162, 'Marcus in a black suit and green tie fastening his jacket'], pos: '40% 30%', text: "As an experienced public speaker and business professional, I'll guide you in preparing your speech and delivering it in a way that displays poise & confidence." }
  ];
  const thumbs = [...document.querySelectorAll('[data-role-i]')];
  const big = document.querySelector('[data-role="img"]');
  thumbs.forEach((t) => t.addEventListener('click', () => {
    const r = roles[+t.dataset.roleI];
    thumbs.forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
    document.querySelector('[data-role="name"]').textContent = r.name;
    document.querySelector('[data-role="text"]').textContent = r.text;
    document.querySelector('[data-role="cap"]').textContent = r.cap;
    swapImg(big, ...r.img, r.pos);
  }));

  // Touch screens have no hover: bloom duotone photos while they sit mid-screen
  if (!matchMedia('(hover:hover)').matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('in-view', e.isIntersecting)), { rootMargin: '-35% 0px -35% 0px' });
    document.querySelectorAll('.tone').forEach((el) => io.observe(el));
  }

  // Plays: one panel open at a time
  const panels = [...document.querySelectorAll('[data-panels] .panel')];
  const openPanel = (p) => panels.forEach((x) => { const on = x === p; x.classList.toggle('is-open', on); x.querySelector('.panel-tab').setAttribute('aria-expanded', String(on)); });
  panels.forEach((p) => {
    p.querySelector('.panel-tab').addEventListener('click', () => openPanel(p));
    if (matchMedia('(hover:hover)').matches) p.addEventListener('mouseenter', () => openPanel(p));
  });

  // Lookbook: the strip brings a look forward
  const looks = [
    ['assets/img/sage-1600.webp', 1016, 1429, 'Marcus in a sage double-breasted check suit', 'Look 01 — Sage double-breasted', 'Sage windowpane check, white turtleneck and a gold silk pocket square: tailoring without a tie, still completely finished.'],
    ['assets/img/yellow-wall-1600.webp', 1002, 1394, 'Marcus in a yellow turtleneck and check trousers', 'Look 02 — Yellow turtleneck', 'A bright knit, light check trousers and statement sneakers. Colour worn with confidence, off duty.'],
    ['assets/img/blue-check-1600.webp', 1600, 1325, 'Marcus in a blue windowpane suit with an orange tie', 'Look 03 — Blue windowpane', 'A blue check suit, an orange patterned tie and a white pocket square. Pattern and colour, balanced.'],
    ['assets/img/times-square-1600.webp', 1200, 1600, 'Marcus in a yellow tee and khaki chinos at night', 'Look 04 — After dark', 'A yellow tee and khaki chinos under the lights. Simple pieces, sharp fit.'],
    ['assets/img/sky-wall-1600.webp', 1200, 1600, 'Marcus in an all-black outfit', 'Look 05 — All black', 'Fitted tee, trousers, belt and shoes in one colour: the easiest way to look tall and deliberate.'],
    ['assets/img/city-1600.webp', 1200, 1600, 'Marcus in a navy suit downtown', 'Look 06 — Navy downtown', 'A navy suit over a blue knit with a gold pocket square. Business, without the tie.']
  ];
  const lbBtns = [...document.querySelectorAll('[data-look]')];
  const lbImg = document.querySelector('[data-look-img]');
  lbBtns.forEach((b) => b.addEventListener('click', () => {
    const l = looks[+b.dataset.look];
    lbBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    swapImg(lbImg, l[0], l[1], l[2], l[3]);
    document.querySelector('[data-look-title]').textContent = l[4];
    document.querySelector('[data-look-text]').textContent = l[5];
  }));
})();
