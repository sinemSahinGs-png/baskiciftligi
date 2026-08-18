"use client";

import { useState } from "react";

import { requestThingiverseReview } from "@/app/(store)/hazir-modeller/actions";

export function ThingiverseReviewForm(input: {
  externalId: string;
  title: string;
  creator: string;
  license: string;
  originalUrl: string;
}) {
  const [done, setDone] = useState(false);

  return (
    <form
      action={async () => {
        const result = await requestThingiverseReview(input);
        if (result.ok) {
          setDone(true);
        }
      }}
    >
      <button
        type="submit"
        disabled={done}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-cobalt text-sm font-semibold text-light-text disabled:opacity-45"
      >
        {done ? "İnceleme isteği kaydedildi" : "Üretim izni incelemesi iste"}
      </button>
    </form>
  );
}
