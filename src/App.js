import { useState } from 'react';
import './App.css';
import Header from './Components/Header/Header';
import MiddleMilestoneCard from './Components/MiddleMilestoneCard/MiddleMilestoneCard';
import SectionButton from './Components/SectionButton/SectionButton';
import TimeArea from './Components/TimeArea/TimeArea';
import MiddleNetWorthCard from './MiddleNetWorthCard/MiddleNetWorthCard';
import AddMoreButton from './Components/AddMoreButton/AddMoreButton';
import RemoveButton from './Components/RemoveButton/RemoveButton';


function App() {
  const [activeSection, setActiveSection] = useState('Net Worth');

  const renderMiddleContent = () => {
    if (activeSection === 'Investments') {
      return (
        <div className='investments-view'>
          <div className='investment-summary-grid'>
            <div className='investment-summary-card'>
              <h2>Top Investment</h2>
              <strong>R$ xxx,xx</strong>
            </div>
            <div className='investment-summary-card cdi-investment-card'>
              <h2>CDI</h2>
              <strong>xx,xx%</strong>
            </div>
          </div>
          <div className='assets-panel'>
            <div className='assets-heading'>
              <h2>Assets</h2>
              <AddMoreButton></AddMoreButton>
            </div>
            <div className='assets-grid'>
              <div className='asset-card'>
                <div className='asset-title'><strong>Name</strong><RemoveButton></RemoveButton></div>
                <p>Asset's Name</p>
                <strong>Yield</strong><p>XX% of CDI</p>
                <strong>Total Income</strong><p>R$ xxx,xx</p>
              </div>
              <div className='asset-card'>
                <div className='asset-title'><strong>Name</strong><RemoveButton></RemoveButton></div>
                <p>Asset's Name</p>
                <strong>Yield</strong><p>XX% of CDI</p>
                <strong>Total Income</strong><p>R$ xxx,xx</p>
              </div>
              <div className='asset-card'>
                <div className='asset-title'><strong>Name</strong><RemoveButton></RemoveButton></div>
                <p>Asset's Name</p>
                <strong>Yield</strong><p>XX% of CDI</p>
                <strong>Total Income</strong><p>R$ xxx,xx</p>
              </div>
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
              <strong>R$ xxx,xx</strong>
              <h3>Last Year</h3>
              <strong>R$ xxx,xx</strong>
            </div>
            <div className='balance-card'>
              <h2>Invested</h2>
              <strong>2026</strong>
              <strong>R$ xxx,xx</strong>
              <h3>Last Year</h3>
              <strong>R$ xxx,xx</strong>
            </div>
          </div>
          <div className='balance-chart-card'>
            <div className='balance-donut' aria-label='Money balance chart'></div>
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
            <MiddleNetWorthCard title='Total' money='xxx,xx' investments='X'></MiddleNetWorthCard>
            <MiddleMilestoneCard title='Milestone' next='xxx,xx' remaining='xxx,xx - X days'></MiddleMilestoneCard>
          </div>
          <div className='middle-summary-side'>
            <div className='summary-card today-card'>
              <h2>Today</h2>
              <strong>R$ xxx,xx</strong>
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
    <div className='app'>
      <Header></Header>
      <div className='app-areas'>
        <TimeArea title='Wishlist' total={179.99} className='wishlist'></TimeArea>
        <div className='middle'>
          <div className='section-buttons'>
            <SectionButton title='Net Worth' active={activeSection === 'Net Worth'} onClick={() => setActiveSection('Net Worth')}></SectionButton>
            <SectionButton title='Balance' active={activeSection === 'Balance'} onClick={() => setActiveSection('Balance')}></SectionButton>
            <SectionButton title='Investments' active={activeSection === 'Investments'} onClick={() => setActiveSection('Investments')}></SectionButton>
          </div>
          {renderMiddleContent()}
        </div>
        <TimeArea title='Recovery' total={0} className='recovery'></TimeArea>
      </div>
    </div>
  );
}

export default App;
