import Image from "next/image";

const Hero = () => {
  return (
    <section className="bg-slate-50 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-screen-2xl">
        <div className="group relative isolate aspect-[16/7] min-h-[180px] w-full overflow-hidden rounded-2xl bg-[#02054b] shadow-lg sm:aspect-[16/6] sm:min-h-[280px] lg:rounded-3xl">
          <Image
            src="/banner.png"
            alt="HEKSAGONAL Trading — perlengkapan dan kebutuhan industri"
            fill
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1536px) 96vw, 1536px"
            className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;