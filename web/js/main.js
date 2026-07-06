/* ══════════════════════════════════════════════
   CONFIG — ganti BASE_URL sesuai environment
   Development : http://localhost:8000/api/v1
   Production  : https://azi.web.id/api/v1
══════════════════════════════════════════════ */
const BASE_URL = 'https://azi.web.id/api/v1';
// const BASE_URL = 'http://192.168.1.16:8000/api/v1'

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
async function apiFetch(endpoint) {
  try {
    const res = await fetch(BASE_URL + endpoint, {
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    });

    if (!res.ok) {
      console.error('API response error:', endpoint, res.status);
      return null;
    }

    const json = await res.json();
    return json.data ?? json;
  } catch (error) {
    console.error('API fetch error:', endpoint, error);
    return null;
  }
}

function el(id) {
  return document.getElementById(id);
}
function create(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

/* ══════════════════════════════════════════════
   CUSTOM CURSOR
══════════════════════════════════════════════ */
(function initCursor() {
  const cursor = el('cursor');
  const cursorDot = el('cursorDot');
  let mx = -100,
    my = -100;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    cursorDot.style.left = mx + 'px';
    cursorDot.style.top = my + 'px';
  });

  function animCursor() {
    const cx = parseFloat(cursor.style.left) || mx;
    const cy = parseFloat(cursor.style.top) || my;
    cursor.style.left = cx + (mx - cx) * 0.15 + 'px';
    cursor.style.top = cy + (my - cy) * 0.15 + 'px';
    requestAnimationFrame(animCursor);
  }
  animCursor();

  // Touch → hide cursor
  document.addEventListener('touchstart', () => {
    cursor.style.display = 'none';
    cursorDot.style.display = 'none';
  });
})();

/* ══════════════════════════════════════════════
   NAV SCROLL
══════════════════════════════════════════════ */
(function initNav() {
  const nav = el('nav');
  const navToggle = el('navToggle');
  const navMenu = el('navMenu');
  const navLinks = document.querySelectorAll('.nav-menu a');

  function closeMenu() {
    navToggle.classList.remove('is-open');
    navMenu.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation');
  }

  function toggleMenu() {
    const isOpen = navMenu.classList.toggle('is-open');

    navToggle.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  }

  window.addEventListener(
    'scroll',
    () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    },
    { passive: true }
  );

  navToggle.addEventListener('click', toggleMenu);

  navLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });
})();

/* ══════════════════════════════════════════════
   REVEAL ON SCROLL
══════════════════════════════════════════════ */
const revealObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    }),
  { threshold: 0.12 }
);

function observeReveal() {
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
}

/* ══════════════════════════════════════════════
   ANIMATED LOGO
══════════════════════════════════════════════ */

function getAnimatedLogoSvg() {
  return `
  <svg
    class="nav-logo-svg"
    viewBox="0 0 294.11764705882354 300"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <style>
      .nav-logo-svg {
        overflow: visible;
      }

      .logo-book {
        transform-origin: 110px 95px;
        animation: bookOpen 4.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
      }

      .logo-stand {
        transform-origin: 72px 228px;
        animation: standSway 4.8s ease-in-out infinite;
      }

      .logo-code-left {
        transform-origin: 144px 88px;
        animation: codeLeft 4.8s ease-in-out infinite;
      }

      .logo-code-slash {
        transform-origin: 184px 86px;
        animation: codeSlash 4.8s ease-in-out infinite;
      }

      .logo-code-right {
        transform-origin: 224px 88px;
        animation: codeRight 4.8s ease-in-out infinite;
      }

      @keyframes bookOpen {
        0%, 100% {
          transform: rotate(0deg) translateY(0);
        }
        16% {
          transform: rotate(-4deg) translateY(-1px);
        }
        30% {
          transform: rotate(1deg) translateY(0);
        }
        42% {
          transform: rotate(0deg) translateY(0);
        }
      }

      @keyframes standSway {
        0%, 100% {
          transform: rotate(0deg) translateY(0);
        }
        25% {
          transform: rotate(-1deg) translateY(1px);
        }
        50% {
          transform: rotate(0.8deg) translateY(0);
        }
        75% {
          transform: rotate(-0.4deg) translateY(1px);
        }
      }

      @keyframes codeLeft {
        0%, 10%, 100% {
          opacity: 0.9;
          transform: translate(0, 0) scale(1);
        }
        22% {
          opacity: 1;
          transform: translate(-5px, -3px) scale(1.06);
        }
        36% {
          opacity: 1;
          transform: translate(0, 0) scale(1);
        }
      }

      @keyframes codeSlash {
        0%, 10%, 100% {
          opacity: 0.88;
          transform: translateY(0) scaleY(1);
        }
        22% {
          opacity: 1;
          transform: translateY(-2px) scaleY(1.08);
        }
        36% {
          opacity: 1;
          transform: translateY(0) scaleY(1);
        }
      }

      @keyframes codeRight {
        0%, 10%, 100% {
          opacity: 0.9;
          transform: translate(0, 0) scale(1);
        }
        22% {
          opacity: 1;
          transform: translate(5px, -3px) scale(1.06);
        }
        36% {
          opacity: 1;
          transform: translate(0, 0) scale(1);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .logo-book,
        .logo-stand,
        .logo-code-left,
        .logo-code-slash,
        .logo-code-right {
          animation: none !important;
        }
      }
    </style>

    <g class="logo-book">
      <path d="M97.92574,54.83805c1.23199,-16.88952 -3.64945,-33.32794 11.45239,-45.83884c10.1136,-8.37854 19.65735,-6.7846 31.74007,-6.77575l33.30974,-0.00355l63.04632,-0.00191l20.04412,0.00145c3.29963,-0.00338 6.99265,-0.13697 10.24265,-0.00886c1.17279,0.76671 2.17279,1.46796 2.35478,2.99072c0.5239,4.39678 0.21691,9.52426 0.21875,13.95605l0.04044,30.68033l0.00184,73.7864c0.00919,13.81232 0.06801,27.64191 0.00919,41.45551c-0.00368,1.04283 -0.17647,4.38934 -0.82904,5.23309c-0.98897,1.27941 -2.7886,1.45386 -4.29779,1.49338c-4.49449,0.11801 -9.05882,0.0693 -13.55699,0.06562l-24.15257,-0.00974l-74.42721,-0.05147l-24.14706,-0.15055c-4.25074,-0.03456 -9.27298,-0.31324 -13.40974,0.21268c-9.90165,1.25882 -13.71912,14.1182 -6.42169,20.73585c4.44485,4.03125 12.33162,2.37316 17.97518,2.64706c-3.55515,0.47794 -8.03805,-0.09926 -11.70294,0.15074c-2.4364,2.6875 -2.47059,4.16912 -0.82886,7.34559c-0.39099,-0.04963 -0.78033,-0.11213 -1.16728,-0.1875c-7.49136,-1.45956 -14.50974,-7.79228 -15.17096,-15.75c-0.46801,-5.63107 -0.07904,-11.78162 -0.09449,-17.49559l-0.02739,-38.36746l-0.07077,-26.33585c-0.00993,-2.95772 -0.26489,-10.56048 0.22426,-12.99835c-1.38842,1.60349 -3.32574,3.49669 -4.82996,5.06507c-3.24577,3.39596 -6.51176,6.77298 -9.79743,10.13051l-26.36085,27.1579c-3.05901,3.14908 -6.48566,6.33327 -9.44228,9.48603c-0.16857,-0.34559 -0.56489,-1.34338 -0.69081,-1.68695c-2.51158,-6.84963 -6.1546,-10.94136 -12.93603,-13.87978c-1.7011,-0.73695 -3.54283,-1.24265 -5.19982,-1.96195c2.22426,-1.86011 7.10607,-7.54761 9.45588,-9.93585l28.48401,-29.39081c8.24559,-8.3318 16.42886,-16.725 24.54926,-25.17886c1.63437,-1.73051 5.19963,-4.88199 6.41305,-6.58437z" fill="#97b39c"/>
      <path d="M285.67279,25.44945c1.78125,-0.45864 3.01471,-0.77555 4.71875,0.25827c0.19485,0.12004 0.38787,0.2454 0.57721,0.37592c0.70404,1.40221 1.10478,2.47132 1.16728,4.06618c0.18382,4.67371 -0.04412,9.29118 -0.09007,13.94669l-0.03125,19.14945l-0.02022,76.88713l0.01287,43.28364c-0.00551,4.56857 -0.03309,9.15864 -0.05699,13.73768c-0.0239,4.5386 -1.02574,5.69118 -5.65993,5.88787c-3.12868,0.13235 -6.36581,0.04963 -9.53493,0.04044l-16.23713,0.02022l-58.94301,0.03493l-18.4693,-0.00551c-3.22463,0 -6.82757,-0.08824 -10.00313,0.02757c-3.62702,-0.27022 -11.53621,-0.06985 -15.37096,-0.03125c-9.69467,-0.28309 -19.89265,0.06434 -29.62647,-0.10662c-3.2171,-0.05699 -10.60441,0.24632 -13.5182,-0.27022c-1.64173,-3.17647 -1.60754,-4.65809 0.82886,-7.34559c3.66489,-0.25 8.14779,0.32721 11.70294,-0.15074c36.40864,-0.4375 73.33493,-0.1875 109.76875,-0.15074l30.37684,0.06066c5.36581,0.01838 11.45588,0.21691 16.73162,0.01838l0.02941,-112.89596l0.00735,-36.83989c0.00919,-3.16287 -0.00919,-6.32592 -0.05331,-9.4886c-0.05882,-3.51581 -0.80882,-7.78272 1.69301,-10.50993z" fill="#dbe3d9"/>
      <path d="M144.28658,187.33272c-2.46434,-0.73529 -3.85882,-2.58088 -3.01544,-5.21471c0.28456,-0.90349 0.93621,-1.6454 1.79559,-2.04375c0.89614,-0.41195 2.7136,-0.64007 3.69632,-0.6454c6.69908,-0.03566 13.42684,0.00974 20.125,0.00662l41.41158,-0.0136l38.74081,0.00349c3.56985,0 20.18199,-0.37684 22.26103,0.45441c0.90257,0.35993 1.61581,1.08125 1.96324,1.98971c0.22426,0.57518 0.38787,1.24596 0.50551,1.8489c-0.60846,1.97647 -1.00735,3.04265 -3.18015,3.64926c-1.48713,-0.54044 -28.79412,-0.25184 -32.12684,-0.25l-55.52647,0.00184c-11.54467,-0.00184 -23.16636,-0.11765 -34.71213,0.12868c-0.84835,0.01838 -0.97941,-0.26103 -1.93805,0.08456z" fill="#dbe3d9"/>
    </g>

    <g class="logo-code">
      <path class="logo-code-slash" d="M195.70221,41.20588c2.42463,0.08456 4.44118,1.03235 5.21691,3.5386c0.41728,1.34651 -0.28676,3.73107 -0.67831,5.13162c-1.3364,4.8046 -2.86765,9.56857 -4.2886,14.35257l-10.14338,34.24908l-7.15919,24.13088c-0.70515,2.37647 -1.36636,4.79449 -2.07077,7.17188c-0.8125,2.74191 -1.21746,3.8307 -4.07923,4.67941c-2.33419,0.24449 -4.80165,-0.83088 -5.53915,-3.1989c-0.33401,-1.07169 0.35643,-3.89393 0.68235,-5.01526c1.74393,-6.00092 3.6046,-11.96838 5.37261,-17.96452c4.00625,-13.86121 8.10754,-27.69485 12.30441,-41.49982c1.32904,-4.4079 2.62684,-8.82537 3.89338,-13.25202c0.63603,-2.23897 1.24816,-4.49357 1.92279,-6.72114c0.86581,-2.84596 1.3989,-4.74522 4.56618,-5.60239z" fill="#dbe3d9"/>
      <path class="logo-code-right" d="M213.43199,56.67206c3.14154,-0.16783 7.43934,5.20018 9.61949,7.41618l9.42463,9.48456l7.39706,7.37463c2.66912,2.65515 7.23346,6.09522 3.6636,10.35588c-2.07904,2.48401 -4.77941,4.8114 -7.07169,7.15607c-4.04963,4.1454 -8.13235,8.25901 -12.24816,12.34062c-2.47059,2.49632 -5.40441,5.95257 -8.25551,7.83437c-5.32353,1.96048 -8.8989,-3.20515 -6.0386,-7.10956c2.11213,-2.88088 6.04412,-6.27408 8.72059,-8.92004l14.47794,-14.52555c-7.4375,-7.55092 -15.02206,-15.02555 -22.41544,-22.61618c-3.24265,-3.33107 -2.22426,-7.83842 2.7261,-8.79099z" fill="#dbe3d9"/>
      <path class="logo-code-left" d="M153.52941,56.64779c0.29154,-0.01232 0.58327,-0.01379 0.87482,-0.0046c1.36379,0.04743 2.78915,0.70827 3.6864,1.73915c0.82518,0.93015 1.20643,2.17243 1.04522,3.40515c-0.32941,2.60147 -4.63511,6.38364 -6.5432,8.31324l-8.79357,8.87353c-1.66121,1.67482 -7.48805,7.78824 -8.92482,8.87702c0.09081,0.08088 0.18088,0.16287 0.27004,0.2454c1.3864,1.27776 2.78695,2.87151 4.15662,4.23364l11.90919,12.06158c2.36268,2.41654 5.05404,4.6318 7.14596,7.24559c0.5579,0.69706 0.81452,1.70496 0.82721,2.59798c0.01801,1.30221 -0.49651,2.55515 -1.42408,3.4693c-1.30956,1.29118 -2.46599,1.47463 -4.16434,1.42629c-1.39118,-0.27978 -2.55404,-1.12518 -3.54926,-2.10625c-7.30074,-7.04044 -14.36158,-14.61379 -21.56599,-21.71746c-8.00349,-7.89191 -6.13162,-8.2296 0.93989,-15.45276c3.27371,-3.40864 6.58474,-6.78107 9.93272,-10.11691c3.65735,-3.68768 7.30129,-7.53199 11.04632,-11.12077c1.0136,-0.97151 1.84118,-1.46195 3.13088,-1.96912z" fill="#dbe3d9"/>
    </g>

    <g class="logo-stand">
      <path d="M46.66765,158.7875c0.2579,0.78143 0.50937,1.0864 0.97132,1.75386l44.03199,62.99357l13.2636,19.04596c1.8239,2.6636 7.33401,11.04963 9.26746,12.90993c3.30974,-0.12132 6.70515,0.00184 10.02518,0.02022c4.40607,-0.01471 8.81213,0.01287 13.21746,0.08272c-0.03879,-0.35478 -0.06379,-0.71324 -0.075,-1.07169c-0.05938,-2.36765 0.51029,-5.25184 2.25404,-6.9614c2.39687,-2.3511 5.8511,-2.40074 8.97518,-2.375c3.43125,0.02757 7.50496,-0.12868 10.08934,2.55147c2.11213,2.19118 2.38879,5.12132 2.36176,7.98529c4.22151,1.02022 8.10496,1.87868 11.99945,3.90809c8.21691,4.27757 14.06452,12.35478 16.79063,21.0864c1.28309,4.11029 2.88603,11.58824 0.84559,15.49081c-2.56618,1.79228 -7.06985,1.25735 -10.16985,1.25184c-3.27279,0.00368 -6.54577,0.02206 -9.81838,0.05882l-39.54026,0.04228l-56.06507,-0.05147c-15.58235,0.01287 -31.20221,0.11213 -46.77114,-0.25184c-5.20882,-0.12132 -4.3386,-5 -4.10882,-8.72426c0.92518,-14.99449 10.83327,-27.96875 25.575,-31.73713c6.2557,-1.60478 12.4443,-1.18199 18.83934,-1.25368c4.27132,0.01287 8.98401,-0.26838 13.18989,0.01471c0.09173,-0.2739 0.06452,-0.42463 -0.125,-0.69485c-3.06838,-4.39154 -6.15,-8.78309 -9.22004,-13.17279l-12.52335,-18.07353l-20.6261,-29.87868l-9.90037,-14.29835c-0.99375,-1.45202 -3.9057,-5.29301 -4.28695,-6.67794c0.75607,-0.8079 3.54191,-0.71526 5.0318,-1.09246c8.66048,-2.19246 11.95993,-5.875 16.50129,-12.88088z" fill="#97b39c"/>
      <path d="M137.44467,255.59375c-0.03879,-0.35478 -0.06379,-0.71324 -0.075,-1.07169c-0.05938,-2.36765 0.51029,-5.25184 2.25404,-6.9614c2.39687,-2.3511 5.8511,-2.40074 8.97518,-2.375c3.43125,0.02757 7.50496,-0.12868 10.08934,2.55147c2.11213,2.19118 2.38879,5.12132 2.36176,7.98529c4.22151,1.02022 8.10496,1.87868 11.99945,3.90809c8.21691,4.27757 14.06452,12.35478 16.79063,21.0864c1.28309,4.11029 2.88603,11.58824 0.84559,15.49081c-2.56618,1.79228 -7.06985,1.25735 -10.16985,1.25184c-3.27279,0.00368 -6.54577,0.02206 -9.81838,0.05882l-39.54026,0.04228l-56.06507,-0.05147c-15.58235,0.01287 -31.20221,0.11213 -46.77114,-0.25184c-5.20882,-0.12132 -4.3386,-5 -4.10882,-8.72426c0.92518,-14.99449 10.83327,-27.96875 25.575,-31.73713c6.2557,-1.60478 12.4443,-1.18199 18.83934,-1.25368c4.27132,0.01287 8.98401,-0.26838 13.18989,0.01471c0.90827,0.54596 4.91636,6.59375 5.68585,7.84743l-17.78824,-0.03125c-11.19062,0.01471 -21.07629,-1.2114 -29.64412,7.65625c-5.32592,5.51103 -7.27904,10.81985 -7.90515,18.33824c8.10662,0.35846 17.6796,0.15809 25.85846,0.16176l46.90735,-0.04412l48.14338,0.02941c10.13768,0.00919 20.43364,0.15625 30.55055,-0.20404c-0.92335,-8.27941 -3.69779,-14.9136 -10.42114,-20.26654c-3.30221,-2.60294 -7.17298,-4.38603 -11.29614,-5.20588c-3.67096,-0.70772 -12.5193,-0.4761 -16.68033,-0.46324l-25.58437,-0.00184c-0.9943,-1.27941 -5.04632,-6.43382 -5.44044,-7.88235c3.30974,-0.12132 6.70515,0.00184 10.02518,0.02022c4.40607,-0.01471 8.81213,0.01287 13.21746,0.08272z" fill="#dbe3d9"/>
      <path d="M25.13456,172.76085c-0.83419,-0.54871 -3.14706,-0.87684 -4.20607,-1.10184c-19.74253,-4.17408 -24.44807,-29.08658 -8.94458,-41.10882c5.40619,-4.19228 10.57785,-4.44614 17.03961,-4.62224c1.65699,0.7193 3.49871,1.225 5.19982,1.96195c6.78143,2.93842 10.42445,7.03015 12.93603,13.87978c0.12592,0.34357 0.52224,1.34136 0.69081,1.68695c1.22169,6.46085 0.66305,9.20331 -1.18254,15.33088c-4.54136,7.00588 -7.84081,10.68842 -16.50129,12.88088c-1.48989,0.37721 -4.27574,0.28456 -5.0318,1.09246z" fill="#dbe3d9"/>
    </g>
  </svg>
  `;
}

/* ══════════════════════════════════════════════
   ABOUT / HERO
══════════════════════════════════════════════ */

async function loadAbout() {
  const about = await apiFetch('/about');

  if (!about) return;

  const name = about.name ?? 'Portfolio';

  // Nav logo
  // el('navName').textContent = name
  const navName = el('navName');

  navName.innerHTML = getAnimatedLogoSvg();

  const logoSvg = navName.querySelector('.nav-logo-svg');
  if (logoSvg) {
    logoSvg.setAttribute('role', 'img');
    logoSvg.setAttribute('aria-label', name);
  }

  // Hero big text
  // Untuk desain ini, idealnya about.bio pendek, contoh: "next web"
  // Kalau bio kosong, fallback ke tagline.
  const rawHeroText = (about.tagline ?? about.bio ?? 'next web').trim();

  const words = rawHeroText.split(/\s+/);
  const firstWord = words.shift() ?? 'next';
  const secondLine = words.length ? words.join(' ') : 'web';

  el('heroWordOne').textContent = firstWord;
  el('heroWordTwo').textContent = secondLine;

  // el('heroNameScript').textContent = about.tagline ?? '';
  el('heroAuthorName').textContent = name;
  // el('heroTagline').textContent = about.tagline ?? '';

  if (about.location) {
    el('heroLocation').textContent = '📍 ' + about.location;
  } else {
    el('heroLocation').style.display = 'none';
  }

  // Hero photo
  const photoWrap = el('heroPhoto');

  if (about.photo_url) {
    const img = create('img');
    img.src = about.photo_url;
    img.alt = name;
    photoWrap.innerHTML = '';
    photoWrap.appendChild(img);
  } else {
    el('heroInitial').textContent = name[0]?.toUpperCase() ?? '?';
  }

  // CV button
  try {
    const cvCheck = await fetch(BASE_URL + '/cv/download', { method: 'HEAD' });
    if (cvCheck.ok) {
      const cvBtn = el('heroCvBtn');
      cvBtn.href = BASE_URL + '/cv/download';
      cvBtn.setAttribute('download', 'Azi_Fauzi_CV.pdf');
      cvBtn.style.display = 'inline-flex';
    }
  } catch {}

  // Footer
  el('footerCopy').textContent = `© ${new Date().getFullYear()} ${name}. All rights reserved.`;

  const footerLocalTime = el('footerLocalTime');
  if (footerLocalTime) {
    footerLocalTime.textContent = new Intl.DateTimeFormat('en', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());
  }

  observeReveal();
}

/* ══════════════════════════════════════════════
   SOCIAL LINKS
══════════════════════════════════════════════ */
function getSocialIconClass(platform = '') {
  const key = platform.toLowerCase().trim();

  const icons = {
    github: 'fa-brands fa-github',
    linkedin: 'fa-brands fa-linkedin-in',
    'twitter / x': 'fa-brands fa-x-twitter',
    twitter: 'fa-brands fa-x-twitter',
    x: 'fa-brands fa-x-twitter',
    instagram: 'fa-brands fa-instagram',
    facebook: 'fa-brands fa-facebook',
    youtube: 'fa-brands fa-youtube',
    website: 'fa-solid fa-globe',
    other: 'fa-solid fa-arrow-up-right-from-square',
  };

  return icons[key] ?? icons.other;
}

function createSocialAnchor(link) {
  const url = link.url?.trim();

  // Kalau URL kosong, jangan tampilkan icon
  if (!url) return null;

  // Kalau backend kirim visible false, jangan tampilkan juga
  if (link.is_visible === false || link.visible === false) return null;

  const platformName = link.platform ?? link.label ?? 'Other';

  const a = create('a', 'social-icon-link');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.title = platformName;
  a.setAttribute('aria-label', platformName);

  const icon = create('i');
  icon.className = getSocialIconClass(platformName);
  icon.setAttribute('aria-hidden', 'true');

  a.appendChild(icon);
  return a;
}

async function loadSocial() {
  const links = await apiFetch('/social-links');
  if (!links || !links.length) return;

  const list = el('socialList');

  list.innerHTML = '';

  links.forEach((link) => {
    const heroAnchor = createSocialAnchor(link);

    if (heroAnchor) list.appendChild(heroAnchor);
  });
}

/* ══════════════════════════════════════════════
   PROJECTS
══════════════════════════════════════════════ */

// ── Modal state ───────────────────────────────
let modalImages = [];
let modalIdx = 0;

function cleanHTML(html) {
  return DOMPurify.sanitize(html || '—', {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'ul',
      'ol',
      'li',
      'blockquote',
      'h2',
      'h3',
      'a',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

function stripHTML(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html || '';
  return temp.textContent || temp.innerText || '';
}

function openModal(project) {
  const overlay = el('modalOverlay');
  const gallery = el('modalGallery');

  gallery.innerHTML = '';
  modalImages = project.screenshots ?? [];
  modalIdx = 0;

  if (modalImages.length) {
    const bg = create('img', 'modal-gallery-bg');
    bg.src = modalImages[0].url;
    bg.alt = '';
    bg.setAttribute('aria-hidden', 'true');
    gallery.appendChild(bg);

    const img = create('img', 'modal-gallery-fg');
    img.src = modalImages[0].url;
    img.alt = project.title ?? '';
    gallery.appendChild(img);

    if (modalImages.length > 1) {
      // prev / next buttons
      const prev = create('button', 'gallery-btn gallery-prev');
      prev.textContent = '‹';
      prev.onclick = (e) => {
        e.stopPropagation();
        shiftGallery(-1, project);
      };

      const next = create('button', 'gallery-btn gallery-next');
      next.textContent = '›';
      next.onclick = (e) => {
        e.stopPropagation();
        shiftGallery(1, project);
      };

      gallery.appendChild(prev);
      gallery.appendChild(next);

      // dots
      const dotsWrap = create('div', 'gallery-dots');
      modalImages.forEach((_, i) => {
        const d = create('button', 'gallery-dot' + (i === 0 ? ' active' : ''));
        d.onclick = (e) => {
          e.stopPropagation();
          goGallery(i, project);
        };
        dotsWrap.appendChild(d);
      });
      gallery.appendChild(dotsWrap);
    }
  } else {
    const ph = create('div', 'modal-gallery-placeholder');
    ph.textContent = project.title?.[0]?.toUpperCase() ?? '?';
    gallery.appendChild(ph);
  }

  // tags
  const tags = el('modalTags');
  tags.innerHTML = '';
  (project.tech_stack ?? []).forEach((t) => {
    const s = create('span', 'project-tag');
    s.textContent = t;
    tags.appendChild(s);
  });

  function updateModalDescScrollHint() {
    const wrap = el('modalDescWrap');
    const desc = el('modalDesc');
    const hint = el('modalDescHint');

    if (!wrap || !desc || !hint) return;

    const isScrollable = desc.scrollHeight > desc.clientHeight + 2;
    const isAtBottom = desc.scrollTop + desc.clientHeight >= desc.scrollHeight - 4;

    wrap.classList.toggle('is-scrollable', isScrollable);
    wrap.classList.toggle('is-at-bottom', isAtBottom);
  }

  const parentBadgeWrap = el('modalParentBadgeWrap');
  if (parentBadgeWrap) {
    parentBadgeWrap.innerHTML = '';
    const parentBadge = createParentBadge(project);
    if (parentBadge) parentBadgeWrap.appendChild(parentBadge);
  }

  el('modalTitle').textContent = project.title ?? '—';
  el('modalDesc').innerHTML = cleanHTML(project.description || project.short_description);
  el('modalDesc')
    .querySelectorAll('a')
    .forEach((a) => {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });

  requestAnimationFrame(updateModalDescScrollHint);

  el('modalDesc').onscroll = updateModalDescScrollHint;

  // links
  const linksEl = el('modalLinks');
  linksEl.innerHTML = '';
  if (project.demo_url) {
    const a = create('a', 'btn btn-primary');
    a.href = project.demo_url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Live Demo ↗';
    linksEl.appendChild(a);
  }
  if (project.repo_url) {
    const a = create('a', 'btn btn-ghost');
    a.href = project.repo_url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Source Code';
    linksEl.appendChild(a);
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  el('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function shiftGallery(dir, project) {
  goGallery((modalIdx + dir + modalImages.length) % modalImages.length, project);
}

function goGallery(idx, project) {
  modalIdx = idx;
  const gallery = el('modalGallery');
  const bg = gallery.querySelector('.modal-gallery-bg');
  const img = gallery.querySelector('.modal-gallery-fg');
  if (bg) bg.src = modalImages[idx].url;
  if (img) img.src = modalImages[idx].url;

  gallery.querySelectorAll('.gallery-dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });
}

// ── Build cards ───────────────────────────────
function getProjectThumb(project) {
  return project.screenshots?.find((s) => s.is_thumbnail) ?? project.screenshots?.[0] ?? null;
}

function renderProjectTags(project, limit = 5) {
  const stack = create('div', 'project-stack');

  (project.tech_stack ?? []).slice(0, limit).forEach((t) => {
    const tag = create('span', 'project-tag');
    tag.textContent = t;
    stack.appendChild(tag);
  });

  if ((project.tech_stack ?? []).length > limit) {
    const more = create('span', 'project-tag');
    more.textContent = `+${project.tech_stack.length - limit}`;
    stack.appendChild(more);
  }

  return stack;
}

function renderProjectLinks(project, variant = 'featured') {
  const links = create(
    'div',
    variant === 'featured' ? 'project-editorial-links' : 'project-archive-links'
  );

  if (project.demo_url) {
    const a = create('a', variant === 'featured' ? 'btn btn-primary' : 'project-mini-link');
    a.href = project.demo_url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = variant === 'featured' ? 'Live Demo ↗' : '↗';
    a.title = 'Live Demo';
    a.onclick = (e) => e.stopPropagation();
    links.appendChild(a);
  }

  if (project.repo_url) {
    const a = create('a', variant === 'featured' ? 'btn btn-ghost' : 'project-mini-link');
    a.href = project.repo_url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = variant === 'featured' ? 'Source Code' : '<>';
    a.title = 'Source Code';
    a.onclick = (e) => e.stopPropagation();
    links.appendChild(a);
  }

  return links;
}

function createProjectImage(project, mode = 'large') {
  const thumb = getProjectThumb(project);
  const wrap = create(
    'div',
    mode === 'large' ? 'project-editorial-media' : 'project-archive-thumb'
  );

  if (thumb?.url) {
    if (mode === 'large') {
      // Blurred backdrop copy — fills the frame so the sides
      // never look empty even though the foreground image is
      // shown in full (object-fit: contain).
      const bg = create('img', 'project-editorial-media-bg');
      bg.src = thumb.url;
      bg.alt = '';
      bg.setAttribute('aria-hidden', 'true');
      bg.loading = 'lazy';
      wrap.appendChild(bg);

      const img = create('img', 'project-editorial-media-fg');
      img.src = thumb.url;
      img.alt = project.title ?? '';
      img.loading = 'lazy';
      wrap.appendChild(img);
    } else {
      const img = create('img');
      img.src = thumb.url;
      img.alt = project.title ?? '';
      img.loading = 'lazy';
      wrap.appendChild(img);
    }
  } else {
    const ph = create(
      'div',
      mode === 'large' ? 'project-editorial-placeholder' : 'project-archive-placeholder'
    );
    ph.textContent = project.title?.[0]?.toUpperCase() ?? '?';
    wrap.appendChild(ph);
  }

  return wrap;
}

function createParentBadge(project) {
  if (!project.parent) return null;

  const badge = create('span', 'project-parent-badge');

  const icon = create('i', 'fa-solid fa-code-branch');
  icon.setAttribute('aria-hidden', 'true');

  const label = create('span');
  label.textContent = `Part of ${project.parent.title ?? '—'}`;

  badge.appendChild(icon);
  badge.appendChild(label);

  return badge;
}

function createFeaturedProject(project, index) {
  const article = create('article', 'project-editorial reveal');
  if (index % 2 === 1) article.classList.add('is-reversed');
  article.style.transitionDelay = `${index * 0.08}s`;

  const media = createProjectImage(project, 'large');

  const content = create('div', 'project-editorial-content');

  const eyebrow = create('div', 'project-editorial-mark');
  eyebrow.setAttribute('aria-hidden', 'true');

  const markLine = create('span', 'project-mark-line');
  const markDot = create('span', 'project-mark-dot');

  eyebrow.appendChild(markLine);
  eyebrow.appendChild(markDot);

  const number = create('span', 'project-editorial-number');
  number.textContent = String(index + 1).padStart(2, '0');

  const parentBadge = createParentBadge(project);

  const title = create('h3', 'project-editorial-title');
  title.textContent = project.title ?? '—';

  const desc = create('p', 'project-editorial-desc');
  desc.textContent = project.short_description || stripHTML(project.description) || '—';

  const stack = renderProjectTags(project, 5);
  const links = renderProjectLinks(project, 'featured');

  content.appendChild(eyebrow);
  content.appendChild(number);
  if (parentBadge) content.appendChild(parentBadge);
  content.appendChild(title);
  content.appendChild(desc);

  if ((project.tech_stack ?? []).length) {
    content.appendChild(stack);
  }

  content.appendChild(links);

  article.appendChild(content);
  article.appendChild(media);

  article.addEventListener('click', () => openModal(project));

  return article;
}

function createArchiveProject(project, index) {
  const row = create('article', 'project-archive-row reveal');
  row.style.transitionDelay = `${index * 0.035}s`;

  const thumb = createProjectImage(project, 'small');

  const main = create('div', 'project-archive-main');

  const parentBadge = createParentBadge(project);

  const title = create('h3', 'project-archive-title');
  title.textContent = project.title ?? '—';

  const desc = create('p', 'project-archive-desc');
  desc.textContent = project.short_description || stripHTML(project.description) || '—';

  if (parentBadge) main.appendChild(parentBadge);
  main.appendChild(title);
  main.appendChild(desc);

  const stack = renderProjectTags(project, 3);
  const links = renderProjectLinks(project, 'archive');

  const action = create('span', 'project-archive-arrow');
  action.textContent = 'View';

  row.appendChild(thumb);
  row.appendChild(main);

  if ((project.tech_stack ?? []).length) {
    row.appendChild(stack);
  }

  row.appendChild(links);
  row.appendChild(action);

  row.addEventListener('click', () => openModal(project));

  return row;
}

async function loadProjects() {
  const projects = await apiFetch('/projects');
  const grid = el('projectsGrid');

  grid.innerHTML = '';
  grid.className = 'projects-showcase';

  if (!projects || !projects.length) {
    const p = create('p');
    p.style.cssText = 'color:var(--text-3);font-size:0.9rem';
    p.textContent = 'No projects published yet.';
    grid.appendChild(p);
    return;
  }

  const featuredFromFlag = projects.filter((p) => p.is_featured).slice(0, 3);
  const featuredSet = new Set(featuredFromFlag);

  const fallbackFeatured = projects
    .filter((p) => !featuredSet.has(p))
    .slice(0, Math.max(0, 3 - featuredFromFlag.length));

  const featuredProjects = [...featuredFromFlag, ...fallbackFeatured];
  const featuredFinalSet = new Set(featuredProjects);

  const otherProjects = projects.filter((p) => !featuredFinalSet.has(p));

  const featuredWrap = create('div', 'projects-featured-stack');

  featuredProjects.forEach((project, i) => {
    featuredWrap.appendChild(createFeaturedProject(project, i));
  });

  grid.appendChild(featuredWrap);

  if (otherProjects.length) {
    const archive = create('div', 'projects-archive');

    const archiveHead = create('div', 'projects-archive-head');

    const archiveTitle = create('h3', 'projects-archive-title');
    archiveTitle.textContent = 'More Projects';

    const archiveCount = create('span', 'projects-archive-count');
    archiveCount.textContent = `${otherProjects.length} archive${otherProjects.length > 1 ? 's' : ''}`;

    archiveHead.appendChild(archiveTitle);
    archiveHead.appendChild(archiveCount);

    const archiveList = create('div', 'projects-archive-list');

    otherProjects.forEach((project, i) => {
      archiveList.appendChild(createArchiveProject(project, i));
    });

    archive.appendChild(archiveHead);
    archive.appendChild(archiveList);

    grid.appendChild(archive);
  }

  observeReveal();
}

/* ══════════════════════════════════════════════
   SKILLS
══════════════════════════════════════════════ */
function createSkillPill(skill) {
  const pill = create('div', 'skill-pill');

  const iconUrl = skill.icon_url ?? skill.icon ?? skill.logo_url ?? null;

  if (iconUrl) {
    const iconWrap = create('div', 'skill-icon');

    const img = create('img');
    img.src = iconUrl;
    img.alt = skill.name ? `${skill.name} icon` : 'Skill icon';
    img.loading = 'lazy';

    iconWrap.appendChild(img);
    pill.appendChild(iconWrap);
  }

  const name = create('span', 'skill-name');
  name.textContent = skill.name ?? '—';
  pill.appendChild(name);

  return pill;
}

async function loadSkills() {
  const categories = await apiFetch('/skills');
  const container = el('skillsContainer');

  container.innerHTML = '';

  if (!categories || !categories.length) {
    container.innerHTML =
      '<p style="color:var(--text-3);font-size:0.9rem">No skills added yet.</p>';
    return;
  }

  const list = Array.isArray(categories) ? categories : [categories];

  list.forEach((cat, ci) => {
    const section = create('div', 'skill-lane reveal');
    section.style.transitionDelay = `${ci * 0.08}s`;

    const index = create('span', 'skill-lane-index');
    index.textContent = String(ci + 1).padStart(2, '0');

    const header = create('div', 'skill-lane-header');

    const titleWrap = create('div', 'skill-lane-title-wrap');

    const title = create('h3', 'skill-lane-title');
    title.textContent = cat.name ?? cat.category ?? 'Other';

    const skills = cat.skills ?? cat.items ?? [];

    const meta = create('p', 'skill-lane-meta');
    meta.textContent = `${skills.length} stack${skills.length > 1 ? 's' : ''}`;

    titleWrap.appendChild(title);
    titleWrap.appendChild(meta);

    header.appendChild(index);
    header.appendChild(titleWrap);

    const isMarquee = skills.length >= 4;

    if (isMarquee) {
      const marquee = create('div', 'skill-marquee');
      marquee.dataset.direction = ci % 2 === 0 ? '1' : '-1';
      marquee.dataset.speed = '0.32';

      const track = create('div', 'skill-marquee-track');

      const repeatedSkills = [...skills, ...skills, ...skills];

      repeatedSkills.forEach((skill) => {
        track.appendChild(createSkillPill(skill));
      });

      marquee.appendChild(track);

      section.appendChild(header);
      section.appendChild(marquee);
    } else {
      const row = create('div', 'skill-lane-track is-static');

      skills.forEach((skill) => {
        row.appendChild(createSkillPill(skill));
      });

      section.appendChild(header);
      section.appendChild(row);
    }

    container.appendChild(section);
  });

  initSkillMarquees();
  observeReveal();
}

function initSkillMarquees() {
  const marquees = document.querySelectorAll('.skill-marquee');

  marquees.forEach((marquee) => {
    const track = marquee.querySelector('.skill-marquee-track');
    if (!track) return;

    let x = 0;
    let lastX = 0;
    let isDragging = false;
    let isPaused = false;

    const direction = Number(marquee.dataset.direction || 1);
    const speed = Number(marquee.dataset.speed || 0.3);

    function getLoopWidth() {
      return track.scrollWidth / 3;
    }

    function normalize() {
      const loopWidth = getLoopWidth();
      if (!loopWidth) return;

      while (x <= -loopWidth) x += loopWidth;
      while (x > 0) x -= loopWidth;
    }

    function setTransform() {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    }

    function animate() {
      if (!isPaused && !isDragging) {
        x -= direction * speed;
        normalize();
        setTransform();
      }

      requestAnimationFrame(animate);
    }

    marquee.addEventListener('pointerenter', () => {
      isPaused = true;
    });

    marquee.addEventListener('pointerleave', () => {
      if (!isDragging) isPaused = false;
    });

    marquee.addEventListener('pointerdown', (e) => {
      isDragging = true;
      isPaused = true;
      lastX = e.clientX;

      marquee.classList.add('is-dragging');
      marquee.setPointerCapture(e.pointerId);
    });

    marquee.addEventListener('pointermove', (e) => {
      if (!isDragging) return;

      const delta = e.clientX - lastX;
      lastX = e.clientX;

      x += delta;
      normalize();
      setTransform();
    });

    function endDrag(e) {
      if (!isDragging) return;

      isDragging = false;
      isPaused = false;
      marquee.classList.remove('is-dragging');

      if (marquee.hasPointerCapture(e.pointerId)) {
        marquee.releasePointerCapture(e.pointerId);
      }
    }

    marquee.addEventListener('pointerup', endDrag);
    marquee.addEventListener('pointercancel', endDrag);

    normalize();
    setTransform();
    animate();
  });
}
/* ══════════════════════════════════════════════
   CONTACT FORM
══════════════════════════════════════════════ */
(function initContactForm() {
  const form = el('contactForm');
  const submitBtn = el('submitBtn');
  const status = el('formStatus');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    status.className = 'form-status';

    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      subject: form.subject?.value.trim() ?? '',
      message: form.message.value.trim(),
    };

    if (!data.name || !data.email || !data.message) {
      status.textContent = 'Please fill in all required fields.';
      status.classList.add('error');
      return;
    }

    submitBtn.querySelector('.btn-text').style.display = 'none';
    submitBtn.querySelector('.btn-loading').style.display = 'inline';
    submitBtn.disabled = true;

    try {
      const res = await fetch(BASE_URL + '/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (res.ok) {
        status.textContent = "✓ Message sent! I'll get back to you soon.";
        status.classList.add('success');
        form.reset();
      } else {
        const err = await res.json().catch(() => ({}));
        status.textContent = err.message ?? 'Something went wrong. Please try again.';
        status.classList.add('error');
      }
    } catch {
      status.textContent = 'Network error. Please try again later.';
      status.classList.add('error');
    } finally {
      submitBtn.querySelector('.btn-text').style.display = 'inline';
      submitBtn.querySelector('.btn-loading').style.display = 'none';
      submitBtn.disabled = false;
    }
  });
})();

/* ══════════════════════════════════════════════
   MODAL EVENTS
══════════════════════════════════════════════ */
el('modalClose').addEventListener('click', closeModal);
el('modalOverlay').addEventListener('click', (e) => {
  if (e.target === el('modalOverlay')) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
async function init() {
  // Load semua paralel
  await Promise.all([loadAbout(), loadSocial(), loadProjects(), loadSkills()]);

  // Final reveal pass (elemen yang udah ada dari awal)
  observeReveal();
}

document.addEventListener('DOMContentLoaded', init);
