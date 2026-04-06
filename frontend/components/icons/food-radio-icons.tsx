import { useId, type SVGProps } from "react";

export function FoodRadioOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M23 1.0459C35.1252 1.0459 44.9541 10.8748 44.9541 23C44.9541 35.1252 35.1252 44.9541 23 44.9541C10.8748 44.9541 1.0459 35.1252 1.0459 23C1.0459 10.8748 10.8748 1.0459 23 1.0459Z"
        stroke="#001024"
        strokeOpacity="0.22"
        strokeWidth="2.09091"
      />
    </svg>
  );
}

export function FoodRadioOnIcon(props: SVGProps<SVGSVGElement>) {
  const maskId = useId();

  return (
    <svg viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23 46C35.7026 46 46 35.7026 46 23C46 10.2975 35.7026 0 23 0C10.2975 0 0 10.2975 0 23C0 35.7026 10.2975 46 23 46Z"
        fill="black"
      />
      <mask id={maskId} style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="6" y="6" width="34" height="34">
        <path
          d="M32.0675 15.34C33.0065 14.401 34.529 14.401 35.468 15.34C36.407 16.2791 36.407 17.8015 35.468 18.7406L20.8316 33.3769C19.8926 34.316 18.3701 34.316 17.4311 33.3769L11.1584 27.1042C10.2193 26.1652 10.2193 24.6427 11.1584 23.7037C12.0974 22.7646 13.6199 22.7646 14.5589 23.7037L19.1314 28.2761L32.0675 15.34Z"
          fill="black"
        />
      </mask>
      <g mask={`url(#${maskId})`}>
        <rect x="6.27246" y="6.27246" width="33.4545" height="33.4545" fill="white" />
      </g>
    </svg>
  );
}
