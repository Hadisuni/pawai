export default function PawLogo({ size = 30 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size }}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M32 36c-7.2 0-13 4.6-13 11 0 4.1 3.4 6.5 7.6 6.5 2.3 0 3.8-.9 5.4-.9s3.1.9 5.4.9c4.2 0 7.6-2.4 7.6-6.5 0-6.4-5.8-11-13-11Z"
        fill="#2EDCA8"
      />
      <ellipse cx="18.5" cy="30.5" rx="5" ry="6.2" fill="#2EDCA8" />
      <ellipse cx="45.5" cy="30.5" rx="5" ry="6.2" fill="#2EDCA8" />
      <ellipse cx="27" cy="20" rx="4.6" ry="5.8" fill="#2EDCA8" />
      <ellipse cx="40" cy="20" rx="4.6" ry="5.8" fill="#F0915A" />
      <path
        d="M40 16.4l1.1 2.3 2.5.3-1.9 1.7.5 2.5L40 22l-2.2 1.2.5-2.5-1.9-1.7 2.5-.3L40 16.4Z"
        fill="#050e0a"
      />
    </svg>
  );
}
