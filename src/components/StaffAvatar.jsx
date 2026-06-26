import ProfileAvatar from './ProfileAvatar'

function StaffAvatar({
  path,
  name,
  className = 'size-12 rounded-xl',
  textClassName = 'text-sm',
}) {
  return (
    <ProfileAvatar
      path={path}
      name={name}
      fallbackLabel="Staff member"
      className={className}
      textClassName={textClassName}
    />
  )
}

export default StaffAvatar
