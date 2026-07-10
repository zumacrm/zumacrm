"use client";

import { useState, useEffect, useRef } from "react";
import { mockDB, MockChatMessage, Partner, MockTurno } from "@/lib/mockData";
import { format } from "date-fns";
import { 
  MessageSquare, 
  Send, 
  User, 
  Building2, 
  Smartphone, 
  HelpCircle,
  Clock,
  Sparkles,
  Bot
} from "lucide-react";

interface ChatViewProps {
  role?: "superadmin" | "partner" | "patient_guest" | "patient_registered";
  partnerId?: string;
  patientDni?: string;
}

export default function ChatView({ 
  role = "partner", 
  partnerId = "dr-carlos-jensen", 
  patientDni = "38111222" 
}: ChatViewProps) {
  const [messages, setMessages] = useState<MockChatMessage[]>([]);
  const [activePartner, setActivePartner] = useState<Partner | null>(null);
  const [activePatientDni, setActivePatientDni] = useState<string>(patientDni);
  const [inputMessage, setInputMessage] = useState("");
  const [conversations, setConversations] = useState<{ dni: string; nombre: string; unreadCount: number }[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadMessagesAndConversations = () => {
    const list = mockDB.getMessages();
    setMessages(list);

    const partnerObj = mockDB.getPartners().find(p => p.id === partnerId);
    if (partnerObj) {
      setActivePartner(partnerObj);
    }

    if (role === "partner") {
      // Find all patients who have turnos booked with this partner
      const allTurnos = mockDB.getTurnos();
      const myTurnos = allTurnos.filter(t => t.partnerId === partnerId);
      
      // Compile unique list of patients
      const patientMap = new Map<string, string>();
      myTurnos.forEach(t => {
        patientMap.set(t.paciente.dni, `${t.paciente.nombre} ${t.paciente.apellido}`);
      });

      // Also check existing chat threads to make sure we include them
      const myMessages = list.filter(m => m.partnerId === partnerId);
      myMessages.forEach(m => {
        if (!patientMap.has(m.patientDni)) {
          // Find patient details from global turnos as fallback
          const turnoObj = allTurnos.find(t => t.paciente.dni === m.patientDni);
          const name = turnoObj ? `${turnoObj.paciente.nombre} ${turnoObj.paciente.apellido}` : `Cliente DNI: ${m.patientDni}`;
          patientMap.set(m.patientDni, name);
        }
      });

      const conversationList = Array.from(patientMap.entries()).map(([dni, name]) => {
        const unread = list.filter(m => m.partnerId === partnerId && m.patientDni === dni && m.sender === "patient" && !m.isRead).length;
        return {
          dni,
          nombre: name,
          unreadCount: unread
        };
      });

      setConversations(conversationList);
      
      // Select first conversation if none selected
      if (conversationList.length > 0 && !activePatientDni) {
        setActivePatientDni(conversationList[0].dni);
      }
    }
  };

  useEffect(() => {
    loadMessagesAndConversations();
  }, [partnerId, activePatientDni, role]);

  // Scroll to bottom when new messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activePatientDni]);

  // Mark active messages as read
  useEffect(() => {
    if (role === "partner" && activePatientDni) {
      const list = mockDB.getMessages();
      let updated = false;
      const nextList = list.map(m => {
        if (m.partnerId === partnerId && m.patientDni === activePatientDni && m.sender === "patient" && !m.isRead) {
          updated = true;
          return { ...m, isRead: true };
        }
        return m;
      });
      if (updated) {
        mockDB.saveMessages(nextList);
      }
    } else if ((role === "patient_registered" || role === "patient_guest") && partnerId) {
      const list = mockDB.getMessages();
      let updated = false;
      const nextList = nextListCheck();
      function nextListCheck() {
        return list.map(m => {
          if (m.partnerId === partnerId && m.patientDni === activePatientDni && m.sender === "partner" && !m.isRead) {
            updated = true;
            return { ...m, isRead: true };
          }
          return m;
        });
      }
      if (updated) {
        mockDB.saveMessages(nextList);
      }
    }
  }, [messages, activePatientDni, role, partnerId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg: MockChatMessage = {
      id: `msg_${Math.random().toString(36).substring(2, 7)}`,
      partnerId,
      patientDni: activePatientDni,
      sender: role === "partner" ? "partner" : "patient",
      message: inputMessage.trim(),
      timestamp: new Date().toISOString(),
      isRead: false
    };

    mockDB.addMessage(newMsg);
    setInputMessage("");
    loadMessagesAndConversations();
  };

  // Simulate automatic sandbox answers
  const handleSimulateAutoReply = () => {
    const isPartnerSender = role === "partner";
    const newMsg: MockChatMessage = {
      id: `msg_sim_${Math.random().toString(36).substring(2, 7)}`,
      partnerId,
      patientDni: activePatientDni,
      sender: isPartnerSender ? "patient" : "partner",
      message: isPartnerSender 
        ? "Hola, este es un mensaje automático de simulación de cliente. ¡Todo funciona correctamente!" 
        : "Hola, soy el bot del socio comercial. Recibí tu consulta, nos pondremos en contacto a la brevedad.",
      timestamp: new Date().toISOString(),
      isRead: false
    };

    mockDB.addMessage(newMsg);
    loadMessagesAndConversations();
  };

  const activeChatMessages = messages.filter(
    m => m.partnerId === partnerId && m.patientDni === activePatientDni
  );

  const activePatientName = conversations.find(c => c.dni === activePatientDni)?.nombre || "Cliente";

  // RENDER PARTNER SIDE VIEW
  if (role === "partner") {
    return (
      <div className="flex flex-col gap-6 h-[calc(100vh-10rem)] animate-slide-in">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Mensajes de Clientes</h1>
          <p className="text-xs text-slate-400 mt-1">Chatea directamente con tus clientes que han realizado reservas en tu agenda.</p>
        </div>

        <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-0">
          
          {/* Left panel: chats directory */}
          <div className="w-full md:w-80 border-r border-slate-200 flex flex-col shrink-0 min-h-0">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Conversaciones Activas</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aún no tienes chats iniciados.
                </div>
              ) : (
                conversations.map((c) => {
                  const isSelected = c.dni === activePatientDni;
                  return (
                    <button
                      key={c.dni}
                      onClick={() => setActivePatientDni(c.dni)}
                      className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer
                        ${isSelected 
                          ? "bg-slate-100 text-slate-900 font-semibold" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                        <User className="w-4.5 h-4.5 text-indigo-650" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold truncate block pr-2">{c.nombre}</span>
                          {c.unreadCount > 0 && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono block mt-0.5">DNI: {c.dni}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: Active chat window */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
            {activePatientDni ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                      {activePatientName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-xs">{activePatientName}</h3>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">ID Cliente DNI: {activePatientDni}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateAutoReply}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-1.5 px-3 rounded-lg text-[9.5px] border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Simular Respuesta de Cliente
                  </button>
                </div>

                {/* Messages Timeline */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {activeChatMessages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-slate-400 py-12">
                      <MessageSquare className="w-8 h-8 text-slate-300 stroke-[1.2]" />
                      <span className="text-xs font-semibold text-slate-650">No hay mensajes previos</span>
                      <p className="text-[10px] text-slate-450 max-w-xs">Escribe abajo para iniciar tu primer chat directo con {activePatientName}.</p>
                    </div>
                  ) : (
                    activeChatMessages.map((m) => {
                      const isPartner = m.sender === "partner";
                      return (
                        <div 
                          key={m.id}
                          className={`flex flex-col max-w-[75%]
                            ${isPartner ? "self-end items-end" : "self-start items-start"}`}
                        >
                          <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm
                            ${isPartner 
                              ? "bg-[#0f172a] text-white rounded-br-none" 
                              : "bg-white border border-slate-200 text-slate-850 rounded-bl-none"}`}
                          >
                            {m.message}
                          </div>
                          <span className="text-[8.5px] text-slate-400 mt-1 px-1">
                            {format(new Date(m.timestamp), "HH:mm")} hs
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input form */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex gap-2">
                  <input
                    type="text"
                    placeholder={`Escribe un mensaje para ${activePatientName}...`}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50 text-slate-800"
                  />
                  <button
                    type="submit"
                    className="bg-[#0f172a] hover:bg-slate-800 text-white p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <Send className="w-4.5 h-4.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-450 gap-2">
                <MessageSquare className="w-10 h-10 text-slate-300 stroke-[1.2]" />
                <span className="text-xs font-semibold">Selecciona una conversación de la izquierda</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RENDER CLIENT SIDE VIEW
  const partnerNameStr = activePartner ? activePartner.name : "Socio Comercial";
  const partnerColor = activePartner ? activePartner.logoColor : "bg-indigo-650";

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 h-[calc(100vh-10rem)] animate-slide-in">
      <div className="text-center sm:text-left flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Chat con {partnerNameStr}</h1>
          <p className="text-xs text-slate-400 mt-1">Mensajería instantánea directa con tu prestador.</p>
        </div>

        <button
          type="button"
          onClick={handleSimulateAutoReply}
          className="bg-slate-100 hover:bg-slate-250 border border-slate-250 text-slate-650 font-bold py-1.5 px-3 rounded-lg text-[9.5px] transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Bot className="w-3.5 h-3.5" />
          Simular Respuesta del Socio
        </button>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-0">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-150 bg-slate-50/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8.5 h-8.5 rounded-xl text-white font-extrabold text-xs flex items-center justify-center shadow-sm ${partnerColor}`}>
              {partnerNameStr.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="font-bold text-slate-800 text-xs">{partnerNameStr}</span>
              <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded ml-2">En línea</span>
            </div>
          </div>
        </div>

        {/* Message timeline area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {activeChatMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-slate-400 py-12">
              <MessageSquare className="w-8 h-8 text-slate-350 stroke-[1.2] animate-pulse" />
              <span className="text-xs font-semibold text-slate-700">No hay mensajes previos</span>
              <p className="text-[10px] text-slate-400 max-w-xs leading-normal">Escribe tu consulta y el comercio te responderá a la brevedad.</p>
            </div>
          ) : (
            activeChatMessages.map((m) => {
              const isPatient = m.sender === "patient";
              return (
                <div 
                  key={m.id}
                  className={`flex flex-col max-w-[75%]
                    ${isPatient ? "self-end items-end" : "self-start items-start"}`}
                >
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm
                    ${isPatient 
                      ? "bg-indigo-650 text-white rounded-br-none" 
                      : "bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none"}`}
                  >
                    {m.message}
                  </div>
                  <span className="text-[8.5px] text-slate-400 mt-1 px-1">
                    {format(new Date(m.timestamp), "HH:mm")} hs
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat form footer */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-150 bg-white flex gap-2 shrink-0">
          <input
            type="text"
            placeholder={`Escribe un mensaje para ${partnerNameStr}...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50 text-slate-850"
          />
          <button
            type="submit"
            className="bg-indigo-650 hover:bg-indigo-750 text-white p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
