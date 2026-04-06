import { useId, type SVGProps } from "react";

export function FoodCategoryTabIcon(props: SVGProps<SVGSVGElement>) {
  const maskId = useId();
  const lightGradientId = useId();
  const darkGradientId = useId();
  const midGradientId = useId();

  return (
    <svg viewBox="643.822 164.106 21.428 21.429" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <mask id={maskId} style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="645" y="166" width="17" height="16">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M661.679 180.178C661.679 174.601 658.837 169.687 654.523 166.805L645.607 180.178H649.224C649.194 180.034 649.179 179.885 649.179 179.732C649.179 178.499 650.178 177.5 651.411 177.5C652.644 177.5 653.643 178.499 653.643 179.732C653.643 179.885 653.628 180.034 653.598 180.178H661.679ZM650.499 172.841L652.941 169.178C653.373 169.585 653.643 170.163 653.643 170.803C653.643 172.036 652.644 173.035 651.411 173.035C651.086 173.035 650.777 172.966 650.499 172.841ZM658.834 178.06C658.6 176.593 658.129 175.205 657.46 173.937C656.321 174.039 655.429 174.995 655.429 176.16C655.429 177.393 656.428 178.393 657.661 178.393C658.091 178.393 658.493 178.271 658.834 178.06Z"
          fill={`url(#${lightGradientId})`}
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M659 180.178H661.679C661.679 174.601 658.837 169.687 654.523 166.805L653.037 169.034C656.632 171.435 659 175.53 659 180.178Z"
          fill={`url(#${darkGradientId})`}
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M652.941 169.178L650.499 172.841C650.777 172.966 651.086 173.035 651.411 173.035C652.644 173.035 653.643 172.036 653.643 170.803C653.643 170.162 653.373 169.585 652.941 169.178ZM653.598 180.178H649.223C649.194 180.034 649.179 179.885 649.179 179.732C649.179 178.499 650.178 177.499 651.411 177.499C652.644 177.499 653.643 178.499 653.643 179.732C653.643 179.885 653.628 180.034 653.598 180.178ZM657.46 173.937C658.129 175.205 658.6 176.592 658.834 178.06C658.493 178.271 658.091 178.392 657.661 178.392C656.428 178.392 655.429 177.393 655.429 176.16C655.429 174.995 656.321 174.039 657.46 173.937Z"
          fill={`url(#${midGradientId})`}
        />
      </mask>
      <path
        d="M645.607 181.964V180.178H659C659.274 179.631 659.833 179.285 660.445 179.285H661.679V181.964H645.607Z"
        fill="black"
      />
      <g mask={`url(#${maskId})`}>
        <path d="M643.822 164.106H665.25V185.535H643.822V164.106Z" fill="#428BF9" />
      </g>
      <defs>
        <linearGradient id={lightGradientId} x1="653.197" y1="169.018" x2="653.197" y2="180.178" gradientUnits="userSpaceOnUse">
          <stop stopOpacity="0.35" />
          <stop offset="1" stopOpacity="0.62" />
        </linearGradient>
        <linearGradient id={darkGradientId} x1="657.358" y1="166.805" x2="657.358" y2="180.178" gradientUnits="userSpaceOnUse">
          <stop />
          <stop offset="1" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={midGradientId} x1="654.006" y1="169.178" x2="654.006" y2="180.178" gradientUnits="userSpaceOnUse">
          <stop stopOpacity="0.1" />
          <stop offset="1" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );
}
