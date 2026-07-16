# Firebase Project Setup for Tally v1.2

Follow these steps once before running the app.

## 1. Create the project

1. Open [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `tally-app`)
3. Disable Google Analytics if you prefer (optional)
4. Click **Create project** → **Continue**

## 2. Enable Email/Password Auth

1. Left sidebar → **Build** → **Authentication**
2. Click **Get started**
3. Open the **Sign-in method** tab
4. Enable **Email/Password** → **Save**

## 3. Create Firestore

1. Left sidebar → **Build** → **Firestore Database**
2. Click **Create database**
3. Choose a region close to your users (e.g. `us-east1` or `europe-west1`)
4. Start in **production mode**
5. Click **Create**

## 4. Publish security rules

1. Firestore → **Rules** tab
2. Replace the rules with the contents of `firestore.rules` in this repo
3. Click **Publish**

## 5. Register a Web app

1. Project Overview → gear icon → **Project settings**
2. Under **Your apps**, click the **</>** (Web) icon
3. App nickname: `Tally`
4. Do **not** check Firebase Hosting (you use AWS Amplify)
5. Click **Register app**
6. Copy the `firebaseConfig` values — you need:

| Firebase key | Env var name |
|---|---|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

## 6. Authorized domains (Amplify)

1. Authentication → **Settings** → **Authorized domains**
2. Add your Amplify domain (e.g. `main.xxxxx.amplifyapp.com`)
3. Keep `localhost` for local development

## 7. Local `.env`

```bash
cp .env.example .env
```

Fill in all six `VITE_FIREBASE_*` values from step 5.

## 8. Amplify environment variables

1. AWS Amplify Console → your app → **Hosting** → **Environment variables**
2. Add the same six `VITE_FIREBASE_*` keys
3. Redeploy so the build picks them up

## 9. Composite indexes

After you run the app and hit the first Firestore queries that need indexes,
Firebase will show a link in the browser console. Click it to create each index.
Typical indexes:

- `entries`: `monthKey` Asc + `date` Desc
- `contacts`: `stage` Asc + `updatedAt` Desc
- `interactions`: `contactId` Asc + `date` Desc

## Verify

1. `npm run dev`
2. Open `/signup`, create an account
3. Check Authentication → Users and Firestore → `users/{uid}` in the console
