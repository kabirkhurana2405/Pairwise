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

  function flash(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(''), 2600);
  }

  useEffect(() => {
    let alive = true;
    async function restore() {
      if (!supabase) { setAuthChecking(false); return; }
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (data.session?.user) await enterMember(data.session.user.id, alive);
      setAuthChecking(false);
    }
    restore();
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function enterMember(uid: string, alive = true) {
    if (!supabase) return;
    setDemo(false);
    setUserId(uid);
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle();
    if (!alive) return;
    if (error) { setNotice(error.message); return; }
    if (!data) {
      setProfile(null);
      setForm(emptyForm);
      setView('profile');
      setAuthChecking(false);
      return;
    }
    const own = data as Profile;
    setProfile(own);
    setForm({
      display_name:own.display_name, age:String(own.age), city:own.city, role:own.role || '',
      bio:own.bio || '', interests:(own.interests || []).join(', '), values:(own.core_values || []).join(', '),
      looking_for:own.looking_for || '', communication_style:own.communication_style || ''
    });
    await loadMemberApp(own);
  }

  async function loadMemberApp(own: Profile) {
    if (!supabase) return;
    const [profileRes, likeRes, matchRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('likes').select('*'),
      supabase.from('matches').select('*')
    ]);
    if (profileRes.error || likeRes.error || matchRes.error) {
      setNotice('Some Pairwise data could not be loaded. Check that the Supabase schema has been run.');
    }
    const allProfiles = (profileRes.data || []) as Profile[];
    const allLikes = (likeRes.data || []) as { id:string; from_profile_id:string; to_profile_id:string }[];
    const allMatches = (matchRes.data || []) as { id:string; profile_one_id:string; profile_two_id:string }[];
    const profileMap = new Map(allProfiles.map(p => [p.id, p]));
    setPeers(allProfiles.filter(p => p.id !== own.id));
    setIncoming(allLikes.filter(l => l.to_profile_id === own.id).map(l => profileMap.get(l.from_profile_id)).filter(Boolean) as Profile[]);
    setLikedIds(allLikes.filter(l => l.from_profile_id === own.id).map(l => l.to_profile_id));
    setMatches(allMatches.map(m => {
      const otherId = m.profile_one_id === own.id ? m.profile_two_id : m.profile_one_id;
      return { id:m.id, peer:profileMap.get(otherId) };
    }).filter(m => Boolean(m.peer)) as Match[]);
    setView('discover');
  }

  async function submitAuth(e: FormEvent) {
    e.preventDefault();
    setNotice('');
    if (!supabase) { setNotice('Add the Supabase URL and anon key to .env.local to use account login. Demo mode is ready below.'); return; }
    if (!email.trim() || password.length < 6) { setNotice('Enter a valid email and a password with at least 6 characters.'); return; }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email:email.trim(), password });
        if (error) throw error;
        if (data.session?.user) await enterMember(data.session.user.id);
        else setNotice('Account created. Check your inbox to confirm your email, then come back and log in.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email:email.trim(), password });
        if (error) throw error;
        if (data.user) await enterMember(data.user.id);
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to authenticate. Please try again.');
    } finally { setBusy(false); setAuthChecking(false); }
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    const payload = {
      display_name:form.display_name.trim(), age:Number(form.age), city:form.city.trim(),
      role:form.role.trim(), bio:form.bio.trim(),
      interests:form.interests.split(',').map(x=>x.trim()).filter(Boolean).slice(0,12),
      core_values:form.values.split(',').map(x=>x.trim()).filter(Boolean).slice(0,10),
      looking_for:form.looking_for.trim(), communication_style:form.communication_style.trim()
    };
    if (!payload.display_name || !payload.age || payload.age < 18 || !payload.city || !payload.bio) {
      setNotice('Add your name, valid age (18+), city and a short bio to continue.'); return;
    }
    setBusy(true); setNotice('');
    if (demo) {
      const updated: Profile = { ...demoYou, ...payload };
      setProfile(updated); setView('discover'); flash('Your profile is ready.');
      setBusy(false); return;
    }
    if (!supabase || !userId) { setNotice('Your login session is missing. Please log in again.'); setBusy(false); return; }
    const { data, error } = await supabase.from('profiles').upsert({ user_id:userId, ...payload, is_demo:false }, { onConflict:'user_id' }).select().single();
    if (error) { setNotice(error.message); setBusy(false); return; }
    const own = data as Profile;
    setProfile(own);
    await loadMemberApp(own);
    flash('Your profile is saved.');
    setBusy(false);
  }

  function enterDemo() {
    setDemo(true); setUserId(null); setProfile(demoYou);
    setPeers(seedProfiles);
    setIncoming(seedProfiles.filter(p=>demoIncomingInitial.includes(p.id)));
    setMatches([{id:'demo-match-mira',peer:seedProfiles[0]}]);
    setLikedIds([]); setSkippedIds([]);
    setMessages(demoMessages);
    setForm({
      display_name:demoYou.display_name, age:String(demoYou.age), city:demoYou.city, role:demoYou.role,
      bio:demoYou.bio, interests:demoYou.interests.join(', '), core_values:demoYou.core_values.join(', '),
      looking_for:demoYou.looking_for, communication_style:demoYou.communication_style
    });
    setView('discover'); setNotice('');
  }

  async function logout() {
    if (demo) {
      setDemo(false); setProfile(null); setIncoming([]); setMatches([]); setNotice('');
      setView('discover'); return;
    }
    if (supabase) await supabase.auth.signOut();
    setUserId(null); setProfile(null); setIncoming([]); setMatches([]);
    setView('discover'); setMode('login');
  }

  async function likePeer(peer: Profile) {
    if (!profile) return;
    if (demo) {
      const alreadyIncoming = incoming.some(p=>p.id===peer.id);
      const simulatedReciprocal = peer.id === 'dev';
      if (alreadyIncoming || simulatedReciprocal) {
        setIncoming(prev=>prev.filter(p=>p.id!==peer.id));
        setMatches(prev=>prev.some(m=>m.peer.id===peer.id)?prev:[...prev,{id:`demo-match-${peer.id}`,peer}]);
        flash(`It's a match with ${peer.display_name}.`);
      } else {
        setLikedIds(prev=>prev.includes(peer.id)?prev:[...prev,peer.id]);
        setSkippedIds(prev=>prev.includes(peer.id)?prev:[...prev,peer.id]);
        flash(`Like sent to ${peer.display_name}.`);
      }
      setSkippedIds(prev=>prev.filter(id=>id!==peer.id));
      return;
    }
    if (!supabase) return;
    const { error } = await supabase.from('likes').upsert({ from_profile_id:profile.id, to_profile_id:peer.id }, { onConflict:'from_profile_id,to_profile_id', ignoreDuplicates:true });
    if (error) { flash('Could not send that like. Please try again.'); return; }
    await loadMemberApp(profile);
    setSkippedIds(prev=>prev.includes(peer.id)?prev:[...prev,peer.id]);
    flash('Like sent.');
  }

  async function passPeer(peer: Profile) {
    setSkippedIds(prev=>prev.includes(peer.id)?prev:[...prev,peer.id]);
  }

  async function acceptLike(peer: Profile) {
    await likePeer(peer);
    setView('likes');
  }

  async function openChat(match: Match) {
    setActiveMatch(match); setActivePeer(match.peer); setView('chat');
    if (demo) {
      setMessages(prev=>prev.filter(m=>m.match_id===match.id || m.match_id==='demo-match-mira'));
      return;
    }
    if (!supabase) return;
    const { data } = await supabase.from('messages').select('*').eq('match_id', match.id).order('created_at', { ascending:true });
    setMessages((data || []) as Message[]);
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!messageText.trim() || !activeMatch || !profile) return;
    const body = messageText.trim();
    if (demo) {
      const newMessage: Message = { id:`local-${Date.now()}`, match_id:activeMatch.id, sender_profile_id:profile.id, body, created_at:new Date().toISOString() };
      setMessages(prev=>[...prev,newMessage]); setMessageText(''); return;
    }
    if (!supabase) return;
    const { data, error } = await supabase.from('messages').insert({
      match_id:activeMatch.id, sender_profile_id:profile.id, body
    }).select().single();
    if (error) { flash('Message could not be sent.'); return; }
    setMessages(prev=>[...prev,data as Message]); setMessageText('');
  }

  async function createChemistry(peer: Profile) {
    if (!profile) return;
    setChemistryBusy(true); setChemistryPeer(peer); setChemistry(null);
    try {
      const response = await fetch('/api/chemistry', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({you:profile,person:peer})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI request failed');
      if (data.mode === 'demo') setChemistry(chemistryFallback[peer.id] || genericChemistry(profile, peer));
      else setChemistry(data as Chemistry);
    } catch {
      setChemistry(chemistryFallback[peer.id] || genericChemistry(profile, peer));
    } finally { setChemistryBusy(false); }
  }

  const visiblePeers = peers.filter(p=>!skippedIds.includes(p.id) && !likedIds.includes(p.id) && !matches.some(m=>m.peer.id===p.id));
  const nextPeer = visiblePeers[0] || null;

  if (authChecking) return <main className="loading-screen"><span className="brand-mark">p.</span><p>Finding your way in…</p></main>;

  if (!profile || view === 'profile') {
    const firstSetup = Boolean(userId || demo);
    return <main className="auth-shell">
      <header className="nav"><a className="brand" href="#"><span className="brand-mark">p.</span> pairwise</a><span className="nav-note">A little more than a first impression.</span><a className="nav-link" href="#why">Our approach ↗</a></header>
      <section className="auth-content">
        <div className="auth-intro"><div className="eyebrow"><span className="eyebrow-dot"/> MEET BEYOND THE PROFILE</div><h1>{firstSetup ? <>Start with<br/><em>your story.</em></> : <>Good connections<br/><em>start with curiosity.</em></>}</h1><p>{firstSetup ? 'A few details help people see the person behind the profile.' : 'A profile tells you who someone is. A thoughtful conversation helps you discover who they could be to you.'}</p></div>
        {!firstSetup ? <div className="auth-card">
          <div className="auth-card-head"><span className="section-kicker">{mode==='login'?'WELCOME BACK':'YOUR FIRST STEP'}</span><h2>{mode==='login'?'Log in to Pairwise':'Create your account'}</h2><p>{mode==='login'?'Pick up where a good conversation might begin.':'Build a profile that sounds like you.'}</p></div>
          <form onSubmit={submitAuth} className="form-stack">
            <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
            <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={mode==='login'?'current-password':'new-password'} minLength={6} required /></label>
            <button className="primary-button full" disabled={busy}>{busy?'Please wait…':mode==='login'?'Log in ↗':'Create account ↗'}</button>
          </form>
          <p className="switch-auth">{mode==='login'?'New to Pairwise?':'Already have an account?'} <button onClick={()=>{setMode(mode==='login'?'signup':'login');setNotice('');}}>{mode==='login'?'Create an account':'Log in'}</button></p>
          <div className="or"><span/> OR <span/></div>
          <button className="demo-button" onClick={enterDemo}>Explore the live demo <span>↗</span></button>
          {!supabase && <p className="config-note">Demo mode is ready. Add your Supabase keys to enable account login.</p>}
          {notice && <p className="notice">{notice}</p>}
        </div> : <div className="auth-card profile-builder">
          <div className="auth-card-head"><span className="section-kicker">YOUR PAIRWISE PROFILE</span><h2>Make it feel like you.</h2><p>Keep it honest. The best introductions start there.</p></div>
          <form onSubmit={saveProfile} className="form-stack">
            <div className="field-row"><label>Your name<input value={form.display_name} onChange={e=>setForm({...form,display_name:e.target.value})} placeholder="What should we call you?" required /></label><label>Age<input type="number" min="18" max="99" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} placeholder="18+" required /></label></div>
            <div className="field-row"><label>City<input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="Delhi" required /></label><label>What do you do?<input value={form.role} onChange={e=>setForm({...form,role:e.target.value})} placeholder="Your work or passion" /></label></div>
            <label>A little about you<textarea rows={3} value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="What makes an ordinary day a good one?" required /></label>
            <label>Things you enjoy <span className="field-hint">Separate with commas</span><input value={form.interests} onChange={e=>setForm({...form,interests:e.target.value})} placeholder="Cinema, travel, cooking, music" /></label>
            <label>Values that matter to you <span className="field-hint">Separate with commas</span><input value={form.values} onChange={e=>setForm({...form,values:e.target.value})} placeholder="Kindness, curiosity, humour" /></label>
            <label>What are you looking for?<textarea rows={2} value={form.looking_for} onChange={e=>setForm({...form,looking_for:e.target.value})} placeholder="A meaningful connection, friendship first…" /></label>
            <label>How do you connect with someone?<textarea rows={2} value={form.communication_style} onChange={e=>setForm({...form,communication_style:e.target.value})} placeholder="Through humour, shared experiences, deep conversations…" /></label>
            {notice && <p className="notice">{notice}</p>}
            <button className="primary-button full" disabled={busy}>{busy?'Saving your profile…':'Save profile & discover ↗'}</button>
          </form>
          <button className="text-button" onClick={()=>{if(demo){setView('discover');setProfile(demoYou);}else if(profile){setView('discover');}else logout();}}>← Back</button>
        </div>}
      </section>
      <section className="auth-foot" id="why"><div className="manifesto-mark">✳</div><div><span className="section-kicker">THE PAIRWISE DIFFERENCE</span><h2>AI Chemistry finds the thread.<br/><em>You decide where it leads.</em></h2><p>Instead of a compatibility score, Pairwise reads the details people choose to share and surfaces meaningful overlaps, differences worth exploring, thoughtful conversation starters and a first-date idea. No ranking. No relationship predictions. Just a better way to begin.</p></div></section>
      <section className="chemistry-story"><div className="section-kicker">A LITTLE MORE THAN AN ALGORITHM</div><h2>Not “you’re 92% compatible.”<br/><em>More like “here’s something to talk about.”</em></h2><div className="chemistry-story-grid"><div><span>01 / THE SPARK</span><p>Notice the small details and shared outlook that could make a conversation feel natural.</p></div><div><span>02 / THE DIFFERENCE</span><p>Surface a respectful point of difference worth being curious about, not a red flag score.</p></div><div><span>03 / THE FIRST MOVE</span><p>Get a personal opening question and an idea for spending time together.</p></div></div></section>
      <footer><a className="brand" href="#"><span className="brand-mark">p.</span> pairwise</a><span>Made for better first conversations.</span><span>© 2026 Pairwise</span></footer>
    </main>;
  }

  return <main className="app-shell">
    <header className="app-nav">
      <a className="brand" href="#" onClick={e=>{e.preventDefault();setView('discover');}}><span className="brand-mark">p.</span> pairwise</a>
      <nav className="app-tabs">
        <button className={view==='discover'?'selected':''} onClick={()=>setView('discover')}>Discover</button>
        <button className={view==='likes'?'selected':''} onClick={()=>setView('likes')}>Likes {incoming.length>0&&<i>{incoming.length}</i>}</button>
        <button className={view==='matches'||view==='chat'?'selected':''} onClick={()=>setView('matches')}>Matches {matches.length>0&&<i>{matches.length}</i>}</button>
        <button className={view==='dates'?'selected':''} onClick={()=>setView('dates')}>Date ideas</button>
      </nav>
      <button className="profile-pill" onClick={()=>setView('profile')}><span className="tiny-avatar">{profile.display_name.slice(0,1).toUpperCase()}</span><span>My profile</span></button>
    </header>

    <section className="app-main">
      <div className="app-heading">
        <div><div className="eyebrow"><span className="eyebrow-dot"/> {demo?'YOUR DEMO SPACE':'YOUR PAIRWISE SPACE'}</div>
          <h1>{view==='discover'?'Someone worth discovering.':view==='likes'?'A little interest, coming your way.':view==='matches'?'Good things can start here.':view==='chat'?'Let the conversation begin.':view==='dates'?'Make a little plan together.':'Your story, your way.'}</h1>
          <p>{view==='discover'?'Take a look beyond the first impression.':view==='likes'?'People who would like to get to know you.':view==='matches'?'Your mutual connections, all in one place.':view==='chat'?`A conversation with ${activePeer?.display_name || 'your match'}.`:view==='dates'?'Turn a mutual match into a shared experience — even from two different places.':'Keep the details that make you, you.'}</p>
        </div>
        {demo && <span className="demo-chip"><span/> DEMO MODE</span>}
      </div>

      {view==='discover' && <div className="discovery-layout">
        {nextPeer ? <article className="discover-card">
          <div className="discover-art"><Avatar profile={nextPeer} size="large" /><span className="art-caption">A LITTLE MORE TO DISCOVER</span><span className="art-index">{String(peers.findIndex(p=>p.id===nextPeer.id)+1).padStart(2,'0')} / {String(peers.length).padStart(2,'0')}</span></div>
          <div className="discover-info">
            <div className="card-label">A NEW INTRODUCTION</div><h2>{nextPeer.display_name}, {nextPeer.age}</h2><p className="role">{nextPeer.role} · {nextPeer.city}</p><p className="bio large-bio">{nextPeer.bio}</p>
            <div className="detail-line"><span>INTO</span><div className="tag-list">{(nextPeer.interests||[]).slice(0,4).map(t=><b key={t}>{t}</b>)}</div></div>
            <div className="detail-line"><span>VALUES</span><div className="tag-list">{(nextPeer.core_values||[]).slice(0,3).map(t=><b key={t}>{t}</b>)}</div></div>
            <div className="looking-for"><span className="section-kicker">LOOKING FOR</span><p>{nextPeer.looking_for}</p></div>
            <div className="card-actions"><button className="pass-button" onClick={()=>passPeer(nextPeer)}>Pass</button><button className="like-button" onClick={()=>likePeer(nextPeer)}>Like them <span>♡</span></button></div>
            <button className="chemistry-link" onClick={()=>createChemistry(nextPeer)}>✳ Discover our chemistry <span>↗</span></button>
          </div>
        </article> : <div className="empty-state"><span className="empty-mark">✳</span><h2>You've seen everyone for now.</h2><p>Come back later. Good introductions are worth waiting for.</p><button className="outline-button" onClick={()=>setSkippedIds([])}>Start over</button></div>}
        <aside className="side-note chemistry-highlight"><span className="section-kicker">✳ THE PAIRWISE FEATURE</span><h3>Meet the person behind the profile.</h3><p>AI Chemistry finds shared interests, a difference worth exploring and a thoughtful way to start talking. It never gives people a compatibility score.</p><button className="chemistry-link" onClick={()=>nextPeer&&createChemistry(nextPeer)}>Try AI Chemistry <span>↗</span></button><div className="side-rule"/><span className="side-quote">“The best conversations begin with a better question.”</span></aside>
      </div>}

      {view==='likes' && <div className="list-area">{incoming.length ? incoming.map(peer=><div className="list-card" key={peer.id}><Avatar profile={peer} /><div className="list-main"><h3>{peer.display_name}, {peer.age}</h3><p>{peer.role} · {peer.city}</p><span>{peer.bio}</span></div><div className="list-actions"><button className="outline-button" onClick={()=>createChemistry(peer)}>Chemistry</button><button className="like-button small" onClick={()=>acceptLike(peer)}>Like back ♡</button></div></div>) : <div className="empty-state"><span className="empty-mark">♡</span><h2>No new likes just yet.</h2><p>Keep showing up as yourself. The right conversation starts somewhere.</p><button className="outline-button" onClick={()=>setView('discover')}>Discover people</button></div>}</div>}

      {view==='matches' && <div className="list-area">{matches.length ? matches.map(match=><div className="list-card" key={match.id}><Avatar profile={match.peer} /><div className="list-main"><h3>{match.peer.display_name}, {match.peer.age}</h3><p>{match.peer.role} · {match.peer.city}</p><span>{match.peer.bio}</span></div><div className="list-actions"><button className="outline-button" onClick={()=>createChemistry(match.peer)}>Chemistry</button><button className="like-button small" onClick={()=>openChat(match)}>Say hello ↗</button></div></div>) : <div className="empty-state"><span className="empty-mark">✳</span><h2>Your next conversation is out there.</h2><p>A match happens when two people choose to connect.</p><button className="outline-button" onClick={()=>setView('discover')}>Discover people</button></div>}</div>}

      {view==='chat' && activeMatch && <div className="chat-panel"><div className="chat-top"><button className="text-button" onClick={()=>setView('matches')}>← All matches</button><div><strong>{activePeer?.display_name}</strong><span>Mutual match</span></div><button className="chemistry-link" onClick={()=>activePeer&&createChemistry(activePeer)}>Chemistry ↗</button></div><div className="chat-messages">{messages.filter(m=>demo ? (m.match_id===activeMatch.id || (activeMatch.id==='demo-match-mira' && m.match_id==='demo-match-mira')) : m.match_id===activeMatch.id).map(m=><div key={m.id} className={`bubble ${m.sender_profile_id===profile.id?'mine':''}`}><p>{m.body}</p><time>{new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</time></div>)}{messages.filter(m=>m.match_id===activeMatch.id).length===0&&<p className="chat-empty">This is the beginning. Say something that sounds like you.</p>}</div><form className="chat-compose" onSubmit={sendMessage}><input value={messageText} onChange={e=>setMessageText(e.target.value)} placeholder={`Message ${activePeer?.display_name}…`} /><button type="submit" disabled={!messageText.trim()}>Send ↗</button></form><p className="chat-demo-note">{demo?'Demo messages are stored in this browser session.':'Messages are stored in your Pairwise account.'}</p></div>}

      {view==='dates' && <div className="date-planner">
        <div className="date-intro"><span className="section-kicker">A SHARED LITTLE ADVENTURE</span><h2>Good dates don't need<br/><em>the same postcode.</em></h2><p>Pick a vibe and Pairwise will put together a simple virtual date you can enjoy together, wherever you are.</p></div>
        <div className="date-controls">
          <label>WHAT SOUNDS FUN?</label>
          <div className="date-options">
            <button className={dateType==='gaming'?'active':''} onClick={()=>{setDateType('gaming');setDatePlan(null);}}>🎮 <span>Co-op gaming</span></button>
            <button className={dateType==='movie'?'active':''} onClick={()=>{setDateType('movie');setDatePlan(null);}}>🎬 <span>Movie night</span></button>
            <button className={dateType==='music'?'active':''} onClick={()=>{setDateType('music');setDatePlan(null);}}>♫ <span>Music & playlists</span></button>
            <button className={dateType==='cook'?'active':''} onClick={()=>{setDateType('cook');setDatePlan(null);}}>🍜 <span>Cook together</span></button>
            <button className={dateType==='creative'?'active':''} onClick={()=>{setDateType('creative');setDatePlan(null);}}>🎨 <span>Creative hour</span></button>
            <button className={dateType==='quiz'?'active':''} onClick={()=>{setDateType('quiz');setDatePlan(null);}}>✦ <span>Quiz & questions</span></button>
          </div>
          <label className="mood-label">PICK THE MOOD</label>
          <div className="mood-options">{['playful','cosy','a little competitive'].map(m=><button className={dateMood===m?'active':''} onClick={()=>{setDateMood(m);setDatePlan(null);}} key={m}>{m}</button>)}</div>
          <button className="primary-button full" onClick={()=>{
            const plans:Record<string,{title:string;description:string;steps:string[];icebreaker:string}>={
              gaming:{title:'The co-op connection',description:'A low-pressure game night where teamwork does the talking.',steps:['Pick a free co-op browser game or a game you both already own.','Start with a 10-minute warm-up round; no tutorials longer than that.','Switch roles or teams halfway through and invent a silly team name.'],icebreaker:'What game brings out your most competitive side?'},
              movie:{title:'The two-screen cinema',description:'Press play at the same time and make a tiny cinema out of your evenings.',steps:['Each suggest one film; choose the one neither of you has seen.','Start a video call or chat and count down before pressing play.','Afterwards, share one scene you would keep and one you would change.'],icebreaker:'Which fictional world would you happily spend a weekend in?'},
              music:{title:'A playlist for two',description:'Trade songs and build a soundtrack for a story that has not happened yet.',steps:['Bring three songs: one current favourite, one old favourite and one surprise.','Take turns playing a track and telling the story behind it.','Build a shared five-song playlist to keep after the date.'],icebreaker:'Which song instantly takes you back to a particular moment?'},
              cook:{title:'Same recipe, two kitchens',description:'Make the same easy dish in your own kitchens and compare the results.',steps:['Choose a simple recipe with ingredients you both have.','Set a 30-minute timer and cook together on a call.','Plate up, show off the results and vote on the most creative twist.'],icebreaker:'What is the dish that feels most like home to you?'},
              creative:{title:'The tiny creative challenge',description:'Make something together without worrying about being good at it.',steps:['Choose a prompt: draw your dream café, invent a fictional city or design a movie poster.','Set a 12-minute timer and create separately.','Reveal your creations and make up the backstory together.'],icebreaker:'If we opened a tiny place together, what would it be called?'},
              quiz:{title:'Curiosity, in three rounds',description:'A playful question night that gets beyond the standard small talk.',steps:['Each bring five questions: two light, two unexpected and one thoughtful.','Take turns answering; each person gets one curious follow-up.','Finish by choosing one thing you would like to try together offline.'],icebreaker:'What is a very specific thing you could talk about for 20 minutes?'}
            };
            setDatePlan(plans[dateType]);
          }}>Build our virtual date ↗</button>
        </div>
        {datePlan&&<article className="date-result"><span className="section-kicker">YOUR DATE PLAN · {dateMood.toUpperCase()}</span><h3>{datePlan.title}</h3><p>{datePlan.description}</p><ol>{datePlan.steps.map((step,i)=><li key={i}>{step}</li>)}</ol><div className="date-icebreaker"><span className="section-kicker">A QUESTION TO KICK THINGS OFF</span><p>“{datePlan.icebreaker}”</p></div><button className="chemistry-link" onClick={()=>{navigator.clipboard?.writeText(`${datePlan.title}\n${datePlan.description}\n${datePlan.steps.join('\n')}\nOpening question: ${datePlan.icebreaker}`);flash('Date plan copied.');}}>Copy date plan ↗</button></article>}
      </div>}

      {view==='profile' && <div className="profile-edit-card"><div className="profile-edit-head"><div><span className="section-kicker">YOUR PROFILE</span><h2>Make it feel like you.</h2><p>Small details can make a first conversation easier.</p></div><button className="text-button" onClick={()=>setView('discover')}>Close ×</button></div><form onSubmit={saveProfile} className="form-stack">
        <div className="field-row"><label>Your name<input value={form.display_name} onChange={e=>setForm({...form,display_name:e.target.value})} required /></label><label>Age<input type="number" min="18" max="99" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} required /></label></div>
        <div className="field-row"><label>City<input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} required /></label><label>Work or passion<input value={form.role} onChange={e=>setForm({...form,role:e.target.value})} /></label></div>
        <label>A little about you<textarea rows={3} value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} required /></label>
        <label>Interests <span className="field-hint">Separate with commas</span><input value={form.interests} onChange={e=>setForm({...form,interests:e.target.value})} /></label>
        <label>Values <span className="field-hint">Separate with commas</span><input value={form.values} onChange={e=>setForm({...form,values:e.target.value})} /></label>
        <label>What are you looking for?<textarea rows={2} value={form.looking_for} onChange={e=>setForm({...form,looking_for:e.target.value})} /></label>
        <label>How do you connect?<textarea rows={2} value={form.communication_style} onChange={e=>setForm({...form,communication_style:e.target.value})} /></label>
        {notice&&<p className="notice">{notice}</p>}<div className="profile-actions"><button className="primary-button" disabled={busy}>{busy?'Saving…':'Save changes ↗'}</button><button type="button" className="text-button" onClick={logout}>Log out</button></div>
      </form></div>}
    </section>

    {chemistryPeer && <div className="modal-backdrop" onClick={()=>{setChemistryPeer(null);setChemistry(null);}}><section className="chemistry-modal" onClick={e=>e.stopPropagation()}>
      <button className="modal-close" onClick={()=>{setChemistryPeer(null);setChemistry(null);}}>×</button>
      <div className="eyebrow"><span className="eyebrow-dot"/> PAIRWISE CHEMISTRY</div>
      {chemistryBusy ? <div className="modal-loading"><span className="spinner dark"/> Looking for the interesting bits…</div> : chemistry ? <><h2>{chemistry.headline}</h2><div className="chemistry-points"><div><span>01 · THE SPARK</span><p>{chemistry.spark}</p></div><div><span>02 · THE OVERLAP</span><p>{chemistry.overlap}</p></div><div><span>03 · A DIFFERENCE TO EXPLORE</span><p>{chemistry.difference}</p></div></div><div className="modal-opener"><span className="section-kicker">SKIP THE USUAL “HEY”</span><p>“{chemistry.opener}”</p><button className="chemistry-link" onClick={()=>navigator.clipboard?.writeText(chemistry.opener)}>Copy opening line ↗</button></div><div className="modal-date"><span className="section-kicker">A FIRST DATE IDEA</span><p>{chemistry.date}</p></div><p className="disclaimer">A conversation starter, not a compatibility verdict. Based only on details both people chose to share.</p></> : <p>Preparing your Pairwise note…</p>}
    </section></div>}

    {toast&&<div className="toast">{toast}</div>}
    <footer className="app-footer"><span>pairwise © 2026</span><span>{demo?'Your demo activity is local to this browser.':'Your profile and interactions are stored securely with Supabase.'}</span><button onClick={logout}>{demo?'Exit demo':'Log out'}</button></footer>
  </main>;
}

function genericChemistry(a: Profile, b: Profile): Chemistry {
  const commonInterests = (a.interests||[]).filter(x=>(b.interests||[]).some(y=>y.toLowerCase()===x.toLowerCase()));
  const commonValues = (a.core_values||[]).filter(x=>(b.core_values||[]).some(y=>y.toLowerCase()===x.toLowerCase()));
  return {
    headline:`A conversation worth starting with ${b.display_name}.`,
    spark:`${a.display_name} and ${b.display_name} both bring their own perspective. ${commonInterests.length ? `Your shared interest in ${commonInterests.slice(0,2).join(' and ')} offers a natural first thread.` : 'There are different interests here, which may leave room to learn something new from each other.'}`,
    overlap:`${commonInterests.length ? `You both mention ${commonInterests.join(', ')}.` : 'Your interests are not identical, but a connection does not need identical hobbies.'} ${commonValues.length ? `You also both value ${commonValues.join(' and ')}.` : 'Your profiles do not show an obvious shared value yet, so that could be a useful topic to explore.'}`,
    difference:`Your profiles have different experiences and preferences. Ask about them with curiosity rather than assuming they will be a source of tension.`,
    opener:`I noticed you're into ${b.interests?.[0] || 'trying new things'}. What got you interested in that?`,
    date:`Choose a relaxed place connected to ${commonInterests[0] || b.interests?.[0] || 'a shared curiosity'}—somewhere you can talk without rushing.`
  };
}

function Avatar({profile,size='normal'}:{profile:Profile;size?:'normal'|'large'}) {
  const seed = encodeURIComponent(`${profile.display_name}-${profile.id}`);
  return <div className={`pair-avatar ${size==='large'?'pair-avatar-large':''}`} title={profile.display_name}>
    <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=e8d4cc,dce2d6,e3dce8,d9e0e1,e9dfc9`} alt={`${profile.display_name}'s illustrated avatar`} />
  </div>;
}
