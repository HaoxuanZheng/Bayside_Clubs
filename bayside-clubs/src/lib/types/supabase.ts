/*
 * src/lib/types/supabase.ts
 *
 * Supabase `Database` type in the shape produced by the Supabase CLI.
 * This references the concrete row/insert/update types from `database.ts`.
 */

import type {
  Profile,
  ProfileInsert,
  ProfileUpdate,
  Club,
  ClubInsert,
  ClubUpdate,
  Membership,
  MembershipInsert,
  MembershipUpdate,
  Event,
  EventInsert,
  EventUpdate,
  Registration,
  RegistrationInsert,
  RegistrationUpdate,
  Announcement,
  AnnouncementInsert,
  AnnouncementUpdate,
} from "./database";

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      clubs: {
        Row: Club;
        Insert: ClubInsert;
        Update: ClubUpdate;
      };
      memberships: {
        Row: Membership;
        Insert: MembershipInsert;
        Update: MembershipUpdate;
      };
      events: {
        Row: Event;
        Insert: EventInsert;
        Update: EventUpdate;
      };
      registrations: {
        Row: Registration;
        Insert: RegistrationInsert;
        Update: RegistrationUpdate;
      };
      announcements: {
        Row: Announcement;
        Insert: AnnouncementInsert;
        Update: AnnouncementUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type DatabaseSchema = Database;
