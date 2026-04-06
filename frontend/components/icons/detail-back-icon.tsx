interface DetailBackIconProps {
  className?: string;
}

export function DetailBackIcon({ className }: DetailBackIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M0 28C0 12.536 12.536 0 28 0C43.464 0 56 12.536 56 28C56 43.464 43.464 56 28 56C12.536 56 0 43.464 0 28Z" fill="#001024" fillOpacity="0.03" />
      <path d="M23.825 29L29.425 34.6L28 36L20 28L28 20L29.425 21.4L23.825 27H36V29H23.825Z" fill="#1D1B20" />
    </svg>
  );
}
