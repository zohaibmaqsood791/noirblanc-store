const IMAGES = [
  { src: "/ugc/ugc-1.webp",  alt: "Customer photo" },
  { src: "/ugc/ugc-2.webp",  alt: "Customer photo" },
  { src: "/ugc/ugc-3.webp",  alt: "Customer photo" },
  { src: "/ugc/ugc-4.webp",  alt: "Customer photo" },
  { src: "/ugc/ugc-5.webp",  alt: "Customer photo" },
  { src: "/ugc/ugc-6.webp",  alt: "Customer photo" },
  { src: "/ugc/ugc-7.webp",  alt: "Customer photo" },
  { src: "/ugc/ugc-8.webp",  alt: "Customer photo" },
  { src: "/ugc/ugc-9.webp",  alt: "Customer photo" },
];

// Duplicate for seamless loop
const TRACK = [...IMAGES, ...IMAGES];

export default function CustomerMarquee() {
  return (
    <section className="py-10 overflow-hidden bg-white border-t border-neutral-100">
      <div className="text-center mb-6 px-4">
        <p className="text-[11px] tracking-widest uppercase text-neutral-400 mb-1">As seen on you</p>
        <h3 className="text-xl font-semibold text-neutral-900">Real customers, real style</h3>
      </div>

      {/* Marquee track */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, white, transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, white, transparent)" }} />

        <div className="flex gap-3 w-max animate-marquee">
          {TRACK.map((img, i) => (
            <div
              key={i}
              className="flex-none w-[160px] sm:w-[200px] rounded-xl overflow-hidden bg-neutral-100"
              style={{ aspectRatio: "3/4" }}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
