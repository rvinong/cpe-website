import useOrganization from '../context/useOrganization'
import { siteBrand } from '../data/site'

function Logo({ className = '', compact = false, light = false }) {
  const { profile } = useOrganization()

  return (
    <a
      href="/"
      className={`group inline-flex min-w-0 items-center gap-2 sm:gap-3 ${className}`}
    >
      <span
        className={`size-10 shrink-0 overflow-hidden rounded-xl border transition-transform duration-300 group-hover:-translate-y-0.5 ${
          light
            ? 'border-white/20 shadow-lg shadow-black/20'
            : 'border-blue-200 shadow-lg shadow-blue-600/20'
        }`}
      >
        <img
          src="/images/nwssu-cpe-logo.png"
          alt={`${siteBrand.name}, ${profile.name}`}
          width="40"
          height="40"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </span>
      {!compact && (
        <span className="block min-w-0">
          <span
            className={`block max-w-[9rem] truncate text-[13px] font-extrabold tracking-tight min-[375px]:max-w-[11rem] sm:max-w-52 sm:text-[15px] ${
              light ? 'text-white' : 'text-navy-900'
            }`}
          >
            {siteBrand.name}
          </span>
        </span>
      )}
    </a>
  )
}

export default Logo
