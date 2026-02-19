import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { pageVariants } from "../../animations";

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants}>
      {children}
    </motion.div>
  );
};

export default PageTransition;
