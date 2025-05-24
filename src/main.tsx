import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Home from "./pages/Home";
import ActivitiesPage from "./pages/Activities";
import ActivityPage from "./pages/Activity";
import Profile from "./pages/Profile";
import Races from "./pages/Races";
import Layout from "./components/Layout";

import "leaflet/dist/leaflet.css";

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
        path: "/races",
        element: <Races />,
      },
    ],
  },
]);

const queryClient = new QueryClient();

/* eslint-disable */

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider value={defaultSystem}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ChakraProvider>
  </StrictMode>,
);

/* eslint-enable */
