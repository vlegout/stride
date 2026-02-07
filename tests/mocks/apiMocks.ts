import type {
  Activity,
  ActivitiesResponse,
  Profile,
  User,
  WeeksResponse,
  FitnessResponse,
  BestPerformanceResponse,
  GoogleAuthResponse,
  ActivityZonesRawResponse,
} from "../../src/types";

export const createMockActivity = (overrides?: Partial<Activity>): Activity => ({
  id: "886313e1-3b8a-5372-9b90-0c9aee199e5d",
  fit: "s3://bucket/fit-file.fit",
  title: "Morning Run",
  description: "Great morning run",
  sport: "running",
  device: "Garmin Forerunner 945",
  race: false,
  start_time: 1704960000,
  total_timer_time: 1800,
  total_elapsed_time: 1900,
  total_distance: 5000,
  total_ascent: 100,
  avg_speed: 12.5,
  avg_heart_rate: 150,
  max_heart_rate: 180,
  avg_cadence: 85,
  max_cadence: 95,
  avg_power: 250,
  max_power: 350,
  np_power: 260,
  total_calories: 500,
  total_training_effect: 3.5,
  training_stress_score: 65,
  intensity_factor: 0.85,
  avg_temperature: 20,
  max_temperature: 25,
  min_temperature: 15,
  pool_length: null,
  num_lengths: null,
  lat: 48.8566,
  lon: 2.3522,
  delta_lat: 0.01,
  delta_lon: 0.01,
  city: "Paris",
  country: "France",
  ...overrides,
});

export const createMockActivitiesResponse = (activities: Activity[] = [], page = 1, total = 0): ActivitiesResponse => ({
  activities,
  pagination: {
    page,
    per_page: 20,
    total,
  },
});

export const createMockProfile = (): Profile => ({
  n_activities: 100,
  run_n_activities: 50,
  run_total_distance: 500000,
  cycling_n_activities: 40,
  cycling_total_distance: 1000000,
  swimming_n_activities: 10,
  swimming_total_distance: 50000,
  years: [
    {
      year: 2024,
      statistics: [
        { sport: "running", n_activities: 30, total_distance: 300000 },
        { sport: "cycling", n_activities: 25, total_distance: 500000 },
        { sport: "swimming", n_activities: 5, total_distance: 25000 },
      ],
    },
  ],
  zones: [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      user_id: "user-1",
      index: 1,
      type: "heart_rate",
      max_value: 140,
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      user_id: "user-1",
      index: 2,
      type: "heart_rate",
      max_value: 160,
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      user_id: "user-1",
      index: 3,
      type: "heart_rate",
      max_value: 180,
    },
  ],
});

export const createMockUser = (): User => ({
  id: "user-1",
  first_name: "Test",
  last_name: "User",
  email: "test@example.com",
  google_id: "google-123",
  google_picture: "https://example.com/pic.jpg",
  map: "leaflet",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
});

export const createMockWeeksResponse = (): WeeksResponse => ({
  weeks: [
    {
      week_start: "2024-01-01",
      week_number: 1,
      year: 2024,
      activities: [
        {
          id: "886313e1-3b8a-5372-9b90-0c9aee199e5d",
          title: "Morning Run",
          sport: "running",
          start_time: 1704960000,
          total_distance: 5000,
          total_timer_time: 1800,
          avg_speed: 12.5,
          avg_heart_rate: 150,
          avg_power: 250,
          race: false,
        },
      ],
      total_activities: 1,
      total_distance: 5000,
      total_time: 1800,
      total_tss: 65,
      sports_breakdown: {
        running: { distance: 5000, time: 1800, count: 1 },
        cycling: { distance: 0, time: 0, count: 0 },
        swimming: { distance: 0, time: 0, count: 0 },
      },
    },
  ],
  has_more: false,
  next_offset: 1,
});

export const createMockFitnessResponse = (): FitnessResponse => ({
  scores: [
    {
      date: "2024-01-01",
      overall: 75,
      running: 70,
      cycling: 80,
      swimming: 50,
    },
  ],
  weekly_tss: [
    {
      week_start: "2024-01-01",
      total_tss: 200,
    },
  ],
  weekly_running: [
    {
      week_start: "2024-01-01",
      distance: 50000,
      time: 14400,
    },
  ],
  weekly_cycling: [
    {
      week_start: "2024-01-01",
      distance: 100000,
      time: 10800,
    },
  ],
  weekly_swimming: [
    {
      week_start: "2024-01-01",
      distance: 2000,
      time: 1800,
    },
  ],
  weekly_zones: [
    {
      week_start: "2024-01-01",
      heart_rate_zones: [
        {
          zone_index: 1,
          total_time: 1000,
          running_time: 500,
          cycling_time: 500,
          max_value: 140,
        },
      ],
      pace_zones: [],
      power_zones: [],
    },
  ],
  ftp: [
    {
      date: "2024-01-01",
      ftp: 250,
    },
  ],
});

export const createMockBestPerformanceResponse = (): BestPerformanceResponse => ({
  sport: "running",
  parameter: "distance",
  performances: [
    {
      value: 5000,
      activity: createMockActivity(),
    },
  ],
});

export const createMockGoogleAuthResponse = (): GoogleAuthResponse => ({
  user: createMockUser(),
  token: {
    access_token: "new-access-token",
    token_type: "bearer",
    expires_in: 3600,
  },
});

export const createMockActivityZonesResponse = (): ActivityZonesRawResponse => ({
  heart_rate: [
    {
      id: "zone-activity-1",
      activity_id: "activity-123",
      zone_id: "zone-1",
      time_in_zone: 300,
      zone: {
        id: "zone-1",
        user_id: "user-1",
        index: 1,
        type: "heart_rate",
        max_value: 140,
      },
    },
    {
      id: "zone-activity-2",
      activity_id: "activity-123",
      zone_id: "zone-2",
      time_in_zone: 600,
      zone: {
        id: "zone-2",
        user_id: "user-1",
        index: 2,
        type: "heart_rate",
        max_value: 160,
      },
    },
  ],
  power: [
    {
      id: "zone-activity-3",
      activity_id: "activity-123",
      zone_id: "zone-3",
      time_in_zone: 400,
      zone: {
        id: "zone-3",
        user_id: "user-1",
        index: 1,
        type: "power",
        max_value: 200,
      },
    },
  ],
  pace: [],
});
