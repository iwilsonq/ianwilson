import Airtable, { FieldSet } from 'airtable';
import dotenv from 'dotenv';

dotenv.config();

Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN,
});

const trackBase = Airtable.base('appRKlealQJaMbrRy');

export interface Workout extends FieldSet {
  name: string;
  distanceMi: number;
  duration: number;
  startTime: string;
  totalAscent: number;
  totalDescent: number;
  maxAltitude: number;
  avgHeartRate: number;
  maxHeartRate: number;
  avgCadence: number;
  totalCalories: number;
  avgSpeed: number;
  maxSpeed: number;
}

export const Workouts = {
  getAll(): Promise<Workout[]> {
    return new Promise((resolve, reject) => {
      trackBase<Workout>('workouts')
        .select({ view: 'Grid view' })
        .firstPage((err, records) => {
          if (err) {
            reject(err);
            return;
          }
          if (!records) {
            console.log('No records found');
            resolve([]);
            return;
          }

          resolve(records.map((record) => record.fields));
        });
    });
  },
};
