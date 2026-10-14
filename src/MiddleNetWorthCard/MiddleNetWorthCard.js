import './MiddleNetWorthCard.css';

const MiddleNetWorthCard = (props) => {
    return (
        <div className='middle-net-worth'>
            <span className='net-worth-title'>{props.title}</span>
            <div className='net-worth-amount'>R$ {props.money}</div>
            <div className='net-worth-badge'>{props.investments} {props.investmentLabel}</div>
        </div>
    );
}

export default MiddleNetWorthCard;