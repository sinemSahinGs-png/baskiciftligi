const REVIEWS = [
  {
    name: "Elif Kaya",
    text: "Kurumsal hediye siparişimizde her adımda yardımcı oldular. Numune sonrası revizyon aynı gün döndü.",
  },
  {
    name: "Mehmet Yılmaz",
    text: "Aynı gün kargo çıktı. Kutu kalitesi ve baskı netliği beklediğimizden iyiydi.",
  },
  {
    name: "Ayşe Demir",
    text: "Toptan siparişte fiyat şeffaftı, süreç kısaydı. Tekrar çalışacağız.",
  },
  {
    name: "Caner Aydın",
    text: "Logo baskılı parçalar tam istediğimiz gibi geldi. Kurumsal süreçte yanımızdalardı.",
  },
  {
    name: "Zeynep Koç",
    text: "İletişim çok hızlıydı. Mağaza açılışı için stok yetiştirdiler.",
  },
  {
    name: "Burak Şahin",
    text: "Numune ertesi gün elimizdeydi. Kalite kontrol notları net ve işe yarar.",
  },
  {
    name: "Selin Arslan",
    text: "Kurumsal için yardımcı oldular, fatura ve paketleme düzgündü.",
  },
  {
    name: "Hakan Öztürk",
    text: "Aynı gün kargo gönderdiler. Parçalar rafta duracak kadar temiz çıktı.",
  },
];

function Stars() {
  return (
    <span className="octo-review-stars" aria-label="5 üzerinden 5">
      {Array.from({ length: 5 }, (_, index) => (
        <svg key={index} viewBox="0 0 20 20" width="13" height="13" aria-hidden="true">
          <path
            fill="#fbbc04"
            d="M10 1.6 12.4 7l5.8.5-4.4 3.8 1.3 5.6L10 14.8 4.9 16.9l1.3-5.6L1.8 7.5 7.6 7 10 1.6z"
          />
        </svg>
      ))}
    </span>
  );
}

function Card({ name, text }: { name: string; text: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return (
    <article className="octo-review-card">
      <header className="octo-review-head">
        <span className="octo-review-avatar" aria-hidden="true">
          {initials}
        </span>
        <div>
          <p className="octo-review-name">{name}</p>
          <p className="octo-review-meta">Google · 5,0</p>
        </div>
        <Stars />
      </header>
      <p>{text}</p>
    </article>
  );
}

export function GoogleReviews() {
  const loop = [...REVIEWS, ...REVIEWS];
  return (
    <div className="octo-reviews" aria-label="Müşteri yorumları">
      <div className="octo-reviews-track">
        {loop.map((review, index) => (
          <Card key={`${review.name}-${index}`} name={review.name} text={review.text} />
        ))}
      </div>
    </div>
  );
}
