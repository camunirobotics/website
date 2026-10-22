import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {loadCalendar} from '../assets/calendar-source.mjs';
import {splitEvents} from '../assets/calendar-data.mjs';

const empty='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n';
const recurring='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:weekly\r\nDTSTART:20261024T140000Z\r\nDTEND:20261024T160000Z\r\nRRULE:FREQ=WEEKLY;COUNT=5\r\nSUMMARY:Build session\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
const options={liveUrl:'server/calendar.php',fallbackUrl:'assets/calendar-fallback.json',now:new Date('2026-10-23T12:00:00Z')};
const response=calendar=>({ok:true,json:async()=>({calendar,updatedAt:'2026-10-23T12:00:00Z'})});

test('a successful live calendar, including an empty calendar, never uses the snapshot',async()=>{
 for(const calendar of [recurring,empty]) {
  const calls=[];
  const actual=await loadCalendar({...options,fetchImpl:async url=>{calls.push(url);return response(calendar);}});
  assert.equal(actual.source,'live');
  assert.deepEqual(calls,[options.liveUrl]);
 }
});
test('missing PHP, raw PHP source, malformed feeds and network failures use the saved calendar',async()=>{
 const failures=[async()=>({ok:false}),async()=>({ok:true,json:async()=>{throw new SyntaxError('Raw PHP source');}}),async()=>response('invalid calendar'),async()=>{throw new TypeError('Network failed');},async()=>{throw new DOMException('Timed out','TimeoutError');}];
 for(const fail of failures) {
  const calls=[];
  const actual=await loadCalendar({...options,fetchImpl:async url=>{calls.push(url);return url===options.liveUrl?fail():response(recurring);}});
  assert.equal(actual.source,'saved');
  assert.equal(splitEvents(actual.events).recurring.length,1);
  assert.deepEqual(calls,[options.liveUrl,options.fallbackUrl]);
 }
});
test('failure of both sources propagates to the unavailable UI',async()=>{
 await assert.rejects(loadCalendar({...options,fetchImpl:async()=>({ok:false})}),/Calendar unavailable/);
});
test('the checked-in snapshot is real calendar data and expired sessions disappear',async()=>{
 const feed=JSON.parse(await readFile(new URL('../assets/calendar-fallback.json',import.meta.url),'utf8'));
 assert.ok(Number.isFinite(Date.parse(feed.updatedAt)));
 const actual=await loadCalendar({...options,fetchImpl:async url=>url===options.liveUrl?{ok:false}:{ok:true,json:async()=>feed}});
 assert.equal(actual.source,'saved');
 assert.ok(actual.events.length>0);
 const expired=await loadCalendar({...options,now:new Date('2100-01-01T00:00:00Z'),fetchImpl:async url=>url===options.liveUrl?{ok:false}:{ok:true,json:async()=>feed}});
 assert.deepEqual(expired.events,[]);
});
