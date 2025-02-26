import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";

interface SleepEntry {
  id: string;
  date: Date;
  sleepTime: Date;
  wakeTime: Date;
  sleepQuality: number;
  userId: string;
}

interface TestEntry {
  id: string;
  completedAt: Date;
  userId: string;
}

export const getSleepEntries = async (
  userId: string,
  limit_count = 30
): Promise<SleepEntry[]> => {
  try {
    const sleepRef = collection(db, "sleepEntries");
    // Using only userId filter and date ordering
    const q = query(
      sleepRef,
      where("userId", "==", userId),
      orderBy("date", "desc"),
      limit(limit_count)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        sleepTime: doc.data().sleepTime?.toDate(),
        wakeTime: doc.data().wakeTime?.toDate(),
      })
    ) as SleepEntry[];
  } catch (error) {
    console.error("Error fetching sleep entries:", error);
    return [];
  }
};

export const getTodayEntries = async (
  userId: string,
  startOfToday: Date,
  endOfToday: Date
): Promise<{ hasSleepEntry: boolean; hasTestEntry: boolean }> => {
  try {
    // For sleep entries, just get today's entries by userId
    const sleepRef = collection(db, "sleepEntries");
    const sleepQuery = query(sleepRef, where("userId", "==", userId));
    const sleepSnapshot = await getDocs(sleepQuery);
    const hasSleepEntry = sleepSnapshot.docs.some(
      (doc: QueryDocumentSnapshot<DocumentData>) => {
        const date = doc.data().date?.toDate();
        return date >= startOfToday && date <= endOfToday;
      }
    );

    // For test entries, just get today's entries by userId
    const testRef = collection(db, "testResults");
    const testQuery = query(testRef, where("userId", "==", userId));
    const testSnapshot = await getDocs(testQuery);
    const hasTestEntry = testSnapshot.docs.some(
      (doc: QueryDocumentSnapshot<DocumentData>) => {
        const completedAt = doc.data().startTime?.toDate();
        return completedAt >= startOfToday && completedAt <= endOfToday;
      }
    );

    return {
      hasSleepEntry,
      hasTestEntry,
    };
  } catch (error) {
    console.error("Error checking today entries:", error);
    return {
      hasSleepEntry: false,
      hasTestEntry: false,
    };
  }
};
