import React, { useMemo, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const statuses = ['New lead','Watch','Request IM','NDA sent','Reviewing IM','Call broker','Financial review','DD candidate','Offer candidate','LOI submitted','Under DD','Negotiating','Passed','Dead','Acquired'];

const sampleData = {
  buyBox: {
    industries: 'Traffic management, civil support, HVAC, electrical, pump services, drainage, plumbing, commercial/facilities maintenance, compliance, equipment hire, specialist trades.',
    locations: 'Lower/Central North Island preferred: Manawatū, Whanganui, Horowhenua, Hawke’s Bay, Taranaki, Kapiti/Wellington, Taupō/Rotorua, Waikato.',
    revenueMin: 1000000, revenueMax: 5000000, earningsMin: 500000, earningsMax: 800000, priceMin: 500000, priceMax: 1800000,
    ownerDependence: 'Low to moderate preferred. High dependence requires risk-adjusted structure.',
    walkAway: 'Weak financials, poor records, owner-only operations, high customer concentration, hidden capex, compliance/tax issues, no forward work.'
  },
  deals: [{
    id: 'd1', name: 'Central Traffic Services Ltd', industry: 'Traffic management', location: 'Manawatū', source: 'Broker listing #NZ-8842', broker: 'Harper Business Sales',
    askingPrice: 895000, revenue: 2100000, ebitda: 620000, workingOwnerProfit: 680000, ownerReplacementSalary: 140000, assetValue: 380000,
    ownerRole: 'GM + key relationships', staffDepth: 'Moderate (2 supervisors)', recurringPct: 65, customerConcentrationPct: 28, forwardWork: '6 months contracted',
    capexRisk: 'Medium', workingCapitalRisk: 'Medium', fundingDifficulty: 'Low/medium', sellerFinancePossible: 'Yes',
    status: 'Financial review', nextAction: 'Request monthly P&L and top 10 customer split', followUpDate: '2026-05-18', notes: 'Potential platform acquisition.', type: 'Platform',
    scoring: { strategicFit: 18, earningsQuality: 16, fundability: 17, managementDepth: 11, recurringRevenue: 8, assetCapex: 7, growthPotential: 4 },
    redFlags: { ownerDependence: 2, customerConcentration: 1, earningsSpike: 0, weakStaffDepth: 1, poorRecords: 0, highCapex: 1, poorWorkingCapital: 1, noForwardWork: 0, complianceRisk: 0, infoRefusal: 0 },
    scenarios: [
      { id: 's1', name: 'Base structure', purchasePrice: 895000, cashAtSettlement: 750000, vendorFinance: 145000, seniorDebt: 525000, equityRequired: 225000, myContribution: 50000, investorEquity: 175000, investorCount: 3, prefReturnPct: 12, rjghOwnershipPct: 40, investorOwnershipPct: 60, debtServiceAnnual: 98000, maintenanceCapex: 45000, growthReserve: 30000, mgmtFee: 36000, yearlyCashflowPreDebt: 310000 },
      { id: 's2', name: 'Higher bank leverage', purchasePrice: 895000, cashAtSettlement: 760000, vendorFinance: 135000, seniorDebt: 600000, equityRequired: 160000, myContribution: 50000, investorEquity: 110000, investorCount: 3, prefReturnPct: 12, rjghOwnershipPct: 45, investorOwnershipPct: 55, debtServiceAnnual: 116000, maintenanceCapex: 45000, growthReserve: 35000, mgmtFee: 36000, yearlyCashflowPreDebt: 310000 }
    ]
  }],
  investors: [{ id: 'i1', name: 'Alex Morgan', entity: 'Morgan Capital', email: 'alex@example.com', phone: '+64 21 222 111', relationship: 'Warm', chequeSize: 100000, investmentType: 'Equity + pref return', riskAppetite: 'Medium', involvement: 'Passive', industries: 'Construction services', status: 'Interested', lastContact: '2026-05-01', nextFollowUp: '2026-05-20', notes: 'Open to first platform deal.' }],
  advisors: [{ id: 'a1', name: 'Sophie Clarke', company: 'Harper Business Sales', type: 'broker', email: 'sophie@harper.co.nz', phone: '+64 27 444 444', region: 'Lower North Island', industryFocus: 'Trades/services', relationshipStrength: 'Strong', lastContact: '2026-05-10', nextFollowUp: '2026-05-17', notes: 'Sends off-market leads.' }],
  followUps: [{ id: 'f1', related: 'Central Traffic Services Ltd', type: 'Deal DD request', dueDate: '2026-05-18', priority: 'High', notes: 'Get monthly P&L + customer split.', completed: false, completedDate: '' }],
  documents: [{ id: 'doc1', deal: 'Central Traffic Services Ltd', name: 'FY24 P&L', category: 'Financials', requestedDate: '2026-05-09', received: true, receivedDate: '2026-05-11', notes: '', status: 'Received' }],
  ddItems: [{ id: 'dd1', deal: 'Central Traffic Services Ltd', item: 'Top 10 customers', required: true, received: false, notes: 'Needed to validate concentration risk.' }]
};

const currency = (n) => isFinite(n) ? `$${Number(n).toLocaleString()}` : '$0';
const num = (v) => Number(v || 0);
const calcScore = (deal) => Object.values(deal.scoring).reduce((a,b)=>a+num(b),0) - Object.values(deal.redFlags).reduce((a,b)=>a+num(b),0);
const scenarioMetrics = (s) => {
  const headlineMultiple = s.purchasePrice / 620000;
  const managedEbitda = 620000 - 140000;
  const managedMultiple = s.purchasePrice / managedEbitda;
  const prefGroup = s.investorEquity * (s.prefReturnPct/100);
  const prefEach = prefGroup / s.investorCount;
  const adjustedCashflow = s.yearlyCashflowPreDebt - s.debtServiceAnnual - s.vendorFinance*0.1 - s.maintenanceCapex - s.growthReserve - s.mgmtFee - prefGroup;
  const investorShare = Math.max(adjustedCashflow,0) * (s.investorOwnershipPct/100);
  return { headlineMultiple, managedEbitda, managedMultiple, prefGroup, prefEach, adjustedCashflow, investorShare, coc: s.investorEquity ? investorShare/s.investorEquity : 0, dscr: s.debtServiceAnnual ? s.yearlyCashflowPreDebt/s.debtServiceAnnual : 0, payback: investorShare ? s.investorEquity/investorShare : 0 };
};

function App(){
  const [data, setData] = useState(() => JSON.parse(localStorage.getItem('crmData') || 'null') || sampleData);
  const [page, setPage] = useState('Dashboard');
  useEffect(()=>localStorage.setItem('crmData', JSON.stringify(data)), [data]);
  const deal = data.deals[0];
  const dashboard = useMemo(()=>{
    const deals = data.deals; const active = deals.filter(d=>!['Passed','Dead','Acquired'].includes(d.status));
    return { total: deals.length, avgMultiple: deals.reduce((a,d)=>a+(d.askingPrice/d.ebitda),0)/Math.max(deals.length,1), top: [...deals].sort((a,b)=>calcScore(b)-calcScore(a))[0],
      followUps: data.followUps.filter(f=>!f.completed).length, redFlagged: deals.filter(d=>Object.values(d.redFlags).reduce((a,b)=>a+b,0)>=5).length,
      equity: active.reduce((a,d)=>a+d.scenarios[0].equityRequired,0), investor: active.reduce((a,d)=>a+d.scenarios[0].investorEquity,0), mine: active.reduce((a,d)=>a+d.scenarios[0].myContribution,0), vendor: active.reduce((a,d)=>a+d.scenarios[0].vendorFinance,0), debt: active.reduce((a,d)=>a+d.scenarios[0].seniorDebt,0)};
  },[data]);

  const addDeal = () => setData(d=>({...d, deals:[...d.deals,{id:Date.now()+'' ,name:'New Deal',industry:'',location:'',source:'',broker:'',askingPrice:0,revenue:0,ebitda:0,workingOwnerProfit:0,ownerReplacementSalary:0,assetValue:0,ownerRole:'',staffDepth:'',recurringPct:0,customerConcentrationPct:0,forwardWork:'',capexRisk:'',workingCapitalRisk:'',fundingDifficulty:'',sellerFinancePossible:'',status:'New lead',nextAction:'',followUpDate:'',notes:'',type:'Bolt-on', scoring:{ strategicFit:0, earningsQuality:0, fundability:0, managementDepth:0, recurringRevenue:0, assetCapex:0, growthPotential:0 }, redFlags:{ ownerDependence:0, customerConcentration:0, earningsSpike:0, weakStaffDepth:0, poorRecords:0, highCapex:0, poorWorkingCapital:0, noForwardWork:0, complianceRisk:0, infoRefusal:0 }, scenarios:[]}]}));

  return <div className='app'><h1>RJGH Acquisition CRM MVP</h1><nav>{['Dashboard','Buy Box','Deal Pipeline','Deal Detail','Scenario Comparison','Investors','Advisors','Due Diligence','Follow-Ups','Documents'].map(p=><button key={p} onClick={()=>setPage(p)}>{p}</button>)}</nav>
  {page==='Dashboard' && <section><h2>Dashboard</h2><div className='grid'><Card t='Total deals reviewed' v={dashboard.total}/><Card t='Avg EBITDA multiple' v={dashboard.avgMultiple.toFixed(2)+'x'}/><Card t='Total equity required' v={currency(dashboard.equity)}/><Card t='Investor capital required' v={currency(dashboard.investor)}/><Card t='My capital required' v={currency(dashboard.mine)}/><Card t='Vendor finance proposed' v={currency(dashboard.vendor)}/><Card t='Senior debt proposed' v={currency(dashboard.debt)}/><Card t='Red-flagged deals' v={dashboard.redFlagged}/><Card t='Next follow-ups due' v={dashboard.followUps}/><Card t='Best deal by score' v={dashboard.top?.name || '-'}/></div></section>}
  {page==='Buy Box' && <section><h2>Buy Box Rules</h2><textarea value={data.buyBox.industries} onChange={e=>setData({...data,buyBox:{...data.buyBox,industries:e.target.value}})} /><textarea value={data.buyBox.locations} onChange={e=>setData({...data,buyBox:{...data.buyBox,locations:e.target.value}})} /><p>Revenue target: {currency(data.buyBox.revenueMin)} - {currency(data.buyBox.revenueMax)}</p><p>Earnings target: {currency(data.buyBox.earningsMin)} - {currency(data.buyBox.earningsMax)}</p></section>}
  {page==='Deal Pipeline' && <section><h2>Deal Pipeline</h2><button onClick={addDeal}>+ Add Deal</button><table><thead><tr><th>Name</th><th>Industry</th><th>Status</th><th>Price</th><th>EBITDA</th><th>Score</th><th>Follow-up</th></tr></thead><tbody>{data.deals.map((d,i)=><tr key={d.id}><td><input value={d.name} onChange={e=>{const deals=[...data.deals];deals[i].name=e.target.value;setData({...data,deals})}}/></td><td>{d.industry}</td><td><select value={d.status} onChange={e=>{const deals=[...data.deals];deals[i].status=e.target.value;setData({...data,deals})}}>{statuses.map(s=><option key={s}>{s}</option>)}</select></td><td>{currency(d.askingPrice)}</td><td>{currency(d.ebitda)}</td><td>{calcScore(d)}</td><td>{d.followUpDate}</td></tr>)}</tbody></table></section>}
  {page==='Deal Detail' && <section><h2>Deal Detail + Scoring</h2><p><b>{deal.name}</b> ({deal.type})</p><p>Location: {deal.location} | Broker: {deal.broker} | Source: {deal.source}</p><p>Managed EBITDA: {currency(deal.workingOwnerProfit - deal.ownerReplacementSalary)}</p><p>Headline multiple: {(deal.askingPrice/deal.ebitda).toFixed(2)}x</p><p>Working-owner multiple: {(deal.askingPrice/deal.workingOwnerProfit).toFixed(2)}x</p><p>Overall deal score: {calcScore(deal)} / 100</p></section>}
  {page==='Scenario Comparison' && <section><h2>Scenario Comparison / Deal Structure Calculator / Investor Returns</h2><table><thead><tr><th>Scenario</th><th>Equity</th><th>Debt</th><th>Vendor</th><th>Investor each</th><th>Pref group</th><th>Adj cashflow</th><th>Cash-on-cash</th><th>DSCR</th></tr></thead><tbody>{deal.scenarios.map(s=>{const m=scenarioMetrics(s);return <tr key={s.id}><td>{s.name}</td><td>{currency(s.equityRequired)}</td><td>{currency(s.seniorDebt)}</td><td>{currency(s.vendorFinance)}</td><td>{currency(s.investorEquity/s.investorCount)}</td><td>{currency(m.prefGroup)}</td><td>{currency(m.adjustedCashflow)}</td><td>{(m.coc*100).toFixed(1)}%</td><td>{m.dscr.toFixed(2)}x</td></tr>})}</tbody></table></section>}
  {page==='Investors' && <ListPage rows={data.investors} title='Investor Contacts' columns={['name','entity','email','phone','relationship','chequeSize','investmentType','riskAppetite','involvement','status','lastContact','nextFollowUp']} />}
  {page==='Advisors' && <ListPage rows={data.advisors} title='Advisor/Broker/Deal Source Contacts' columns={['name','company','type','email','phone','region','industryFocus','relationshipStrength','lastContact','nextFollowUp']} />}
  {page==='Due Diligence' && <ListPage rows={data.ddItems} title='Due Diligence Checklist' columns={['deal','item','required','received','notes']} />}
  {page==='Follow-Ups' && <ListPage rows={data.followUps} title='Follow-Up Tracker' columns={['related','type','dueDate','priority','notes','completed','completedDate']} />}
  {page==='Documents' && <ListPage rows={data.documents} title='Document Tracker' columns={['deal','name','category','requestedDate','received','receivedDate','notes','status']} />}
  </div>
}

const Card=({t,v})=><div className='card'><div>{t}</div><b>{v}</b></div>;
function ListPage({title,rows,columns}){return <section><h2>{title}</h2><table><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}>{columns.map(c=><td key={c}>{String(r[c])}</td>)}</tr>)}</tbody></table></section>}

createRoot(document.getElementById('root')).render(<App/>);
