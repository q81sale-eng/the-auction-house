import React, { useEffect, useMemo, useRef, useState } from "react";

type GalleryImage = {
  id?: number | string;
  url: string;
  alt?: string;
};

type WatchGalleryProps = {
  images: GalleryImage[];
  title?: string;
};

export default function WatchGallery({ images, title }: WatchGalleryProps) {
  const safeImages = useMemo(
    () => images.filter((img) => !!img?.url),
    [images]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [safeImages.length]);

  if (!safeImages.length) {
    return (
      <div
        style={{
          border: "1px solid #333",
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#999",
          background: "#111",
        }}
      >
        لا توجد صور
      </div>
    );
  }

  const current = safeImages[selectedIndex];

  const goPrev = () => {
    setSelectedIndex((prev) =>
      prev === 0 ? safeImages.length - 1 : prev - 1
    );
  };

  const goNext = () => {
    setSelectedIndex((prev) =>
      prev === safeImages.length - 1 ? 0 : prev + 1
    );
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.changedTouches[0].clientX;
    touchEndX.current = null;
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.changedTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const deltaX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (deltaX > minSwipeDistance) {
      goNext();
    } else if (deltaX < -minSwipeDistance) {
      goPrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div style={{ width: "100%" }}>
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: "relative",
          background: "#111",
          border: "1px solid #333",
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <img
          src={current.url}
          alt={current.alt || title || "watch image"}
          style={{
            width: "100%",
            maxHeight: 600,
            objectFit: "contain",
            display: "block",
            background: "#111",
          }}
        />

        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="الصورة السابقة"
              style={arrowButtonStyle("left")}
            >
              ‹
            </button>

            <button
              type="button"
              onClick={goNext}
              aria-label="الصورة التالية"
              style={arrowButtonStyle("right")}
            >
              ›
            </button>
          </>
        )}
      </div>

      {safeImages.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            paddingTop: 16,
          }}
        >
          {safeImages.map((img, index) => {
            const isActive = index === selectedIndex;

            return (
              <button
                key={img.id ?? `${img.url}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                style={{
                  border: isActive ? "2px solid #d4af37" : "1px solid #444",
                  background: "#111",
                  padding: 0,
                  minWidth: 84,
                  width: 84,
                  height: 84,
                  cursor: "pointer",
                  opacity: isActive ? 1 : 0.75,
                  boxShadow: isActive
                    ? "0 0 0 1px rgba(212,175,55,0.35)"
                    : "none",
                }}
                aria-label={`اختر الصورة ${index + 1}`}
              >
                <img
                  src={img.url}
                  alt={img.alt || `thumbnail ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function arrowButtonStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: 12,
    transform: "translateY(-50%)",
    width: 40,
    height: 40,
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: 28,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  };
}
