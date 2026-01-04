import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingIndicator from "./components/LoadingIndicator";

const Home = lazy(() => import("./pages/Home"));
const ActivitiesPage = lazy(() => import("./pages/Activities"));
const ActivityPage = lazy(() => import("./pages/Activity"));
const WeeksPage = lazy(() => import("./pages/Weeks"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Upload = lazy(() => import("./pages/Upload"));
const Fitness = lazy(() => import("./pages/Fitness"));
const Best = lazy(() => import("./pages/Best"));
const Login = lazy(() => import("./pages/Login"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));

import "leaflet/dist/leaflet.css";

import "@fontsource/roboto/latin-400.css";
import "@fontsource/roboto/latin-700.css";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/privacy",
    element: <PrivacyPolicy />,
  },
  {
    path: "/terms",
    element: <TermsOfService />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "/activities",
        element: <ActivitiesPage />,
      },
      {
        path: "/activities/:id",
        element: <ActivityPage />,
      },
      {
        path: "/weeks",
        element: <WeeksPage />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/settings",
        element: <Settings />,
      },
      {
        path: "/upload",
        element: <Upload />,
      },
      {
        path: "/fitness",
        element: <Fitness />,
      },
      {
        path: "/best",
        element: <Best />,
      },
    ],
  },
]);

const queryClient = new QueryClient();

/* eslint-disable */

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<LoadingIndicator message="Loading..." />}>
          <RouterProvider router={router} />
        </Suspense>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);

/* eslint-enable */
