import BuyButton from '../BuyButton/BuyButton';
import RemoveButton from '../RemoveButton/RemoveButton';
import ReturnButton from '../ReturnButton/ReturnButton';
import './ExpenseSlotProcessing.css';

const ExpenseSlotProcessing = (props) => {
    return (
        <div className={`expense-slot-processing ${props.position || ''}`}>
            <div className='slot-info'>
                <div className='slot-title-row'>
                    <strong className='slot-title'>{props.expenseName}</strong>
                    <span className='slot-days-pill active'>{props.days === '—' ? '—' : `${props.days} ${props.daysLabel}`}</span>
                </div>
                <div className='slot-amount-row'>
                    <span className='slot-price'>R$ {props.price}</span>
                    {props.hasProgress && (
                        <span className='slot-original-price'>R$ {props.originalPrice}</span>
                    )}
                </div>
                <div className='slot-progress-bar-wrap' role='progressbar' aria-valuenow={props.progressPercent} aria-valuemin='0' aria-valuemax='100'>
                    <div className='slot-progress-fill processing' style={{ width: `${Math.max(props.progressPercent, 4)}%` }}></div>
                </div>
            </div>
            <div className='buttons-action'>
                <RemoveButton label={props.removeLabel} onClick={props.onRemove}></RemoveButton>
                <ReturnButton label={props.returnLabel} onClick={props.onReturn}></ReturnButton>
                <BuyButton label={props.buyLabel} onClick={props.onBuy}></BuyButton>
            </div>
        </div>
    );
}

export default ExpenseSlotProcessing;