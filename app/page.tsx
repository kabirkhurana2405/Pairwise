'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

type Profile = {
  id: string;
  user_id?: string | null;
  display_name: string;
  age: number;
  city: string;
  role: string;
  bio: string;
  interests: string[];
  core_values: string[];
  looking_for: string;
  communication_style: string;
  is_demo?: boolean;
  demo_liker?: boolean;
};

type Match = { id: string; peer: Profile };
type Message = { id: string; match_id: string; sender_profile_id: string; body: string; created_at: string };

type Chemistry = {
  headline: string; spark: string; overlap: string; difference: string; opener: string; date: string;
};

const demoYou: Profile = {
  id: 'demo-you', display_name: 'Alex', age: 27, city: 'Delhi', role: 'Product designer',
  bio: 'I like slow Sundays, ambitious ideas and conversations that accidentally last three hours.',
  interests: ['Independent films', 'Long walks', 'Trying new cafés', 'Design'],
  core_values: ['Curiosity', 'Kindness', 'Independence'],
  looking_for: 'A thoughtful relationship with room to grow.',
  communication_style: 'I open up through humour and good questions.'
};

const seedProfiles: Profile[] = [
  { id:'mira', display_name:'Mira', age:26, city:'Delhi', role:'Architect', bio:'Collecting little stories from cities, one bookstore and one badly planned trip at a time.', interests:['Architecture','Independent films','Bookstores','Weekend travel'], core_values:['Curiosity','Kindness','Creativity'], looking_for:'Something intentional, without rushing the good parts.', communication_style:'I connect through shared experiences and thoughtful conversation.', is_demo:true },
  { id:'aarav', display_name:'Aarav', age:28, city:'Gurugram', role:'Climate researcher', bio:'Usually found cycling somewhere, reading about the future or making dinner for friends.', interests:['Cycling','Climate science','Cooking','Live music'], core_values:['Honesty','Community','Curiosity'], looking_for:'A grounded connection with shared purpose.', communication_style:'I appreciate directness, warmth and a little spontaneity.', is_demo:true },
  { id:'zoya', display_name:'Zoya', age:25, city:'Delhi', role:'Writer', bio:'Writing things down, finding new music and asking one question too many.', interests:['Writing','Live music','Independent films','Art'], core_values:['Creativity','Empathy','Independence'], looking_for:'A relationship that feels like being on the same team.', communication_style:'I love playful banter that can turn into a real conversation.', is_demo:true },
  { id:'dev', display_name:'Dev', age:27, city:'Delhi', role:'Founder', bio:'Building small things, discovering old music and finding good food with friends.', interests:['Startups','Music','Food walks','Photography'], core_values:['Curiosity','Honesty','Ambition'], looking_for:'A genuine connection with a sense of humour.', communication_style:'A mix of playful conversation and thoughtful questions.', is_demo:true },
  { id:'isha', display_name:'Isha', age:26, city:'Noida', role:'Psychologist', bio:'A fan of slow mornings, good conversations and finding meaning in ordinary things.', interests:['Reading','Pottery','Nature walks','Cinema'], core_values:['Empathy','Kindness','Growth'], looking_for:'Something steady, open and mutually supportive.', communication_style:'I value listening and conversations with depth.', is_demo:true },
  { id:'rohan', display_name:'Rohan', age:29, city:'Gurugram', role:'Product manager', bio:'Equal parts curious about technology and obsessed with finding the best breakfast spots.', interests:['Technology','Running','Coffee','Travel'], core_values:['Curiosity','Independence','Humour'], looking_for:'A relationship where both people keep growing.', communication_style:'I connect through humour and shared adventures.', is_demo:true }
];

const demoIncomingInitial = ['zoya', 'aarav'];
const demoMatchedInitial = ['mira'];

const demoMessages: Message[] = [
  { id:'dm1', match_id:'demo-match-mira', sender_profile_id:'mira', body:'Hey Alex! I saw you like independent films too. Have you watched anything good lately?', created_at:'2026-11-12T12:30:00Z' },
  { id:'dm2', match_id:'demo-match-mira', sender_profile_id:'demo-you', body:'I have a soft spot for films that make you think about them for days.', created_at:'2026-11-12T12:35:00Z' },
  { id:'dm3', match_id:'demo-match-mira', sender_profile_id:'mira', body:'That is exactly my kind of film. We should trade recommendations.', created_at:'2026-11-12T12:39:00Z' }
];

const chemistryFallback: Record<string, Chemistry> = {
  mira: { headline:'A connection built on curiosity.', spark:'You both seem drawn to the details other people rush past. Alex notices design in everyday spaces; Mira actively collects stories from the cities she explores. That shared way of looking at the world gives you a natural starting point.', overlap:'Independent films appear in both your interests, and curiosity and kindness show up in both your values. These are real common threads, not a guarantee of compatibility.', difference:'Mira prefers connecting through shared experiences, while you tend to open up through humour and questions. That difference could be complementary, as long as you make room for both styles.', opener:'You mentioned collecting stories from cities. What is one place in Delhi that has a story most people walk straight past?', date:'Pick an independent film screening, then walk to a nearby café and trade your most underrated neighbourhood discoveries.' },
  zoya: { headline:'A meeting of creative minds.', spark:'You both seem to find connection through culture and ideas. Your shared interest in independent films could lead to conversations that move well beyond the usual introductions.', overlap:'Independent films and creativity are common ground. Zoya’s love of playful banter also has a natural fit with your conversational style.', difference:'Zoya describes wanting a strong sense of teamwork, while your profile emphasises independence. It may be worth exploring what balance looks like to each of you.', opener:'I need a new independent film recommendation. What is the last one that stayed with you longer than expected?', date:'Catch a small film screening or art exhibition, then find a quiet spot to debate the best part.' },
  aarav: { headline:'Different routines, shared curiosity.', spark:'Your interests have different rhythms, but both profiles suggest curiosity about how the world works and a desire to keep learning.', overlap:'Curiosity is a shared value. You both describe wanting something thoughtful and intentional, rather than a connection built on surface-level chemistry.', difference:'Aarav values directness, while your style leans on humour and questions. A little clarity early on may help you understand each other.', opener:'What is one small change you have made in your everyday life that made you see your city differently?', date:'A relaxed Sunday café followed by a park walk. Let Aarav pick the route and you pick the coffee.' }
};

const emptyForm = {
  display_name:'', age:'', city:'Delhi', role:'', bio:'', interests:'', values:'',
  looking_for:'', communication_style:''
};

export default function Home() {
  const supabase = useMemo(() => getSupabase(), []);
  const [authChecking, setAuthChecking] = useState(true);
  const [mode, setMode] = useState<'login'|'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);
  const [userId, setUserId] = useState<string|null>(null);
  const [profile, setProfile] = useState<Profile|null>(null);
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState<'discover'|'likes'|'matches'|'profile'|'chat'|'dates'>('discover');
  const [peers, setPeers] = useState<Profile[]>(seedProfiles);
  const [incoming, setIncoming] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [activePeer, setActivePeer] = useState<Profile|null>(null);
  const [activeMatch, setActiveMatch] = useState<Match|null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [chemistry, setChemistry] = useState<Chemistry|null>(null);
  const [chemistryPeer, setChemistryPeer] = useState<Profile|null>(null);
  const [chemistryBusy, setChemistryBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [dateType, setDateType] = useState('gaming');
  const [dateMood, setDateMood] = useState('playful');
  const [datePlan, setDatePlan] = useState<{title:string;description:string;steps:string[];icebreaker:string}|null>(null);
