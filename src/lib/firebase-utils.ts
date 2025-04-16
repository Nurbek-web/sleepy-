import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Query,
  DocumentData,
  WhereFilterOp,
  OrderByDirection,
  QuerySnapshot
} from "firebase/firestore";
import { db } from "./firebase";

interface QueryConfig {
  collectionName: string;
  whereField?: string;
  whereOperator?: WhereFilterOp;
  whereValue?: any;
  orderByField?: string;
  orderDirection?: OrderByDirection;
  limitCount?: number;
}

/**
 * Executes a Firestore query with fallback for missing indexes
 * 
 * @param config Query configuration options
 * @returns The query snapshot with documents
 */
export async function executeQueryWithFallback(config: QueryConfig): Promise<QuerySnapshot<DocumentData>> {
  const {
    collectionName,
    whereField,
    whereOperator = "==",
    whereValue,
    orderByField,
    orderDirection = "asc",
    limitCount
  } = config;

  // Try the optimized query first (with ordering)
  try {
    let q: Query<DocumentData> = collection(db, collectionName);
    
    // Add where clause if specified
    if (whereField && whereValue !== undefined) {
      q = query(q, where(whereField, whereOperator, whereValue));
    }
    
    // Add orderBy if specified
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    
    // Add limit if specified
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    // Execute the query
    return await getDocs(q);
  } catch (error: any) {
    // Check if it's an index error
    if (error && error.message && error.message.includes("requires an index")) {
      console.warn("Index error, falling back to basic query", error);
      
      // Fallback query without ordering
      let basicQuery: Query<DocumentData> = collection(db, collectionName);
      
      // Add where clause without ordering
      if (whereField && whereValue !== undefined) {
        basicQuery = query(basicQuery, where(whereField, whereOperator, whereValue));
      }
      
      return await getDocs(basicQuery);
    }
    
    // If it's not an index error, rethrow
    throw error;
  }
}

/**
 * Parses Firestore Date fields in document data
 * 
 * @param doc Document data
 * @param dateFields Array of field names that should be parsed as dates
 * @returns The document data with parsed dates
 */
export function parseFirestoreDates(doc: any, dateFields: string[]): any {
  const result = { ...doc };
  
  dateFields.forEach(field => {
    if (result[field] && typeof result[field].toDate === 'function') {
      result[field] = result[field].toDate();
    }
  });
  
  return result;
}

/**
 * Safely converts a value that might be a Firestore Timestamp to a JavaScript Date
 * Handles multiple timestamp formats and falls back to direct conversion if not a timestamp
 * 
 * @param value Value to convert (could be Timestamp, Date, string, or undefined)
 * @returns A JavaScript Date object, or undefined if the value can't be converted
 */
export function safeTimestampToDate(value: any): Date | undefined {
  try {
    if (!value) return undefined;
    
    // Case 1: Firestore Timestamp with toDate method
    if (typeof value === 'object' && typeof value.toDate === 'function') {
      return value.toDate();
    }
    
    // Case 2: Firestore Timestamp-like object with seconds and nanoseconds
    if (typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
      return new Date(value.seconds * 1000);
    }
    
    // Case 3: Already a Date object
    if (value instanceof Date) {
      return value;
    }
    
    // Case 4: String or number timestamp
    return new Date(value);
  } catch (error) {
    console.error("Error converting timestamp to date:", error, value);
    return undefined;
  }
} 