import type { APIRoute } from 'astro';
import { Workouts } from '../../../lib/workouts';

export const get: APIRoute = async () => {
  const records = await Workouts.getAll();

  if (records.length === 0) {
    return new Response(null, {
      status: 404,
    });
  }

  return new Response(
    JSON.stringify({
      records,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      status: 200,
    }
  );
};
