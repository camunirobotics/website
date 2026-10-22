import ICAL from './vendor/ical.js';

function decodeText(text) {
  return text.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[\da-f]+);/gi, token => {
    const named = {'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '};
    if (named[token.toLowerCase()]) return named[token.toLowerCase()];
    const value = token[2].toLowerCase() === 'x' ? parseInt(token.slice(3),16) : parseInt(token.slice(2),10);
    return value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : '';
  });
}
export function eventDescription(value = '') {
  const text = decodeText(String(value ?? '')
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<br\s*\/?>|<\/(?:p|div|li)>/gi,'\n').replace(/<[^>]*>/g,''));
  let signup = null;
  const lines = text.split(/\r?\n/).filter(line => {
    const match = line.match(/^\s*(?:sign\s*up|register|registration|booking|tickets)\s*:\s*.*?(https?:\/\/[^\s<>"']+)/i);
    if (!match || signup) return true;
    try {
      const url = new URL(match[1].replace(/[).,;]+$/,''));
      if (!['https:','http:'].includes(url.protocol) || url.username || url.password) return true;
      signup = url.href;
      return false;
    } catch { return true; }
  });
  return {description: lines.join('\n').replace(/\n{3,}/g,'\n\n').trim(), signup};
}

// Convert floating calendar dates in the calendar's timezone, independent of
// the visitor's computer timezone. Named VTIMEZONE definitions take priority.
function wallTime(time, zone) {
  const wall = Date.UTC(time.year,time.month-1,time.day,time.hour||0,time.minute||0,time.second||0);
  const format = new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  let epoch = wall;
  for(let i=0;i<3;i++) {
    const parts=Object.fromEntries(format.formatToParts(new Date(epoch)).map(p=>[p.type,p.value]));
    const observed=Date.UTC(+parts.year,+parts.month-1,+parts.day,+parts.hour,+parts.minute,+parts.second);
    const delta=wall-observed;
    epoch+=delta;
    if(!delta) break;
  }
  return new Date(epoch);
}
function instant(time, zone) {
  if (!time.isDate && time.zone.tzid !== 'floating') return time.toJSDate();
  return wallTime(time,zone);
}
export function upcomingEvents(source, {now=new Date(), days=120, limit=80}={}) {
  const calendar = new ICAL.Component(ICAL.parse(source));
  if (calendar.name !== 'vcalendar') throw new Error('Invalid calendar');
  const zone=calendar.getFirstPropertyValue('x-wr-timezone') || 'Europe/London';
  const finish=new Date(now.getTime()+days*86400000);
  const components=calendar.getAllSubcomponents('vevent');
  const result=new Map();
  function add(item,start,end,key,series=null) {
    if (String(item.component.getFirstPropertyValue('status')).toUpperCase()==='CANCELLED') return;
    const hint=item.component.getFirstProperty('dtstart')?.getParameter('tzid') || zone;
    const begins=instant(start,hint), ends=instant(end,hint);
    if (!Number.isFinite(+begins) || !Number.isFinite(+ends) || begins>=finish || (ends>begins ? ends<=now : begins<now)) return;
    result.set(key,{id:key,series,title:item.summary || 'CUR event',location:decodeText(item.location||''),start:begins.toISOString(),end:ends.toISOString(),allDay:start.isDate,...eventDescription(item.description)});
  }
  for (const component of components.filter(c=>!c.hasProperty('recurrence-id'))) {
    if (!component.hasProperty('dtstart')) continue;
    const uid=component.getFirstPropertyValue('uid') || String(result.size);
    const exceptions=components.filter(c=>c.hasProperty('recurrence-id') && c.getFirstPropertyValue('uid')===uid);
    const event=new ICAL.Event(component,{exceptions,strictExceptions:true});
    if (String(component.getFirstPropertyValue('status')).toUpperCase()==='CANCELLED') continue;
    if (!event.isRecurring()) {add(event,event.startDate,event.endDate,uid);continue;}
    const rules=component.getAllProperties('rrule');
    const rule=rules.length===1 ? rules[0].getFirstValue() : null;
    const series={id:uid,frequency:rule?.freq || null,interval:rule?.interval || 1};
    const iterator=event.iterator();
    let iterations=0, occurrence;
    while((occurrence=iterator.next())) {
      if(++iterations>30000) throw new Error('Calendar recurrence limit exceeded');
      const hint=component.getFirstProperty('dtstart')?.getParameter('tzid') || zone;
      if(instant(occurrence,hint)>=finish) break;
      const direct=event.exceptions[occurrence.toString()] || event.exceptions[occurrence.convertToZone(ICAL.Timezone.utcTimezone).toString()];
      if(direct && String(direct.component.getFirstPropertyValue('status')).toUpperCase()==='CANCELLED') continue;
      const details=event.getOccurrenceDetails(occurrence);
      add(details.item,details.startDate,details.endDate,uid+'/'+occurrence.toString(),series);
    }
    // Include an individually moved occurrence even if its original date lies
    // outside the display window, or is excluded from the master expansion.
    for(const exception of exceptions) {
      if(String(exception.getFirstPropertyValue('status')).toUpperCase()==='CANCELLED' || !exception.hasProperty('dtstart')) continue;
      const item=new ICAL.Event(exception);
      add(item,item.startDate,item.endDate,uid+'/'+item.recurrenceId.toString(),series);
    }
  }
  return [...result.values()].sort((a,b)=>a.start.localeCompare(b.start)||a.title.localeCompare(b.title)).slice(0,limit);
}

// Collapse by calendar UID, never by title: unrelated sessions may share a name.
// Keep the next actual occurrence so cancellations and moved dates remain accurate.
export function splitEvents(events) {
  const oneOff=[], sessions=new Map();
  for(const event of events) {
    if(!event.series) oneOff.push(event);
    else if(!sessions.has(event.series.id)) sessions.set(event.series.id,event);
  }
  return {oneOff,recurring:[...sessions.values()]};
}
