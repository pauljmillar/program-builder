import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#060f24",
          color: "#fcfaf5",
        }}
      >
        <div
          style={{
            fontSize: 20,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#dce6f9",
          }}
        >
          A work sample for Submittable
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 64,
            lineHeight: 1.05,
            maxWidth: 900,
          }}
        >
          One sentence in. A complete grant program out.
        </div>
        <div style={{ marginTop: 32, fontSize: 24, color: "#8a92a2" }}>By Paul Millar</div>
      </div>
    ),
    { ...size }
  );
}
