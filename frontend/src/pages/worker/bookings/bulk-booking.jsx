import React, { useEffect, useMemo, useState, useCallback } from 'react'
import WorkerLayout from '../../../layouts/WorkerLayout'
import api from '../../../utils/api'
import { useToast } from '../../../components/ToastProvider'
import { calculateGST, formatGSTLabel } from '../../../utils/gst'
import {
  Users, Plus, Trash2, X, User, Mail, Phone, CreditCard, Calendar,
  ChevronDown, ChevronUp, RefreshCw, AlertCircle, CheckCircle2, XCircle,
  Building2, IndianRupee, DoorOpen, Check, Eye, Loader2, ShieldCheck,
  CheckSquare, Square, Copy, Send, Bed, Moon
} from 'lucide-react'

// ─── helpers ─────────────────────────────────────────────────────────
function nightsBetween(ci, co) {
  if (!ci || !co) return 0
  return Math.max(1, Math.ceil((new Date(co) - new Date(ci)) / (24 * 60 * 60 * 1000)))
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── GuestRow ─────────────────────────────────────────────────────────
function GuestRow({
  index, guest, onUpdate, onRemove, onDuplicate,
  isExpanded, onToggleExpand,
  roomTypes, availableRoomsMap, onFetchAvailableRooms,
  nights, checkIn, checkOut
}) {
  const set = (field, val) => onUpdate(index, { ...guest, [field]: val })

  const addRoomType = () => {
    onUpdate(index, {
      ...guest,
      roomSelections: [...(guest.roomSelections || []), { roomTypeKey: '', selectedRooms: [], quantity: 0 }]
    })
  }

  const removeRoomType = (ri) =>
    onUpdate(index, { ...guest, roomSelections: guest.roomSelections.filter((_, i) => i !== ri) })

  const changeRoomType = (ri, key) => {
    const updated = guest.roomSelections.map((s, i) =>
      i === ri ? { roomTypeKey: key, selectedRooms: [], quantity: 0 } : s
    )
    onUpdate(index, { ...guest, roomSelections: updated })
    if (key && checkIn && checkOut) onFetchAvailableRooms(key, checkIn, checkOut)
  }

  const toggleRoom = (ri, rn) => {
    const sel = guest.roomSelections[ri]
    const rooms = (sel.selectedRooms || []).includes(rn)
      ? sel.selectedRooms.filter(r => r !== rn)
      : [...(sel.selectedRooms || []), rn]
    onUpdate(index, {
      ...guest,
      roomSelections: guest.roomSelections.map((s, i) => i === ri ? { ...s, selectedRooms: rooms, quantity: rooms.length } : s)
    })
  }

  const toggleSelectAll = (ri, avail) => {
    const sel = guest.roomSelections[ri]
    const allSel = avail.every(r => (sel.selectedRooms || []).includes(r))
    onUpdate(index, {
      ...guest,
      roomSelections: guest.roomSelections.map((s, i) =>
        i === ri ? { ...s, selectedRooms: allSel ? [] : [...avail], quantity: allSel ? 0 : avail.length } : s
      )
    })
  }

  const pricing = useMemo(() => {
    if (!nights || !guest.roomSelections?.length)
      return { subtotal: 0, gstAmount: 0, gstPct: 0, total: 0, rows: [] }
    let subtotal = 0
    const rows = []
    guest.roomSelections.forEach(s => {
      if (!s.roomTypeKey || !s.quantity) return
      const rt = roomTypes.find(r => r.key === s.roomTypeKey)
      if (!rt) return
      const base = rt.prices?.roomOnly || rt.basePrice || 0
      const sub = base * s.quantity * nights
      subtotal += sub
      rows.push({ title: rt.title, qty: s.quantity, base, sub })
    })
    const firstKey = guest.roomSelections.find(s => s.roomTypeKey)?.roomTypeKey
    const rt = firstKey ? roomTypes.find(r => r.key === firstKey) : null
    const gst = calculateGST(subtotal, rt || {}, rt?.prices?.roomOnly || rt?.basePrice || 0)
    return { subtotal, gstAmount: gst.gstAmount, gstPct: gst.gstPercentage, total: gst.totalAmount, rows }
  }, [guest.roomSelections, roomTypes, nights])

  const effectivePaid = guest.paid
    ? pricing.total
    : Math.min(
        Math.max(0, Number(guest.amountPaid || 0)),
        pricing.total || Math.max(0, Number(guest.amountPaid || 0))
      )
  const remainingDue = Math.max(0, (pricing.total || 0) - (effectivePaid || 0))

  const togglePaid = () => {
    const nextPaid = !guest.paid
    onUpdate(index, {
      ...guest,
      paid: nextPaid,
      amountPaid: nextPaid ? (pricing.total || 0) : 0
    })
  }

  const totalRooms = (guest.roomSelections || []).reduce((s, r) => s + (r.quantity || 0), 0)

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all ${isExpanded ? 'border-indigo-300 shadow-lg' : 'border-gray-200 shadow-sm hover:border-indigo-200'}`}>
      {/* ── Collapsed header ──────────────────── */}
      <button
        type="button"
        onClick={() => onToggleExpand(index)}
        className={`w-full flex items-center gap-3 p-3 md:p-4 text-left transition-colors
          ${isExpanded ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700' : 'bg-white hover:bg-gray-50'}`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shrink-0
          ${isExpanded ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm truncate ${isExpanded ? 'text-white' : 'text-gray-900'}`}>
            {guest.guestName || `Guest ${index + 1}`}
          </p>
          <p className={`text-xs truncate ${isExpanded ? 'text-indigo-200' : 'text-gray-500'}`}>
            {[guest.guestPhone, guest.guestEmail].filter(Boolean).join(' · ') || 'No details yet'}
            {totalRooms > 0 && ` · ${totalRooms} room${totalRooms !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pricing.total > 0 && (
            <span className={`hidden sm:inline text-xs font-bold px-2.5 py-1 rounded-full
              ${isExpanded ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>
              ₹{pricing.total.toLocaleString()}
            </span>
          )}
          {guest.paid && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
              ${isExpanded ? 'bg-green-400/30 text-green-100' : 'bg-green-100 text-green-700'}`}>
              PAID
            </span>
          )}
          {isExpanded ? <ChevronUp size={18} className="text-white" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </button>

      {/* ── Expanded body ─────────────────────── */}
      {isExpanded && (
        <div className="bg-white">
          {/* Guest details */}
          <div className="p-4 md:p-5 border-b border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <User size={12} className="text-indigo-500" /> Guest Details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Full Name *', field: 'guestName', Icon: User, ph: 'John Doe', type: 'text' },
                { label: 'Email', field: 'guestEmail', Icon: Mail, ph: 'john@email.com', type: 'email' },
                { label: 'Mobile *', field: 'guestPhone', Icon: Phone, ph: '+91 98765 43210', type: 'tel' },
              ].map(({ label, field, Icon, ph, type }) => (
                <div key={field}>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">{label}</label>
                  <div className="relative">
                    <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={type}
                      value={guest[field] || ''}
                      onChange={e => set(field, e.target.value)}
                      placeholder={ph}
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* ID Proof row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">ID Type</label>
                <div className="relative">
                  <ShieldCheck size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select
                    value={guest.idProofType || ''}
                    onChange={e => set('idProofType', e.target.value)}
                    className="w-full pl-8 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 focus:bg-white appearance-none transition-colors"
                  >
                    <option value="">— Select ID Type —</option>
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="Driving Licence">Driving Licence</option>
                    <option value="Passport">Passport</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">ID Number</label>
                <div className="relative">
                  <CreditCard size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={guest.idProofNumber || ''}
                    onChange={e => set('idProofNumber', e.target.value)}
                    placeholder={guest.idProofType === 'Aadhaar' ? '1234 5678 9012' : guest.idProofType === 'PAN' ? 'ABCDE1234F' : 'Enter ID number'}
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Room selection */}
          <div className="p-4 md:p-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={12} className="text-indigo-500" /> Room Selection
                {totalRooms > 0 && <span className="text-indigo-600 normal-case">({totalRooms} selected)</span>}
              </p>
              <button
                type="button"
                onClick={addRoomType}
                disabled={!checkIn || !checkOut}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={13} /> Add Room Type
              </button>
            </div>

            {(!checkIn || !checkOut) ? (
              <div className="text-center py-6 bg-amber-50 rounded-xl border border-amber-200">
                <Calendar size={28} className="mx-auto text-amber-400 mb-2" />
                <p className="text-sm font-semibold text-amber-700">Set check-in & check-out dates first</p>
                <p className="text-xs text-amber-500 mt-1">Use Step 1 above to select dates</p>
              </div>
            ) : guest.roomSelections?.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <Bed size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-500">No rooms selected yet</p>
                <button type="button" onClick={addRoomType} className="mt-2 text-xs text-indigo-600 font-bold hover:underline">
                  + Add Room Type
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {guest.roomSelections.map((sel, ri) => {
                  const rt = roomTypes.find(r => r.key === sel.roomTypeKey)
                  const cacheKey = `${sel.roomTypeKey}_${checkIn}_${checkOut}`
                  const avail = availableRoomsMap[cacheKey] || []
                  const allSel = avail.length > 0 && avail.every(r => (sel.selectedRooms || []).includes(r))
                  return (
                    <div key={ri} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center gap-2 p-3 border-b border-gray-200">
                        <div className="relative flex-1">
                          <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <select
                            value={sel.roomTypeKey}
                            onChange={e => changeRoomType(ri, e.target.value)}
                            className="w-full pl-8 pr-8 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none bg-white font-medium"
                          >
                            <option value="">— Select Room Type —</option>
                            {roomTypes.map(r => (
                              <option key={r.key} value={r.key}>
                                {r.title} — ₹{(r.prices?.roomOnly || r.basePrice || 0).toLocaleString()}/night
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <button type="button" onClick={() => removeRoomType(ri)} className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {sel.roomTypeKey && (
                        <div className="p-3">
                          {avail.length === 0 ? (
                            <div className="text-center py-3 bg-red-50 rounded-lg border border-red-200">
                              <XCircle size={18} className="mx-auto text-red-400 mb-1" />
                              <p className="text-xs font-semibold text-red-500">No available rooms for these dates</p>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold text-gray-500">
                                  {avail.length} room{avail.length !== 1 ? 's' : ''} available
                                  {sel.selectedRooms?.length > 0 && <span className="text-indigo-600 ml-1">· {sel.selectedRooms.length} selected</span>}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => toggleSelectAll(ri, avail)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors
                                    ${allSel ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                                >
                                  {allSel ? <CheckSquare size={12} /> : <Square size={12} />}
                                  {allSel ? 'Deselect All' : 'Select All'}
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {avail.map(rn => {
                                  const picked = (sel.selectedRooms || []).includes(rn)
                                  return (
                                    <button
                                      key={rn}
                                      type="button"
                                      onClick={() => toggleRoom(ri, rn)}
                                      className={`relative min-w-[64px] px-3 py-2.5 rounded-xl border-2 font-bold text-sm transition-all
                                        ${picked
                                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                                          : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50'
                                        }`}
                                    >
                                      <DoorOpen size={13} className={`inline mr-1 ${picked ? 'text-white' : 'text-gray-400'}`} />
                                      {rn}
                                      {picked && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                          <Check size={9} className="text-white" />
                                        </span>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                              {sel.quantity > 0 && rt && (
                                <div className="mt-2.5 flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200">
                                  <span className="text-xs text-gray-600">
                                    {sel.quantity} × {rt.title} × {nights} night{nights !== 1 ? 's' : ''}
                                  </span>
                                  <span className="text-sm font-black text-green-600">
                                    ₹{((rt.prices?.roomOnly || rt.basePrice || 0) * sel.quantity * nights).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Price + payment */}
          <div className="p-4 md:p-5 space-y-3">
            {pricing.total > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <IndianRupee size={12} className="text-green-600" /> Price Breakdown
                </p>
                <div className="space-y-1.5 text-sm">
                  {pricing.rows.map((r, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-gray-600">{r.qty} × {r.title} × {nights}N @ ₹{r.base.toLocaleString()}</span>
                      <span className="font-semibold">₹{r.sub.toLocaleString()}</span>
                    </div>
                  ))}
                  {pricing.gstAmount > 0 && (
                    <div className="flex justify-between text-gray-400 text-xs pt-1 border-t border-green-200">
                      <span>GST {pricing.gstPct}%</span>
                      <span>+₹{pricing.gstAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black pt-1.5 border-t-2 border-green-300 text-base">
                    <span>Total</span>
                    <span className="text-green-700">₹{pricing.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <div className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2
                ${guest.paid ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                <CreditCard size={18} className={guest.paid ? 'text-green-600' : 'text-gray-400'} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{guest.paid ? 'Payment Received' : 'Payment Pending'}</p>
                  <p className="text-[10px] text-gray-400">Tap toggle to change status</p>
                </div>
                <button
                  type="button"
                  onClick={togglePaid}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 ${guest.paid ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${guest.paid ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {pricing.total > 0 && (
                <div className="flex-1 sm:flex-none min-w-[220px] bg-white border-2 border-gray-200 rounded-xl px-4 py-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Advance / Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={guest.paid ? (pricing.total || 0) : (guest.amountPaid || 0)}
                    onChange={e => {
                      const next = Math.max(0, Number(e.target.value || 0))
                      set('amountPaid', Math.min(next, pricing.total || next))
                    }}
                    disabled={guest.paid}
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 bg-white disabled:bg-gray-100"
                    placeholder={guest.paid ? 'Paid in full' : '0'}
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Remaining Due: <span className="font-bold text-gray-700">₹{remainingDue.toLocaleString()}</span>
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => onDuplicate(index)} className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-colors">
                  <Copy size={13} /> Clone
                </button>
                <button onClick={() => onRemove(index)} className="flex items-center gap-1.5 px-3 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold transition-colors">
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Review Modal ─────────────────────────────────────────────────────
function ReviewModal({ guests, roomTypes, nights, checkIn, checkOut, onClose, onConfirm, submitting }) {
  const grandTotal = useMemo(() => {
    let t = 0
    guests.forEach(g => {
      let sub = 0
      g.roomSelections?.forEach(s => {
        const rt = roomTypes.find(r => r.key === s.roomTypeKey)
        if (rt && s.quantity) sub += (rt.prices?.roomOnly || rt.basePrice || 0) * s.quantity * nights
      })
      const k = g.roomSelections?.find(s => s.roomTypeKey)?.roomTypeKey
      const rt = k ? roomTypes.find(r => r.key === k) : null
      t += calculateGST(sub, rt || {}, rt?.prices?.roomOnly || rt?.basePrice || 0).totalAmount
    })
    return t
  }, [guests, roomTypes, nights])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2"><Eye size={22} /> Review Bulk Booking</h2>
              <p className="text-indigo-200 text-sm mt-0.5">
                {guests.length} guest{guests.length !== 1 ? 's' : ''} ·
                {fmtDate(checkIn)} → {fmtDate(checkOut)} ·
                {nights} night{nights !== 1 ? 's' : ''} · Grand Total: ₹{grandTotal.toLocaleString()}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl"><X size={22} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {guests.map((g, i) => {
            let sub = 0
            g.roomSelections?.forEach(s => {
              const rt = roomTypes.find(r => r.key === s.roomTypeKey)
              if (rt && s.quantity) sub += (rt.prices?.roomOnly || rt.basePrice || 0) * s.quantity * nights
            })
            const k = g.roomSelections?.find(s => s.roomTypeKey)?.roomTypeKey
            const rt = k ? roomTypes.find(r => r.key === k) : null
            const gst = calculateGST(sub, rt || {}, rt?.prices?.roomOnly || rt?.basePrice || 0)
            const total = gst.totalAmount || 0
            const amountPaid = g.paid ? total : Math.min(Math.max(0, Number(g.amountPaid || 0)), total)
            const remaining = Math.max(0, total - amountPaid)
            return (
              <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0">{i + 1}</div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{g.guestName || `Guest ${i + 1}`}</p>
                      <p className="text-xs text-gray-400">{g.guestPhone || g.guestEmail || 'No contact'}{g.idProofType && ` · ${g.idProofType}${g.idProofNumber ? ': ' + g.idProofNumber : ''}`}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-green-600">₹{gst.totalAmount.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Paid ₹{amountPaid.toLocaleString()} · Due ₹{remaining.toLocaleString()}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${g.paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {g.paid ? '✓ PAID' : 'PENDING'}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-1.5">
                  {g.roomSelections?.filter(s => s.roomTypeKey && s.quantity > 0).map((s, j) => {
                    const rt2 = roomTypes.find(r => r.key === s.roomTypeKey)
                    return (
                      <div key={j} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Bed size={13} className="text-indigo-400" />
                          <span className="text-gray-700 font-medium">{rt2?.title} ×{s.quantity}</span>
                          {s.selectedRooms?.map(rn => (
                            <span key={rn} className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold">{rn}</span>
                          ))}
                        </div>
                        <span className="font-semibold text-gray-800 shrink-0 ml-2">
                          ₹{((rt2?.prices?.roomOnly || rt2?.basePrice || 0) * s.quantity * nights).toLocaleString()}
                        </span>
                      </div>
                    )
                  })}
                  {gst.gstAmount > 0 && (
                    <div className="flex justify-between text-xs text-gray-400 pt-1 border-t border-gray-200">
                      <span>Subtotal ₹{sub.toLocaleString()} + GST {gst.gstPercentage}%</span>
                      <span>+₹{gst.gstAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-sm transition-colors">
            Back & Edit
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-200 disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
          >
            {submitting
              ? <><Loader2 size={18} className="animate-spin" /> Processing…</>
              : <><Send size={18} /> Confirm {guests.length} Booking{guests.length !== 1 ? 's' : ''}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Result Modal ──────────────────────────────────────────────────────
function ResultModal({ data, onClose }) {
  if (!data) return null
  const { results, errors, successCount, errorCount, totalRequested } = data
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className={`p-5 text-white ${errorCount === 0 ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {errorCount === 0 ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
                Booking Results
              </h2>
              <p className="text-sm mt-1 opacity-90">
                {successCount} of {totalRequested} succeeded{errorCount > 0 && ` · ${errorCount} failed`}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl"><X size={22} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {results?.map((r, i) => (
            <div key={i} className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-gray-900">{r.booking?.user?.name || 'Guest'}</p>
                    <p className="text-[10px] text-gray-400 font-mono">#{r.booking?._id?.slice(-8)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-green-700 text-sm">₹{(r.booking?.total || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Paid ₹{(r.booking?.amountPaid || 0).toLocaleString()} · Due ₹{Math.max(0, (r.booking?.total || 0) - (r.booking?.amountPaid || 0)).toLocaleString()}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.booking?.status === 'paid' ? 'bg-green-200 text-green-700' : 'bg-amber-200 text-amber-700'}`}>
                    {r.booking?.status?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.booking?.items?.map((item, j) => (
                  <div key={j} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-green-100 text-xs">
                    <Bed size={11} className="text-indigo-400" />
                    <span className="text-gray-600">{item.title} ×{item.quantity}</span>
                    {item.allottedRoomNumbers?.map(rn => (
                      <span key={rn} className="px-1 bg-indigo-100 text-indigo-700 rounded font-bold text-[10px]">{rn}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {errors?.map((e, i) => (
            <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <XCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{e.message}</p>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function BulkBookingPage() {
  const toast = useToast()
  // ── Global shared dates ──────────────────────────────────────────
  const [checkIn, setCheckIn]   = useState('')
  const [checkOut, setCheckOut] = useState('')
  const nights   = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut])
  const datesSet = !!(checkIn && checkOut && nights > 0)

  const [roomTypes, setRoomTypes]           = useState([])
  const [loading, setLoading]               = useState(true)
  const [submitting, setSubmitting]         = useState(false)
  const [availableRoomsMap, setAvailableRoomsMap] = useState({})  // key: "rtKey_ci_co"
  const [guests, setGuests]                 = useState([
    { guestName: '', guestEmail: '', guestPhone: '', idProofType: '', idProofNumber: '', roomSelections: [], paid: false, amountPaid: 0 }
  ])
  const [expandedIndex, setExpandedIndex]   = useState(0)
  const [showReview, setShowReview]         = useState(false)
  const [resultData, setResultData]         = useState(null)

  // Fetch room types
  const fetchRoomTypes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/room-types')
      setRoomTypes(res.data.types || res.data.roomTypes || res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { fetchRoomTypes() }, [fetchRoomTypes])

  // Fetch available rooms (cached by key)
  const fetchAvailableRooms = useCallback(async (roomTypeKey, ci, co) => {
    if (!roomTypeKey || !ci || !co) return
    const key = `${roomTypeKey}_${ci}_${co}`
    if (availableRoomsMap[key] !== undefined) return
    try {
      const res = await api.get(`/bookings/available-rooms/${roomTypeKey}`, { params: { checkIn: ci, checkOut: co } })
      setAvailableRoomsMap(prev => ({ ...prev, [key]: res.data.availableRoomNumbers || [] }))
    } catch (err) {
      console.error(err)
    }
  }, [availableRoomsMap])

  // When dates change → clear cache + re-fetch for already-selected room types
  const onChangeDates = useCallback((ci, co) => {
    setCheckIn(ci)
    setCheckOut(co)
    setAvailableRoomsMap({})
    if (!ci || !co) return
    const keys = new Set()
    guests.forEach(g => g.roomSelections?.forEach(s => { if (s.roomTypeKey) keys.add(s.roomTypeKey) }))
    keys.forEach(k => fetchAvailableRooms(k, ci, co))
  }, [guests, fetchAvailableRooms])

  const emptyGuest = () => ({ guestName: '', guestEmail: '', guestPhone: '', idProofType: '', idProofNumber: '', roomSelections: [], paid: false, amountPaid: 0 })

  const addGuest = () => {
    setGuests(prev => [...prev, emptyGuest()])
    setExpandedIndex(guests.length)
  }
  const removeGuest = (i) => {
    if (guests.length <= 1) return
    setGuests(prev => prev.filter((_, idx) => idx !== i))
    setExpandedIndex(prev => prev === i ? Math.max(0, i - 1) : prev > i ? prev - 1 : prev)
  }
  const duplicateGuest = (i) => {
    const src = guests[i]
    const dup = { ...src, guestName: '', guestEmail: '', guestPhone: '', idProofType: '', idProofNumber: '', paid: false, amountPaid: 0, roomSelections: src.roomSelections.map(s => ({ ...s, selectedRooms: [], quantity: 0 })) }
    setGuests(prev => [...prev.slice(0, i + 1), dup, ...prev.slice(i + 1)])
    setExpandedIndex(i + 1)
  }
  const updateGuest  = (i, updated) => setGuests(prev => prev.map((g, idx) => idx === i ? updated : g))
  const toggleExpand = (i) => setExpandedIndex(prev => prev === i ? -1 : i)
  const markAll      = (paid) => setGuests(prev => prev.map(g => ({ ...g, paid })))

  const grandTotals = useMemo(() => {
    let totalRooms = 0, totalAmount = 0, paidCount = 0
    guests.forEach(g => {
      let sub = 0
      g.roomSelections?.forEach(s => {
        const rt = roomTypes.find(r => r.key === s.roomTypeKey)
        if (rt && s.quantity) { sub += (rt.prices?.roomOnly || rt.basePrice || 0) * s.quantity * nights; totalRooms += s.quantity }
      })
      const k = g.roomSelections?.find(s => s.roomTypeKey)?.roomTypeKey
      const rt = k ? roomTypes.find(r => r.key === k) : null
      totalAmount += calculateGST(sub, rt || {}, rt?.prices?.roomOnly || rt?.basePrice || 0).totalAmount
      if (g.paid) paidCount++
    })
    return { totalRooms, totalAmount, paidCount }
  }, [guests, roomTypes, nights])

  const validate = () => {
    const errs = []
    if (!checkIn)  errs.push('Check-in date is required')
    if (!checkOut) errs.push('Check-out date is required')
    guests.forEach((g, i) => {
      if (!g.guestName?.trim()) errs.push(`Guest ${i + 1}: Name is required`)
      if (!g.roomSelections?.some(s => s.roomTypeKey && s.quantity > 0)) errs.push(`Guest ${i + 1}: Select at least one room`)
    })
    return errs
  }

  const handleReview = () => {
    const errs = validate()
    if (errs.length) { toast.show({ type: 'error', title: 'Validation Errors', message: errs.join(', '), duration: 5000 }); return }
    setShowReview(true)
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const payload = guests.map(g => ({
        guestName: g.guestName,
        guestEmail: g.guestEmail,
        guestPhone: g.guestPhone,
        idProof: [g.idProofType, g.idProofNumber].filter(Boolean).join(': ') || '',
        checkIn,
        checkOut,
        paid: g.paid,
        amountPaid: g.paid ? undefined : (g.amountPaid || 0),
        packageType: 'roomOnly',
        items: g.roomSelections.filter(s => s.roomTypeKey && s.quantity > 0).map(s => ({
          roomTypeKey: s.roomTypeKey,
          quantity: s.quantity,
          allottedRoomNumbers: s.selectedRooms || []
        }))
      }))
      const res = await api.post('/bookings/bulk', { bookings: payload })
      setShowReview(false)
      setResultData(res.data)
      if (res.data.errorCount === 0) {
        setGuests([emptyGuest()])
        setExpandedIndex(0)
        setAvailableRoomsMap({})
        setCheckIn('')
        setCheckOut('')
      }
    } catch (err) {
      toast.show({ type: 'error', message: err.response?.data?.message || 'Failed to process bulk booking' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <WorkerLayout>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Loading room data…</p>
          </div>
        </div>
      </WorkerLayout>
    )
  }

  return (
    <WorkerLayout>
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Users className="text-indigo-600" size={26} /> Bulk Booking
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Book multiple guests at once in a single session</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchRoomTypes} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors" title="Refresh room types">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => markAll(true)} className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-xs font-bold transition-colors">✓ All Paid</button>
          <button onClick={() => markAll(false)} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-colors">✗ All Unpaid</button>
          <button
            onClick={addGuest}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-indigo-200"
          >
            <Plus size={16} /> Add Guest
          </button>
        </div>
      </div>

      {/* ── STEP 1 — Booking Dates (global) ── */}
      <div className={`rounded-2xl border-2 p-4 md:p-5 mb-5 transition-all
        ${datesSet ? 'bg-indigo-50 border-indigo-300 shadow-md shadow-indigo-100' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0
            ${datesSet ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
          <div className="flex-1">
            <p className="font-bold text-gray-900">Set Booking Dates</p>
            <p className="text-[10px] text-gray-400">These check-in / check-out dates apply to every guest in this session</p>
          </div>
          {datesSet && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-full text-xs font-bold">
              <Moon size={13} /> {nights} Night{nights !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase mb-1.5 block">Check-In *</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={checkIn}
                onChange={e => onChangeDates(e.target.value, checkOut)}
                className="w-full pl-9 pr-3 py-3 border-2 border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 bg-white"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase mb-1.5 block">Check-Out *</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={checkOut}
                min={checkIn || undefined}
                onChange={e => onChangeDates(checkIn, e.target.value)}
                className="w-full pl-9 pr-3 py-3 border-2 border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 bg-white"
              />
            </div>
          </div>
          <div className="flex items-end">
            <div className={`w-full py-3 rounded-xl text-center border-2 transition-colors
              ${datesSet ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
              <p className="text-2xl font-black">{nights || '—'}</p>
              <p className="text-[10px] font-semibold uppercase">{datesSet ? `Night${nights !== 1 ? 's' : ''}` : 'Nights'}</p>
            </div>
          </div>
        </div>

        {datesSet && (
          <div className="mt-3 flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-indigo-200 text-xs text-indigo-700 font-medium">
            <CheckCircle2 size={14} className="text-indigo-500 shrink-0" />
            {fmtDate(checkIn)} → {fmtDate(checkOut)} · {nights} night{nights !== 1 ? 's' : ''} · applied to all guests
          </div>
        )}
        {!datesSet && (
          <div className="mt-3 flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200 text-xs text-amber-700 font-medium">
            <AlertCircle size={14} className="shrink-0" /> Set both dates before selecting rooms for guests
          </div>
        )}
      </div>

      {/* ── STEP 2 — Add Guests ── */}
      <div className={`transition-opacity ${!datesSet ? 'opacity-50 pointer-events-none select-none' : ''}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0
            ${datesSet ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
          <div>
            <p className="font-bold text-gray-900">Add Guests &amp; Assign Rooms</p>
            <p className="text-[10px] text-gray-400">Fill guest details, pick room type, then click room numbers to assign</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {guests.map((guest, idx) => (
            <GuestRow
              key={idx}
              index={idx}
              guest={guest}
              onUpdate={updateGuest}
              onRemove={removeGuest}
              onDuplicate={duplicateGuest}
              isExpanded={expandedIndex === idx}
              onToggleExpand={toggleExpand}
              roomTypes={roomTypes}
              availableRoomsMap={availableRoomsMap}
              onFetchAvailableRooms={fetchAvailableRooms}
              nights={nights}
              checkIn={checkIn}
              checkOut={checkOut}
            />
          ))}

          <button
            onClick={addGuest}
            className="w-full py-3.5 rounded-xl border-2 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Add Another Guest
          </button>
        </div>
      </div>

      {/* ── Sticky bottom summary bar ── */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm rounded-t-2xl shadow-[0_-6px_24px_rgba(0,0,0,0.12)] border-t border-gray-200 p-4 z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-5 flex-wrap justify-center sm:justify-start">
            {[
              { value: guests.length,                        label: 'Guests',        color: 'text-indigo-700' },
              { value: grandTotals.totalRooms,               label: 'Rooms',         color: 'text-purple-700' },
              { value: `₹${grandTotals.totalAmount.toLocaleString()}`, label: 'Total (GST)', color: 'text-green-700' },
              { value: `${grandTotals.paidCount}/${guests.length}`,    label: 'Paid',        color: 'text-emerald-700' },
            ].map(({ value, label, color }, i, arr) => (
              <React.Fragment key={label}>
                <div className="text-center">
                  <p className={`text-xl font-black ${color}`}>{value}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">{label}</p>
                </div>
                {i < arr.length - 1 && <div className="w-px h-8 bg-gray-200" />}
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={addGuest} className="flex items-center gap-1.5 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors">
              <Plus size={16} /> Guest
            </button>
            <button
              onClick={handleReview}
              disabled={!datesSet}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Eye size={18} /> Review &amp; Book All
            </button>
          </div>
        </div>
      </div>

      {showReview && (
        <ReviewModal
          guests={guests}
          roomTypes={roomTypes}
          nights={nights}
          checkIn={checkIn}
          checkOut={checkOut}
          onClose={() => setShowReview(false)}
          onConfirm={handleConfirm}
          submitting={submitting}
        />
      )}
      {resultData && <ResultModal data={resultData} onClose={() => setResultData(null)} />}
    </WorkerLayout>
  )
}
