import useOrganization from '../context/useOrganization'

function Logo({ className = '', compact = false, light = false }) {
  const { profile } = useOrganization()
  const shortName =
    profile.name.replace(/^NwSSU\s*/i, '').trim() || profile.name

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
          alt={`${profile.name} logo`}
          width="40"
          height="40"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </span>
      {!compact && (
        <span className="block min-w-0 leading-tight">
          <span
            className={`block text-[9px] font-bold tracking-[0.18em] uppercase sm:text-[11px] sm:tracking-[0.22em] ${
              light ? 'text-blue-200' : 'text-brand-600'
            }`}
          >
            NwSSU
          </span>
          <span
            className={`block max-w-[8.5rem] truncate text-[11px] font-extrabold tracking-tight min-[375px]:max-w-[11rem] sm:max-w-52 sm:text-[13px] ${
              light ? 'text-white' : 'text-navy-900'
            }`}
          >
            {shortName}
          </span>
        </span>
      )}
    </a>
  )
}

export default Logo
