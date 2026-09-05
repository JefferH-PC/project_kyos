import { useEffect, useState } from 'react';
import './App.css';
import Header from './Components/Header/Header';
import MiddleMilestoneCard from './Components/MiddleMilestoneCard/MiddleMilestoneCard';
import SectionButton from './Components/SectionButton/SectionButton';
import TimeArea from './Components/TimeArea/TimeArea';
import MiddleNetWorthCard from './MiddleNetWorthCard/MiddleNetWorthCard';
import AddMoreButton from './Components/AddMoreButton/AddMoreButton';
import RemoveButton from './Components/RemoveButton/RemoveButton';

const defaultDatabase = {
  wishlistSlots: [],
  recoverySlots: [],
  milestone: { target: 10000.50 },
  assets: []
};

const readDatabase = () => {
  try {
    const savedDatabase = window.localStorage.getItem('kyos-database');
    if (!savedDatabase) return defaultDatabase;
    const parsedDatabase = JSON.parse(savedDatabase);
    const preAddedSlotIds = ['expense-default', 'ready-default', 'recovery-default'];
    const preAddedAssetIds = ['asset-1', 'asset-2', 'asset-3'];
    return {
      ...defaultDatabase,
      ...parsedDatabase,
      wishlistSlots: Array.isArray(parsedDatabase.wishlistSlots) ? parsedDatabase.wishlistSlots.filter((slot) => !preAddedSlotIds.includes(slot.id)) : defaultDatabase.wishlistSlots,
      recoverySlots: Array.isArray(parsedDatabase.recoverySlots) ? parsedDatabase.recoverySlots.filter((slot) => !preAddedSlotIds.includes(slot.id)) : defaultDatabase.recoverySlots,
      assets: Array.isArray(parsedDatabase.assets) ? parsedDatabase.assets.filter((asset) => !preAddedAssetIds.includes(asset.id)).map((asset) => ({
        ...asset,
        investedAmount: Number(asset.investedAmount ?? asset.totalIncome ?? 0)
      })) : defaultDatabase.assets,
      milestone: { ...defaultDatabase.milestone, ...(parsedDatabase.milestone || {}) }
    };
  } catch {
    return defaultDatabase;
  }
};


function App() {
  const [activeSection, setActiveSection] = useState('Net Worth');
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [database, setDatabase] = useState(readDatabase);
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [assetForm, setAssetForm] = useState({ name: '', yieldRate: '', investedAmount: '' });
  const [databaseDraft, setDatabaseDraft] = useState('');

  useEffect(() => {
    window.localStorage.setItem('kyos-database', JSON.stringify(database));
  }, [database]);

  const wishlistTotal = database.wishlistSlots.reduce((total, slot) => total + Number(slot.price || 0), 0);
  const recoveryTotal = database.recoverySlots.reduce((total, slot) => total + Number(slot.price || 0), 0);
  const investedTotal = database.assets.reduce((total, asset) => total + Number(asset.investedAmount || 0), 0);
  const topInvestment = database.assets.reduce((top, asset) => Number(asset.investedAmount) > Number(top.investedAmount) ? asset : top, { name: 'None', investedAmount: 0 });
  const netWorthTotal = investedTotal;
  const milestoneRemaining = Math.max(Number(database.milestone.target) - netWorthTotal, 0);
  const formatMoney = (value) => Number(value).toFixed(2).replace('.', ',');

  const updateSlots = (key, slots) => setDatabase((current) => ({ ...current, [key]: slots }));

  const addAsset = (event) => {
    event.preventDefault();
    if (!assetForm.name.trim() || !assetForm.investedAmount) return;
    setDatabase((current) => ({
      ...current,
      assets: [...current.assets, {
        id: `${Date.now()}-${Math.random()}`,
        name: assetForm.name.trim(),
        yieldRate: Number(assetForm.yieldRate || 0),
        investedAmount: Number(assetForm.investedAmount)
      }]
    }));
    setAssetForm({ name: '', yieldRate: '', investedAmount: '' });
    setIsAssetFormOpen(false);
  };

  const removeAsset = (id) => {
    setDatabase((current) => ({ ...current, assets: current.assets.filter((asset) => asset.id !== id) }));
  };

  const openDatabaseSection = () => {
    setDatabaseDraft(JSON.stringify(database, null, 2));
    setActiveSection('Database');
  };

  const saveDatabaseDraft = () => {
    try {
      const parsedDraft = JSON.parse(databaseDraft);
      if (!Array.isArray(parsedDraft.wishlistSlots) || !Array.isArray(parsedDraft.recoverySlots) || !Array.isArray(parsedDraft.assets)) return;
      setDatabase({ ...defaultDatabase, ...parsedDraft, milestone: { ...defaultDatabase.milestone, ...(parsedDraft.milestone || {}) } });
    } catch {
      return;
    }
  };

  const renderMiddleContent = () => {
    if (activeSection === 'Database') {
      return (
        <div className='database-view'>
          <div className='database-heading'>
            <h2>Local Database</h2>
            <span>{database.wishlistSlots.length + database.recoverySlots.length} slots | {database.assets.length} assets</span>
          </div>
          <textarea value={databaseDraft} onChange={(event) => setDatabaseDraft(event.target.value)} aria-label='Edit local database'></textarea>
          <button className='database-save' type='button' onClick={saveDatabaseDraft}>Save database</button>
        </div>
      );
    }

    if (activeSection === 'Investments') {
      return (
        <div className='investments-view'>
          <div className='investment-summary-grid'>
            <div className='investment-summary-card'>
              <h2>Top Investment</h2>
              <strong>{topInvestment.name}<br />R$ {formatMoney(topInvestment.investedAmount)}</strong>
            </div>
            <div className='investment-summary-card cdi-investment-card'>
              <h2>CDI</h2>
              <strong>xx,xx%</strong>
            </div>
          </div>
          <div className='assets-panel'>
            <div className='assets-heading'>
              <h2>Assets</h2>
              <AddMoreButton onClick={() => setIsAssetFormOpen((current) => !current)}></AddMoreButton>
            </div>
            {isAssetFormOpen && (
              <form className='asset-form' onSubmit={addAsset}>
                <input placeholder='Name' value={assetForm.name} onChange={(event) => setAssetForm({ ...assetForm, name: event.target.value })} required />
                <input placeholder='Yield %' type='number' min='0' step='0.01' value={assetForm.yieldRate} onChange={(event) => setAssetForm({ ...assetForm, yieldRate: event.target.value })} />
                <input placeholder='Invested amount' type='number' min='0' step='0.01' value={assetForm.investedAmount} onChange={(event) => setAssetForm({ ...assetForm, investedAmount: event.target.value })} required />
                <button type='submit'>Add</button>
              </form>
            )}
            <div className='assets-grid'>
              {database.assets.map((asset) => (
                <div className='asset-card' key={asset.id}>
                  <div className='asset-title'><strong>{asset.name}</strong><RemoveButton onClick={() => removeAsset(asset.id)}></RemoveButton></div>
                  <strong>Yield</strong><p>{asset.yieldRate}% of CDI</p>
                  <strong>Invested</strong><p>R$ {formatMoney(asset.investedAmount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'Balance') {
      return (
        <div className='balance-view'>
          <div className='balance-year-grid'>
            <div className='balance-card'>
              <h2>Spent</h2>
              <strong>2026</strong>
              <strong>R$ {formatMoney(wishlistTotal)}</strong>
              <h3>Last Year</h3>
              <strong>R$ {formatMoney(investedTotal)}</strong>
            </div>
            <div className='balance-card'>
              <h2>Invested</h2>
              <strong>2026</strong>
              <strong>R$ {formatMoney(investedTotal)}</strong>
              <h3>Last Year</h3>
              <strong>R$ xxx,xx</strong>
            </div>
          </div>
          <div className='balance-chart-card'>
            <div className='balance-donut' style={{ '--spent-ratio': `${wishlistTotal + investedTotal ? (wishlistTotal / (wishlistTotal + investedTotal)) * 100 : 0}%` }} aria-label='Money balance chart'></div>
            <div className='balance-legend'>
              <h2>Money's Balance</h2>
              <p><span className='legend-swatch invested'></span>Invested</p>
              <p><span className='legend-swatch spent'></span>Spent</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className='middle-summary'>
          <div className='middle-summary-main'>
            <MiddleNetWorthCard title='Total' money={formatMoney(netWorthTotal)} investments={database.assets.length}></MiddleNetWorthCard>
            <MiddleMilestoneCard title='Milestone' next={formatMoney(database.milestone.target)} remaining={`${formatMoney(milestoneRemaining)} - X days`}></MiddleMilestoneCard>
          </div>
          <div className='middle-summary-side'>
            <div className='summary-card today-card'>
              <h2>Today</h2>
              <strong>R$ {formatMoney(wishlistTotal)}</strong>
              <h3>Yesterday</h3>
              <strong>R$ xxx,xx <span className='trend'>→</span></strong>
            </div>
            <div className='summary-card cdi-card'>
              <h2>CDI</h2>
              <strong>xx,xx%</strong>
            </div>
          </div>
        </div>
        <div className='time-cards'>
          <div className='summary-card period-card'>
            <h2>Week</h2><strong>R$ xxx,xx</strong><h3>Last Week</h3><strong>R$ xxx,xx <span className='trend'>→</span></strong>
          </div>
          <div className='summary-card period-card'>
            <h2>Month</h2><strong>R$ xxx,xx</strong><h3>Last Month</h3><strong>R$ xxx,xx <span className='trend'>→</span></strong>
          </div>
          <div className='summary-card period-card'>
            <h2>Year</h2><strong>R$ xxx,xx</strong><h3>Last Year</h3><strong>R$ xxx,xx <span className='trend'>→</span></strong>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={`app ${isLightTheme ? 'light-theme' : ''}`}>
      <Header isLightTheme={isLightTheme} onToggleTheme={() => setIsLightTheme((current) => !current)}></Header>
      <div className='app-areas'>
        <TimeArea title='Wishlist' slots={database.wishlistSlots} onSlotsChange={(slots) => updateSlots('wishlistSlots', slots)} total={wishlistTotal} className='wishlist'></TimeArea>
        <div className='middle'>
          <div className='section-buttons'>
            <SectionButton title='Net Worth' active={activeSection === 'Net Worth'} onClick={() => setActiveSection('Net Worth')}></SectionButton>
            <SectionButton title='Balance' active={activeSection === 'Balance'} onClick={() => setActiveSection('Balance')}></SectionButton>
            <SectionButton title='Investments' active={activeSection === 'Investments'} onClick={() => setActiveSection('Investments')}></SectionButton>
            <SectionButton title='Database' active={activeSection === 'Database'} onClick={openDatabaseSection}></SectionButton>
          </div>
          {renderMiddleContent()}
        </div>
        <TimeArea title='Recovery' slots={database.recoverySlots} onSlotsChange={(slots) => updateSlots('recoverySlots', slots)} total={recoveryTotal} className='recovery'></TimeArea>
      </div>
    </div>
  );
}

export default App;
