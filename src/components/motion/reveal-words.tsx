import { cn } from "@/lib/utils";

interface RevealWordsProps {
  text: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
  once?: boolean;
  id?: string;
}

export function RevealWords({
  text,
  as: Tag = "span",
  className,
  id,
}: RevealWordsProps) {
  return (
    <Tag
      id={id}
      className={cn(className)}
      data-motion-state="visible"
      data-reduced-motion="true"
    >
      {text}
    </Tag>
  );
}

export function RevealHeading({
  text,
  as = "h2",
  className,
  id,
}: Omit<RevealWordsProps, "as"> & { as?: "h1" | "h2" | "h3" }) {
  return <RevealWords text={text} as={as} className={className} id={id} />;
}
