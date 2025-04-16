# Sleepy - Utility Scripts

This directory contains utility scripts for the Sleepy application.

## User Generation Scripts

The `create-users-fixed-names.mjs` script creates 24 synthetic users with authentic Kazakh names for testing and development purposes.

## Sleep Entry Generation Script

The `generate-sleep-entries.mjs` script creates synthetic sleep entry data for all users starting from March 27th.

## Test Result Generation Script

The `generate-test-results.mjs` script creates synthetic critical thinking test results for all users starting from March 27th.

### Prerequisites

- Node.js installed (v14+ recommended)
- Firebase JavaScript SDK installed: `yarn add firebase`

### Setup

1. Verify your Firebase configuration in `scripts/firebase-config.js`:
   ```js
   // Firebase configuration - should match your project
   module.exports = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     // ... other config values
   };
   ```
   The values are pre-filled from your `.env.local` file but you should verify they are correct.

### Usage

#### Step 1: Generate Users
First, create the synthetic users:
```
yarn node scripts/create-users-fixed-names.mjs
```

#### Step 2: Generate Sleep Data
Next, generate sleep entries for all users:
```
yarn node scripts/generate-sleep-entries.mjs
```

#### Step 3: Generate Test Results
Finally, generate test results for all users:
```
yarn node scripts/generate-test-results.mjs
```

### Data Correlation

The scripts intelligently correlate data for research validity:

1. Sleep data affects test performance (quality, duration, screen time, etc.)
2. Student age/grade influences sleep patterns and test performance
3. Test results include realistic alertness ratings based on sleep data
4. Weekday/weekend patterns are factored into data generation

### Notes

- All scripts handle existing entries gracefully (skips without error)
- A small delay is added between operations to avoid hitting Firebase rate limits
- If you encounter issues with modules not being found, make sure to use the `yarn node` command 