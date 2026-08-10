import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Mad Mojo — Original paintings & wearable art";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const photo = await readFile(
    join(process.cwd(), "public/products/_site/1.jpg")
  );
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#171412",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoSrc}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(23,20,18,0.92) 0%, rgba(23,20,18,0.55) 48%, rgba(23,20,18,0.15) 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "64px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#ff5c39",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            Mad Mojo
          </div>
          <div
            style={{
              color: "#faf7f2",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              maxWidth: 640,
              letterSpacing: "-0.02em",
            }}
          >
            Art with a little madness in it
          </div>
          <div
            style={{
              marginTop: 20,
              color: "rgba(250,247,242,0.78)",
              fontSize: 28,
              maxWidth: 560,
            }}
          >
            Original paintings & wearable art · shipped worldwide
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
