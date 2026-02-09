import Image from "next/image"
import Link from "next/link"

export function BrandHeader() {
    return (
        <header className="w-full bg-primary border-b border-white/5">
            <div className="w-full px-4 lg:w-[70%] lg:px-0 mx-auto grid grid-cols-12 gap-8">
                <div className="col-span-12 py-6 flex items-center">
                    <Link href="/" className="inline-block">
                        <Image
                            src="/logo_ianord.svg"
                            alt="Logo Ianord"
                            width={120}
                            height={40}
                            className="h-8 w-auto"
                            priority
                        />
                    </Link>
                </div>
            </div>
        </header>
    )
}
