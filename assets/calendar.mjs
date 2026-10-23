import {splitEvents} from './calendar-data.mjs';
import {loadCalendar} from './calendar-source.mjs';
const host=document.querySelector('[data-calendar]');
if(host) {
  const status=host.querySelector('[data-calendar-status]');
  const list=host.querySelector('[data-calendar-events]');
  const sessions=host.querySelector('[data-calendar-sessions]');
  let showingLive=false;
  const formats={month:new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',month:'long',year:'numeric'}),day:new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',weekday:'long',day:'numeric',month:'short'}),time:new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})};
  const make=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
  async function loadEvents() {
    host.setAttribute('aria-busy','true');
    try {
      const {events,source}=await loadCalendar({liveUrl:host.dataset.calendar,fallbackUrl:host.dataset.calendarFallback});
      // If a refresh fails, keep the live timetable already on screen instead
      // of replacing it with an older bundled snapshot.
      if(source==='saved' && showingLive) {
        status.textContent='';
        status.hidden=true;
        return;
      }
      const {oneOff,recurring}=splitEvents(events);
      const content=document.createDocumentFragment();let month='';let group;
      for(const event of oneOff) {
        const start=new Date(event.start),end=new Date(event.end),heading=formats.month.format(start);
        if(heading!==month){month=heading;group=make('section','calendar-month');group.append(make('h3','',month));content.append(group);}
        const article=make('article','calendar-event');
        const date=make('div','calendar-when');const lastDay=new Date(Math.max(+start,+end-1));
        const dateLabel=event.allDay && formats.day.format(start)!==formats.day.format(lastDay) ? formats.day.format(start)+'\u2013'+formats.day.format(lastDay) : formats.day.format(start);
        const time=make('time','',dateLabel);time.dateTime=event.start;date.append(time);
        const sameDay=formats.day.format(start)===formats.day.format(end);
        const timing=event.allDay?'All day':formats.time.format(start)+(end>start?'\u2013'+(sameDay?'':formats.day.format(end)+' ')+formats.time.format(end):'');
        date.append(make('span','',timing));
        const detail=make('div','calendar-detail');detail.append(make('h4','',event.title));
        if(event.location)detail.append(make('p','calendar-location',event.location));
        if(event.description)detail.append(make('p','calendar-description',event.description));
        article.append(date,detail);
        if(event.signup){const link=make('a','text-link calendar-signup','Sign up \u2197');link.href=event.signup;article.append(link);}
        group.append(article);
      }
      if(!oneOff.length)content.append(make('p','calendar-empty','No upcoming events listed.'));
      const recurringContent=document.createDocumentFragment();
      for(const event of recurring) {
        const article=make('article','calendar-event calendar-session');
        const detail=make('div','calendar-detail');
        const {frequency,interval}=event.series;
        const names={DAILY:['Daily','days'],WEEKLY:['Weekly','weeks'],MONTHLY:['Monthly','months'],YEARLY:['Yearly','years']};
        const repeat=names[frequency];
        detail.append(make('p','calendar-repeat',repeat ? (interval===1 ? repeat[0] : `Every ${interval} ${repeat[1]}`) : 'Repeating session'));
        detail.append(make('h3','',event.title));
        const next=make('p','calendar-next','Next: ');
        const time=make('time','',formats.day.format(new Date(event.start)));time.dateTime=event.start;next.append(time);
        next.append(document.createTextNode(event.allDay ? ' \u00b7 All day' : ' \u00b7 '+formats.time.format(new Date(event.start))+(event.end>event.start ? '\u2013'+(formats.day.format(new Date(event.start))===formats.day.format(new Date(event.end))?'':formats.day.format(new Date(event.end))+' ')+formats.time.format(new Date(event.end)) : '')));
        detail.append(next);
        if(event.location)detail.append(make('p','calendar-location',event.location));
        if(event.description)detail.append(make('p','calendar-description',event.description));
        article.append(detail);
        if(event.signup){const link=make('a','text-link calendar-signup','Sign up \u2197');link.href=event.signup;article.append(link);}
        recurringContent.append(article);
      }
      if(!recurring.length)recurringContent.append(make('p','calendar-empty','No sessions listed.'));
      list.replaceChildren(content);
      sessions.replaceChildren(recurringContent);
      showingLive=source==='live';
      status.textContent='';
      status.hidden=true;
      // Mobile grid rules follow newly loaded content too.
      host.dispatchEvent(new CustomEvent('calendar:updated',{bubbles:true}));
    } catch {
      if(!list.children.length && !sessions.children.length){status.textContent='The timetable is temporarily unavailable. Open the calendar to see upcoming events.';status.hidden=false;}
    } finally{host.setAttribute('aria-busy','false');}
  }
  loadEvents();
  let lastRefresh=Date.now();
  let timer;
  const startTimer=()=>{clearInterval(timer);timer=setInterval(()=>{if(!document.hidden){lastRefresh=Date.now();loadEvents();}},300000);};
  startTimer();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastRefresh>=300000){lastRefresh=Date.now();loadEvents();}});
  window.addEventListener('pagehide',()=>clearInterval(timer));
  window.addEventListener('pageshow',event=>{if(event.persisted){lastRefresh=Date.now();loadEvents();startTimer();}});
}
