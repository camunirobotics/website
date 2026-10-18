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
    const links = [...document.querySelectorAll('[data-project-link]')];
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
    let active = -1;
    function render(progress) {
      const position = Math.min(progress * chapters.length, chapters.length - .00001);
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
      // Atlas's rise-and-fade reveal, driven by the same scroll position as the
      // chapter. Exit completes before the chapter swaps; no layered text or timers.
      copySetters[index].forEach((set, group) => {
        const entering = index === 0 ? 1 : easeReveal((local - group * .025) / .16);
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
    render(0);
    const trigger = ScrollTrigger.create({
      id: 'project-story', trigger: scene, start: 'top top',
      end: () => '+=' + Math.max(innerHeight * 3, 2100),
      pin: true, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: self => render(self.progress),
      onRefresh: self => {alignRail(); render(self.progress);}
    });

    function goToChapter(index, smooth) {
      const top = trigger.start + (trigger.end - trigger.start) * ((index + .4) / chapters.length);
      window.scrollTo({top, behavior: smooth ? 'smooth' : 'instant'});
    }
    function syncHash() {
      const index = location.hash === '#projects' ? 0 : chapters.findIndex(chapter => '#' + chapter.id === location.hash);
      if (index >= 0) goToChapter(index, false);
    }
    const entryLinks = [...document.querySelectorAll('a[href="#combat"], a[href="#projects"], a[href="index.html#projects"], [data-project-link]')];
    const handlers = entryLinks.map(link => {
      const index = link.hash === '#projects' ? 0 : chapters.findIndex(chapter => '#' + chapter.id === link.hash);
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
      scene.classList.remove('is-pinned');
      rail.style.transform = '';
      trace.remove();
      chapters.forEach(chapter => {chapter.hidden = false; chapter.inert = false; chapter.removeAttribute('aria-hidden');});
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
      {y: 12, scale: .97}, {y: -12, scale: 1.02, ease: 'none', scrollTrigger: {
        trigger: project, start: 'top bottom', end: 'bottom top', scrub: true
      }}));
  });
  // Keep contexts intact in the back/forward cache; refresh restored geometry.
  window.addEventListener('pageshow', event => {if (event.persisted) ScrollTrigger.refresh();});
}
