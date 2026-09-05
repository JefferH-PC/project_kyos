import './Header.css';

const Header = (props) => {
    return (
        <div className='header'> 
            <div className='logo'>
            <svg className='coin-icon' xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-68a28,28,0,0,1-28,28h-4v8a8,8,0,0,1-16,0v-8H104a8,8,0,0,1,0-16h36a12,12,0,0,0,0-24H116a28,28,0,0,1,0-56h4V72a8,8,0,0,1,16,0v8h16a8,8,0,0,1,0,16H116a12,12,0,0,0,0,24h24A28,28,0,0,1,168,148Z"></path></svg>
            <h1>Kyos</h1>
            </div>
            <div className='header-actions'>
                <button className='visibility-button' aria-label={props.areValuesVisible ? 'Hide money values' : 'Show money values'} aria-pressed={!props.areValuesVisible} onClick={props.onToggleValues} type='button'>
                    <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 256 256' fill='currentColor'>
                        {props.areValuesVisible ? (
                            <path d='M128 56C63.3 56 16 128 16 128s47.3 72 112 72 112-72 112-72S192.7 56 128 56Zm0 120c-25.4 0-46-21.5-46-48s20.6-48 46-48 46 21.5 46 48-20.6 48-46 48Zm0-72a24 24 0 1 0 0 48 24 24 0 0 0 0-48Z'/>
                        ) : (
                            <path d='M53.9 39.6 216.4 202l-11.3 11.3-32.2-32.2A106.9 106.9 0 0 1 128 200c-64.7 0-112-72-112-72a196.7 196.7 0 0 1 42.8-48.7L42.6 50.9ZM128 80c-25.4 0-46 21.5-46 48a49.2 49.2 0 0 0 8.1 26.8l18.2-18.2A24 24 0 0 1 128 104c2.4 0 4.7.4 6.8 1l17.7-17.7A45.8 45.8 0 0 0 128 80Zm80.1 48s-11.8 18-31.3 34.3l-11.4-11.4A64.7 64.7 0 0 0 174 128c0-25.4-20.6-48-46-48-1.6 0-3.2.1-4.7.2l-14.7-14.7A93.1 93.1 0 0 1 128 56c64.7 0 112 72 112 72s-5.5 8.4-15.9 19.1L208.1 128Z'/>
                        )}
                    </svg>
                </button>
                <button aria-label='Select language'>◎ English</button>
                <button aria-label='Toggle theme' onClick={props.onToggleTheme}>{props.isLightTheme ? '☾' : '☼'}</button>
            </div>
        </div>
    )
}

export default Header;