import React from "react";

export type IconName =
  | "search" | "map" | "layers" | "filter" | "list" | "grid" | "chart"
  | "book" | "book2" | "document" | "download" | "close"
  | "chevDown" | "chevRight" | "chevLeft" | "chevUp"
  | "plus" | "minus" | "info" | "settings" | "bell" | "help" | "user"
  | "sparkle" | "arrowRight" | "arrowUp" | "arrowDown"
  | "geo" | "domain" | "flow" | "shield" | "clock" | "compass"
  | "sliders" | "menu" | "expand" | "school" | "add" | "check"
  | "play" | "star" | "edit";

export interface SVGIconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  title?: string;
}

const SVGIcon: React.FC<SVGIconProps> = ({ name, size = 16, color = "currentColor", className, title }) => {
  const stroke = { fill: "none", stroke: color, strokeWidth: 1.25, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const fill = { fill: color };

  const paths: Record<IconName, React.ReactNode> = {
    search:    (<><circle cx="7" cy="7" r="4.25" {...stroke}/><line x1="13.5" y1="13.5" x2="10.2" y2="10.2" {...stroke}/></>),
    map:       (<><polygon points="2,4 6,2.5 10,4 14,2.5 14,12 10,13.5 6,12 2,13.5" {...stroke}/><line x1="6" y1="2.5" x2="6" y2="12" {...stroke}/><line x1="10" y1="4" x2="10" y2="13.5" {...stroke}/></>),
    layers:    (<><polygon points="8,2 14,5.5 8,9 2,5.5" {...stroke}/><polyline points="2,9.5 8,13 14,9.5" {...stroke}/></>),
    filter:    (<><polyline points="2,3 14,3 10,8 10,13 6,11.5 6,8 2,3" {...stroke}/></>),
    list:      (<><line x1="5" y1="4" x2="14" y2="4" {...stroke}/><line x1="5" y1="8" x2="14" y2="8" {...stroke}/><line x1="5" y1="12" x2="14" y2="12" {...stroke}/><circle cx="2.5" cy="4" r="0.5" {...fill}/><circle cx="2.5" cy="8" r="0.5" {...fill}/><circle cx="2.5" cy="12" r="0.5" {...fill}/></>),
    grid:      (<><rect x="2" y="2" width="5" height="5" {...stroke}/><rect x="9" y="2" width="5" height="5" {...stroke}/><rect x="2" y="9" width="5" height="5" {...stroke}/><rect x="9" y="9" width="5" height="5" {...stroke}/></>),
    chart:     (<><polyline points="2,12 6,8 9,10 14,4" {...stroke}/><line x1="2" y1="14" x2="14" y2="14" {...stroke}/></>),
    book:      (<><path d="M3 3 H7 a2 2 0 0 1 2 2 V14 a2 2 0 0 0 -2 -2 H3 Z" {...stroke}/><path d="M13 3 H9 a2 2 0 0 0 -2 2 V14 a2 2 0 0 1 2 -2 H13 Z" {...stroke}/></>),
    book2:     (<><path d="M3 3 H13 V13 H3 Z" {...stroke}/><line x1="3" y1="6" x2="13" y2="6" {...stroke}/><line x1="6" y1="3" x2="6" y2="13" {...stroke}/></>),
    document:  (<><path d="M4 2 H10 L13 5 V14 H4 Z" {...stroke}/><polyline points="10,2 10,5 13,5" {...stroke}/><line x1="6" y1="8" x2="11" y2="8" {...stroke}/><line x1="6" y1="11" x2="11" y2="11" {...stroke}/></>),
    download:  (<><line x1="8" y1="2" x2="8" y2="11" {...stroke}/><polyline points="4,8 8,12 12,8" {...stroke}/><line x1="3" y1="14" x2="13" y2="14" {...stroke}/></>),
    close:     (<><line x1="3.5" y1="3.5" x2="12.5" y2="12.5" {...stroke}/><line x1="12.5" y1="3.5" x2="3.5" y2="12.5" {...stroke}/></>),
    chevDown:  (<><polyline points="3,5.5 8,10.5 13,5.5" {...stroke}/></>),
    chevRight: (<><polyline points="6,3 11,8 6,13" {...stroke}/></>),
    chevLeft:  (<><polyline points="10,3 5,8 10,13" {...stroke}/></>),
    chevUp:    (<><polyline points="3,10.5 8,5.5 13,10.5" {...stroke}/></>),
    plus:      (<><line x1="8" y1="3" x2="8" y2="13" {...stroke}/><line x1="3" y1="8" x2="13" y2="8" {...stroke}/></>),
    minus:     (<><line x1="3" y1="8" x2="13" y2="8" {...stroke}/></>),
    info:      (<><circle cx="8" cy="8" r="6" {...stroke}/><line x1="8" y1="7" x2="8" y2="11.5" {...stroke}/><circle cx="8" cy="5" r="0.6" {...fill}/></>),
    settings:  (<><circle cx="8" cy="8" r="2" {...stroke}/><path d="M8 1.5 v2 M8 12.5 v2 M1.5 8 h2 M12.5 8 h2 M3.3 3.3 l1.4 1.4 M11.3 11.3 l1.4 1.4 M3.3 12.7 l1.4 -1.4 M11.3 4.7 l1.4 -1.4" {...stroke}/></>),
    bell:      (<><path d="M4 11 V7.5 a4 4 0 0 1 8 0 V11 l1 1.5 H3 Z" {...stroke}/><path d="M6.5 13.5 a1.5 1.5 0 0 0 3 0" {...stroke}/></>),
    help:      (<><circle cx="8" cy="8" r="6" {...stroke}/><path d="M6 6.5 a2 2 0 0 1 4 0 c0 1.5 -2 1.5 -2 3" {...stroke}/><circle cx="8" cy="11.5" r="0.6" {...fill}/></>),
    user:      (<><circle cx="8" cy="6" r="2.5" {...stroke}/><path d="M3 14 a5 5 0 0 1 10 0" {...stroke}/></>),
    sparkle:   (<><path d="M8 2 L9.2 6.5 L13.5 8 L9.2 9.5 L8 14 L6.8 9.5 L2.5 8 L6.8 6.5 Z" {...stroke}/></>),
    arrowRight:(<><line x1="3" y1="8" x2="13" y2="8" {...stroke}/><polyline points="9,4 13,8 9,12" {...stroke}/></>),
    arrowUp:   (<><line x1="8" y1="3" x2="8" y2="13" {...stroke}/><polyline points="4,7 8,3 12,7" {...stroke}/></>),
    arrowDown: (<><line x1="8" y1="3" x2="8" y2="13" {...stroke}/><polyline points="4,9 8,13 12,9" {...stroke}/></>),
    geo:       (<><path d="M8 1.5 c-3 0 -5 2.2 -5 5 c0 3.5 5 8 5 8 s5 -4.5 5 -8 c0 -2.8 -2 -5 -5 -5 Z" {...stroke}/><circle cx="8" cy="6.5" r="1.8" {...stroke}/></>),
    domain:    (<><rect x="3" y="3" width="10" height="10" {...stroke}/><line x1="3" y1="6.5" x2="13" y2="6.5" {...stroke}/><line x1="3" y1="9.5" x2="13" y2="9.5" {...stroke}/><line x1="6.5" y1="3" x2="6.5" y2="13" {...stroke}/></>),
    flow:      (<><circle cx="3.5" cy="8" r="1.5" {...stroke}/><circle cx="12.5" cy="8" r="1.5" {...stroke}/><line x1="5" y1="8" x2="11" y2="8" {...stroke}/><polyline points="9,5.5 11,8 9,10.5" {...stroke}/></>),
    shield:    (<><path d="M8 1.5 L13 3.5 V8 c0 3 -2.5 5.5 -5 6.5 c-2.5 -1 -5 -3.5 -5 -6.5 V3.5 Z" {...stroke}/><polyline points="5.5,8 7,9.5 10.5,6" {...stroke}/></>),
    clock:     (<><circle cx="8" cy="8" r="6" {...stroke}/><polyline points="8,4.5 8,8 11,9.5" {...stroke}/></>),
    compass:   (<><circle cx="8" cy="8" r="6" {...stroke}/><polygon points="8,4 9.5,7.5 8,12 6.5,7.5" {...fill} stroke="none"/></>),
    sliders:   (<><line x1="3" y1="4" x2="13" y2="4" {...stroke}/><circle cx="6" cy="4" r="1.5" {...stroke}/><line x1="3" y1="8" x2="13" y2="8" {...stroke}/><circle cx="10" cy="8" r="1.5" {...stroke}/><line x1="3" y1="12" x2="13" y2="12" {...stroke}/><circle cx="7" cy="12" r="1.5" {...stroke}/></>),
    menu:      (<><line x1="2.5" y1="4" x2="13.5" y2="4" {...stroke}/><line x1="2.5" y1="8" x2="13.5" y2="8" {...stroke}/><line x1="2.5" y1="12" x2="13.5" y2="12" {...stroke}/></>),
    expand:    (<><polyline points="3,7 3,3 7,3" {...stroke}/><polyline points="13,7 13,3 9,3" {...stroke}/><polyline points="3,9 3,13 7,13" {...stroke}/><polyline points="13,9 13,13 9,13" {...stroke}/></>),
    school:    (<><polygon points="8,2 14,5 8,8 2,5" {...stroke}/><polyline points="4,6.5 4,10 8,12 12,10 12,6.5" {...stroke}/></>),
    add:       (<><circle cx="8" cy="8" r="6" {...stroke}/><line x1="8" y1="5.5" x2="8" y2="10.5" {...stroke}/><line x1="5.5" y1="8" x2="10.5" y2="8" {...stroke}/></>),
    check:     (<><polyline points="3.5,8.5 6.5,11.5 12.5,5" {...stroke}/></>),
    play:      (<><polygon points="5,3 13,8 5,13" {...stroke}/></>),
    star:      (<><polygon points="8,2 9.8,6.2 14,6.7 10.8,9.7 11.7,14 8,11.8 4.3,14 5.2,9.7 2,6.7 6.2,6.2" {...stroke}/></>),
    edit:      (<><polygon points="3,11.5 3,13 4.5,13 12,5.5 10.5,4" {...stroke}/></>),
  };

  return (
    <span
      aria-hidden={!title}
      role={title ? "img" : undefined}
      aria-label={title}
      className={className}
      style={{ display: "inline-flex", width: size, height: size, color, flexShrink: 0 }}
    >
      <svg width={size} height={size} viewBox="0 0 16 16" focusable={false}>
        {title && <title>{title}</title>}
        {paths[name]}
      </svg>
    </span>
  );
};

export default SVGIcon;
