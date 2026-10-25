(function () {
  const header = document.querySelector('.site-header');
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('site-nav');

  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', '打开菜单');
      }
    });
  }

  // Optional app URL override for separate deployments:
  //   /landing/?app=https://your-app.example
  const base = new URLSearchParams(location.search).get('app');
  if (base) {
    let root;
    try { root = new URL(base, location.href); } catch { root = null; }
    if (root) {
      document.querySelectorAll('[data-app-link]').forEach((a) => {
        const url = new URL(root.href);
        if (a.hasAttribute('data-demo')) url.searchParams.set('guest', 'student');
        a.href = url.href;
      });
    }
  }

  // Reveal on scroll.
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  // CTA events: works with Plausible or Umami if either is installed,
  // and leaves a small data layer for anything else.
  document.querySelectorAll('[data-app-link]').forEach((a) => {
    a.addEventListener('click', () => {
      const label = a.textContent.trim().slice(0, 24);
      const demo = a.hasAttribute('data-demo');
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'cta_click', label, demo });
      if (typeof window.plausible === 'function') window.plausible('CTA: ' + label, { props: { demo } });
      if (window.umami && typeof window.umami.track === 'function') window.umami.track('cta_click', { label, demo });
    });
  });

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
