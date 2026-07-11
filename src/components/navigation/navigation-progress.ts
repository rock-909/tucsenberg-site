interface NavigationClickState {
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

function isInternalNavigationLink(
  anchor: HTMLAnchorElement,
  currentHref: string,
): boolean {
  if (anchor.target === "_blank") {
    return false;
  }

  const href = anchor.getAttribute("href");
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return false;
  }

  try {
    const target = new URL(href, currentHref);
    const current = new URL(currentHref);

    if (target.origin !== current.origin) {
      return false;
    }

    return !(
      target.pathname === current.pathname && target.search === current.search
    );
  } catch {
    return false;
  }
}

export function shouldStartNavigationProgress(
  event: NavigationClickState,
  anchor: HTMLAnchorElement,
  currentHref: string,
): boolean {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (anchor.hasAttribute("download")) return false;

  return isInternalNavigationLink(anchor, currentHref);
}

export function getNavigationRouteKey(
  pathname: string,
  searchParams: Pick<URLSearchParams, "toString">,
): string {
  const search = searchParams.toString();
  return `${pathname}${search ? `?${search}` : ""}`;
}
