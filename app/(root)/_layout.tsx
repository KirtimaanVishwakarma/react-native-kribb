import { useUserSync } from "@/hooks/useUserSync";
import { Slot } from "expo-router";

export default function RootLayout() {
  // sync Clerk user -> Supabase
  useUserSync();

  return <Slot />;
}