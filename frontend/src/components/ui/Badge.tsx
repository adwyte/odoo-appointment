interface BadgeProps {
  variant: "success" | "warning" | "error" | "info" | "default";
  children: React.ReactNode;
}

export default function Badge({ variant, children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
