import { motion } from "framer-motion";

export default function Loader({ size = 32 }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `${Math.max(2, size / 8)}px solid rgba(255,255,255,0.2)`,
        borderTop: `${Math.max(2, size / 8)}px solid rgb(124,58,237)`,
      }}
    />
  );
}
