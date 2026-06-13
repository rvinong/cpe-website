import useOrganization from '../context/useOrganization'

function Logo({ compact = false, light = false }) {
  const { profile } = useOrganization()
  const shortName =
    profile.name.replace(/^NwSSU\s*/i, '').trim() || profile.name

  return (
    <a href="/" className="group inline-flex items-center gap-3">
      <span
        className={`size-11 shrink-0 overflow-hidden rounded-xl border transition-transform duration-300 group-hover:-translate-y-0.5 ${
          light
            ? 'border-white/20 shadow-lg shadow-black/20'
            : 'border-blue-200 shadow-lg shadow-blue-600/20'
        }`}
      >
        <img
          src="/images/nwssu-cpe-logo.png"
          alt={`${profile.name} logo`}
          className="h-full w-full object-cover"
        />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span
            className={`block text-[11px] font-bold tracking-[0.22em] uppercase ${
              light ? 'text-blue-200' : 'text-brand-600'
            }`}
          >
            NwSSU
          </span>
          <span
            className={`block max-w-52 text-[13px] font-extrabold tracking-tight sm:text-sm ${
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
