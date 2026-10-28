import type { Metadata } from "next";
import { OpenStore } from "./OpenStore";

const API = process.env.NEXT_PUBLIC_API_URL || "https://novobackend.onrender.com/api/v1";
const FALLBACK_IMAGE = "/novo-logo/01_Motion_N/01-motion-n_green.png";

type Props = { params: Promise<{ slug: string }> };

async function getStore(slug: string) {
  try {
    const res = await fetch(`${API}/stores/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

/** Shared store links (/s/mama-put-kitchen-a1b2c3): rich preview with the shop's name and banner. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) return { title: "Novo" };
  const title = `${store.name} on Novo`;
  const description =
    (store.settings && store.settings.description) ||
    store.description ||
    `Order from ${store.name}${store.address ? ` in ${store.address}` : ""}. Fast delivery with Novo.`;
  const image = store.banner || store.logo || FALLBACK_IMAGE;
  return {
    title,
    description,
    openGraph: { title, description, images: [image], type: "website", siteName: "Novo" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SharedStorePage({ params }: Props) {
  const { slug } = await params;
  const store = await getStore(slug);
  return <OpenStore slug={slug} name={store?.name || null} />;
}
