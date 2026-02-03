import Image from 'next/image';

export default function Header() {
    return (
        <header className='max-w-[30px] mt-5 mb-6 mx-auto'>
            <div className='flex flex-col items-center gap-2'>
                <Image
                    src="/logo.svg"
                    alt="App Logo"
                    width={24}
                    height={24}
                />
                <p className="font-medium inline-block select-none px-1 py-0.5 tracking-wider rounded-sm shrink-0 border border-neutral-700 text-white text-[8px]">BETA</p>
            </div>
        </header>
    );
}