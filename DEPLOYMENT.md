# Deploying LinePlanner

This guide will walk you through deploying the `LinePlanner` full-stack application.

## Prerequisites
- A **GitHub account** with this project pushed to a repository.
- A **Render account** (https://render.com) for the backend.
- A **Vercel account** (https://vercel.com) for the frontend.

## 1. Push Code to GitHub
Ensure your latest changes (including the `backend` folder updates) are pushed to your GitHub repository.

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

## 2. Deploy Backend (Render)
We will host the Node.js backend on Render as a Web Service.

1.  Log in to [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub account and select your `LinePlanner` repository.
4.  Standard Configuration:
    -   **Name**: `lineplanner-api` (or any unique name)
    -   **Region**: Choose the closest to you.
    -   **Branch**: `main`
    -   **Root Directory**: `backend` (⚠️ **CRITICAL: Do not miss this!**)
    -   **Runtime**: `Node`
    -   **Build Command**: `npm install`
    -   **Start Command**: `npm start`
5.  **Free Instance Type**: Select "Free".
6.  Click **Create Web Service**.

Wait for the deployment to finish. Once "Live", copy the **Service URL** from the top left (it will look like `https://lineplanner-api.onrender.com`).

## 3. Configure Frontend (Vercel)
Now we need to tell your Vercel frontend where to find the backend. as currently it is successfully deployed but fails to connect to backend as it attempts to connect to localhost

1.  Go to your project dashboard on **Vercel**.
2.  Navigate to **Settings** -> **Environment Variables**.
3.  Add a new variable:
    -   **Key**: `VITE_API_URL`
    -   **Value**: `<YOUR-RENDER-BACKEND-URL>` (paste the URL you copied from Render).
    -   **Environments**: Ensure Production, Preview, and Development are checked.
4.  Click **Save**.
5.  Go to the **Deployments** tab.
6.  Click the three dots (`...`) on the latest deployment and select **Redeploy**.
7.  Wait for the build to finish.

## 4. Verification
- Open your Vercel app URL.
- Try to create a line or fetch master data.
- Check the console (F12) regarding network requests; they should now be going to `https://lineplanner-api.onrender.com/...` instead of `localhost:4000`.
