'use client'

import { sidebarLinks } from '@/constants'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const Sidebar = ({ user }: SiderbarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/sign-in');
  };

  return (
    <section className="sidebar">
      <nav className="flex flex-col gap-4">
        <Link href="/" className="mb-12 cursor-pointer flex items-center gap-2">
          <Image 
            src="/icons/logo.svg"
            width={34}
            height={34}
            alt="Agartha logo"
            className="size-[24px] max-xl:size-14"
          />
          <h1 className="sidebar-logo">AGARTHA</h1>
        </Link>

        {sidebarLinks.map((item) => {
          const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`)

          return (
            <Link href={item.route} key={item.label}
              className={cn('sidebar-link', { 'bg-bank-gradient': isActive })}
            >
              <div className="relative size-6">
                <Image 
                  src={item.imgURL}
                  alt={item.label}
                  fill
                  className={cn({
                    'brightness-[3] invert-0': isActive
                  })}
                />
              </div>
              <p className={cn("sidebar-label", { "!text-white": isActive })}>
                {item.label}
              </p>
            </Link>
          )
        })}

      </nav>

      {/* User Section */}
      <div className="sidebar-footer">
        <div className="flex items-center gap-3 p-4 border-t border-gray-200">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user.name} {user.surname}
            </p>
            <p className="text-xs text-gray-500">
              {user.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            title="Çıkış Yap"
          >
            <Image 
              src="/icons/logout.svg"
              width={16}
              height={16}
              alt="Çıkış"
            />
          </button>
        </div>
      </div>
    </section>
  )
}

export default Sidebar