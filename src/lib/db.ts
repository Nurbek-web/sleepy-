import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { SleepEntry } from "@/types";
import { executeQueryWithFallback } from "./firebase-utils";

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
        bedTime: doc.data().bedTime,
        wakeTime: doc.data().wakeTime,
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
    let hasSleepEntry = false;
    let hasTestEntry = false;

    try {
      // For sleep entries, use executeQueryWithFallback to handle index issues
      const sleepSnapshot = await executeQueryWithFallback({
        collectionName: "sleepEntries",
        whereField: "userId",
        whereOperator: "==",
        whereValue: userId
      });

      hasSleepEntry = sleepSnapshot.docs.some(
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          const date = doc.data().date?.toDate();
          return date >= startOfToday && date <= endOfToday;
        }
      );
    } catch (sleepError) {
      console.error("Error checking sleep entries:", sleepError);
      // Continue execution even if sleep entries check fails
    }

    try {
      // For test entries, use executeQueryWithFallback to handle index issues
      const testSnapshot = await executeQueryWithFallback({
        collectionName: "testResults",
        whereField: "userId",
        whereOperator: "==",
        whereValue: userId
      });

      hasTestEntry = testSnapshot.docs.some(
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          const completedAt = doc.data().startTime?.toDate();
          return completedAt >= startOfToday && completedAt <= endOfToday;
        }
      );
    } catch (testError) {
      console.error("Error checking test entries:", testError);
      // Continue execution even if test entries check fails
    }

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
