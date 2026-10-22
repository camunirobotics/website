import {upcomingEvents} from './calendar-data.mjs';

// Parse before accepting a response: static hosts may serve PHP as source text
// or return an HTML error page with a successful HTTP status.
export async function loadCalendar({liveUrl,fallbackUrl,fetchImpl=fetch,now=new Date()}) {
  let lastError;
  for(const [source,url] of [['live',liveUrl],['saved',fallbackUrl]]) {
    try {
      const response=await fetchImpl(url,{cache:'no-store',signal:AbortSignal.timeout(source==='live'?10000:5000)});
      if(!response.ok)throw new Error('Calendar unavailable');
      const feed=await response.json();
      if(typeof feed.calendar!=='string' || feed.calendar.length>5*1024*1024)throw new Error('Invalid calendar response');
      const events=upcomingEvents(feed.calendar,{now});
      return {feed,events,source};
    } catch(error) {lastError=error;}
  }
  throw lastError;
}
