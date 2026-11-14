"use client";

import SplitText from "@/components/SplitText";

/**
 * One orchestrated moment on the site: the title lands word by word, once, on
 * load. With reduced motion ReactBits resolves it to plain text.
 */
export function HeroHeadline() {
  return (
    <h1 className="text-[1.75rem] leading-[1.15] tracking-[-0.025em] sm:text-[2rem]">
      <SplitText
        text="A company library,"
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
      <SplitText
        text="kept by everyone."
        tag="span"
        className="block text-muted-foreground"
        splitType="words"
        effect="rise"
        trigger="load"
        textAlign="left"
        delay={45}
        duration={0.9}
      />
    </h1>
  );
}
