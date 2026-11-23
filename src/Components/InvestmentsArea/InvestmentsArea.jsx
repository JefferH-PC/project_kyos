import React, { useRef, useState, useEffect } from 'react';
import RemoveButton from '../RemoveButton/RemoveButton';
import { formatDecimal, formatDateKey } from '../../utils/formatters';
import { calculateTaxBreakdown, getCalendarDaysElapsed } from '../../utils/tax';

const getConnectedGridBorderRadius = (index, total, cols, radius = '10px') => {
  const safeCols = Math.max(1, cols);
  const hasTopNeighbor = index >= safeCols;
  const hasBottomNeighbor = index + safeCols < total;
  const hasLeftNeighbor = (index % safeCols) > 0;
  const hasRightNeighbor = (index % safeCols) < safeCols - 1 && (index + 1) < total;

  const tl = !hasTopNeighbor && !hasLeftNeighbor ? radius : '0px';
  const tr = !hasTopNeighbor && !hasRightNeighbor ? radius : '0px';
  const br = !hasBottomNeighbor && !hasRightNeighbor ? radius : '0px';
  const bl = !hasBottomNeighbor && !hasLeftNeighbor ? radius : '0px';

  return `${tl} ${tr} ${br} ${bl}`;
};

const InvestmentsArea = ({
  t,
  locale,
  displayMoney,
  topInvestment,
  totalDailyIncome,
  assets,
  cdiRate,
  actualDate,
  simulatedDate,
  getDailyAssetIncome,
  isAssetFormOpen,
  setIsAssetFormOpen,
  assetForm,
  setAssetForm,
  onAddAsset,
  editingAssetId,
  editAssetForm,
  setEditAssetForm,
  onStartEditAsset,
  onCancelEditAsset,
  onSaveAssetEdit,
  onToggleAssetTax,
  onRemoveAsset,
  onManualSync
}) => {
  const assetsGridRef = useRef(null);
  const [gridCols, setGridCols] = useState(() => (typeof window !== 'undefined' && window.innerWidth <= 600 ? 1 : 2));

  useEffect(() => {
    const el = assetsGridRef.current;
    if (!el) return;

    const updateCols = () => {
      if (typeof window !== 'undefined' && window.innerWidth <= 600) {
        setGridCols(1);
        return;
      }
      const computed = window.getComputedStyle(el).gridTemplateColumns;
      if (
        computed &&
        computed !== 'none' &&
        !computed.includes('repeat') &&
        !computed.includes('minmax')
      ) {
        const tracks = computed.trim().split(/\s+/).filter(Boolean);
        if (tracks.length >= 1) {
          setGridCols(tracks.length);
          return;
        }
      }
      const width = el.clientWidth || (typeof window !== 'undefined' ? Math.max(260, window.innerWidth - 64) : 540);
      setGridCols(Math.max(1, Math.floor((width + 6) / 266)));
    };

    updateCols();
    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateCols);
      observer.observe(el);
    }
    window.addEventListener('resize', updateCols);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateCols);
    };
  }, [assets.length]);

  return (
    <div className='investments-view'>
      <div className='investment-summary-grid'>
        <div className='investment-summary-card'>
          <div className='investment-summary-top'>
            <h2>{t.topInvestment}</h2>
            <span className='top-investment-name'>· {topInvestment.name}</span>
          </div>
          <strong>R$ {displayMoney(topInvestment.investedAmount)}</strong>
        </div>
        <div className='investment-summary-card cdi-investment-card'>
          <h2>{t.totalDailyIncome}</h2>
          <strong>R$ {displayMoney(totalDailyIncome)}</strong>
        </div>
      </div>
      <div className='assets-panel'>
        <div className='assets-heading'>
          <div className='assets-heading-title'>
            <h2>{t.assets}</h2>
            <span className='assets-count-label'>{assets.length}</span>
          </div>
          <div className='assets-heading-actions'>
            <button
              type='button'
              className='sync-incomes-btn'
              onClick={onManualSync}
              title={t.syncIncomesTip}
              aria-label={t.syncIncomes}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,128a96,96,0,0,1-96,96A95.8,95.8,0,0,1,64,195.9V216a8,8,0,0,1-16,0V168a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H76.7A79.9,79.9,0,0,0,128,208a80,80,0,0,0,80-80,8,8,0,0,1,16,0ZM48,88a8,8,0,0,1,8-8H84.3A79.9,79.9,0,0,1,128,48a80,80,0,0,1,80,80,8,8,0,0,1,16,0A96,96,0,0,0,64,60.1V40a8,8,0,0,1-16,0V88A8,8,0,0,1,48,88Z"/>
              </svg>
              <span>{t.syncIncomes}</span>
            </button>
            <button
              type='button'
              className='add-investment-btn'
              aria-label={t.addInvestment}
              onClick={() => setIsAssetFormOpen((current) => !current)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/>
              </svg>
              <span>{t.addInvestment}</span>
            </button>
          </div>
        </div>
        {isAssetFormOpen && (
          <form className='asset-form' onSubmit={onAddAsset}>
            <div className='asset-form-grid'>
              <label className='asset-form-field'>
                <span>{t.name}</span>
                <input
                  placeholder={t.name}
                  value={assetForm.name}
                  onChange={(event) => setAssetForm({ ...assetForm, name: event.target.value })}
                  required
                />
              </label>
              <label className='asset-form-field'>
                <span>{t.yieldRate}</span>
                <input
                  placeholder={t.yieldRate}
                  type='number'
                  min='0'
                  step='0.01'
                  value={assetForm.yieldRate}
                  onChange={(event) => setAssetForm({ ...assetForm, yieldRate: event.target.value })}
                />
              </label>
              <label className='asset-form-field'>
                <span>{t.investedAmount}</span>
                <input
                  placeholder={t.investedAmount}
                  type='number'
                  min='0'
                  step='0.01'
                  value={assetForm.investedAmount}
                  onChange={(event) => setAssetForm({ ...assetForm, investedAmount: event.target.value })}
                  required
                />
              </label>
              <label className='asset-form-field'>
                <span>{t.investmentDate}</span>
                <input
                  type='date'
                  aria-label={t.investmentDate}
                  max={simulatedDate}
                  value={assetForm.creationDate || ''}
                  onChange={(event) => setAssetForm({ ...assetForm, creationDate: event.target.value })}
                />
              </label>
            </div>
            <div className='asset-form-footer'>
              <label className='asset-tax-checkbox-label'>
                <input
                  type='checkbox'
                  checked={assetForm.applyTax}
                  onChange={(event) => setAssetForm({ ...assetForm, applyTax: event.target.checked })}
                />
                <span>{t.applyTaxLabel}</span>
              </label>
              <div className='asset-form-actions'>
                <button type='button' className='asset-cancel-btn' onClick={() => setIsAssetFormOpen(false)}>
                  {t.cancel}
                </button>
                <button type='submit' className='asset-submit-btn'>{t.add}</button>
              </div>
            </div>
          </form>
        )}
        <div className='assets-grid' ref={assetsGridRef}>
          {assets.map((asset, index) => {
            const dailyGross = getDailyAssetIncome(asset, cdiRate);
            const daysElapsed = getCalendarDaysElapsed(asset.creationDate, actualDate);
            const dailyTax = calculateTaxBreakdown(dailyGross, daysElapsed);
            const totalTax = calculateTaxBreakdown(asset.totalIncome, daysElapsed);
            const borderRadius = getConnectedGridBorderRadius(index, assets.length, gridCols, '10px');

            return (
              <div className='asset-card' key={asset.id} style={{ borderRadius }}>
                {editingAssetId === asset.id ? (
                  <form className='asset-edit-form' onSubmit={onSaveAssetEdit}>
                    <label className='asset-edit-label'>
                      <span>{t.name}</span>
                      <input
                        value={editAssetForm.name}
                        onChange={(e) => setEditAssetForm({ ...editAssetForm, name: e.target.value })}
                        placeholder={t.name}
                        required
                      />
                    </label>
                    <label className='asset-edit-label'>
                      <span>{t.yieldRate}</span>
                      <input
                        type='number'
                        min='0'
                        step='0.01'
                        value={editAssetForm.yieldRate}
                        onChange={(e) => setEditAssetForm({ ...editAssetForm, yieldRate: e.target.value })}
                        placeholder={t.yieldRate}
                      />
                    </label>
                    <label className='asset-edit-label'>
                      <span>{t.investedAmount}</span>
                      <input
                        type='number'
                        min='0'
                        step='0.01'
                        value={editAssetForm.investedAmount}
                        onChange={(e) => setEditAssetForm({ ...editAssetForm, investedAmount: e.target.value })}
                        placeholder={t.investedAmount}
                        required
                      />
                    </label>
                    <label className='asset-edit-label'>
                      <span>{t.investmentDate}</span>
                      <input
                        type='date'
                        aria-label={t.investmentDate}
                        max={simulatedDate}
                        value={editAssetForm.creationDate || ''}
                        onChange={(e) => setEditAssetForm({ ...editAssetForm, creationDate: e.target.value })}
                      />
                    </label>
                    <label className='asset-tax-checkbox-label'>
                      <input
                        type='checkbox'
                        checked={editAssetForm.applyTax}
                        onChange={(e) => setEditAssetForm({ ...editAssetForm, applyTax: e.target.checked })}
                      />
                      <span>{t.applyTaxLabel}</span>
                    </label>
                    <div className='asset-edit-actions'>
                      <button type='submit' className='asset-save-btn'>{t.save}</button>
                      <button type='button' className='asset-cancel-btn' onClick={onCancelEditAsset}>{t.cancel}</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className='asset-title'>
                      <strong>{asset.name}</strong>
                      <div className='asset-actions'>
                        <button
                          type='button'
                          className={`asset-tax-toggle-btn ${asset.applyTax ? 'taxable' : 'exempt'}`}
                          onClick={() => onToggleAssetTax(asset.id)}
                          title={t.toggleTaxTip}
                          aria-label={`${t.toggleTaxTip} - ${asset.name}`}
                        >
                          {asset.applyTax ? t.taxableBadge : t.taxExemptBadge}
                        </button>
                        <button
                          type='button'
                          className='edit-asset-button'
                          aria-label={`${t.edit} ${asset.name}`}
                          title={t.edit}
                          onClick={() => onStartEditAsset(asset)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
                            <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path>
                          </svg>
                        </button>
                        <RemoveButton label={t.removeSlot} onClick={() => onRemoveAsset(asset.id)} />
                      </div>
                    </div>

                    <div className='asset-metrics-grid'>
                      <div className='asset-metric'>
                        <strong>{t.yield}</strong>
                        <p>{formatDecimal(asset.yieldRate)}% {t.cdi}</p>
                      </div>
                      <div className='asset-metric'>
                        <strong>{t.invested}</strong>
                        <p>R$ {displayMoney(asset.investedAmount)}</p>
                      </div>

                      {asset.applyTax ? (
                        <>
                          <div className='asset-metric'>
                            <strong>{t.dailyIncome} ({t.net})</strong>
                            <p>R$ {displayMoney(dailyTax.netYield)}</p>
                            <small className='tax-gross-tag'>{t.gross}: R$ {displayMoney(dailyGross)}</small>
                          </div>
                          <div className='asset-metric'>
                            <strong>{t.totalIncome} ({t.net})</strong>
                            <p>R$ {displayMoney(totalTax.netYield)}</p>
                            <small className='tax-gross-tag'>{t.gross}: R$ {displayMoney(asset.totalIncome)}</small>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className='asset-metric'>
                            <strong>{t.dailyIncome}</strong>
                            <p>R$ {displayMoney(dailyGross)}</p>
                          </div>
                          <div className='asset-metric'>
                            <strong>{t.totalIncome}</strong>
                            <p>R$ {displayMoney(asset.totalIncome)}</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className='asset-footer-meta'>
                      <span>
                        <strong>{formatDateKey(asset.creationDate, locale)}</strong> · {daysElapsed} {t.days}
                      </span>
                      {asset.applyTax && (
                        <span className='asset-tax-summary'>
                          {t.iofRateLabel} {dailyTax.iofRate}% · {t.irRateLabel} {dailyTax.irRate}%
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InvestmentsArea;
