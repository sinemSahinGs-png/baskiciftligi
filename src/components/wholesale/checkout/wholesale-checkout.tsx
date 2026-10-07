"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { WholesalePhotoFrame } from "@/components/wholesale/checkout/wholesale-photo";
import { formatMoney } from "@/lib/money";
import { sendWholesaleMagicLink } from "@/lib/wholesale/otp-action";
import {
  WHOLESALE_GALLERY_PHOTOS,
  WHOLESALE_HERO_PHOTO,
  type WholesalePhoto,
} from "@/lib/wholesale/photos";
import {
  WHOLESALE_PACKAGES,
  quoteWholesalePackage,
  type WholesalePackageSku,
} from "@/lib/wholesale/packages";
import { TURKISH_PROVINCES } from "@/lib/wholesale/provinces";
import { buildAgreementAcceptances } from "@/lib/wholesale/agreements";
import { CUSTOMER_CHECKOUT_CLOSED_MESSAGE } from "@/lib/wholesale/labels";

import "./wholesale-checkout.css";

export interface WholesaleCheckoutProps {
  checkoutOpen: boolean;
  shippingConfigured: boolean;
  shippingGrossMinor: number | null;
  adminNote: string | null;
  photos: Array<WholesalePhoto & { src: string | null }>;
  signedIn: boolean;
  supportEmail: string;
}

type Step = "select" | "form" | "pay";

const emptyForm = {
  fullName: "",
  phone: "",
  email: "",
  city: "Ankara",
  district: "",
  line: "",
  invoiceType: "bireysel" as "bireysel" | "kurumsal",
  sameAsShipping: true,
  companyName: "",
  taxOffice: "",
  taxNumber: "",
  invoiceLine: "",
  invoiceCity: "Ankara",
  invoiceDistrict: "",
  customerNote: "",
  acceptPreliminary: false,
  acceptDistanceSales: false,
  acceptPrivacy: false,
};

function newIdempotencyKey() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function WholesaleCheckout({
  checkoutOpen,
  shippingConfigured,
  shippingGrossMinor,
  adminNote,
  photos,
  signedIn,
  supportEmail,
}: WholesaleCheckoutProps) {
  const router = useRouter();
  const [sku, setSku] = useState<WholesalePackageSku>("WS-LIGHTER-50");
  const [step, setStep] = useState<Step>("select");
  const [form, setForm] = useState(emptyForm);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  const quote = useMemo(() => {
    if (shippingGrossMinor == null) {
      return null;
    }
    return quoteWholesalePackage(sku, shippingGrossMinor);
  }, [sku, shippingGrossMinor]);

  const pack = WHOLESALE_PACKAGES[sku];
  const hero = photos.find((photo) => photo.id === "stand") ?? {
    ...WHOLESALE_HERO_PHOTO,
    src: null,
  };
  const gallery = photos.filter((photo) => photo.id !== "stand");
  const lightboxPhoto = photos.find((photo) => photo.id === lightbox);
  const agreements = quote
    ? buildAgreementAcceptances({
        quote,
        customer: {
          fullName: form.fullName || "—",
          phone: form.phone || "—",
          email: form.email || "—",
          city: form.city,
          district: form.district || "—",
          line: form.line || "—",
        },
        invoice: {
          type: form.invoiceType,
          sameAsShipping: form.sameAsShipping,
          companyName: form.companyName || null,
          taxOffice: form.taxOffice || null,
          taxNumber: form.taxNumber || null,
          address: null,
        },
      })
    : [];

  function update<K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function startPayment() {
    setError(null);
    setFields({});
    if (!checkoutOpen || !shippingConfigured) {
      setError(CUSTOMER_CHECKOUT_CLOSED_MESSAGE);
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/wholesale/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          packageSku: sku,
          customer: {
            fullName: form.fullName,
            phone: form.phone,
            email: form.email,
            city: form.city,
            district: form.district,
            line: form.line,
          },
          sameAsShipping: form.sameAsShipping,
          invoiceType: form.invoiceType,
          companyName: form.companyName || null,
          taxOffice: form.taxOffice || null,
          taxNumber: form.taxNumber || null,
          invoiceAddress: form.sameAsShipping
            ? null
            : {
                fullName: form.fullName,
                phone: form.phone,
                email: form.email,
                city: form.invoiceCity,
                district: form.invoiceDistrict,
                line: form.invoiceLine,
              },
          customerNote: form.customerNote || null,
          acceptPreliminary: form.acceptPreliminary || undefined,
          acceptDistanceSales: form.acceptDistanceSales || undefined,
          acceptPrivacy: form.acceptPrivacy || undefined,
          idempotencyKey,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        fields?: Record<string, string>;
        iframeSrc?: string;
        orderNumber?: string;
        trackingToken?: string;
      };
      if (!response.ok) {
        setFields(data.fields ?? {});
        setError(data.error ?? "Formu kontrol edin.");
        return;
      }
      setIframeSrc(data.iframeSrc ?? null);
      setOrderNumber(data.orderNumber ?? null);
      setTrackingToken(data.trackingToken ?? null);
      setStep("pay");
      if (data.orderNumber && data.trackingToken) {
        sessionStorage.setItem(`ws-track-${data.orderNumber}`, data.trackingToken);
      }
    } catch {
      setError("Bağlantı kurulamadı. Formunuz duruyor; tekrar deneyin.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="ws-page">
      <div className="ws-shell py-6 sm:py-10">
        <p className="ws-eyebrow">Toptan satış</p>
        <h1 className="mt-3 max-w-xl font-heading text-[1.7rem] leading-[0.95] font-semibold tracking-[-0.04em] uppercase sm:text-5xl">
          Tezgahın hazır. Ürünlerin hazır.
        </h1>
        <p className="mt-4 max-w-xl text-[0.95rem] leading-6 text-[color:var(--ws-muted)]">
          Karışık model çakmak paketini seç, bilgilerini gir ve güvenli ödeme ile
          siparişini tamamla.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[color:var(--ws-line)]">
          <WholesalePhotoFrame
            photo={hero}
            src={hero.src}
            sizes="(max-width: 720px) 100vw, 72rem"
            onOpen={() => setLightbox(hero.id)}
          />
        </div>

        <ul className="mt-4 flex flex-wrap gap-2 text-[0.68rem] font-extrabold tracking-[0.12em] text-[color:var(--ws-muted)] uppercase">
          <li className="rounded-full border border-[color:var(--ws-line)] bg-white px-3 py-2">
            KDV dahil
          </li>
          <li className="rounded-full border border-[color:var(--ws-line)] bg-white px-3 py-2">
            1 stant hediye
          </li>
          <li className="rounded-full border border-[color:var(--ws-line)] bg-white px-3 py-2">
            Güvenli ödeme
          </li>
        </ul>

        {!checkoutOpen ? (
          <p className="ws-notice">{CUSTOMER_CHECKOUT_CLOSED_MESSAGE}</p>
        ) : null}
        {adminNote ? (
          <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
            {adminNote}
          </p>
        ) : null}

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {(
            Object.values(WHOLESALE_PACKAGES) as Array<
              (typeof WHOLESALE_PACKAGES)[WholesalePackageSku]
            >
          ).map((item) => {
            const selected = sku === item.sku;
            return (
              <article
                key={item.sku}
                className="ws-pack"
                aria-current={selected ? "true" : undefined}
                data-selected={selected ? "true" : "false"}
              >
                <h2 className="font-heading text-2xl">{item.title}</h2>
                <p className="mt-2 text-sm font-semibold">{item.quantity} adet çakmak</p>
                <p className="mt-2 text-sm">Adet fiyatı ₺35</p>
                <p className="mt-1 text-base font-semibold">
                  {formatMoney(item.productGrossMinor)}
                </p>
                <p className="text-sm">KDV dahil</p>
                <p className="mt-1 text-sm">1 satış standı hediye</p>
                <p className="mt-1 text-sm text-[color:var(--ws-muted)]">
                  {item.mixedNote}
                </p>
                <button
                  type="button"
                  className="ws-cta mt-4"
                  aria-pressed={selected}
                  onClick={() => setSku(item.sku)}
                >
                  {selected ? "Seçildi" : item.cta}
                </button>
              </article>
            );
          })}
        </div>

        <aside
          className="mt-6 rounded-2xl border border-[color:var(--ws-line)] bg-white p-4"
          aria-live="polite"
        >
          <p className="text-xs font-extrabold tracking-[0.14em] uppercase">
            Sipariş özeti
          </p>
          <dl className="ws-summary mt-3">
            <div className="ws-summary-row">
              <dt>Paket</dt>
              <dd className="font-semibold">{pack.title}</dd>
            </div>
            <div className="ws-summary-row">
              <dt>Ürün adedi</dt>
              <dd>{pack.quantity}</dd>
            </div>
            <div className="ws-summary-row">
              <dt>Adet fiyatı</dt>
              <dd>{formatMoney(pack.unitGrossMinor)}</dd>
            </div>
            <div className="ws-summary-row">
              <dt>Ürün toplamı</dt>
              <dd>{formatMoney(pack.productGrossMinor)}</dd>
            </div>
            <div className="ws-summary-row">
              <dt>Satış standı</dt>
              <dd>Hediye</dd>
            </div>
            <div className="ws-summary-row">
              <dt>Kargo</dt>
              <dd>
                {quote ? formatMoney(quote.shippingGrossMinor) : "—"}
              </dd>
            </div>
            <div className="ws-summary-row text-base font-semibold">
              <dt>Genel toplam</dt>
              <dd>{quote ? formatMoney(quote.grandTotalMinor) : "—"}</dd>
            </div>
          </dl>
        </aside>

        <section className="mt-10">
          <h2 className="font-heading text-2xl">Pakette ne var?</h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-[color:var(--ws-muted)]">
            <li>{pack.quantity} adet karışık model kaplamalı çakmak</li>
            <li>1 satış standı hediye</li>
            <li>Modeller stoktaki karışıktan hazırlanır</li>
            <li>Ürün fiyatı KDV dahildir</li>
            <li>
              Model talepleri mevcut stok durumuna göre değerlendirilir. Kesin
              model dağılımı için sipariş sonrasında sizinle iletişime
              geçilebilir.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="font-heading text-2xl">Ürün</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(gallery.length ? gallery : WHOLESALE_GALLERY_PHOTOS.map((photo) => ({ ...photo, src: null }))).map(
              (photo) => (
                <WholesalePhotoFrame
                  key={photo.id}
                  photo={photo}
                  src={photo.src}
                  className="rounded-xl border border-[color:var(--ws-line)]"
                  sizes="(max-width: 720px) 50vw, 22rem"
                  onOpen={() => setLightbox(photo.id)}
                />
              ),
            )}
          </div>
        </section>

        {step !== "pay" ? (
          <section className="mt-10" id="teslimat-formu">
            <h2 className="font-heading text-2xl">Teslimat bilgileri</h2>
            <p className="mt-2 text-sm text-[color:var(--ws-muted)]">
              Hesap açmadan ödeyebilirsiniz.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold sm:col-span-2">
                Ad soyad
                <input
                  className="ws-field mt-1"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(event) => update("fullName", event.target.value)}
                />
                {fields["customer.fullName"] ? (
                  <span className="mt-1 block text-sm text-red-700">
                    {fields["customer.fullName"]}
                  </span>
                ) : null}
              </label>
              <label className="text-sm font-semibold">
                Telefon
                <input
                  className="ws-field mt-1"
                  autoComplete="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                />
                {fields["customer.phone"] ? (
                  <span className="mt-1 block text-sm text-red-700">
                    {fields["customer.phone"]}
                  </span>
                ) : null}
              </label>
              <label className="text-sm font-semibold">
                E-posta
                <input
                  className="ws-field mt-1"
                  autoComplete="email"
                  inputMode="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                />
                {fields["customer.email"] ? (
                  <span className="mt-1 block text-sm text-red-700">
                    {fields["customer.email"]}
                  </span>
                ) : null}
              </label>
              <label className="text-sm font-semibold">
                İl
                <select
                  className="ws-field mt-1"
                  value={form.city}
                  onChange={(event) => update("city", event.target.value)}
                >
                  {TURKISH_PROVINCES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                İlçe
                <input
                  className="ws-field mt-1"
                  value={form.district}
                  onChange={(event) => update("district", event.target.value)}
                />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                Açık adres
                <textarea
                  className="ws-field mt-1 min-h-24 py-3"
                  value={form.line}
                  onChange={(event) => update("line", event.target.value)}
                />
              </label>
            </div>

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold">Fatura tipi</legend>
              <div className="mt-2 flex gap-3">
                {(["bireysel", "kurumsal"] as const).map((type) => (
                  <label key={type} className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="invoiceType"
                      checked={form.invoiceType === type}
                      onChange={() => update("invoiceType", type)}
                    />
                    {type === "bireysel" ? "Bireysel" : "Kurumsal"}
                  </label>
                ))}
              </div>
            </fieldset>

            {form.invoiceType === "kurumsal" ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold sm:col-span-2">
                  Firma unvanı
                  <input
                    className="ws-field mt-1"
                    value={form.companyName}
                    onChange={(event) => update("companyName", event.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Vergi dairesi
                  <input
                    className="ws-field mt-1"
                    value={form.taxOffice}
                    onChange={(event) => update("taxOffice", event.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Vergi numarası
                  <input
                    className="ws-field mt-1"
                    inputMode="numeric"
                    value={form.taxNumber}
                    onChange={(event) => update("taxNumber", event.target.value)}
                  />
                </label>
              </div>
            ) : null}

            <label className="mt-4 flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="ws-check size-4"
                checked={form.sameAsShipping}
                onChange={(event) => update("sameAsShipping", event.target.checked)}
              />
              Teslimat ve fatura adresim aynı
            </label>

            {!form.sameAsShipping ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold sm:col-span-2">
                  Fatura adresi
                  <textarea
                    className="ws-field mt-1 min-h-24 py-3"
                    value={form.invoiceLine}
                    onChange={(event) => update("invoiceLine", event.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold">
                  Fatura ili
                  <select
                    className="ws-field mt-1"
                    value={form.invoiceCity}
                    onChange={(event) => update("invoiceCity", event.target.value)}
                  >
                    {TURKISH_PROVINCES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Fatura ilçesi
                  <input
                    className="ws-field mt-1"
                    value={form.invoiceDistrict}
                    onChange={(event) => update("invoiceDistrict", event.target.value)}
                  />
                </label>
              </div>
            ) : null}

            <label className="mt-4 block text-sm font-semibold">
              Model tercihiniz veya notunuz
              <textarea
                className="ws-field mt-1 min-h-24 py-3"
                value={form.customerNote}
                onChange={(event) => update("customerNote", event.target.value)}
              />
              <span className="mt-1 block font-normal text-[color:var(--ws-muted)]">
                Model talepleri mevcut stok durumuna göre değerlendirilir. Kesin
                model dağılımı için sipariş sonrasında sizinle iletişime
                geçilebilir.
              </span>
            </label>

            <div className="mt-6 space-y-3 text-sm">
              {agreements.map((item) => (
                <details
                  key={item.versionId}
                  className="rounded-xl border border-[color:var(--ws-line)] bg-white p-3"
                >
                  <summary className="cursor-pointer font-semibold">{item.title}</summary>
                  <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap font-sans text-xs leading-5 text-[color:var(--ws-muted)]">
                    {item.snapshot}
                  </pre>
                </details>
              ))}
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.acceptPreliminary}
                  onChange={(event) => update("acceptPreliminary", event.target.checked)}
                />
                Ön bilgilendirme formunu okudum ve onaylıyorum.
              </label>
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.acceptDistanceSales}
                  onChange={(event) =>
                    update("acceptDistanceSales", event.target.checked)
                  }
                />
                Mesafeli satış sözleşmesini okudum ve onaylıyorum.
              </label>
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.acceptPrivacy}
                  onChange={(event) => update("acceptPrivacy", event.target.checked)}
                />
                Gizlilik ve KVKK bilgisini okudum.
              </label>
            </div>

            {error ? (
              <p className="mt-4 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              className="ws-cta mt-5 max-w-md"
              disabled={pending || !checkoutOpen}
              onClick={() => {
                setStep("form");
                void startPayment();
              }}
            >
              {pending ? "Ödeme hazırlanıyor…" : "Güvenli ödemeye geç"}
            </button>
          </section>
        ) : null}

        {step === "pay" && iframeSrc ? (
          <section className="mt-10" id="paytr-iframe">
            <h2 className="font-heading text-2xl">Güvenli ödeme</h2>
            <p className="mt-2 text-sm text-[color:var(--ws-muted)]">
              Kart bilgisi bu sitede tutulmaz. Ödeme güvenli ödeme alanında
              tamamlanır.
            </p>
            {orderNumber ? (
              <p className="mt-2 text-sm">Sipariş no: {orderNumber}</p>
            ) : null}
            <div className="ws-iframe-wrap mt-4">
              <iframe
                title="Güvenli ödeme"
                src={iframeSrc}
                className="ws-iframe rounded-xl border border-[color:var(--ws-line)]"
              />
            </div>
            {!signedIn && form.email ? (
              <div className="mt-6 rounded-xl border border-[color:var(--ws-line)] bg-white p-4">
                <p className="font-semibold">
                  Siparişlerini tek ekranda görmek ister misin?
                </p>
                <button
                  type="button"
                  className="ws-cta mt-3 max-w-xs"
                  onClick={async () => {
                    const result = await sendWholesaleMagicLink(form.email);
                    setOtpMessage(result.message);
                  }}
                >
                  E-posta ile giriş bağlantısı gönder
                </button>
                {otpMessage ? <p className="mt-2 text-sm">{otpMessage}</p> : null}
              </div>
            ) : null}
            {orderNumber ? (
              <button
                type="button"
                className="mt-4 text-sm underline"
                onClick={() =>
                  router.push(
                    `/odeme/basarili?order=${encodeURIComponent(orderNumber)}${
                      trackingToken ? `&token=${encodeURIComponent(trackingToken)}` : ""
                    }`,
                  )
                }
              >
                Ödeme ekranından döndüyseniz sipariş durumunu açın
              </button>
            ) : null}
          </section>
        ) : null}

        <section className="mt-12">
          <h2 className="font-heading text-2xl">Sık sorulanlar</h2>
          <dl className="mt-4 space-y-4 text-sm leading-6">
            <div>
              <dt className="font-semibold">Paketlerde kaç adet ürün var?</dt>
              <dd className="text-[color:var(--ws-muted)]">
                50’li pakette 50, 100’lü pakette 100 adet karışık model kaplamalı
                çakmak vardır.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Stand pakete dahil mi?</dt>
              <dd className="text-[color:var(--ws-muted)]">
                Evet. Her pakette 1 satış standı hediyedir.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Modelleri seçebilir miyim?</dt>
              <dd className="text-[color:var(--ws-muted)]">
                Varsayılan karışık pakettir. Not alanındaki talepler stok durumuna
                göre değerlendirilir; kesin dağılım için sonradan iletişime
                geçilebilir.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Siparişimi nasıl takip ederim?</dt>
              <dd className="text-[color:var(--ws-muted)]">
                Ödeme sonrası sipariş numarası ve takip bağlantısı verilir.
                Hesabınız varsa Siparişler sayfanızdan da bakabilirsiniz.
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {step === "select" ? (
        <div className="ws-bar md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase">{pack.shortTitle}</p>
              <p className="font-semibold">
                {quote ? formatMoney(quote.grandTotalMinor) : "—"}
              </p>
            </div>
            <a href="#teslimat-formu" className="ws-cta w-auto px-5">
              Devam
            </a>
          </div>
        </div>
      ) : null}

      {lightboxPhoto?.src ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ürün fotoğrafı"
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxPhoto.src}
            alt={lightboxPhoto.alt}
            className="max-h-[90dvh] max-w-full object-contain"
          />
          <button
            type="button"
            className="absolute top-4 right-4 min-h-11 rounded-full bg-white px-4 text-sm font-semibold"
            onClick={() => setLightbox(null)}
          >
            Kapat
          </button>
        </div>
      ) : null}

      <span className="sr-only">{supportEmail}</span>
    </div>
  );
}
