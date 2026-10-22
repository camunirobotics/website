import {readFile,writeFile} from 'node:fs/promises';
import {upcomingEvents} from '../assets/calendar-data.mjs';

// Run explicitly when updating the static timetable. Builds stay offline.
const {feedUrl}=JSON.parse(await readFile(new URL('../server/calendar-config.json',import.meta.url),'utf8'));
const response=await fetch(feedUrl,{signal:AbortSignal.timeout(10000),redirect:'error'});
if(!response.ok)throw new Error('Could not download the public calendar');
const calendar=await response.text();
if(calendar.length>5*1024*1024 || !calendar.trimStart().startsWith('BEGIN:VCALENDAR') || !calendar.trimEnd().endsWith('END:VCALENDAR'))throw new Error('Invalid calendar feed; saved timetable left unchanged');
const events=upcomingEvents(calendar);
await writeFile(new URL('../assets/calendar-fallback.json',import.meta.url),JSON.stringify({updatedAt:new Date().toISOString(),calendar},null,2)+'\n');
console.log(`Saved public calendar snapshot (${events.length} upcoming occurrences). Rebuild and deploy to update static hosting.`);
