function CurriculumTable({ term }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="hidden grid-cols-[110px_minmax(260px,1fr)_145px_70px_minmax(210px,0.8fr)] gap-4 border-b border-slate-300 bg-slate-50 px-5 py-3 text-[11px] font-extrabold tracking-[0.12em] text-slate-500 uppercase lg:grid">
        <span>Code</span>
        <span>Course</span>
        <span>Hours</span>
        <span>Units</span>
        <span>Requirements</span>
      </div>

      <div className="divide-y divide-slate-100">
        {term.courses.map((course) => {
          const hasRequirements =
            course.prerequisites?.length || course.corequisites?.length

          return (
            <article
              key={`${term.id}-${course.code}`}
              className="grid gap-4 px-5 py-5 transition hover:bg-brand-50/35 lg:grid-cols-[110px_minmax(260px,1fr)_145px_70px_minmax(210px,0.8fr)] lg:items-center"
            >
              <div>
                <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase lg:hidden">
                  Course code
                </span>
                <p className="mt-1 font-mono text-sm font-bold text-brand-600 lg:mt-0">
                  {course.code}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase lg:hidden">
                  Course
                </span>
                <h4 className="mt-1 font-extrabold text-navy-900 lg:mt-0">
                  {course.title}
                </h4>
                {course.description && (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {course.description}
                  </p>
                )}
              </div>

              <div>
                <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase lg:hidden">
                  Contact hours
                </span>
                <p className="mt-1 text-sm text-slate-600 lg:mt-0">
                  Lec {course.lecture} · Lab {course.laboratory}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase lg:hidden">
                  Units
                </span>
                <p className="mt-1 text-sm font-black text-navy-900 lg:mt-0">
                  {course.units}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase lg:hidden">
                  Requirements
                </span>
                {hasRequirements ? (
                  <div className="mt-1 space-y-1 text-xs leading-5 text-slate-600 lg:mt-0">
                    {course.prerequisites?.length > 0 && (
                      <p>
                        <strong className="font-extrabold text-slate-700">
                          Prerequisite:
                        </strong>{' '}
                        {course.prerequisites.join(', ')}
                      </p>
                    )}
                    {course.corequisites?.length > 0 && (
                      <p>
                        <strong className="font-extrabold text-slate-700">
                          Corequisite:
                        </strong>{' '}
                        {course.corequisites.join(', ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-400 lg:mt-0">None</p>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default CurriculumTable
