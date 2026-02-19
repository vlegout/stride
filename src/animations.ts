import type { Variants, Transition } from "framer-motion";

// Shared transition configs
export const transitions = {
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  } as Transition,
  smooth: {
    type: "tween",
    duration: 0.3,
    ease: [0.25, 0.1, 0.25, 1],
  } as Transition,
  snappy: {
    type: "spring",
    stiffness: 500,
    damping: 35,
  } as Transition,
};

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Fade in variants for sections
export const fadeInVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Stagger children variants
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 16,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Scale on hover variants
export const hoverScaleVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: transitions.snappy,
  },
  tap: {
    scale: 0.98,
    transition: transitions.snappy,
  },
};

// Card hover variants with lift effect
export const cardHoverVariants: Variants = {
  initial: {
    y: 0,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
  },
  hover: {
    y: -4,
    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.12)",
    transition: transitions.smooth,
  },
};

// Skeleton pulse animation
export const skeletonVariants: Variants = {
  initial: {
    opacity: 0.4,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 1,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    },
  },
};
