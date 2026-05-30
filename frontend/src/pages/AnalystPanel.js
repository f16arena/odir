import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { BarChart,Bar,LineChart,Line,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,Legend,ResponsiveContainer } from 'recharts';
import Layout from '../components/Layout';
import { useTheme, colors } from '../ThemeContext';
import { getSummary,getClassDistribution,getDiagnosesOverTime,getModelMetrics,getPatientsStats } from '../api';
import axios from 'axios';

const COLORS=['#1a237e','#c62828','#2e7d32','#f57f17','#6a1b9a','#00838f','#4e342e'];

const API = axios.create({ baseURL:`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api` });
API.interceptors.request.use(cfg=>{ const t=localStorage.getItem('token'); if(t) cfg.headers.Authorization=`Bearer ${t}`; return cfg; });

export default function AnalystPanel() {
  const { tr } = useTheme();
  const MENU = [
    { path:'/analyst',          icon:'📊', label:tr.dashboard    },
    { path:'/analyst/model',    icon:'🤖', label:tr.modelMetrics },
    { path:'/analyst/patients', icon:'👥', label:tr.patients     },
    { path:'/analyst/doctors',  icon:'👨‍⚕️', label:tr.doctors      },
  ];
  return (
    <Layout menuItems={MENU}>
      <Routes>
        <Route path="/"         element={<Dashboard />}    />
        <Route path="/model"    element={<ModelMetrics />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/doctors"  element={<DoctorsPage />}  />
      </Routes>
    </Layout>
  );
}

function StatCard({title,value}) {
  const { dark } = useTheme();
  const c = colors(dark);
  return (
    <div style={{background:c.bgCard,border:`1px solid ${c.border}`,borderRadius:'14px',padding:'20px'}}>
      <div style={{fontSize:'13px',color:c.textMuted,marginBottom:'12px'}}>{title}</div>
      <div style={{fontSize:'34px',fontWeight:'700',color:c.accent,fontVariantNumeric:'tabular-nums',letterSpacing:'-0.02em',lineHeight:1}}>{value??'—'}</div>
    </div>
  );
}

function Dashboard() {
  const { tr, dark } = useTheme();
  const c = colors(dark);
  const [summary,setSummary]=useState(null);
  const [overtime,setOvertime]=useState([]);
  const [classDist,setClassDist]=useState([]);

  useEffect(()=>{
    getSummary().then(r=>setSummary(r.data)).catch(()=>{});
    getDiagnosesOverTime(30).then(r=>setOvertime(r.data)).catch(()=>{});
    getClassDistribution().then(r=>setClassDist(r.data)).catch(()=>{});
  },[]);

  return (
    <div>
      <h2 style={{margin:'0 0 20px',fontSize:'22px',fontWeight:'700',color:c.text}}>{tr.dashboard}</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'14px',marginBottom:'20px'}}>
        <StatCard title={tr.totalDiagnoses}  value={summary?.total_diagnoses} icon="🔬" gradient="linear-gradient(135deg,#1a237e,#3949ab)"/>
        <StatCard title={tr.totalPatients}   value={summary?.total_patients}  icon="👥" gradient="linear-gradient(135deg,#1b5e20,#2e7d32)"/>
        <StatCard title={tr.totalUsers}      value={summary?.total_users}     icon="👤" gradient="linear-gradient(135deg,#4a148c,#6a1b9a)"/>
        <StatCard title={tr.diagnosesWeek}   value={summary?.diagnoses_week}  icon="📅" gradient="linear-gradient(135deg,#b71c1c,#c62828)"/>
      </div>

      <div style={{background:c.bgCard,borderRadius:'14px',padding:'20px',marginBottom:'16px',boxShadow:c.shadow,border:`1px solid ${c.border}`}}>
        <h3 style={{margin:'0 0 16px',fontSize:'15px',fontWeight:'600',color:c.text}}>{tr.diagnosesMonth}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={overtime}>
            <CartesianGrid strokeDasharray="3 3" stroke={dark?'#2a2a4a':'#f0f0f0'}/>
            <XAxis dataKey="date" tick={{fontSize:11,fill:c.textMuted}} tickFormatter={d=>d.slice(5)}/>
            <YAxis tick={{fontSize:11,fill:c.textMuted}}/>
            <Tooltip contentStyle={{background:c.bgCard,border:`1px solid ${c.border}`,color:c.text}}/>
            <Line type="monotone" dataKey="count" stroke={c.accent} strokeWidth={2} dot={false} name={tr.diagnosesShort}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'16px'}}>
        <div style={{background:c.bgCard,borderRadius:'14px',padding:'20px',boxShadow:c.shadow,border:`1px solid ${c.border}`}}>
          <h3 style={{margin:'0 0 16px',fontSize:'15px',fontWeight:'600',color:c.text}}>{tr.distribution}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={classDist} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                {classDist.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{background:c.bgCard,border:`1px solid ${c.border}`,color:c.text}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:c.bgCard,borderRadius:'14px',padding:'20px',boxShadow:c.shadow,border:`1px solid ${c.border}`}}>
          <h3 style={{margin:'0 0 16px',fontSize:'15px',fontWeight:'600',color:c.text}}>{tr.byClasses}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={classDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={dark?'#2a2a4a':'#f0f0f0'}/>
              <XAxis type="number" tick={{fontSize:11,fill:c.textMuted}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:11,fill:c.textMuted}} width={95}/>
              <Tooltip contentStyle={{background:c.bgCard,border:`1px solid ${c.border}`,color:c.text}}/>
              <Bar dataKey="count" name={tr.countLabel}>{classDist.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function PatientsPage() {
  const { tr, dark } = useTheme();
  const c = colors(dark);
  const [stats,setStats]=useState(null);
  useEffect(()=>{getPatientsStats().then(r=>setStats(r.data)).catch(()=>{});},[]);
  if(!stats) return <div style={{color:c.textMuted,padding:'40px',textAlign:'center'}}>{tr.loading}</div>;
  const genderLabels={Female:tr.female,Male:tr.male};
  return (
    <div>
      <h2 style={{margin:'0 0 20px',fontSize:'22px',fontWeight:'700',color:c.text}}>{tr.patients}</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'16px'}}>

        <div style={{background:c.bgCard,borderRadius:'14px',padding:'20px',boxShadow:c.shadow,border:`1px solid ${c.border}`}}>
          <h3 style={{margin:'0 0 16px',fontSize:'15px',fontWeight:'600',color:c.text}}>{tr.byGender}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.gender.map(g=>({...g,name:genderLabels[g.name]||g.name}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                <Cell fill="#1a237e"/><Cell fill="#c62828"/>
              </Pie>
              <Tooltip contentStyle={{background:c.bgCard,border:`1px solid ${c.border}`,color:c.text}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:c.bgCard,borderRadius:'14px',padding:'20px',boxShadow:c.shadow,border:`1px solid ${c.border}`}}>
          <h3 style={{margin:'0 0 16px',fontSize:'15px',fontWeight:'600',color:c.text}}>{tr.byAge}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.age_groups}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark?'#2a2a4a':'#f0f0f0'}/>
              <XAxis dataKey="group" tick={{fontSize:12,fill:c.textMuted}}/>
              <YAxis tick={{fontSize:12,fill:c.textMuted}}/>
              <Tooltip contentStyle={{background:c.bgCard,border:`1px solid ${c.border}`,color:c.text}}/>
              <Bar dataKey="count" name={tr.patients} fill="#6a1b9a" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:c.bgCard,borderRadius:'14px',padding:'20px',boxShadow:c.shadow,border:`1px solid ${c.border}`,gridColumn:'1/-1'}}>
          <h3 style={{margin:'0 0 8px',fontSize:'15px',fontWeight:'600',color:c.text}}>{tr.totalPatients}: {stats.total}</h3>
          <div style={{display:'flex',gap:'16px',marginTop:'12px'}}>
            {stats.gender.map((g,i)=>(
              <div key={g.name} style={{flex:1,padding:'16px',borderRadius:'10px',border:`1px solid ${c.border}`,textAlign:'center'}}>
                <div style={{fontSize:'28px',fontWeight:'700',color:c.accent,fontVariantNumeric:'tabular-nums'}}>{g.value}</div>
                <div style={{fontSize:'13px',color:c.textMuted,marginTop:'4px'}}>{genderLabels[g.name]||g.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DoctorsPage() {
  const { tr, dark } = useTheme();
  const c = colors(dark);
  const [doctors,setDoctors]=useState([]);
  const [byDoctor,setByDoctor]=useState([]);
  useEffect(()=>{
    API.get('/analytics/doctors-stats').then(r=>setDoctors(r.data)).catch(()=>{});
    API.get('/analytics/diagnoses-by-doctor').then(r=>setByDoctor(r.data)).catch(()=>{});
  },[]);
  return (
    <div>
      <h2 style={{margin:'0 0 20px',fontSize:'22px',fontWeight:'700',color:c.text}}>{tr.doctorsStats}</h2>

      <div style={{background:c.bgCard,borderRadius:'14px',padding:'20px',marginBottom:'16px',boxShadow:c.shadow,border:`1px solid ${c.border}`}}>
        <h3 style={{margin:'0 0 16px',fontSize:'15px',fontWeight:'600',color:c.text}}>{tr.diagnosesByDoctor}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byDoctor}>
            <CartesianGrid strokeDasharray="3 3" stroke={dark?'#2a2a4a':'#f0f0f0'}/>
            <XAxis dataKey="name" tick={{fontSize:12,fill:c.textMuted}}/>
            <YAxis tick={{fontSize:12,fill:c.textMuted}}/>
            <Tooltip contentStyle={{background:c.bgCard,border:`1px solid ${c.border}`,color:c.text}}/>
            <Bar dataKey="count" name={tr.diagnosesShort} fill="#0d47a1" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{background:c.bgCard,borderRadius:'14px',padding:'20px',boxShadow:c.shadow,border:`1px solid ${c.border}`}}>
        <h3 style={{margin:'0 0 16px',fontSize:'15px',fontWeight:'600',color:c.text}}>{tr.doctorsList}</h3>
        <div style={{overflowX:'auto'}}><table style={{width:'100%',minWidth:'560px',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:c.bgHover}}>
              {[tr.roleDoctor,'Email',tr.patients,tr.diagnosesShort,tr.lastActive].map(h=>(
                <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:'12px',fontWeight:'600',color:c.textMuted,borderBottom:`2px solid ${c.border}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {doctors.map((d,i)=>(
              <tr key={d.id} style={{background:i%2===0?(dark?'#1a1a2e':'#fafafa'):'transparent'}}>
                <td style={{padding:'12px 14px',fontSize:'13px',color:c.text,fontWeight:'600'}}>{d.name}</td>
                <td style={{padding:'12px 14px',fontSize:'13px',color:c.textMuted}}>{d.email}</td>
                <td style={{padding:'12px 14px',fontSize:'13px',color:c.text,textAlign:'center'}}>{d.patient_count}</td>
                <td style={{padding:'12px 14px',fontSize:'13px',fontWeight:'600',color:c.accent,textAlign:'center',fontVariantNumeric:'tabular-nums'}}>{d.diagnosis_count}</td>
                <td style={{padding:'12px 14px',fontSize:'13px',color:c.textMuted}}>{d.last_active}</td>
              </tr>
            ))}
            {doctors.length===0&&<tr><td colSpan="5" style={{textAlign:'center',padding:'30px',color:c.textMuted}}>{tr.noData}</td></tr>}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}

function ModelMetrics() {
  const { tr, dark } = useTheme();
  const c = colors(dark);
  const [metrics,setMetrics]=useState(null);
  useEffect(()=>{getModelMetrics().then(r=>setMetrics(r.data)).catch(()=>{});},[]);
  if(!metrics) return <div style={{color:c.textMuted,padding:'40px',textAlign:'center'}}>{tr.loading}</div>;
  return (
    <div>
      <h2 style={{margin:'0 0 20px',fontSize:'22px',fontWeight:'700',color:c.text}}>{tr.modelMetrics} — {metrics.model_name}</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'14px',marginBottom:'20px'}}>
        <StatCard title={tr.aucMacro}   value={metrics.auc_macro}       icon="📈" gradient="linear-gradient(135deg,#1a237e,#3949ab)"/>
        <StatCard title={tr.f1Macro}    value={metrics.f1_macro}        icon="🎯" gradient="linear-gradient(135deg,#1b5e20,#2e7d32)"/>
        <StatCard title={tr.recallMacro} value={metrics.recall_macro}   icon="🔍" gradient="linear-gradient(135deg,#e65100,#f57c00)"/>
        <StatCard title={tr.precision}  value={metrics.precision_macro} icon="✅" gradient="linear-gradient(135deg,#4a148c,#6a1b9a)"/>
      </div>

      <div style={{background:c.bgCard,borderRadius:'14px',padding:'20px',marginBottom:'16px',boxShadow:c.shadow,border:`1px solid ${c.border}`}}>
        <h3 style={{margin:'0 0 16px',fontSize:'15px',fontWeight:'600',color:c.text}}>{tr.aucByClass}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={metrics.per_class}>
            <CartesianGrid strokeDasharray="3 3" stroke={dark?'#2a2a4a':'#f0f0f0'}/>
            <XAxis dataKey="name" tick={{fontSize:11,fill:c.textMuted}}/>
            <YAxis domain={[0.5,1]} tick={{fontSize:11,fill:c.textMuted}}/>
            <Tooltip contentStyle={{background:c.bgCard,border:`1px solid ${c.border}`,color:c.text}}/>
            <Legend/>
            <Bar dataKey="auc" name="AUC-ROC" fill="#1a237e"/>
            <Bar dataKey="f1"  name="F1"      fill="#2e7d32"/>
            <Bar dataKey="precision" name="Precision" fill="#f57f17"/>
            <Bar dataKey="recall"    name="Recall"    fill="#c62828"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{background:c.bgCard,borderRadius:'14px',padding:'20px',boxShadow:c.shadow,border:`1px solid ${c.border}`}}>
        <h3 style={{margin:'0 0 16px',fontSize:'15px',fontWeight:'600',color:c.text}}>{tr.detailedMetrics}</h3>
        <div style={{overflowX:'auto'}}><table style={{width:'100%',minWidth:'560px',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:c.bgHover}}>
              {[tr.classLabel,'AUC-ROC','F1','Precision','Recall'].map(h=>(
                <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:'12px',fontWeight:'600',color:c.textMuted,borderBottom:`2px solid ${c.border}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.per_class.map((row,i)=>(
              <tr key={row.class} style={{background:i%2===0?(dark?'#1a1a2e':'#fafafa'):'transparent'}}>
                <td style={{padding:'10px 14px',fontSize:'13px',color:c.text,fontWeight:'600'}}>{row.name}</td>
                <td style={{padding:'10px 14px',fontSize:'13px',fontWeight:'600',fontVariantNumeric:'tabular-nums',color:row.auc>0.9?c.success:row.auc>0.8?c.warning:c.error}}>{row.auc}</td>
                <td style={{padding:'10px 14px',fontSize:'13px',color:c.text}}>{row.f1}</td>
                <td style={{padding:'10px 14px',fontSize:'13px',color:c.text}}>{row.precision}</td>
                <td style={{padding:'10px 14px',fontSize:'13px',color:c.text}}>{row.recall}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
