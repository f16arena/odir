import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import { useTheme, colors } from '../ThemeContext';
import { getUsers, toggleUser, deleteUser, register, getSummary } from '../api';

export default function AdminPanel() {
  const { tr } = useTheme();
  const MENU = [
    { path:'/admin',          icon:'🏠', label:tr.overview    },
    { path:'/admin/users',    icon:'👥', label:tr.users       },
    { path:'/admin/register', icon:'➕', label:tr.newAccount  },
  ];
  return (
    <Layout menuItems={MENU} sidebarColor="#b71c1c">
      <Routes>
        <Route path="/"         element={<AdminHome />}    />
        <Route path="/users"    element={<Users />}        />
        <Route path="/register" element={<RegisterUser />} />
      </Routes>
    </Layout>
  );
}

function StatCard({title,value,icon,gradient}) {
  return (
    <div style={{background:gradient,borderRadius:'14px',padding:'20px',color:'#fff',boxShadow:'0 4px 15px rgba(0,0,0,0.15)',textAlign:'center'}}>
      <div style={{fontSize:'36px',marginBottom:'8px'}}>{icon}</div>
      <div style={{fontSize:'30px',fontWeight:'700'}}>{value??'—'}</div>
      <div style={{fontSize:'13px',opacity:0.85,marginTop:'4px'}}>{title}</div>
    </div>
  );
}

function AdminHome() {
  const { tr, dark } = useTheme();
  const c = colors(dark);
  const [summary,setSummary]=useState(null);
  useEffect(()=>{getSummary().then(r=>setSummary(r.data)).catch(()=>{});},[]);
  return (
    <div>
      <h2 style={{margin:'0 0 20px',fontSize:'22px',fontWeight:'700',color:c.text}}>{tr.overview}</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginBottom:'24px'}}>
        <StatCard title={tr.totalDiagnoses} value={summary?.total_diagnoses} icon="🔬" gradient="linear-gradient(135deg,#1a237e,#3949ab)"/>
        <StatCard title={tr.totalPatients}  value={summary?.total_patients}  icon="👥" gradient="linear-gradient(135deg,#1b5e20,#2e7d32)"/>
        <StatCard title={tr.totalUsers}     value={summary?.total_users}     icon="👤" gradient="linear-gradient(135deg,#b71c1c,#c62828)"/>
        <StatCard title={tr.diagnosesWeek}  value={summary?.diagnoses_week}  icon="📅" gradient="linear-gradient(135deg,#e65100,#f57c00)"/>
      </div>

      <div style={{background:c.bgCard,borderRadius:'14px',padding:'20px',boxShadow:c.shadow,border:`1px solid ${c.border}`}}>
        <h3 style={{margin:'0 0 14px',fontSize:'15px',fontWeight:'600',color:c.text}}>{tr.testAccounts}</h3>
        {[
          {role:'Admin',   email:'admin@odir.local',   pass:'admin123'},
          {role:'Doctor',  email:'doctor@odir.local',  pass:'doctor123'},
          {role:'Analyst', email:'analyst@odir.local', pass:'analyst123'},
        ].map(acc=>(
          <div key={acc.role} style={{display:'flex',gap:'16px',padding:'10px 12px',borderRadius:'8px',background:dark?'#1e1e35':'#f8f8ff',border:`1px solid ${c.border}`,marginBottom:'6px'}}>
            <span style={{fontWeight:'600',color:'#3949ab',width:'80px'}}>{acc.role}</span>
            <span style={{color:c.textMuted,flex:1}}>{acc.email}</span>
            <span style={{color:c.textMuted,fontFamily:'monospace'}}>{acc.pass}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Users() {
  const { tr, dark } = useTheme();
  const c = colors(dark);
  const [users,setUsers]=useState([]);
  useEffect(()=>{getUsers().then(r=>setUsers(r.data)).catch(()=>{});},[]);

  const roleColors={admin:'#b71c1c',doctor:'#1a237e',analyst:'#4a148c'};
  const roleLabels={admin:'Администратор',doctor:'Врач',analyst:'Аналитик'};

  return (
    <div>
      <h2 style={{margin:'0 0 20px',fontSize:'22px',fontWeight:'700',color:c.text}}>{tr.users}</h2>
      <div style={{background:c.bgCard,borderRadius:'14px',padding:'20px',boxShadow:c.shadow,border:`1px solid ${c.border}`}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:dark?'#1e1e35':'#f5f5f5'}}>
              {['Имя','Email','Роль','Статус','Действия'].map(h=>(
                <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:'12px',fontWeight:'600',color:c.textMuted,borderBottom:`2px solid ${c.border}`}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u,i)=>(
              <tr key={u.id} style={{background:i%2===0?(dark?'#1a1a2e':'#fafafa'):'transparent'}}>
                <td style={{padding:'12px 14px',fontSize:'13px',color:c.text,fontWeight:'600'}}>{u.full_name}</td>
                <td style={{padding:'12px 14px',fontSize:'13px',color:c.textMuted}}>{u.email}</td>
                <td style={{padding:'12px 14px'}}>
                  <span style={{padding:'3px 10px',borderRadius:'12px',fontSize:'12px',fontWeight:'600',background:roleColors[u.role]+'20',color:roleColors[u.role]}}>
                    {roleLabels[u.role]}
                  </span>
                </td>
                <td style={{padding:'12px 14px',fontSize:'13px',fontWeight:'600',color:u.is_active?'#2e7d32':'#c62828'}}>
                  {u.is_active?`✅ ${tr.active}`:`❌ ${tr.inactive}`}
                </td>
                <td style={{padding:'12px 14px'}}>
                  <button onClick={async()=>{await toggleUser(u.id);setUsers(users.map(x=>x.id===u.id?{...x,is_active:!x.is_active}:x));}}
                    style={{padding:'5px 12px',background:dark?'#2a2a4a':'#f5f5f5',border:`1px solid ${c.border}`,borderRadius:'6px',cursor:'pointer',fontSize:'12px',color:c.text,marginRight:'8px'}}>
                    {u.is_active?tr.disable:tr.enable}
                  </button>
                  <button onClick={async()=>{if(!window.confirm('Удалить?'))return;await deleteUser(u.id);setUsers(users.filter(x=>x.id!==u.id));}}
                    style={{padding:'5px 12px',background:'transparent',border:'1px solid #c62828',borderRadius:'6px',cursor:'pointer',fontSize:'12px',color:'#c62828'}}>
                    {tr.delete}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RegisterUser() {
  const { tr, dark } = useTheme();
  const c = colors(dark);
  const [form,setForm]=useState({email:'',password:'',full_name:'',role:'doctor'});
  const [msg,setMsg]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  const handleSubmit=async(e)=>{
    e.preventDefault(); setLoading(true); setMsg(''); setError('');
    try { await register(form); setMsg(`✅ ${tr.userCreated} (${form.email})`); setForm({email:'',password:'',full_name:'',role:'doctor'}); }
    catch(err) { setError(err.response?.data?.detail||tr.error); }
    setLoading(false);
  };

  return (
    <div>
      <h2 style={{margin:'0 0 20px',fontSize:'22px',fontWeight:'700',color:c.text}}>{tr.createAccount}</h2>
      <div style={{background:c.bgCard,borderRadius:'14px',padding:'24px',maxWidth:'480px',boxShadow:c.shadow,border:`1px solid ${c.border}`}}>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          {[
            {l:tr.fullName, k:'full_name', t:'text',     p:'Иванова Мария Сергеевна'},
            {l:tr.email,    k:'email',     t:'email',    p:'user@odir.local'},
            {l:tr.password, k:'password',  t:'password', p:'••••••••'},
          ].map(f=>(
            <div key={f.k} style={{display:'flex',flexDirection:'column',gap:'4px'}}>
              <label style={{fontSize:'12px',fontWeight:'600',color:c.textMuted}}>{f.l}</label>
              <input type={f.t} required placeholder={f.p} value={form[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})}
                style={{padding:'9px 12px',borderRadius:'8px',border:`1.5px solid ${c.inputBorder}`,background:c.inputBg,color:c.text,fontSize:'14px',outline:'none'}}/>
            </div>
          ))}
          <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
            <label style={{fontSize:'12px',fontWeight:'600',color:c.textMuted}}>{tr.role}</label>
            <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}
              style={{padding:'9px 12px',borderRadius:'8px',border:`1.5px solid ${c.inputBorder}`,background:c.inputBg,color:c.text,fontSize:'14px',outline:'none'}}>
              <option value="doctor">Врач</option>
              <option value="analyst">Аналитик</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          {msg   && <div style={{padding:'10px',background:'#e8f5e9',borderRadius:'8px',color:'#2e7d32',fontSize:'13px'}}>{msg}</div>}
          {error && <div style={{padding:'10px',background:'#ffebee',borderRadius:'8px',color:'#c62828',fontSize:'13px'}}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{padding:'11px',background:'linear-gradient(135deg,#b71c1c,#c62828)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'600',cursor:'pointer',opacity:loading?0.7:1}}>
            {loading?tr.loading:tr.createAccount}
          </button>
        </form>
      </div>
    </div>
  );
}
