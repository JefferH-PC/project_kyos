import { useRef } from 'react';
import './Header.css';

const Header = (props) => {
    const fileInputRef = useRef(null);
    const visibilityLabel = props.areValuesVisible ? props.labelSet.hideMoneyValues : props.labelSet.showMoneyValues;

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    return (
        <header className='header'> 
            <div className='logo'>
                <svg className='coin-icon' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-68a28,28,0,0,1-28,28h-4v8a8,8,0,0,1-16,0v-8H104a8,8,0,0,1,0-16h36a12,12,0,0,0,0-24H116a28,28,0,0,1,0-56h4V72a8,8,0,0,1,16,0v8h16a8,8,0,0,1,0,16H116a12,12,0,0,0,0,24h24A28,28,0,0,1,168,148Z"></path>
                </svg>
                <h1>Kyos</h1>
            </div>

            <div className='header-actions'>
                <button
                    className='action-icon-button'
                    aria-label={props.labelSet.exportData || 'Export JSON backup'}
                    title={props.labelSet.exportData || 'Export JSON backup'}
                    onClick={props.onExportJSON}
                    type='button'
                >
                    <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 256 256' fill='currentColor'>
                        <path d="M216,144v48a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V144a8,8,0,0,1,16,0v48H200V144a8,8,0,0,1,16,0Zm-93.66,4.34a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,122.69V40a8,8,0,0,0-16,0v82.69L93.66,97.02a8,8,0,0,0-11.32,11.32Z" />
                    </svg>
                </button>

                <button
                    className='action-icon-button'
                    aria-label={props.labelSet.importData || 'Import JSON backup'}
                    title={props.labelSet.importData || 'Import JSON backup'}
                    onClick={handleImportClick}
                    type='button'
                >
                    <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 256 256' fill='currentColor'>
                        <path d="M216,144v48a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V144a8,8,0,0,1,16,0v48H200V144a8,8,0,0,1,16,0Zm-93.66-85.66a8,8,0,0,1,11.32,0l40,40a8,8,0,0,1-11.32,11.32L136,83.31V160a8,8,0,0,1-16,0V83.31L93.66,109.66a8,8,0,0,1-11.32-11.32Z" />
                    </svg>
                </button>
                <input
                    type='file'
                    ref={fileInputRef}
                    onChange={props.onImportJSON}
                    accept='.json'
                    style={{ display: 'none' }}
                    aria-hidden='true'
                />

                <button
                    className='help-button action-icon-button'
                    aria-label={props.labelSet.aboutKyos || 'How Kyos works'}
                    title={props.labelSet.aboutKyos || 'How Kyos works'}
                    onClick={props.onOpenAbout}
                    type='button'
                >
                    <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 256 256' fill='currentColor'>
                        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm12-40a12,12,0,1,1-12-12A12,12,0,0,1,140,176Zm-1.84-56.16A8,8,0,0,0,132,126.74V132a8,8,0,0,1-16,0v-5.26a24,24,0,0,1,18.49-23.41,12,12,0,1,0-13.63-12.75,8,8,0,0,1-16-.86,28,28,0,1,1,33.3,27.12Z" />
                    </svg>
                </button>

                <button
                    className='visibility-button action-icon-button'
                    aria-label={visibilityLabel}
                    title={visibilityLabel}
                    aria-pressed={!props.areValuesVisible}
                    onClick={props.onToggleValues}
                    type='button'
                >
                    <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 256 256' fill='currentColor'>
                        {props.areValuesVisible ? (
                            <path d='M128 56C63.3 56 16 128 16 128s47.3 72 112 72 112-72 112-72S192.7 56 128 56Zm0 120c-25.4 0-46-21.5-46-48s20.6-48 46-48 46 21.5 46 48-20.6 48-46 48Zm0-72a24 24 0 1 0 0 48 24 24 0 0 0 0-48Z'/>
                        ) : (
                            <path d='M53.9 39.6 216.4 202l-11.3 11.3-32.2-32.2A106.9 106.9 0 0 1 128 200c-64.7 0-112-72-112-72a196.7 196.7 0 0 1 42.8-48.7L42.6 50.9ZM128 80c-25.4 0-46 21.5-46 48a49.2 49.2 0 0 0 8.1 26.8l18.2-18.2A24 24 0 0 1 128 104c2.4 0 4.7.4 6.8 1l17.7-17.7A45.8 45.8 0 0 0 128 80Zm80.1 48s-11.8 18-31.3 34.3l-11.4-11.4A64.7 64.7 0 0 0 174 128c0-25.4-20.6-48-46-48-1.6 0-3.2.1-4.7.2l-14.7-14.7A93.1 93.1 0 0 1 128 56c64.7 0 112 72 112 72s-5.5 8.4-15.9 19.1L208.1 128Z'/>
                        )}
                    </svg>
                </button>

                <label className='language-select-wrap' aria-label={props.locale === 'pt' ? 'Selecionar idioma' : 'Select language'}>
                    <select
                        className='language-select'
                        value={props.locale}
                        onChange={(event) => props.onChangeLocale?.(event.target.value)}
                        aria-label={props.locale === 'pt' ? 'Selecionar idioma' : 'Select language'}
                    >
                        <option value='en'>English</option>
                        <option value='pt'>Português</option>
                    </select>
                </label>

                <button
                    type='button'
                    className='theme-toggle-btn action-icon-button'
                    aria-label={props.labelSet.toggleTheme}
                    title={props.labelSet.toggleTheme}
                    onClick={props.onToggleTheme}
                >
                    {props.isLightTheme ? (
                        <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 256 256' fill='currentColor'>
                            <path d='M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.34A88,88,0,0,1,65.66,67.11a89,89,0,0,1,31.4-26A106,106,0,0,0,96,56,104.11,104.11,0,0,0,200,160a106,106,0,0,0,14.92-1.06A89,89,0,0,1,188.9,190.34Z' />
                        </svg>
                    ) : (
                        <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 256 256' fill='currentColor'>
                            <path d='M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z' />
                        </svg>
                    )}
                </button>
            </div>
        </header>
    );
};

export default Header;