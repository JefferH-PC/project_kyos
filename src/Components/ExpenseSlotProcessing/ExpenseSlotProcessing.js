import BuyButton from '../BuyButton/BuyButton';
import RemoveButton from '../RemoveButton/RemoveButton';
import ReturnButton from '../ReturnButton/ReturnButton';
import './ExpenseSlotProcessing.css';

const ExpenseSlotProcessing = (props) => {
    return (
        <div className={`expense-slot-processing ${props.position || ''}`}>
            <h3>{props.expenseName} - R$ {props.price} - {props.days} {props.daysLabel}</h3>
            <div className='buttons-action'>
                <RemoveButton label={props.removeLabel} onClick={props.onRemove}></RemoveButton>
                <ReturnButton label={props.returnLabel} onClick={props.onReturn}></ReturnButton>
                <BuyButton label={props.buyLabel} onClick={props.onBuy}></BuyButton>
            </div>
        </div>
    );
}

export default ExpenseSlotProcessing;