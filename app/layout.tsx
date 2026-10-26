import type {Metadata} from 'next';
import './globals.css';
import './experience.css';
export const metadata:Metadata={title:'Karga — Small actions. Real impact.',description:'Understand your journey footprint, make greener choices, and earn organizer-verified rewards.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
