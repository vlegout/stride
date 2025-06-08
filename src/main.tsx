import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CssBaseline from "@mui/material/CssBaseline";

import Home from "./pages/Home";
import ActivitiesPage from "./pages/Activities";
import ActivityPage from "./pages/Activity";
import Profile from "./pages/Profile";
import Upload from "./pages/Upload";
import Layout from "./components/Layout";

import "leaflet/dist/leaflet.css";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
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
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/upload",
        element: <Upload />,
      },
      {
        path: "/races",
        element: <Home race={true} />,
      },
    ],
  },
]);

const queryClient = new QueryClient();

/* eslint-disable */

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CssBaseline />
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);

/* eslint-enable */
