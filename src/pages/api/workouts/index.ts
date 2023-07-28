import type { APIContext, APIRoute } from 'astro';
import { createKysely } from '@vercel/postgres-kysely';
import { Workouts } from '../../../lib/workouts';

export const get: APIRoute = async (context: APIContext) => {
  const limit = context.url.searchParams.get('limit');
  const records = await Workouts.getAll({ limit });

  if (records.length === 0) {
    return new Response(null, {
      status: 404,
    });
  }

  return new Response(JSON.stringify(records), {
    headers: {
      'Content-Type': 'application/json',
    },
    status: 200,
  });
};

export const post: APIRoute = async (context: APIContext) => {
  const db = createKysely<Database>();

  db.insertInto('workouts')
    .values({
      avg_cadence: 81,
      avg_speed: 3.5,
      duration: 3600,
      max_altitude: 556,
      max_speed: 4.3,
      name: 'A regular run',
      start_time: Math.floor(Date.now() / 1000),
      total_ascent: 670,
      total_calories: 700,
      total_descent: 214,
      avg_heart_rate: 163,
      max_heart_rate: 180,
    })
    .executeTakeFirst();

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
    },
    status: 200,
  });
};
