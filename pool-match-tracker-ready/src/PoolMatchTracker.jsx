// src/PoolMatchTracker.jsx
import React, { useEffect, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { PlusCircle, Trophy, History, PlayCircle } from 'lucide-react'
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  increment,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCBnSWYr1Sor9cwYyDpVeL_d8oiffAwW0I",
  authDomain: "pool-tracker-web-2bd11.firebaseapp.com",
  projectId: "pool-tracker-web-2bd11",
  storageBucket: "pool-tracker-web-2bd11.appspot.com",
  messagingSenderId: "121189742184",
  appId: "1:121189742184:web:d8bde3c77305a5babc6ddd",
  measurementId: "G-8H1RMV64CZ",
};

const app = initializeApp(firebaseConfig)
getAnalytics(app)
const db = getFirestore(app)

const normaliseName = (name) => name.trim()

async function ensurePlayerExists(name) {
  const id = normaliseName(name)
  await setDoc(
    doc(db, 'players', id),
    { wins: 0, losses: 0, winStreak: 0, lossStreak: 0 },
    { merge: true },
  )
}

async function recordResult(gameId, player1, player2, winner) {
  const loser = winner === player1 ? player2 : player1
  await addDoc(collection(db, 'matches'), {
    player1,
    player2,
    winner,
    finishedAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'players', normaliseName(winner)), {
    wins: increment(1),
    winStreak: increment(1),
    lossStreak: 0,
  })
  await updateDoc(doc(db, 'players', normaliseName(loser)), {
    losses: increment(1),
    lossStreak: increment(1),
    winStreak: 0,
  })
  await deleteDoc(doc(db, 'activeGames', gameId))
}

export default function PoolMatchTracker() {
  return (
    <div className='min-h-screen bg-white text-blue-900 p-6'>
      <h1 className='text-4xl font-bold text-center mb-8'>Pool Match Tracker 🎱</h1>
      <div className='grid lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          <ActiveGamesCard />
          <PastMatchesCard />
        </div>
        <LeaderboardCard />
      </div>
    </div>
  )
}

function Card({ title, icon, children }) {
  return (
    <div className='bg-blue-50 rounded-xl shadow p-4'>
      <div className='flex items-center gap-2 mb-4 text-blue-800'>
        {icon}
        <h2 className='text-lg font-semibold'>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function ActiveGamesCard() {
  const [games, setGames] = useState([])
  useEffect(() => {
    const q = query(collection(db, 'activeGames'), orderBy('startedAt', 'desc'))
    return onSnapshot(q, (snap) => {
      setGames(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [])

  return (
    <Card title='Active Games' icon={<PlayCircle className='w-5 h-5' />}>
      <NewGameDialog />
      {games.length === 0 ? (
        <p className='text-center py-4'>No active games.</p>
      ) : (
        <ul className='divide-y divide-blue-100'>
          {games.map((g) => (
            <li key={g.id} className='flex items-center justify-between py-2'>
              <span className='font-medium'>
                {g.player1} vs {g.player2}
              </span>
              <FinishGameDialog game={g} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function PastMatchesCard() {
  const [matches, setMatches] = useState([])
  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('finishedAt', 'desc'), limit(25))
    return onSnapshot(q, (snap) => {
      setMatches(snap.docs.map((d) => d.data()))
    })
  }, [])

  return (
    <Card title='Past Matches' icon={<History className='w-5 h-5' />}>
      {matches.length === 0 ? (
        <p className='text-center py-4'>No matches yet.</p>
      ) : (
        <ul className='divide-y divide-blue-100'>
          {matches.map((m, idx) => (
            <li key={idx} className='py-2 flex justify-between'>
              <span>
                {m.player1} vs {m.player2}
              </span>
              <span className='font-semibold text-blue-700'>Winner: {m.winner}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function LeaderboardCard() {
  const [players, setPlayers] = useState([])
  useEffect(() => {
    const q = query(
      collection(db, 'players'),
      orderBy('wins', 'desc'),
      orderBy('losses', 'asc'),
    )
    return onSnapshot(q, (snap) => {
      setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [])

  return (
    <Card title='Leaderboard' icon={<Trophy className='w-5 h-5' />}>
      {players.length === 0 ? (
        <p className='text-center py-4'>Add players to see the leaderboard.</p>
      ) : (
        <table className='w-full text-left'>
          <thead>
            <tr className='border-b border-blue-200'>
              <th className='py-2'>Player</th>
              <th>W</th>
              <th>L</th>
              <th>Win Streak</th>
              <th>Loss Streak</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className='border-b border-blue-100'>
                <td className='py-1 font-medium'>{p.id}</td>
                <td>{p.wins ?? 0}</td>
                <td>{p.losses ?? 0}</td>
                <td>{p.winStreak ?? 0}</td>
                <td>{p.lossStreak ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

function NewGameDialog() {
  const [open, setOpen] = useState(false)
  const [player1, setPlayer1] = useState('')
  const [player2, setPlayer2] = useState('')

  const startGame = async () => {
    if (!player1 || !player2 || player1 === player2) return
    await Promise.all([ensurePlayerExists(player1), ensurePlayerExists(player2)])
    await addDoc(collection(db, 'activeGames'), {
      player1: normaliseName(player1),
      player2: normaliseName(player2),
      startedAt: serverTimestamp(),
    })
    setOpen(false)
    setPlayer1('')
    setPlayer2('')
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button className='flex items-center gap-2 mb-4 px-3 py-2 rounded-md bg-blue-600 text-white'>
          <PlusCircle className='w-4 h-4' />
          New Game
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Content className='bg-white p-6 rounded-xl shadow-xl max-w-sm w-full'>
        <h2 className='text-xl font-semibold mb-4 text-blue-800'>Start New Game</h2>
        <input
          className='w-full border border-blue-300 rounded p-2 mb-3'
          placeholder='Player 1 name'
          value={player1}
          onChange={(e) => setPlayer1(e.target.value)}
        />
        <input
          className='w-full border border-blue-300 rounded p-2 mb-4'
          placeholder='Player 2 name'
          value={player2}
          onChange={(e) => setPlayer2(e.target.value)}
        />
        <button
          onClick={startGame}
          className='w-full py-2 rounded bg-blue-600 text-white font-medium'
        >
          Start
        </button>
      </DialogPrimitive.Content>
    </DialogPrimitive.Root>
  )
}

function FinishGameDialog({ game }) {
  const [open, setOpen] = useState(false)

  const record = async (winner) => {
    await recordResult(game.id, game.player1, game.player2, winner)
    setOpen(false)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button className='px-2 py-1 text-sm bg-blue-500 text-white rounded'>Finish</button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Content className='bg-white p-6 rounded-xl shadow-xl max-w-sm'>
        <h2 className='text-xl font-semibold mb-4 text-blue-800'>Select Winner</h2>
        <button
          onClick={() => record(game.player1)}
          className='w-full mb-2 py-2 rounded bg-blue-600 text-white'
        >
          {game.player1}
        </button>
        <button
          onClick={() => record(game.player2)}
          className='w-full py-2 rounded bg-blue-600 text-white'
        >
          {game.player2}
        </button>
      </DialogPrimitive.Content>
    </DialogPrimitive.Root>
  )
}
