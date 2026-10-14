import BuyButton from '../BuyButton/BuyButton';
import RemoveButton from '../RemoveButton/RemoveButton';
import UpdateButton from '../UpdateButton/UpdateButton';
import './ExpenseSlot.css';

const ExpenseSlot = (props) => {
    return (
        <div className={`expense-slot ${props.position || ''}`}>
            <div className='slot-info'>
                <div className='slot-title-row'>
                    <strong className='slot-title'>{props.expenseName}</strong>
                    <span className='slot-days-pill'>{props.days} {props.daysLabel}</span>
                </div>
                <div className='slot-amount-row'>
                    <span className='slot-price'>R$ {props.price}</span>
                    {props.hasProgress && (
                        <span className='slot-original-price'>R$ {props.originalPrice}</span>
                    )}
                </div>
                {props.hasProgress && (
                    <div className='slot-progress-bar-wrap' role='progressbar' aria-valuenow={props.progressPercent} aria-valuemin='0' aria-valuemax='100'>
                        <div className='slot-progress-fill' style={{ width: `${props.progressPercent}%` }}></div>
                    </div>
                )}
            </div>
            <div className='buttons-action'>
                <RemoveButton label={props.removeLabel} onClick={props.onRemove}></RemoveButton>
                <UpdateButton label={props.updateLabel} onClick={props.onUpdate}></UpdateButton>
                <BuyButton label={props.buyLabel} onClick={props.onBuy}></BuyButton>
            </div>
        </div>
    );
}

export default ExpenseSlot;