"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "../supabase";
import { error } from "console";

export const createCompanion = async (formData: CreateCompanion) => {
  const { userId: author } = await auth();
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("companions")
    .insert({ ...formData, author })
    .select();

  if (error || !data)
    throw new Error(error?.message || "Failed to Create Companion");

  return data[0];
};

export const getAllCompanions = async ({
  limit = 10,
  page = 1,
  subject,
  topic,
}: GetAllCompanions) => {
  const supabase = createSupabaseClient();

  let query = supabase.from("companions").select();

  if (subject) {
    query = query.ilike("subject", `%${subject}%`);
  }

  if (topic) {
    query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
  }

  query = query.range((page - 1) * limit, page * limit - 1);

  const { data: companions, error } = await query;

  if (error) {
    throw new Error(error?.message);
  }

  return companions;
};

export const getCompanion = async (id: string) => {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("companions")
    .select()
    .eq("id", id);

  if (error) {
    throw new Error(error?.message);
  }
  return data[0];
};

export const addToSessionHistory = async (companionId: string) => {
  const { userId } = await auth();
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("session_history")
    .insert({ companion_id: companionId, user_id: userId });

  if (error) {
    throw new Error(error?.message || "Failed to add to History");
  }

  return data;
};

export const getRecentSessions = async (limit = 10) => {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("session_history")
    .select(`companions: companion_id (*)`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error?.message || "Failed to fetch History");
  }

  return data.map(({ companions }) => companions);
};

export const getUserCompanions = async (userId: string) => {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("companions")
    .select()
    .eq("author", userId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error?.message || "Failed to fetch History");
  }

  return data;
};
export const getUserSessions = async (userId: string, limit = 10) => {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("session_history")
    .select(`companions: companion_id (*)`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error?.message || "Failed to fetch History");
  }

  return data.map(({ companions }) => companions);
};

export const newCompanionPermissions = async () => {
  const { userId, has } = await auth();
  const supabase = createSupabaseClient();

  let limit = 0;

  if (has({ plan: "premium" })) {
    return true;
  } else if (has({ feature: "15_companion_limit" })) {
    limit = 15;
  } else if (has({ feature: "3_companion_limit" })) {
    limit = 3;
  }

  const { data, error } = await supabase
    .from("companions")
    .select("id", { count: "exact" })
    .eq("author", userId);

  if (error) throw new Error(error?.message);

  const count = data.length;
  if (limit > count) return true;
  return false;
};

export const newSessionPermissions = async () => {
  const { userId, has } = await auth();
  // 🚫 Not logged in
  if (!userId) return false;
  const supabase = createSupabaseClient();

  // 📅 30 days filter
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count, error } = await supabase
    .from("session_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  if (error) {
    throw new Error(error.message || "Failed to fetch session count");
  }

  const sessionCount = count ?? 0;
  console.log(sessionCount);
  // 💎 Premium = unlimited
  if (has({ plan: "premium" })) {
    return true;
  }

  let limit = 0;

  if (has({ plan: "premium" })) {
    return true;
  } else if (has({ feature: "30_conversations_month" })) {
    limit = 30;
  } else if (has({ feature: "5_conversations_month" })) {
    limit = 5;
  }

  return sessionCount < limit;
};
