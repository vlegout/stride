import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";

import LoadingIndicator from "./LoadingIndicator";

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>;
  loadingMessage?: string;
  errorMessage?: string;
  skeleton?: ReactNode;
  children: (data: T) => ReactNode;
}

function QueryBoundary<T>({
  query,
  loadingMessage = "Loading...",
  errorMessage = "Failed to load data. Please try again.",
  skeleton,
  children,
}: QueryBoundaryProps<T>) {
  const loading = skeleton ? (
    <div role="status" aria-busy="true" aria-label={loadingMessage}>
      {skeleton}
    </div>
  ) : (
    <LoadingIndicator message={loadingMessage} />
  );

  if (query.isPending) {
    return loading;
  }

  if (query.error) {
    return (
      <Alert
        severity="error"
        sx={{ m: 3 }}
        action={
          <Button color="inherit" size="small" onClick={() => query.refetch()}>
            Retry
          </Button>
        }
      >
        {errorMessage}
      </Alert>
    );
  }

  if (query.data === undefined) {
    return loading;
  }

  return <>{children(query.data)}</>;
}

export default QueryBoundary;
