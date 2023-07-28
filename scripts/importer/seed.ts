import { createKysely } from '@vercel/postgres-kysely';

import { Generated, sql } from 'kysely';

interface WorkoutsTable {
  id: Generated<string>;
  name: string;
  duration: number;
  start_time: number;
  total_ascent: number;
  total_descent: number;
  max_altitude: number;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  avg_cadence: number;
  total_calories: number;
  avg_speed: number;
  max_speed: number;
}

interface Database {
  workouts: WorkoutsTable;
}

const db = createKysely<Database>();

db.schema
  .createTable('workouts')
  .$call((builder) =>
    builder
      .addColumn('id', 'uuid', (col) =>
        col.primaryKey().defaultTo(sql`gen_random_uuid()`)
      )
      .addColumn('name', 'text')
      .addColumn('duration', 'integer')
      .addColumn('start_time', 'timestamp')
      .addColumn('total_ascent', 'integer')
      .addColumn('total_descent', 'integer')
      .addColumn('max_altitude', 'integer')
      .addColumn('avg_heart_rate', 'integer')
      .addColumn('max_heart_rate', 'integer')
      .addColumn('avg_cadence', 'integer')
      .addColumn('total_calories', 'integer')
      .addColumn('avg_speed', 'double precision')
      .addColumn('max_speed', 'double precision')
  )
  .execute();
