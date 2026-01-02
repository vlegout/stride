import { ReactNode } from "react";
import { UseQueryResult } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";

import LoadingIndicator from "./LoadingIndicator";

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>;
  loadingMessage?: string;
  errorMessage?: string;
  children: (data: T) => ReactNode;
}

function QueryBoundary<T>({
  query,
  loadingMessage = "Loading...",
  errorMessage = "Failed to load data. Please try again.",
  children,
}: QueryBoundaryProps<T>) {
  if (query.isPending) {
    return <LoadingIndicator message={loadingMessage} />;
  }

  if (query.error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {errorMessage}
      </Alert>
    );
  }

  if (query.data === undefined) {
    return <LoadingIndicator message={loadingMessage} />;
  }

  return <>{children(query.data)}</>;
}

export default QueryBoundary;
