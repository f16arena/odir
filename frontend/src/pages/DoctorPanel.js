import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useTheme, colors } from '../ThemeContext';
import { getPatients, createPatient, predict, getRecentDiagnoses, updateComment, fileUrl } from '../api';

export default function DoctorPanel() {
  const { tr } = useTheme();
  const MENU = [
    { path:'/doctor',          icon:'🏠', label:tr.home     },
    { path:'/doctor/patients', icon:'👥', label:tr.patients  },
    { path:'/doctor/diagnose', icon:'🔬', label:tr.diagnose  },
    { path:'/doctor/history',  icon:'📋', label:tr.history   },
  ];
  return (
    <Layout menuItems={MENU}>
      <Routes>
        <Route path="/"         element={<DoctorHome />} />
        <Route path="/patients" element={<Patients />}   />
        <Route path="/diagnose" element={<Diagnose />}   />
        <Route path="/history"  element={<History />}    />
      </Routes>
    </Layout>
  );
}

function DoctorHome() {
  const { tr, dark } = useTheme();
  const c = colors(dark);
  const [recent, setRecent] = useState([]);
  const name = localStorage.getItem('full_name');
  useEffect(() => { getRecentDiagnoses(5).then(r=>setRecent(r.data)).catch(()=>{}); },[]);
  return (
    <div>
      <h2 style={{margin:'0 0 6px',fontSize:'22px',fontWeight:'700',color:c.text}}>{tr.home} — {name}</h2>
      <p style={{color:c.textMuted,marginBottom:'24px'}}>{tr.appSubtitle}</p>
      <h3 style={{fontSize:'15px',fontWeight:'600',color:c.text,marginBottom:'12px'}}>Последние диагнозы</h3>
      {recent.length===0
        ? <Empty c={c} text={tr.noData}/>
        : recent.map(d=><DiagCard key={d.id} d={d} c={c} />)
      }
    </div>
  );
}

function Patients() {
  const { tr, dark } = useTheme();
  const c = colors(dark);
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({full_name:'',birth_date:'',gender:'Female',notes:''});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ getPatients().then(r=>setPatients(r.data)).catch(()=>{}); },[]);

  const handleCreate = async(e)=>{
    e.preventDefault(); setLoading(true);
    try { const res=await createPatient(form); setPatients([res.data,...patients]); setShowForm(false); setForm({full_name:'',birth_date:'',gender:'Female',notes:''}); }
    catch{}
    setLoading(false);
  };

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
        <h2 style={{margin:0,fontSize:'22px',fontWeight:'700',color:c.text}}>{tr.patients}</h2>
        <Btn onClick={()=>setShowForm(!showForm)} c={c}>+ {tr.addPatient}</Btn>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{background:c.bgCard,borderRadius:'14px',padding:'20px',marginBottom:'20px',boxShadow:c.shadow,border:`1px solid ${c.border}`}}>
          <h3 style={{margin:'0 0 14px',color:c.text}}>{tr.newPatient}</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
            {[{l:tr.patientName,k:'full_name',t:'text',p:'Иванова Мария'},{l:tr.birthDate,k:'birth_date',t:'date',p:''},{l:tr.notes,k:'notes',t:'text',p:''}].map(f=>(
              <div key={f.k} style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                <label style={{fontSize:'12px',fontWeight:'600',color:c.textMuted}}>{f.l}</label>
                <input type={f.t} placeholder={f.p} value={form[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})}
                  style={{padding:'9px 12px',borderRadius:'8px',border:`1.5px solid ${c.inputBorder}`,background:c.inputBg,color:c.text,fontSize:'14px',outline:'none'}} />
              </div>
            ))}
            <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
              <label style={{fontSize:'12px',fontWeight:'600',color:c.textMuted}}>{tr.gender}</label>
              <select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}
                style={{padding:'9px 12px',borderRadius:'8px',border:`1.5px solid ${c.inputBorder}`,background:c.inputBg,color:c.text,fontSize:'14px',outline:'none'}}>
                <option value="Female">{tr.female}</option>
                <option value="Male">{tr.male}</option>
              </select>
            </div>
          </div>
          <div style={{display:'flex',gap:'10px'}}>
            <Btn type="submit" c={c} disabled={loading}>{loading?tr.loading:tr.save}</Btn>
            <BtnSec onClick={()=>setShowForm(false)} c={c}>{tr.cancel}</BtnSec>
          </div>
        </form>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {patients.map(p=>(
          <div key={p.id} onClick={()=>navigate(`/doctor/diagnose?pid=${p.id}`)}
            style={{display:'flex',alignItems:'center',gap:'14px',background:c.bgCard,padding:'14px 16px',borderRadius:'12px',cursor:'pointer',boxShadow:c.shadow,border:`1px solid ${c.border}`,transition:'transform 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
            onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
            <div style={{width:'42px',height:'42px',borderRadius:'50%',background:c.accent,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'16px',flexShrink:0}}>
              {p.full_name[0]}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:'600',fontSize:'14px',color:c.text}}>{p.full_name}</div>
              <div style={{fontSize:'12px',color:c.textMuted,marginTop:'2px'}}>{p.gender==='Female'?tr.female:tr.male}{p.birth_date?` • ${p.birth_date}`:''}</div>
            </div>
            <div style={{color:c.textMuted,fontSize:'18px'}}>→</div>
          </div>
        ))}
        {patients.length===0 && <Empty c={c} text={tr.noPatients}/>}
      </div>
    </div>
  );
}

function Diagnose() {
  const { tr, dark } = useTheme();
  const c = colors(dark);
  const [patients,setPatients]=useState([]);
  const [selId,setSelId]=useState('');
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState(null);
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [comment,setComment]=useState('');

  useEffect(()=>{
    getPatients().then(r=>setPatients(r.data)).catch(()=>{});
    const pid=new URLSearchParams(window.location.search).get('pid');
    if(pid) setSelId(pid);
  },[]);

  const handleFile=(e)=>{const f=e.target.files[0];if(!f)return;setFile(f);setPreview(URL.createObjectURL(f));setResult(null);};

  const handlePredict=async()=>{
    if(!file||!selId)return; setLoading(true);
    try{const res=await predict(selId,file);setResult(res.data);}
    catch(err){alert('Ошибка: '+(err.response?.data?.detail||err.message));}
    setLoading(false);
  };

  const classNames = tr.classNames || {N:'Норма',D:'Диаб. ретинопатия',G:'Глаукома',C:'Катаракта',A:'AMD',H:'Гипертония',M:'Миопия'};

  return (
    <div>
      <h2 style={{margin:'0 0 20px',fontSize:'22px',fontWeight:'700',color:c.text}}>{tr.diagnose}</h2>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>

        <div style={{background:c.bgCard,borderRadius:'14px',padding:'20px',boxShadow:c.shadow,border:`1px solid ${c.border}`}}>
          <h3 style={{margin:'0 0 12px',fontSize:'15px',fontWeight:'600',color:c.text}}>1. {tr.selectPatient}</h3>
          <select value={selId} onChange={e=>setSelId(e.target.value)}
            style={{width:'100%',padding:'9px 12px',borderRadius:'8px',border:`1.5px solid ${c.inputBorder}`,background:c.inputBg,color:c.text,fontSize:'14px',outline:'none',marginBottom:'20px',boxSizing:'border-box'}}>
            <option value="">— {tr.selectPatient} —</option>
            {patients.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>

          <h3 style={{margin:'0 0 12px',fontSize:'15px',fontWeight:'600',color:c.text}}>2. {tr.uploadImage}</h3>
          <label style={{display:'flex',alignItems:'center',justifyContent:'center',border:`2px dashed ${c.border}`,borderRadius:'12px',cursor:'pointer',overflow:'hidden',minHeight:'160px'}}>
            <input type="file" accept="image/*" onChange={handleFile} style={{display:'none'}}/>
            {preview
              ? <img src={preview} alt="снимок" style={{width:'100%',maxHeight:'220px',objectFit:'contain'}}/>
              : <div style={{textAlign:'center',color:c.textMuted,padding:'20px'}}>
                  <div style={{fontSize:'40px',marginBottom:'8px'}}>📷</div>
                  <div style={{fontSize:'14px'}}>{tr.clickToUpload}</div>
                  <div style={{fontSize:'12px',marginTop:'4px'}}>JPG, PNG</div>
                </div>
            }
          </label>

          <button onClick={handlePredict} disabled={!file||!selId||loading}
            style={{width:'100%',marginTop:'16px',padding:'12px',background:c.accent,color:'#fff',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'600',cursor:'pointer',opacity:(!file||!selId)?0.5:1}}>
            {loading ? tr.analyzing : `🔬 ${tr.runDiagnosis}`}
          </button>
        </div>

        <div style={{background:c.bgCard,borderRadius:'14px',padding:'20px',boxShadow:c.shadow,border:`1px solid ${c.border}`}}>
          <h3 style={{margin:'0 0 16px',fontSize:'15px',fontWeight:'600',color:c.text}}>{tr.result}</h3>
          {!result&&!loading && <Empty c={c} text={tr.uploadFirst}/>}
          {loading && <Empty c={c} text={tr.analyzing}/>}
          {result && (
            <div>
              <div style={{marginBottom:'16px'}}>
                <div style={{fontSize:'12px',fontWeight:'600',color:c.textMuted,marginBottom:'8px'}}>{tr.detected}:</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                  {result.detected_classes.filter(cls=>cls!=='O').length>0
                    ? result.detected_classes.filter(cls=>cls!=='O').map(cls=>(
                        <span key={cls} style={{padding:'5px 14px',border:`1px solid ${c.error}`,color:c.error,borderRadius:'8px',fontSize:'13px',fontWeight:'600'}}>
                          {classNames[cls]||cls}
                        </span>
                      ))
                    : <span style={{padding:'5px 14px',border:`1px solid ${c.success}`,color:c.success,borderRadius:'8px',fontSize:'13px',fontWeight:'600'}}>✓ {classNames['N']}</span>
                  }
                </div>
              </div>

              {result.gradcam_path && (
                <div style={{marginBottom:'16px'}}>
                  <div style={{fontSize:'12px',fontWeight:'600',color:c.textMuted,marginBottom:'8px'}}>{tr.gradcamTitle}:</div>
                  <img src={fileUrl(result.gradcam_path)} alt="gradcam" style={{width:'100%',borderRadius:'10px'}}/>
                </div>
              )}

              <div style={{fontSize:'12px',fontWeight:'600',color:c.textMuted,marginBottom:'8px'}}>{tr.probabilities}:</div>
              {Object.entries(result.probabilities)
                .filter(([cls])=>cls!=='O')
                .sort((a,b)=>b[1]-a[1])
                .map(([cls,prob])=>(
                  <div key={cls} style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                    <span style={{fontSize:'12px',color:c.textMuted,width:'130px',flexShrink:0}}>{classNames[cls]||cls}</span>
                    <div style={{flex:1,height:'8px',background:c.border,borderRadius:'4px',overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${prob*100}%`,background:prob>0.5?c.error:c.accent,borderRadius:'4px',transition:'width 0.5s'}}/>
                    </div>
                    <span style={{fontSize:'12px',color:c.text,width:'42px',textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{(prob*100).toFixed(1)}%</span>
                  </div>
                ))
              }

              <div style={{marginTop:'16px'}}>
                <div style={{fontSize:'12px',fontWeight:'600',color:c.textMuted,marginBottom:'6px'}}>{tr.doctorComment}:</div>
                <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder={`${tr.doctorComment}...`}
                  style={{width:'100%',padding:'9px 12px',borderRadius:'8px',border:`1.5px solid ${c.inputBorder}`,background:c.inputBg,color:c.text,fontSize:'14px',outline:'none',minHeight:'70px',resize:'vertical',boxSizing:'border-box'}}/>
                <BtnSec onClick={async()=>{await updateComment(result.id,comment);alert(tr.commentSaved);}} c={c}>{tr.saveComment}</BtnSec>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function History() {
  const { tr, dark } = useTheme();
  const c = colors(dark);
  const [diagnoses,setDiagnoses]=useState([]);
  useEffect(()=>{getRecentDiagnoses(50).then(r=>setDiagnoses(r.data)).catch(()=>{});}, []);
  return (
    <div>
      <h2 style={{margin:'0 0 20px',fontSize:'22px',fontWeight:'700',color:c.text}}>{tr.history}</h2>
      {diagnoses.length===0 ? <Empty c={c} text={tr.noData}/> : diagnoses.map(d=><DiagCard key={d.id} d={d} c={c} expanded/>)}
    </div>
  );
}

function DiagCard({d,c,expanded}) {
  const { tr } = useTheme();
  const classNames = tr.classNames || {N:'Норма',D:'Диаб. ретинопатия',G:'Глаукома',C:'Катаракта',A:'AMD',H:'Гипертония',M:'Миопия'};
  const [open,setOpen]=useState(false);
  const detected = (d.detected_classes||[]).filter(cls=>cls!=='O');
  return (
    <div onClick={()=>setOpen(!open)} style={{background:c.bgCard,borderRadius:'12px',padding:'14px 16px',marginBottom:'8px',cursor:'pointer',boxShadow:c.shadow,border:`1px solid ${c.border}`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontWeight:'600',fontSize:'14px',color:c.text}}>{d.patient_name}</div>
          <div style={{fontSize:'12px',color:c.textMuted,marginTop:'2px'}}>{new Date(d.created_at).toLocaleString('ru')}</div>
        </div>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
          {detected.length>0
            ? detected.map(cls=><span key={cls} style={{padding:'3px 10px',border:`1px solid ${c.error}`,color:c.error,borderRadius:'7px',fontSize:'12px',fontWeight:'600'}}>{classNames[cls]||cls}</span>)
            : <span style={{padding:'3px 10px',border:`1px solid ${c.success}`,color:c.success,borderRadius:'7px',fontSize:'12px',fontWeight:'600'}}>✓ {classNames['N']}</span>
          }
        </div>
      </div>
      {open && d.gradcam_path && (
        <img src={fileUrl(d.gradcam_path)} alt="gradcam" style={{width:'100%',borderRadius:'8px',marginTop:'12px'}} onClick={e=>e.stopPropagation()}/>
      )}
    </div>
  );
}

function Empty({c,text}){return <div style={{textAlign:'center',color:c.textMuted,padding:'40px',background:c.bgCard,borderRadius:'12px',border:`1px solid ${c.border}`}}>{text}</div>;}
function Btn({children,onClick,disabled,type,c}){return <button type={type||'button'} onClick={onClick} disabled={disabled} style={{padding:'10px 20px',background:c?c.accent:'#1a237e',color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer',fontSize:'14px',fontWeight:'600',opacity:disabled?0.6:1}}>{children}</button>;}
function BtnSec({children,onClick,c}){return <button onClick={onClick} style={{padding:'8px 16px',background:c.bg,color:c.text,border:`1px solid ${c.border}`,borderRadius:'8px',cursor:'pointer',fontSize:'13px',marginTop:'8px'}}>{children}</button>;}
