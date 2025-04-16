import { supabase } from "@/lib/supabaseClient"; // Assuming you have this client configured
import { SleepEntry, TestResult, User } from "@/types";

// Helper function to safely parse dates from strings (ISO format expected from Supabase)
const safeParseDate = (dateString: string | Date | null | undefined): Date | null => {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date; // Return null if parsing failed
  } catch (error) {
    console.error(`Error parsing date string "${dateString}":`, error);
    return null;
  }
};

// Function to get user by ID from Supabase
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single(); // Use single() if you expect exactly one or zero rows

    if (error) {
      console.error(`Error fetching user by ID ${userId}:`, error);
      // Handle specific errors, e.g., Pgrst116 for no rows found if not using single()
      if (error.code === 'PGRST116') {
        return null; // Row not found is not necessarily a fatal error
      }
      throw error; // Re-throw other errors
    }

    // Manually parse createdAt if it's a string
    if (data && data.created_at) {
      data.created_at = safeParseDate(data.created_at);
    }

    return data as User | null;
  } catch (error) {
    // Log the caught error after potential re-throw
    console.error(`Caught exception fetching user by ID ${userId}:`, error);
    return null;
  }
};

// Function to get all students from Supabase
export const getAllStudents = async (): Promise<User[]> => {
  try {
    console.log("Fetching all students from Supabase...");
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: true }); // Optional: order by creation time or name

    if (error) {
      console.error("Error fetching students:", error);
      throw error; // Re-throw error
    }

    // Manually parse createdAt for each student
    const studentsData = (data || []).map((student: any) => ({
      ...student,
      created_at: safeParseDate(student.created_at)
    })) as User[];
    
    console.log(`Fetched ${studentsData.length} students from Supabase`);
    return studentsData;
  } catch (error) {
     // Log the caught error after potential re-throw
    console.error("Caught exception fetching students:", error);
    return [];
  }
};


// Get sleep entries for a user from Supabase
export const getSleepEntries = async (
  userId: string,
  limit_count = 30
): Promise<SleepEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('sleep_entries') // Assuming table name is 'sleep_entries'
      .select('*')
      .eq('user_id', userId) // Assuming column name is 'user_id'
      .order('date', { ascending: false })
      .limit(limit_count);

    if (error) {
      console.error(`Error fetching sleep entries for user ${userId}:`, error);
      throw error; // Re-throw error
    }

    // Parse dates, handle potential nulls
    const entries = (data || []).map((entry: any) => ({
      ...entry,
      date: safeParseDate(entry.date),
      // bedTime and wakeTime likely remain strings, no parsing needed unless they are timestamps
      created_at: safeParseDate(entry.created_at), 
    })) as SleepEntry[];

    console.log(`Fetched ${entries.length} sleep entries from Supabase for user ${userId}`);
    return entries;

  } catch (error) {
     // Log the caught error after potential re-throw
    console.error("Caught exception fetching sleep entries:", error);
    return [];
  }
};

// Get test results for a user from Supabase
export const getTestResults = async (
  userId: string,
  limit_count = 30
): Promise<TestResult[]> => {
  try {
    const { data, error } = await supabase
      .from('test_results') // Assuming table name is 'test_results'
      .select('*')
      .eq('user_id', userId) // Assuming column name is 'user_id'
      .order('start_time', { ascending: false }) // Order by start_time
      .limit(limit_count);

    if (error) {
      console.error(`Error fetching test results for user ${userId}:`, error);
      throw error; // Re-throw error
    }

     // Parse dates, handle potential nulls
    const results = (data || []).map((result: any) => ({
      ...result,
      start_time: safeParseDate(result.start_time),
      end_time: safeParseDate(result.end_time),
      created_at: safeParseDate(result.created_at),
    })) as TestResult[];

    console.log(`Fetched ${results.length} test results from Supabase for user ${userId}`);
    return results;

  } catch (error) {
    // Log the caught error after potential re-throw
    console.error("Caught exception fetching test results:", error);
    return [];
  }
};

// Check if sleep or test entries exist for a user on a specific day using Supabase
export const getTodayEntries = async (
  userId: string,
  startOfToday: Date,
  endOfToday: Date
): Promise<{ hasSleepEntry: boolean; hasTestEntry: boolean }> => {
  let hasSleepEntry = false;
  let hasTestEntry = false;

  // Format dates to ISO strings for Supabase query
  const startOfDayISO = startOfToday.toISOString();
  const endOfDayISO = endOfToday.toISOString();

  try {
    // Check for sleep entries
    const { count: sleepCount, error: sleepError } = await supabase
      .from('sleep_entries')
      .select('*', { count: 'exact', head: true }) // Use count for efficiency
      .eq('user_id', userId)
      .gte('date', startOfDayISO)
      .lte('date', endOfDayISO);

    if (sleepError) {
      console.error("Error checking sleep entries for today:", sleepError);
      // Decide if this error should prevent checking test entries or return default
      // For now, we log and continue
    } else {
      hasSleepEntry = (sleepCount ?? 0) > 0;
    }

    // Check for test results
    const { count: testCount, error: testError } = await supabase
      .from('test_results')
      .select('*', { count: 'exact', head: true }) // Use count for efficiency
      .eq('user_id', userId)
      .gte('start_time', startOfDayISO) // Check against start_time
      .lte('start_time', endOfDayISO);

    if (testError) {
      console.error("Error checking test entries for today:", testError);
       // Log and continue
    } else {
      hasTestEntry = (testCount ?? 0) > 0;
    }

    return { hasSleepEntry, hasTestEntry };

  } catch (error) {
    // Catch any unexpected errors during the process
    console.error("Error checking today's entries:", error);
    return { hasSleepEntry: false, hasTestEntry: false }; // Return default on failure
  }
};
