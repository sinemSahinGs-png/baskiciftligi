"use client";

import { useEffect, useRef, useState } from "react";
import type { Route } from "next";
import Link from "next/link";

import {
  LIL_DISC_HERO_POSTER,
  LIL_DISC_HERO_VIDEO,
  LIL_DISC_HERO_VIDEO_FALLBACK,
  LIL_DISC_INSTAGRAM_URL,
  listProjectDisplayProducts,
  type ProjectDestination,
} from "@/domain/project-destinations/catalog";
import { selectCartCount, useCartStore } from "@/stores/cart-store";
import "./lil-disc-shop.css";

function priceLabel(priceMinor: number) {
  return `${Math.round(priceMinor / 100)} TL`;
}

export function LilDiscShop({ destination }: { destination: ProjectDestination }) {
  const albums = listProjectDisplayProducts("lil-disc");
  const addLine = useCartStore((state) => state.addLine);
  const cartCount = useCartStore(selectCartCount);
  const cartHydrated = useCartStore((state) => state.hasHydrated);
  const [addedId, setAddedId] = useState<string | null>(null);
  const addedTimer = useRef<number>(0);

  function addAlbum(productId: string) {
    addLine({ productId, quantity: 1 });
    setAddedId(productId);
    window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setAddedId(null), 1400);
  }

  useEffect(() => () => window.clearTimeout(addedTimer.current), []);

  return (
    <div className="lil-shop" data-lil-shop="">
      <header className="lil-nav">
        <Link href={destination.href} className="lil-nav-brand">
          LIL’DISC
        </Link>
        <nav className="lil-nav-links" aria-label="LIL’DISC">
          <a href="#albumler">Albümler</a>
          <a href="#album-iste">Albüm iste</a>
          <Link href={"/sepet" as Route} className="lil-nav-cart">
            Sepet
            <span className="lil-nav-count">{cartHydrated ? cartCount : 0}</span>
          </Link>
        </nav>
      </header>

      <main id="ana-icerik">
        <section className="lil-hero" aria-labelledby="lil-hero-title">
          <LilHeroMedia poster={destination.heroPoster || LIL_DISC_HERO_POSTER} />
          <div className="lil-hero-copy">
            <h1 id="lil-hero-title">NFC özellikli mini CD anahtarlık</h1>
            <p>Telefonuna yaklaştır, albümü dinle.</p>
            <a href="#albumler">Albümleri keşfet</a>
          </div>
        </section>

        <section className="lil-albums" id="albumler" aria-labelledby="lil-albums-title">
          <h2 id="lil-albums-title">Albümler</h2>
          <ul className="lil-grid">
            {albums.map((album) => (
              <li key={album.id} className="lil-card">
                {album.media[0]?.url ? (
                  <img src={album.media[0].url} alt="" width={640} height={640} />
                ) : null}
                <div>
                  <h3>{album.name}</h3>
                  <p>{priceLabel(album.priceMinor)}</p>
                </div>
                <button
                  type="button"
                  data-added={addedId === album.id ? "true" : "false"}
                  onClick={() => addAlbum(album.id)}
                >
                  {addedId === album.id ? "Eklendi" : "Sepete ekle"}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <AlbumRequestForm />
      </main>

      <footer className="lil-foot">
        {LIL_DISC_INSTAGRAM_URL ? (
          <a href={LIL_DISC_INSTAGRAM_URL} rel="noreferrer" target="_blank">
            Instagram
          </a>
        ) : null}
      </footer>
    </div>
  );
}

function LilHeroMedia({ poster }: { poster: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [mode, setMode] = useState<"preferred" | "fallback" | "image" | "none">(
    "preferred",
  );

  function togglePause() {
    const node = videoRef.current;
    if (!node) return;
    if (node.paused) {
      void node.play();
      setPaused(false);
      return;
    }
    node.pause();
    setPaused(true);
  }

  if (mode === "none") {
    return <div className="lil-hero-media" aria-hidden="true" />;
  }

  if (mode === "image") {
    return (
      <div className="lil-hero-media">
        <img
          src={poster}
          alt=""
          onError={() => setMode("none")}
        />
      </div>
    );
  }

  return (
    <div className="lil-hero-media">
      <video
        key={mode}
        ref={videoRef}
        data-project-hero-video="lil-disc"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        disablePictureInPicture
        controlsList="nofullscreen nodownload noremoteplayback"
        onError={() => setMode(mode === "preferred" ? "fallback" : "image")}
      >
        <source
          src={mode === "preferred" ? LIL_DISC_HERO_VIDEO : LIL_DISC_HERO_VIDEO_FALLBACK}
          type="video/mp4"
        />
      </video>
      <button type="button" className="lil-hero-pause" onClick={togglePause}>
        {paused ? "Oynat" : "Duraklat"}
      </button>
    </div>
  );
}

function AlbumRequestForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [artist, setArtist] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [email, setEmail] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/hazir-modeller/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "lil_disc",
          artist,
          albumName,
          customerEmail: email,
        }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error ?? "İstek gönderilemedi.");
        return;
      }
      setStatus("ok");
      setMessage("Albüm isteğini aldık.");
    } catch {
      setStatus("error");
      setMessage("İstek gönderilemedi.");
    }
  }

  return (
    <section className="lil-request" id="album-iste" aria-labelledby="lil-request-title">
      <h2 id="lil-request-title">İstediğin albümü yaz, tasarlayalım.</h2>
      <form onSubmit={(event) => void onSubmit(event)}>
        <label>
          Sanatçı
          <input
            name="artist"
            required
            minLength={2}
            maxLength={120}
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
          />
        </label>
        <label>
          Albüm adı
          <input
            name="albumName"
            required
            minLength={1}
            maxLength={200}
            value={albumName}
            onChange={(event) => setAlbumName(event.target.value)}
          />
        </label>
        <label>
          E-posta
          <input
            name="email"
            type="email"
            required
            maxLength={160}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Gönderiliyor…" : "İstek gönder"}
        </button>
        {message ? (
          <p role="status" data-lil-request={status}>
            {message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
