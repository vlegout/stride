import { ReactNode } from "react";
import { Box, Typography, Breadcrumbs, Link } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Link as RouterLink } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  variant?: "h4" | "h5" | "h6";
  spacing?: "compact" | "normal" | "spacious";
}

const PageHeader = ({ title, subtitle, breadcrumbs, actions, variant = "h4", spacing = "normal" }: PageHeaderProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getTitleVariant = () => {
    if (isMobile) {
      switch (variant) {
        case "h4":
          return "h5";
        case "h5":
          return "h6";
        default:
          return variant;
      }
    }
    return variant;
  };

  const getSpacing = () => {
    switch (spacing) {
      case "compact":
        return { xs: 1, sm: 2 };
      case "spacious":
        return { xs: 3, sm: 4 };
      default:
        return { xs: 2, sm: 3 };
    }
  };

  return (
    <Box
      sx={{
        mb: getSpacing(),
        textAlign: "center",
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          aria-label="breadcrumb"
          sx={{
            mb: 1,
            justifyContent: "center",
            "& .MuiBreadcrumbs-ol": {
              justifyContent: "center",
            },
          }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            if (isLast || !crumb.to) {
              return (
                <Typography
                  key={index}
                  color="text.primary"
                  variant="body2"
                  sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
                >
                  {crumb.label}
                </Typography>
              );
            }

            return (
              <Link
                key={index}
                component={RouterLink}
                to={crumb.to}
                underline="hover"
                color="inherit"
                variant="body2"
                sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
              >
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: actions ? "row" : "column" },
          gap: { xs: 1, sm: 2 },
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant={getTitleVariant()}
            component="h1"
            gutterBottom={!!subtitle}
            sx={{
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontSize: isMobile ? "0.875rem" : "1rem",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {actions && (
          <Box
            sx={{
              flexShrink: 0,
              alignSelf: { xs: "center", sm: "flex-start" },
            }}
          >
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;
