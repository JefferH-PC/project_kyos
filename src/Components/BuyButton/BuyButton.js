import './BuyButton.css';


const BuyButton = (props) => {
    return (
        <button className='buy-button' onClick={props.onClick} aria-label='Complete slot' type='button'>
            <svg className='buy' xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path></svg>
        </button>
    );
}

export default BuyButton;