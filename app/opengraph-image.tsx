import { ImageResponse } from "next/og";
import { LogoMark } from "@/components/logo-mark";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "CrowdSurvey — share a link, collect questions, see who agrees.";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0a0a0a",
          color: "#ededed",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: 80,
          alignItems: "center",
          gap: 64,
        }}
      >
        <LogoMark size={320} radius={0.18} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            CrowdSurvey
          </div>
          <div
            style={{
              fontSize: 36,
              color: "#9ca3af",
              lineHeight: 1.25,
              maxWidth: 640,
            }}
          >
            Share a link. Collect questions. See who agrees.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 22,
              color: "#6b7280",
            }}
          >
            Not anonymous · Names required · No accounts
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
