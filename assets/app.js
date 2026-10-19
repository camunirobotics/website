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
    const captions = chapters.map(chapter => chapter.querySelector('figcaption'));
    const copyGroups = chapters.map(chapter => [...chapter.querySelectorAll('.project-copy > div')]);
    const copySetters = copyGroups.map(groups => groups.map(group => ({
      y: gsap.quickSetter(group, 'y', 'px'),
      opacity: gsap.quickSetter(group, 'opacity')
    })));
    const easeReveal = value => {const t = Math.max(0, Math.min(1, value)); return t * t * t * (t * (t * 6 - 15) + 10);};
    // Broader acceleration and deceleration for the large overview movements.
    const choreographyCurve = gsap.parseEase('sine.inOut');
    const easeChoreography = value => choreographyCurve(gsap.utils.clamp(0, 1, value));
    // Componentry's trade / stack / expand sequence, fitted to the right-hand stage.
    const stage = scene.querySelector('.project-chapters');
    const imageStage = document.createElement('div');
    imageStage.className = 'project-image-stage';
    imageStage.setAttribute('aria-hidden', 'true');
    const layers = images.map(image => {
      const layer = image.cloneNode();
      layer.alt = '';
      layer.removeAttribute('width');
      layer.removeAttribute('height');
      imageStage.append(layer);
      return layer;
    });
    stage.append(imageStage);
    const layerSetters = layers.map(layer => gsap.quickSetter(layer, 'yPercent'));
    const overview = document.createElement('div');
    overview.className = 'project-overview';
    overview.setAttribute('aria-label', 'All four projects');
    overview.innerHTML = chapters.map((chapter, i) => `<a class="overview-card" href="#${chapter.id}" data-overview-project="${i}"><img src="${images[i].getAttribute('src')}" alt=""><span>${chapter.querySelector('h3').textContent}</span></a>`).join('');
    stage.append(overview);
    const cards = [...overview.children];
    const introFraction = 5 / 18;
    const revealWindow = .24;
    const motionDistance = () => Math.max(innerHeight * 9, 6300);
    const overviewHoldDistance = () => Math.max(innerHeight * .4, 240);
    const overviewHoldFraction = () => overviewHoldDistance() / (overviewHoldDistance() + motionDistance());
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
      gsap.set(imageStage, {left: geometry.x, top: geometry.y, width: geometry.fw, height: geometry.fh});
      chapters[0].hidden = wasHidden;
    }
    function renderOverview(progress) {
      if (!geometry) return;
      const t = clamp(progress / introFraction);
      const {w, h, x, y, fw, fh} = geometry;
      const move = easeChoreography(t / .3), gather = easeChoreography((t - .35) / .3);
      const expand = easeChoreography((t - .7) / .26);
      // Clear the lower cards while the stack still covers them. The expanding
      // frame moves upward, exposing anything left underneath it.
      const fade = 1 - clamp((t - .65) / .05);
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
          opacity: i === 0 ? 1 : fade,
          visibility: i === 0 || t < .7 ? 'visible' : 'hidden',
          zIndex: i === 0 ? 4 : i});
        card.querySelector('span').style.opacity = String(1 - clamp((t - .28) / .12));
      });
      overview.hidden = progress >= introFraction;
      overview.inert = t > .28;
      overview.setAttribute('aria-hidden', String(t > .28));
    }
    let active = -1;
    function render(scrollProgress) {
      // Give the overview some reading space before starting the choreography.
      // Add distance rather than shortening the existing movement intervals.
      const hold = overviewHoldFraction();
      const progress = clamp((scrollProgress - hold) / (1 - hold));
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
        const entering = index === 0 ? (overviewActive ? overviewReveal : 1) : easeReveal((local - group * .025) / revealWindow);
        const leaving = index === chapters.length - 1 ? 0 : easeReveal((local - (1 - revealWindow) + group * .025) / revealWindow);
        const focused = copyGroups[index][group].contains(document.activeElement);
        set.opacity(focused ? 1 : entering * (1 - leaving));
        set.y(focused ? 0 : (1 - entering) * 18 - leaving * 18);
      });
      // One fixed frame, with the reveal split across the same exit and entry
      // windows as the heading. One continuous easing curve crosses the chapter
      // boundary without stopping halfway through the image movement.
      const imageEnter = index === 0 ? 1 : easeReveal(local / revealWindow);
      const imageExit = index === chapters.length - 1 ? 0 : easeReveal((local - (1 - revealWindow)) / revealWindow);
      let from = index, to = index, reveal = 1;
      if (index > 0 && local < revealWindow) {
        from = index - 1;
        reveal = easeReveal(.5 + local / (2 * revealWindow));
      } else if (index < chapters.length - 1 && local > 1 - revealWindow) {
        to = index + 1;
        reveal = easeReveal((local - (1 - revealWindow)) / (2 * revealWindow));
      }
      layers.forEach((layer, i) => {
        const visible = i === from || i === to;
        layer.style.visibility = visible ? 'visible' : 'hidden';
        layer.style.zIndex = i === to ? '2' : '1';
        layerSetters[i](from === to ? 0 : i === to ? (1 - reveal) * 100 : -18 * reveal);
      });
      imageStage.hidden = overviewActive;
      captions[index].style.opacity = String((overviewActive ? overviewReveal : imageEnter) * (1 - imageExit));
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
    function settleScroll(value) {
      if (value <= 0 || value >= 1) return value;
      const hold = overviewHoldFraction();
      const progress = clamp((value - hold) / (1 - hold));
      const overviewPosition = progress / introFraction;
      const local = ((progress - introFraction) / (1 - introFraction) * chapters.length) % 1;
      // Leave a settled reading view alone; only finish an interrupted transition.
      if (value <= hold || (overviewPosition >= .65 && overviewPosition <= .7) ||
          (progress >= introFraction && local >= revealWindow + .025 && local <= 1 - revealWindow)) return value;
      const poses = [0, introFraction * .675,
        ...chapters.map((_, i) => introFraction + (1 - introFraction) * (i + .45) / chapters.length)];
      const target = gsap.utils.snap(poses, progress);
      return hold + (1 - hold) * target;
    }
    const playhead = {progress: 0};
    const animation = gsap.to(playhead, {
      progress: 1, ease: 'none',
      onUpdate: () => render(playhead.progress),
      scrollTrigger: {
        id: 'project-story', trigger: scene, start: 'top top',
        end: () => '+=' + (motionDistance() + overviewHoldDistance()),
        pin: true, anticipatePin: 1, invalidateOnRefresh: true,
        scrub: .28,
        snap: {snapTo: settleScroll, delay: .25, duration: {min: .6, max: 1.3},
          ease: 'power2.inOut', inertia: false, directional: false},
        onRefresh: self => {alignRail(); measureOverview(); playhead.progress = self.progress; render(self.progress);}
      }
    });
    const trigger = animation.scrollTrigger;

    function goToChapter(index, smooth) {
      const fraction = index < 0 ? 0 : introFraction + (1 - introFraction) * ((index + .4) / chapters.length);
      const hold = overviewHoldFraction();
      const target = index < 0 ? 0 : hold + (1 - hold) * fraction;
      const top = trigger.start + (trigger.end - trigger.start) * target;
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
      animation.kill();
      scene.classList.remove('is-pinned', 'is-overview');
      overview.remove();
      imageStage.remove();
      captions.forEach(caption => caption.style.opacity = '');
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
