// ─── BENTO LAYOUT VARIANT (Я.Go-inspired, переведено в кремовую палитру) ────
// Идея: разноразмерные тайлы на тёплом сером фоне, белые карточки без бордеров,
// крупные «иллюстративные» обложки, чёрный CTA, парный хедер.

const { useState: useStateB, useMemo: useMemoB, useEffect: useEffectB } = React;

// ─── Палитра для бенто-режима ────────────────────────────────────────────
const BENTO = {
  bg: '#ECE7DF',           // чуть холоднее основного фона
  tile: '#FFFFFF',          // белые тайлы
  ink: '#1C1917',           // чёрный CTA
  inkSub: '#78716C',
  // Тёплые subtle-фоны для обложек
  cover: {
    peach: '#F2D9BD',
    sage: '#D9E1D0',
    lilac: '#E0D5DA',
    sand: '#EBDFC9',
    sky: '#D1DCE1',
    coral: '#F0CFC0',
  },
  accent: '#C2692A',
};

// Декоративная «иллюстрация»: концентрические круги/диагональные полосы
// (вместо 3D-рендера) — играет роль большой playful-обложки
function CoverShape({type='circles', color='#C2692A', emoji}) {
  const styles = {
    position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit',
  };
  if (type === 'circles') {
    return (
      <div style={styles}>
        <div style={{position:'absolute',width:160,height:160,borderRadius:'50%',
          background:color+'40',right:-40,bottom:-40}}/>
        <div style={{position:'absolute',width:110,height:110,borderRadius:'50%',
          background:color+'60',right:-10,bottom:-10}}/>
        {emoji && <div style={{position:'absolute',right:14,bottom:10,fontSize:42,filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.08))'}}>{emoji}</div>}
      </div>
    );
  }
  if (type === 'stripes') {
    return (
      <div style={styles}>
        <div style={{position:'absolute',inset:0,
          background:`repeating-linear-gradient(135deg, ${color}30 0 14px, transparent 14px 32px)`}}/>
        {emoji && <div style={{position:'absolute',right:14,bottom:10,fontSize:42}}>{emoji}</div>}
      </div>
    );
  }
  if (type === 'arc') {
    return (
      <div style={styles}>
        <div style={{position:'absolute',width:220,height:220,borderRadius:'50%',
          border:`24px solid ${color}50`,right:-100,top:-60}}/>
        {emoji && <div style={{position:'absolute',right:18,bottom:12,fontSize:44}}>{emoji}</div>}
      </div>
    );
  }
  return null;
}

// Универсальный тайл
function BTile({children, span=1, rowSpan=1, bg=BENTO.tile, pad=14, onClick, style={}, className=''}) {
  return (
    <div onClick={onClick} className={className} style={{
      gridColumn: `span ${span}`,
      gridRow: `span ${rowSpan}`,
      background: bg,
      borderRadius: 20,
      padding: pad,
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>{children}</div>
  );
}

// Чёрный CTA-пилюль (паттерн «Работа в такси»)
function BlackCTA({children, accent=BENTO.accent, onClick, icon}) {
  return (
    <button onClick={onClick} style={{
      width:'100%', padding:'16px 18px', borderRadius:18,
      background: BENTO.ink, color:'white', border:'none',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      cursor:'pointer', fontSize:15, fontWeight:600,
      fontFamily:'DM Sans, sans-serif',
    }}>
      <span style={{display:'flex',alignItems:'center',gap:10}}>
        {icon && <span style={{
          width:28,height:28,borderRadius:'50%',
          background:accent, display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:14,color:'white'
        }}>{icon}</span>}
        {children}
      </span>
      <span style={{color:accent,fontSize:18,fontWeight:700}}>›</span>
    </button>
  );
}

// ─── BENTO NOW SCREEN ────────────────────────────────────────────────────
function BentoNowScreen({days, tweaks}) {
  const {MOOD_COLORS, MOOD_LABELS, ACTIVITIES, EVENTS, MoodRing} = window;
  const today = days[0];
  const [activeActs, setActiveActs] = useStateB([]);
  const [mood] = useStateB(today.mood);
  const [energy] = useStateB(today.energy);
  const hour = new Date().getHours();

  const streak = useMemoB(()=>{
    let s=0;
    for(let i=1;i<days.length;i++) if(days[i].status==='complete') s++; else break;
    return s;
  },[days]);

  const totalTracked = useMemoB(()=>today.activities.reduce((sum,e)=>{
    const [sh,sm]=e.start.split(':').map(Number);
    const [eh,em]=e.end.split(':').map(Number);
    return sum + (eh*60+em)-(sh*60+sm);
  },0),[today]);

  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  // Топ-4 активности для крупных тайлов + остальные снизу
  const FEATURED = ACTIVITIES.slice(0,4);
  const REST = ACTIVITIES.slice(4);

  return (
    <div className="scrollable" style={{padding:'0 16px 20px', background: BENTO.bg}}>
      {/* Header */}
      <div style={{padding:'14px 4px 0',display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:12}}>
        <div>
          <div style={{fontSize:12,color:BENTO.inkSub,marginBottom:2}}>{greeting}</div>
          <div style={{fontSize:22,fontWeight:600,fontFamily:'Fraunces,serif',fontStyle:'italic',color:BENTO.ink,lineHeight:1.1}}>
            {new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}
          </div>
        </div>
        <div style={{
          width:38,height:38,borderRadius:'50%',background:BENTO.tile,
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:14
        }}>🧑</div>
      </div>

      {/* Парный хедер: Серия + Состояние */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
        <BTile bg={BENTO.cover.coral} pad={12} style={{minHeight:72}}>
          <div style={{fontSize:11,color:BENTO.ink+'aa',fontWeight:500}}>🔥 Серия</div>
          <div style={{fontSize:22,fontWeight:700,color:BENTO.ink,fontFamily:'Fraunces,serif'}}>{streak} дней</div>
        </BTile>
        <BTile bg={BENTO.cover.sage} pad={12} style={{minHeight:72}}>
          <div style={{fontSize:11,color:BENTO.ink+'aa',fontWeight:500}}>Сегодня</div>
          <div style={{display:'flex',alignItems:'baseline',gap:6}}>
            <div style={{fontSize:22,fontWeight:700,color:BENTO.ink,fontFamily:'Fraunces,serif'}}>{mood}</div>
            <div style={{fontSize:11,color:BENTO.ink+'99'}}>/ {MOOD_LABELS[mood]}</div>
          </div>
        </BTile>
      </div>

      {/* Day Score Hero tile */}
      <BTile bg={BENTO.tile} pad={16} style={{marginBottom:8}}>
        <div style={{display:'flex',gap:14,alignItems:'center'}}>
          <div style={{position:'relative',width:64,height:64,flexShrink:0}}>
            <MoodRing mood={mood} size={64}/>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontSize:18,fontWeight:700,color:MOOD_COLORS[mood]}}>{mood}</span>
            </div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,color:BENTO.inkSub,marginBottom:4}}>Состояние сейчас</div>
            <div style={{display:'flex',gap:14}}>
              <div>
                <div style={{fontSize:10,color:BENTO.inkSub}}>Энергия</div>
                <div style={{fontSize:16,fontWeight:600,color:BENTO.ink}}>{energy}/10</div>
              </div>
              <div>
                <div style={{fontSize:10,color:BENTO.inkSub}}>Отслежено</div>
                <div style={{fontSize:16,fontWeight:600,color:BENTO.ink}}>{Math.floor(totalTracked/60)}ч {totalTracked%60}м</div>
              </div>
            </div>
          </div>
        </div>
      </BTile>

      {/* Крупные тайлы активностей (как тайлы Яндекс Go) */}
      <div style={{fontSize:13,fontWeight:600,color:BENTO.ink,marginTop:14,marginBottom:8,padding:'0 4px'}}>
        Чем занят
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
        {FEATURED.map((act,i)=>{
          const isActive = activeActs.includes(act.id);
          const shapes = ['circles','stripes','arc','circles'];
          return (
            <BTile key={act.id}
              bg={isActive ? act.color+'25' : BENTO.tile}
              pad={14}
              style={{minHeight:108}}
              onClick={()=>setActiveActs(prev=>prev.includes(act.id)?prev.filter(x=>x!==act.id):[...prev,act.id])}>
              <CoverShape type={shapes[i]} color={act.color} emoji={act.emoji}/>
              <div style={{position:'relative',zIndex:2}}>
                <div style={{fontSize:14,fontWeight:600,color:BENTO.ink}}>{act.label}</div>
                <div style={{fontSize:11,color:BENTO.inkSub,marginTop:2}}>
                  {isActive ? '● активно' : 'Отметить'}
                </div>
              </div>
            </BTile>
          );
        })}
      </div>

      {/* Сетка остальных активностей (мельче, без обложек) */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:14}}>
        {REST.map(act=>{
          const isActive = activeActs.includes(act.id);
          return (
            <BTile key={act.id}
              bg={isActive ? act.color+'22' : BENTO.tile}
              pad={10}
              style={{minHeight:72,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4}}
              onClick={()=>setActiveActs(prev=>prev.includes(act.id)?prev.filter(x=>x!==act.id):[...prev,act.id])}>
              <span style={{fontSize:22}}>{act.emoji}</span>
              <span style={{fontSize:9,color:BENTO.inkSub,textAlign:'center',lineHeight:1.1}}>{act.label}</span>
            </BTile>
          );
        })}
      </div>

      {/* Чёрный CTA — главное действие */}
      {hour >= 17 ? (
        <BlackCTA icon="🌙" accent={BENTO.accent}>Вечерний ритуал</BlackCTA>
      ) : (
        <BlackCTA icon="+" accent={BENTO.accent}>Снимок состояния</BlackCTA>
      )}

      {/* События дня — как маленькие чипы */}
      {today.events.length > 0 && (
        <div style={{marginTop:14}}>
          <div style={{fontSize:11,color:BENTO.inkSub,marginBottom:8,padding:'0 4px',textTransform:'uppercase',letterSpacing:'0.04em'}}>События</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {today.events.map(ev=>{
              const e = EVENTS.find(x=>x.id===ev.id);
              return e ? (
                <div key={ev.id} style={{
                  padding:'8px 12px',borderRadius:100,
                  background:BENTO.tile,
                  fontSize:13,fontWeight:500,color:BENTO.ink,
                  display:'inline-flex',alignItems:'center',gap:6
                }}>{e.emoji} {e.label}</div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BENTO FEED SCREEN ───────────────────────────────────────────────────
function BentoFeedScreen({days}) {
  const {MOOD_COLORS, ACTIVITIES} = window;
  const weekDays = useMemoB(()=>{
    const today = new Date();
    const dow = today.getDay()===0 ? 6 : today.getDay()-1;
    const mon = new Date(today); mon.setDate(today.getDate()-dow);
    return Array.from({length:7},(_,i)=>{
      const d = new Date(mon); d.setDate(mon.getDate()+i);
      const ds = d.toISOString().split('T')[0];
      return {
        date:ds, dayNum:d.getDate(),
        dayName:['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][i],
        isToday: ds===new Date().toISOString().split('T')[0],
        log: days.find(dl=>dl.date===ds)
      };
    });
  },[days]);

  const summary = useMemoB(()=>{
    const logs = weekDays.filter(w=>w.log).map(w=>w.log);
    if(!logs.length) return null;
    return {
      avgMood: (logs.reduce((s,d)=>s+d.mood,0)/logs.length).toFixed(1),
      avgSleep: (logs.reduce((s,d)=>s+d.sleep.hours,0)/logs.length).toFixed(1),
      totalSteps: logs.reduce((s,d)=>s+d.steps,0),
      trainDays: logs.filter(d=>d.training).length,
      days: logs.length,
    };
  },[weekDays]);

  const moods = weekDays.map(w=>w.log?.mood ?? null);
  const maxBar = 10;

  return (
    <div className="scrollable" style={{padding:'0 16px 20px', background: BENTO.bg}}>
      {/* Header */}
      <div style={{padding:'14px 4px 12px'}}>
        <div style={{fontSize:12,color:BENTO.inkSub,marginBottom:2}}>Эта неделя</div>
        <div style={{fontSize:26,fontWeight:600,fontFamily:'Fraunces,serif',fontStyle:'italic',color:BENTO.ink,lineHeight:1.1}}>
          {summary?.avgMood ?? '—'} <span style={{fontSize:14,color:BENTO.inkSub,fontStyle:'normal',fontFamily:'DM Sans,sans-serif'}}>средний день</span>
        </div>
      </div>

      {/* Парный хедер */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
        <BTile bg={BENTO.cover.peach} pad={12} style={{minHeight:74}}>
          <div style={{fontSize:11,color:BENTO.ink+'aa'}}>Отмечено</div>
          <div style={{fontSize:22,fontWeight:700,color:BENTO.ink,fontFamily:'Fraunces,serif'}}>{summary?.days ?? 0}/7 <span style={{fontSize:12,fontFamily:'DM Sans,sans-serif',color:BENTO.ink+'99',fontWeight:400}}>дней</span></div>
        </BTile>
        <BTile bg={BENTO.cover.sky} pad={12} style={{minHeight:74}}>
          <div style={{fontSize:11,color:BENTO.ink+'aa'}}>Тренировок</div>
          <div style={{fontSize:22,fontWeight:700,color:BENTO.ink,fontFamily:'Fraunces,serif'}}>{summary?.trainDays ?? 0}<span style={{fontSize:14,color:BENTO.ink+'99',fontWeight:400}}> 🏋️</span></div>
        </BTile>
      </div>

      {/* HERO: график настроения за неделю */}
      <BTile bg={BENTO.tile} pad={16} style={{marginBottom:8}}>
        <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:14}}>
          <div>
            <div style={{fontSize:11,color:BENTO.inkSub,textTransform:'uppercase',letterSpacing:'0.05em'}}>Настроение</div>
            <div style={{fontSize:18,fontWeight:600,color:BENTO.ink,fontFamily:'Fraunces,serif',fontStyle:'italic'}}>День за днём</div>
          </div>
          <div style={{fontSize:11,color:BENTO.inkSub}}>0–10</div>
        </div>
        <div style={{display:'flex',alignItems:'flex-end',gap:6,height:120,paddingBottom:4}}>
          {moods.map((m,i)=>(
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6,height:'100%'}}>
              <div style={{flex:1,width:'100%',display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
                {m !== null ? (
                  <div style={{
                    width:'100%',height:`${(m/maxBar)*100}%`,
                    background: weekDays[i].isToday ? BENTO.ink : MOOD_COLORS[m],
                    borderRadius:8,minHeight:6,
                    position:'relative',
                  }}>
                    {weekDays[i].isToday && (
                      <div style={{position:'absolute',top:-22,left:'50%',transform:'translateX(-50%)',
                        fontSize:11,fontWeight:700,color:BENTO.ink}}>{m}</div>
                    )}
                  </div>
                ) : (
                  <div style={{width:'100%',height:8,background:'#0001',borderRadius:4}}/>
                )}
              </div>
              <div style={{fontSize:10,color:weekDays[i].isToday?BENTO.ink:BENTO.inkSub,fontWeight:weekDays[i].isToday?600:400}}>
                {weekDays[i].dayName}
              </div>
            </div>
          ))}
        </div>
      </BTile>

      {/* 2×2 grid статистики */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
        <BTile bg={BENTO.cover.lilac} pad={14} style={{minHeight:96}}>
          <CoverShape type="arc" color="#8b5cf6" emoji="😴"/>
          <div style={{position:'relative',zIndex:2}}>
            <div style={{fontSize:11,color:BENTO.ink+'aa'}}>Средний сон</div>
            <div style={{fontSize:22,fontWeight:700,color:BENTO.ink,fontFamily:'Fraunces,serif'}}>{summary?.avgSleep ?? 0}ч</div>
          </div>
        </BTile>
        <BTile bg={BENTO.cover.sage} pad={14} style={{minHeight:96}}>
          <CoverShape type="circles" color="#22c55e" emoji="🚶"/>
          <div style={{position:'relative',zIndex:2}}>
            <div style={{fontSize:11,color:BENTO.ink+'aa'}}>Шагов</div>
            <div style={{fontSize:18,fontWeight:700,color:BENTO.ink,fontFamily:'Fraunces,serif'}}>{summary ? (summary.totalSteps/1000).toFixed(1)+'к' : '0'}</div>
          </div>
        </BTile>
      </div>

      {/* Энергобаланс — широкий тайл */}
      <BTile bg={BENTO.tile} pad={16} style={{marginBottom:8}}>
        <div style={{fontSize:11,color:BENTO.inkSub,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Энергобаланс</div>
        <div style={{display:'flex',height:12,borderRadius:6,overflow:'hidden',marginBottom:8}}>
          <div style={{flex:62,background:'#10b981'}}/>
          <div style={{flex:38,background:'#f97316'}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:BENTO.inkSub}}>
          <span style={{color:'#059669',fontWeight:500}}>⚡ 8.5ч заряжающих</span>
          <span style={{color:'#ea580c',fontWeight:500}}>🔋 5.2ч истощающих</span>
        </div>
      </BTile>

      {/* Чёрный CTA */}
      <BlackCTA icon="→" accent={BENTO.accent}>Открыть отчёт недели</BlackCTA>
    </div>
  );
}

// ─── BENTO INSIGHTS SCREEN ───────────────────────────────────────────────
function BentoInsightsScreen() {
  const {MOCK_INSIGHTS} = window;
  const [filter, setFilter] = useStateB('all');
  const filtered = filter==='all' ? MOCK_INSIGHTS : MOCK_INSIGHTS.filter(i=>i.category===filter);
  const hero = filtered.find(i=>!i.locked) || filtered[0];
  const rest = filtered.filter(i=>i.id!==hero?.id);

  const LAYER_LABELS = {base:'База',patterns:'Паттерны',energy:'Энергия',lenses:'Линзы'};

  return (
    <div className="scrollable" style={{padding:'0 16px 20px', background: BENTO.bg}}>
      {/* Header */}
      <div style={{padding:'14px 4px 12px'}}>
        <div style={{fontSize:12,color:BENTO.inkSub,marginBottom:2}}>За месяц</div>
        <div style={{fontSize:26,fontWeight:600,fontFamily:'Fraunces,serif',fontStyle:'italic',color:BENTO.ink,lineHeight:1.1}}>
          Инсайты
        </div>
      </div>

      {/* Фильтры */}
      <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:8,marginBottom:8,
        scrollbarWidth:'none'}}>
        {[
          ['all','Все'],['sleep','Сон'],['body','Тело'],['psyche','Психика'],['productivity','Продукт.']
        ].map(([cat,lbl])=>(
          <button key={cat} onClick={()=>setFilter(cat)} style={{
            padding:'8px 14px',borderRadius:100,
            border:'none',
            background: filter===cat ? BENTO.ink : BENTO.tile,
            color: filter===cat ? 'white' : BENTO.ink,
            fontSize:13,fontWeight:500,cursor:'pointer',whiteSpace:'nowrap',
            flexShrink:0,
          }}>{lbl}</button>
        ))}
      </div>

      {/* HERO INSIGHT */}
      {hero && !hero.locked && (
        <BTile bg={BENTO.tile} pad={0} style={{marginBottom:8,overflow:'hidden'}}>
          {/* Обложка */}
          <div style={{height:140,background:hero.color+'18',position:'relative',overflow:'hidden'}}>
            <CoverShape type="circles" color={hero.color} emoji={hero.emoji}/>
            <div style={{position:'absolute',top:12,left:14,
              fontSize:10,padding:'4px 10px',borderRadius:100,
              background:BENTO.ink,color:'white',fontWeight:600,
              textTransform:'uppercase',letterSpacing:'0.04em'
            }}>{LAYER_LABELS[hero.layer]}</div>
            <div style={{position:'absolute',bottom:12,left:14,
              fontSize:10,color:BENTO.ink,opacity:0.6,fontWeight:500
            }}>{hero.obs} наблюдений · {Math.round(hero.strength*100)}%</div>
          </div>
          {/* Body */}
          <div style={{padding:16}}>
            <div style={{fontSize:17,fontWeight:600,color:BENTO.ink,lineHeight:1.3,marginBottom:6,fontFamily:'Fraunces,serif',fontStyle:'italic'}}>
              {hero.title}
            </div>
            <div style={{fontSize:13,color:BENTO.inkSub,marginBottom:12,lineHeight:1.5}}>
              {hero.desc}
            </div>
            <div style={{
              padding:'12px 14px',borderRadius:14,
              background:hero.color+'10',
              fontSize:13,color:BENTO.ink,lineHeight:1.5
            }}>
              💡 {hero.advice}
            </div>
          </div>
        </BTile>
      )}

      {/* Локед-баннер */}
      <BTile bg={BENTO.ink} pad={14} style={{marginBottom:8}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{
            width:42,height:42,borderRadius:'50%',background:BENTO.accent,
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0
          }}>🔒</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:'white'}}>3 инсайта ждут</div>
            <div style={{fontSize:11,color:'white',opacity:0.6,marginTop:1}}>Открой слои Паттерны и Линзы</div>
          </div>
          <span style={{color:BENTO.accent,fontSize:20,fontWeight:700}}>›</span>
        </div>
      </BTile>

      {/* Сетка остальных инсайтов 2-кол */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
        {rest.slice(0,4).map((ins,i)=>{
          const covers=['stripes','arc','circles','stripes'];
          return (
            <BTile key={ins.id} bg={BENTO.tile} pad={0} style={{minHeight:170,overflow:'hidden',display:'flex',flexDirection:'column'}}>
              <div style={{height:78,background:ins.color+'12',position:'relative',overflow:'hidden',borderRadius:'20px 20px 0 0'}}>
                <CoverShape type={covers[i%4]} color={ins.color} emoji={ins.emoji}/>
                {ins.locked && (
                  <div style={{position:'absolute',inset:0,background:'rgba(255,255,255,0.6)',backdropFilter:'blur(6px)',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🔒</div>
                )}
              </div>
              <div style={{padding:'12px 14px 14px',flex:1,display:'flex',flexDirection:'column',gap:6}}>
                <div style={{fontSize:13,fontWeight:600,color:BENTO.ink,lineHeight:1.25,filter:ins.locked?'blur(2px)':'none'}}>
                  {ins.title}
                </div>
                <div style={{marginTop:'auto',display:'flex',alignItems:'center',gap:6}}>
                  <div style={{fontSize:9,padding:'2px 6px',borderRadius:4,
                    background:ins.color+'18',color:ins.color,fontWeight:600}}>
                    {LAYER_LABELS[ins.layer]}
                  </div>
                  <span style={{fontSize:10,color:BENTO.inkSub,marginLeft:'auto'}}>{Math.round(ins.strength*100)}%</span>
                </div>
              </div>
            </BTile>
          );
        })}
      </div>

      {/* CTA */}
      <BlackCTA icon="✦" accent={BENTO.accent}>Открыть все слои</BlackCTA>
    </div>
  );
}

// ─── Экспорт ─────────────────────────────────────────────────────────────
Object.assign(window, {
  BentoNowScreen,
  BentoFeedScreen,
  BentoInsightsScreen,
  BENTO_PALETTE: BENTO,
});
