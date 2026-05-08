import * as React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import Button from '@/components/ui/button';
import { saveAs } from 'file-saver';

const CoachDashboard: React.FC = () => {
  const { role } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [sortBy, setSortBy] = useState<'name' | 'workouts'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [viewWorkoutsClient, setViewWorkoutsClient] = useState<any | null>(null);
  const [workoutSearch, setWorkoutSearch] = useState("");
  const [noteStatus, setNoteStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    if (role !== 'coach' && role !== 'admin') return;
    setLoading(true);
    setError(null);
    fetch('/api/clients')
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch clients'))
      .then(data => setClients(data.clients || []))
      .catch(e => setError(e.toString()))
      .finally(() => setLoading(false));
  }, [role]);

  const exportCSV = () => {
    let csv = 'Client,Date,Exercise,Set,Weight,Reps,Completed\n';
    clients.forEach(client => {
      const name = client.name || client.email || 'Unknown';
      (client.workouts || []).forEach((w: any) => {
        const date = w.date || w.createdAt || '';
        const exercises = w.session && Array.isArray(w.session)
          ? w.session
          : w.exercise ? [w.exercise] : [];
        exercises.forEach((ex: any) => {
          ex.sets?.forEach((set: any, idx: number) => {
            csv += `${name},${date},${ex.name},${idx + 1},${set.weight},${set.reps},${set.completed ? 'Yes' : 'No'}\n`;
          });
        });
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'clients_workouts.csv');
  };

  const filteredClients = clients.filter(client => {
    const name = (client.name || "").toLowerCase();
    const email = (client.email || "").toLowerCase();
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  const totalClients = filteredClients.length;
  const totalWorkouts = filteredClients.reduce((sum, c) => sum + (c.workouts ? c.workouts.length : 0), 0);
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (sortBy === 'name') {
      const aName = (a.name || a.email || '').toLowerCase();
      const bName = (b.name || b.email || '').toLowerCase();
      if (aName < bName) return sortDir === 'asc' ? -1 : 1;
      if (aName > bName) return sortDir === 'asc' ? 1 : -1;
      return 0;
    } else {
      const aCount = a.workouts ? a.workouts.length : 0;
      const bCount = b.workouts ? b.workouts.length : 0;
      return sortDir === 'asc' ? aCount - bCount : bCount - aCount;
    }
  });
  const paginatedClients = sortedClients.slice((page - 1) * pageSize, page * pageSize);

  if (role !== 'coach' && role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Not authorized.</div>;
  }

  const handleNoteChange = async (workoutId: string, note: string) => {
    setNoteStatus(s => ({ ...s, [workoutId]: 'saving' }));
    try {
      await fetch(`/api/workouts/${workoutId}/note`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note }),
      });
      setNoteStatus(s => ({ ...s, [workoutId]: 'saved' }));
      setTimeout(() => setNoteStatus(s => ({ ...s, [workoutId]: '' })), 1500);
    } catch {
      setNoteStatus(s => ({ ...s, [workoutId]: 'error' }));
    }
  };

  return (
    <div className="p-2 sm:p-8 max-w-3xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Coach Dashboard</h2>
      <div className="mb-2 text-xs sm:text-sm text-muted-foreground">
        Total Clients: {totalClients} | Total Workouts: {totalWorkouts}
      </div>
      <input
        type="text"
        placeholder="Search clients..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 p-2 border rounded w-full max-w-xs text-xs sm:text-base"
      />
      <Button className="px-3 py-1 rounded border text-xs font-semibold hover:bg-muted mb-4" onClick={exportCSV}>Export All Client Data (CSV)</Button>
      {loading && <div>Loading clients...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && filteredClients.length === 0 && <div>No clients found.</div>}
      {!loading && !error && filteredClients.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] border mt-4 text-xs sm:text-base">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left">Client</th>
                <th className="p-2 text-left">Recent Workouts</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.map((client, i) => (
                <tr key={i} className="border-t hover:bg-accent/10">
                  <td className="p-2 cursor-pointer" onClick={() => setSelectedClient(client)}>{client.name || client.email || 'Unknown'}</td>
                  <td className="p-2">
                    {client.workouts ? client.workouts.length : 0}
                    <Button className="ml-2 px-2 py-1 rounded border text-xs font-semibold hover:bg-muted" onClick={() => setViewWorkoutsClient(client)}>View All Workouts</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-col sm:flex-row justify-between items-center mt-2 gap-2">
            <Button className="px-3 py-1 rounded border text-xs font-semibold hover:bg-muted" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="text-xs">Page {page} of {Math.ceil(totalClients / pageSize)}</span>
            <Button className="px-3 py-1 rounded border text-xs font-semibold hover:bg-muted" onClick={() => setPage(p => Math.min(Math.ceil(totalClients / pageSize), p + 1))} disabled={page === Math.ceil(totalClients / pageSize)}>Next</Button>
          </div>
        </div>
      )}
      {selectedClient && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-2">{selectedClient.name || selectedClient.email || 'Client'}'s Analytics</h3>
          <ClientProgressChart workouts={selectedClient.workouts || []} />
          <Button className="mt-2 px-3 py-1 rounded border text-xs font-semibold hover:bg-muted" onClick={() => setSelectedClient(null)}>Back to Clients</Button>
        </div>
      )}
      {viewWorkoutsClient && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-2 sm:p-6 max-w-2xl w-full relative overflow-x-auto">
            <button className="absolute top-2 right-2 text-lg" onClick={() => setViewWorkoutsClient(null)}>&times;</button>
            <h3 className="text-lg font-bold mb-2">{viewWorkoutsClient.name || viewWorkoutsClient.email || 'Client'}'s Workouts</h3>
            <input
              type="text"
              placeholder="Filter by exercise name..."
              value={workoutSearch}
              onChange={e => setWorkoutSearch(e.target.value)}
              className="mb-2 p-2 border rounded w-full text-xs sm:text-base"
            />
            <Button className="mb-2 px-3 py-1 rounded border text-xs font-semibold hover:bg-muted" onClick={() => {
              let csv = 'Date,Exercise,Set,Weight,Reps,Completed\n';
              (viewWorkoutsClient.workouts || []).forEach((w: any) => {
                const date = w.date || w.createdAt || '';
                const exercises = w.session && Array.isArray(w.session)
                  ? w.session
                  : w.exercise ? [w.exercise] : [];
                exercises.forEach((ex: any) => {
                  if (workoutSearch && !ex.name.toLowerCase().includes(workoutSearch.toLowerCase())) return;
                  ex.sets?.forEach((set: any, idx: number) => {
                    csv += `${date},${ex.name},${idx + 1},${set.weight},${set.reps},${set.completed ? 'Yes' : 'No'}\n`;
                  });
                });
              });
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              saveAs(blob, `${viewWorkoutsClient.name || viewWorkoutsClient.email || 'client'}_workouts.csv`);
            }}>Export CSV</Button>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full min-w-[400px] border text-xs sm:text-base">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-1 text-left">Date</th>
                    <th className="p-1 text-left">Exercise</th>
                    <th className="p-1 text-left">Set</th>
                    <th className="p-1 text-left">Weight</th>
                    <th className="p-1 text-left">Reps</th>
                    <th className="p-1 text-left">Completed</th>
                    <th className="p-1 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewWorkoutsClient.workouts || []).flatMap((w: any) => {
                    const date = w.date || w.createdAt || '';
                    const exercises = w.session && Array.isArray(w.session)
                      ? w.session
                      : w.exercise ? [w.exercise] : [];
                    return exercises.filter((ex: any) => !workoutSearch || ex.name.toLowerCase().includes(workoutSearch.toLowerCase())).flatMap((ex: any) =>
                      ex.sets?.map((set: any, idx: number) => (
                        <tr key={date + ex.name + idx}>
                          <td className="p-1">{date}</td>
                          <td className="p-1">{ex.name}</td>
                          <td className="p-1">{idx + 1}</td>
                          <td className="p-1">{set.weight}</td>
                          <td className="p-1">{set.reps}</td>
                          <td className="p-1">{set.completed ? 'Yes' : 'No'}</td>
                          <td className="p-1">{ex.note || ''}</td>
                        </tr>
                      )) || []
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reuse ProgressChart logic, but use provided workouts prop
const ClientProgressChart: React.FC<{ workouts: any[] }> = ({ workouts }) => {
  // Aggregate workouts by day for the current week
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const weekData = daysOfWeek.map((day, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    // Find workouts for this day
    const dayWorkouts = workouts.filter(w => {
      const wDate = w.date || w.createdAt;
      return wDate && wDate.startsWith(dateStr);
    });
    const totalSets = dayWorkouts.reduce((sum, w) => {
      if (w.session && Array.isArray(w.session)) {
        return sum + w.session.reduce((s: number, ex: any) => s + (ex.sets?.length || 0), 0);
      } else if (w.exercise && w.exercise.sets) {
        return sum + w.exercise.sets.length;
      }
      return sum;
    }, 0);
    const maxWeight = dayWorkouts.reduce((max, w) => {
      if (w.session && Array.isArray(w.session)) {
        return Math.max(max, ...w.session.flatMap((ex: any) => ex.sets?.map((set: any) => set.weight) || []));
      } else if (w.exercise && w.exercise.sets) {
        return Math.max(max, ...w.exercise.sets.map((set: any) => set.weight));
      }
      return max;
    }, 0);
    return { date: day, weight: maxWeight, sets: totalSets };
  });
  const maxWeight = Math.max(...weekData.map(d => d.weight), 1);
  const maxSets = Math.max(...weekData.map(d => d.sets), 1);
  const totalWorkouts = workouts.length;
  const maxWeightAll = Math.max(...workouts.flatMap(w =>
    w.session && Array.isArray(w.session)
      ? w.session.flatMap((ex: any) => ex.sets?.map((set: any) => set.weight) || [])
      : w.exercise && w.exercise.sets
        ? w.exercise.sets.map((set: any) => set.weight)
        : []
  ), 0);
  const totalSetsAll = workouts.reduce((sum, w) => {
    if (w.session && Array.isArray(w.session)) {
      return sum + w.session.reduce((s: number, ex: any) => s + (ex.sets?.length || 0), 0);
    } else if (w.exercise && w.exercise.sets) {
      return sum + w.exercise.sets.length;
    }
    return sum;
  }, 0);
  // Personal bests
  const exerciseBests: Record<string, number> = {};
  workouts.forEach(w => {
    const exercises = w.session && Array.isArray(w.session)
      ? w.session
      : w.exercise ? [w.exercise] : [];
    exercises.forEach((ex: any) => {
      if (!ex.name) return;
      const maxSetWeight = ex.sets && ex.sets.length > 0 ? Math.max(...ex.sets.map((set: any) => set.weight)) : 0;
      if (!exerciseBests[ex.name] || maxSetWeight > exerciseBests[ex.name]) {
        exerciseBests[ex.name] = maxSetWeight;
      }
    });
  });
  return (
    <div className="mt-4">
      <div className="font-bold mb-2">Weekly Progress</div>
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekData.map((day, index) => (
          <div key={index} className="text-center space-y-1">
            <div className="text-xs font-medium text-muted-foreground">{day.date}</div>
            <div className="relative h-16 bg-secondary rounded-lg overflow-hidden">
              {day.weight > 0 && (
                <>
                  <div className="absolute bottom-0 w-full bg-gradient-primary rounded-lg" style={{ height: `${(day.weight / maxWeight) * 80}%` }} />
                  <div className="absolute bottom-0 w-full bg-accent/30 rounded-lg" style={{ height: `${(day.sets / maxSets) * 100}%` }} />
                </>
              )}
              {day.weight === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground/50">Rest</div>
              )}
            </div>
            <div className="text-xs">{day.weight > 0 ? `${day.weight}lb, ${day.sets} sets` : 'Rest'}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 pt-2 border-t">
        <div className="text-center">
          <div className="text-lg font-bold text-primary">{totalWorkouts}</div>
          <div className="text-xs text-muted-foreground">Workouts</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-accent">{maxWeightAll}</div>
          <div className="text-xs text-muted-foreground">Max Weight</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-success">{totalSetsAll}</div>
          <div className="text-xs text-muted-foreground">Total Sets</div>
        </div>
      </div>
      <div className="pt-4">
        <div className="font-bold mb-1">Personal Bests</div>
        {Object.keys(exerciseBests).length === 0 ? (
          <div className="text-muted-foreground text-xs">No personal bests yet.</div>
        ) : (
          <ul className="space-y-1">
            {Object.entries(exerciseBests).map(([name, weight]) => (
              <li key={name} className="text-xs">
                <span className="font-semibold">{name}</span> – {weight} lbs
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CoachDashboard; 