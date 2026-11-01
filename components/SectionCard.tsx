"use client";

import { motion } from "framer-motion";

export default function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-mist-gray bg-white p-6"
    >
      <div className="font-sans text-lg">{title}</div>
      <div className="mt-3">{children}</div>
    </motion.div>
  );
}
