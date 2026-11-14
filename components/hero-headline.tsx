"use client";

import SplitText from "@/components/SplitText";

/**
 * One orchestrated moment on the site: the headline lands word by word, once,
 * on load. With reduced motion ReactBits resolves it to plain text.
 */
export function HeroHeadline() {
  return (
    <h1 className="text-[2.6rem] leading-[1.02] tracking-[-0.02em] sm:text-6xl">
      <SplitText
        text="A company library,"
        tag="span"
        className="block"
        splitType="words"
        effect="rise"
        trigger="load"
        textAlign="left"
        delay={55}
        duration={1.1}
        threshold={0.1}
      />
      <SplitText
        text="kept by everyone."
        tag="span"
        className="block text-brand"
        splitType="words"
        effect="rise"
        trigger="load"
        textAlign="left"
        delay={55}
        duration={1.1}
      />
    </h1>
  );
}
