import type { MetadataRoute } from "next";

/** Lets phones "Add to Home Screen" and open Novo full-screen, like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Novo — Food & Delivery",
    short_name: "Novo",
    description: "Order food, groceries and pharmacy from places near you.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#087F5B",
    icons: [
      { src: "/novo-logo/01_Motion_N/01-motion-n_green.png", sizes: "1024x1024", type: "image/png", purpose: "any" },
      { src: "/novo-logo/01_Motion_N/01-motion-n_green.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
