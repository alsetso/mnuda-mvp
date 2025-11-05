'use client';

interface MainContentNavProps {
  title: string;
}

export default function MainContentNav({ title }: MainContentNavProps) {
  return (
    <div 
      className="sticky top-0 bg-gold-100 border-b border-gray-200 z-10 -mx-4 sm:-mx-6 lg:-mx-8"
      style={{
        marginTop: 0,
        height: '50px',
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <h1 className="text-base font-bold text-black">
          {title}
        </h1>
      </div>
    </div>
  );
}

