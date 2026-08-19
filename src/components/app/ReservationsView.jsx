import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, CheckCircle2, XCircle, Search, Clock, Car, Phone } from "lucide-react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "../../services/firebase";
import { fmtDateTime } from "../../services/algorithm";

export default function ReservationsView({ parking, currentUser, userProfile }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("10:00");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("18:00");
  const [phone, setPhone] = useState("");

  const loadReservations = async () => {
    if (!parking) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "reservations"), 
        where("parkingId", "==", parking.id)
      );
      const snap = await getDocs(q);
      const resData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by arrival in JS since we didn't index
      resData.sort((a, b) => new Date(a.arrival).getTime() - new Date(b.arrival).getTime());
      setReservations(resData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [parking?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const arrivalDateTime = new Date(`${arrivalDate}T${arrivalTime}:00`).toISOString();
      const departureDateTime = new Date(`${departureDate}T${departureTime}:00`).toISOString();

      await addDoc(collection(db, "reservations"), {
        parkingId: parking.id,
        plate: plate.toUpperCase(),
        model,
        arrival: arrivalDateTime,
        departure: departureDateTime,
        phone,
        status: "PENDING", // PENDING, ACCEPTED, REJECTED
        createdAt: serverTimestamp(),
        createdBy: userProfile?.displayName || currentUser?.email || "Inconnu"
      });
      
      setShowForm(false);
      setPlate(""); setModel(""); setPhone("");
      loadReservations();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "reservations", id), { status });
      loadReservations();
    } catch (err) {
      console.error(err);
    }
  };

  if (!parking) return <div className="p-6 text-slate-400">Sélectionnez un parking d'abord.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex justify-between items-center shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 mb-1">
            <CalendarIcon size={15} />
            <span>Planning des Réservations</span>
          </div>
          <h1 className="text-2xl font-black text-white">Réservations {parking.name}</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white text-xs font-bold shadow-lg shadow-cyan-950/40 flex items-center gap-2"
        >
          {showForm ? "Fermer" : <><Plus size={16}/> Nouvelle Réservation</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-lg space-y-4">
          <h2 className="text-lg font-bold text-white mb-2">Ajouter une réservation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Plaque</label>
              <input type="text" required value={plate} onChange={e=>setPlate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono uppercase text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Modèle</label>
              <input type="text" value={model} onChange={e=>setModel(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Arrivée</label>
              <div className="flex gap-2">
                <input type="date" required value={arrivalDate} onChange={e=>setArrivalDate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm" />
                <input type="time" required value={arrivalTime} onChange={e=>setArrivalTime(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Départ Prévu</label>
              <div className="flex gap-2">
                <input type="date" required value={departureDate} onChange={e=>setDepartureDate(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm" />
                <input type="time" required value={departureTime} onChange={e=>setDepartureTime(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm" />
              </div>
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold text-sm">Enregistrer</button>
        </form>
      )}

      {loading ? (
        <div className="text-center text-slate-400 py-10">Chargement...</div>
      ) : (
        <div className="grid gap-4">
          {reservations.length === 0 && <div className="text-center text-slate-500 py-10 border border-dashed border-slate-700 rounded-3xl">Aucune réservation trouvée.</div>}
          
          {reservations.map(res => (
            <div key={res.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-6">
                <div>
                  <div className="font-mono text-lg font-black text-amber-300">{res.plate}</div>
                  <div className="text-xs text-slate-400">{res.model || "Véhicule"}</div>
                </div>
                <div className="text-xs text-slate-300 space-y-1 border-l border-slate-700 pl-6">
                  <div className="flex items-center gap-2"><Clock size={12} className="text-cyan-400"/> Arrivée : {fmtDateTime(res.arrival)}</div>
                  <div className="flex items-center gap-2"><Clock size={12} className="text-rose-400"/> Départ : {fmtDateTime(res.departure)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {res.status === "PENDING" && (
                  <>
                    <button onClick={() => updateStatus(res.id, "ACCEPTED")} className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors" title="Accepter"><CheckCircle2 size={18} /></button>
                    <button onClick={() => updateStatus(res.id, "REJECTED")} className="p-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors" title="Refuser"><XCircle size={18} /></button>
                  </>
                )}
                {res.status === "ACCEPTED" && <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/40">Accepté</span>}
                {res.status === "REJECTED" && <span className="px-3 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/40">Refusé</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
