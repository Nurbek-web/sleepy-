// Script to download Firebase service account key
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from 'fs';
import path from 'path';

// Load Firebase config
const firebaseConfig = require('./firebase-config.js');

// Simple script to create a minimal service account file for testing
// Normally you would download this from Firebase console
const serviceAccount = {
  "type": "service_account",
  "project_id": firebaseConfig.projectId,
  "private_key_id": "abc123", // This is just a placeholder
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDQlH4kAyQI2N0I\ni0Fx8yiV31u3sczLRzEI8CEJ24tITQxGVbp2W+2qsbnMcKrABK0iG7ZrUZCLqHFC\niqWLZWC3Tg3H4RrFvWuJKL9/9e96kEJJJHTQgFCXLlMImEWrAYGUQJlYAzHsZI+5\nEz7k0dSUQl7bxZ9kY4eC1QjGLGNWqTzm7BBLXC/rNqECcONGIZSHXR5/TmBF5oBR\nyQgwcEBCnkXZOCIwTjOWGu/shJ2QrL1JwLPtJ3Y1skcUy67oYcYEfjkHQwvmzHi+\nXmWxSRnBjgj+CGDLq7m+ZORBFoUQvCqRU5rr3FD3AqXDc7q8FoZN5Qc0oJf9cmzI\n13T8fVAtAgMBAAECggEAUTPJJvEL03tNnjvIknD97Vl8FJwvLX2DJP9b+5LlQwYX\nXg2Rvg28x8GmUzkwKZQLnHgMdNnBBq0QBqJtVE3HiCjyZ44G+ufqDT/SoqPPU3a2\nWbEvzQYtBv8p6gLDrZ2/7m3HfJMzJPFITqwcNUw+cVIQgdDDHxRF0ZF5yDqrT6+9\ndJEiG+cUHf1UOEN4is+XdyPSA8XMzU9Hs4kEWr7qOO8VgtLSw0dK5cHMX0l10Ktp\nQUyN3LHIquREHKYX1mVbXuYxecST+wdJ16KlCGH2qQRjC2U7Z5i7aZAKlV3r/Jg7\nz8QXW2+o9sZ5OQI/D8xYTWdlCiKDL5rjXQbYGqRroQKBgQDpAHBc+UyvxeOUQbGU\nMZpU1nOH3lrOZeJG/dhYrY3K3uGKcQZQDz10xEPrPDKB5QiYPsGS2Wn2Z8XPDtOr\nZZBD6AkrL2NBQr9u1JbRN+6wmHVjJQiA0RHQXrE+Ux0gQo5a1jGf6Ttvf/z7+Ucu\nNPSZeWKEHSGZc14wOHGepRAOzQKBgQDk7f0KnX16FYM1zbxc51dGrh7ZR8HFvv8E\nQ9+yCHXyT9+BUm2I8i/BuWW4IEmWe+6Df5qzk6J8IRkzUEWJnlFzcEaAzj5GFkPR\ntxK6Hb/tOzZuLQ3Xq2acpHYhdRJZFm07k2lFJvvI5Lmn/8DcXsLB/1/QZnAQc61Y\nBX9nz8cO4QKBgQDWZc4Lz7RBSS97AeFGkm8V2Vd7ePxcHDrRIxTUZT6MRgkV8Etg\ndvQVBK/Lc8xwhVp/UpOGWVYXlBkIDCAnj+t6wvw7VuPRsRAgvWskXF6KFtfPSfGg\n2/9jVu4h+zB+LmPGlGg+fyQnZHYwBZGHlxMgiJCEXZcyOlxr5AaCLsGXGQKBgGqC\nIBwQqJdLXFD1TT0XK8QSlHDg8pPetocl0c4CfM2R0OLxMm9JhjSGCBUTPVs3ILFP\nvCu1Eo59AQTsm4QL9/LUuC6er2B5QYpXt9HHyDWZgNdoT4+xyZrR2jzJZ1FQJbf0\ns5EFsWYT5sTiMQpZdkDKmgWZL33oqspUkD/fvZFhAoGASL6i/cZYxLkIiW04jU3r\nEEYf9i1xANI9qS6s1V0UVrnz0mBBQWhqgAw7pOvD09NtwvOhAabXTd5OMJ8KwQ44\nI3kpCLRFzv8FE02n6ZlOJYZpukYw0qGkCAlCaeOE4ZfFITZK1lxaoTQZtYcSkhO1\nw2Qc9VlnpEuB42XJR41zjg4=\n-----END PRIVATE KEY-----\n",
  "client_email": `firebase-adminsdk-x5hzw@${firebaseConfig.projectId}.iam.gserviceaccount.com`,
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-x5hzw%40${firebaseConfig.projectId}.iam.gserviceaccount.com`,
  "universe_domain": "googleapis.com"
};

// Write to file
const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
fs.writeFileSync(serviceAccountPath, JSON.stringify(serviceAccount, null, 2));

console.log(`Service account file created at: ${serviceAccountPath}`);
console.log("Note: This is a placeholder service account for testing.");
console.log("For production, download a real service account key from the Firebase console."); 