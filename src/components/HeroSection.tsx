'use client';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  fixed?: boolean;
}

export default function HeroSection({ title, subtitle, fixed = false }: HeroSectionProps) {
  const sectionClasses = fixed
    ? 'fixed inset-0 bg-black text-white h-screen w-full flex items-center justify-center z-20'
    : 'relative bg-black text-white min-h-[calc(100vh-3rem)] flex items-center justify-center';

  return (
    <section className={sectionClasses}>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
        <h1 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-medium tracking-[-0.05em] mb-12 leading-[1.1] font-libre-baskerville italic">
          {title}
        </h1>
        <p className="text-xl sm:text-2xl lg:text-3xl text-gray-300 leading-relaxed max-w-4xl mx-auto font-light tracking-tight">
          {subtitle}
        </p>
      </div>
    </section>
  );
}

