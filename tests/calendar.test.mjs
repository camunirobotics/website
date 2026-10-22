import assert from 'node:assert/strict';
import {test} from 'node:test';
import {upcomingEvents,eventDescription,splitEvents} from '../assets/calendar-data.mjs';
const wrap=events=>`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nX-WR-TIMEZONE:Europe/London\r\n${events}\r\nEND:VCALENDAR`;
const event=(id,lines)=>`BEGIN:VEVENT\r\nUID:${id}\r\n${lines.join('\r\n')}\r\nEND:VEVENT`;
const now=new Date('2026-10-21T12:00:00Z');
test('public empty calendar is valid',()=>assert.deepEqual(upcomingEvents(wrap(''),{now}),[]));

test('sessions collapse by UID while one-offs and the next moved occurrence retain their details',()=>{
 const source=wrap([
  event('first',['DTSTART:20261022T180000Z','DTEND:20261022T190000Z','RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=4','SUMMARY:Workshop']),
  event('first',['RECURRENCE-ID:20261022T180000Z','STATUS:CANCELLED']),
  event('first',['RECURRENCE-ID:20261105T180000Z','DTSTART:20261106T190000Z','DTEND:20261106T200000Z','SUMMARY:Workshop moved','LOCATION:New room','DESCRIPTION:Sign up: https://forms.gle/moved']),
  event('second',['DTSTART:20261023T180000Z','RRULE:FREQ=WEEKLY;COUNT=2','SUMMARY:Workshop']),
  event('one-off',['DTSTART:20261024T180000Z','SUMMARY:Workshop'])
 ].join('\r\n'));
 const {oneOff,recurring}=splitEvents(upcomingEvents(source,{now}));
 assert.equal(oneOff.length,1);
 assert.equal(recurring.length,2);
 const moved=recurring.find(e=>e.series.id==='first');
 assert.equal(moved.title,'Workshop moved');
 assert.equal(moved.start,'2026-11-06T19:00:00.000Z');
 assert.equal(moved.location,'New room');
 assert.equal(moved.signup,'https://forms.gle/moved');
 assert.equal(moved.series.interval,2);
 assert.equal(moved.series.frequency,'WEEKLY');
});
test('weekly sessions preserve London wall time across the clock change; EXDATE and cancelled exceptions are excluded',()=>{
 const master=event('weekly',['DTSTART;TZID=Europe/London:20261022T180000','DTEND;TZID=Europe/London:20261022T200000','RRULE:FREQ=WEEKLY;COUNT=5','EXDATE;TZID=Europe/London:20261105T180000','SUMMARY:Minibots']);
 const moved=event('weekly',['RECURRENCE-ID;TZID=Europe/London:20261029T180000','DTSTART;TZID=Europe/London:20261030T190000','DTEND;TZID=Europe/London:20261030T210000','SUMMARY:Minibots moved']);
 const cancelled=event('weekly',['RECURRENCE-ID;TZID=Europe/London:20261112T180000','STATUS:CANCELLED']);
 const other=event('other',['DTSTART:20261023T120000Z','DTEND:20261023T130000Z','SUMMARY:Talk']);
 const actual=upcomingEvents(wrap([master,moved,cancelled,other].join('\r\n')),{now});
 assert.deepEqual(actual.map(e=>[e.title,e.start]),[['Minibots','2026-10-22T17:00:00.000Z'],['Talk','2026-10-23T12:00:00.000Z'],['Minibots moved','2026-10-30T19:00:00.000Z'],['Minibots','2026-11-19T18:00:00.000Z']]);
});
test('embedded VTIMEZONE definitions and monthly recurrence',()=>{
 const source=wrap(`BEGIN:VTIMEZONE\r\nTZID:Europe/London\r\nBEGIN:STANDARD\r\nDTSTART:19701025T020000\r\nRRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU\r\nTZOFFSETFROM:+0100\r\nTZOFFSETTO:+0000\r\nEND:STANDARD\r\nBEGIN:DAYLIGHT\r\nDTSTART:19700329T010000\r\nRRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU\r\nTZOFFSETFROM:+0000\r\nTZOFFSETTO:+0100\r\nEND:DAYLIGHT\r\nEND:VTIMEZONE\r\n`+event('monthly',['DTSTART;TZID=Europe/London:20261026T180000','DTEND;TZID=Europe/London:20261026T190000','RRULE:FREQ=MONTHLY;BYDAY=MO;BYSETPOS=-1;COUNT=3','SUMMARY:Team meeting']));
 assert.deepEqual(upcomingEvents(source,{now}).map(e=>e.start),['2026-10-26T18:00:00.000Z','2026-11-30T18:00:00.000Z','2026-12-28T18:00:00.000Z']);
});
test('all-day dates, ongoing sessions, past/cancelled events, display limits',()=>{
 const source=wrap([event('all',['DTSTART;VALUE=DATE:20261022','DTEND;VALUE=DATE:20261024','SUMMARY:Competition']),event('ongoing',['DTSTART:20261021T110000Z','DTEND:20261021T140000Z']),event('past',['DTSTART:20261020T110000Z','DTEND:20261020T140000Z']),event('cancel',['DTSTART:20261023T110000Z','STATUS:CANCELLED'])].join('\r\n'));
 const actual=upcomingEvents(source,{now});assert.equal(actual.length,2);assert.equal(actual[1].allDay,true);assert.equal(actual[1].start,'2026-10-21T23:00:00.000Z');assert.equal(actual[1].end,'2026-10-23T23:00:00.000Z');assert.equal(upcomingEvents(source,{now,limit:1}).length,1);
});
test('moved occurrence enters the window even when its original date is outside it',()=>{
 const source=wrap([event('series',['DTSTART:20261022T180000Z','DTEND:20261022T190000Z','RRULE:FREQ=WEEKLY;COUNT=30']),event('series',['RECURRENCE-ID:20270415T180000Z','DTSTART:20261023T180000Z','DTEND:20261023T190000Z','SUMMARY:Rescheduled'])].join('\r\n'));
 assert.equal(upcomingEvents(source,{now,days:7}).filter(e=>e.title==='Rescheduled').length,1);
});
test('signup is explicitly labelled, supports formatted links and entities, rejects unsafe URLs',()=>{
 assert.deepEqual(eventDescription(null),{description:'',signup:null});
 assert.deepEqual(eventDescription('Bring a laptop.\n\nSign up: https://forms.gle/example'),{description:'Bring a laptop.',signup:'https://forms.gle/example'});
 assert.deepEqual(eventDescription('<p>Welcome &amp; hello.</p><p>Sign up: <a href="https://example.com/form?a=1&amp;b=2">our form</a></p>'),{description:'Welcome & hello.',signup:'https://example.com/form?a=1&b=2'});
 assert.equal(eventDescription('Website: https://example.com').signup,null);
 assert.equal(eventDescription('Sign up: javascript:alert(1)').signup,null);
 assert.equal(eventDescription('Sign up: https://name:password@example.com').signup,null);
});
