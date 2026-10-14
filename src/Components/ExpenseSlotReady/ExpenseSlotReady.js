
import BuyButton from '../BuyButton/BuyButton';
import RemoveButton from '../RemoveButton/RemoveButton';
import './ExpenseSlotReady.css';

const ExpenseSlotReady = (props) => {
    return (
        <div className={`expense-slot-ready ${props.position || ''}`}>
            <div className='slot-info'>
                <div className='slot-title-row'>
                    <strong className='slot-title'>{props.expenseName}</strong>
                    <span className='slot-days-pill ready'>✓ 100% Funded</span>
                </div>
                <div className='slot-amount-row'>
                    <span className='slot-price ready'>R$ {props.originalPrice || props.price}</span>
                </div>
                <div className='slot-progress-bar-wrap' role='progressbar' aria-valuenow='100' aria-valuemin='0' aria-valuemax='100'>
                    <div className='slot-progress-fill ready' style={{ width: '100%' }}></div>
                </div>
            </div>
            <div className='buttons-action'>
                <RemoveButton label={props.removeLabel} onClick={props.onRemove}></RemoveButton>
                <BuyButton label={props.buyLabel} onClick={props.onBuy}></BuyButton>
            </div>
        </div>
    );
}

export default ExpenseSlotReady;