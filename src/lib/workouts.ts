import type { FieldSet } from 'airtable';
import dotenv from 'dotenv';
import queryString from 'query-string';

dotenv.config();

const BASE_ID = 'appRKlealQJaMbrRy';
const TABLE_NAME = 'workouts';
const BASE_URL = `https://api.airtable.com/v0/`;

const URL = `${BASE_URL}${BASE_ID}/${TABLE_NAME}`;

export interface Workout extends FieldSet {
  id: string;
  name: string;
  distance: number;
  duration: number;
  startTime: number;
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

interface AirtableRecord<T extends FieldSet> {
  id: string;
  createdAt: string;
  fields: T;
}

interface AirtableApiResponse<T extends FieldSet> {
  records: AirtableRecord<T>[];
}

export const Workouts = {
  getAll({ limit }: { limit: string | null }): Promise<Workout[]> {
    return new Promise((resolve, reject) => {
      const query = queryString.stringify({ limit });
      fetch(`${URL}?${query}`, {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          const records = (
            data as AirtableApiResponse<Workout>
          ).records.map((record) => {
            return { ...record.fields, id: record.id };
          });
          resolve(records as Workout[]);
        })
        .catch((err) => reject(err));
    });
  },
};
