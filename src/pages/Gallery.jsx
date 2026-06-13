import { AnimatePresence, motion as Motion } from 'framer-motion'
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ImageOff,
  Images,
  Maximize2,
  Newspaper,
  ShieldCheck,
  Tags,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { galleryPhotos } from '../data/gallery'
import { organizationNews } from '../data/news'

const archiveDetails = [
  {
    icon: Images,
    title: 'Event albums',
    description:
      'Photos will be grouped by workshops, outreach programs, competitions, and organization activities.',
  },
  {
    icon: Tags,
    title: 'Clear information',
    description:
      'Each album can include its official title, date, category, and a short activity description.',
  },
  {
    icon: ShieldCheck,
    title: 'Approved media',
    description:
      'Only organization-approved photos with appropriate publication permission will be displayed.',
  },
]

function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState('All categories')
  const [selectedYear, setSelectedYear] = useState('All years')
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null)

  const categories = useMemo(
    () =>
      [...new Set(galleryPhotos.map((photo) => photo.category))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [],
  )

  const years = useMemo(
    () =>
      [...new Set(galleryPhotos.map((photo) => String(photo.year)))].sort(
        (a, b) => b.localeCompare(a),
      ),
    [],
  )

  const albums = useMemo(
    () => [...new Set(galleryPhotos.map((photo) => photo.album))],
    [],
  )

  const filteredPhotos = useMemo(
    () =>
      galleryPhotos.filter((photo) => {
        const matchesCategory =
          selectedCategory === 'All categories' ||
          photo.category === selectedCategory
        const matchesYear =
          selectedYear === 'All years' || String(photo.year) === selectedYear

        return matchesCategory && matchesYear
      }),
    [selectedCategory, selectedYear],
  )

  const selectedPhoto =
    selectedPhotoIndex === null ? null : filteredPhotos[selectedPhotoIndex]

  useEffect(() => {
    if (selectedPhotoIndex === null) return undefined

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedPhotoIndex(null)
      if (event.key === 'ArrowLeft') {
        setSelectedPhotoIndex((current) =>
          current === 0 ? filteredPhotos.length - 1 : current - 1,
        )
      }
      if (event.key === 'ArrowRight') {
        setSelectedPhotoIndex((current) =>
          current === filteredPhotos.length - 1 ? 0 : current + 1,
        )
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [filteredPhotos.length, selectedPhotoIndex])

  const showPreviousPhoto = () => {
    setSelectedPhotoIndex((current) =>
      current === 0 ? filteredPhotos.length - 1 : current - 1,
    )
  }

  const showNextPhoto = () => {
    setSelectedPhotoIndex((current) =>
      current === filteredPhotos.length - 1 ? 0 : current + 1,
    )
  }

  return (
    <>
      <Navbar />
      <main className="pt-[72px]">
        <section className="relative isolate overflow-hidden border-b border-blue-100 bg-gradient-to-br from-white via-brand-50/70 to-blue-100/60 py-20 sm:py-24 lg:py-28">
          <div className="subtle-grid absolute inset-0 -z-20 opacity-60" />
          <div className="absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-brand-100/70 blur-3xl" />

          <div className="section-shell grid items-center gap-12 lg:grid-cols-[1fr_auto]">
            <Motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-xs font-extrabold tracking-[0.22em] text-brand-600 uppercase">
                Stories and organization moments
              </p>
              <h1 className="mt-4 text-5xl font-black tracking-[-0.055em] text-navy-900 sm:text-6xl">
                News & Gallery
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Official updates and a visual archive of Computer Engineering
                Organization activities, achievements, and shared experiences.
              </p>
            </Motion.div>

            <Motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.65, delay: 0.12 }}
              className="relative hidden size-48 place-items-center rounded-[2.25rem] border border-white/80 bg-white/75 text-brand-600 shadow-[0_28px_70px_-36px_rgba(21,94,239,0.55)] backdrop-blur lg:grid"
              aria-hidden="true"
            >
              <span className="absolute inset-5 rounded-[1.7rem] border border-dashed border-blue-200" />
              <Images size={67} strokeWidth={1.35} />
              <Camera
                size={25}
                className="absolute right-8 top-8 text-blue-300"
              />
            </Motion.div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-2xl text-center"
            >
              <p className="text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
                Official updates
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                Organization News
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Verified achievements, activities, partnerships, and community
                stories from the organization.
              </p>
            </Motion.div>

            {organizationNews.length === 0 ? (
              <Motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="mx-auto mt-10 max-w-3xl rounded-3xl border border-dashed border-blue-200 bg-brand-50/35 px-6 py-14 text-center sm:px-10"
              >
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-blue-100">
                  <Newspaper size={28} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-2xl font-black text-navy-900">
                  No organization news yet
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
                  No verified news stories have been published. Official
                  updates will appear here after their details are confirmed.
                </p>
              </Motion.div>
            ) : (
              <div className="mt-10 grid gap-6 lg:grid-cols-2">
                {organizationNews.map((article, index) => (
                  <Motion.article
                    key={article.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: index * 0.07 }}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_-40px_rgba(15,23,42,0.4)]"
                  >
                    {article.image && (
                      <img
                        src={article.image}
                        alt={article.imageAlt || ''}
                        className="h-60 w-full object-cover"
                      />
                    )}
                    <div className="p-6 sm:p-7">
                      <p className="text-xs font-extrabold tracking-wide text-brand-600 uppercase">
                        {article.category}
                      </p>
                      <h3 className="mt-2 text-2xl font-extrabold text-navy-900">
                        {article.title}
                      </h3>
                      <p className="mt-2 text-xs font-bold text-slate-400">
                        {article.date}
                      </p>
                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {article.summary}
                      </p>
                    </div>
                  </Motion.article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55 }}
              className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_-40px_rgba(15,23,42,0.35)] sm:p-6 md:grid-cols-2"
            >
              <label htmlFor="gallery-category">
                <span className="mb-2 block text-xs font-extrabold tracking-wide text-slate-500 uppercase">
                  Category
                </span>
                <select
                  id="gallery-category"
                  value={selectedCategory}
                  onChange={(event) => {
                    setSelectedCategory(event.target.value)
                    setSelectedPhotoIndex(null)
                  }}
                  className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-bold text-navy-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                >
                  <option>All categories</option>
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label htmlFor="gallery-year">
                <span className="mb-2 block text-xs font-extrabold tracking-wide text-slate-500 uppercase">
                  Year
                </span>
                <select
                  id="gallery-year"
                  value={selectedYear}
                  onChange={(event) => {
                    setSelectedYear(event.target.value)
                    setSelectedPhotoIndex(null)
                  }}
                  className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-bold text-navy-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                >
                  <option>All years</option>
                  {years.map((year) => (
                    <option key={year}>{year}</option>
                  ))}
                </select>
              </label>
            </Motion.div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: 'Published photos',
                  value: galleryPhotos.length,
                  icon: ImageIcon,
                },
                {
                  label: 'Available albums',
                  value: albums.length,
                  icon: Images,
                },
                {
                  label: 'Archive status',
                  value: 'Collecting',
                  icon: Camera,
                },
              ].map(({ label, value, icon: Icon }, index) => (
                <Motion.article
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-brand-50/45 p-5"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-blue-100">
                    <Icon size={21} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xl font-black text-navy-900">{value}</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-500">
                      {label}
                    </p>
                  </div>
                </Motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50/70 py-20 sm:py-24">
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-2xl text-center"
            >
              <p className="text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
                Media archive
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                Browse Event Photos
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Use the filters to explore approved organization photos by
                activity type and year.
              </p>
            </Motion.div>

            {filteredPhotos.length === 0 ? (
              <Motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="mx-auto mt-10 max-w-3xl rounded-3xl border border-dashed border-blue-200 bg-white px-6 py-14 text-center shadow-[0_24px_70px_-50px_rgba(15,23,42,0.38)] sm:px-10"
              >
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <ImageOff size={28} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-2xl font-black text-navy-900">
                  The photo archive is being prepared
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
                  No official gallery albums have been published yet. Approved
                  event photos, dates, and descriptions will appear here once
                  the organization archive is ready.
                </p>
              </Motion.div>
            ) : (
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPhotos.map((photo, index) => (
                  <Motion.button
                    key={photo.id}
                    type="button"
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.45, delay: index * 0.04 }}
                    onClick={() => setSelectedPhotoIndex(index)}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_20px_60px_-40px_rgba(15,23,42,0.4)]"
                  >
                    <span className="relative block aspect-[4/3] overflow-hidden">
                      <img
                        src={photo.image}
                        alt={photo.alt}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-navy-950/65 via-transparent to-transparent" />
                      <span className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl bg-white/90 text-brand-600 opacity-0 shadow-sm transition group-hover:opacity-100">
                        <Maximize2 size={18} aria-hidden="true" />
                      </span>
                    </span>
                    <span className="block p-5">
                      <span className="text-xs font-extrabold tracking-wide text-brand-600 uppercase">
                        {photo.category}
                      </span>
                      <span className="mt-2 block text-lg font-extrabold text-navy-900">
                        {photo.album}
                      </span>
                      <span className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <CalendarDays size={15} aria-hidden="true" />
                        {photo.date}
                      </span>
                    </span>
                  </Motion.button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="section-shell">
            <Motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <p className="text-xs font-extrabold tracking-[0.2em] text-brand-600 uppercase">
                Archive standards
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-navy-900 sm:text-4xl">
                How the gallery is organized
              </h2>
            </Motion.div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {archiveDetails.map(({ icon: Icon, title, description }, index) => (
                <Motion.article
                  key={title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.5, delay: index * 0.07 }}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.32)]"
                >
                  <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-extrabold text-navy-900">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                </Motion.article>
              ))}
            </div>

            <Motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5 }}
              className="mt-12 rounded-3xl bg-navy-950 px-6 py-10 text-center text-white shadow-[0_30px_80px_-44px_rgba(7,21,47,0.8)] sm:px-10"
            >
              <Camera
                size={30}
                className="mx-auto text-blue-300"
                aria-hidden="true"
              />
              <h2 className="mt-4 text-2xl font-black">
                Building the official photo archive
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Event name, date, album description, and approved image files
                are needed before an activity can be published in the gallery.
              </p>
            </Motion.div>
          </div>
        </section>
      </main>
      <Footer />

      <AnimatePresence>
        {selectedPhoto && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] grid place-items-center bg-navy-950/95 p-4 backdrop-blur-sm sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedPhoto.album} photo viewer`}
            onClick={() => setSelectedPhotoIndex(null)}
          >
            <button
              type="button"
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute right-4 top-4 grid size-11 place-items-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 sm:right-8 sm:top-8"
              aria-label="Close photo viewer"
            >
              <X size={22} />
            </button>

            {filteredPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    showPreviousPhoto()
                  }}
                  className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 sm:left-8"
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    showNextPhoto()
                  }}
                  className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 sm:right-8"
                  aria-label="Next photo"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <Motion.figure
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              onClick={(event) => event.stopPropagation()}
              className="max-w-5xl"
            >
              <img
                src={selectedPhoto.image}
                alt={selectedPhoto.alt}
                className="max-h-[72vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />
              <figcaption className="mx-auto max-w-3xl px-2 pt-5 text-center">
                <p className="text-lg font-extrabold text-white">
                  {selectedPhoto.album}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {selectedPhoto.date}
                  {selectedPhoto.description
                    ? ` - ${selectedPhoto.description}`
                    : ''}
                </p>
              </figcaption>
            </Motion.figure>
          </Motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Gallery
