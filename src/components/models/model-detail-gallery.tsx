"use client";

import { useCallback, useMemo, useState } from "react";

import { SafeImage } from "@/components/media/safe-image";
import {
  collectThingiverseGalleryCandidates,
  thumbImageFromCandidate,
  type ThingiverseImageCandidate,
} from "@/domain/external-models/thingiverse-images";
import { cn } from "@/lib/utils";

function useModelGallery(input: {
  thumbnailUrl?: string | null;
  imageUrls?: string[] | null;
}) {
  const initialCandidates = useMemo(
    () =>
      collectThingiverseGalleryCandidates({
        thumbnailUrl: input.thumbnailUrl,
        imageUrls: input.imageUrls ?? undefined,
      }),
    [input.thumbnailUrl, input.imageUrls],
  );

  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set());
  const [verifiedIds, setVerifiedIds] = useState<Set<string>>(() => new Set());
  const [activeId, setActiveId] = useState<string | null>(
    () => initialCandidates[0]?.id ?? null,
  );

  const visibleCandidates = useMemo(
    () => initialCandidates.filter((candidate) => !failedIds.has(candidate.id)),
    [initialCandidates, failedIds],
  );

  const activeCandidate = useMemo(() => {
    if (visibleCandidates.length === 0) return null;
    return (
      visibleCandidates.find((candidate) => candidate.id === activeId) ??
      visibleCandidates[0] ??
      null
    );
  }, [visibleCandidates, activeId]);

  const markVerified = useCallback((candidateId: string) => {
    setVerifiedIds((prev) => {
      if (prev.has(candidateId)) return prev;
      const next = new Set(prev);
      next.add(candidateId);
      return next;
    });
  }, []);

  const markFailed = useCallback((candidateId: string) => {
    setFailedIds((prev) => {
      if (prev.has(candidateId)) return prev;
      const next = new Set(prev);
      next.add(candidateId);
      return next;
    });
    setActiveId((current) => (current === candidateId ? null : current));
  }, []);

  const showThumbnailRail =
    visibleCandidates.length > 1 &&
    visibleCandidates.some((candidate) => verifiedIds.has(candidate.id));

  return {
    visibleCandidates,
    activeCandidate,
    activeId,
    setActiveId,
    markVerified,
    markFailed,
    showThumbnailRail,
  };
}

function GalleryThumb({
  candidate,
  active,
  onSelect,
  onVerified,
  onFailed,
}: {
  candidate: ThingiverseImageCandidate;
  active: boolean;
  onSelect: () => void;
  onVerified: () => void;
  onFailed: () => void;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  return (
    <li className="shrink-0">
      <button
        type="button"
        onClick={onSelect}
        aria-label="Görsel seç"
        aria-current={active ? "true" : undefined}
        className={cn(
          "relative size-14 overflow-hidden rounded-lg border-2 transition sm:size-[3.75rem]",
          active ? "border-coral" : "border-white/10",
        )}
      >
        <SafeImage
          src={thumbImageFromCandidate(candidate)}
          alt=""
          fill
          sizes="72px"
          quality={70}
          imageKey={candidate.id}
          fallbackLabel=""
          showSkeleton={false}
          className="object-cover"
          onVerifiedLoad={() => onVerified()}
          onPermanentFail={() => {
            onFailed();
            setHidden(true);
          }}
        />
      </button>
    </li>
  );
}

function ModelDetailGalleryInner({
  title,
  thumbnailUrl,
  imageUrls,
  priority = true,
}: {
  title: string;
  thumbnailUrl?: string | null;
  imageUrls?: string[] | null;
  priority?: boolean;
}) {
  const gallery = useModelGallery({ thumbnailUrl, imageUrls });

  return (
    <div className="space-y-3" data-model-detail-gallery="">
      <div className="relative mx-auto aspect-square w-full max-h-[min(60svh,28rem)] overflow-hidden rounded-2xl bg-midnight/70 lg:max-h-[min(62svh,42rem)]">
        {gallery.activeCandidate ? (
          <SafeImage
            src={gallery.activeCandidate.displayUrl}
            alt={title}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 900px"
            quality={75}
            imageKey={gallery.activeCandidate.id}
            className="object-contain p-4 sm:p-6"
            fallbackLabel="Görsel yakında"
            onVerifiedLoad={() => gallery.markVerified(gallery.activeCandidate!.id)}
            onPermanentFail={() => gallery.markFailed(gallery.activeCandidate!.id)}
          />
        ) : (
          <SafeImage
            src={null}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 900px"
            fallbackLabel="Görsel yakında"
          />
        )}
      </div>
      {gallery.showThumbnailRail ? (
        <ul
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          data-model-gallery-thumbs=""
        >
          {gallery.visibleCandidates.map((candidate) => (
            <GalleryThumb
              key={candidate.id}
              candidate={candidate}
              active={gallery.activeId === candidate.id}
              onSelect={() => gallery.setActiveId(candidate.id)}
              onVerified={() => gallery.markVerified(candidate.id)}
              onFailed={() => gallery.markFailed(candidate.id)}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ModelDetailGallery(props: {
  title: string;
  thumbnailUrl?: string | null;
  imageUrls?: string[] | null;
  priority?: boolean;
}) {
  const galleryKey = `${props.thumbnailUrl ?? ""}|${(props.imageUrls ?? []).join("|")}`;
  return <ModelDetailGalleryInner key={galleryKey} {...props} />;
}
