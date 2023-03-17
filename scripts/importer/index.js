import path from 'path';
import fs from 'fs';
import { Decoder, Stream } from '@garmin-fit/sdk';

const DATA_DIR = 'data';

// Main

const dir = fs.opendirSync(DATA_DIR);
for await (const dirent of dir) {
  importFitFile(path.join(DATA_DIR, dirent.name));
}

// Helpers

function importFitFile(pathname) {
  process.stdout.write(`reading ${pathname}\n`);
  const buffer = fs.readFileSync(pathname);
  const stream = Stream.fromBuffer(buffer);
  const decoder = new Decoder(stream);
  if (!decoder.isFIT() || !decoder.checkIntegrity()) {
    process.exit();
  }

  const { messages, errors } = decoder.read();
  if (errors.length > 0) {
    process.stderr.write(errors.join(', '));
  }

  messages.sessionMesgs.forEach((session) => {
    if (session.sport === 'running') {
      console.log(
        formatDistance(session.totalDistance),
        'in',
        formatTime(session.totalTimerTime)
      );
    }
  });
  console.log('keys', Object.keys(messages));
  console.log('lapMesgs.length', messages.lapMesgs.length);
  console.log('sessionMesgs', messages.sessionMesgs);
  console.log('activityMesgs', messages.activityMesgs);
  console.log('recordMesgs', messages.recordMesgs);
  console.log('eventMesgs', messages.eventMesgs);
  console.log('workoutMesgs', messages.workoutMesgs);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  if (seconds < 10) {
    seconds = '0' + seconds;
  }
  return `${minutes}:${seconds}`;
}

function formatDistance(meters) {
  const METERS_IN_MILE = 1609.34;
  let miles = meters / METERS_IN_MILE;
  const fmiles = (miles % 1).toFixed(2).slice(2);

  miles = miles.toFixed(0);
  return `${miles}.${fmiles} mi`;
}
