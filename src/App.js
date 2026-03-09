import React, { useState } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import EventGrid from './components/EventGrid';
import AddEventForm from './components/AddEventForm';
import './App.css';
import { useQuery, useQueryClient, useMutation} from '@tanstack/react-query';

// Note you will have to update this env variable in your Frontend/buildspec.yml with your created beanstalk URL.
const API_BASE = process.env.REACT_APP_API_BASE_URL;

// use this endpoints URLs for your fetching and adding logic that you will implement.
const FETCH_EVENTS_URL = `${API_BASE}/data`;
const ADD_EVENT_URL = `${API_BASE}/events`;


const fetchEvents = async () => {
  if (!API_BASE) return [];
  const res = await fetch(FETCH_EVENTS_URL);
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
};


function App({}) {
  const queryClient = useQueryClient(); 
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  const addEvent = async (newEvent) => {
    if (!API_BASE) throw new Error('REACT_APP_API_BASE_URL is not set');
    const res = await fetch(ADD_EVENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newEvent.title,
        date: newEvent.date,
        description: newEvent.description ?? '',
        image_url: newEvent.image_url ?? '',
        location: newEvent.location ?? '',
      }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || errBody.detail || `Failed to add event: ${res.status}`);
    }
  };

  const mutation = useMutation({
    mutationFn: addEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowForm(false);
    },
  });

  const handleAddEvent = (newEvent) => {
    mutation.mutate(newEvent);
  };


  return (
    <div className="App">
      <Header />

      <div className="search-plus-bar">
        <SearchBar query={query} setQuery={setQuery} />
        <button className="plus-button" onClick={() => setShowForm(true)}>+</button>
      </div>

      {isLoading ? (
        <p style={{ textAlign: 'center' }}>Loading events...</p>
      ) : error ? (
        <p style={{ textAlign: 'center' }}>Error loading events: {error.message}</p>
      ) : (
        <EventGrid query={query} events={events} />
      )}

      {/* Add-New-Event Popup */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <AddEventForm onAddEvent={handleAddEvent} />
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

