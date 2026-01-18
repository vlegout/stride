import { ReactNode } from "react";
import { motion, MotionStyle } from "framer-motion";
import { cardHoverVariants } from "../../animations";
import { colors } from "../../colors";

interface AnimatedCardProps {
  children: ReactNode;
  enableHover?: boolean;
  className?: string;
}

const baseStyle: MotionStyle = {
  backgroundColor: colors.white,
  borderRadius: "12px",
  border: `1px solid ${colors.grey[200]}`,
  overflow: "hidden",
};

const AnimatedCard = ({ children, enableHover = true, className }: AnimatedCardProps) => {
  const style: MotionStyle = {
    ...baseStyle,
    cursor: enableHover ? "pointer" : "default",
  };

  const hoverProps = enableHover ? { whileHover: "hover" as const } : {};

  return (
    <motion.div initial="initial" variants={cardHoverVariants} className={className} style={style} {...hoverProps}>
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
