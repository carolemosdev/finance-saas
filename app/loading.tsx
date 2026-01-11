import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row animate-pulse">
      
      {/* Sidebar Skeleton (Desktop) */}
      <div className="hidden md:block w-72 bg-slate-900 h-screen p-8 space-y-8">
        <div className="h-8 w-32 bg-slate-800 rounded-lg opacity-50"></div>
        <div className="space-y-4">
           {[1,2,3,4,5,6].map(i => <div key={i} className="h-10 w-full bg-slate-800 rounded-xl opacity-30"></div>)}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 p-8 space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
            <div className="h-4 w-64 bg-slate-200 rounded-lg"></div>
          </div>
          <div className="h-12 w-40 bg-slate-200 rounded-full"></div>
        </div>

        {/* Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[1,2,3,4].map(i => (
             <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
           ))}
        </div>

        {/* Charts & Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-96">
           <div className="lg:col-span-2 bg-slate-200 rounded-2xl"></div>
           <div className="lg:col-span-1 bg-slate-200 rounded-2xl"></div>
        </div>
        
        <div className="h-64 bg-slate-200 rounded-2xl"></div>

      </div>
      
      {/* Mobile Loading Spinner */}
      <div className="fixed inset-0 flex items-center justify-center md:hidden z-50 bg-slate-50/80 backdrop-blur-sm">
         <Loader2 className="animate-spin text-brand-600 w-12 h-12" />
      </div>

    </div>
  );
}