import Image from "next/image";

const Hero = () => {
  return (
    <section className="bg-slate-50 px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-container">
        <div
          className="
            group relative isolate
            aspect-[16/9] w-full
            overflow-hidden rounded-xl
            bg-[#02054b] shadow-md
            sm:aspect-[16/6] sm:rounded-2xl sm:shadow-lg
            lg:aspect-[16/5] lg:rounded-3xl
          "
        >
          <Image
            src="/banner.png"
            alt="HEKSAGONAL Trading — perlengkapan dan kebutuhan industri"
            fill
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1536px) 96vw, 1536px"
            className="
              object-cover object-center
              transition-transform duration-700
              group-hover:scale-[1.02]
            "
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;