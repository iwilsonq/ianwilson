import type { APIContext, APIRoute } from 'astro';
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
