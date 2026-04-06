"use client";

import { useEffect, useState } from "react";

interface HintProps {
  className?: string;
  imageSrc?: string;
  imageAlt?: string;
  showDurationMs?: number;
  removeDelayMs?: number;
}

export function Hint({
  className,
  imageSrc = "/hint-bubble.svg",
  imageAlt = "",
  showDurationMs = 2600,
  removeDelayMs = 3400
}: HintProps) {
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    setShouldRender(true);

    const frameId = window.requestAnimationFrame(() => {
      setVisible(true);
    });
    const hideTimerId = window.setTimeout(() => {
      setVisible(false);
    }, showDurationMs);
    const removeTimerId = window.setTimeout(() => {
      setShouldRender(false);
    }, removeDelayMs);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(hideTimerId);
      window.clearTimeout(removeTimerId);
    };
  }, [removeDelayMs, showDurationMs]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div className={`hint ${visible ? "isVisible" : ""} ${className ?? ""}`.trim()} aria-hidden="true">
      <img className="hintImage" src={imageSrc} alt={imageAlt} draggable="false" />
    </div>
  );
}
