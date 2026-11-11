export function StoreHeroTitle({ title }: { title: string }) {
  return (
    <h1 className="store-intro-title mt-2" data-word-reveal="" data-inview="false">
      {title}
    </h1>
  );
}
