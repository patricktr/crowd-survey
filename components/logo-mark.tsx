type Props = {
  size?: number;
  /** corner radius as a fraction of size (default 0.18) */
  radius?: number;
  background?: string;
  bars?: string;
  highlight?: string;
};

/**
 * CrowdSurvey logomark — a stack of three "question" bars on a rounded blue
 * tile, with the middle bar highlighted to suggest the "agreed-upon" one.
 *
 * Used by `app/icon.tsx`, `app/apple-icon.tsx`, `app/opengraph-image.tsx`,
 * and rendered inline in the header.
 */
export function LogoMark({
  size = 32,
  radius = 0.22,
  background = "#2563eb",
  bars = "rgba(255, 255, 255, 0.62)",
  highlight = "#ffffff",
}: Props) {
  const padding = size * 0.22;
  const gap = size * 0.1;
  const barHeight = size * 0.13;
  const barWidth = size * 0.56;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        background,
        borderRadius: size * radius,
        padding,
        gap,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          height: barHeight,
          width: barWidth,
          background: bars,
          borderRadius: barHeight,
        }}
      />
      <div
        style={{
          height: barHeight,
          width: barWidth * 1.1,
          background: highlight,
          borderRadius: barHeight,
        }}
      />
      <div
        style={{
          height: barHeight,
          width: barWidth * 0.75,
          background: bars,
          borderRadius: barHeight,
        }}
      />
    </div>
  );
}
