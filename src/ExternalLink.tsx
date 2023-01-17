import { ExternalLink as ExternalLinkIcon } from "react-feather";

export function ExternalLink({
  children,
  showIcon = false,
  ...props
}: {
  children: React.ReactNode;
  showIcon?: boolean;
  [x: string]: any;
}) {
  return (
    <a
      className="external-link"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children} {showIcon && <ExternalLinkIcon />}
    </a>
  );
}
