import { describe, it, expect } from "vitest";
import { type } from "arktype";
import { NonEmptyString, DistanceRange, FileExtension, Sport, Activity, ActivitiesResponse, User } from "../src/types";

describe("validation", () => {
  describe("NonEmptyString", () => {
    it("should accept non-empty strings", () => {
      const result = NonEmptyString("hello");
      expect(result).toBe("hello");
    });

    it("should trim strings and accept non-empty content", () => {
      const result = NonEmptyString("  hello  ");
      expect(result).toBe("hello");
    });

    it("should reject empty strings", () => {
      const result = NonEmptyString("");
      expect(result instanceof type.errors).toBe(true);
    });

    it("should reject strings with only whitespace", () => {
      const result = NonEmptyString("   ");
      expect(result instanceof type.errors).toBe(true);
    });
  });

  describe("DistanceRange", () => {
    it("should accept valid distance ranges", () => {
      const result = DistanceRange([0, 100]);
      expect(result).toEqual([0, 100]);
    });

    it("should accept different numeric ranges", () => {
      const result = DistanceRange([10, 50]);
      expect(result).toEqual([10, 50]);
    });

    it("should reject non-array input", () => {
      const result = DistanceRange(123);
      expect(result instanceof type.errors).toBe(true);
    });

    it("should reject arrays with wrong length", () => {
      const result = DistanceRange([1, 2, 3]);
      expect(result instanceof type.errors).toBe(true);
    });

    it("should reject arrays with non-numeric values", () => {
      const result = DistanceRange(["0", "100"]);
      expect(result instanceof type.errors).toBe(true);
    });
  });

  describe("FileExtension", () => {
    it("should accept .fit files", () => {
      const result = FileExtension("activity.fit");
      expect(result).toBe("activity.fit");
    });

    it("should accept .zip files", () => {
      const result = FileExtension("activities.zip");
      expect(result).toBe("activities.zip");
    });

    it("should accept .FIT files (uppercase)", () => {
      const result = FileExtension("ACTIVITY.FIT");
      expect(result).toBe("ACTIVITY.FIT");
    });

    it("should accept .ZIP files (uppercase)", () => {
      const result = FileExtension("ACTIVITIES.ZIP");
      expect(result).toBe("ACTIVITIES.ZIP");
    });

    it("should reject other file extensions", () => {
      const result = FileExtension("document.txt");
      expect(result instanceof type.errors).toBe(true);
    });

    it("should reject files without extensions", () => {
      const result = FileExtension("noextension");
      expect(result instanceof type.errors).toBe(true);
    });
  });

  describe("Sport", () => {
    it("should accept valid sports", () => {
      expect(Sport("running")).toBe("running");
      expect(Sport("cycling")).toBe("cycling");
      expect(Sport("swimming")).toBe("swimming");
    });

    it("should reject invalid sports", () => {
      const result = Sport("soccer");
      expect(result instanceof type.errors).toBe(true);
    });
  });

  describe("Activity validator", () => {
    const validActivity = {
      id: "886313e1-3b8a-5372-9b90-0c9aee199e5d",
      fit: "s3://bucket/file.fit",
      title: "Morning Run",
      description: "Great run",
      sport: "running",
      device: "Garmin",
      race: false,
      start_time: 1609459200,
      total_timer_time: 3600,
      total_elapsed_time: 3700,
      total_distance: 10000,
      total_ascent: 100,
      avg_speed: 10,
      avg_heart_rate: 150,
      max_heart_rate: 180,
      avg_cadence: null,
      max_cadence: null,
      avg_power: 200,
      max_power: 300,
      np_power: 210,
      total_calories: 500,
      total_training_effect: 3.5,
      training_stress_score: 50,
      intensity_factor: 0.8,
      avg_temperature: 20,
      max_temperature: 25,
      min_temperature: 15,
      pool_length: null,
      num_lengths: null,
      lat: 45.0,
      lon: 2.0,
      delta_lat: 0.1,
      delta_lon: 0.1,
      city: "Paris",
      country: "France",
    };

    it("should accept valid activity", () => {
      const result = Activity(validActivity);
      if (result instanceof type.errors) {
        throw new Error(`Validation failed: ${result.summary}`);
      }
      expect(result).toEqual(validActivity);
    });

    it("should reject activity with invalid sport", () => {
      const result = Activity({ ...validActivity, sport: "invalid" });
      expect(result instanceof type.errors).toBe(true);
    });

    it("should reject activity with invalid UUID", () => {
      const result = Activity({ ...validActivity, id: "not-a-uuid" });
      expect(result instanceof type.errors).toBe(true);
    });

    it("should reject activity with missing required field", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { title, ...withoutTitle } = validActivity;
      const result = Activity(withoutTitle);
      expect(result instanceof type.errors).toBe(true);
    });

    it("should accept activity with null city and country", () => {
      const activityWithNull = { ...validActivity, city: null, country: null };
      const result = Activity(activityWithNull);
      if (result instanceof type.errors) {
        throw new Error(`Validation failed: ${result.summary}`);
      }
      expect(result).toEqual(activityWithNull);
    });
  });

  describe("ActivitiesResponse validator", () => {
    const validResponse = {
      activities: [],
      pagination: {
        page: 1,
        per_page: 20,
        total: 100,
      },
    };

    it("should accept valid response", () => {
      const result = ActivitiesResponse(validResponse);
      expect(result instanceof type.errors).toBe(false);
    });

    it("should reject response without pagination", () => {
      const result = ActivitiesResponse({ activities: [] });
      expect(result instanceof type.errors).toBe(true);
    });

    it("should reject response with invalid pagination", () => {
      const result = ActivitiesResponse({
        activities: [],
        pagination: { page: "1", per_page: 20, total: 100 },
      });
      expect(result instanceof type.errors).toBe(true);
    });
  });

  describe("User validator", () => {
    const validUser = {
      id: "user123",
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      google_id: "google123",
      google_picture: "https://example.com/pic.jpg",
      map: "leaflet",
      created_at: "2021-01-01T00:00:00Z",
      updated_at: "2021-01-01T00:00:00Z",
    };

    it("should accept valid user", () => {
      const result = User(validUser);
      expect(result instanceof type.errors).toBe(false);
    });

    it("should accept user without google_picture field", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { google_picture, ...userWithoutPicture } = validUser;
      const result = User(userWithoutPicture);
      if (result instanceof type.errors) {
        throw new Error(`Validation failed: ${result.summary}`);
      }
      expect(result).toBeDefined();
    });

    it("should reject user with invalid map type", () => {
      const result = User({ ...validUser, map: "googlemaps" });
      expect(result instanceof type.errors).toBe(true);
    });

    it("should accept valid map types", () => {
      expect(User({ ...validUser, map: "leaflet" }) instanceof type.errors).toBe(false);
      expect(User({ ...validUser, map: "openlayers" }) instanceof type.errors).toBe(false);
      expect(User({ ...validUser, map: "mapbox" }) instanceof type.errors).toBe(false);
    });
  });
});
