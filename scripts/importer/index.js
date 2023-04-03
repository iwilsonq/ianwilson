import path from 'path';
import fs from 'fs';
import { Decoder, Stream } from '@garmin-fit/sdk';
import Airtable from 'airtable';
import dotenv from 'dotenv';

// Main
dotenv.config();

Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN,
});
const trackBase = Airtable.base('appRKlealQJaMbrRy');
const DATA_DIR = 'data';

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
      console.log('sessionMesgs', messages.sessionMesgs);
      console.log('workoutMesgs', messages.workoutMesgs);
      console.log(
        `Distance: ${session.totalDistance} (${formatDistance(
          session.totalDistance
        )})`
      );
      console.log(
        `Time: ${session.totalTimerTime} (${formatTime(
          session.totalTimerTime
        )})`
      );

      createWorkout(
        messages.workoutMesgs[0].wktName,
        session.totalDistance,
        session.totalTimerTime,
        session.startTime,
        session.totalAscent,
        session.totalDescent,
        session.maxAltitude,
        session.avgHeartRate,
        session.maxHeartRate,
        session.avgCadence,
        session.totalCalories,
        session.avgSpeed,
        session.maxSpeed
      );
    }
  });
}

function createWorkout(
  name,
  distance,
  duration,
  startTime,
  totalAscent,
  totalDescent,
  maxAltitude,
  avgHeartRate,
  maxHeartRate,
  avgCadence,
  totalCalories,
  avgSpeed,
  maxSpeed
) {
  trackBase('Workouts').create(
    [
      {
        fields: {
          Name: name,
          Distance: distance,
          Duration: duration,
          'Start Time': startTime,
          'Total Ascent': totalAscent,
          'Total Descent': totalDescent,
          'Max Altitude': maxAltitude,
          'Avg HeartRate': avgHeartRate,
          'Max HeartRate': maxHeartRate,
          'Avg Cadence': avgCadence,
          'Total Calories': totalCalories,
          'Avg Speed': avgSpeed,
          'Max Speed': maxSpeed,
        },
      },
    ],
    (err, records) => {
      if (err) {
        console.error(err);
        return;
      }
      records.forEach(function (record) {
        console.log('Added', record.getId());
      });
    }
  );
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
