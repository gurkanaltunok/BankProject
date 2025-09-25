'use client'

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { sidebarLinks } from "@/constants"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const MobileNav = ({ user }: MobileNavProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/sign-in');
  };

  return (
    <section className="w-fulll max-w-[264px]">
      <Sheet>
        <SheetTrigger>
          <Image
            src="/icons/hamburger.svg"
            width={30}
            height={30}
            alt="menu"
            className="cursor-pointer"
          />
        </SheetTrigger>
        <SheetContent side="left" className="border-none bg-white">
          <Link href="/" className="cursor-pointer flex items-center gap-1 px-4">
            <Image 
              src="/icons/logo.svg"
              width={34}
              height={34}
              alt="Horizon logo"
            />
            <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">Agartha</h1>
          </Link>
          <div className="mobilenav-sheet">
            <SheetClose asChild>
              <nav className="flex h-full flex-col gap-6 pt-16 text-white">
                  {sidebarLinks.map((item) => {
                const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`)

                return (
                  <SheetClose asChild key={item.route}>
                    <Link href={item.route} key={item.label}
                      className={cn('mobilenav-sheet_close w-full', { 'bg-bank-gradient': isActive })}
                    >
                        <Image 
                          src={item.imgURL}
                          alt={item.label}
                          width={20}
                          height={20}
                          className={cn({
                            'brightness-[3] invert-0': isActive
                          })}
                        />
                      <p className={cn("text-16 font-semibold text-black-2", { "text-white": isActive })}>
                        {item.label}
                      </p>
                    </Link>
                  </SheetClose>
                )
              })}

            <div className="mt-6 border-t border-gray-200 pt-4 px-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full rounded-md px-3 py-2 hover:bg-gray-100 transition-colors"
              >
                <Image src="/icons/logout.svg" alt="Çıkış" width={18} height={18} />
                <span className="text-sm font-medium text-gray-900">Çıkış Yap</span>
              </button>
            </div>
              </nav>
            </SheetClose>
            
          </div>
        </SheetContent>
      </Sheet>
    </section>
  )
}

export default MobileNav