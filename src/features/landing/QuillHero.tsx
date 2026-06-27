'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export function QuillHero() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [exited, setExited] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // Trigger exit when less than 30% of the image is still visible
    const observer = new IntersectionObserver(
      ([entry]) => setExited(!entry.isIntersecting),
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`quill-scroll-fade${exited ? ' quill-exit' : ''}`}
    >
      {/* hover wrapper: scale + rotate on hover, pauses inner float */}
      <div className="quill-hover-wrapper">
        {/* float wrapper: idle bob animation */}
        <div className="quill-float">
          <div className="relative h-[200px] w-[200px] sm:h-[340px] sm:w-[340px]">
            <Image
              src="/images/quill.png"
              alt="SAJIL quill"
              fill
              className="quill-image object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
