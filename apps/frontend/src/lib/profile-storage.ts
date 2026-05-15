import { defaultProfile, type UserProfile } from "../types/profile";

const STORAGE_KEY = "eatiq.profile";

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultProfile };
    return { ...defaultProfile, ...JSON.parse(raw) } as UserProfile;
  } catch {
    return { ...defaultProfile };
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
