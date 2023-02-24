import { PropsWithChildren } from 'react';
import { ExternalLink as ExternalLinkIcon } from 'react-feather';

type Props = PropsWithChildren<
  {
    showIcon: boolean;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>
>;

export function ExternalLink({ children, showIcon = false, ...props }: Props) {
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
