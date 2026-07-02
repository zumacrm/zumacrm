"use client";

import { useState, useEffect } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isBefore, 
  startOfDay,
  getDay,
  parseISO
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from "lucide-react";

interface BookingCalendarProps {
  tipoEstudio: string;
  consultorio: string;
  onSelectSlot: (fecha: string, hora: string) => void;
}

export default function BookingCalendar({ tipoEstudio, consultorio, onSelectSlot }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Generate days in the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Padding offset for month grid (Monday starting index)
  // getDay returns 0 for Sunday, 1 for Monday, etc.
  const startDayOfWeek = (monthStart.getDay() + 6) % 7; // Convert to Mon=0, Tue=1 ... Sun=6

  // Fetch available slots when selected date changes
  useEffect(() => {
    if (!selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSlots([]);
      setSelectedSlot(null);
      
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      
      try {
        const res = await fetch(`/api/turnos/disponibilidad?fecha=${formattedDate}&tipo_estudio=${encodeURIComponent(tipoEstudio)}&consultorio=${encodeURIComponent(consultorio)}`);
        const data = await res.json();
        
        if (data.slots) {
          setSlots(data.slots);
        }
      } catch (err) {
        console.error("Error loading availability:", err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, tipoEstudio]);

  // Handle month switching
  const handlePrevMonth = () => {
    // Prevent going past current month
    if (isBefore(startOfMonth(subMonths(currentMonth, 1)), startOfMonth(new Date()))) return;
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDaySelect = (day: Date) => {
    const today = startOfDay(new Date());
    // Disable past days and weekends (Sabado=6, Domingo=0)
    if (isBefore(day, today)) return;
    const dayOfWeek = day.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return; // Disable Sat & Sun for this doctor

    setSelectedDate(day);
  };

  const handleSlotSelect = (slot: string) => {
    if (!selectedDate) return;
    setSelectedSlot(slot);
    const dateString = format(selectedDate, "yyyy-MM-dd");
    onSelectSlot(dateString, slot);
  };

  const today = startOfDay(new Date());

  return (
    <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-8">
      {/* Calendar Grid Section */}
      <div className="glass-card p-5 rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-slate-800 capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              disabled={isBefore(startOfMonth(subMonths(currentMonth, 1)), startOfMonth(new Date()))}
              className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of week headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
          <span>Lun</span>
          <span>Mar</span>
          <span>Mié</span>
          <span>Jue</span>
          <span>Vie</span>
          <span className="text-red-300">Sáb</span>
          <span className="text-red-300">Dom</span>
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Pad leading days */}
          {Array.from({ length: startDayOfWeek }).map((_, idx) => (
            <div key={`pad-${idx}`} className="aspect-square" />
          ))}

          {/* Month days */}
          {daysInMonth.map((day) => {
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const isToday = isSameDay(day, today);
            const isPast = isBefore(day, today);
            const dayOfWeek = day.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isDisabled = isPast || isWeekend;

            return (
              <button
                key={day.toString()}
                onClick={() => handleDaySelect(day)}
                disabled={isDisabled}
                className={`
                  aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all relative
                  ${isSelected ? "bg-primary text-white shadow-md shadow-primary/20" : ""}
                  ${!isSelected && isToday ? "border border-primary text-primary" : ""}
                  ${!isSelected && !isToday && !isDisabled ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900" : ""}
                  ${isDisabled ? "text-slate-300 cursor-not-allowed" : ""}
                `}
              >
                <span>{format(day, "d")}</span>
                {!isDisabled && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-slate-300" />
                )}
              </button>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-primary" /> Hoy
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Seleccionado
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-300" /> Disponible
          </div>
        </div>
      </div>

      {/* Hourly Slots Section */}
      <div className="glass-card p-5 rounded-2xl border border-slate-200 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-slate-800">
            Horarios Disponibles
          </h3>
        </div>

        {!selectedDate ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-slate-400 text-center gap-3">
            <CalendarIcon className="w-12 h-12 stroke-[1.2] text-slate-300 animate-pulse" />
            <p className="text-sm font-medium">Seleccione una fecha en el calendario para ver los horarios.</p>
          </div>
        ) : loadingSlots ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Cargando turnos disponibles...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-slate-400 text-center gap-2">
            <p className="text-sm font-semibold text-slate-600">No hay turnos disponibles</p>
            <p className="text-xs max-w-[240px]">El Dr. Carlos Jensen no atiende o ya tiene todos los turnos ocupados para este día.</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1">
            <p className="text-xs text-slate-400 mb-3">
              Fecha seleccionada: <span className="font-semibold text-slate-700">{format(selectedDate, "dd/MM/yyyy", { locale: es })}</span>
            </p>
            <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[250px] pr-1">
              {slots.map((slot) => {
                const isSlotSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => handleSlotSelect(slot)}
                    className={`
                      py-2.5 px-3 text-center rounded-xl text-sm font-semibold transition-all
                      ${isSlotSelected 
                        ? "bg-teal-600 text-white shadow-md shadow-teal-600/10 scale-95 border-teal-600" 
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/50 hover:text-slate-900"}
                    `}
                  >
                    {slot} hs
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
