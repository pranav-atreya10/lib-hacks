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
      <h1 className="font-display text-[3.75rem] leading-[0.92] sm:text-[5.5rem] lg:text-[6rem]">
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
      <p className="mt-4 font-display text-[1.75rem] leading-tight text-brand-ink italic sm:mt-6 sm:text-[2.5rem]">
        {site.purpose}
      </p>
    </div>
  );
}
