// *********************
// Role of the component: Classical hero component on home page
// Name of the component: Hero.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <Hero />
// Input parameters: no input parameters
// Output: Classical hero component with two columns on desktop and one column on smaller devices
// *********************

import Image from "next/image";
import React from "react";

const Hero = () => {
  return (
    <section className="w-full bg-white px-4 py-4 md:px-8 md:py-2">
      <div className="relative mx-auto h-[250px] w-[1560px] overflow-hidden rounded-2xl sm:h-[400px] md:h-[500px] lg:h-[500px] xl:h-[600px]">
        <Image
          src="/banner.png"
          alt="Heksagonal Trading Banner"
          fill
          priority
          className="object-contain object-center"
          sizes="100vw"
        />
        {/* <div className="flex flex-1 flex-col gap-y-5">
          <h1 className="text-5xl font-bold max-lg:text-4xl max-sm:text-3xl">
            HEKSAGONAL TRADING
          </h1>

          <p className="text-gray-200 leading-relaxed max-sm:text-sm">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit.
            Dolor modi iure laudantium necessitatibus ab, voluptates
            vitae ullam. Officia ipsam iusto beatae nesciunt,
            consequatur deserunt minima maiores earum obcaecati.
          </p>

          <div className="flex flex-wrap gap-3 max-sm:flex-col">
            <button className="bg-white px-8 py-3 font-bold text-[#02054b] transition hover:bg-gray-100">
              BUY NOW
            </button>

            <button className="border border-white px-8 py-3 font-bold text-white transition hover:bg-white hover:text-[#02054b]">
              LEARN MORE
            </button>
          </div>
        </div>

        <div className="flex flex-1 justify-center">
          <Image
            src="/watch for banner.png"
            width={400}
            height={400}
            alt="Smart watch"
            className="h-auto w-full max-w-[350px] object-contain max-md:max-w-[280px]"
          />
        </div> */}
      </div>
    </section>
  );
};

export default Hero;
