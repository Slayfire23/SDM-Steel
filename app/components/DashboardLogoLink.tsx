import Image from "next/image";
import logo from "../images/SDM Steel.jpg";

export default function DashboardLogoLink() {
  return (
    <a
      href="/"
      aria-label="Return to dashboard"
      className="inline-flex rounded-md focus:outline-none focus:ring-4 focus:ring-cyan-300/30"
    >
      <Image
        src={logo}
        alt="SDM Steel"
        className="h-16 w-auto rounded-md object-contain"
        priority
      />
    </a>
  );
}
