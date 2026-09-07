import './MiddleNetWorthCard.css';

const MiddleNetWorthCard = (props) => {
    return (
        <div className='middle-net-worth'>
            <h2 className='net-worth-title'>{props.title}</h2>
            <h2>R${props.money}</h2>
            <h2>{props.investments} {props.investmentLabel}</h2>
        </div>
    );
}

export default MiddleNetWorthCard;