import { Box } from "@mui/material";
import { motion } from "framer-motion";
import { colors } from "../../colors";

interface SkeletonProps {
  variant?: "text" | "rectangular" | "circular" | "card";
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

const Skeleton = ({ variant = "rectangular", width, height, borderRadius }: SkeletonProps) => {
  const getStyles = () => {
    switch (variant) {
      case "text":
        return {
          width: width || "100%",
          height: height || "1em",
          borderRadius: borderRadius || "4px",
        };
      case "circular":
        return {
          width: width || 40,
          height: height || 40,
          borderRadius: "50%",
        };
      case "card":
        return {
          width: width || "100%",
          height: height || 120,
          borderRadius: borderRadius || "12px",
        };
      default:
        return {
          width: width || "100%",
          height: height || 100,
          borderRadius: borderRadius || "8px",
        };
    }
  };

  return (
    <Box
      component={motion.div}
      animate={{
        background: [
          `linear-gradient(90deg, ${colors.grey[100]} 0%, ${colors.grey[200]} 50%, ${colors.grey[100]} 100%)`,
          `linear-gradient(90deg, ${colors.grey[200]} 0%, ${colors.grey[100]} 50%, ${colors.grey[200]} 100%)`,
        ],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      sx={{
        ...getStyles(),
        backgroundSize: "200% 100%",
      }}
    />
  );
};

interface SkeletonCardProps {
  showImage?: boolean;
}

export const SkeletonCard = ({ showImage = true }: SkeletonCardProps) => {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: "12px",
        bgcolor: colors.white,
        border: `1px solid ${colors.grey[200]}`,
      }}
    >
      {showImage && <Skeleton variant="rectangular" height={160} borderRadius="8px" />}
      <Box sx={{ mt: showImage ? 2 : 0 }}>
        <Skeleton variant="text" width="60%" height="1.5em" />
        <Box sx={{ mt: 1 }}>
          <Skeleton variant="text" width="100%" />
        </Box>
        <Box sx={{ mt: 0.5 }}>
          <Skeleton variant="text" width="80%" />
        </Box>
      </Box>
      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        <Skeleton variant="rectangular" width={60} height={32} borderRadius="6px" />
        <Skeleton variant="rectangular" width={60} height={32} borderRadius="6px" />
        <Skeleton variant="rectangular" width={60} height={32} borderRadius="6px" />
      </Box>
    </Box>
  );
};

export const SkeletonStats = () => {
  return (
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      {[1, 2, 3, 4].map((i) => (
        <Box
          key={i}
          sx={{
            flex: "1 1 120px",
            p: 2,
            borderRadius: "8px",
            bgcolor: colors.grey[50],
          }}
        >
          <Skeleton variant="text" width="40%" height="2em" />
          <Box sx={{ mt: 1 }}>
            <Skeleton variant="text" width="60%" height="0.875em" />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export const SkeletonChart = () => {
  return (
    <Box sx={{ width: "100%", height: 300 }}>
      <Skeleton variant="rectangular" height="100%" borderRadius="8px" />
    </Box>
  );
};

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => {
  return (
    <Box>
      <Skeleton variant="rectangular" height={48} borderRadius="8px 8px 0 0" />
      {Array.from({ length: rows }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: "flex",
            gap: 2,
            p: 1.5,
            borderBottom: `1px solid ${colors.grey[100]}`,
          }}
        >
          <Skeleton variant="text" width="20%" />
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="text" width="25%" />
          <Skeleton variant="text" width="25%" />
        </Box>
      ))}
    </Box>
  );
};

export default Skeleton;
