interface DresscodeLookIconProps {
  className?: string;
}

export function DresscodeMaleIcon({ className }: DresscodeLookIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 92 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="92" height="92" rx="46" fill="#001024" fillOpacity="0.03" />
      <mask id="dresscode-male-mask" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="18" y="18" width="56" height="56">
        <path d="M25.2998 62.1008C25.2998 54.4793 31.4783 48.3008 39.0998 48.3008H52.8998C60.5213 48.3008 66.6998 54.4793 66.6998 62.1008V69.0008H25.2998V62.1008Z" fill="black" />
        <path
          opacity="0.35"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M55.7133 25.1914C54.7712 26.9961 52.8822 28.228 50.7055 28.228H45.06C41.9421 28.228 39.4146 30.7556 39.4146 33.8735V42.7987C41.204 44.2765 43.4988 45.1644 46.0009 45.1644C51.7171 45.1644 56.3509 40.5306 56.3509 34.8144V28.228C56.3509 27.1475 56.1233 26.1202 55.7133 25.1914Z"
          fill="black"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M55.7123 25.1908C54.5449 22.5461 51.8993 20.7002 48.8226 20.7002H35.6499V34.8138C35.6499 38.0279 37.1149 40.8997 39.4135 42.7981V33.8729C39.4135 30.755 41.9411 28.2275 45.059 28.2275H50.7044C52.8812 28.2275 54.7702 26.9955 55.7123 25.1908Z"
          fill="url(#dresscode-male-gradient)"
        />
      </mask>
      <g mask="url(#dresscode-male-mask)">
        <path d="M18.3999 18.4004H73.5999V73.6004H18.3999V18.4004Z" fill="#333333" />
      </g>
      <defs>
        <linearGradient id="dresscode-male-gradient" x1="42.5499" y1="20.7002" x2="42.5499" y2="42.7981" gradientUnits="userSpaceOnUse">
          <stop />
          <stop offset="1" stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function DresscodeFemaleIcon({ className }: DresscodeLookIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="72" height="72" rx="36" fill="#001024" fillOpacity="0.03" />
      <mask id="dresscode-female-mask" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="14" y="14" width="44" height="44">
        <path
          opacity="0.9"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M28.7989 45.0008H26.0987C24.8227 45.0008 23.6242 44.6688 22.5849 44.0866C21.9521 45.4602 21.5991 46.9893 21.5991 48.6008V54.0008H50.3991V48.6008C50.3991 42.6361 45.5638 37.8008 39.5991 37.8008H35.9989C35.9989 41.7772 32.7754 45.0008 28.7989 45.0008Z"
          fill="black"
        />
        <path
          opacity="0.35"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M35.999 35.346V27.9006C35.999 24.9182 38.4167 22.5006 41.399 22.5006H42.2992C42.7604 22.5006 43.2013 22.4139 43.6065 22.2559C43.9258 23.1785 44.0993 24.1693 44.0993 25.2006V27.246C44.0993 31.7195 40.4728 35.346 35.9993 35.346C35.9992 35.346 35.9991 35.346 35.999 35.346Z"
          fill="black"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M26.0987 45.0008H28.7989C32.7754 45.0008 35.9989 41.7772 35.9989 37.8008V27.9008C35.9989 24.9184 38.4166 22.5008 41.3989 22.5008H42.2992C43.3279 22.5008 44.2558 22.0693 44.9118 21.3775C44.3725 17.9346 41.3933 15.3008 37.7989 15.3008H34.1987C29.2281 15.3008 25.1986 19.3304 25.1987 24.301L25.1989 30.6008L25.1992 35.2805C25.1992 37.6665 23.2649 39.6008 20.8789 39.6008C20.1514 39.6008 19.4869 39.3311 18.98 38.8862C19.5033 42.3476 22.4912 45.0008 26.0987 45.0008Z"
          fill="url(#dresscode-female-gradient)"
        />
      </mask>
      <g mask="url(#dresscode-female-mask)">
        <path d="M14.3999 14.4004H57.5999V57.6004H14.3999V14.4004Z" fill="#333333" />
      </g>
      <defs>
        <linearGradient id="dresscode-female-gradient" x1="28.8664" y1="15.3008" x2="34.4514" y2="42.4658" gradientUnits="userSpaceOnUse">
          <stop />
          <stop offset="1" stopOpacity="0.35" />
        </linearGradient>
      </defs>
    </svg>
  );
}
