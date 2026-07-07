import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import type { User } from "../types/models";

const TOKEN_KEY = "tribu.accessToken";
const USER_KEY = "tribu.user";

interface SessionState {
  accessToken: string | null;
  user: User | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  signIn: (accessToken: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  /** Réservé au flux de vérification OTP : rend le token dispo pour l'appel `auth/me` avant d'avoir le profil complet. */
  setAccessTokenOnly: (accessToken: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  user: null,
  isHydrated: false,

  hydrate: async () => {
    const [accessToken, rawUser] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]).then(
      (entries) => entries.map(([, value]) => value),
    );
    set({
      accessToken,
      user: rawUser ? (JSON.parse(rawUser) as User) : null,
      isHydrated: true,
    });
  },

  signIn: async (accessToken, user) => {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, accessToken],
      [USER_KEY, JSON.stringify(user)],
    ]);
    set({ accessToken, user });
  },

  signOut: async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    set({ accessToken: null, user: null });
  },

  setAccessTokenOnly: async (accessToken) => {
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    set({ accessToken });
  },
}));
