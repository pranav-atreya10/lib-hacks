"use client";

import SplitText from "@/components/SplitText";
import { site } from "@/lib/site";

/**
 * One orchestrated moment on the site: the name lands word by word, once, on
 * load, at a size that fills the first screen. With reduced motion ReactBits
 * resolves it to plain text.
 */
export function HeroHeadline() {
  return (
    <div>
      <h1 className="text-[2.9rem] leading-[1.02] font-semibold tracking-[-0.045em] sm:text-[4.25rem] lg:text-[5rem]">
        <SplitText
          text={site.name}
          tag="span"
          className="block"
          splitType="words"
          effect="rise"
          trigger="load"
          textAlign="left"
          delay={45}
          duration={0.9}
          threshold={0.1}
        />
      </h1>
      <p className="mt-3 text-[1.0625rem] leading-snug tracking-[-0.01em] text-muted-foreground sm:mt-4 sm:text-[1.5rem]">
        {site.purpose}
      </p>
    </div>
  );
}
