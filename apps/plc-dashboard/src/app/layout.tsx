import './globals.css'
import type { Metadata } from 'next'
import Sidebar from '@/components/Sidebar'
import TopNavbar from '@/components/TopNavbar'

export const metadata: Metadata = {
  title: 'PLC Dashboard',
  description: 'Industrial PLC Automation Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden bg-slate-900 text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopNavbar />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
