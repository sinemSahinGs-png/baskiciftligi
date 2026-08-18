# syntax=docker/dockerfile:1.7
FROM debian:bookworm-slim AS prusa

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl \
    libglu1-mesa libgtk-3-0 libwebkit2gtk-4.1-0 \
    locales \
  && rm -rf /var/lib/apt/lists/*

# Official PrusaSlicer 2.8.1 Linux AppImage (newer-distros / GTK3).
ARG PRUSA_URL=https://github.com/prusa3d/PrusaSlicer/releases/download/version_2.8.1/PrusaSlicer-2.8.1+linux-x64-newer-distros-GTK3-202409181416.AppImage
RUN curl -L --fail -o /tmp/prusaslicer.AppImage "$PRUSA_URL" \
  && chmod +x /tmp/prusaslicer.AppImage \
  && cd /opt \
  && /tmp/prusaslicer.AppImage --appimage-extract \
  && mv squashfs-root prusa-slicer \
  && rm /tmp/prusaslicer.AppImage \
  && test -x /opt/prusa-slicer/usr/bin/prusa-slicer || test -x /opt/prusa-slicer/AppRun

FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libglu1-mesa libgtk-3-0 libwebkit2gtk-4.1-0 libegl1 \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 10001 slicer \
  && useradd --uid 10001 --gid 10001 --create-home --home-dir /home/slicer --shell /usr/sbin/nologin slicer

COPY --from=prusa /opt/prusa-slicer /opt/prusa-slicer
COPY apps/slicer-worker/src /app/src
COPY apps/slicer-worker/profiles /app/profiles

ENV PRUSA_SLICER_BIN=/opt/prusa-slicer/usr/bin/prusa-slicer \
    SLICER_PROFILE_ROOT=/app/profiles \
    SLICER_JOB_ROOT=/tmp/slicer-jobs \
    NODE_ENV=production

WORKDIR /app
RUN mkdir -p /tmp/slicer-jobs && chown -R slicer:slicer /app /tmp/slicer-jobs /home/slicer \
  && if [ ! -x /opt/prusa-slicer/usr/bin/prusa-slicer ] && [ -x /opt/prusa-slicer/AppRun ]; then \
       printf '#!/bin/sh\nexec /opt/prusa-slicer/AppRun "$@"\n' > /usr/local/bin/prusa-slicer && chmod +x /usr/local/bin/prusa-slicer; \
     fi

USER slicer
EXPOSE 8788
HEALTHCHECK --interval=20s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:8788/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/index.mjs"]
