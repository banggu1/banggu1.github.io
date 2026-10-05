// 공통 헤더·푸터와 각 페이지 화면을 그리는 코드
const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const params = new URLSearchParams(location.search);
const projectUrl = id => `project.html?p=${encodeURIComponent(id)}`;
const categoryUrl = c => `category.html?c=${c}`;

function header() {
  return `
  <header class="site-header">
    <a class="logo" href="index.html">${esc(SITE.name)}</a>
    <nav class="header-right">
      <a class="insta" href="${SITE.instagram}" target="_blank" rel="noopener">Instagram</a>
      <a class="avatar" href="about.html" aria-label="BIO">
        <img src="${img(SITE.avatar, 120)}" alt="">
        <img src="${img(SITE.avatarHover, 120)}" alt="">
      </a>
    </nav>
  </header>`;
}

function footer() {
  return `
  <footer class="site-footer" id="contact">
    <div class="wrap">
      <h2>Contact</h2>
      <form class="contact-form" novalidate>
        <div><label for="fn">First name *</label><input id="fn" name="first" required></div>
        <div><label for="ln">Last name *</label><input id="ln" name="last" required></div>
        <div class="full"><label for="em">Email *</label><input id="em" name="email" type="email" required></div>
        <div class="full"><label for="msg">Type your message here...</label><textarea id="msg" name="message"></textarea></div>
        <button type="submit">Submit</button>
        <p class="form-note" aria-live="polite"></p>
      </form>
      <div class="foot-bottom">
        <a class="to-top" href="#top" aria-label="맨 위로"></a>
        <small>© ${SITE.year} By Lee Jihyun.</small>
      </div>
    </div>
  </footer>`;
}

// Contact 폼: Web3Forms로 보내면 SITE.email 메일함으로 바로 도착함
function bindForm() {
  const form = $('.contact-form');
  if (!form) return;
  const note = $('.form-note', form);
  const button = $('button[type=submit]', form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    if (!f.first.trim() || !f.last.trim() || !/^\S+@\S+\.\S+$/.test(f.email)) {
      note.textContent = '이름과 이메일을 정확히 입력해 주세요.';
      return;
    }
    const name = `${f.first.trim()} ${f.last.trim()}`;
    button.disabled = true;
    note.textContent = '보내는 중...';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: SITE.formKey,
          subject: `[Portfolio] ${name}님의 메시지`,
          from_name: 'iam-jihyun.github.io',
          name,
          email: f.email,
          message: f.message || '(메시지 없음)',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      form.reset();
      note.textContent = '메시지를 보냈어요. 감사합니다!';
    } catch {
      note.innerHTML = `보내지 못했어요. <a href="mailto:${SITE.email}" style="text-decoration:underline">${SITE.email}</a>로 직접 메일을 보내 주세요.`;
    } finally {
      button.disabled = false;
    }
  });
}

// 스크롤하면 서서히 나타나는 효과
function bindReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

function shell(main, { withFooter = true } = {}) {
  document.body.innerHTML = `<a id="top"></a>${header()}<main>${main}</main>${withFooter ? footer() : ''}`;
  bindForm();
  bindReveal();
}

/* ---------- 인트로 ---------- */
function renderIntro() {
  document.body.innerHTML = `
  <main class="intro">
    <div class="intro-stage">
      <div class="slider">${INTRO_SLIDES.map(s => `<img src="${img(s, 830)}" alt="" decoding="async">`).join('')}</div>
      <div class="intro-name">
        <h1>LEE JIHYUN</h1>
        <a class="sub" href="portfolio.html">Portfolio</a>
      </div>
    </div>
    <a class="go" href="about.html">GO</a>
  </main>`;

  const slides = document.querySelectorAll('.slider img');
  let cur = 0, timer;
  // 지금 포스터는 왼쪽으로 빠지고(prev) 다음 포스터가 오른쪽에서 들어옴(on).
  // 나머지는 애니메이션 없이 오른쪽 대기 자리로 돌려놔서 화면을 가로질러 가지 않게 함.
  const show = i => {
    const old = cur;
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, j) => {
      const state = j === cur ? 'on' : (j === old && old !== cur ? 'prev' : '');
      s.style.transition = state ? '' : 'none';
      s.className = state;
    });
  };
  // 다른 탭에 가 있는 동안엔 넘기지 않음 (브라우저가 애니메이션을 멈춰서, 돌아왔을 때 포스터가 화면을 가로지르는 걸 막음)
  const play = () => { clearInterval(timer); timer = setInterval(() => { if (!document.hidden) show(cur + 1); }, 3500); };
  show(0); play();
}

/* ---------- BIO ---------- */
function renderAbout() {
  const awards = BIO.awards.map(a => {
    const inner = `<span class="t">${esc(a.title)}</span>
      <span class="prize">[ <b>${esc(a.prize)}</b> ]</span>
      <span class="m">${esc(a.place)} - <i style="display:inline">${esc(a.year)}</i></span>`;
    return a.link ? `<a class="entry" href="${projectUrl(a.link)}" style="display:block">${inner}</a>` : `<div class="entry">${inner}</div>`;
  }).join('');
  const exhibitions = BIO.exhibitions.map(e => `
    <div class="entry"><span class="t">${esc(e.title)}</span><span class="m">${esc(e.place)}</span><span class="d">${esc(e.date)}</span></div>`).join('');
  const experience = BIO.experience.map(e => `
    <a class="entry" href="${projectUrl(e.link)}" style="display:block"><span class="t">${esc(e.title)}</span><span class="d">${esc(e.date)}</span></a>`).join('');

  shell(`
  <div class="wrap">
    <section class="bio-hero">
      <div class="reveal">
        <span class="tag">Lee JiHyun</span>
        <div class="roles">
          <span class="q open">“</span>
          <p>DESIGNER,</p><p>PLANNER,</p><p>CREATOR,</p>
          <span class="q close">”</span>
        </div>
      </div>
      <img class="poster reveal" src="${img(BIO.poster, 700)}" alt="흐르는 경계, DAH 포스터">
    </section>

    <section class="bio-copy reveal">
      <h2>Turning 'What if' into 'Best Project'.</h2>
      <p>Crisp Logic, Bold Aesthetics. 상상을 '현실'이라는 결과물로 소환하는 올라운더 크리에이터 이지현입니다.</p>
    </section>

    <section class="cols">
      <div class="reveal"><h3 class="col-title">Awards</h3>${awards}</div>
      <div class="reveal"><h3 class="col-title">Exhibitions</h3>${exhibitions}</div>
      <div class="reveal">
        <h3 class="col-title">Experience</h3>${experience}
        <div class="skills">
          <h3 class="col-title" style="margin-bottom:0">Skills &amp; Tools</h3>
          <p class="entry" style="margin:24px 0 0">Certification:</p>
          <ul>${BIO.certifications.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
        </div>
      </div>
    </section>

    <a class="big-btn reveal" href="portfolio.html">Go Go, Portfolio!</a>

    <section class="contact-info reveal">
      <h3>Phone<br>&amp; Email</h3>
      <p>${esc(SITE.phone)}<br><a href="mailto:${SITE.email}">${esc(SITE.email)}</a></p>
    </section>
  </div>`);
}

/* ---------- 포트폴리오 ---------- */
function renderPortfolio() {
  const tiles = CATEGORY_ORDER.map(c => {
    const cat = CATEGORIES[c];
    // 대표 이미지가 아직 없는 칸은 글자만 보이는 타일로
    return cat.tile
      ? `<a class="tile reveal" href="${categoryUrl(c)}"><img src="${img(cat.tile, 760)}" alt=""><span>${cat.label}</span></a>`
      : `<a class="tile no-img reveal" href="${categoryUrl(c)}"><span>${cat.label}</span></a>`;
  }).join('');
  shell(`<h1 class="page-title reveal">My Portfolio</h1><div class="tiles">${tiles}</div>`);
}

/* ---------- 카테고리 ---------- */
function renderCategory() {
  const key = CATEGORIES[params.get('c')] ? params.get('c') : 'awards';
  const cat = CATEGORIES[key];
  document.title = `${cat.label} | iamjihyun`;
  let list;
  if (!cat.items.length) {
    list = `<p class="coming">준비 중입니다.</p>`;
  } else if (cat.layout === 'archive') {
    list = `<div class="archive">${cat.items.map((it, i) => `
      <button class="arc-card reveal" type="button" data-i="${i}" aria-label="${esc(it.title)} 크게 보기">
        <div class="thumb"><img src="${img(it.images[0])}" alt="" loading="lazy"></div>
        <h3>${esc(it.title)}</h3>
        <span class="meta">${esc(it.meta)}</span>
        <p class="note">${esc(it.note)}</p>
      </button>`).join('')}</div>
      <div class="lightbox" hidden role="dialog" aria-modal="true" aria-label="이미지 크게 보기">
        <button class="lb-close" type="button" aria-label="닫기">×</button>
        <button class="lb-btn prev" type="button" aria-label="이전 이미지">‹</button>
        <figure><img alt=""><figcaption></figcaption></figure>
        <button class="lb-btn next" type="button" aria-label="다음 이미지">›</button>
      </div>`;
  } else if (cat.layout === 'cards') {
    list = `<div class="cards2">${cat.items.map(it => `
      <a class="card2 reveal" href="${projectUrl(it.id)}">
        <h3>${esc(it.title)}</h3><span class="d">${esc(it.date)}</span>
        <div class="thumb"><img src="${img(it.thumb, 620)}" alt="" loading="lazy"></div>
      </a>`).join('')}</div>`;
  } else {
    list = `<div class="grid">${cat.items.map(it => {
      const inner = `<div class="thumb"><img src="${img(it.thumb, 540)}" alt="" loading="lazy"></div><h3>${esc(it.title)}</h3>`;
      return it.id
        ? `<a class="card reveal" href="${projectUrl(it.id)}">${inner}</a>`
        : `<div class="card nolink reveal">${inner}</div>`;
    }).join('')}</div>`;
  }
  shell(`
    <a class="back" href="portfolio.html"><span>&gt;&gt;</span> Back to Portfolio</a>
    <h1 class="cat-title reveal">${cat.label}</h1>
    ${list}`);
  if (cat.layout === 'archive' && cat.items.length) bindLightbox(cat.items);
}

// ARCHIVE: 카드를 누르면 그 작업의 이미지들을 화면 가득 넘겨 봄 (←/→, Esc 키도 됨)
function bindLightbox(items) {
  const lb = $('.lightbox');
  const pic = $('figure img', lb);
  const cap = $('figcaption', lb);
  let imgs = [], cur = 0, title = '', opener = null;
  const show = i => {
    cur = (i + imgs.length) % imgs.length;
    pic.src = img(imgs[cur]);
    cap.textContent = `${title}  ·  ${cur + 1} / ${imgs.length}`;
    lb.querySelectorAll('.lb-btn').forEach(b => { b.hidden = imgs.length < 2; });
  };
  const close = () => {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (opener) opener.focus();
  };
  document.querySelectorAll('.arc-card').forEach(card => card.addEventListener('click', () => {
    const it = items[+card.dataset.i];
    imgs = it.images; title = it.title; opener = card;
    show(0);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.lb-close', lb).focus();
  }));
  $('.lb-close', lb).addEventListener('click', close);
  $('.lb-btn.prev', lb).addEventListener('click', () => show(cur - 1));
  $('.lb-btn.next', lb).addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });
}

/* ---------- 작품 상세 ---------- */
function renderProject() {
  const id = params.get('p');
  const p = PROJECTS[id];
  if (!p) { location.replace('portfolio.html'); return; }
  const cat = CATEGORIES[p.cat];
  document.title = `${p.title} | iamjihyun`;

  // 같은 카테고리 안에서 이전/다음 작품
  const order = cat.items.map(it => it.id).filter(Boolean);
  const idx = order.indexOf(id);
  const prev = idx > 0 ? order[idx - 1] : null;
  const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
  const word = p.cat === 'experience' ? 'Experience' : 'Project';

  const media = p.video
    ? `<video class="hero" src="${p.video}" poster="${img(p.poster)}" controls playsinline preload="metadata"></video>`
    : p.heroes ? `
      <div class="hero-wrap reveal">
        <div class="hero-stage">
          <div class="hero-slider">
            ${p.heroes.map((h, i) => `<img src="${img(h)}" alt="${esc(p.title)} ${i + 1}" style="transform:translateX(${i ? 100 : 0}%)">`).join('')}
          </div>
          <button class="hs-btn prev" aria-label="이전 이미지">‹</button>
          <button class="hs-btn next" aria-label="다음 이미지">›</button>
        </div>
        <p class="hs-count">1 / ${p.heroes.length}</p>
      </div>`
    : p.hero ? `<img class="hero reveal" src="${img(p.hero, 1300)}" alt="${esc(p.title)}">` : '';

  const body = p.body.map(([type, val, w]) => {
    switch (type) {
      case 'h': return `<h3 class="h reveal">${esc(val)}</h3>`;
      case 'sub': return `<p class="sub">${esc(val)}</p>`;
      case 'p': return `<p>${esc(val)}</p>`;
      case 'img': return `<img class="img reveal" src="${img(val, 1300)}" alt="" loading="lazy" ${w ? `style="width:${w}px"` : ''}>`;
      case 'imgs': return `<div class="imgs reveal">${val.map(s => `<img src="${img(s, 500)}" alt="" loading="lazy">`).join('')}</div>`;
      case 'cap': return `<p class="cap">${esc(val)}</p>`;
      default: return '';
    }
  }).join('');

  const links = p.links.length
    ? `<div class="links">${p.links.map(([label, href]) => {
        const external = /^https?:/.test(href);
        return `<a href="${href}" ${external ? 'target="_blank" rel="noopener"' : ''}>${esc(label)}</a>`;
      }).join('')}</div>`
    : '';

  let pager;
  if (p.returnTo) {
    pager = `<a href="${projectUrl(p.returnTo)}"><span>&lt;</span> Return to Project</a><span></span>`;
  } else {
    pager = (prev ? `<a href="${projectUrl(prev)}"><span>&lt;</span> Prev ${word}</a>` : '<span></span>')
          + (next ? `<a href="${projectUrl(next)}">Next ${word} <span>&gt;</span></a>` : '<span></span>');
  }

  const backHref = p.returnTo ? projectUrl(p.returnTo) : categoryUrl(p.cat);
  const backLabel = p.returnTo ? 'Back to Project' : `Back to ${cat.back}`;

  shell(`
    <a class="back" href="${backHref}"><span>&gt;&gt;</span> ${backLabel}</a>
    <article class="project">
      ${media}
      <h2 class="headline">${esc(p.headline)}</h2>
      ${body}
      ${links}
    </article>
    <nav class="pager">${pager}</nav>`);

  if (p.heroes) bindHeroSlider();
}

// 작품 맨 위 이미지 여러 장: 화살표·스와이프로 옆으로 미끄러지듯 넘김
function bindHeroSlider() {
  const box = $('.hero-slider');
  const imgs = [...box.querySelectorAll('img')];
  const count = $('.hs-count');
  let cur = 0;
  const go = dir => {
    const out = imgs[cur];
    cur = (cur + dir + imgs.length) % imgs.length;
    const inc = imgs[cur];
    // 들어올 이미지를 진행 방향 반대편에 애니메이션 없이 먼저 세워 둠
    inc.style.transition = 'none';
    inc.style.transform = `translateX(${dir > 0 ? 100 : -100}%)`;
    inc.getBoundingClientRect();
    inc.style.transition = '';
    inc.style.transform = 'translateX(0)';
    out.style.transform = `translateX(${dir > 0 ? -100 : 100}%)`;
    count.textContent = `${cur + 1} / ${imgs.length}`;
  };
  $('.hs-btn.prev').addEventListener('click', () => go(-1));
  $('.hs-btn.next').addEventListener('click', () => go(1));
  let x0 = null;
  box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    x0 = null;
  });
}

const PAGES = { intro: renderIntro, about: renderAbout, portfolio: renderPortfolio, category: renderCategory, project: renderProject };
PAGES[document.documentElement.dataset.page]();
