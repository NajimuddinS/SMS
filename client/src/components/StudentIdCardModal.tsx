import React, { useRef } from 'react';
import type { Student } from '../services/api';
import { X, Mail, Phone, Calendar, MapPin, Printer } from 'lucide-react';

interface StudentIdCardModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentIdCardModal: React.FC<StudentIdCardModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !student) return null;

  // Resolve photo URL (handling local fallback URL)
  const getPhotoUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('/uploads')) {
      const apiBaseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';
      const host = apiBaseUrl.replace('/api', '');
      return `${host}${url}`;
    }
    return url;
  };

  // Trigger browser print for the ID card
  const handlePrint = () => {
    const printContent = cardRef.current?.innerHTML;

    if (printContent) {
      // Create a clean print window
      const win = window.open('', '', 'width=600,height=800');
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Print ID Card - ${student.name}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                body {
                  background-color: #f8fafc;
                  color: #0f172a;
                  font-family: ui-sans-serif, system-ui, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                }
                @media print {
                  body {
                    background: transparent;
                    color: black;
                  }
                  .no-print {
                    display: none;
                  }
                }
              </style>
            </head>
            <body>
              <div class="p-6">${printContent}</div>
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                }
              </script>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="flex flex-col items-center gap-5 w-full max-w-sm">
        
        {/* ID Card Wrapper */}
        <div
          ref={cardRef}
          className="relative w-84 h-[510px] bg-gradient-to-b from-white to-slate-100 border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-between shadow-xl overflow-hidden glow-indigo text-slate-800"
        >
          {/* Decorative Card background grids and shapes */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-[40%] left-[-10%] w-[120%] h-0.5 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent rotate-12"></div>

          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 relative z-10">
            <div className="text-left">
              <span className="text-[10px] font-extrabold tracking-widest text-indigo-650 block uppercase">
                ACADEMY CARD
              </span>
              <span className="text-xs font-bold text-slate-800 tracking-wide block">
                Pillai University
              </span>
            </div>
            {/* Hologram/University crest emblem representation */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-90 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
              P
            </div>
          </div>

          {/* Card Body - Content */}
          <div className="flex-1 flex flex-col items-center justify-center py-4 relative z-10">
            
            {/* Smart Microchip Graphic */}
            <div className="w-10 h-7 bg-gradient-to-r from-amber-400/80 to-amber-300/80 rounded-md border border-amber-600/40 relative overflow-hidden self-start ml-2 mb-3 shadow-sm">
              <div className="absolute inset-0.5 border border-amber-600/20 rounded"></div>
              <div className="absolute top-1/2 left-0 right-0 h-px bg-amber-600/40"></div>
              <div className="absolute top-0 bottom-0 left-1/3 w-px bg-amber-600/40"></div>
              <div className="absolute top-0 bottom-0 left-2/3 w-px bg-amber-600/40"></div>
            </div>

            {/* Profile Photo */}
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-indigo-200 bg-indigo-50 flex items-center justify-center text-3xl font-extrabold text-indigo-600 shadow-md shrink-0">
              {student.photoUrl ? (
                <img
                  src={getPhotoUrl(student.photoUrl)}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                student.name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Name and Major */}
            <div className="text-center mt-3">
              <h4 className="text-lg font-black tracking-wide text-slate-800 uppercase truncate max-w-72 leading-tight">
                {student.name}
              </h4>
              <p className="text-[11px] font-bold text-indigo-650 uppercase tracking-widest mt-1">
                {student.course}
              </p>
            </div>

            {/* Unique admission code */}
            <div className="mt-2 font-mono text-[10px] font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 rounded-full">
              ID: {student.admissionNumber}
            </div>

            {/* Mini metadata checklist */}
            <div className="w-full grid grid-cols-2 gap-x-2 gap-y-2 mt-4 text-[10px] text-slate-650 border-t border-slate-100 pt-3.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Calendar size={11} className="text-indigo-650 shrink-0" />
                <span className="truncate">DOB: {new Date(student.dateOfBirth).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <Phone size={11} className="text-indigo-650 shrink-0" />
                <span className="truncate">{student.mobileNumber}</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0 col-span-2">
                <Mail size={11} className="text-indigo-650 shrink-0" />
                <span className="truncate">{student.email}</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0 col-span-2">
                <MapPin size={11} className="text-indigo-650 shrink-0" />
                <span className="truncate" title={student.address}>{student.address}</span>
              </div>
            </div>
          </div>

          {/* Card Footer: Barcode & Year */}
          <div className="border-t border-slate-100 pt-3 flex items-center justify-between relative z-10">
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
              YEAR {student.year}
            </span>
            
            {/* Barcode representation - dark bars for legibility */}
            <div className="flex items-center gap-[1px] h-7 bg-transparent opacity-85 pl-2">
              <div className="w-[1px] h-full bg-slate-800"></div>
              <div className="w-[2px] h-full bg-slate-800"></div>
              <div className="w-[1px] h-full bg-slate-800"></div>
              <div className="w-[1px] h-full bg-slate-800"></div>
              <div className="w-[3px] h-full bg-slate-800"></div>
              <div className="w-[1px] h-full bg-slate-800"></div>
              <div className="w-[2px] h-full bg-slate-800"></div>
              <div className="w-[1px] h-full bg-slate-800"></div>
              <div className="w-[3px] h-full bg-slate-800"></div>
              <div className="w-[1px] h-full bg-slate-800"></div>
              <div className="w-[2px] h-full bg-slate-800"></div>
            </div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex justify-between items-center gap-3 w-full text-xs font-semibold no-print">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Printer size={14} />
            <span>Print ID Card</span>
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md hover:shadow-indigo-500/20"
          >
            <X size={14} />
            <span>Close View</span>
          </button>
        </div>


      </div>
    </div>
  );
};
