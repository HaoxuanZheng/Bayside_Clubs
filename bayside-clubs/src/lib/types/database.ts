/*
 * src/lib/types/database.ts
 *
 * Type definitions for BaysideClubs database tables.
 * - Strict TypeScript types
 * - Use `null` for nullable DB fields
 */

/* Enums */
export type ProfileRole = "student" | "admin";
export type MembershipRole = "member" | "officer" | "admin";
export type ClubCategory = "Academic" | "Arts" | "Sports" | "Service" | "Tech" | "Other";
export type RegistrationStatus = "confirmed" | "cancelled";

/* Rows */
export interface Profile {
  id: string; // uuid
  email: string;
  display_name: string | null;
  grade: number | null;
  role: ProfileRole;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string; // timestamptz
}

export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: ClubCategory | null;
  meeting_info: string | null;
  contact_email: string | null;
  cover_image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Membership {
  id: string;
  user_id: string; // references profiles.id
  club_id: string; // references clubs.id
  role: MembershipRole;
  joined_at: string;
}

export interface Event {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  is_published: boolean;
  created_by: string | null; // references profiles.id
  created_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  status: RegistrationStatus;
  registered_at: string;
}

export interface Announcement {
  id: string;
  club_id: string;
  title: string;
  body: string | null;
  created_by: string | null;
  created_at: string;
}

/* Insert types (omit id and created_at). Nullable DB fields use `null`.
 * Fields with server defaults are optional so inserts can omit them. */
export interface ProfileInsert {
  email: string;
  display_name?: string | null;
  grade?: number | null;
  role?: ProfileRole; // defaults to 'student'
  is_active?: boolean; // defaults to true
  avatar_url?: string | null;
}

export interface ClubInsert {
  name: string;
  slug: string;
  description?: string | null;
  category?: ClubCategory | null;
  meeting_info?: string | null;
  contact_email?: string | null;
  cover_image_url?: string | null;
  is_active?: boolean; // defaults to true
}

export interface MembershipInsert {
  user_id: string;
  club_id: string;
  role?: MembershipRole; // defaults to 'member'
  joined_at?: string;
}

export interface EventInsert {
  club_id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  starts_at: string;
  ends_at?: string | null;
  capacity?: number | null;
  is_published?: boolean; // defaults to false
  created_by?: string | null;
}

export interface RegistrationInsert {
  event_id: string;
  user_id: string;
  status?: RegistrationStatus; // defaults to 'confirmed'
  registered_at?: string;
}

export interface AnnouncementInsert {
  club_id: string;
  title: string;
  body?: string | null;
  created_by?: string | null;
}

/* Update types: all fields optional (suitable for PATCH/update payloads) */
export type ProfileUpdate = Partial<Omit<Profile, "id" | "created_at">>;
export type ClubUpdate = Partial<Omit<Club, "id" | "created_at">>;
export type MembershipUpdate = Partial<Omit<Membership, "id">>;
export type EventUpdate = Partial<Omit<Event, "id" | "created_at">>;
export type RegistrationUpdate = Partial<Omit<Registration, "id">>;
export type AnnouncementUpdate = Partial<Omit<Announcement, "id" | "created_at">>;

/* Composite / convenience types */
export interface ClubWithMemberCount extends Club {
  memberCount: number;
}

export interface EventWithRegistrationCount extends Event {
  registrationCount: number;
}

export interface ClubWithMembers extends Club {
  members: Membership[];
}

/* Export all as a named export default set is not used to keep strictness */
