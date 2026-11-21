import React from 'react';
import MiddleNetWorthCard from '../../MiddleNetWorthCard/MiddleNetWorthCard';
import MiddleMilestoneCard from '../MiddleMilestoneCard/MiddleMilestoneCard';
import { formatDecimal } from '../../utils/formatters';

const NetWorthArea = ({
  t,
  displayMoney,
  netWorthTotal,
  assetsCount,
  nextMilestone,
  milestoneRemaining,
  milestoneDays,
  milestoneProgress,
  todayIncome,
  todayTrend,
  yesterdayIncome,
  totalCdiRate,
  weekIncome,
  weekTrend,
  previousWeekIncome,
  monthIncome,
  monthTrend,
  previousMonthIncome,
  yearIncome,
  yearTrend,
  previousYearIncome
}) => {
  return (
    <>
      <div className='middle-summary'>
        <div className='middle-summary-main'>
          <MiddleNetWorthCard
            title={t.total}
            money={displayMoney(netWorthTotal)}
            investments={assetsCount}
            investmentLabel={t.investmentsCount}
          />
          <MiddleMilestoneCard
            title={t.milestone}
            next={displayMoney(nextMilestone)}
            remaining={`${displayMoney(milestoneRemaining)} - ${milestoneDays > 0 ? `${milestoneDays} ${t.days}` : '—'}`}
            progress={milestoneProgress}
          />
        </div>
        <div className='middle-summary-side'>
          <div className='summary-card today-card'>
            <h2>{t.today}</h2>
            <strong>
              R$ {displayMoney(todayIncome)}
              <span className={`trend ${todayTrend.className}`}>{todayTrend.symbol}</span>
            </strong>
            <h3>{t.yesterday}</h3>
            <strong>R$ {displayMoney(yesterdayIncome)}</strong>
          </div>
          <div className='summary-card cdi-card'>
            <h2>{t.cdi}</h2>
            <strong>{formatDecimal(totalCdiRate)}%</strong>
          </div>
        </div>
      </div>
      <div className='time-cards'>
        <div className='summary-card period-card'>
          <h2>{t.week}</h2>
          <strong>
            R$ {displayMoney(weekIncome)} <span className={`trend ${weekTrend.className}`}>{weekTrend.symbol}</span>
          </strong>
          <h3>{t.lastWeek}</h3>
          <strong>R$ {displayMoney(previousWeekIncome)}</strong>
        </div>
        <div className='summary-card period-card'>
          <h2>{t.month}</h2>
          <strong>
            R$ {displayMoney(monthIncome)} <span className={`trend ${monthTrend.className}`}>{monthTrend.symbol}</span>
          </strong>
          <h3>{t.lastMonth}</h3>
          <strong>R$ {displayMoney(previousMonthIncome)}</strong>
        </div>
        <div className='summary-card period-card'>
          <h2>{t.year}</h2>
          <strong>
            R$ {displayMoney(yearIncome)} <span className={`trend ${yearTrend.className}`}>{yearTrend.symbol}</span>
          </strong>
          <h3>{t.lastYearLabel}</h3>
          <strong>R$ {displayMoney(previousYearIncome)}</strong>
        </div>
      </div>
    </>
  );
};

export default NetWorthArea;
