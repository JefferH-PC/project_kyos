
import BuyButton from '../BuyButton/BuyButton';
import RemoveButton from '../RemoveButton/RemoveButton';
import './ExpenseSlotReady.css';

const ExpenseSlotReady = (props) => {
    return (
        <div className={`expense-slot-ready ${props.position || ''}`}>
            <h3>{props.expenseName} - R$ {props.price}</h3>
            <div className='buttons-action'>
                <RemoveButton label={props.removeLabel} onClick={props.onRemove}></RemoveButton>
                <BuyButton label={props.buyLabel} onClick={props.onBuy}></BuyButton>
            </div>
        </div>
    );
}

export default ExpenseSlotReady;