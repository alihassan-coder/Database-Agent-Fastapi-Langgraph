import { Poppins } from "next/font/google";
import "./globals.css";

// Define your main font (Poppins)
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], 
});

// (Optional) If you wanted a mono font for code or UI elements
// You can use another Google font like JetBrains_Mono or Roboto_Mono
// For now, we'll just remove the duplicate Poppins call.

export const metadata = {
  title: "Database Agent - AI-Powered Database Assistant",
  description:
    "Real-time database management with AI agent chat interface and live database visualization",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
