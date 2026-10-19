const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();menu.focus()}});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelectorAll('[data-category]').forEach(event=>{event.hidden=button.dataset.filter!=='All'&&event.dataset.category!==button.dataset.filter})}));
const chapters=[...document.querySelectorAll('.project')];
if(chapters.length){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting&&!document.querySelector('.projects.is-pinned')){document.querySelectorAll('[data-project-link]').forEach(a=>{const active=a.dataset.projectLink===entry.target.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}}},{rootMargin:'-15% 0px -45% 0px',threshold:0});chapters.forEach(p=>observer.observe(p));}
// Use one pinned scene and one progress source.
// Native scrolling avoids competing CSS/Lenis/ScrollTrigger scroll controllers.
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.from('.hero-copy > *', {y: 22, opacity: 0, duration: .75, stagger: .12});
    if (document.querySelector('.hero-art')) {
      gsap.from('.hero-art img', {opacity: 0, duration: .8});
      gsap.to('.hero-art img', {y: -35, ease: 'none', scrollTrigger: {
        trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true
      }});
    }
  });

  media.add('(min-width: 701px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)', () => {
    if (!chapters.length) return;
    const scene = document.querySelector('.projects');
    const rail = document.querySelector('.project-rail');
    const links = [...document.querySelectorAll('[data-project-link], [data-overview-project]')];
    const images = chapters.map(chapter => chapter.querySelector('img'));
    const trace = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    trace.setAttribute('viewBox', '0 0 300 40');
    trace.setAttribute('class', 'project-trace');
    trace.setAttribute('aria-hidden', 'true');
    trace.innerHTML = '<path class="trace-base" d="M0 20h80l15-12h100l15 12h90"/><path class="trace-progress" pathLength="1" d="M0 20h80l15-12h100l15 12h90"/>';
    rail.append(trace);
    scene.classList.add('is-pinned');
    const progressLine = trace.querySelector('.trace-progress');
    const imageSetters = images.map(image => ({
      y: gsap.quickSetter(image, 'y', 'px'),
      rotation: gsap.quickSetter(image, 'rotation', 'deg'),
      scale: gsap.quickSetter(image, 'scale')
    }));
    const copyGroups = chapters.map(chapter => [...chapter.querySelectorAll('.project-copy > div')]);
    const copySetters = copyGroups.map(groups => groups.map(group => ({
      y: gsap.quickSetter(group, 'y', 'px'),
      opacity: gsap.quickSetter(group, 'opacity')
    })));
    const easeReveal = value => {const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t);};
    // Componentry's trade / stack / expand sequence, fitted to the right-hand stage.
    const stage = scene.querySelector('.project-chapters');
    const overview = document.createElement('div');
    overview.className = 'project-overview';
    overview.setAttribute('aria-label', 'All four projects');
    overview.innerHTML = chapters.map((chapter, i) => `<a class="overview-card" href="#${chapter.id}" data-overview-project="${i}"><img src="${images[i].getAttribute('src')}" alt=""><span>${chapter.querySelector('h3').textContent}</span></a>`).join('');
    stage.append(overview);
    const cards = [...overview.children];
    const introFraction = 1 / 3;
    let geometry;
    const mix = (a, b, t) => a + (b - a) * t;
    const clamp = gsap.utils.clamp(0, 1);
    function measureOverview() {
      const wasHidden = chapters[0].hidden;
      chapters[0].hidden = false;
      const frame = chapters[0].querySelector('img').getBoundingClientRect();
      const bounds = stage.getBoundingClientRect();
      geometry = {w: bounds.width, h: bounds.height, x: frame.left - bounds.left,
        y: frame.top - bounds.top, fw: frame.width, fh: frame.height};
      chapters[0].hidden = wasHidden;
    }
    function renderOverview(progress) {
      if (!geometry) return;
      const t = clamp(progress / introFraction);
      const {w, h, x, y, fw, fh} = geometry;
      const move = clamp(t / .3), gather = clamp((t - .35) / .3);
      const expand = clamp((t - .7) / .2);
      const fade = 1 - clamp((t - .75) / .1);
      const cw = w * .44, ch = h * .24;
      // Combat starts top right and becomes the expanded image.
      const places = [[1,-1],[-1,-1],[1,1],[-1,1]];
      cards.forEach((card, i) => {
        const [sx, sy] = places[i];
        const cy = i === 1 || i === 2 ? mix(sy, -sy, move) : sy;
        const left = w / 2 - cw / 2 + sx * w * .25 * (1 - gather);
        const top = h / 2 - ch / 2 + cy * h * .15 * (1 - gather);
        gsap.set(card, {left: i === 0 ? mix(left, x, expand) : left,
          top: i === 0 ? mix(top, y, expand) : top,
          width: i === 0 ? mix(cw, fw, expand) : cw,
          height: i === 0 ? mix(ch, fh, expand) : ch,
          opacity: i === 0 ? 1 : fade, zIndex: i === 0 ? 4 : i});
        card.querySelector('span').style.opacity = String(1 - clamp((t - .28) / .12));
      });
      overview.hidden = progress >= introFraction;
      overview.inert = t > .28;
      overview.setAttribute('aria-hidden', String(t > .28));
    }
    let active = -1;
    function render(progress) {
      const overviewActive = progress < introFraction;
      renderOverview(progress);
      const chapterProgress = clamp((progress - introFraction) / (1 - introFraction));
      const position = Math.min(chapterProgress * chapters.length, chapters.length - .00001);
      const index = Math.floor(position);
      const local = position - index;
      if (index !== active) {
        active = index;
        chapters.forEach((chapter, i) => {
          chapter.hidden = i !== index;
          chapter.inert = i !== index;
          chapter.setAttribute('aria-hidden', String(i !== index));
        });
        links.forEach((link, i) => {
          link.classList.toggle('active', i === index);
          if (i === index) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
      const overviewReveal = easeReveal((progress / introFraction - .9) / .1);
      chapters[index].style.visibility = overviewActive && overviewReveal === 0 ? 'hidden' : '';
      chapters[index].inert = overviewActive;
      chapters[index].setAttribute('aria-hidden', String(overviewActive));
      links.forEach((link, i) => {
        const selected = !overviewActive && i === index;
        link.classList.toggle('active', selected);
        if (selected) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      scene.classList.toggle('is-overview', overviewActive);
      // Atlas's rise-and-fade reveal, driven by the same scroll position as the
      // chapter. Exit completes before the chapter swaps; no layered text or timers.
      copySetters[index].forEach((set, group) => {
        const entering = index === 0 ? (overviewActive ? overviewReveal : 1) : easeReveal((local - group * .025) / .16);
        const leaving = index === chapters.length - 1 ? 0 : easeReveal((local - .82 + group * .025) / .18);
        const focused = copyGroups[index][group].contains(document.activeElement);
        set.opacity(focused ? 1 : entering * (1 - leaving));
        set.y(focused ? 0 : (1 - entering) * 18 - leaving * 18);
      });
      // Match the heading's entrance/exit windows and hold the drawing exactly
      // aligned throughout the reading interval. First/last chapters stay settled
      // at the outer edges of the pinned story.
      const imageEnter = index === 0 ? 1 : easeReveal(local / .16);
      const imageExit = index === chapters.length - 1 ? 0 : easeReveal((local - .82) / .18);
      imageSetters[index].y((1 - imageEnter) * 18 - imageExit * 18);
      imageSetters[index].rotation((1 - imageEnter) * 3 - imageExit * 3);
      imageSetters[index].scale(1 - (1 - imageEnter) * .025 - imageExit * .025);
      progressLine.style.strokeDashoffset = String(1 - progress);
    }
    function alignRail() {
      const width = rail.querySelector('nav').clientWidth;
      trace.setAttribute('viewBox', `0 0 ${width} 40`);
      trace.querySelectorAll('path').forEach(path => path.setAttribute('d', `M0 20H40L60 0H${width - 60}L${width - 40} 20H${width}`));
      rail.style.transform = '';
      const relativeTop = rail.getBoundingClientRect().top - scene.getBoundingClientRect().top;
      rail.style.transform = `translateY(${Math.round(relativeTop / 20) * 20 - relativeTop}px)`;
    }
    measureOverview();
    render(0);
    const trigger = ScrollTrigger.create({
      id: 'project-story', trigger: scene, start: 'top top',
      end: () => '+=' + Math.max(innerHeight * 5, 3500),
      pin: true, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: self => render(self.progress),
      onRefresh: self => {alignRail(); measureOverview(); render(self.progress);}
    });

    function goToChapter(index, smooth) {
      const fraction = index < 0 ? 0 : introFraction + (1 - introFraction) * ((index + .4) / chapters.length);
      const top = trigger.start + (trigger.end - trigger.start) * fraction;
      window.scrollTo({top, behavior: smooth ? 'smooth' : 'instant'});
    }
    function syncHash() {
      const index = location.hash === '#projects' ? -1 : chapters.findIndex(chapter => '#' + chapter.id === location.hash);
      if (location.hash === '#projects' || index >= 0) goToChapter(index, false);
      else if (['#minibots', '#project-fund', '#join'].includes(location.hash)) {
        document.getElementById(location.hash.slice(1))?.scrollIntoView({behavior: 'instant', block: 'start'});
      }
    }
    const entryLinks = [...document.querySelectorAll('a[href="#combat"], a[href="#projects"], a[href="index.html#projects"], [data-project-link], [data-overview-project]')];
    const handlers = entryLinks.map(link => {
      const index = link.hash === '#projects' ? -1 : chapters.findIndex(chapter => '#' + chapter.id === link.hash);
      const handler = event => {
        event.preventDefault();
        history.pushState(null, '', link.hash);
        goToChapter(index, true);
      };
      link.addEventListener('click', handler);
      return [link, handler];
    });
    const ready = () => {ScrollTrigger.refresh(); syncHash();};
    let readyFrame;
    if (document.readyState === 'complete') readyFrame = requestAnimationFrame(ready);
    else window.addEventListener('load', ready, {once: true});
    window.addEventListener('hashchange', syncHash);
    window.addEventListener('popstate', syncHash);
    return () => {
      cancelAnimationFrame(readyFrame);
      trigger.kill(true);
      scene.classList.remove('is-pinned', 'is-overview');
      overview.remove();
      rail.style.transform = '';
      trace.remove();
      chapters.forEach(chapter => {chapter.hidden = false; chapter.style.visibility = ''; chapter.inert = false; chapter.removeAttribute('aria-hidden');});
      gsap.set(images, {clearProps: 'transform'});
      gsap.set(copyGroups.flat(), {clearProps: 'transform,opacity'});
      handlers.forEach(([link, handler]) => link.removeEventListener('click', handler));
      window.removeEventListener('load', ready);
      window.removeEventListener('hashchange', syncHash);
      window.removeEventListener('popstate', syncHash);
    };
  });

  media.add('(max-width: 700px) and (prefers-reduced-motion: no-preference), (max-height: 699px) and (prefers-reduced-motion: no-preference)', () => {
    chapters.forEach(project => gsap.fromTo(project.querySelector('img'),
      {y: 8}, {y: -8, ease: 'none', scrollTrigger: {
        trigger: project, start: 'top bottom', end: 'bottom top', scrub: true
      }}));
  });
  // Keep contexts intact in the back/forward cache; refresh restored geometry.
  window.addEventListener('pageshow', event => {if (event.persisted) ScrollTrigger.refresh();});
}
