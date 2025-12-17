# Deployment Guide

## 1. Updating the Live Website (PWA)

Since you made changes to both the **Frontend** (React) and the **Backend** (PHP), you need to update both on SiteGround.

### A. Frontend (The Visuals)
1.  On your PC, verify you have run `npm run build` recently.
2.  Open your FTP client (FileZilla) or SiteGround File Manager.
3.  Go to the `dist` folder on your PC.
4.  **Upload ALL contents of `dist`** to your server's `public_html` folder (or wherever your site lives).
    *   *Note: This replaces your `index.html`, `assets/`, etc.*

### B. Backend (The Logic)
1.  **The API files are NOT in `/dist`.** They are separate server-side files.
2.  On your PC, look at the `/api` folder in your project root.
3.  **Upload the `/api` folder** to your server's `public_html/api` folder.
    *   *Critical: Ensure `api/common/auth-token.php` and the updated `session.php` are uploaded.*

---

## 2. Deploying to Google Play Store

To get your app into the Play Store, you need to generate a **Signed App Bundle (.aab)**.

### Prerequisites
*   A **Google Play Console** Developer Account ($25 one-time fee).
*   Your App Details prepared (Name, Description, Screenshots, Icon).

### Step 1: Generate Signed Bundle (Android Studio)
1.  Open your project in **Android Studio** (`mobile/android`).
2.  Go to **Build > Generate Signed Bundle / APK**.
3.  Select **Android App Bundle** and click **Next**.
4.  **Key Store Path**: Click "Create new...".
    *   **Path**: Save it somewhere safe (e.g., in your `__DEV` folder, NOT inside the build folders).
    *   **Password**: Create a strong password and **WRITE IT DOWN**. You cannot update your app if you lose this keystore or password.
    *   **Alias**: Key0 (default is fine).
    *   **Validity**: 25 years.
    *   **Certificate**: Fill in at least "First and Last Name".
5.  Click **Next**.
6.  Select **release** (not debug).
7.  Click **Create**.

**Result:** Android Studio will build the file. It will usually say "Locate" when done. The file defaults to `mobile/android/app/release/app-release.aab`.

### Step 2: Google Play Console Setup

#### A. Create the App
1.  Go to [Google Play Console](https://play.google.com/console).
2.  Click **Create App**.
3.  **App Name**: `Karl Golf GIR` (or your preferred name).
4.  **Language**: English (US).
5.  **App or Game**: App.
6.  **Free or Paid**: Free.

#### B. Store Listing (Main Store Landing Page)
*   **Short Description**: "Track your Golf GIR statistics and improvement." (Max 80 chars)
*   **Full Description**: detailed description of features (Max 4000 chars).
*   **Graphics**:
    *   **App Icon**: 512x512 PNG.
    *   **Feature Graphic**: 1024x500 PNG (Important! This is the banner).
    *   **Phone Screenshots**: At least 2 screenshots (you can take these on your phone and upload).

#### C. App Content (The "paperwork")
You must complete these sections in the Console dashboard:
1.  **Privacy Policy**: You *must* provide a URL.
    *   *Quick Fix*: Create a simple `privacy.html` in your website root (I can generate this for you).
    *   URL: `https://karlgolf.app/privacy.html`
2.  **Ads**: "No, my app does not contain ads".
3.  **App Access**: "All functionality is available without special access" OR "Restricted" if you want to give them a test login (Email: `test@test.com`, Pass: `password`). giving a test account is safer for review.
4.  **Target Audience**: 18+.

#### D. Data Safety Form (CRITICAL)
Google asks exactly what data you collect. Answer EXACTLY like this to avoid rejection:
1.  **Does your app collect or share any of the required user data types?** -> **Yes**.
2.  **Is all of the user data collected by your app encrypted in transit?** -> **Yes**.
3.  **Do you provide a way for users to request that their data be deleted?** -> **Yes** (Since you have "Delete Account" feature).

**Data Types to Select:**
*   **Location**:
    *   **Approximate Location** -> Collected -> App Functionality (Course Distance).
    *   **Precise Location** -> Collected -> App Functionality (if used for hole tracking).
*   **Personal Info**:
    *   **Email Address** -> Collected -> Account Management.
    *   **Name** -> Collected -> Account Management.

### Step 3: Upload Release
1.  Go to **Testing > Internal testing** (Create new release).
2.  **Upload** the `.aab` file you created in Android Studio.
3.  **Review release** -> **Start rollout**.
