import { createContext, useContext, useState, useEffect } from 'react';
import { events as seedEvents } from '../data/events';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

function dbToEvent(row) {
  return {
    id:               row.id,
    title:            row.title,
    city:             row.city,
    venue:            row.venue,
    address:          row.address,
    date:             row.date,
    time:             row.time,
    endTime:          row.end_time,
    category:         row.category,
    description:      row.description,
    longDescription:  row.long_description,
    gradient:         row.gradient,
    accentColor:      row.accent_color,
    organizer:        row.organizer,
    organizerContact: row.organizer_contact,
    featured:         row.featured,
    tags:             row.tags,
    attendees:        row.attendees,
    tickets:          row.tickets,
  };
}

function dbToBooking(row) {
  return {
    id:         row.id,
    eventId:    row.event_id,
    eventTitle: row.event_title,
    eventDate:  row.event_date,
    eventVenue: row.event_venue,
    eventCity:  row.event_city,
    gradient:   row.gradient,
    total:      row.total,
    tickets:    row.tickets,
    attendee:   row.attendee,
    createdAt:  row.created_at,
  };
}

export function AppProvider({ children }) {
  const [allEvents, setAllEvents] = useState(seedEvents);
  const [bookings,  setBookings]  = useState([]);
  const [checkedIn, setCheckedIn] = useState(new Set());
  const [user,      setUser]      = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load admin-created events (public — no auth required)
  useEffect(() => {
    supabase.from('events').select('*').then(({ data }) => {
      if (data?.length) setAllEvents([...seedEvents, ...data.map(dbToEvent)]);
    });
  }, []);

  // Load bookings + checkins when organizer authenticates
  useEffect(() => {
    if (!user) { setBookings([]); setCheckedIn(new Set()); return; }
    Promise.all([
      supabase.from('bookings').select('*'),
      supabase.from('checkins').select('booking_id'),
    ]).then(([{ data: bData }, { data: cData }]) => {
      if (bData) setBookings(bData.map(dbToBooking));
      if (cData) setCheckedIn(new Set(cData.map(c => c.booking_id)));
    });
  }, [user]);

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function addEvent(event) {
    const row = {
      id:               `admin_${Date.now()}`,
      title:            event.title,
      city:             event.city,
      venue:            event.venue,
      address:          event.address || '',
      date:             event.date,
      time:             event.time,
      end_time:         event.endTime || '',
      category:         event.category,
      description:      event.description,
      long_description: event.longDescription || event.description || '',
      gradient:         event.gradient,
      accent_color:     event.accentColor || '',
      organizer:        event.organizer,
      organizer_contact: event.organizerContact || '',
      organizer_id:     user.id,
      featured:         false,
      tags:             event.tags || [event.category.toLowerCase()],
      attendees:        0,
      tickets:          event.tickets || [],
    };
    const { data, error } = await supabase.from('events').insert(row).select().single();
    if (error) throw error;
    const normalized = dbToEvent(data);
    setAllEvents(prev => [...prev, normalized]);
    return normalized;
  }

  // Used for FREE tickets only.
  // Paid bookings are created server-side by the confirm-booking edge function after Razorpay verification.
  async function addBooking(booking) {
    const id  = `Q2Q-${Date.now().toString(36).toUpperCase()}`;
    const row = {
      id,
      event_id:    booking.eventId,
      event_title: booking.eventTitle,
      event_date:  booking.eventDate,
      event_venue: booking.eventVenue,
      event_city:  booking.eventCity,
      gradient:    booking.gradient,
      total:       0,
      tickets:     booking.tickets,
      attendee:    booking.attendee,
    };
    const { data, error } = await supabase.from('bookings').insert(row).select().single();
    if (error) throw error;
    return dbToBooking(data);
  }

  async function checkIn(bookingId) {
    setCheckedIn(prev => new Set([...prev, bookingId]));
    const { error } = await supabase.from('checkins').insert({ booking_id: bookingId });
    if (error) {
      setCheckedIn(prev => { const n = new Set(prev); n.delete(bookingId); return n; });
    }
  }

  return (
    <AppContext.Provider value={{
      allEvents, addEvent,
      bookings,  addBooking,
      checkedIn, checkIn,
      user, signIn, signOut, authLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
